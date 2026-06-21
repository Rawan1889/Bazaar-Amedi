'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createBazaarClient } from '@/lib/bazaar/supabase-client'

const c = {
  green:      '#2D8A5E',
  greenHover: '#247A51',
  greenBg:    'rgba(45,138,94,0.08)',
  greenBord:  'rgba(45,138,94,0.2)',
  terra:      '#C4654A',
  terraBg:    'rgba(196,101,74,0.08)',
  terraBord:  'rgba(196,101,74,0.2)',
  saffron:    '#E8A838',
  saffronBg:  'rgba(232,168,56,0.1)',
  saffronBord:'rgba(232,168,56,0.25)',
  charcoal:   '#1E1C19',
  stone:      '#7A756E',
  stoneLight: '#9A958E',
  cream:      '#F2EFEA',
  cream2:     '#E8E4DE',
  bg:         '#FAFAF7',
  white:      '#FFFFFF',
} as const

function Nav() {
  const [open, setOpen] = useState(false)
  const [userInfo, setUserInfo] = useState<{ role: string; name: string } | null>(null)

  useEffect(() => {
    const supabase = createBazaarClient()
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return
      const { data: profile } = await supabase
        .from('bazaar_profiles')
        .select('role, full_name')
        .eq('id', data.session.user.id)
        .single()
      if (profile) setUserInfo({ role: profile.role, name: profile.full_name })
    })
  }, [])

  const dashboardLink = userInfo
    ? userInfo.role === 'market_admin' ? '/shop'
    : userInfo.role === 'super_admin' ? '/admin'
    : userInfo.role === 'driver' ? '/driver'
    : '/browse'
    : null

  const dashboardLabel = userInfo
    ? userInfo.role === 'market_admin' ? 'My shop'
    : userInfo.role === 'super_admin' ? 'Admin panel'
    : userInfo.role === 'driver' ? 'My deliveries'
    : 'Browse markets'
    : null

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-30 transition-all duration-300"
      style={{
        background: 'rgba(250,250,247,0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${c.cream2}`,
      }}
    >
      <div className="max-w-[1200px] mx-auto px-6 md:px-10 flex items-center justify-between h-[64px]">
        <a href="/" className="no-underline flex items-center gap-1">
          <span
            className="font-[family-name:var(--font-dm-sans)] text-[22px] font-medium"
            style={{ color: c.charcoal, letterSpacing: '-0.02em' }}
          >
            bazaar<span style={{ color: c.green }}>.</span>
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {['How it works', 'Markets', 'Flash Sales', 'Deliver with us'].map(item => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/ /g, '-')}`}
              className="font-[family-name:var(--font-dm-sans)] text-[14px] no-underline transition-colors duration-200"
              style={{ color: c.stone }}
              onMouseEnter={e => (e.currentTarget.style.color = c.charcoal)}
              onMouseLeave={e => (e.currentTarget.style.color = c.stone)}
            >
              {item}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {userInfo && dashboardLink ? (
            <a
              href={dashboardLink}
              className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium no-underline px-5 py-2.5 rounded-[8px] transition-all duration-200"
              style={{ color: '#fff', background: c.green }}
              onMouseEnter={e => { e.currentTarget.style.background = c.greenHover; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = c.green; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {dashboardLabel}
            </a>
          ) : (<>
          <a
            href="/login"
            className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium no-underline px-5 py-2.5 rounded-[8px] transition-all duration-200"
            style={{ color: c.green, background: c.greenBg }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(45,138,94,0.14)')}
            onMouseLeave={e => (e.currentTarget.style.background = c.greenBg)}
          >
            Sign in
          </a>
          <a
            href="/signup"
            className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium no-underline px-5 py-2.5 rounded-[8px] transition-all duration-200"
            style={{ color: '#fff', background: c.green }}
            onMouseEnter={e => { e.currentTarget.style.background = c.greenHover; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = c.green; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            Get started
          </a>
          </>)}
        </div>

        <button
          className="md:hidden flex flex-col gap-[5px] p-2 bg-transparent border-none cursor-pointer"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <span className="block w-5 h-[1.5px] rounded-full transition-all duration-200" style={{ background: c.charcoal, transform: open ? 'rotate(45deg) translateY(6.5px)' : 'none' }} />
          <span className="block w-5 h-[1.5px] rounded-full transition-all duration-200" style={{ background: c.charcoal, opacity: open ? 0 : 1 }} />
          <span className="block w-5 h-[1.5px] rounded-full transition-all duration-200" style={{ background: c.charcoal, transform: open ? 'rotate(-45deg) translateY(-6.5px)' : 'none' }} />
        </button>
      </div>

      {open && (
        <div className="md:hidden px-6 pb-6 flex flex-col gap-4" style={{ background: c.bg }}>
          {['How it works', 'Markets', 'Flash Sales', 'Deliver with us'].map(item => (
            <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`} className="text-[15px] no-underline py-2" style={{ color: c.charcoal }} onClick={() => setOpen(false)}>
              {item}
            </a>
          ))}
          <a href="/signup" className="text-[15px] font-medium no-underline py-3 text-center rounded-[8px]" style={{ background: c.green, color: '#fff' }}>
            Get started
          </a>
        </div>
      )}
    </nav>
  )
}

