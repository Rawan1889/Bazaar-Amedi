'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { assignOrderToDriver, approveFleetDriver, removeFleetDriver, uploadFleetLogo } from '@/lib/bazaar/fleet-actions'
import { uploadImageFile } from '@/lib/bazaar/upload-client'
import { useRealtimeAvailableOrders } from '@/lib/bazaar/use-realtime-orders'

interface Driver { id: string; full_name: string; phone: string; is_online: boolean; is_approved: boolean; is_suspended: boolean }
interface Order {
  id: string; order_number: number; status: string; total: number; delivery_address: string
  driver_id?: string | null
  bazaar_order_items?: { bazaar_shops: { name: string } | null }[]
}

const iqd = (n: number) => `${Number(n).toLocaleString('en-US')} IQD`

export function FleetBoard({ fleet, drivers, available, active }: {
  fleet: { id: string; name: string; logo_url?: string | null }; drivers: Driver[]; available: Order[]; active: Order[]
}) {
  const [error, setError] = useState<string | null>(null)
  useRealtimeAvailableOrders(true)

  const ready = available.filter(o => o.status === 'ready')
  const preparing = available.filter(o => o.status === 'confirmed')
  const team = drivers.filter(d => d.is_approved && !d.is_suspended)
  const waiting = drivers.filter(d => !d.is_approved && !d.is_suspended)
  const nameOf = (id?: string | null) => drivers.find(d => d.id === id)?.full_name ?? '—'

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center gap-4">
        <FleetLogo name={fleet.name} url={fleet.logo_url ?? null} onError={setError} />
        <div className="min-w-0">
        <h1 className="text-[28px] font-medium tracking-tight">{fleet.name}</h1>
        <p className="text-[14px] text-[#716C66] mt-1">
          {ready.length} ready to assign · {active.length} on the road · {team.filter(d => d.is_online).length}/{team.length} drivers online
        </p>
        </div>
      </div>

      {error && (
        <div className="rounded-[10px] px-4 py-3 text-[13px] bg-[#C94A3A]/10 text-[#C94A3A] flex justify-between gap-3">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="bg-transparent border-none cursor-pointer text-[#C94A3A]">×</button>
        </div>
      )}

      <Section title="Ready to assign" hint="Pick a driver and tap Assign. The first company or driver to take an order gets it.">
        {ready.length === 0 ? <Empty text="No orders ready right now." /> : (
          <Table head={['Order', 'Shops', 'Address', 'Total', 'Driver']}>
            {ready.map(o => <ReadyRow key={o.id} order={o} drivers={team} onError={setError} />)}
          </Table>
        )}
      </Section>

      {preparing.length > 0 && (
        <Section title="Being prepared" hint="These become assignable when every shop marks them ready.">
          <Table head={['Order', 'Shops', 'Address', 'Total']}>
            {preparing.map(o => (
              <tr key={o.id} className="border-t border-[#E8E4DE]">
                <Td mono>#{o.order_number}</Td><Td>{shops(o)}</Td><Td>{o.delivery_address}</Td><Td mono>{iqd(o.total)}</Td>
              </tr>
            ))}
          </Table>
        </Section>
      )}

      <Section title="On the road">
        {active.length === 0 ? <Empty text="No active deliveries." /> : (
          <Table head={['Order', 'Driver', 'Status', 'Address']}>
            {active.map(o => (
              <tr key={o.id} className="border-t border-[#E8E4DE]">
                <Td mono>#{o.order_number}</Td><Td>{nameOf(o.driver_id)}</Td>
                <Td>{o.status === 'picking_up' ? 'Picking up' : 'Delivering'}</Td><Td>{o.delivery_address}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Section>

      <Section title="Drivers" hint="Drivers join by choosing your company when they sign up.">
        {drivers.length === 0 ? <Empty text="No drivers yet. Ask your drivers to sign up on kela.live and choose your company." /> : (
          <Table head={['Name', 'Phone', 'Status', '']}>
            {[...waiting, ...team].map(d => <DriverRow key={d.id} driver={d} onError={setError} />)}
          </Table>
        )}
      </Section>
    </div>
  )
}

function FleetLogo({ name, url, onError }: { name: string; url: string | null; onError: (m: string) => void }) {
  const [src, setSrc] = useState(url)
  const [uploading, setUploading] = useState(false)
  const router = useRouter()

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    const r = await uploadImageFile(file, uploadFleetLogo)
    setUploading(false)
    if (r.error) onError(r.error)
    else if (r.url) { setSrc(r.url); router.refresh() }
  }

  return (
    <label className="relative shrink-0 w-16 h-16 rounded-[16px] overflow-hidden border border-[#E8E4DE] bg-white cursor-pointer flex items-center justify-center group" title="Change logo">
      {src
        ? <img src={src} alt={name} className="w-full h-full object-cover" />
        : <span className="text-[22px] font-medium text-[#287A53]">{name.charAt(0).toUpperCase()}</span>}
      <span className={`absolute inset-0 flex items-center justify-center bg-[#1E1C19]/55 text-white text-[11px] transition-opacity ${uploading || !src ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        {uploading ? 'Uploading...' : src ? 'Change' : 'Add logo'}
      </span>
      <input type="file" accept="image/*" className="hidden" onChange={onPick} disabled={uploading} />
    </label>
  )
}

function shops(o: Order) {
  return [...new Set((o.bazaar_order_items ?? []).map(i => i.bazaar_shops?.name).filter(Boolean))].join(' + ')
}

function ReadyRow({ order, drivers, onError }: { order: Order; drivers: Driver[]; onError: (m: string) => void }) {
  const online = drivers.filter(d => d.is_online)
  const [driverId, setDriverId] = useState(online[0]?.id ?? drivers[0]?.id ?? '')
  const [pending, start] = useTransition()
  const router = useRouter()

  return (
    <tr className="border-t border-[#E8E4DE]">
      <Td mono>#{order.order_number}</Td><Td>{shops(order)}</Td><Td>{order.delivery_address}</Td><Td mono>{iqd(order.total)}</Td>
      <Td>
        {drivers.length === 0 ? <span className="text-[#716C66]">No approved drivers</span> : (
          <div className="flex gap-2 min-w-[220px]">
            <select value={driverId} onChange={e => setDriverId(e.target.value)}
              className="flex-1 rounded-[8px] border border-[#E8E4DE] bg-white px-2 py-1.5 text-[13px]">
              {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}{d.is_online ? ' ●' : ' (offline)'}</option>)}
            </select>
            <button disabled={pending || !driverId}
              onClick={() => start(async () => {
                const r = await assignOrderToDriver(order.id, driverId)
                if (r?.error) onError(r.error); else router.refresh()
              })}
              className="rounded-[8px] bg-[#287A53] text-white px-3 py-1.5 text-[13px] border-none cursor-pointer disabled:opacity-60">
              {pending ? '...' : 'Assign'}
            </button>
          </div>
        )}
      </Td>
    </tr>
  )
}

function DriverRow({ driver, onError }: { driver: Driver; onError: (m: string) => void }) {
  const [pending, start] = useTransition()
  const router = useRouter()
  const run = (fn: () => Promise<{ error?: string } | undefined>) => start(async () => {
    const r = await fn(); if (r?.error) onError(r.error); else router.refresh()
  })
  return (
    <tr className="border-t border-[#E8E4DE]">
      <Td>{driver.full_name}</Td>
      <Td mono><span dir="ltr">{driver.phone}</span></Td>
      <Td>{!driver.is_approved ? <span className="text-[#C4654A]">Waiting for you</span> : driver.is_online ? <span className="text-[#287A53]">Online</span> : <span className="text-[#716C66]">Offline</span>}</Td>
      <Td>
        <div className="flex gap-3 justify-end">
          {!driver.is_approved && (
            <button disabled={pending} onClick={() => run(() => approveFleetDriver(driver.id))}
              className="bg-transparent border-none cursor-pointer text-[13px] text-[#287A53] font-medium">Approve</button>
          )}
          <button disabled={pending} onClick={() => { if (confirm(`Remove ${driver.full_name} from your company?`)) run(() => removeFleetDriver(driver.id)) }}
            className="bg-transparent border-none cursor-pointer text-[13px] text-[#C94A3A]">Remove</button>
        </div>
      </Td>
    </tr>
  )
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[18px] font-medium">{title}</h2>
      {hint && <p className="text-[13px] text-[#716C66] mt-1">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-[14px] border border-[#E8E4DE] bg-white">
      <table className="w-full text-[13px] text-start">
        <thead>
          <tr className="text-[10px] uppercase tracking-[0.1em] text-[#716C66] font-[family-name:var(--font-dm-mono)]">
            {head.map(h => <th key={h} className="px-4 py-3 font-normal text-start">{h}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return <td className={`px-4 py-3 align-middle ${mono ? 'font-[family-name:var(--font-dm-mono)] whitespace-nowrap' : ''}`}>{children}</td>
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-[14px] border border-dashed border-[#E8E4DE] p-6 text-center text-[13px] text-[#716C66]">{text}</div>
}
