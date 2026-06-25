# Phase 13 — Phone/SMS OTP login setup (Gap 6)

The phone-OTP login UI is built and live on `/login` ("or → phone number").
The code calls Supabase phone auth:

- `supabase.auth.signInWithOtp({ phone })` → sends the SMS code
- `supabase.auth.verifyOtp({ phone, token, type: 'sms' })` → verifies it
- then `ensureBazaarProfile()` creates a customer profile for new phone users

**This will not send real SMS until you configure an SMS provider in the
Supabase dashboard.** There is no SQL migration for this gap — it's dashboard
config only.

## One-time setup in the Bazaar Supabase project

1. **Authentication → Providers → Phone**: toggle **Enable Phone provider** on.
2. Choose an SMS provider and enter its credentials:
   - **Twilio** (most common): Account SID, Auth Token, and a Twilio Message
     Service SID or phone number. Twilio supports Iraq (+964).
   - Alternatives: MessageBird, Vonage, Textlocal.
3. **Authentication → Providers → Phone → OTP expiry**: leave default (e.g. 60s)
   or raise to ~300s for slower networks.
4. (Optional) **Authentication → Rate limits**: set a sane SMS send limit to
   avoid abuse / runaway SMS cost.
5. Save. Phone login now sends real codes.

## Notes
- Numbers are normalised to E.164 as `+964` + the local number (a leading 0 is
  stripped). The country code prefix is fixed to Iraq in `phone-login.tsx`.
- New phone users are created as **customers** (auto-approved) and asked for
  their name once. Market owners / drivers still register via the email signup
  flow with role selection.
- Cost: each SMS is billed by the provider (Twilio ≈ a few cents per message to
  Iraq). Keep the rate limit in mind before launch.
