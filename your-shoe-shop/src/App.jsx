import { useState, useRef } from 'react'
import { PRODUCTS, BRANDS, getByBrand, getFeatured, getTrending, getRecs, searchProducts, getSizes } from './products'
import AdminPanel from './admin/AdminPanel'
import PlaceholderImage from './components/PlaceholderImage'
import { generateCode, sendVerificationEmail, storePendingCode, verifyCode as verifyEmailCode } from './admin/emailService'
import { redirectToStripeCheckout } from './stripe'

const ls = {
  get: (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb } catch { return fb } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} },
}

// ── Live catalog: merges hardcoded products.js with admin-added products ──
// Version key — bump this whenever products.js changes significantly
// to force-clear old cached admin data that might conflict
const CATALOG_VERSION = 'v3'
function buildLiveCatalog() {
  // Clear stale cache if version changed
  if (ls.get('bt_catalog_version', null) !== CATALOG_VERSION) {
    ls.set('bt_catalog_version', CATALOG_VERSION)
    localStorage.removeItem('bt_admin_products')
  }

  const adminProducts = ls.get('bt_admin_products', null)
  if (!adminProducts) return PRODUCTS

  const baseById = Object.fromEntries(PRODUCTS.map(p => [p.id, p]))
  const merged = { ...baseById }
  adminProducts.forEach(p => { merged[p.id] = p })

  return Object.values(merged)
    .filter(p => p.active !== false)
    .map(p => ({ ...p, price: parseFloat(p.price) || 0, origPrice: p.origPrice ? parseFloat(p.origPrice) : null }))
}

function makeDemoOrders() {
  return [
    { id: 'BT-20251', date: 'Apr 12, 2025', status: 'delivered', items: [{ id: 1, qty: 1 }, { id: 8, qty: 1 }], total: '300.00', address: '123 Main St, Newark, NJ' },
    { id: 'BT-20218', date: 'Mar 28, 2025', status: 'shipped', items: [{ id: 15, qty: 1 }], total: '160.00', address: '123 Main St, Newark, NJ' },
  ]
}

function ProductCard({ product, onView, onAddToCart }) {
  const salePct = product.origPrice ? Math.round((1 - product.price / product.origPrice) * 100) : null
  return (
    <div className="product-card">
      <div className="product-img" onClick={() => onView(product.id)}>
        <PlaceholderImage product={product} size="card" />
        <div className="product-badge-wrap">
          {product.tags.includes('sale') && <span className="tag tag-sale">-{salePct}%</span>}
          {product.tags.includes('new')  && <span className="tag tag-new">New</span>}
          {product.tags.includes('hot')  && <span className="tag tag-hot">Hot</span>}
        </div>
      </div>
      <div className="product-info">
        <div className="product-brand-label">{product.brandName}</div>
        <div className="product-name" onClick={() => onView(product.id)}>{product.name}</div>
        <div className="product-rating">
          <span className="stars">{"★".repeat(Math.floor(product.rating))}{"☆".repeat(5 - Math.floor(product.rating))}</span>
          <span className="product-rating-count">({product.reviews.toLocaleString()})</span>
        </div>
        <div className="product-price-row">
          <span className="product-price">${product.price}</span>
          {product.origPrice && <span className="product-price-og">${product.origPrice}</span>}
        </div>
        <button className="add-to-cart-btn" onClick={() => onAddToCart(product.id)}>Add to Cart</button>
      </div>
    </div>
  )
}

const STATUS_CLASS = { delivered: 'status-delivered', shipped: 'status-shipped', processing: 'status-processing', cancelled: 'status-cancelled' }
const STATUS_LABEL = { delivered: 'Delivered', shipped: 'Shipped', processing: 'Processing', cancelled: 'Cancelled' }

