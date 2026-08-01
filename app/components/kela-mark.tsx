// The kela brand mark — "K, as a gate". A capital K where the vertical stem
// is a tower with crenellations, the diagonals are battered fortress walls,
// and a small gate is cut into the stem.
//
// Renders at any size via `size` prop. Uses currentColor so it inherits from
// the surrounding text colour; the gate cut takes whatever background the
// callsite passes via `gateColor` (defaults to the site's cream background so
// it disappears cleanly against the header).

export function KelaMark({
  size = 22,
  gateColor = '#FAFAF7',
  color = '#1E1C19',
  className,
  title = 'kela',
}: {
  size?: number
  gateColor?: string
  color?: string
  className?: string
  title?: string
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label={title}
      className={className}
      style={{ color, flexShrink: 0 }}
    >
      {/* stem / tower */}
      <rect x="20" y="12" width="20" height="96" fill="currentColor" />
      {/* crenellations on top of the stem */}
      <rect x="20" y="6" width="6" height="8" fill="currentColor" />
      <rect x="34" y="6" width="6" height="8" fill="currentColor" />
      {/* upper diagonal wall */}
      <path d="M40 60 L96 12 L106 24 L54 66 Z" fill="currentColor" />
      {/* lower diagonal wall (battered) */}
      <path d="M40 60 L96 108 L108 108 L108 96 L54 54 Z" fill="currentColor" />
      {/* gate opening cut into the stem */}
      <path d="M24 108 L24 84 Q24 78 30 78 Q36 78 36 84 L36 108 Z" fill={gateColor} />
    </svg>
  )
}
