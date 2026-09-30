import { ImageResponse } from 'next/og'

export const alt = 'kela. — Shop every market in Amedi'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: '#FAFAF7',
          color: '#1E1C19',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div
            style={{
              width: 112,
              height: 112,
              borderRadius: 26,
              background: '#2D8A5E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="76" height="76" viewBox="0 0 120 120" fill="#FFFFFF">
              <rect x="20" y="12" width="20" height="96" />
              <rect x="20" y="6" width="6" height="8" />
              <rect x="34" y="6" width="6" height="8" />
              <path d="M40 60 L96 12 L106 24 L54 66 Z" />
              <path d="M40 60 L96 108 L108 108 L108 96 L54 54 Z" />
            </svg>
          </div>
          <div style={{ display: 'flex', fontSize: 72, fontWeight: 600, letterSpacing: -2 }}>
            kela<span style={{ color: '#2D8A5E' }}>.</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', fontSize: 64, fontWeight: 600, letterSpacing: -2, lineHeight: 1.05 }}>
            Shop every market in Amedi.
          </div>
          <div style={{ display: 'flex', fontSize: 30, color: '#7A756E' }}>
            Compare prices · many shops, one delivery · cash on delivery
          </div>
        </div>

        <div style={{ display: 'flex', height: 8, borderRadius: 4, background: 'linear-gradient(90deg, #2D8A5E, #E8A838)' }} />
      </div>
    ),
    size,
  )
}
