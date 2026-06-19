import { createServerClient, type CookieMethodsServer } from '@supabase/ssr'
import { cookies } from 'next/headers'

function cookieMethods(): CookieMethodsServer {
  let store: Awaited<ReturnType<typeof cookies>>
  const getStore = async () => {
    if (!store) store = await cookies()
    return store
  }
  return {
    async getAll() { return (await getStore()).getAll() },
    async setAll(cookiesToSet) {
      try {
        const s = await getStore()
        cookiesToSet.forEach(({ name, value, options }) => s.set(name, value, options))
      } catch {}
    },
  }
}

export async function createBazaarServer() {
  return createServerClient(
    process.env.NEXT_PUBLIC_BAZAAR_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_BAZAAR_SUPABASE_ANON_KEY!,
    { cookies: cookieMethods() },
  )
}

export async function createBazaarAdmin() {
  return createServerClient(
    process.env.NEXT_PUBLIC_BAZAAR_SUPABASE_URL!,
    process.env.BAZAAR_SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: cookieMethods() },
  )
}
