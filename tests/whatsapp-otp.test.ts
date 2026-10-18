import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { buildOtpMessage, verifyHookSignature, whatsappRecipient } from '@/lib/bazaar/whatsapp-otp'

const rawKey = Buffer.from('test-hook-key-not-a-real-secret')
const secret = `v1,whsec_${rawKey.toString('base64')}`

function sign(id: string, ts: string, body: string) {
  return 'v1,' + createHmac('sha256', rawKey).update(`${id}.${ts}.${body}`).digest('base64')
}

describe('verifyHookSignature', () => {
  const body = '{"user":{"phone":"+9647501234567"},"sms":{"otp":"123456"}}'
  const now = 1_800_000_000
  const ts = String(now)

  it('accepts a valid signature', () => {
    expect(verifyHookSignature(body, { id: 'msg_1', timestamp: ts, signature: sign('msg_1', ts, body) }, secret, now)).toBe(true)
  })

  it('accepts when one of several signatures matches', () => {
    const sig = `v1,AAAA ${sign('msg_1', ts, body)}`
    expect(verifyHookSignature(body, { id: 'msg_1', timestamp: ts, signature: sig }, secret, now)).toBe(true)
  })

  it('rejects a tampered body', () => {
    expect(verifyHookSignature(body + ' ', { id: 'msg_1', timestamp: ts, signature: sign('msg_1', ts, body) }, secret, now)).toBe(false)
  })

  it('rejects an old timestamp', () => {
    expect(verifyHookSignature(body, { id: 'msg_1', timestamp: ts, signature: sign('msg_1', ts, body) }, secret, now + 600)).toBe(false)
  })

  it('rejects missing headers or secret', () => {
    expect(verifyHookSignature(body, { id: null, timestamp: ts, signature: sign('msg_1', ts, body) }, secret, now)).toBe(false)
    expect(verifyHookSignature(body, { id: 'msg_1', timestamp: ts, signature: sign('msg_1', ts, body) }, '', now)).toBe(false)
  })
})

describe('buildOtpMessage', () => {
  it('strips the plus and puts the code in body and button', () => {
    expect(whatsappRecipient('+964 750 123 4567')).toBe('9647501234567')
    const m = buildOtpMessage('+9647501234567', '654321', 'kela_login_code', 'ar')
    expect(m.to).toBe('9647501234567')
    expect(m.template.language.code).toBe('ar')
    expect(m.template.components[0].parameters[0].text).toBe('654321')
    expect(m.template.components[1]).toMatchObject({ type: 'button', sub_type: 'url', index: '0' })
    expect(m.template.components[1].parameters[0].text).toBe('654321')
  })
})
