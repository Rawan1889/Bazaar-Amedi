export const dynamic = 'force-dynamic'
import { getProfile } from '@/lib/bazaar/profile-actions'
import { getAddresses } from '@/lib/bazaar/address-actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ProfileForm } from './profile-form'
import { AddressManager } from '@/app/components/address-manager'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream:    '#F2EFEA',
  cream2:   '#E8E4DE',
  bg:       '#FAFAF7',
  white:    '#FFFFFF',
} as const

export default async function ProfilePage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const addresses = profile.role === 'customer' || profile.role === 'super_admin'
    ? await getAddresses()
    : []

  const roleBadge: Record<string, string> = {
    customer: 'Customer',
    market_admin: 'Shop Owner',
    driver: 'Driver',
    super_admin: 'Admin',
  }

  return (
    <div className="min-h-[100dvh] pb-20 md:pb-0" style={{ background: c.bg }}>
      <nav className="sticky top-0 z-10 px-6 py-4" style={{ background: 'rgba(250,250,247,0.9)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${c.cream2}` }}>
        <div className="max-w-[600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="no-underline">
              <span className="font-[family-name:var(--font-dm-sans)] text-[20px] font-medium" style={{ color: c.charcoal }}>
                bazaar<span style={{ color: c.green }}>.</span>
              </span>
            </Link>
            <span style={{ color: c.cream2 }}>/</span>
            <span className="font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ color: c.stone }}>Profile</span>
          </div>
          <Link href="/browse" className="font-[family-name:var(--font-dm-sans)] text-[13px] no-underline" style={{ color: c.green }}>
            Browse
          </Link>
        </div>
      </nav>

      <div className="max-w-[600px] mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: c.greenBg }}
          >
            <span className="font-[family-name:var(--font-dm-sans)] text-[24px] font-medium" style={{ color: c.green }}>
              {profile.full_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-dm-sans)] text-[24px] font-medium" style={{ color: c.charcoal }}>
              {profile.full_name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="px-2 py-0.5 rounded-[4px] font-[family-name:var(--font-dm-mono)] text-[10px] font-medium"
                style={{ background: c.greenBg, color: c.green }}
              >
                {roleBadge[profile.role] || profile.role}
              </span>
              {profile.email && (
                <span className="font-[family-name:var(--font-dm-sans)] text-[12px]" style={{ color: c.stone }}>
                  {profile.email}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-[14px] p-6" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
          <h2 className="font-[family-name:var(--font-dm-sans)] text-[16px] font-medium mb-5" style={{ color: c.charcoal }}>
            Edit profile
          </h2>
          <ProfileForm profile={profile} />
        </div>

        {(profile.role === 'customer' || profile.role === 'super_admin') && (
          <div className="mt-6 rounded-[14px] p-6" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
            <AddressManager addresses={addresses} />
          </div>
        )}

        <div className="mt-6 rounded-[14px] p-5" style={{ background: c.white, border: `1px solid ${c.cream2}` }}>
          <h3 className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium mb-3" style={{ color: c.charcoal }}>
            Account info
          </h3>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between font-[family-name:var(--font-dm-sans)] text-[13px]">
              <span style={{ color: c.stone }}>Member since</span>
              <span style={{ color: c.charcoal }}>
                {new Date(profile.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="flex justify-between font-[family-name:var(--font-dm-sans)] text-[13px]">
              <span style={{ color: c.stone }}>Role</span>
              <span style={{ color: c.charcoal }}>{roleBadge[profile.role] || profile.role}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
