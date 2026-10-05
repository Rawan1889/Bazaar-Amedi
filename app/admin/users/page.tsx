import { getAllUsers } from '@/lib/bazaar/admin-actions'
import { UserList } from './user-list'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const users = await getAllUsers()
  const pendingCount = users.filter(
    (u: { role: string; is_approved: boolean; is_suspended: boolean }) =>
      (u.role === 'customer' || u.role === 'driver' || u.role === 'fleet_manager') && !u.is_approved && !u.is_suspended,
  ).length
  return (
    <div>
      <h1
        className="font-[family-name:var(--font-dm-sans)] text-[24px] font-medium mb-1"
        style={{ color: '#1E1C19' }}
      >
        Users
      </h1>
      <p className="font-[family-name:var(--font-dm-sans)] text-[14px] mb-6" style={{ color: '#716C66' }}>
        {users.length} total — manage customers, drivers, and market owners
        {pendingCount > 0 && (
          <span className="ms-2 px-2 py-0.5 rounded-[6px] font-[family-name:var(--font-dm-mono)] text-[11px]" style={{ background: 'rgba(232,168,56,0.10)', color: '#8D6514' }}>
            {pendingCount} waiting for approval
          </span>
        )}
      </p>
      <UserList users={users} />
    </div>
  )
}
