import { buildOtpMessage, verifyHookSignature } from '@/lib/bazaar/whatsapp-otp'

// Supabase Auth → Hooks → "Send SMS hook" (HTTPS) points here.
// Env (set in Vercel): SUPABASE_SMS_HOOK_SECRET, WHATSAPP_PHONE_NUMBER_ID,
// WHATSAPP_ACCESS_TOKEN, optional WHATSAPP_OTP_TEMPLATE / WHATSAPP_OTP_LANG.

function fail(status: number, message: string) {
  return Response.json({ error: { http_code: status, message } }, { status })
}

export async function POST(req: Request) {
  const body = await req.text()
  const ok = verifyHookSignature(body, {
    id: req.headers.get('webhook-id'),
    timestamp: req.headers.get('webhook-timestamp'),
    signature: req.headers.get('webhook-signature'),
  }, process.env.SUPABASE_SMS_HOOK_SECRET ?? '')
  if (!ok) return fail(401, 'Invalid signature')

  let phone: string | undefined
  let otp: string | undefined
  try {
    const payload = JSON.parse(body)
    phone = payload?.user?.phone
    otp = payload?.sms?.otp
  } catch { /* handled below */ }
  if (!phone || !otp) return fail(400, 'Missing phone or code')

  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  if (!phoneId || !token) return fail(500, 'WhatsApp is not configured')

  const message = buildOtpMessage(
    phone,
    otp,
    process.env.WHATSAPP_OTP_TEMPLATE || 'kela_login_code',
    process.env.WHATSAPP_OTP_LANG || 'ar',
  )

  try {
    const res = await fetch(`https://graph.facebook.com/v25.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    })
    if (!res.ok) {
      const detail = await res.json().catch(() => null)
      console.error('[send-sms-hook] WhatsApp send failed', res.status, detail?.error?.message)
      return fail(502, 'Could not send the code on WhatsApp. Please try again.')
    }
  } catch (e) {
    console.error('[send-sms-hook] WhatsApp request error', e)
    return fail(502, 'Could not send the code on WhatsApp. Please try again.')
  }

  return new Response(null, { status: 200 })
}
