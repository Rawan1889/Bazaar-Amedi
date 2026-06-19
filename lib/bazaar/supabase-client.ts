import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function createBazaarClient() {
  if (client) return client
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_BAZAAR_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_BAZAAR_SUPABASE_ANON_KEY!,
  )
  return client
}
