import { useState, useEffect, useRef } from 'react'

// ─── PRODUCT DATA ───────────────────────────────────────────
const PRODUCTS = [
  { id:1,  brand:'hoka',       brandName:'Hoka',        name:'Clifton 9',                  category:'shoes',       price:135, origPrice:165, emoji:'👟', rating:4.8, reviews:2341, tags:['new'],  featured:true,  trending:false, desc:'The Clifton 9 delivers a supremely cushioned, lightweight ride. Redesigned midsole foam for enhanced cushioning and durability.', colors:['Black','White','Coral'], specs:{Weight:'8.9 oz',Drop:'5mm',Type:'Road Running',Surface:'Road'} },
  { id:2,  brand:'hoka',       brandName:'Hoka',        name:'Bondi 8',                    category:'shoes',       price:165, origPrice:200, emoji:'🏃', rating:4.9, reviews:3102, tags:['sale'], featured:true,  trending:true,  desc:'Maximum cushioning for maximum comfort. The Bondi 8 is our plushest road shoe yet with an extended heel design.', colors:['Navy','White','Yellow'], specs:{Weight:'10.8 oz',Drop:'4mm',Type:'Max Cushion',Surface:'Road'} },
  { id:3,  brand:'hoka',       brandName:'Hoka',        name:'Mach 6',                     category:'shoes',       price:145, origPrice:null, emoji:'⚡', rating:4.7, reviews:891,  tags:['hot'],  featured:false, trending:true,  desc:'Engineered for speed. The Mach 6 features a full-length carbon-injected plate for an explosive push-off.', colors:['Lime','Black','Blue'], specs:{Weight:'7.8 oz',Drop:'5mm',Type:'Speed',Surface:'Road'} },
  { id:4,  brand:'hoka',       brandName:'Hoka',        name:'Running Cap',                category:'hats',        price:38,  origPrice:45,  emoji:'🧢', rating:4.5, reviews:412,  tags:['sale'], featured:false, trending:false, desc:'Lightweight, moisture-wicking running cap with reflective Hoka logo and ventilation panels.', colors:['Black','White'], specs:{Material:'Recycled Polyester',Brim:'Short',Fit:'Adjustable'} },
  { id:5,  brand:'hoka',       brandName:'Hoka',        name:'Sport Bag',                  category:'accessories', price:65,  origPrice:null, emoji:'🎒', rating:4.6, reviews:223,  tags:[],       featured:false, trending:false, desc:'Versatile 22L sport bag with dedicated shoe compartment and laptop sleeve.', colors:['Black','Navy'], specs:{Volume:'22L',Material:'Ripstop Nylon',Pockets:'5'} },
  { id:6,  brand:'newbalance', brandName:'New Balance', name:'Fresh Foam X 1080v13',       category:'shoes',       price:165, origPrice:null, emoji:'👟', rating:4.9, reviews:1872, tags:['new'],  featured:true,  trending:true,  desc:'The 1080 is our most cushioned neutral trainer, designed for everyday long runs with Fresh Foam X midsole.', colors:['Black','Grey','White'], specs:{Weight:'9.7 oz',Drop:'6mm',Type:'Daily Trainer',Surface:'Road'} },
  { id:7,  brand:'newbalance', brandName:'New Balance', name:'990v6',                      category:'shoes',       price:185, origPrice:220, emoji:'🏅', rating:4.8, reviews:2203, tags:['sale'], featured:true,  trending:false, desc:'Made in USA. A classic evolved. The 990v6 blends premium pigskin suede with breathable mesh for iconic style and performance.', colors:['Grey','Navy','Brown'], specs:{Weight:'11.2 oz',Drop:'12mm',Type:'Lifestyle',Surface:'All-Day'} },
  { id:8,  brand:'newbalance', brandName:'New Balance', name:'FuelCell SuperComp Elite v4', category:'shoes',      price:250, origPrice:null, emoji:'🚀', rating:4.7, reviews:654,  tags:['hot'],  featured:false, trending:true,  desc:'Carbon plate racing shoe with FuelCell foam for maximum energy return. Built for race day.', colors:['White','Gold'], specs:{Weight:'7.3 oz',Drop:'7mm',Type:'Racing',Surface:'Road'} },
  { id:9,  brand:'newbalance', brandName:'New Balance', name:'NB Athletics Cap',           category:'hats',        price:32,  origPrice:null, emoji:'🧢', rating:4.4, reviews:318,  tags:[],       featured:false, trending:false, desc:'Classic 6-panel structured cap with embroidered NB logo. Perfect for everyday wear.', colors:['Grey','Black','Navy'], specs:{Material:'Cotton Twill',Brim:'Curved',Fit:'Snapback'} },
  { id:10, brand:'newbalance', brandName:'New Balance', name:'Running Belt',               category:'accessories', price:28,  origPrice:35,  emoji:'🎽', rating:4.3, reviews:187,  tags:['sale'], featured:false, trending:false, desc:'Lightweight running belt with secure zip pockets for phone, keys and gels.', colors:['Black'], specs:{Pockets:'3',Material:'Nylon',Fit:'Adjustable'} },
  { id:11, brand:'asics',      brandName:'Asics',       name:'Gel-Kayano 31',              category:'shoes',       price:160, origPrice:190, emoji:'👟', rating:4.8, reviews:1654, tags:['sale'], featured:true,  trending:false, desc:'Legendary stability with next-gen cushioning. The Kayano 31 features FF BLAST+ ECO midsole foam and PureGEL technology.', colors:['Black','Blue','Pink'], specs:{Weight:'9.5 oz',Drop:'10mm',Type:'Stability',Surface:'Road'} },
  { id:12, brand:'asics',      brandName:'Asics',       name:'Gel-Nimbus 26',              category:'shoes',       price:165, origPrice:null, emoji:'🌟', rating:4.9, reviews:2876, tags:['new'],  featured:true,  trending:true,  desc:'Our most plush neutral trainer. The Nimbus 26 delivers a plush ride with PureGEL technology and FF BLAST PLUS ECO foam.', colors:['White','Sage','Midnight'], specs:{Weight:'10.7 oz',Drop:'8mm',Type:'Max Cushion',Surface:'Road'} },
  { id:13, brand:'asics',      brandName:'Asics',       name:'MetaSpeed Sky+ Carbon',      category:'shoes',       price:250, origPrice:null, emoji:'💨', rating:4.7, reviews:443,  tags:['hot'],  featured:false, trending:true,  desc:'Engineered for stride runners. Carbon plate racing shoe with GUIDESOLE technology for maximum forward propulsion.', colors:['White','Blue'], specs:{Weight:'7.9 oz',Drop:'5mm',Type:'Racing',Surface:'Road'} },
  { id:14, brand:'asics',      brandName:'Asics',       name:'Performance Hat',            category:'hats',        price:36,  origPrice:42,  emoji:'🧢', rating:4.5, reviews:289,  tags:['sale'], featured:false, trending:false, desc:'Technical running hat with reflective details and sweat-wicking headband.', colors:['Black','Blue'], specs:{Material:'Polyester',Brim:'Short',Fit:'Adjustable'} },
  { id:15, brand:'asics',      brandName:'Asics',       name:'Gear Bag',                   category:'accessories', price:55,  origPrice:null, emoji:'🎒', rating:4.4, reviews:156,  tags:[],       featured:false, trending:false, desc:'18L training bag with ventilated shoe pocket and water bottle holders.', colors:['Black','Navy'], specs:{Volume:'18L',Material:'Polyester',Pockets:'4'} },
  { id:16, brand:'oncloud',    brandName:'On Cloud',    name:'Cloudmonster 2',             category:'shoes',       price:170, origPrice:null, emoji:'👟', rating:4.8, reviews:1103, tags:['new'],  featured:true,  trending:true,  desc:'Bigger clouds, bigger feel. The Cloudmonster 2 features extra-large CloudTec pods for a cushioned, springy ride.', colors:['Black','Orange','White'], specs:{Weight:'9.2 oz',Drop:'6mm',Type:'Cushioned',Surface:'Road'} },
  { id:17, brand:'oncloud',    brandName:'On Cloud',    name:'Cloudflow 4',                category:'shoes',       price:140, origPrice:160, emoji:'☁️', rating:4.7, reviews:987,  tags:['sale'], featured:false, trending:true,  desc:'Designed for tempo runs. The Cloudflow 4 delivers speed with its lightweight Helion superfoam.', colors:['Glacier','Navy','Berry'], specs:{Weight:'8.3 oz',Drop:'6mm',Type:'Speed',Surface:'Road'} },
  { id:18, brand:'oncloud',    brandName:'On Cloud',    name:'Cloud 5',                    category:'shoes',       price:130, origPrice:null, emoji:'🌤️', rating:4.6, reviews:2543, tags:['hot'],  featured:true,  trending:false, desc:'The everyday sneaker. Iconic CloudTec sole for soft landings and explosive takeoffs. Versatile from street to trail.', colors:['White','Black','Cream'], specs:{Weight:'8.8 oz',Drop:'6mm',Type:'Everyday',Surface:'Road/Street'} },
  { id:19, brand:'oncloud',    brandName:'On Cloud',    name:'Lightweight Cap',            category:'hats',        price:45,  origPrice:null, emoji:'🧢', rating:4.6, reviews:342,  tags:[],       featured:false, trending:false, desc:'Ultra-lightweight 5-panel cap with On Cloud logo. Packable design for travel.', colors:['White','Black'], specs:{Material:'Recycled Nylon',Brim:'Curved',Fit:'Adjustable'} },
  { id:20, brand:'oncloud',    brandName:'On Cloud',    name:'Running Vest',               category:'accessories', price:80,  origPrice:95,  emoji:'🎽', rating:4.7, reviews:267,  tags:['sale'], featured:false, trending:false, desc:'Lightweight running vest with 1.5L hydration pack and multiple pockets for fueling.', colors:['Black','Blue'], specs:{Volume:'1.5L',Material:'Stretch Woven',Pockets:'6'} },
  { id:21, brand:'brooks',     brandName:'Brooks',      name:'Ghost 16',                   category:'shoes',       price:140, origPrice:null, emoji:'👟', rating:4.8, reviews:4231, tags:['new'],  featured:true,  trending:true,  desc:"The world's best-selling running shoe returns. The Ghost 16 offers soft, smooth cushioning for easy everyday runs.", colors:['Black','Grey','Purple'], specs:{Weight:'9.6 oz',Drop:'12mm',Type:'Neutral',Surface:'Road'} },
  { id:22, brand:'brooks',     brandName:'Brooks',      name:'Glycerin 21',                category:'shoes',       price:160, origPrice:185, emoji:'💜', rating:4.9, reviews:1987, tags:['sale'], featured:false, trending:false, desc:"Brooks most luxurious running shoe. Nitrogen-infused DNA LOFT v3 cushioning for an ultra-plush ride.", colors:['White','Blue','Navy'], specs:{Weight:'10.1 oz',Drop:'10mm',Type:'Max Cushion',Surface:'Road'} },
  { id:23, brand:'brooks',     brandName:'Brooks',      name:'Hyperion Max 2',             category:'shoes',       price:200, origPrice:null, emoji:'⚡', rating:4.7, reviews:623,  tags:['hot'],  featured:false, trending:true,  desc:'Maximum velocity. The Hyperion Max 2 features a carbon fiber plate and super-critical DNA FLASH midsole.', colors:['Coral','Black','Lime'], specs:{Weight:'7.8 oz',Drop:'8mm',Type:'Racing',Surface:'Road'} },
  { id:24, brand:'brooks',     brandName:'Brooks',      name:'Podium Hat',                 category:'hats',        price:30,  origPrice:36,  emoji:'🧢', rating:4.4, reviews:198,  tags:['sale'], featured:false, trending:false, desc:'Classic Brooks Podium hat with moisture management sweatband and rear adjustable strap.', colors:['Black','White','Grey'], specs:{Material:'Polyester',Brim:'Curved',Fit:'Adjustable'} },
  { id:25, brand:'brooks',     brandName:'Brooks',      name:'Run Happy Socks (3-pack)',   category:'accessories', price:22,  origPrice:28,  emoji:'🧦', rating:4.6, reviews:891,  tags:['sale'], featured:false, trending:false, desc:'Run Happy Socks are engineered with strategic cushioning and mesh ventilation zones.', colors:['Multi'], specs:{Material:'Nylon/Polyester',Height:'Ankle',Pack:'3 pairs'} },
]

