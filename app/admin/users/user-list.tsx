'use client'

import { useTransition, useState } from 'react'
import { suspendUser, unsuspendUser, approveDriver, changeUserRole } from '@/lib/bazaar/admin-actions'
import { ClientDate } from '@/app/components/client-date'

const c = {
  green:    '#2D8A5E',
  greenBg:  'rgba(45,138,94,0.08)',
  terra:    '#C4654A',
  terraBg:  'rgba(196,101,74,0.08)',
  saffron:  '#E8A838',
  saffBg:   'rgba(232,168,56,0.10)',
  charcoal: '#1E1C19',
  stone:    '#7A756E',
  cream:    '#F2EFEA',
  cream2:   '#E8E4DE',
  white:    '#FFFFFF',
} as const

const ROLE_META: Record<string, { label: string; color: string; bg: string }> = {
  customer:     { label: 'Customer',     color: c.green,    bg: c.greenBg },
  driver:       { label: 'Driver',       color: c.saffron,  bg: c.saffBg  },
  market_admin: { label: 'Market Owner', color: c.terra,    bg: c.terraBg },
  super_admin:  { label: 'Super Admin',  color: c.charcoal, bg: c.cream   },
}

type User = {
  id: string
  full_name: string
  phone: string | null
  role: string
  neighborhood: string | null
  is_suspended: boolean
  is_approved: boolean
  is_online: boolean
  created_at: string
}

function UserRow({ user }: { user: User }) {
  const [pending, startTransition] = useTransition()
  const role = ROLE_META[user.role] ?? { label: user.role, color: c.stone, bg: c.cream }

  return (
    <>
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-[family-name:var(--font-dm-sans)] text-[12px] font-medium flex-shrink-0"
            style={{ background: role.bg, color: role.color }}
          >
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium" style={{ color: c.charcoal }}>
                {user.full_name}
              </span>
              {/* Online dot — only shown for drivers */}
              {user.role === 'driver' && (
                <span
                  title={user.is_online ? 'Online' : 'Offline'}
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: user.is_online ? c.green : c.cream2 }}
                />
              )}
            </div>
            <div className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>
              {user.phone ?? '—'}
            </div>
          </div>
        </div>
      </td>

      <td className="py-3 px-4">
        <span
          className="px-2.5 py-1 rounded-[6px] font-[family-name:var(--font-dm-mono)] text-[10px] font-medium"
          style={{ background: role.bg, color: role.color }}
        >
          {role.label}
        </span>
      </td>

      <td className="py-3 px-4">
        {user.is_suspended ? (
          <span className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.terra }}>Suspended</span>
        ) : user.role === 'driver' && !user.is_approved ? (
          <span className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.saffron }}>Pending approval</span>
        ) : (
          <span className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.green }}>Active</span>
        )}
      </td>

      <td className="py-3 px-4">
        <div className="flex items-center gap-2 flex-wrap">
          {user.role === 'driver' && !user.is_approved && !user.is_suspended && (
            <button
              disabled={pending}
              onClick={() => startTransition(() => approveDriver(user.id))}
              className="px-3 py-1.5 rounded-[6px] font-[family-name:var(--font-dm-sans)] text-[11px] font-medium border-none cursor-pointer"
              style={{ background: c.green, color: '#fff', opacity: pending ? 0.6 : 1 }}
            >
              Approve
            </button>
          )}

          {user.role !== 'super_admin' && (
            user.is_suspended ? (
              <button
                disabled={pending}
                onClick={() => startTransition(() => unsuspendUser(user.id))}
                className="px-3 py-1.5 rounded-[6px] font-[family-name:var(--font-dm-sans)] text-[11px] font-medium border-none cursor-pointer"
                style={{ background: c.greenBg, color: c.green, opacity: pending ? 0.6 : 1 }}
              >
                Unsuspend
              </button>
            ) : (
              <button
                disabled={pending}
                onClick={() => startTransition(() => suspendUser(user.id))}
                className="px-3 py-1.5 rounded-[6px] font-[family-name:var(--font-dm-sans)] text-[11px] font-medium border-none cursor-pointer"
                style={{ background: c.terraBg, color: c.terra, opacity: pending ? 0.6 : 1 }}
              >
                Suspend
              </button>
            )
          )}

          {user.role !== 'super_admin' && (
            <select
              defaultValue={user.role}
              disabled={pending}
              onChange={e => startTransition(() => changeUserRole(user.id, e.target.value))}
              className="px-2 py-1.5 rounded-[6px] font-[family-name:var(--font-dm-sans)] text-[11px] border cursor-pointer outline-none"
              style={{ borderColor: c.cream2, color: c.stone, background: c.white }}
            >
              <option value="customer">Customer</option>
              <option value="driver">Driver</option>
              <option value="market_admin">Market Owner</option>
            </select>
          )}
        </div>
      </td>

      <td className="py-3 px-4 font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>
        <ClientDate date={user.created_at} format="long-date" />
      </td>
    </>
  )
}

const FILTERS = [
  { key: 'all',          label: 'All' },
  { key: 'customer',     label: 'Customers' },
  { key: 'driver',       label: 'Drivers' },
  { key: 'market_admin', label: 'Market Owners' },
]

export function UserList({ users }: { users: User[] }) {
  const [filter, setFilter] = useState('all')
  const visible = filter === 'all' ? users : users.filter(u => u.role === filter)

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {FILTERS.map(f => {
          const count = f.key === 'all' ? users.length : users.filter(u => u.role === f.key).length
          const active = filter === f.key
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="px-4 py-2 rounded-[8px] font-[family-name:var(--font-dm-sans)] text-[13px] border-none cursor-pointer transition-all duration-150"
              style={{
                background: active ? c.green : c.cream,
                color: active ? '#fff' : c.stone,
                fontWeight: active ? 500 : 400,
              }}
            >
              {f.label} <span style={{ opacity: 0.7 }}>({count})</span>
            </button>
          )
        })}
      </div>

    <div className="rounded-[14px] overflow-hidden" style={{ border: `1px solid ${c.cream2}`, background: c.white }}>
      <table className="w-full" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${c.cream2}`, background: c.cream }}>
            {['Name', 'Role', 'Status', 'Actions', 'Joined'].map(h => (
              <th key={h} className="py-2.5 px-4 text-left font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.08em] uppercase" style={{ color: c.stone }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map(u => (
            <tr key={u.id} style={{ borderBottom: `1px solid ${c.cream2}` }}>
              <UserRow user={u} />
            </tr>
          ))}
        </tbody>
      </table>

      {visible.length === 0 && (
        <div className="text-center py-12 font-[family-name:var(--font-dm-sans)] text-[14px]" style={{ color: c.stone }}>
          No {filter === 'all' ? 'users' : FILTERS.find(f => f.key === filter)?.label.toLowerCase()} yet
        </div>
      )}
    </div>
    </div>
  )
}
