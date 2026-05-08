// ============================================================
// AdminPanel.jsx — BoringThings Admin Dashboard
// Route: click the hidden trigger or go to /#/admin
// ============================================================
import { useState, useEffect } from 'react'
import {
  ADMIN_EMAIL,
  validateAdminCredentials,
  getAttemptStatus,
  recordFailedAttempt,
  clearAttempts,
  createSession,
  getSession,
  destroySession,
  isAdminLoggedIn,
  logAdminAction,
  getAdminLog,
} from './adminAuth'
import {
  generateCode,
  sendVerificationEmail,
  storePendingCode,
  verifyCode,
} from './emailService'
import { PRODUCTS as BASE_PRODUCTS } from '../products'

// ── Local storage helpers ────────────────────────────────────
const ls = {
  get: (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb } catch { return fb } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} },
}

const STRIPE_LINK = 'https://buy.stripe.com/test_8x2bJ07hF6PTbOu1iGdIA00'

// ── Product catalog ─────────────────────────────────────────
// Reads admin-saved products from localStorage.
// If no admin products saved yet, seeds from base catalog so all products
// are visible and editable in the admin panel right away.
function getProducts() {
  const saved = ls.get('bt_admin_products', null)
  if (saved) return saved
  // First time: seed from products.js so existing items show up
  const seeded = BASE_PRODUCTS.map(p => ({ ...p, quantity: p.quantity || 0, active: true }))
  ls.set('bt_admin_products', seeded)
  return seeded
}
function saveProducts(products) {
  ls.set('bt_admin_products', products)
}

// ── Empty product template ────────────────────────────────────
const EMPTY_PRODUCT = {
  id: null, brand: 'hoka', brandName: 'Hoka', name: '', category: 'shoes', stripePriceId: '',
  price: '', origPrice: '', emoji: '👟', rating: 4.5, reviews: 0,
  tags: [], featured: false, trending: false, desc: '',
  colors: '', specs: '', quantity: 0, active: true,
}

const BRAND_OPTIONS = [
  { key: 'hoka',       label: 'Hoka'        },
  { key: 'newbalance', label: 'New Balance'  },
  { key: 'asics',      label: 'Asics'       },
  { key: 'oncloud',    label: 'On Cloud'    },
  { key: 'brooks',     label: 'Brooks'      },
]

const BRAND_NAME_MAP = { hoka:'Hoka', newbalance:'New Balance', asics:'Asics', oncloud:'On Cloud', brooks:'Brooks' }

