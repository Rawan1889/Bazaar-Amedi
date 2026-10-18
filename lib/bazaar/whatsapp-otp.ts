import { createHmac, timingSafeEqual } from 'node:crypto'

// Login codes go out over WhatsApp instead of SMS. Supabase Auth calls our
// "Send SMS hook" with the code; we pass it to the WhatsApp Cloud API as an
// approved authentication template.

const TOLERANCE_SECONDS = 5 * 60

// Supabase signs hook calls with the Standard Webhooks scheme. The secret is
// shown in the dashboard as "v1,whsec_<base64>".
export function verifyHookSignature(
  body: string,
  headers: { id: string | null; timestamp: string | null; signature: string | null },
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  const { id, timestamp, signature } = headers
  if (!id || !timestamp || !signature || !secret) return false
  const ts = Number(timestamp)
  if (!Number.isFinite(ts) || Math.abs(nowSeconds - ts) > TOLERANCE_SECONDS) return false

  const key = Buffer.from(secret.replace(/^v1,whsec_/, '').replace(/^whsec_/, ''), 'base64')
  const expected = createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest()

  // The header can hold several space-separated "v1,<base64>" signatures.
  return signature.split(' ').some(part => {
    const [version, sig] = part.split(',')
    if (version !== 'v1' || !sig) return false
    const got = Buffer.from(sig, 'base64')
    return got.length === expected.length && timingSafeEqual(got, expected)
  })
}

// WhatsApp wants the number as digits with country code, no "+".
export function whatsappRecipient(phone: string): string {
  return phone.replace(/[^\d]/g, '')
}

// Authentication templates with a "copy code" button need the code twice:
// once for the body text and once for the button.
export function buildOtpMessage(phone: string, otp: string, template: string, language: string) {
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: whatsappRecipient(phone),
    type: 'template',
    template: {
      name: template,
      language: { code: language },
      components: [
        { type: 'body', parameters: [{ type: 'text', text: otp }] },
        { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: otp }] },
      ],
    },
  }
}
