import { redirect } from 'next/navigation'

// The shared /profile page renders correctly for every role (customer, driver,
// shop owner, admin). Driver nav historically pointed to /driver/profile so
// redirect here rather than duplicating the profile UI.
export default function DriverProfilePage() {
  redirect('/profile')
}
