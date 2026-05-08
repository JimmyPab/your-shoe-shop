// ============================================================
// PlaceholderImage.jsx
// Renders a styled placeholder image for each product.
// When you have real images, replace <PlaceholderImage> with <img src={product.image} />
// and add an `image` field to each product in products.js
// ============================================================

const BRAND_COLORS = {
  hoka:       { bg: '#2C3E50', accent: '#E8D5B0', text: '#E8D5B0' },
  newbalance: { bg: '#1a1a2e', accent: '#E8D5B0', text: '#E8D5B0' },
  asics:      { bg: '#1B4332', accent: '#E8D5B0', text: '#E8D5B0' },
  oncloud:    { bg: '#2D3561', accent: '#E8D5B0', text: '#E8D5B0' },
  brooks:     { bg: '#4A1942', accent: '#E8D5B0', text: '#E8D5B0' },
}

const CATEGORY_SHAPES = {
  shoes: ShoeShape,
  hats:  HatShape,
  accessories: BagShape,
}

function ShoeShape({ color }) {
  return (
    <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
      <path d="M8 42 C8 42 12 28 20 24 C28 20 35 22 42 20 C49 18 55 14 62 14 C67 14 72 16 72 22 C72 26 68 28 64 28 L52 30 C48 31 46 34 44 38 L40 42 Z" fill={color} opacity="0.9"/>
      <path d="M8 42 L44 42 C46 42 48 40 48 38 L52 30 L64 28 C68 28 72 26 72 22" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5"/>
      <ellipse cx="18" cy="42" rx="10" ry="4" fill={color} opacity="0.7"/>
      <rect x="8" y="40" width="56" height="6" rx="3" fill={color} opacity="0.4"/>
    </svg>
  )
}

function HatShape({ color }) {
  return (
    <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
      <ellipse cx="40" cy="44" rx="32" ry="6" fill={color} opacity="0.4"/>
      <path d="M16 44 C16 44 18 24 40 20 C62 24 64 44 64 44 Z" fill={color} opacity="0.85"/>
      <rect x="12" y="40" width="56" height="6" rx="3" fill={color} opacity="0.6"/>
      <path d="M24 44 C24 36 30 26 40 24 C50 26 56 36 56 44" stroke={color} strokeWidth="1" fill="none" opacity="0.3"/>
    </svg>
  )
}

function BagShape({ color }) {
  return (
    <svg width="80" height="70" viewBox="0 0 80 70" fill="none">
      <rect x="16" y="24" width="48" height="36" rx="4" fill={color} opacity="0.85"/>
      <path d="M28 24 C28 16 52 16 52 24" stroke={color} strokeWidth="3" fill="none" opacity="0.7" strokeLinecap="round"/>
      <rect x="32" y="36" width="16" height="3" rx="1.5" fill={color} opacity="0.4"/>
      <line x1="40" y1="32" x2="40" y2="44" stroke={color} strokeWidth="1.5" opacity="0.3"/>
    </svg>
  )
}

export default function PlaceholderImage({ product, size = 'card' }) {
  const brandStyle = BRAND_COLORS[product.brand] || BRAND_COLORS.hoka
  const ShapeComponent = CATEGORY_SHAPES[product.category] || ShoeShape

  const heights = { card: '200px', detail: '420px', thumb: '60px', mini: '44px' }
  const height = heights[size] || heights.card

  return (
    <div style={{
      width: '100%',
      height,
      background: `linear-gradient(145deg, ${brandStyle.bg} 0%, ${brandStyle.bg}dd 100%)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `radial-gradient(circle at 20% 80%, ${brandStyle.accent}08 0%, transparent 50%), radial-gradient(circle at 80% 20%, ${brandStyle.accent}06 0%, transparent 50%)`,
      }}/>
      <ShapeComponent color={brandStyle.accent} />
      {size !== 'mini' && size !== 'thumb' && (
        <div style={{
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: brandStyle.accent,
          opacity: 0.6,
          fontFamily: 'DM Sans, sans-serif',
        }}>
          {product.brandName}
        </div>
      )}
    </div>
  )
}
