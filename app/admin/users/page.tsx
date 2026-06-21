import { getAllUsers } from '@/lib/bazaar/admin-actions'
import { UserList } from './user-list'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const users = await getAllUsers()
  return (
    <div>
      <h1
        className="font-[family-name:var(--font-dm-sans)] text-[24px] font-medium mb-1"
        style={{ color: '#1E1C19' }}
      >
        Users
      </h1>
      <p className="font-[family-name:var(--font-dm-sans)] text-[14px] mb-6" style={{ color: '#7A756E' }}>
        {users.length} total — manage customers, drivers, and market owners
      </p>
      <UserList users={users} />
    </div>
  )
}