function HeroSection() {
  return (
    <section className="pt-[100px] md:pt-[140px] pb-16 md:pb-24 relative overflow-hidden">
      {/* Subtle warm gradient */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none"
        style={{ background: 'radial-gradient(circle at 70% 20%, rgba(45,138,94,0.06) 0%, transparent 60%)' }}
      />
      <div
        className="absolute bottom-0 left-0 w-[400px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(circle at 30% 80%, rgba(232,168,56,0.05) 0%, transparent 60%)' }}
      />

      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Left — Copy */}
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
              style={{ background: c.greenBg, border: `1px solid ${c.greenBord}` }}
            >
              <span className="w-[6px] h-[6px] rounded-full" style={{ background: c.green }} />
              <span className="font-[family-name:var(--font-dm-mono)] text-[11px] tracking-[0.06em]" style={{ color: c.green }}>
                Now in Amedi
              </span>
            </div>

            <h1
              className="font-[family-name:var(--font-dm-sans)] font-medium leading-[1.08] tracking-[-0.03em] mb-5"
              style={{ fontSize: 'clamp(36px, 5.5vw, 56px)', color: c.charcoal }}
            >
              Shop from every{' '}
              <span className="relative inline-block">
                market
                <span
                  className="absolute bottom-[2px] left-0 right-0 h-[3px] rounded-full"
                  style={{ background: `linear-gradient(90deg, ${c.green}, ${c.saffron})` }}
                />
              </span>
              {' '}in Amedi.
            </h1>

            <p
              className="font-[family-name:var(--font-dm-sans)] text-[17px] leading-[1.65] max-w-[440px] mb-8"
              style={{ color: c.stone }}
            >
              Compare prices across local shops, catch flash sales, and get everything
              delivered in one trip — from multiple stores, one driver.
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href="/signup?role=customer"
                className="font-[family-name:var(--font-dm-sans)] text-[15px] font-medium no-underline px-7 py-3.5 rounded-[10px] transition-all duration-200"
                style={{ background: c.green, color: '#fff' }}
                onMouseEnter={e => { e.currentTarget.style.background = c.greenHover; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = c.green; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                Start shopping
              </a>
              <a
                href="/signup?role=market"
                className="font-[family-name:var(--font-dm-sans)] text-[15px] font-medium no-underline px-7 py-3.5 rounded-[10px] transition-all duration-200"
                style={{ background: 'transparent', border: `1px solid ${c.cream2}`, color: c.charcoal }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = c.stone; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = c.cream2; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                List your shop
              </a>
            </div>

            <div className="flex items-center gap-6 mt-10">
              {[
                { val: '24+', label: 'Local shops' },
                { val: '1,200+', label: 'Products listed' },
                { val: '15 min', label: 'Avg. delivery' },
              ].map(stat => (
                <div key={stat.label}>
                  <div className="font-[family-name:var(--font-dm-sans)] text-[20px] font-medium" style={{ color: c.charcoal }}>{stat.val}</div>
                  <div className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.06em] uppercase mt-0.5" style={{ color: c.stoneLight }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Product preview card */}
          <div className="relative">
            <div
              className="rounded-[16px] overflow-hidden"
              style={{ background: c.white, border: `1px solid ${c.cream2}`, boxShadow: '0 4px 24px rgba(30,28,25,0.06)' }}
            >
              {/* Header */}
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${c.cream}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[10px] flex items-center justify-center font-[family-name:var(--font-dm-sans)] text-[13px] font-medium" style={{ background: c.greenBg, color: c.green }}>
                    AH
                  </div>
                  <div>
                    <div className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={{ color: c.charcoal }}>Ahmad&apos;s Grocery</div>
                    <div className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stoneLight }}>Open until 9pm</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ background: c.saffronBg }}>
                  <span className="font-[family-name:var(--font-dm-mono)] text-[10px] font-medium" style={{ color: '#B8841A' }}>Flash Sale</span>
                </div>
              </div>

              {/* Items */}
              <div className="p-4 flex flex-col gap-2.5">
                {[
                  { name: 'Kurdish Honey (Mountain)', price: '25,000', sale: '18,000', img: '🍯' },
                  { name: 'Fresh Bread — Tandoor', price: '1,500', sale: null, img: '🫓' },
                  { name: 'Local Cheese (White)', price: '12,000', sale: '9,500', img: '🧀' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-3 rounded-[10px] transition-all duration-200"
                    style={{ background: item.sale ? c.saffronBg : c.cream, border: `1px solid ${item.sale ? c.saffronBord : 'transparent'}` }}
                  >
                    <span className="text-[24px] flex-shrink-0">{item.img}</span>
                    <div className="flex-1">
                      <div className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium" style={{ color: c.charcoal }}>{item.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.sale ? (
                          <>
                            <span className="font-[family-name:var(--font-dm-mono)] text-[12px] line-through" style={{ color: c.stoneLight }}>IQD {item.price}</span>
                            <span className="font-[family-name:var(--font-dm-mono)] text-[12px] font-medium" style={{ color: '#B8841A' }}>IQD {item.sale}</span>
                          </>
                        ) : (
                          <span className="font-[family-name:var(--font-dm-mono)] text-[12px]" style={{ color: c.stone }}>IQD {item.price}</span>
                        )}
                      </div>
                    </div>
                    <button
                      className="w-8 h-8 rounded-[8px] flex items-center justify-center border-none cursor-pointer transition-all duration-200"
                      style={{ background: c.green, color: '#fff', fontSize: '16px' }}
                    >
                      +
                    </button>
                  </div>
                ))}
              </div>

              {/* Multi-shop cart bar */}
              <div className="mx-4 mb-4 px-4 py-3 rounded-[10px] flex items-center justify-between" style={{ background: c.charcoal }}>
                <div>
                  <div className="font-[family-name:var(--font-dm-sans)] text-[12px] font-medium" style={{ color: '#fff' }}>Cart — 2 shops, 5 items</div>
                  <div className="font-[family-name:var(--font-dm-mono)] text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>One delivery trip</div>
                </div>
                <div className="font-[family-name:var(--font-dm-mono)] text-[14px] font-medium" style={{ color: c.saffron }}>IQD 47,500</div>
              </div>
            </div>

            {/* Second shop peek */}
            <div
              className="absolute -bottom-4 -left-4 w-[180px] rounded-[12px] p-3 hidden md:block"
              style={{ background: c.white, border: `1px solid ${c.cream2}`, boxShadow: '0 4px 16px rgba(30,28,25,0.06)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-[8px] flex items-center justify-center font-[family-name:var(--font-dm-mono)] text-[10px] font-medium" style={{ background: c.terraBg, color: c.terra }}>
                  SK
                </div>
                <div className="font-[family-name:var(--font-dm-sans)] text-[11px] font-medium" style={{ color: c.charcoal }}>Soran&apos;s Butcher</div>
              </div>
              <div className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stone }}>Lamb Chops · IQD 18,000</div>
              <div className="font-[family-name:var(--font-dm-mono)] text-[9px] mt-1" style={{ color: c.green }}>+ Added to cart</div>
            </div>

            {/* Driver badge */}
            <div
              className="absolute -top-2 -right-2 rounded-[10px] px-3 py-2 hidden md:flex items-center gap-2"
              style={{ background: c.white, border: `1px solid ${c.cream2}`, boxShadow: '0 2px 12px rgba(30,28,25,0.06)' }}
            >
              <span className="w-2 h-2 rounded-full amber-pulse" style={{ background: c.green }} />
              <span className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.green }}>Driver Karwan — 4 min away</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 md:py-28" style={{ background: c.cream }}>
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        <div className="text-center mb-14">
          <div
            className="font-[family-name:var(--font-dm-mono)] text-[11px] tracking-[0.12em] uppercase mb-3"
            style={{ color: c.green }}
          >
            How it works
          </div>
          <h2
            className="font-[family-name:var(--font-dm-sans)] font-medium leading-[1.1] tracking-[-0.02em]"
            style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: c.charcoal }}
          >
            Browse. Order. Delivered.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              title: 'Browse all shops',
              desc: 'See every product from every market in Amedi. Filter by category, compare prices across shops side by side.',
              color: c.green,
              bg: c.greenBg,
              icon: (
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <rect x="3" y="3" width="9" height="9" rx="2" stroke={c.green} strokeWidth="1.5"/>
                  <rect x="16" y="3" width="9" height="9" rx="2" stroke={c.green} strokeWidth="1.5"/>
                  <rect x="3" y="16" width="9" height="9" rx="2" stroke={c.green} strokeWidth="1.5"/>
                  <rect x="16" y="16" width="9" height="9" rx="2" stroke={c.green} strokeWidth="1.5" strokeDasharray="3 2"/>
                </svg>
              ),
            },
            {
              step: '02',
              title: 'One cart, many shops',
              desc: 'Add items from multiple shops into one order. Kurdish honey from Ahmad, meat from Soran, vegetables from Dara — all in one cart.',
              color: c.saffron,
              bg: c.saffronBg,
              icon: (
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M4 4h3l2.5 14h12L25 8H9" stroke="#B8841A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="11" cy="22" r="2" stroke="#B8841A" strokeWidth="1.5"/>
                  <circle cx="20" cy="22" r="2" stroke="#B8841A" strokeWidth="1.5"/>
                </svg>
              ),
            },
            {
              step: '03',
              title: 'One driver, one trip',
              desc: 'A local driver picks up from all shops on one route and delivers everything to your door. Track in real time.',
              color: c.terra,
              bg: c.terraBg,
              icon: (
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M3 18h1.5a2 2 0 012 2v1a2 2 0 002 2h0a2 2 0 002-2v-1" stroke={c.terra} strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M17.5 18h-7M17.5 18v3a2 2 0 002 2h0a2 2 0 002-2v-1" stroke={c.terra} strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M25 18h-3.5V10l-4-5H6.5a2 2 0 00-2 2v11" stroke={c.terra} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17.5 18V10h3l3.5 4v4" stroke={c.terra} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ),
            },
          ].map(({ step, title, desc, color, bg, icon }) => (
            <div
              key={step}
              className="rounded-[14px] p-8 transition-all duration-200 relative"
              style={{ background: c.white, border: `1px solid ${c.cream2}` }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 8px 24px rgba(30,28,25,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = 'none')}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-[12px] flex items-center justify-center" style={{ background: bg }}>
                  {icon}
                </div>
                <span className="font-[family-name:var(--font-dm-mono)] text-[11px] tracking-[0.06em]" style={{ color: c.stoneLight }}>{step}</span>
              </div>
              <h3 className="font-[family-name:var(--font-dm-sans)] text-[18px] font-medium mb-2" style={{ color: c.charcoal }}>{title}</h3>
              <p className="font-[family-name:var(--font-dm-sans)] text-[14px] leading-[1.65]" style={{ color: c.stone }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FlashSaleSection() {
  return (
    <section id="flash-sales" className="py-20 md:py-28">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left — Flash sale preview */}
          <div
            className="rounded-[16px] p-6"
            style={{ background: 'linear-gradient(135deg, #FFF8EB 0%, #FFF3D9 100%)', border: `1px solid ${c.saffronBord}` }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full amber-pulse" style={{ background: c.saffron }} />
                <span className="font-[family-name:var(--font-dm-sans)] text-[15px] font-medium" style={{ color: '#8B6914' }}>Flash Sales — Live Now</span>
              </div>
              <span className="font-[family-name:var(--font-dm-mono)] text-[12px] px-2.5 py-1 rounded-[6px]" style={{ background: 'rgba(232,168,56,0.2)', color: '#8B6914' }}>
                2h 14m left
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {[
                { shop: 'Nazar Fresh Produce', item: 'Organic Tomatoes (1kg)', was: '5,000', now: '3,000', pct: '40%' },
                { shop: 'Ahmad\'s Grocery', item: 'Kurdish Tea — 500g', was: '15,000', now: '10,000', pct: '33%' },
                { shop: 'Dara Market', item: 'Sunflower Oil 2L', was: '8,000', now: '5,500', pct: '31%' },
              ].map((deal, i) => (
                <div key={i} className="rounded-[10px] p-4 flex items-center gap-4" style={{ background: 'rgba(255,255,255,0.8)' }}>
                  <div className="w-10 h-10 rounded-[8px] flex items-center justify-center font-[family-name:var(--font-dm-sans)] text-[14px] font-bold" style={{ background: c.saffron, color: '#fff' }}>
                    {deal.pct}
                  </div>
                  <div className="flex-1">
                    <div className="font-[family-name:var(--font-dm-sans)] text-[13px] font-medium" style={{ color: c.charcoal }}>{deal.item}</div>
                    <div className="font-[family-name:var(--font-dm-mono)] text-[10px] mt-0.5" style={{ color: c.stoneLight }}>{deal.shop}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-[family-name:var(--font-dm-mono)] text-[10px] line-through" style={{ color: c.stoneLight }}>IQD {deal.was}</div>
                    <div className="font-[family-name:var(--font-dm-mono)] text-[13px] font-medium" style={{ color: '#8B6914' }}>IQD {deal.now}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Copy */}
          <div>
            <div
              className="font-[family-name:var(--font-dm-mono)] text-[11px] tracking-[0.12em] uppercase mb-3"
              style={{ color: c.saffron }}
            >
              Flash sales
            </div>
            <h2
              className="font-[family-name:var(--font-dm-sans)] font-medium leading-[1.1] tracking-[-0.02em] mb-5"
              style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: c.charcoal }}
            >
              The best deals in the bazaar — now digital.
            </h2>
            <p className="font-[family-name:var(--font-dm-sans)] text-[16px] leading-[1.65] mb-6" style={{ color: c.stone }}>
              Shop owners post timed flash sales — just like calling out deals in the market. Get notified instantly. Prices drop, countdown runs, you save.
            </p>
            <div className="flex flex-col gap-3">
              {[
                'Real-time price drops from local shops',
                'Push notifications when deals go live',
                'Countdown timer — grab it before it ends',
              ].map(point => (
                <div key={point} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: c.saffronBg }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#B8841A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <span className="font-[family-name:var(--font-dm-sans)] text-[14px]" style={{ color: c.stone }}>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function RoleSection() {
  return (
    <section id="markets" className="py-20 md:py-28" style={{ background: c.cream }}>
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        <div className="text-center mb-14">
          <div className="font-[family-name:var(--font-dm-mono)] text-[11px] tracking-[0.12em] uppercase mb-3" style={{ color: c.green }}>
            Join Bazaar
          </div>
          <h2
            className="font-[family-name:var(--font-dm-sans)] font-medium leading-[1.1] tracking-[-0.02em] mb-3"
            style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: c.charcoal }}
          >
            Everyone has a place here.
          </h2>
          <p className="font-[family-name:var(--font-dm-sans)] text-[16px] max-w-[480px] mx-auto" style={{ color: c.stone }}>
            Whether you shop, sell, or deliver — there&apos;s a door with your name on it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              role: 'Customer',
              tagline: 'Shop smarter',
              desc: 'Browse every market, compare prices, build one cart from multiple shops, and track your delivery live.',
              color: c.green,
              bg: c.greenBg,
              border: c.greenBord,
              cta: 'Start shopping',
              href: '/signup?role=customer',
              features: ['Compare prices across shops', 'One cart, multi-shop orders', 'Real-time delivery tracking', 'Flash sale notifications'],
            },
            {
              role: 'Market Owner',
              tagline: 'Grow your reach',
              desc: 'Get your own branded shop page. List products, set prices, run flash sales, and reach customers who never walked past your door.',
              color: c.terra,
              bg: c.terraBg,
              border: c.terraBord,
              cta: 'List your shop',
              href: '/signup?role=market',
              features: ['Your own shop page', 'Easy product management', 'Flash sale tools', 'Order & earnings dashboard'],
            },
            {
              role: 'Driver',
              tagline: 'Earn locally',
              desc: 'Pick up from multiple shops per trip. Short distances, fair pay. Know your town, earn from it.',
              color: c.charcoal,
              bg: 'rgba(30,28,25,0.05)',
              border: 'rgba(30,28,25,0.12)',
              cta: 'Start delivering',
              href: '/signup?role=driver',
              features: ['Multi-shop pickup routes', 'Flexible schedule', 'Earnings dashboard', 'Short delivery distances'],
            },
          ].map(card => (
            <div
              key={card.role}
              className="rounded-[14px] p-8 flex flex-col transition-all duration-200 relative overflow-hidden"
              style={{ background: c.white, border: `1px solid ${c.cream2}` }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = card.border; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(30,28,25,0.06)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = c.cream2; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div className="w-12 h-12 rounded-[12px] flex items-center justify-center mb-5" style={{ background: card.bg }}>
                <span className="font-[family-name:var(--font-dm-sans)] text-[16px] font-medium" style={{ color: card.color }}>{card.role[0]}</span>
              </div>
              <div className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.1em] uppercase mb-1" style={{ color: card.color }}>{card.tagline}</div>
              <h3 className="font-[family-name:var(--font-dm-sans)] text-[20px] font-medium mb-2" style={{ color: c.charcoal }}>{card.role}</h3>
              <p className="font-[family-name:var(--font-dm-sans)] text-[14px] leading-[1.6] mb-6" style={{ color: c.stone }}>{card.desc}</p>

              <div className="flex flex-col gap-2.5 mb-8 flex-1">
                {card.features.map(feat => (
                  <div key={feat} className="flex items-center gap-2.5">
                    <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0" style={{ background: card.bg }}>
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l2 2L6.5 2" stroke={card.color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <span className="font-[family-name:var(--font-dm-sans)] text-[13px]" style={{ color: c.stone }}>{feat}</span>
                  </div>
                ))}
              </div>

              <a
                href={card.href}
                className="w-full text-center py-3.5 rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[14px] font-medium no-underline transition-all duration-200"
                style={{ background: card.color, color: '#fff' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(0.98)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {card.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function DeliverSection() {
  return (
    <section id="deliver-with-us" className="py-20 md:py-28">
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="font-[family-name:var(--font-dm-mono)] text-[11px] tracking-[0.12em] uppercase mb-3" style={{ color: c.terra }}>
              Multi-shop orders
            </div>
            <h2
              className="font-[family-name:var(--font-dm-sans)] font-medium leading-[1.1] tracking-[-0.02em] mb-5"
              style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: c.charcoal }}
            >
              One order. Multiple shops. One delivery.
            </h2>
            <p className="font-[family-name:var(--font-dm-sans)] text-[16px] leading-[1.65] mb-8" style={{ color: c.stone }}>
              Add honey from one shop, bread from another, and meat from a third. The driver collects from all locations on one optimized route and delivers everything together. You pay one delivery fee.
            </p>
          </div>

          {/* Route visualization */}
          <div className="rounded-[16px] p-6 relative" style={{ background: c.white, border: `1px solid ${c.cream2}`, boxShadow: '0 4px 24px rgba(30,28,25,0.06)' }}>
            <div className="font-[family-name:var(--font-dm-mono)] text-[10px] tracking-[0.08em] uppercase mb-4" style={{ color: c.stoneLight }}>
              Delivery Route — Order #1047
            </div>
            <div className="flex flex-col gap-0">
              {[
                { name: 'Ahmad\'s Grocery', items: '3 items', status: 'Picked up', color: c.green },
                { name: 'Soran\'s Butcher', items: '1 item', status: 'Picking up...', color: c.saffron },
                { name: 'Dara Market', items: '2 items', status: 'Next stop', color: c.stoneLight },
                { name: 'Your location', items: '', status: 'ETA 12 min', color: c.terra },
              ].map((stop, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                      style={{ background: stop.color, border: i === 1 ? `2px solid ${c.saffron}` : 'none', boxShadow: i === 1 ? `0 0 0 4px ${c.saffronBg}` : 'none' }}
                    />
                    {i < 3 && <div className="w-[1.5px] h-10" style={{ background: c.cream2 }} />}
                  </div>
                  <div className="pb-4">
                    <div className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium" style={{ color: c.charcoal }}>{stop.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {stop.items && <span className="font-[family-name:var(--font-dm-mono)] text-[11px]" style={{ color: c.stone }}>{stop.items}</span>}
                      <span
                        className="font-[family-name:var(--font-dm-mono)] text-[10px] px-1.5 py-0.5 rounded"
                        style={{ background: i === 0 ? c.greenBg : i === 1 ? c.saffronBg : 'transparent', color: stop.color }}
                      >
                        {stop.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-4 flex items-center justify-between" style={{ borderTop: `1px solid ${c.cream}` }}>
              <span className="font-[family-name:var(--font-dm-mono)] text-[11px]" style={{ color: c.stone }}>Driver: Karwan M.</span>
              <span className="font-[family-name:var(--font-dm-mono)] text-[11px]" style={{ color: c.green }}>Delivery fee: IQD 2,500</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="py-10" style={{ borderTop: `1px solid ${c.cream2}` }}>
      <div className="max-w-[1200px] mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-[family-name:var(--font-dm-sans)] text-[18px] font-medium" style={{ color: c.stoneLight }}>
            bazaar<span style={{ color: 'rgba(45,138,94,0.4)' }}>.</span>
          </span>
          <div className="flex gap-6 flex-wrap justify-center">
            {[
              { label: 'Shop', href: '/signup?role=customer' },
              { label: 'List your market', href: '/signup?role=market' },
              { label: 'Drive', href: '/signup?role=driver' },
            ].map(link => (
              <a
                key={link.label}
                href={link.href}
                className="font-[family-name:var(--font-dm-sans)] text-[13px] no-underline transition-colors duration-200"
                style={{ color: c.stone }}
                onMouseEnter={e => (e.currentTarget.style.color = c.charcoal)}
                onMouseLeave={e => (e.currentTarget.style.color = c.stone)}
              >
                {link.label}
              </a>
            ))}
          </div>
          <span className="font-[family-name:var(--font-dm-mono)] text-[10px]" style={{ color: c.stoneLight }}>
            Amedi, Kurdistan Region
          </span>
        </div>
      </div>
    </footer>
  )
}

export default function BazaarLandingPage() {
  return (
    <>
      <Nav />
      <HeroSection />
      <HowItWorksSection />
      <FlashSaleSection />
      <DeliverSection />
      <RoleSection />
      <Footer />
    </>
  )
}
