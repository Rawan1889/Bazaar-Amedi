import type { Metadata } from 'next'
import { LegalPage } from '@/app/components/legal-page'

export const metadata: Metadata = { title: 'Privacy Policy', alternates: { canonical: '/privacy' } }

export default function PrivacyPage() {
  return <LegalPage doc="privacy" />
}
