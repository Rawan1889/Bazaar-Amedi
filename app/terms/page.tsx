import type { Metadata } from 'next'
import { LegalPage } from '@/app/components/legal-page'

export const metadata: Metadata = { title: 'Terms of Use', alternates: { canonical: '/terms' } }

export default function TermsPage() {
  return <LegalPage doc="terms" />
}