// ── Admin Panel ───────────────────────────────────────────────
export default function AdminPanel({ onExit }) {
  const [authed, setAuthed]     = useState(isAdminLoggedIn)
  const [step, setStep]         = useState('login')  // login | verify | dashboard
  const [tab, setTab]           = useState('products')

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPass,  setLoginPass]  = useState('')
  const [loginErr,   setLoginErr]   = useState('')
  const [verifyInput, setVerifyInput] = useState('')
  const [verifyErr,   setVerifyErr]   = useState('')
  const [sendingCode, setSendingCode] = useState(false)
  const [codeHint,    setCodeHint]    = useState('')

  // Products state
  const [products,     setProducts]     = useState(() => getProducts() || [])
  const [editProduct,  setEditProduct]  = useState(null)   // null = list, object = form
  const [productErr,   setProductErr]   = useState('')
  const [productMsg,   setProductMsg]   = useState('')
  const [searchQ,      setSearchQ]      = useState('')
  const [filterBrand,  setFilterBrand]  = useState('all')
  const [confirmDelete, setConfirmDelete] = useState(null)

  // Orders
  const [orders, setOrders] = useState(() => ls.get('bt_orders', []))

  // Users
  const [users, setUsers] = useState(() => ls.get('bt_accounts', []))

  // Activity log
  const [activityLog, setActivityLog] = useState(getAdminLog)

  // Stripe
  const [stripePanel, setStripePanel] = useState(false)

  // ── Auto-login if session exists ──────────────────────────
  useEffect(() => {
    if (isAdminLoggedIn()) { setAuthed(true); setStep('dashboard') }
  }, [])

  // ── Login step 1: validate credentials ────────────────────
  async function handleLogin() {
    setLoginErr('')
    const status = getAttemptStatus()
    if (status.locked) { setLoginErr(`Too many failed attempts. Try again in ${status.remainingMins} minute(s).`); return }
    if (!loginEmail || !loginPass) { setLoginErr('Please enter email and password.'); return }
    if (!validateAdminCredentials(loginEmail, loginPass)) {
      const attempts = recordFailedAttempt()
      const remaining = 5 - attempts
      setLoginErr(remaining > 0
        ? `Invalid credentials. ${remaining} attempt(s) remaining.`
        : 'Account locked for 15 minutes due to too many failed attempts.')
      return
    }
    // Credentials OK — send 2FA code
    clearAttempts()
    setSendingCode(true)
    const code = generateCode()
    storePendingCode(loginEmail, code)
    const result = await sendVerificationEmail(loginEmail, 'Admin', code, 'admin login')
    setSendingCode(false)
    if (result.success) {
      setStep('verify')
      setCodeHint(`Code sent to ${loginEmail}`)
    } else {
      // EmailJS not configured yet — show code in console for dev mode
      console.warn('⚠️  EmailJS not configured. DEV CODE:', code)
      setStep('verify')
      setCodeHint(`DEV MODE: Check browser console for code (EmailJS not yet configured)`)
    }
  }

  // ── Login step 2: verify 2FA code ─────────────────────────
  function handleVerify() {
    setVerifyErr('')
    const result = verifyCode(loginEmail, verifyInput)
    if (!result.valid) { setVerifyErr(result.reason); return }
    createSession()
    logAdminAction('LOGIN', `Admin logged in`)
    setAuthed(true)
    setStep('dashboard')
    setActivityLog(getAdminLog())
  }

  function handleLogout() {
    destroySession()
    logAdminAction('LOGOUT', 'Admin logged out')
    setAuthed(false)
    setStep('login')
    setLoginEmail(''); setLoginPass(''); setVerifyInput('')
    if (onExit) onExit()
  }

  // ── Products CRUD ──────────────────────────────────────────
  function startAdd() {
    setEditProduct({ ...EMPTY_PRODUCT, id: Date.now() })
    setProductErr(''); setProductMsg('')
  }

  function startEdit(p) {
    setEditProduct({
      ...p,
      colors: Array.isArray(p.colors) ? p.colors.join(', ') : p.colors,
      specs:  typeof p.specs === 'object' ? Object.entries(p.specs).map(([k,v])=>`${k}: ${v}`).join('\n') : p.specs,
    })
    setProductErr(''); setProductMsg('')
  }

  function cancelEdit() { setEditProduct(null); setProductErr(''); setProductMsg('') }

  function saveProduct() {
    setProductErr('')
    if (!editProduct.name.trim()) { setProductErr('Product name is required.'); return }
    if (!editProduct.price || isNaN(editProduct.price)) { setProductErr('Valid price is required.'); return }
    if (!editProduct.desc.trim()) { setProductErr('Description is required.'); return }

    // Parse colors and specs from text fields
    const colorsArr = editProduct.colors
      ? editProduct.colors.split(',').map(c => c.trim()).filter(Boolean)
      : []
    const specsObj = {}
    if (editProduct.specs) {
      editProduct.specs.split('\n').forEach(line => {
        const [k, ...rest] = line.split(':')
        if (k && rest.length) specsObj[k.trim()] = rest.join(':').trim()
      })
    }

    const parsedPrice = parseFloat(editProduct.price)
    if (!parsedPrice || parsedPrice <= 0) { setProductErr('Please enter a valid price greater than 0.'); return }

    const product = {
      ...editProduct,
      // Ensure id is always a number for consistent comparison in App.jsx
      id:        typeof editProduct.id === 'string' ? parseInt(editProduct.id) : editProduct.id,
      brandName: BRAND_NAME_MAP[editProduct.brand] || editProduct.brand,
      price:     parsedPrice,                                          // always a float
      origPrice: editProduct.origPrice ? parseFloat(editProduct.origPrice) : null,
      rating:    parseFloat(editProduct.rating) || 4.5,
      reviews:   parseInt(editProduct.reviews) || 0,
      quantity:  parseInt(editProduct.quantity) || 0,
      colors:    colorsArr,
      specs:     specsObj,
      tags:      Array.isArray(editProduct.tags) ? editProduct.tags : [],
      active:    editProduct.active !== false,
    }

    const existing = products.find(p => p.id === product.id)
    let next
    if (existing) {
      next = products.map(p => p.id === product.id ? product : p)
      logAdminAction('EDIT_PRODUCT', product.name)
      setProductMsg('✅ Product updated successfully.')
    } else {
      next = [...products, product]
      logAdminAction('ADD_PRODUCT', product.name)
      setProductMsg('✅ Product added successfully.')
    }
    setProducts(next)
    saveProducts(next)
    setActivityLog(getAdminLog())
    setTimeout(() => { setEditProduct(null); setProductMsg('') }, 1200)
  }

  function deleteProduct(id) {
    const p = products.find(x => x.id === id)
    const next = products.filter(x => x.id !== id)
    setProducts(next); saveProducts(next)
    logAdminAction('DELETE_PRODUCT', p?.name || id)
    setActivityLog(getAdminLog())
    setConfirmDelete(null)
  }

  function toggleActive(id) {
    const next = products.map(p => p.id === id ? { ...p, active: !p.active } : p)
    setProducts(next); saveProducts(next)
    const p = next.find(x => x.id === id)
    logAdminAction('TOGGLE_PRODUCT', `${p.name} → ${p.active ? 'active' : 'hidden'}`)
    setActivityLog(getAdminLog())
  }

  function toggleTag(tag) {
    const tags = editProduct.tags || []
    setEditProduct(prev => ({ ...prev, tags: tags.includes(tag) ? tags.filter(t=>t!==tag) : [...tags, tag] }))
  }

  // ── Order management ──────────────────────────────────────
  function updateOrderStatus(id, status) {
    const next = orders.map(o => o.id === id ? { ...o, status } : o)
    setOrders(next); ls.set('bt_orders', next)
    logAdminAction('ORDER_STATUS', `${id} → ${status}`)
    setActivityLog(getAdminLog())
  }

  // ── User management ───────────────────────────────────────
  function deleteUser(email) {
    const next = users.filter(u => u.email !== email)
    setUsers(next); ls.set('bt_accounts', next)
    logAdminAction('DELETE_USER', email)
    setActivityLog(getAdminLog())
  }

  // ── Filtered products ─────────────────────────────────────
  const displayProducts = products.filter(p => {
    const matchBrand = filterBrand === 'all' || p.brand === filterBrand
    const matchQ = !searchQ || (p.name+p.brandName+p.category).toLowerCase().includes(searchQ.toLowerCase())
    return matchBrand && matchQ
  })

  // ── Stats ─────────────────────────────────────────────────
  const totalRevenue = orders.reduce((s, o) => s + parseFloat(o.total || 0), 0)
  const processingOrders = orders.filter(o => o.status === 'processing').length
  const totalProducts = products.length
  const totalUsers = users.length

  // ─────────────────────────────────────────────────────────────
  // RENDER — LOGIN
  // ─────────────────────────────────────────────────────────────
  if (!authed || step !== 'dashboard') {
    return (
      <div style={S.loginPage}>
        <div style={S.loginCard}>
          <button style={S.exitBtn} onClick={onExit}>✕</button>
          <div style={S.adminLogo}>⚙️</div>
          <div style={S.adminTitle}>BORINGTHINGS</div>
          <div style={S.adminSub}>Admin Portal</div>

          {step === 'login' && (
            <>
              <div style={S.securityNote}>🔒 Protected by 2-Factor Authentication</div>
              {loginErr && <div style={S.errBox}>{loginErr}</div>}
              <div style={S.fGroup}>
                <label style={S.fLabel}>Admin Email</label>
                <input style={S.fInput} type="email" value={loginEmail}
                  onChange={e=>setLoginEmail(e.target.value)} placeholder="admin@boringthings.com"
                  onKeyDown={e=>e.key==='Enter'&&handleLogin()} autoComplete="off"/>
              </div>
              <div style={S.fGroup}>
                <label style={S.fLabel}>Password</label>
                <input style={S.fInput} type="password" value={loginPass}
                  onChange={e=>setLoginPass(e.target.value)} placeholder="••••••••••"
                  onKeyDown={e=>e.key==='Enter'&&handleLogin()} autoComplete="off"/>
              </div>
              <button style={S.submitBtn} onClick={handleLogin} disabled={sendingCode}>
                {sendingCode ? 'Sending code...' : 'Continue →'}
              </button>
            </>
          )}

          {step === 'verify' && (
            <>
              <div style={S.securityNote}>📧 {codeHint}</div>
              {verifyErr && <div style={S.errBox}>{verifyErr}</div>}
              <div style={S.fGroup}>
                <label style={S.fLabel}>6-Digit Verification Code</label>
                <input style={{...S.fInput, textAlign:'center', fontSize:'24px', letterSpacing:'8px'}}
                  type="text" maxLength={6} value={verifyInput}
                  onChange={e=>setVerifyInput(e.target.value.replace(/\D/g,''))}
                  onKeyDown={e=>e.key==='Enter'&&handleVerify()} placeholder="000000" autoFocus/>
              </div>
              <button style={S.submitBtn} onClick={handleVerify}>Verify & Enter →</button>
              <button style={S.backBtn} onClick={()=>{setStep('login');setVerifyInput('');setVerifyErr('')}}>
                ← Back
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER — PRODUCT EDIT FORM
  // ─────────────────────────────────────────────────────────────
  if (editProduct) {
    return (
      <div style={S.dashboard}>
        {/* Header */}
        <div style={S.header}>
          <div style={S.headerLeft}>
            <button style={S.backBtn2} onClick={cancelEdit}>← Back to Products</button>
            <span style={S.headerTitle}>{editProduct.id && products.find(p=>p.id===editProduct.id) ? 'Edit Product' : 'Add New Product'}</span>
          </div>
          <button style={S.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>

        <div style={S.formPage}>
          {productErr && <div style={S.errBox}>{productErr}</div>}
          {productMsg && <div style={S.successBox}>{productMsg}</div>}

          <div style={S.formGrid}>
            {/* Left column */}
            <div>
              <FormGroup label="Product Name *">
                <input style={S.fInput} value={editProduct.name} onChange={e=>setEditProduct(p=>({...p,name:e.target.value}))} placeholder="e.g. Clifton 9"/>
              </FormGroup>
              <FormGroup label="Brand *">
                <select style={S.fInput} value={editProduct.brand} onChange={e=>setEditProduct(p=>({...p,brand:e.target.value}))}>
                  {BRAND_OPTIONS.map(b=><option key={b.key} value={b.key}>{b.label}</option>)}
                </select>
              </FormGroup>
              <FormGroup label="Category *">
                <select style={S.fInput} value={editProduct.category} onChange={e=>setEditProduct(p=>({...p,category:e.target.value}))}>
                  <option value="shoes">Shoes</option>
                  <option value="hats">Hats</option>
                  <option value="accessories">Accessories</option>
                </select>
              </FormGroup>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
                <FormGroup label="Price ($) *">
                  <input style={S.fInput} type="number" step="0.01" value={editProduct.price} onChange={e=>setEditProduct(p=>({...p,price:e.target.value}))} placeholder="0.00"/>
                </FormGroup>
                <FormGroup label="Original Price ($)">
                  <input style={S.fInput} type="number" step="0.01" value={editProduct.origPrice||''} onChange={e=>setEditProduct(p=>({...p,origPrice:e.target.value}))} placeholder="0.00 (leave blank if no sale)"/>
                </FormGroup>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
                <FormGroup label="Stock Quantity">
                  <input style={S.fInput} type="number" value={editProduct.quantity||0} onChange={e=>setEditProduct(p=>({...p,quantity:e.target.value}))}/>
                </FormGroup>
                <FormGroup label="Emoji">
                  <input style={S.fInput} value={editProduct.emoji} onChange={e=>setEditProduct(p=>({...p,emoji:e.target.value}))} placeholder="👟"/>
                </FormGroup>
              </div>
              <FormGroup label="Colors (comma separated)">
                <input style={S.fInput} value={editProduct.colors} onChange={e=>setEditProduct(p=>({...p,colors:e.target.value}))} placeholder="Black, White, Red"/>
              </FormGroup>
              <FormGroup label="Stripe Price ID">
                <input style={{...S.fInput, fontFamily:'monospace', fontSize:'13px'}}
                  value={editProduct.stripePriceId || ''}
                  onChange={e=>setEditProduct(p=>({...p,stripePriceId:e.target.value}))}
                  placeholder="price_1ABC123... (from Stripe Dashboard)"/>
                <div style={{fontSize:'11px',color:'#888',marginTop:'4px'}}>
                  Get this from <a href="https://dashboard.stripe.com/test/products" target="_blank" rel="noreferrer" style={{color:'#635bff'}}>Stripe Dashboard → Products</a>. Required for checkout.
                </div>
              </FormGroup>
            </div>

            {/* Right column */}
            <div>
              <FormGroup label="Description *">
                <textarea style={{...S.fInput, height:'110px', resize:'vertical'}} value={editProduct.desc} onChange={e=>setEditProduct(p=>({...p,desc:e.target.value}))} placeholder="Product description..."/>
              </FormGroup>
              <FormGroup label="Specs (one per line: Key: Value)">
                <textarea style={{...S.fInput, height:'110px', resize:'vertical', fontFamily:'monospace', fontSize:'13px'}} value={editProduct.specs} onChange={e=>setEditProduct(p=>({...p,specs:e.target.value}))} placeholder={"Weight: 9.6 oz\nDrop: 12mm\nType: Neutral"}/>
              </FormGroup>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
                <FormGroup label="Rating (0-5)">
                  <input style={S.fInput} type="number" step="0.1" min="0" max="5" value={editProduct.rating} onChange={e=>setEditProduct(p=>({...p,rating:e.target.value}))}/>
                </FormGroup>
                <FormGroup label="Review Count">
                  <input style={S.fInput} type="number" value={editProduct.reviews} onChange={e=>setEditProduct(p=>({...p,reviews:e.target.value}))}/>
                </FormGroup>
              </div>

              <FormGroup label="Tags">
                <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                  {['new','sale','hot'].map(tag=>(
                    <button key={tag} style={{
                      ...S.tagToggle,
                      background: (editProduct.tags||[]).includes(tag) ? '#e8ff00' : '#2e2e2e',
                      color: (editProduct.tags||[]).includes(tag) ? '#000' : '#aaa',
                    }} onClick={()=>toggleTag(tag)}>
                      {tag.toUpperCase()}
                    </button>
                  ))}
                </div>
              </FormGroup>

              <FormGroup label="Visibility & Flags">
                <div style={{display:'flex',gap:'16px',flexWrap:'wrap'}}>
                  {[
                    ['active','Active (visible)'],
                    ['featured','Featured'],
                    ['trending','Trending'],
                  ].map(([key,label])=>(
                    <label key={key} style={S.checkLabel}>
                      <input type="checkbox" checked={!!editProduct[key]} onChange={e=>setEditProduct(p=>({...p,[key]:e.target.checked}))} style={{marginRight:'6px'}}/>
                      {label}
                    </label>
                  ))}
                </div>
              </FormGroup>
            </div>
          </div>

          <div style={{display:'flex',gap:'12px',marginTop:'24px'}}>
            <button style={S.saveBtn} onClick={saveProduct}>💾 Save Product</button>
            <button style={S.cancelBtn} onClick={cancelEdit}>Cancel</button>
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER — DASHBOARD
  // ─────────────────────────────────────────────────────────────
  return (
    <div style={S.dashboard}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          <span style={S.adminBadge}>⚙️ ADMIN</span>
          <span style={S.headerTitle}>BoringThings Dashboard</span>
        </div>
        <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
          <button style={S.storeLinkBtn} onClick={onExit}>← Back to Store</button>
          <button style={S.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Stats row */}
      <div style={S.statsRow}>
        {[
          { label:'Total Revenue', value:`$${totalRevenue.toFixed(2)}`, icon:'💰', color:'#e8ff00' },
          { label:'Total Orders', value:orders.length, icon:'📦', color:'#7CFC00' },
          { label:'Pending Orders', value:processingOrders, icon:'⏳', color:'#ffa500' },
          { label:'Products', value:totalProducts, icon:'👟', color:'#635bff' },
          { label:'Customers', value:totalUsers, icon:'👥', color:'#0096ff' },
        ].map(s=>(
          <div key={s.label} style={S.statCard}>
            <div style={{fontSize:'28px'}}>{s.icon}</div>
            <div style={{fontSize:'26px',fontWeight:800,color:s.color,fontFamily:'Bebas Neue,sans-serif',letterSpacing:'1px'}}>{s.value}</div>
            <div style={{fontSize:'11px',color:'#888',textTransform:'uppercase',letterSpacing:'1px'}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={S.tabBar}>
        {[
          ['products','👟 Products'],
          ['orders','📦 Orders'],
          ['users','👥 Customers'],
          ['stripe','💳 Stripe'],
          ['log','📋 Activity Log'],
        ].map(([key,label])=>(
          <button key={key} style={{...S.tab, ...(tab===key?S.tabActive:{})}} onClick={()=>setTab(key)}>{label}</button>
        ))}
      </div>

      <div style={S.tabContent}>

        {/* ── PRODUCTS TAB ── */}
        {tab === 'products' && (
          <div>
            <div style={S.tableToolbar}>
              <input style={S.searchInput} placeholder="Search products..." value={searchQ} onChange={e=>setSearchQ(e.target.value)}/>
              <select style={S.filterSelect} value={filterBrand} onChange={e=>setFilterBrand(e.target.value)}>
                <option value="all">All Brands</option>
                {BRAND_OPTIONS.map(b=><option key={b.key} value={b.key}>{b.label}</option>)}
              </select>
              <button style={S.addBtn} onClick={startAdd}>+ Add Product</button>
            </div>

            {displayProducts.length === 0 ? (
              <div style={S.emptyState}>No products found. Click "+ Add Product" to get started.</div>
            ) : (
              <div style={S.tableWrap}>
                <table style={S.table}>
                  <thead>
                    <tr style={S.thead}>
                      {['','Name','Brand','Category','Price','Stock','Stripe ID','Tags','Status','Actions'].map(h=>(
                        <th key={h} style={S.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayProducts.map(p=>(
                      <tr key={p.id} style={{...S.tr, opacity: p.active===false?0.45:1}}>
                        <td style={S.td}><span style={{fontSize:'28px'}}>{p.emoji}</span></td>
                        <td style={S.td}><div style={{fontWeight:600}}>{p.name}</div></td>
                        <td style={S.td}><span style={S.brandPill}>{p.brandName}</span></td>
                        <td style={S.td}><span style={S.catPill}>{p.category}</span></td>
                        <td style={S.td}>
                          <div style={{color:'#e8ff00',fontWeight:700}}>${p.price}</div>
                          {p.origPrice && <div style={{color:'#888',fontSize:'12px',textDecoration:'line-through'}}>${p.origPrice}</div>}
                        </td>
                        <td style={S.td}>
                          <span style={{color: (p.quantity||0)<5 ? '#ff3c00' : '#7CFC00', fontWeight:700}}>
                            {p.quantity||0}
                          </span>
                        </td>
                        <td style={S.td}>
                          {p.stripePriceId && !p.stripePriceId.includes('REPLACE')
                            ? <span style={{fontFamily:'monospace',fontSize:'11px',color:'#635bff',background:'rgba(99,91,255,.1)',padding:'2px 6px',borderRadius:'4px'}}>&#10003; Set</span>
                            : <span style={{fontSize:'11px',color:'#ff9800'}}>&#9888; Missing</span>
                          }
                        </td>
                        <td style={S.td}>
                          {(p.tags||[]).map(t=>(
                            <span key={t} style={{...S.tagBadge, background: t==='sale'?'#ff3c00':t==='new'?'#e8ff00':'#ff6b00', color: t==='new'?'#000':'#fff'}}>{t}</span>
                          ))}
                        </td>
                        <td style={S.td}>
                          <button style={{...S.toggleBtn, background: p.active!==false?'rgba(124,252,0,.15)':'rgba(255,60,0,.15)', color: p.active!==false?'#7CFC00':'#ff3c00'}}
                            onClick={()=>toggleActive(p.id)}>
                            {p.active!==false ? '● Live' : '○ Hidden'}
                          </button>
                        </td>
                        <td style={S.td}>
                          <div style={{display:'flex',gap:'6px'}}>
                            <button style={S.editBtn} onClick={()=>startEdit(p)}>✏️ Edit</button>
                            <button style={S.deleteBtn} onClick={()=>setConfirmDelete(p)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── ORDERS TAB ── */}
        {tab === 'orders' && (
          <div>
            <div style={{marginBottom:'16px',fontSize:'13px',color:'#888'}}>
              {orders.length} total orders · ${totalRevenue.toFixed(2)} revenue
            </div>
            {orders.length === 0 ? (
              <div style={S.emptyState}>No orders yet.</div>
            ) : (
              <div style={S.tableWrap}>
                <table style={S.table}>
                  <thead>
                    <tr style={S.thead}>
                      {['Order #','Date','Items','Total','Status','Update'].map(h=><th key={h} style={S.th}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o=>(
                      <tr key={o.id} style={S.tr}>
                        <td style={S.td}><span style={{color:'#e8ff00',fontWeight:700}}>#{o.id}</span></td>
                        <td style={S.td}>{o.date}</td>
                        <td style={S.td}>{o.items?.length || 0} item(s)</td>
                        <td style={S.td}><span style={{color:'#7CFC00',fontWeight:700}}>${o.total}</span></td>
                        <td style={S.td}>
                          <span style={{
                            padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:700,
                            background: o.status==='delivered'?'rgba(124,252,0,.15)':o.status==='shipped'?'rgba(0,150,255,.15)':'rgba(255,165,0,.15)',
                            color: o.status==='delivered'?'#7CFC00':o.status==='shipped'?'#0096ff':'#ffa500',
                          }}>{o.status}</span>
                        </td>
                        <td style={S.td}>
                          <select style={S.statusSelect} value={o.status} onChange={e=>updateOrderStatus(o.id, e.target.value)}>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── USERS TAB ── */}
        {tab === 'users' && (
          <div>
            <div style={{marginBottom:'16px',fontSize:'13px',color:'#888'}}>{users.length} registered customers</div>
            {users.length === 0 ? (
              <div style={S.emptyState}>No registered customers yet.</div>
            ) : (
              <div style={S.tableWrap}>
                <table style={S.table}>
                  <thead>
                    <tr style={S.thead}>
                      {['Name','Email','Orders','Actions'].map(h=><th key={h} style={S.th}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u=>{
                      const userOrders = orders.filter(o => o.userEmail === u.email)
                      return (
                        <tr key={u.email} style={S.tr}>
                          <td style={S.td}>
                            <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                              <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'#e8ff00',display:'flex',alignItems:'center',justifyContent:'center',color:'#000',fontWeight:800,fontSize:'13px'}}>
                                {u.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                              </div>
                              <span style={{fontWeight:600}}>{u.name}</span>
                            </div>
                          </td>
                          <td style={S.td}><span style={{color:'#888'}}>{u.email}</span></td>
                          <td style={S.td}>{userOrders.length}</td>
                          <td style={S.td}>
                            <button style={S.deleteBtn} onClick={()=>deleteUser(u.email)}>🗑️ Remove</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── STRIPE TAB ── */}
        {tab === 'stripe' && (
          <div>
            <div style={S.stripePanel}>
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'20px'}}>
                <div style={{width:'48px',height:'48px',background:'#635bff',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px'}}>💳</div>
                <div>
                  <div style={{fontSize:'20px',fontWeight:800,color:'#fff'}}>Stripe Integration</div>
                  <div style={{fontSize:'13px',color:'#888'}}>Payment link active</div>
                </div>
                <div style={{marginLeft:'auto',padding:'6px 14px',background:'rgba(124,252,0,.15)',color:'#7CFC00',borderRadius:'20px',fontSize:'12px',fontWeight:700}}>● ACTIVE</div>
              </div>

              <div style={S.stripeInfoRow}>
                <div style={S.stripeInfoCard}>
                  <div style={{fontSize:'12px',color:'#888',marginBottom:'4px',textTransform:'uppercase',letterSpacing:'1px'}}>Payment Link</div>
                  <div style={{fontSize:'13px',color:'#635bff',wordBreak:'break-all'}}>{STRIPE_LINK}</div>
                </div>
                <div style={S.stripeInfoCard}>
                  <div style={{fontSize:'12px',color:'#888',marginBottom:'4px',textTransform:'uppercase',letterSpacing:'1px'}}>Mode</div>
                  <div style={{fontSize:'15px',fontWeight:700,color:'#ffa500'}}>TEST MODE</div>
                  <div style={{fontSize:'12px',color:'#888',marginTop:'4px'}}>Switch to Live in Stripe dashboard</div>
                </div>
                <div style={S.stripeInfoCard}>
                  <div style={{fontSize:'12px',color:'#888',marginBottom:'4px',textTransform:'uppercase',letterSpacing:'1px'}}>Total Collected</div>
                  <div style={{fontSize:'22px',fontWeight:800,color:'#7CFC00'}}>${totalRevenue.toFixed(2)}</div>
                  <div style={{fontSize:'12px',color:'#888'}}>from {orders.length} orders</div>
                </div>
              </div>

              <div style={{marginTop:'24px'}}>
                <div style={{fontSize:'14px',fontWeight:700,marginBottom:'12px',color:'#fff'}}>Quick Actions</div>
                <div style={{display:'flex',gap:'12px',flexWrap:'wrap'}}>
                  <a href="https://dashboard.stripe.com/test/payments" target="_blank" rel="noreferrer" style={S.stripeActionBtn}>
                    📊 Stripe Dashboard
                  </a>
                  <a href="https://dashboard.stripe.com/test/payment-links" target="_blank" rel="noreferrer" style={S.stripeActionBtn}>
                    🔗 Payment Links
                  </a>
                  <a href="https://dashboard.stripe.com/test/customers" target="_blank" rel="noreferrer" style={S.stripeActionBtn}>
                    👥 Stripe Customers
                  </a>
                </div>
              </div>

              <div style={{marginTop:'28px',padding:'20px',background:'rgba(99,91,255,.1)',border:'1px solid rgba(99,91,255,.3)',borderRadius:'10px'}}>
                <div style={{fontWeight:700,marginBottom:'8px',color:'#635bff'}}>🧪 Test Card Numbers</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                  {[
                    ['Visa (success)', '4242 4242 4242 4242'],
                    ['Mastercard', '5555 5555 5555 4444'],
                    ['Declined', '4000 0000 0000 0002'],
                    ['Auth required', '4000 0025 0000 3155'],
                  ].map(([label,num])=>(
                    <div key={num} style={{background:'rgba(0,0,0,.3)',padding:'10px 14px',borderRadius:'8px',fontSize:'13px'}}>
                      <div style={{color:'#888',fontSize:'11px',marginBottom:'2px'}}>{label}</div>
                      <div style={{fontFamily:'monospace',color:'#e8ff00',letterSpacing:'1px'}}>{num}</div>
                    </div>
                  ))}
                </div>
                <div style={{fontSize:'12px',color:'#888',marginTop:'10px'}}>Use any future expiry date and any 3-digit CVV</div>
              </div>
            </div>
          </div>
        )}

        {/* ── ACTIVITY LOG TAB ── */}
        {tab === 'log' && (
          <div>
            <div style={{marginBottom:'16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:'13px',color:'#888'}}>{activityLog.length} actions recorded</span>
              <button style={S.cancelBtn} onClick={()=>{ls.set('bt_admin_log','[]');setActivityLog([])}}>Clear Log</button>
            </div>
            {activityLog.length === 0 ? (
              <div style={S.emptyState}>No activity recorded yet.</div>
            ) : (
              <div style={S.tableWrap}>
                <table style={S.table}>
                  <thead><tr style={S.thead}>{['Time','Action','Detail'].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {activityLog.map((entry,i)=>(
                      <tr key={i} style={S.tr}>
                        <td style={{...S.td,color:'#888',fontSize:'12px',whiteSpace:'nowrap'}}>{entry.ts}</td>
                        <td style={S.td}><span style={{color:'#e8ff00',fontWeight:700,fontSize:'12px'}}>{entry.action}</span></td>
                        <td style={{...S.td,color:'#ccc',fontSize:'13px'}}>{entry.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── DELETE CONFIRM MODAL ── */}
      {confirmDelete && (
        <div style={S.modalOverlay}>
          <div style={S.confirmModal}>
            <div style={{fontSize:'40px',marginBottom:'12px'}}>⚠️</div>
            <div style={{fontSize:'20px',fontWeight:800,marginBottom:'8px'}}>Delete Product?</div>
            <div style={{color:'#888',marginBottom:'24px',fontSize:'14px'}}>
              "{confirmDelete.name}" will be permanently removed.
            </div>
            <div style={{display:'flex',gap:'10px',justifyContent:'center'}}>
              <button style={S.deleteConfirmBtn} onClick={()=>deleteProduct(confirmDelete.id)}>Yes, Delete</button>
              <button style={S.cancelBtn} onClick={()=>setConfirmDelete(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Small helper component ────────────────────────────────────
function FormGroup({ label, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={S.fLabel}>{label}</label>
      {children}
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────
const S = {
  loginPage:   { position:'fixed',inset:0,background:'#0a0a0a',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999,fontFamily:'DM Sans,sans-serif' },
  loginCard:   { background:'#141414',border:'1px solid #2a2a2a',borderRadius:'16px',padding:'48px 40px',width:'100%',maxWidth:'420px',position:'relative' },
  exitBtn:     { position:'absolute',top:'16px',right:'16px',background:'#2e2e2e',border:'none',color:'#fff',width:'32px',height:'32px',borderRadius:'50%',cursor:'pointer',fontSize:'16px' },
  adminLogo:   { textAlign:'center',fontSize:'48px',marginBottom:'8px' },
  adminTitle:  { textAlign:'center',fontFamily:'Bebas Neue,sans-serif',fontSize:'36px',letterSpacing:'4px',color:'#f5f5f0',marginBottom:'4px' },
  adminSub:    { textAlign:'center',fontSize:'13px',color:'#888',marginBottom:'24px',textTransform:'uppercase',letterSpacing:'2px' },
  securityNote:{ background:'rgba(99,91,255,.12)',border:'1px solid rgba(99,91,255,.3)',borderRadius:'8px',padding:'10px 14px',fontSize:'13px',color:'#a29bfe',marginBottom:'20px',textAlign:'center' },
  errBox:      { background:'rgba(255,60,0,.12)',border:'1px solid rgba(255,60,0,.3)',borderRadius:'8px',padding:'10px 14px',fontSize:'13px',color:'#ff6b6b',marginBottom:'16px' },
  successBox:  { background:'rgba(124,252,0,.12)',border:'1px solid rgba(124,252,0,.3)',borderRadius:'8px',padding:'10px 14px',fontSize:'13px',color:'#7CFC00',marginBottom:'16px' },
  fGroup:      { marginBottom:'16px' },
  fLabel:      { display:'block',fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'1px',color:'#888',marginBottom:'6px' },
  fInput:      { width:'100%',background:'#1c1c1c',border:'1px solid #2a2a2a',color:'#f5f5f0',padding:'11px 14px',borderRadius:'8px',fontSize:'14px',fontFamily:'DM Sans,sans-serif',outline:'none',boxSizing:'border-box' },
  submitBtn:   { width:'100%',background:'#e8ff00',color:'#000',border:'none',padding:'14px',borderRadius:'8px',fontSize:'14px',fontWeight:800,cursor:'pointer',letterSpacing:'1px',textTransform:'uppercase',marginTop:'8px' },
  backBtn:     { width:'100%',background:'transparent',color:'#888',border:'1px solid #2a2a2a',padding:'11px',borderRadius:'8px',fontSize:'13px',cursor:'pointer',marginTop:'10px' },

  dashboard:   { minHeight:'100vh',background:'#0a0a0a',fontFamily:'DM Sans,sans-serif',color:'#f5f5f0' },
  header:      { background:'#141414',borderBottom:'1px solid #2a2a2a',padding:'0 32px',height:'64px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100 },
  headerLeft:  { display:'flex',alignItems:'center',gap:'16px' },
  adminBadge:  { background:'#e8ff00',color:'#000',fontSize:'11px',fontWeight:800,padding:'4px 10px',borderRadius:'4px',letterSpacing:'1px' },
  headerTitle: { fontSize:'18px',fontWeight:700 },
  backBtn2:    { background:'#1c1c1c',border:'1px solid #2a2a2a',color:'#f5f5f0',padding:'8px 16px',borderRadius:'6px',cursor:'pointer',fontSize:'13px',fontWeight:600 },
  logoutBtn:   { background:'rgba(255,60,0,.15)',border:'1px solid rgba(255,60,0,.3)',color:'#ff6b6b',padding:'8px 16px',borderRadius:'6px',cursor:'pointer',fontSize:'13px',fontWeight:700 },
  storeLinkBtn:{ background:'#1c1c1c',border:'1px solid #2a2a2a',color:'#f5f5f0',padding:'8px 16px',borderRadius:'6px',cursor:'pointer',fontSize:'13px',fontWeight:600 },

  statsRow:    { display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'16px',padding:'24px 32px' },
  statCard:    { background:'#141414',border:'1px solid #2a2a2a',borderRadius:'12px',padding:'20px',textAlign:'center' },

  tabBar:      { display:'flex',borderBottom:'1px solid #2a2a2a',padding:'0 32px',overflowX:'auto' },
  tab:         { background:'none',border:'none',color:'#888',padding:'14px 20px',fontSize:'13px',fontWeight:700,cursor:'pointer',borderBottom:'3px solid transparent',marginBottom:'-1px',whiteSpace:'nowrap',letterSpacing:'.5px' },
  tabActive:   { color:'#e8ff00',borderBottomColor:'#e8ff00' },
  tabContent:  { padding:'24px 32px' },

  tableToolbar:{ display:'flex',gap:'12px',marginBottom:'16px',flexWrap:'wrap' },
  searchInput: { background:'#1c1c1c',border:'1px solid #2a2a2a',color:'#f5f5f0',padding:'9px 14px',borderRadius:'8px',fontSize:'13px',fontFamily:'DM Sans,sans-serif',outline:'none',flex:1,minWidth:'180px' },
  filterSelect:{ background:'#1c1c1c',border:'1px solid #2a2a2a',color:'#f5f5f0',padding:'9px 14px',borderRadius:'8px',fontSize:'13px',fontFamily:'DM Sans,sans-serif',outline:'none' },
  addBtn:      { background:'#e8ff00',color:'#000',border:'none',padding:'9px 20px',borderRadius:'8px',fontSize:'13px',fontWeight:800,cursor:'pointer',whiteSpace:'nowrap' },
  tableWrap:   { overflowX:'auto',borderRadius:'12px',border:'1px solid #2a2a2a' },
  table:       { width:'100%',borderCollapse:'collapse',fontSize:'14px' },
  thead:       { background:'#141414' },
  th:          { padding:'12px 16px',textAlign:'left',fontSize:'11px',fontWeight:700,textTransform:'uppercase',letterSpacing:'1px',color:'#888',whiteSpace:'nowrap' },
  tr:          { borderTop:'1px solid #1c1c1c' },
  td:          { padding:'12px 16px',verticalAlign:'middle' },
  brandPill:   { background:'#1c1c1c',border:'1px solid #2a2a2a',padding:'3px 8px',borderRadius:'4px',fontSize:'11px',color:'#aaa' },
  catPill:     { background:'rgba(99,91,255,.15)',color:'#a29bfe',padding:'3px 8px',borderRadius:'4px',fontSize:'11px',fontWeight:600 },
  tagBadge:    { padding:'2px 7px',borderRadius:'3px',fontSize:'10px',fontWeight:700,marginRight:'4px' },
  toggleBtn:   { border:'none',padding:'4px 10px',borderRadius:'12px',fontSize:'11px',fontWeight:700,cursor:'pointer',background:'none' },
  editBtn:     { background:'rgba(232,255,0,.1)',border:'1px solid rgba(232,255,0,.2)',color:'#e8ff00',padding:'5px 10px',borderRadius:'6px',fontSize:'12px',cursor:'pointer',fontWeight:600 },
  deleteBtn:   { background:'rgba(255,60,0,.1)',border:'1px solid rgba(255,60,0,.2)',color:'#ff6b6b',padding:'5px 10px',borderRadius:'6px',fontSize:'12px',cursor:'pointer' },
  emptyState:  { textAlign:'center',padding:'60px 20px',color:'#555',fontSize:'15px' },
  statusSelect:{ background:'#1c1c1c',border:'1px solid #2a2a2a',color:'#f5f5f0',padding:'5px 10px',borderRadius:'6px',fontSize:'13px',fontFamily:'DM Sans,sans-serif',outline:'none' },

  formPage:    { maxWidth:'960px',margin:'0 auto',padding:'32px' },
  formGrid:    { display:'grid',gridTemplateColumns:'1fr 1fr',gap:'32px' },
  tagToggle:   { padding:'7px 16px',borderRadius:'6px',border:'none',cursor:'pointer',fontSize:'12px',fontWeight:700,letterSpacing:'1px' },
  checkLabel:  { display:'flex',alignItems:'center',fontSize:'14px',cursor:'pointer',color:'#ccc' },
  saveBtn:     { background:'#e8ff00',color:'#000',border:'none',padding:'13px 32px',borderRadius:'8px',fontSize:'14px',fontWeight:800,cursor:'pointer',letterSpacing:'.5px' },
  cancelBtn:   { background:'#1c1c1c',border:'1px solid #2a2a2a',color:'#f5f5f0',padding:'13px 24px',borderRadius:'8px',fontSize:'14px',cursor:'pointer' },

  stripePanel:     { background:'#141414',border:'1px solid #2a2a2a',borderRadius:'14px',padding:'28px' },
  stripeInfoRow:   { display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:'16px' },
  stripeInfoCard:  { background:'#1c1c1c',border:'1px solid #2a2a2a',borderRadius:'10px',padding:'16px' },
  stripeActionBtn: { background:'rgba(99,91,255,.15)',border:'1px solid rgba(99,91,255,.3)',color:'#a29bfe',padding:'10px 18px',borderRadius:'8px',fontSize:'13px',fontWeight:700,textDecoration:'none',display:'inline-block',cursor:'pointer' },

  modalOverlay:   { position:'fixed',inset:0,background:'rgba(0,0,0,.8)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999,backdropFilter:'blur(4px)' },
  confirmModal:   { background:'#141414',border:'1px solid #2a2a2a',borderRadius:'16px',padding:'40px',textAlign:'center',maxWidth:'380px',width:'100%' },
  deleteConfirmBtn: { background:'rgba(255,60,0,.2)',border:'1px solid rgba(255,60,0,.4)',color:'#ff6b6b',padding:'12px 24px',borderRadius:'8px',fontSize:'14px',fontWeight:700,cursor:'pointer' },
}