export default function App() {
  const [page, setPage]             = useState('home')
  const [currentBrand, setBrand]    = useState('all')
  const [currentProdId, setProdId]  = useState(null)
  const [cart,   setCart]           = useState(() => ls.get('bt_cart', []))
  const [user,   setUser]           = useState(() => ls.get('bt_user', null))
  const [liked,  setLiked]          = useState(() => ls.get('bt_liked', []))
  const [saved,  setSaved]          = useState(() => ls.get('bt_saved', []))
  const [orders, setOrders]         = useState(() => ls.get('bt_orders', null) || makeDemoOrders())
  const [showAdmin,    setShowAdmin]    = useState(false)
  const [authMode,     setAuthMode]     = useState(null)
  const [orderDetail,  setOrderDetail]  = useState(null)
  const [toast,        setToast]        = useState({ msg: '', show: false })
  const [searchQ,      setSearchQ]      = useState('')
  const [searchOpen,   setSearchOpen]   = useState(false)
  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedQty,  setSelectedQty]  = useState(1)
  const [loginEmail,   setLoginEmail]   = useState('')
  const [loginPass,    setLoginPass]    = useState('')
  const [regFirst,     setRegFirst]     = useState('')
  const [regLast,      setRegLast]      = useState('')
  const [regEmail,     setRegEmail]     = useState('')
  const [regPass,      setRegPass]      = useState('')
  const [authErr,      setAuthErr]      = useState('')
  const [authCode,     setAuthCode]     = useState('')
  const [authCodeHint, setAuthCodeHint] = useState('')
  const [authSending,  setAuthSending]  = useState(false)
  const [pendingReg,   setPendingReg]   = useState(null)
  const [guestNum,     setGuestNum]     = useState('')
  const [guestZip,     setGuestZip]     = useState('')
  const [guestResult,  setGuestResult]  = useState(null)
  const toastTimer = useRef(null)
  const persist = (k, v) => ls.set(k, v)

  function showToast(msg) {
    clearTimeout(toastTimer.current)
    setToast({ msg, show: true })
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2800)
  }

  function goTo(p) { setPage(p); window.scrollTo(0, 0) }
  function filterBrand(b) { setBrand(b); goTo('brand') }

  const cartCount = cart.reduce((s, c) => s + c.qty, 0)
  // NOTE: subtotal uses buildLiveCatalog() directly so admin-added products price correctly
  const _liveCatalog = buildLiveCatalog()

  // Handle Stripe redirect back to site
  if (typeof window !== 'undefined' && !window._stripeHandled) {
    const urlParams = new URLSearchParams(window.location.search)
    const checkoutStatus = urlParams.get('checkout')
    if (checkoutStatus === 'success') {
      window._stripeHandled = true
      setTimeout(() => { window.history.replaceState({}, '', window.location.pathname); showToast('Payment successful! Your order has been placed.') }, 100)
    } else if (checkoutStatus === 'cancel') {
      window._stripeHandled = true
      setTimeout(() => { window.history.replaceState({}, '', window.location.pathname); showToast('Checkout cancelled — your cart is still saved.') }, 100)
    }
  }

  const subtotal  = cart.reduce((s, c) => {
    const p = _liveCatalog.find(x => x.id === c.id)
    return s + (p ? (parseFloat(p.price) || 0) * c.qty : 0)
  }, 0)
  const tax = subtotal * 0.0875

  function addToCart(id, qty = 1, size = null) {
    const sz = size || selectedSize || '9'
    const existing = cart.find(c => c.id === id && c.size === sz)
    const next = existing
      ? cart.map(c => c.id === id && c.size === sz ? { ...c, qty: c.qty + qty } : c)
      : [...cart, { id, qty, size: sz }]
    setCart(next); persist('bt_cart', next)
    showToast('Added to cart!')
  }

  function changeQty(id, size, delta) {
    const next = cart.map(c => c.id === id && c.size === size ? { ...c, qty: Math.max(1, c.qty + delta) } : c)
    setCart(next); persist('bt_cart', next)
  }

  function removeFromCart(id, size) {
    const next = cart.filter(c => !(c.id === id && c.size === size))
    setCart(next); persist('bt_cart', next)
    showToast('Item removed')
  }

  function viewProduct(id) { setProdId(id); setSelectedSize(null); setSelectedQty(1); goTo('product') }

  async function doLogin() {
    setAuthErr('')
    if (!loginEmail || !loginPass) { setAuthErr('Please enter email and password.'); return }
    const accounts = ls.get('bt_accounts', [])
    const match = accounts.find(u => u.email.toLowerCase() === loginEmail.toLowerCase() && u.password === loginPass)
    if (!match) { setAuthErr('Invalid email or password.'); return }
    setAuthSending(true)
    const code = generateCode()
    storePendingCode(loginEmail, code)
    const result = await sendVerificationEmail(loginEmail, match.name, code, 'sign-in')
    setAuthSending(false)
    if (result.success) {
      setAuthCodeHint('A 6-digit code was sent to ' + loginEmail)
    } else {
      console.warn('%c DEV — Verification code:', 'color:#8B6F47;font-weight:bold', code)
      setAuthCodeHint('DEV MODE: Check browser console (F12) for your code')
    }
    setAuthMode('verify-login'); setAuthCode('')
  }

  function doVerifyLogin() {
    setAuthErr('')
    const result = verifyEmailCode(loginEmail, authCode)
    if (!result.valid) { setAuthErr(result.reason); return }
    const accounts = ls.get('bt_accounts', [])
    const match = accounts.find(u => u.email.toLowerCase() === loginEmail.toLowerCase())
    if (!match) { setAuthErr('Account not found.'); return }
    const u = { name: match.name, email: match.email }
    setUser(u); persist('bt_user', u)
    setAuthMode(null); setLoginEmail(''); setLoginPass(''); setAuthCode('')
    showToast('Welcome back, ' + match.name.split(' ')[0] + '!')
  }

  async function doRegister() {
    setAuthErr('')
    if (!regFirst || !regLast || !regEmail || !regPass) { setAuthErr('Please fill all fields.'); return }
    if (regPass.length < 6) { setAuthErr('Password must be at least 6 characters.'); return }
    const accounts = ls.get('bt_accounts', [])
    if (accounts.find(u => u.email.toLowerCase() === regEmail.toLowerCase())) { setAuthErr('An account with this email already exists.'); return }
    setAuthSending(true)
    const code = generateCode()
    storePendingCode(regEmail, code)
    const result = await sendVerificationEmail(regEmail, regFirst, code, 'registration')
    setAuthSending(false)
    if (result.success) {
      setAuthCodeHint('A verification code was sent to ' + regEmail)
    } else {
      console.warn('%c DEV — Verification code:', 'color:#8B6F47;font-weight:bold', code)
      setAuthCodeHint('DEV MODE: Check browser console (F12) for your code')
    }
    setPendingReg({ name: regFirst + ' ' + regLast, email: regEmail, password: regPass })
    setAuthMode('verify-register'); setAuthCode('')
  }

  function doVerifyRegister() {
    setAuthErr('')
    if (!pendingReg) { setAuthErr('Session expired. Please try again.'); return }
    const result = verifyEmailCode(pendingReg.email, authCode)
    if (!result.valid) { setAuthErr(result.reason); return }
    const accounts = ls.get('bt_accounts', [])
    ls.set('bt_accounts', [...accounts, pendingReg])
    const u = { name: pendingReg.name, email: pendingReg.email }
    setUser(u); persist('bt_user', u)
    setAuthMode(null)
    setRegFirst(''); setRegLast(''); setRegEmail(''); setRegPass(''); setAuthCode('')
    setPendingReg(null)
    showToast('Welcome to BoringThings, ' + pendingReg.name.split(' ')[0] + '!')
  }

  function logout() { setUser(null); persist('bt_user', null); goTo('home'); showToast('Signed out successfully') }

  function toggleLike(id) {
    const next = liked.includes(id) ? liked.filter(x => x !== id) : [...liked, id]
    setLiked(next); persist('bt_liked', next)
    showToast(next.includes(id) ? 'Added to liked items' : 'Removed from liked')
  }

  function saveForLater(id) {
    if (saved.includes(id)) { showToast('Already in saved items'); return }
    const next = [...saved, id]; setSaved(next); persist('bt_saved', next); showToast('Saved for later')
  }

  async function goToStripe() {
    const result = await redirectToStripeCheckout(cart, _liveCatalog)
    if (!result.success) {
      // If Stripe Price IDs not set up yet, show a clear message
      alert(result.error || 'Stripe checkout failed. Please try again.')
      return
    }
    // Save order as processing before redirect (Stripe will redirect back on success)
    const newOrder = {
      id:       'BT-' + Math.floor(10000 + Math.random() * 90000),
      date:     new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status:   'processing',
      items:    [...cart],
      total:    (subtotal * 1.0875).toFixed(2),
      address:  'Entered at checkout',
      userEmail: user?.email || null,
    }
    const next = [newOrder, ...orders]
    setOrders(next); persist('bt_orders', next)
    setCart([]); persist('bt_cart', [])
  }

  // ── Live catalog — rebuilds every render so admin changes appear instantly ──
  const ALL_PRODUCTS = buildLiveCatalog()

  const currentProduct   = ALL_PRODUCTS.find(p => p.id === currentProdId)
  const brandProducts    = currentBrand === 'all' ? ALL_PRODUCTS : ALL_PRODUCTS.filter(p => p.brand === currentBrand)
  const featuredProducts = ALL_PRODUCTS.filter(p => p.featured).slice(0, 4)
  const trendingProducts = ALL_PRODUCTS.filter(p => p.trending).slice(0, 4)
  const productRecs      = currentProduct
    ? ALL_PRODUCTS.filter(p => p.id !== currentProdId && (p.brand === currentProduct.brand || p.category === currentProduct.category)).slice(0, 4)
    : []
  const cartProductIds   = cart.map(c => c.id)
  const searchResults    = searchQ.trim().length > 1
    ? ALL_PRODUCTS.filter(p => {
        const str = (p.name + ' ' + p.brandName + ' ' + p.category + ' ' + (p.desc || '')).toLowerCase()
        const q = searchQ.toLowerCase()
        if (str.includes(q)) return true
        for (let i = 0; i <= q.length - 3; i++) if (str.includes(q.slice(i, i + 3))) return true
        return false
      }).slice(0, 6)
    : []
  const productSizes     = currentProduct ? getSizes(currentProduct.category) : []
  const cartRecs         = ALL_PRODUCTS.filter(p => !cartProductIds.includes(p.id)).slice(0, 4)
  const brandTitle       = BRANDS.find(b => b.key === currentBrand)?.label || 'Products'

  return (
    <>
      <header className="topbar">
        <div className="brand" onClick={() => goTo('home')}>BORING<span>THINGS</span></div>
        <div className="search-wrap">
          <span className="search-icon">&#9906;</span>
          <input type="text" placeholder="Search shoes, brands, styles..."
            value={searchQ}
            onChange={e => { setSearchQ(e.target.value); setSearchOpen(true) }}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
          />
          <div className={"search-results" + (searchOpen && (searchResults.length > 0 || searchQ.length > 1) ? ' open' : '')}>
            {searchResults.map(p => (
              <div key={p.id} className="search-result-item" onClick={() => { viewProduct(p.id); setSearchQ(''); setSearchOpen(false) }}>
                <div className="search-result-thumb"><PlaceholderImage product={p} size="mini" /></div>
                <div><div className="sr-name">{p.name}</div><div className="sr-brand">{p.brandName} &middot; {p.category}</div></div>
                <span className="sr-price">${p.price}</span>
              </div>
            ))}
            {searchQ.trim().length > 1 && searchResults.length === 0 && (
              <div style={{ padding: '16px', color: 'var(--muted)', fontSize: '14px', textAlign: 'center' }}>No results found</div>
            )}
          </div>
        </div>
        <div className="nav-actions">
          {!user ? (
            <button className="nav-btn" onClick={() => { setAuthMode('login'); setAuthErr('') }}>
              <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Sign In
            </button>
          ) : (
            <button className="nav-btn" onClick={() => goTo('account')}>
              <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              {user.name.split(' ')[0]}
            </button>
          )}
          <button className="nav-btn" onClick={() => goTo('orders')}>
            <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>
            Orders
          </button>
          <button className="nav-btn" onClick={() => goTo('cart')} style={{ position: 'relative' }}>
            <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            Cart <span className="badge">{cartCount}</span>
          </button>
        </div>
      </header>

      <nav className="brandnav">
        {BRANDS.map(({ key, label }) => (
          <button key={key} className={"brand-tab" + (currentBrand === key && page === 'brand' ? ' active' : '')} onClick={() => filterBrand(key)}>{label}</button>
        ))}
      </nav>

      {page === 'home' && (
        <div>
          <section className="hero">
            <div className="hero-content">
              <span className="hero-eyebrow">New Collection 2025</span>
              <h1>Step<br /><em>Different</em></h1>
              <p>Premium footwear, hats, and accessories from the world's best running brands.</p>
              <button className="btn-primary" onClick={() => filterBrand('all')}>Shop Now</button>
              <button className="btn-secondary" onClick={() => filterBrand('all')}>View All</button>
            </div>
            <div className="hero-image"><PlaceholderImage product={ALL_PRODUCTS[0] || PRODUCTS[0]} size="detail" /></div>
          </section>

          <div className="marquee-section">
            <div className="marquee-inner">
              {[...BRANDS.slice(1), ...BRANDS.slice(1)].flatMap(({ label }, i) => [
                <span key={label + i}>{label}</span>,
                <span key={"d" + i} className="dot">&bull;</span>,
              ])}
            </div>
          </div>

          <section className="section">
            <div className="section-header">
              <div><h2 className="section-title">Featured <span>Products</span></h2><p className="section-subtitle">Hand-picked by our team</p></div>
              <span className="see-all" onClick={() => filterBrand('all')}>See All &rarr;</span>
            </div>
            <div className="product-grid">
              {featuredProducts.map(p => <ProductCard key={p.id} product={p} onView={viewProduct} onAddToCart={addToCart} />)}
            </div>
          </section>

          <section className="section" style={{ paddingTop: 0 }}>
            <div className="section-header"><div><h2 className="section-title">Hot <span>Deals</span></h2><p className="section-subtitle">Limited time offers</p></div></div>
            <div className="discount-grid">
              <div className="discount-card large" onClick={() => filterBrand('hoka')}>
                <div className="dc-img"><PlaceholderImage product={ALL_PRODUCTS[1] || PRODUCTS[1]} size="detail" /></div>
                <div>
                  <div className="dc-tag">Up to 40% Off</div>
                  <div className="dc-title">HOKA SALE</div>
                  <div className="dc-sub">Iconic cushioning at unbeatable prices.</div>
                  <button className="dc-btn">Shop Hoka</button>
                </div>
              </div>
              <div className="discount-card" onClick={() => filterBrand('asics')}>
                <div><div className="dc-tag">New Arrivals</div><div className="dc-title">ASICS DROP</div><div className="dc-sub">Fresh colorways just landed.</div><button className="dc-btn">Shop Now</button></div>
                <div className="dc-img-small"><PlaceholderImage product={ALL_PRODUCTS[11] || PRODUCTS[11]} size="thumb" /></div>
              </div>
              <div className="discount-card" onClick={() => filterBrand('newbalance')}>
                <div><div className="dc-tag">Flash Deal</div><div className="dc-title">NB CLASSICS</div><div className="dc-sub">Timeless style, modern comfort.</div><button className="dc-btn">Shop NB</button></div>
                <div className="dc-img-small"><PlaceholderImage product={ALL_PRODUCTS[6] || PRODUCTS[6]} size="thumb" /></div>
              </div>
            </div>
          </section>

          <section className="section" style={{ paddingTop: 0 }}>
            <div className="section-header"><div><h2 className="section-title">Trending <span>Now</span></h2><p className="section-subtitle">What everyone's wearing</p></div></div>
            <div className="product-grid">
              {trendingProducts.map(p => <ProductCard key={p.id} product={p} onView={viewProduct} onAddToCart={addToCart} />)}
            </div>
          </section>

          <section className="section" style={{ paddingTop: 0 }}>
            <div className="section-header"><div><h2 className="section-title">Shop by <span>Category</span></h2></div></div>
            <div className="cat-strip">
              {[
                { label: 'Shoes', cat: 'shoes', prod: ALL_PRODUCTS.find(p => p.category === 'shoes') },
                { label: 'Hats', cat: 'hats', prod: ALL_PRODUCTS.find(p => p.category === 'hats') },
                { label: 'Accessories', cat: 'accessories', prod: ALL_PRODUCTS.find(p => p.category === 'accessories') },
              ].map(({ label, cat, prod }) => (
                <div key={label} className="cat-card" onClick={() => filterBrand('all')}>
                  <div className="cat-card-img"><PlaceholderImage product={prod} size="card" /></div>
                  <div className="cat-card-body"><div className="cat-label">{label}</div><div className="cat-count">{PRODUCTS.filter(p => p.category === cat).length} Products</div></div>
                </div>
              ))}
            </div>
          </section>

          <footer>
            <div className="footer-grid">
              <div>
                <div className="footer-brand">BORINGTHINGS</div>
                <div className="footer-tagline">Premium footwear and accessories from the world's top running brands. Free shipping on orders over $100.</div>
                <div className="newsletter-form"><input type="email" placeholder="Your email address" /><button>Subscribe</button></div>
              </div>
              <div className="footer-col"><h4>Shop</h4><ul>{["All Products","Running Shoes","Trail Shoes","Hats & Caps","Accessories"].map(l=><li key={l}><a>{l}</a></li>)}</ul></div>
              <div className="footer-col"><h4>Brands</h4><ul>{BRANDS.slice(1).map(({key,label})=><li key={key}><a onClick={()=>filterBrand(key)}>{label}</a></li>)}</ul></div>
              <div className="footer-col"><h4>Support</h4><ul>{["FAQ","Returns","Size Guide","Track Order","Contact Us"].map(l=><li key={l}><a>{l}</a></li>)}</ul></div>
            </div>
            <div className="footer-bottom">
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <span>&copy; 2025 BoringThings. All rights reserved.</span>
                <button onClick={() => setShowAdmin(true)} style={{ background: 'none', border: 'none', color: 'var(--border)', fontSize: '11px', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase', padding: 0 }}>Admin</button>
              </div>
              <div className="footer-socials">{["X","IG","TK","YT"].map(s=><div key={s} className="social-btn">{s}</div>)}</div>
            </div>
          </footer>
        </div>
      )}

      {page === 'brand' && (
        <div>
          <div className="page-title-bar">
            <button className="back-btn" onClick={() => goTo('home')}>&larr; Back</button>
            <h2>{brandTitle}</h2>
            <span style={{ fontSize: '13px', color: 'var(--muted)', marginLeft: '8px' }}>{brandProducts.length} products</span>
          </div>
          <section className="section">
            <div className="product-grid">
              {brandProducts.map(p => <ProductCard key={p.id} product={p} onView={viewProduct} onAddToCart={addToCart} />)}
            </div>
          </section>
        </div>
      )}

      {page === 'product' && currentProduct && (
        <div className="page-pad">
          <div className="breadcrumb">
            <a onClick={() => goTo('home')}>Home</a>
            <span className="breadcrumb-sep">/</span>
            <a onClick={() => filterBrand(currentProduct.brand)}>{currentProduct.brandName}</a>
            <span className="breadcrumb-sep">/</span>
            <span>{currentProduct.name}</span>
          </div>
          <div className="product-detail">
            <div className="product-detail-img"><PlaceholderImage product={currentProduct} size="detail" /></div>
            <div>
              <div className="pd-brand">{currentProduct.brandName}</div>
              <div className="pd-name">{currentProduct.name}</div>
              <div className="pd-price-row">
                <span className="pd-price">${currentProduct.price}</span>
                {currentProduct.origPrice && <span className="pd-price-og">${currentProduct.origPrice}</span>}
                {currentProduct.origPrice && <span className="tag tag-sale">-{Math.round((1 - currentProduct.price / currentProduct.origPrice) * 100)}%</span>}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '4px' }}>
                <span className="stars">{"★".repeat(Math.floor(currentProduct.rating))}{"☆".repeat(5 - Math.floor(currentProduct.rating))}</span>
                <span style={{ marginLeft: '6px' }}>{currentProduct.rating} &middot; {currentProduct.reviews.toLocaleString()} reviews</span>
              </div>
              <div className="pd-desc">{currentProduct.desc}</div>
              <div className="pd-options">
                <label>Size</label>
                <div className="size-grid">
                  {productSizes.map(s => (
                    <button key={s} className={"size-btn" + (selectedSize === s ? ' selected' : '')} onClick={() => setSelectedSize(s)}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="qty-row">
                <label>Quantity</label>
                <div className="qty-control">
                  <button className="qty-btn" onClick={() => setSelectedQty(q => Math.max(1, q - 1))}>&#8722;</button>
                  <div className="qty-val">{selectedQty}</div>
                  <button className="qty-btn" onClick={() => setSelectedQty(q => q + 1)}>&#43;</button>
                </div>
              </div>

              <div className="pd-actions">
                <button className="pd-add-btn" onClick={() => addToCart(currentProduct.id, selectedQty, selectedSize)}>
                  Add to Cart &mdash; ${(currentProduct.price * selectedQty).toFixed(2)}
                </button>
                <div className="pd-secondary-actions">
                  <button className="pd-save-btn" onClick={() => saveForLater(currentProduct.id)}>&#9744; Save for Later</button>
                  <button className={"pd-like-btn" + (liked.includes(currentProduct.id) ? ' liked' : '')} onClick={() => toggleLike(currentProduct.id)}>
                    &#9829; {liked.includes(currentProduct.id) ? 'Liked' : 'Like'}
                  </button>
                </div>
              </div>
              <div className="pd-specs">
                <h4>Specifications</h4>
                {Object.entries(currentProduct.specs).map(([k, v]) => (
                  <div key={k} className="pd-spec-row"><span>{k}</span><span>{v}</span></div>
                ))}
              </div>
            </div>
          </div>
          {productRecs.length > 0 && (
            <div className="recs-section">
              <div className="recs-title">You Might Also Like</div>
              <div className="product-grid">
                {productRecs.map(p => <ProductCard key={p.id} product={p} onView={viewProduct} onAddToCart={addToCart} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {page === 'cart' && (
        <div>
          <div className="page-title-bar">
            <button className="back-btn" onClick={() => goTo('home')}>&larr; Continue Shopping</button>
            <h2>Your Cart</h2>
          </div>
          <div className="page-pad">
            {cart.length === 0 ? (
              <div className="empty-cart">
                <h3>Your Cart is Empty</h3>
                <p>You have not added anything yet.</p>
                <button className="btn-primary" onClick={() => goTo('home')}>Start Shopping</button>
              </div>
            ) : (
              <div className="cart-layout">
                <div>
                  {cart.map(item => {
                    const p = ALL_PRODUCTS.find(x => x.id === item.id)
                    if (!p) return null
                    return (
                      <div key={item.id + item.size} className="cart-item">
                        <div className="cart-item-img"><PlaceholderImage product={p} size="thumb" /></div>
                        <div style={{ flex: 1 }}>
                          <div className="cart-item-brand">{p.brandName}</div>
                          <div className="cart-item-name">{p.name}</div>
                          <div className="cart-item-size">Size: {item.size || '9'}</div>
                          <div className="cart-item-price">${(p.price * item.qty).toFixed(2)}</div>
                          <div className="cart-item-actions">
                            <div className="qty-control">
                              <button className="qty-btn" onClick={() => changeQty(item.id, item.size, -1)}>&#8722;</button>
                              <div className="qty-val">{item.qty}</div>
                              <button className="qty-btn" onClick={() => changeQty(item.id, item.size, 1)}>&#43;</button>
                            </div>
                            <button className="remove-btn" onClick={() => removeFromCart(item.id, item.size)}>Remove</button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="cart-summary">
                  <h3>Order Summary</h3>
                  <div className="summary-row"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                  <div className="summary-row"><span>Shipping</span><span style={{ color: 'var(--green)' }}>Free</span></div>
                  <div className="summary-row"><span>Tax (8.75%)</span><span>${tax.toFixed(2)}</span></div>
                  <div className="summary-row total"><span>Total</span><span>${(subtotal + tax).toFixed(2)}</span></div>
                  <div className="promo-input"><input type="text" placeholder="Promo code" /><button>Apply</button></div>
                  <button className="checkout-btn" onClick={() => goTo('checkout')}>Checkout &rarr;</button>
                </div>
              </div>
            )}
            <div className="recs-section">
              <div className="recs-title">You Might Also Like</div>
              <div className="product-grid">
                {cartRecs.map(p => <ProductCard key={p.id} product={p} onView={viewProduct} onAddToCart={addToCart} />)}
              </div>
            </div>
          </div>
        </div>
      )}

      {page === 'checkout' && (
        <div>
          <div className="page-title-bar">
            <button className="back-btn" onClick={() => goTo('cart')}>&larr; Back to Cart</button>
            <h2>Checkout</h2>
          </div>
          <div className="page-pad">
            <div className="checkout-grid">
              <div>
                <div className="checkout-form-section">
                  <h3>Contact Information</h3>
                  <div className="form-group"><label>Email</label><input type="email" placeholder="you@example.com" /></div>
                  <div className="form-group"><label>Phone</label><input type="tel" placeholder="+1 (555) 000-0000" /></div>
                </div>
                <div className="checkout-form-section">
                  <h3>Shipping Address</h3>
                  <div className="form-row">
                    <div className="form-group"><label>First Name</label><input type="text" placeholder="John" /></div>
                    <div className="form-group"><label>Last Name</label><input type="text" placeholder="Doe" /></div>
                  </div>
                  <div className="form-group"><label>Address</label><input type="text" placeholder="123 Main St" /></div>
                  <div className="form-row">
                    <div className="form-group"><label>City</label><input type="text" placeholder="New York" /></div>
                    <div className="form-group"><label>ZIP Code</label><input type="text" placeholder="10001" /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>State</label><input type="text" placeholder="NY" /></div>
                    <div className="form-group"><label>Country</label><input type="text" defaultValue="USA" /></div>
                  </div>
                </div>
                <div className="checkout-form-section">
                  <h3>Payment</h3>
                  <div className="stripe-payment-box">
                    <div className="stripe-secure-badge">
                      <span>&#128274;</span><span>Secure payment powered by</span>
                      <strong className="stripe-wordmark">Stripe</strong>
                    </div>
                    <p className="stripe-info">You will be taken to Stripe's secure checkout. Your card details are never stored on our servers.</p>
                    <div className="stripe-accepted">
                      {["Visa","Mastercard","Amex","Discover"].map(c=><span key={c} className="stripe-card-tag">{c}</span>)}
                    </div>
                    <button className="stripe-pay-btn" onClick={goToStripe}>
                      &#128274;&nbsp; Pay ${(subtotal * 1.0875).toFixed(2)} securely with Stripe
                    </button>
                    <p className="stripe-disclaimer">By clicking Pay you agree to our Terms of Service.</p>
                  </div>
                </div>
              </div>
              <div className="checkout-order-summary">
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', letterSpacing: '1px', marginBottom: '20px' }}>Your Order</h3>
                {cart.map(item => {
                  const p = ALL_PRODUCTS.find(x => x.id === item.id)
                  return p ? (
                    <div key={item.id + item.size} className="co-item">
                      <div className="co-item-img"><PlaceholderImage product={p} size="mini" /></div>
                      <div><div className="co-item-name">{p.name}</div><div className="co-item-size">Size {item.size} &middot; Qty {item.qty}</div></div>
                      <div className="co-item-price">${(p.price * item.qty).toFixed(2)}</div>
                    </div>
                  ) : null
                })}
                <div className="summary-row" style={{ marginTop: '16px' }}><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="summary-row"><span>Shipping</span><span style={{ color: 'var(--green)' }}>Free</span></div>
                <div className="summary-row total"><span>Total</span><span>${(subtotal * 1.0875).toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {page === 'orders' && (
        <div>
          <div className="page-title-bar">
            <button className="back-btn" onClick={() => goTo('home')}>&larr; Back</button>
            <h2>Orders</h2>
          </div>
          <div className="page-pad">
            <div className="orders-container">
              {!user ? (
                <div className="order-lookup">
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '26px', marginBottom: '6px' }}>Track Your Order</div>
                  <div style={{ fontSize: '14px', color: 'var(--taupe)', marginBottom: '24px' }}>Sign in to view orders, or look up by order number.</div>
                  <button className="form-submit" style={{ marginBottom: '16px' }} onClick={() => setAuthMode('login')}>Sign In to View Orders</button>
                  <div className="divider"><hr /><span>or guest lookup</span><hr /></div>
                  <div className="form-group"><label>Order Number</label><input type="text" placeholder="BT-XXXXX" value={guestNum} onChange={e => setGuestNum(e.target.value)} /></div>
                  <div className="form-group"><label>ZIP Code</label><input type="text" placeholder="10001" value={guestZip} onChange={e => setGuestZip(e.target.value)} /></div>
                  <button className="form-submit" onClick={() => { const found = orders.find(o => o.id === guestNum.trim().toUpperCase()); setGuestResult(found || 'notfound') }}>Look Up Order</button>
                  {guestResult === 'notfound' && <div className="form-error" style={{ marginTop: '12px' }}>Order not found. Please check the number and try again.</div>}
                  {guestResult && guestResult !== 'notfound' && (
                    <div className="order-card" style={{ marginTop: '16px' }} onClick={() => setOrderDetail(guestResult)}>
                      <div className="order-card-top">
                        <div><div className="order-num">#{guestResult.id}</div><div className="order-date">{guestResult.date}</div></div>
                        <span className={"order-status " + (STATUS_CLASS[guestResult.status] || '')}>{STATUS_LABEL[guestResult.status]}</span>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)' }}>Total: ${guestResult.total}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '36px', letterSpacing: '2px', marginBottom: '24px' }}>Your Orders</div>
                  {orders.length === 0 ? <p style={{ color: 'var(--muted)' }}>No orders yet.</p> :
                    orders.map(o => (
                      <div key={o.id} className="order-card" onClick={() => setOrderDetail(o)}>
                        <div className="order-card-top">
                          <div><div className="order-num">#{o.id}</div><div className="order-date">{o.date}</div></div>
                          <span className={"order-status " + (STATUS_CLASS[o.status] || '')}>{STATUS_LABEL[o.status]}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div className="order-items-preview">
                            {o.items.slice(0, 3).map(i => { const p = ALL_PRODUCTS.find(x => x.id === i.id); return p ? <div key={i.id} className="order-item-icon"><PlaceholderImage product={p} size="mini" /></div> : null })}
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent)' }}>${o.total}</div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {page === 'account' && user && (
        <div>
          <div className="page-title-bar">
            <button className="back-btn" onClick={() => goTo('home')}>&larr; Back</button>
            <h2>My Account</h2>
          </div>
          <div className="page-pad">
            <div className="account-container">
              <div className="account-header">
                <div className="account-avatar">{user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</div>
                <div><div className="account-name">{user.name}</div><div className="account-email">{user.email}</div></div>
                <button className="btn-secondary" style={{ marginLeft: 'auto' }} onClick={logout}>Sign Out</button>
              </div>
              <div className="account-section">
                <h3>Recent Orders</h3>
                {orders.length === 0 ? <p style={{ color: 'var(--muted)', fontSize: '14px' }}>No orders yet.</p> :
                  orders.slice(0, 3).map(o => (
                    <div key={o.id} className="order-card" onClick={() => setOrderDetail(o)}>
                      <div className="order-card-top">
                        <div><div className="order-num">#{o.id}</div><div className="order-date">{o.date}</div></div>
                        <span className={"order-status " + (STATUS_CLASS[o.status] || '')}>{STATUS_LABEL[o.status]}</span>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)' }}>${o.total}</div>
                    </div>
                  ))
                }
              </div>
              <div className="account-section">
                <h3>Saved Items</h3>
                {saved.length === 0 ? <p style={{ color: 'var(--muted)', fontSize: '14px' }}>No saved items yet.</p> :
                  <div className="product-grid">{ALL_PRODUCTS.filter(p => saved.includes(p.id)).map(p => <ProductCard key={p.id} product={p} onView={viewProduct} onAddToCart={addToCart} />)}</div>
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {authMode && (
        <div className="overlay" onClick={e => { if (e.target.classList.contains('overlay')) setAuthMode(null) }}>
          <div className="modal">
            <button className="modal-close" onClick={() => setAuthMode(null)}>&#215;</button>
            {authMode === 'login' && (<>
              <div className="modal-title">Welcome Back</div>
              <div className="modal-sub">Sign in to your BoringThings account</div>
              {authErr && <div className="form-error">{authErr}</div>}
              <div className="form-group"><label>Email</label><input type="email" placeholder="you@example.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} /></div>
              <div className="form-group"><label>Password</label><input type="password" placeholder="Your password" value={loginPass} onChange={e => setLoginPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && doLogin()} /></div>
              <button className="form-submit" onClick={doLogin} disabled={authSending}>{authSending ? 'Sending code...' : 'Continue →'}</button>
              <div className="form-toggle">No account? <a onClick={() => { setAuthMode('register'); setAuthErr('') }}>Create one</a></div>
            </>)}
            {authMode === 'verify-login' && (<>
              <div className="modal-title">Check Your Email</div>
              <div className="modal-sub">&#128231; {authCodeHint}</div>
              {authErr && <div className="form-error">{authErr}</div>}
              <div className="form-group"><label>6-Digit Code</label>
                <input className="verify-input" type="text" maxLength={6} placeholder="000000" value={authCode}
                  onChange={e => setAuthCode(e.target.value.replace(/[^0-9]/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && doVerifyLogin()} autoFocus />
              </div>
              <button className="form-submit" onClick={doVerifyLogin}>Verify &amp; Sign In &rarr;</button>
              <button style={{ width:'100%', background:'none', border:'1px solid var(--border)', color:'var(--taupe)', padding:'11px', borderRadius:'8px', marginTop:'8px', cursor:'pointer', fontSize:'13px' }}
                onClick={() => { setAuthMode('login'); setAuthErr(''); setAuthCode('') }}>&larr; Back</button>
            </>)}
            {authMode === 'register' && (<>
              <div className="modal-title">Create Account</div>
              <div className="modal-sub">Join BoringThings for exclusive deals</div>
              {authErr && <div className="form-error">{authErr}</div>}
              <div className="form-row">
                <div className="form-group"><label>First Name</label><input type="text" placeholder="John" value={regFirst} onChange={e => setRegFirst(e.target.value)} /></div>
                <div className="form-group"><label>Last Name</label><input type="text" placeholder="Doe" value={regLast} onChange={e => setRegLast(e.target.value)} /></div>
              </div>
              <div className="form-group"><label>Email</label><input type="email" placeholder="you@example.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} /></div>
              <div className="form-group"><label>Password</label><input type="password" placeholder="Min 6 characters" value={regPass} onChange={e => setRegPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && doRegister()} /></div>
              <button className="form-submit" onClick={doRegister} disabled={authSending}>{authSending ? 'Sending verification...' : 'Create Account →'}</button>
              <div className="form-toggle">Have an account? <a onClick={() => { setAuthMode('login'); setAuthErr('') }}>Sign in</a></div>
            </>)}
            {authMode === 'verify-register' && (<>
              <div className="modal-title">Verify Your Email</div>
              <div className="modal-sub">&#128231; {authCodeHint}</div>
              {authErr && <div className="form-error">{authErr}</div>}
              <div className="form-group"><label>6-Digit Code</label>
                <input className="verify-input" type="text" maxLength={6} placeholder="000000" value={authCode}
                  onChange={e => setAuthCode(e.target.value.replace(/[^0-9]/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && doVerifyRegister()} autoFocus />
              </div>
              <button className="form-submit" onClick={doVerifyRegister}>Verify &amp; Create Account &rarr;</button>
              <button style={{ width:'100%', background:'none', border:'1px solid var(--border)', color:'var(--taupe)', padding:'11px', borderRadius:'8px', marginTop:'8px', cursor:'pointer', fontSize:'13px' }}
                onClick={() => { setAuthMode('register'); setAuthErr(''); setAuthCode('') }}>&larr; Back</button>
            </>)}
          </div>
        </div>
      )}

      {orderDetail && (
        <div className="overlay" onClick={e => { if (e.target.classList.contains('overlay')) setOrderDetail(null) }}>
          <div className="modal order-detail-modal">
            <button className="modal-close" onClick={() => setOrderDetail(null)}>&#215;</button>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '30px', letterSpacing: '2px', marginBottom: '6px' }}>Order Details</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', color: 'var(--muted)' }}>#{orderDetail.id} &middot; {orderDetail.date}</div>
              <span className={"order-status " + (STATUS_CLASS[orderDetail.status] || '')}>{STATUS_LABEL[orderDetail.status]}</span>
            </div>
            {orderDetail.items.map(i => {
              const p = ALL_PRODUCTS.find(x => x.id === i.id)
              return p ? (
                <div key={i.id} className="co-item">
                  <div className="co-item-img"><PlaceholderImage product={p} size="mini" /></div>
                  <div><div className="co-item-name">{p.name}</div><div className="co-item-size">{p.brandName} &middot; Qty: {i.qty}</div></div>
                  <div className="co-item-price">${(p.price * i.qty).toFixed(2)}</div>
                </div>
              ) : null
            })}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', marginTop: '8px' }}>
              <div className="summary-row"><span>Subtotal</span><span>${(parseFloat(orderDetail.total) / 1.0875).toFixed(2)}</span></div>
              <div className="summary-row"><span>Shipping</span><span style={{ color: 'var(--green)' }}>Free</span></div>
              <div className="summary-row total"><span>Total</span><span>${orderDetail.total}</span></div>
            </div>
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', marginTop: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--muted)', marginBottom: '6px' }}>Shipping Address</div>
              <div style={{ fontSize: '14px', color: 'var(--charcoal)' }}>{orderDetail.address}</div>
            </div>
          </div>
        </div>
      )}

      {showAdmin && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 5000, overflowY: 'auto' }}>
          <AdminPanel onExit={() => setShowAdmin(false)} />
        </div>
      )}

      <div className={"toast" + (toast.show ? ' show' : '')}>{toast.msg}</div>
    </>
  )
}