// ─── STORAGE HELPERS ─────────────────────────────────────────
const ls = {
  get: (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb } catch { return fb } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} },
}

function makeDemoOrders() {
  return [
    { id:'BT-20251', date:'Apr 12, 2025', status:'delivered', items:[{id:1,qty:1},{id:6,qty:1}], total:'300.00', address:'123 Main St, Newark, NJ' },
    { id:'BT-20218', date:'Mar 28, 2025', status:'delivered', items:[{id:11,qty:1}],              total:'160.00', address:'123 Main St, Newark, NJ' },
  ]
}

// ─── PRODUCT CARD ─────────────────────────────────────────────
function ProductCard({ product, onView, onAddToCart }) {
  const salePct = product.origPrice ? Math.round((1 - product.price / product.origPrice) * 100) : null
  return (
    <div className="product-card">
      <div className="product-img" onClick={() => onView(product.id)}>
        <span className="product-emoji">{product.emoji}</span>
        <div className="product-badge-wrap">
          {product.tags.includes('sale') && <span className="tag tag-sale">-{salePct}%</span>}
          {product.tags.includes('new')  && <span className="tag tag-new">New</span>}
          {product.tags.includes('hot')  && <span className="tag tag-hot">🔥 Hot</span>}
        </div>
      </div>
      <div className="product-info">
        <div className="product-brand-label">{product.brandName}</div>
        <div className="product-name" onClick={() => onView(product.id)} style={{cursor:'pointer'}}>{product.name}</div>
        <div style={{fontSize:'12px',color:'#888',marginBottom:'6px'}}>
          {'★'.repeat(Math.floor(product.rating))}{'☆'.repeat(5 - Math.floor(product.rating))}
          <span style={{marginLeft:'4px'}}>({product.reviews.toLocaleString()})</span>
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

// ─── MAIN APP ─────────────────────────────────────────────────
export default function App() {
  const [page, setPage]             = useState('home')
  const [cart, setCart]             = useState(() => ls.get('bt_cart', []))
  const [user, setUser]             = useState(() => ls.get('bt_user', null))
  const [liked, setLiked]           = useState(() => ls.get('bt_liked', []))
  const [saved, setSaved]           = useState(() => ls.get('bt_saved', []))
  const [orders, setOrders]         = useState(() => ls.get('bt_orders', null) || makeDemoOrders())
  const [currentBrand, setBrand]    = useState('all')
  const [currentProdId, setProdId]  = useState(null)
  const [authMode, setAuthMode]     = useState(null)   // 'login' | 'register' | null
  const [orderDetail, setOrderDetail] = useState(null)
  const [toast, setToast]           = useState({ msg:'', show:false })
  const [searchQ, setSearchQ]       = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [selectedSize, setSelectedSize] = useState(null)
  const toastTimer = useRef(null)

  // form state
  const [loginEmail, setLoginEmail]     = useState('')
  const [loginPass,  setLoginPass]      = useState('')
  const [regFirst,   setRegFirst]       = useState('')
  const [regLast,    setRegLast]        = useState('')
  const [regEmail,   setRegEmail]       = useState('')
  const [regPass,    setRegPass]        = useState('')
  const [authErr,    setAuthErr]        = useState('')
  const [guestNum,   setGuestNum]       = useState('')
  const [guestZip,   setGuestZip]       = useState('')
  const [guestResult, setGuestResult]   = useState(null)

  // persist
  useEffect(() => ls.set('bt_cart',   cart),   [cart])
  useEffect(() => ls.set('bt_user',   user),   [user])
  useEffect(() => ls.set('bt_liked',  liked),  [liked])
  useEffect(() => ls.set('bt_saved',  saved),  [saved])
  useEffect(() => ls.set('bt_orders', orders), [orders])

  function showToast(msg) {
    clearTimeout(toastTimer.current)
    setToast({ msg, show: true })
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2800)
  }

  function goTo(p) { setPage(p); window.scrollTo(0,0) }

  // ── Cart ──
  const cartCount = cart.reduce((s,c) => s+c.qty, 0)

  function addToCart(id) {
    setCart(prev => {
      const ex = prev.find(c => c.id === id)
      return ex ? prev.map(c => c.id===id ? {...c,qty:c.qty+1} : c) : [...prev, {id,qty:1,size:'9'}]
    })
    showToast('Added to cart! 🛒')
  }

  function changeQty(id, delta) {
    setCart(prev => prev.map(c => c.id===id ? {...c,qty:Math.max(1,c.qty+delta)} : c))
  }

  function removeFromCart(id) {
    setCart(prev => prev.filter(c => c.id !== id))
    showToast('Item removed')
  }

  const subtotal = cart.reduce((s,c) => { const p=PRODUCTS.find(x=>x.id===c.id); return s+(p?p.price*c.qty:0) }, 0)
  const tax = subtotal * 0.08

  // ── Product detail ──
  function viewProduct(id) { setProdId(id); setSelectedSize(null); goTo('product') }

  // ── Brand filter ──
  function filterBrand(b) { setBrand(b); goTo('brand') }

  const brandProducts = currentBrand==='all' ? PRODUCTS : PRODUCTS.filter(p=>p.brand===currentBrand)
  const brandTitles = { all:'All Products', hoka:'Hoka', newbalance:'New Balance', asics:'Asics', oncloud:'On Cloud', brooks:'Brooks' }

  // ── Auth ──
  function doLogin() {
    setAuthErr('')
    if (!loginEmail || !loginPass) { setAuthErr('Please fill all fields.'); return }
    const accounts = ls.get('bt_accounts', [])
    const match = accounts.find(u => u.email===loginEmail && u.password===loginPass)
    if (!match) { setAuthErr('Invalid email or password.'); return }
    const u = { name:match.name, email:match.email }
    setUser(u)
    setAuthMode(null)
    setLoginEmail(''); setLoginPass('')
    showToast(`Welcome back, ${match.name.split(' ')[0]}! 👋`)
  }

  function doRegister() {
    setAuthErr('')
    if (!regFirst||!regLast||!regEmail||!regPass) { setAuthErr('Please fill all fields.'); return }
    if (regPass.length < 6) { setAuthErr('Password must be at least 6 characters.'); return }
    const accounts = ls.get('bt_accounts', [])
    if (accounts.find(u=>u.email===regEmail)) { setAuthErr('An account with this email already exists.'); return }
    ls.set('bt_accounts', [...accounts, { name:`${regFirst} ${regLast}`, email:regEmail, password:regPass }])
    const u = { name:`${regFirst} ${regLast}`, email:regEmail }
    setUser(u)
    setAuthMode(null)
    setRegFirst(''); setRegLast(''); setRegEmail(''); setRegPass('')
    showToast(`Account created! Welcome, ${regFirst}! 🎉`)
  }

  function logout() { setUser(null); goTo('home'); showToast('Signed out. See you soon!') }

  // ── Like / Save ──
  function toggleLike(id) {
    setLiked(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev,id])
    showToast(liked.includes(id) ? 'Removed from liked' : '♥ Added to liked')
  }
  function saveForLater(id) {
    if (!saved.includes(id)) { setSaved(prev=>[...prev,id]); showToast('🔖 Saved for later!') }
    else showToast('Already saved')
  }

  // ── Orders ──
  function placeOrder() {
    const newOrder = {
      id: 'BT-' + Math.floor(10000+Math.random()*90000),
      date: new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}),
      status: 'processing',
      items: [...cart],
      total: (subtotal*1.08).toFixed(2),
      address: 'Shipping address entered at checkout'
    }
    setOrders(prev => [newOrder, ...prev])
    setCart([])
    showToast('🎉 Order placed! Order #' + newOrder.id)
    goTo('orders')
  }

  // ── Search ──
  const searchResults = searchQ.trim().length > 1
    ? PRODUCTS.filter(p => {
        const str = (p.name+' '+p.brandName+' '+p.category+' '+p.desc).toLowerCase()
        const q = searchQ.toLowerCase()
        if (str.includes(q)) return true
        for (let i=0; i<=q.length-3; i++) if (str.includes(q.slice(i,i+3))) return true
        return false
      }).slice(0,6)
    : []

  // ─── CURRENT PRODUCT ──────────────────────────────────────
  const currentProduct = PRODUCTS.find(p => p.id === currentProdId)
  const productSizes = currentProduct
    ? currentProduct.category==='shoes' ? ['7','7.5','8','8.5','9','9.5','10','10.5','11','12']
    : currentProduct.category==='hats'  ? ['S/M','L/XL']
    : ['One Size']
    : []

  const recs = currentProduct
    ? PRODUCTS.filter(p => p.id!==currentProdId && (p.brand===currentProduct.brand || p.category===currentProduct.category)).slice(0,4)
    : []

  // ─── ORDER STATUS ──────────────────────────────────────────
  function statusClass(s) { return { delivered:'status-delivered', shipped:'status-shipped', processing:'status-processing' }[s]||'' }
  function statusLabel(s) { return { delivered:'Delivered ✓', shipped:'Shipped 📦', processing:'Processing ⚙️' }[s]||s }

  // ─── RENDER ───────────────────────────────────────────────
  return (
    <>
      {/* ── TOP BAR ── */}
      <header className="topbar">
        <div className="brand" onClick={() => goTo('home')}>BORING<span>THINGS</span></div>

        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search shoes, brands, styles..."
            value={searchQ}
            onChange={e => { setSearchQ(e.target.value); setSearchOpen(true) }}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
          />
          <div className={`search-results${searchOpen && searchResults.length > 0 ? ' open' : ''}`}>
            {searchResults.map(p => (
              <div key={p.id} className="search-result-item" onClick={() => { viewProduct(p.id); setSearchQ(''); setSearchOpen(false) }}>
                <span style={{fontSize:'28px'}}>{p.emoji}</span>
                <div><div className="sr-name">{p.name}</div><div className="sr-brand">{p.brandName} · {p.category}</div></div>
                <span className="sr-price">${p.price}</span>
              </div>
            ))}
            {searchQ.trim().length > 1 && searchResults.length === 0 && (
              <div style={{padding:'14px',color:'var(--gray4)',fontSize:'13px'}}>No results found</div>
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
          <button className="nav-btn" onClick={() => goTo('cart')} style={{position:'relative'}}>
            <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            Cart
            <span className="badge">{cartCount}</span>
          </button>
        </div>
      </header>

      {/* ── BRAND NAV ── */}
      <nav className="brandnav">
        {[['all','Show All'],['hoka','Hoka'],['newbalance','New Balance'],['asics','Asics'],['oncloud','On Cloud'],['brooks','Brooks']].map(([k,label]) => (
          <button key={k} className={`brand-tab${currentBrand===k && page==='brand' ? ' active' : ''}`} onClick={() => filterBrand(k)}>{label}</button>
        ))}
      </nav>

      {/* ══════════════ HOME PAGE ══════════════ */}
      {page === 'home' && (
        <div>
          <section className="hero">
            <div className="hero-content">
              <span className="hero-eyebrow">✦ New Collection 2025</span>
              <h1>Step<br/><em>Different</em></h1>
              <p>Premium footwear, hats, and accessories. Curated from the world's best running brands.</p>
              <button className="btn-primary" onClick={() => filterBrand('all')}>Shop Now</button>
              <button className="btn-secondary" onClick={() => filterBrand('all')}>View Brands</button>
            </div>
            <div className="hero-visual">👟</div>
          </section>

          <div className="marquee-section">
            <div className="marquee-inner">
              {['Hoka','•','New Balance','•','Asics','•','On Cloud','•','Brooks','•','Hoka','•','New Balance','•','Asics','•','On Cloud','•','Brooks','•'].map((t,i) => <span key={i}>{t}</span>)}
            </div>
          </div>

          {/* Featured */}
          <section className="section">
            <div className="section-header">
              <div><h2 className="section-title">Featured <span>Products</span></h2><p className="section-subtitle">Hand-picked by our team</p></div>
              <span className="see-all" onClick={() => filterBrand('all')}>See All →</span>
            </div>
            <div className="product-grid">
              {PRODUCTS.filter(p=>p.featured).slice(0,4).map(p => <ProductCard key={p.id} product={p} onView={viewProduct} onAddToCart={addToCart}/>)}
            </div>
          </section>

          {/* Hot Deals */}
          <section className="section" style={{paddingTop:0}}>
            <div className="section-header">
              <div><h2 className="section-title">Hot <span>Deals</span></h2><p className="section-subtitle">Limited time offers</p></div>
            </div>
            <div className="discount-grid">
              <div className="discount-card large" onClick={() => filterBrand('hoka')}>
                <div>
                  <div className="dc-tag">🔥 Up to 40% Off</div>
                  <div className="dc-title">HOKA SALE</div>
                  <div className="dc-sub">Iconic cushioning at unbeatable prices. This weekend only.</div>
                  <button className="dc-btn">Shop Hoka Sale</button>
                </div>
                <div className="dc-emoji">👟</div>
              </div>
              <div className="discount-card" onClick={() => filterBrand('asics')}>
                <div className="dc-tag">💫 New Arrivals</div>
                <div className="dc-title">ASICS DROP</div>
                <div className="dc-sub">Fresh colorways just landed.</div>
                <button className="dc-btn">Shop Now</button>
                <div className="dc-emoji">🏃</div>
              </div>
              <div className="discount-card" onClick={() => filterBrand('newbalance')}>
                <div className="dc-tag">⚡ Flash Deal</div>
                <div className="dc-title">NB CLASSICS</div>
                <div className="dc-sub">Timeless style, modern comfort.</div>
                <button className="dc-btn">Shop NB</button>
                <div className="dc-emoji">🎽</div>
              </div>
            </div>
          </section>

          {/* Trending */}
          <section className="section" style={{paddingTop:0}}>
            <div className="section-header">
              <div><h2 className="section-title">Trending <span>Now</span></h2><p className="section-subtitle">What everyone's wearing</p></div>
            </div>
            <div className="product-grid">
              {PRODUCTS.filter(p=>p.trending).slice(0,4).map(p => <ProductCard key={p.id} product={p} onView={viewProduct} onAddToCart={addToCart}/>)}
            </div>
          </section>

          {/* Categories */}
          <section className="section" style={{paddingTop:0}}>
            <div className="section-header"><div><h2 className="section-title">Shop by <span>Category</span></h2></div></div>
            <div className="cat-strip">
              {[['👟','Shoes','48'],['🧢','Hats','24'],['🎒','Accessories','36']].map(([icon,label,count]) => (
                <div key={label} className="cat-card" onClick={() => filterBrand('all')}>
                  <span className="cat-icon">{icon}</span>
                  <div><div className="cat-label">{label}</div><div className="cat-count">{count} Products</div></div>
                </div>
              ))}
            </div>
          </section>

          {/* Footer */}
          <footer>
            <div className="footer-grid">
              <div>
                <div className="footer-brand">BORINGTHINGS</div>
                <div className="footer-tagline">Premium footwear and accessories from the world's top running brands. Free shipping on orders over $100.</div>
                <div className="newsletter-form"><input type="email" placeholder="Your email address"/><button>Subscribe</button></div>
              </div>
              <div className="footer-col"><h4>Shop</h4><ul>{['All Products','Running Shoes','Trail Shoes','Hats & Caps','Accessories'].map(l=><li key={l}><a>{l}</a></li>)}</ul></div>
              <div className="footer-col"><h4>Brands</h4><ul>{['Hoka','New Balance','Asics','On Cloud','Brooks'].map(l=><li key={l}><a>{l}</a></li>)}</ul></div>
              <div className="footer-col"><h4>Support</h4><ul>{['FAQ','Returns','Size Guide','Track Order','Contact Us'].map(l=><li key={l}><a>{l}</a></li>)}</ul></div>
            </div>
            <div className="footer-bottom">
              <div>© 2025 BoringThings. All rights reserved.</div>
              <div className="footer-socials">
                {['𝕏','IG','TK','YT'].map(s=><div key={s} className="social-btn">{s}</div>)}
              </div>
            </div>
          </footer>
        </div>
      )}

      {/* ══════════════ BRAND PAGE ══════════════ */}
      {page === 'brand' && (
        <div>
          <div className="page-title-bar">
            <button className="back-btn" onClick={() => goTo('home')}>← Back</button>
            <h2>{brandTitles[currentBrand] || 'Products'}</h2>
          </div>
          <section className="section">
            <div className="product-grid">
              {brandProducts.map(p => <ProductCard key={p.id} product={p} onView={viewProduct} onAddToCart={addToCart}/>)}
            </div>
          </section>
        </div>
      )}

      {/* ══════════════ PRODUCT DETAIL ══════════════ */}
      {page === 'product' && currentProduct && (
        <div className="page-pad">
          <div className="breadcrumb">
            <span style={{cursor:'pointer'}} onClick={()=>goTo('home')}>Home</span>
            <span className="breadcrumb-sep">›</span>
            <span style={{cursor:'pointer'}} onClick={()=>filterBrand(currentProduct.brand)}>{currentProduct.brandName}</span>
            <span className="breadcrumb-sep">›</span>
            <span>{currentProduct.name}</span>
          </div>

          <div className="product-detail">
            <div className="product-detail-img">{currentProduct.emoji}</div>
            <div className="product-detail-info">
              <div className="pd-brand">{currentProduct.brandName}</div>
              <div className="pd-name">{currentProduct.name}</div>
              <div className="pd-price-row">
                <span className="pd-price">${currentProduct.price}</span>
                {currentProduct.origPrice && <span className="pd-price-og">${currentProduct.origPrice}</span>}
                {currentProduct.origPrice && <span className="tag tag-sale">-{Math.round((1-currentProduct.price/currentProduct.origPrice)*100)}%</span>}
              </div>
              <div style={{fontSize:'13px',color:'#888',marginBottom:'16px'}}>
                {'★'.repeat(Math.floor(currentProduct.rating))}{'☆'.repeat(5-Math.floor(currentProduct.rating))}
                <span style={{marginLeft:'6px'}}>{currentProduct.rating} · {currentProduct.reviews.toLocaleString()} reviews</span>
              </div>
              <div className="pd-desc">{currentProduct.desc}</div>

              <div className="pd-options">
                <label>Size</label>
                <div className="size-grid">
                  {productSizes.map(s => (
                    <button key={s} className={`size-btn${selectedSize===s?' selected':''}`} onClick={() => setSelectedSize(s)}>{s}</button>
                  ))}
                </div>
              </div>

              <div style={{marginBottom:'16px'}}>
                <label style={{fontSize:'12px',fontWeight:700,textTransform:'uppercase',letterSpacing:'1px',color:'var(--gray4)',display:'block',marginBottom:'8px'}}>Color</label>
                <div style={{display:'flex',gap:'8px'}}>
                  {currentProduct.colors.map(c => <span key={c} style={{fontSize:'13px',background:'var(--gray2)',padding:'5px 12px',borderRadius:'6px',border:'1px solid var(--border)'}}>{c}</span>)}
                </div>
              </div>

              <div className="pd-actions">
                <button className="pd-add-btn" onClick={() => addToCart(currentProduct.id)}>Add to Cart</button>
                <div className="pd-secondary-actions">
                  <button className="pd-save-btn" onClick={() => saveForLater(currentProduct.id)}>🔖 Save for Later</button>
                  <button className={`pd-like-btn${liked.includes(currentProduct.id)?' liked':''}`} onClick={() => toggleLike(currentProduct.id)}>
                    ♥ {liked.includes(currentProduct.id) ? 'Liked' : 'Like'}
                  </button>
                </div>
              </div>

              <div className="pd-specs">
                <h4>Specifications</h4>
                {Object.entries(currentProduct.specs).map(([k,v]) => (
                  <div key={k} className="pd-spec-row"><span>{k}</span><span>{v}</span></div>
                ))}
              </div>
            </div>
          </div>

          {recs.length > 0 && (
            <div className="recs-section">
              <div className="recs-title">You Might Also Like</div>
              <div className="product-grid">
                {recs.map(p => <ProductCard key={p.id} product={p} onView={viewProduct} onAddToCart={addToCart}/>)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════ CART ══════════════ */}
      {page === 'cart' && (
        <div>
          <div className="page-title-bar">
            <button className="back-btn" onClick={() => goTo('home')}>← Continue Shopping</button>
            <h2>Your Cart</h2>
          </div>
          <div className="page-pad">
            {cart.length === 0 ? (
              <div className="empty-cart">
                <div className="empty-cart-icon">🛒</div>
                <h3>Your Cart is Empty</h3>
                <p>Looks like you haven't added anything yet.</p>
                <button className="btn-primary" onClick={() => goTo('home')}>Start Shopping</button>
              </div>
            ) : (
              <div className="cart-layout">
                <div>
                  {cart.map(item => {
                    const p = PRODUCTS.find(x => x.id===item.id)
                    if (!p) return null
                    return (
                      <div key={item.id} className="cart-item">
                        <div className="cart-item-img">{p.emoji}</div>
                        <div style={{flex:1}}>
                          <div className="cart-item-brand">{p.brandName}</div>
                          <div className="cart-item-name">{p.name}</div>
                          <div className="cart-item-size">Size: {item.size || '9'}</div>
                          <div className="cart-item-price">${(p.price*item.qty).toFixed(2)}</div>
                          <div className="cart-item-actions">
                            <div className="qty-control">
                              <button className="qty-btn" onClick={() => changeQty(item.id,-1)}>−</button>
                              <span className="qty-val">{item.qty}</span>
                              <button className="qty-btn" onClick={() => changeQty(item.id,1)}>+</button>
                            </div>
                            <button className="remove-btn" onClick={() => removeFromCart(item.id)}>Remove</button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="cart-summary">
                  <h3>Order Summary</h3>
                  <div className="summary-row"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                  <div className="summary-row"><span>Shipping</span><span style={{color:'#7CFC00'}}>Free</span></div>
                  <div className="summary-row"><span>Estimated Tax</span><span>${tax.toFixed(2)}</span></div>
                  <div className="summary-row total"><span>Total</span><span>${(subtotal+tax).toFixed(2)}</span></div>
                  <div className="promo-input"><input type="text" placeholder="Promo code"/><button>Apply</button></div>
                  <button className="checkout-btn" onClick={() => goTo('checkout')}>Checkout →</button>
                </div>
              </div>
            )}

            {/* Cart recs */}
            <div className="recs-section">
              <div className="recs-title">Recommended For You</div>
              <div className="product-grid">
                {PRODUCTS.filter(p => !cart.map(c=>c.id).includes(p.id)).slice(0,4).map(p =>
                  <ProductCard key={p.id} product={p} onView={viewProduct} onAddToCart={addToCart}/>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ CHECKOUT ══════════════ */}
      {page === 'checkout' && (
        <div>
          <div className="page-title-bar">
            <button className="back-btn" onClick={() => goTo('cart')}>← Back to Cart</button>
            <h2>Checkout</h2>
          </div>
          <div className="page-pad">
            <div className="checkout-grid">
              <div>
                <div className="checkout-form-section" style={{marginBottom:'20px'}}>
                  <h3>Contact Info</h3>
                  <div className="form-group"><label>Email</label><input type="email" placeholder="you@example.com"/></div>
                  <div className="form-group"><label>Phone</label><input type="tel" placeholder="+1 (555) 000-0000"/></div>
                </div>
                <div className="checkout-form-section" style={{marginBottom:'20px'}}>
                  <h3>Shipping Address</h3>
                  <div className="form-row">
                    <div className="form-group"><label>First Name</label><input type="text" placeholder="John"/></div>
                    <div className="form-group"><label>Last Name</label><input type="text" placeholder="Doe"/></div>
                  </div>
                  <div className="form-group"><label>Address</label><input type="text" placeholder="123 Main St"/></div>
                  <div className="form-row">
                    <div className="form-group"><label>City</label><input type="text" placeholder="New York"/></div>
                    <div className="form-group"><label>ZIP Code</label><input type="text" placeholder="10001"/></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>State</label><input type="text" placeholder="NY"/></div>
                    <div className="form-group"><label>Country</label><input type="text" placeholder="USA" defaultValue="USA"/></div>
                  </div>
                </div>
                <div className="checkout-form-section">
                  <h3>Payment</h3>
                  <div className="form-group"><label>Card Number</label><input type="text" placeholder="4242 4242 4242 4242"/></div>
                  <div className="form-row">
                    <div className="form-group"><label>Expiry</label><input type="text" placeholder="MM / YY"/></div>
                    <div className="form-group"><label>CVV</label><input type="text" placeholder="•••"/></div>
                  </div>
                  <div className="form-group"><label>Name on Card</label><input type="text" placeholder="John Doe"/></div>
                  <button className="form-submit" style={{marginTop:'8px'}} onClick={placeOrder}>Place Order →</button>
                </div>
              </div>
              <div className="checkout-order-summary">
                <h3 style={{fontFamily:'var(--font-display)',fontSize:'28px',letterSpacing:'1px',marginBottom:'20px'}}>Your Order</h3>
                {cart.map(item => {
                  const p = PRODUCTS.find(x=>x.id===item.id)
                  return p ? (
                    <div key={item.id} className="co-item">
                      <div className="co-item-img">{p.emoji}</div>
                      <div><div className="co-item-name">{p.name}</div><div className="co-item-size">Qty: {item.qty}</div></div>
                      <div className="co-item-price">${(p.price*item.qty).toFixed(2)}</div>
                    </div>
                  ) : null
                })}
                <div className="summary-row" style={{marginTop:'16px'}}><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="summary-row"><span>Shipping</span><span style={{color:'#7CFC00'}}>Free</span></div>
                <div className="summary-row total"><span>Total</span><span>${(subtotal*1.08).toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ ORDERS ══════════════ */}
      {page === 'orders' && (
        <div>
          <div className="page-title-bar">
            <button className="back-btn" onClick={() => goTo('home')}>← Back</button>
            <h2>Orders</h2>
          </div>
          <div className="page-pad">
            <div className="orders-container">
              {!user ? (
                <div className="order-lookup">
                  <div style={{fontFamily:'var(--font-display)',fontSize:'28px',marginBottom:'8px'}}>Track Order</div>
                  <div style={{fontSize:'14px',color:'var(--gray4)',marginBottom:'24px'}}>Sign in to view your orders, or look up by order details.</div>
                  <button className="form-submit" style={{marginBottom:'16px'}} onClick={() => setAuthMode('login')}>Sign In to View Orders</button>
                  <div className="divider"><hr/><span>or look up guest order</span><hr/></div>
                  <div className="form-group"><label>Order Number</label><input type="text" placeholder="BT-XXXXX" value={guestNum} onChange={e=>setGuestNum(e.target.value)}/></div>
                  <div className="form-group"><label>ZIP Code</label><input type="text" placeholder="10001" value={guestZip} onChange={e=>setGuestZip(e.target.value)}/></div>
                  <button className="form-submit" onClick={() => {
                    const found = orders.find(o => o.id === guestNum.trim().toUpperCase())
                    setGuestResult(found || 'notfound')
                  }}>Look Up Order</button>
                  {guestResult === 'notfound' && <div style={{color:'var(--accent2)',fontSize:'13px',marginTop:'12px'}}>Order not found. Please check the number and try again.</div>}
                  {guestResult && guestResult !== 'notfound' && (
                    <div className="order-card" style={{marginTop:'16px'}} onClick={() => setOrderDetail(guestResult)}>
                      <div className="order-card-top">
                        <div><div className="order-num">#{guestResult.id}</div><div className="order-date">{guestResult.date}</div></div>
                        <span className={`order-status ${statusClass(guestResult.status)}`}>{statusLabel(guestResult.status)}</span>
                      </div>
                      <div style={{fontSize:'14px',fontWeight:700,color:'var(--accent)'}}>Total: ${guestResult.total}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{fontFamily:'var(--font-display)',fontSize:'40px',letterSpacing:'2px',marginBottom:'28px'}}>Your Orders</div>
                  {orders.length === 0 ? (
                    <p style={{color:'var(--gray4)'}}>No orders yet.</p>
                  ) : orders.map(o => (
                    <div key={o.id} className="order-card" onClick={() => setOrderDetail(o)}>
                      <div className="order-card-top">
                        <div><div className="order-num">#{o.id}</div><div className="order-date">{o.date}</div></div>
                        <span className={`order-status ${statusClass(o.status)}`}>{statusLabel(o.status)}</span>
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <div className="order-items-preview">
                          {o.items.slice(0,3).map(i => { const p=PRODUCTS.find(x=>x.id===i.id); return p ? <div key={i.id} className="order-item-icon">{p.emoji}</div> : null })}
                        </div>
                        <div style={{fontSize:'15px',fontWeight:700,color:'var(--accent)'}}>${o.total}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ ACCOUNT ══════════════ */}
      {page === 'account' && user && (
        <div>
          <div className="page-title-bar">
            <button className="back-btn" onClick={() => goTo('home')}>← Back</button>
            <h2>My Account</h2>
          </div>
          <div className="page-pad">
            <div className="account-container">
              <div className="account-header">
                <div className="account-avatar">{user.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}</div>
                <div>
                  <div className="account-name">{user.name}</div>
                  <div className="account-email">{user.email}</div>
                </div>
                <button className="btn-secondary" style={{marginLeft:'auto'}} onClick={logout}>Sign Out</button>
              </div>
              <div className="account-section">
                <h3>Recent Orders</h3>
                {orders.length === 0 ? <p style={{color:'var(--gray4)',fontSize:'14px'}}>No orders yet.</p> :
                  orders.slice(0,3).map(o => (
                    <div key={o.id} className="order-card" onClick={() => setOrderDetail(o)}>
                      <div className="order-card-top">
                        <div><div className="order-num">#{o.id}</div><div className="order-date">{o.date}</div></div>
                        <span className={`order-status ${statusClass(o.status)}`}>{statusLabel(o.status)}</span>
                      </div>
                      <div style={{fontSize:'14px',fontWeight:700,color:'var(--accent)'}}>${o.total}</div>
                    </div>
                  ))
                }
              </div>
              <div className="account-section">
                <h3>Saved Items</h3>
                {saved.length === 0 ? <p style={{color:'var(--gray4)',fontSize:'14px'}}>No saved items yet.</p> : (
                  <div className="product-grid">
                    {PRODUCTS.filter(p=>saved.includes(p.id)).map(p => <ProductCard key={p.id} product={p} onView={viewProduct} onAddToCart={addToCart}/>)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ AUTH MODAL ══════════════ */}
      {authMode && (
        <div className="overlay" onClick={e => { if(e.target.classList.contains('overlay')) setAuthMode(null) }}>
          <div className="modal">
            <button className="modal-close" onClick={() => setAuthMode(null)}>×</button>
            {authMode === 'login' ? (
              <>
                <div className="modal-title">Welcome Back</div>
                <div className="modal-sub">Sign in to your BoringThings account</div>
                {authErr && <div className="form-error">{authErr}</div>}
                <div className="form-group"><label>Email</label><input type="email" placeholder="you@example.com" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)}/></div>
                <div className="form-group"><label>Password</label><input type="password" placeholder="••••••••" value={loginPass} onChange={e=>setLoginPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doLogin()}/></div>
                <button className="form-submit" onClick={doLogin}>Sign In →</button>
                <div className="form-toggle">Don't have an account? <a onClick={() => { setAuthMode('register'); setAuthErr('') }}>Create one</a></div>
              </>
            ) : (
              <>
                <div className="modal-title">Create Account</div>
                <div className="modal-sub">Join BoringThings for exclusive deals</div>
                {authErr && <div className="form-error">{authErr}</div>}
                <div className="form-row">
                  <div className="form-group"><label>First Name</label><input type="text" placeholder="John" value={regFirst} onChange={e=>setRegFirst(e.target.value)}/></div>
                  <div className="form-group"><label>Last Name</label><input type="text" placeholder="Doe" value={regLast} onChange={e=>setRegLast(e.target.value)}/></div>
                </div>
                <div className="form-group"><label>Email</label><input type="email" placeholder="you@example.com" value={regEmail} onChange={e=>setRegEmail(e.target.value)}/></div>
                <div className="form-group"><label>Password</label><input type="password" placeholder="Min 6 characters" value={regPass} onChange={e=>setRegPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doRegister()}/></div>
                <button className="form-submit" onClick={doRegister}>Create Account →</button>
                <div className="form-toggle">Already have an account? <a onClick={() => { setAuthMode('login'); setAuthErr('') }}>Sign in</a></div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════════════ ORDER DETAIL MODAL ══════════════ */}
      {orderDetail && (
        <div className="overlay" onClick={e => { if(e.target.classList.contains('overlay')) setOrderDetail(null) }}>
          <div className="modal order-detail-modal">
            <button className="modal-close" onClick={() => setOrderDetail(null)}>×</button>
            <div style={{fontFamily:'var(--font-display)',fontSize:'32px',letterSpacing:'2px',marginBottom:'6px'}}>Order Details</div>
            <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'20px'}}>
              <div style={{color:'var(--gray4)',fontSize:'13px'}}>#{orderDetail.id} · {orderDetail.date}</div>
              <span className={`order-status ${statusClass(orderDetail.status)}`}>{statusLabel(orderDetail.status)}</span>
            </div>
            {orderDetail.items.map(i => {
              const p = PRODUCTS.find(x=>x.id===i.id)
              return p ? (
                <div key={i.id} className="co-item">
                  <div className="co-item-img">{p.emoji}</div>
                  <div><div className="co-item-name">{p.name}</div><div className="co-item-size">{p.brandName} · Qty: {i.qty}</div></div>
                  <div className="co-item-price">${(p.price*i.qty).toFixed(2)}</div>
                </div>
              ) : null
            })}
            <div style={{borderTop:'1px solid var(--border)',paddingTop:'16px',marginTop:'8px'}}>
              <div className="summary-row"><span>Subtotal</span><span>${(parseFloat(orderDetail.total)/1.08).toFixed(2)}</span></div>
              <div className="summary-row"><span>Shipping</span><span style={{color:'#7CFC00'}}>Free</span></div>
              <div className="summary-row total"><span>Total</span><span>${orderDetail.total}</span></div>
            </div>
            <div style={{borderTop:'1px solid var(--border)',paddingTop:'16px',marginTop:'8px'}}>
              <div style={{fontSize:'12px',fontWeight:700,textTransform:'uppercase',letterSpacing:'1px',color:'var(--gray4)',marginBottom:'6px'}}>Shipping Address</div>
              <div style={{fontSize:'14px'}}>{orderDetail.address}</div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ TOAST ══════════════ */}
      <div className={`toast${toast.show ? ' show' : ''}`}>{toast.msg}</div>
    </>
  )
}
