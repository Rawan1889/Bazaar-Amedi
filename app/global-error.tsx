'use client'

// Renders only when the root layout itself fails, so it can't rely on the
// layout's fonts, providers or translator — keep it self-contained.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#FAFAF7', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <main style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 420, textAlign: 'center' }}>
            <h1 style={{ fontSize: 22, fontWeight: 500, color: '#1E1C19', margin: '0 0 8px' }}>kela. is having trouble</h1>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: '#6B665F', margin: '0 0 24px' }}>
              Please try again in a moment.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{ minHeight: 44, padding: '0 20px', borderRadius: 10, border: 'none', background: '#287A53', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  )
}
