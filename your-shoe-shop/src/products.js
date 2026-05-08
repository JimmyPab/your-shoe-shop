// ============================================================
// products.js
// Real products: Adidas Supernova 2, Adidas Racer TR23
// All others are temporary placeholders — edit via admin panel
// ============================================================

export const PRODUCTS = [

  // ── REAL PRODUCTS ─────────────────────────────────────────

  {
    id: 101,
    brand: 'adidas',
    brandName: 'Adidas',
    name: "Men's Supernova 2",
    category: 'shoes',
    price: 65,
    origPrice: null,
    rating: 0,
    reviews: 0,
    tags: ['new'],
    featured: true,
    trending: true,
    desc: "Adidas Men's Supernova 2 running shoe. Built for comfort and performance on every run.",
    specs: { Brand: 'Adidas', Style: "Men's Supernova 2", Size: '12', Type: 'Running Shoe' },
    stripePriceId: 'price_1TUu11CgB0JifsjY7uDcfJaL',
    active: true,
  },
  {
    id: 102,
    brand: 'adidas',
    brandName: 'Adidas',
    name: "Men's Racer TR23",
    category: 'shoes',
    price: 90,
    origPrice: null,
    rating: 0,
    reviews: 0,
    tags: ['new'],
    featured: true,
    trending: true,
    desc: "Adidas Men's Racer TR23 sneaker. Lightweight and versatile for everyday wear.",
    specs: { Brand: 'Adidas', Style: "Men's Racer TR23", Size: '7.5', Type: 'Sneaker' },
    stripePriceId: 'price_1TUu3dCgB0JifsjY9kmvIArD',
    active: true,
  },

  // ── TEMPORARY PLACEHOLDERS ────────────────────────────────

  { id:1,  brand:'hoka',       brandName:'Hoka',        name:'Temporary', category:'shoes',       price:0, origPrice:null, rating:0, reviews:0, tags:[], featured:false, trending:false, desc:'Temporary placeholder. Edit in admin panel.', specs:{}, stripePriceId:'', active:true },
  { id:2,  brand:'hoka',       brandName:'Hoka',        name:'Temporary', category:'shoes',       price:0, origPrice:null, rating:0, reviews:0, tags:[], featured:false, trending:false, desc:'Temporary placeholder. Edit in admin panel.', specs:{}, stripePriceId:'', active:true },
  { id:3,  brand:'hoka',       brandName:'Hoka',        name:'Temporary', category:'shoes',       price:0, origPrice:null, rating:0, reviews:0, tags:[], featured:false, trending:false, desc:'Temporary placeholder. Edit in admin panel.', specs:{}, stripePriceId:'', active:true },
  { id:4,  brand:'hoka',       brandName:'Hoka',        name:'Temporary', category:'hats',        price:0, origPrice:null, rating:0, reviews:0, tags:[], featured:false, trending:false, desc:'Temporary placeholder. Edit in admin panel.', specs:{}, stripePriceId:'', active:true },
  { id:5,  brand:'hoka',       brandName:'Hoka',        name:'Temporary', category:'accessories', price:0, origPrice:null, rating:0, reviews:0, tags:[], featured:false, trending:false, desc:'Temporary placeholder. Edit in admin panel.', specs:{}, stripePriceId:'', active:true },
  { id:6,  brand:'newbalance', brandName:'New Balance', name:'Temporary', category:'shoes',       price:0, origPrice:null, rating:0, reviews:0, tags:[], featured:false, trending:false, desc:'Temporary placeholder. Edit in admin panel.', specs:{}, stripePriceId:'', active:true },
  { id:7,  brand:'newbalance', brandName:'New Balance', name:'Temporary', category:'shoes',       price:0, origPrice:null, rating:0, reviews:0, tags:[], featured:false, trending:false, desc:'Temporary placeholder. Edit in admin panel.', specs:{}, stripePriceId:'', active:true },
  { id:8,  brand:'newbalance', brandName:'New Balance', name:'Temporary', category:'shoes',       price:0, origPrice:null, rating:0, reviews:0, tags:[], featured:false, trending:false, desc:'Temporary placeholder. Edit in admin panel.', specs:{}, stripePriceId:'', active:true },
  { id:9,  brand:'newbalance', brandName:'New Balance', name:'Temporary', category:'hats',        price:0, origPrice:null, rating:0, reviews:0, tags:[], featured:false, trending:false, desc:'Temporary placeholder. Edit in admin panel.', specs:{}, stripePriceId:'', active:true },
  { id:10, brand:'newbalance', brandName:'New Balance', name:'Temporary', category:'accessories', price:0, origPrice:null, rating:0, reviews:0, tags:[], featured:false, trending:false, desc:'Temporary placeholder. Edit in admin panel.', specs:{}, stripePriceId:'', active:true },
  { id:11, brand:'asics',      brandName:'Asics',       name:'Temporary', category:'shoes',       price:0, origPrice:null, rating:0, reviews:0, tags:[], featured:false, trending:false, desc:'Temporary placeholder. Edit in admin panel.', specs:{}, stripePriceId:'', active:true },
  { id:12, brand:'asics',      brandName:'Asics',       name:'Temporary', category:'shoes',       price:0, origPrice:null, rating:0, reviews:0, tags:[], featured:false, trending:false, desc:'Temporary placeholder. Edit in admin panel.', specs:{}, stripePriceId:'', active:true },
  { id:13, brand:'asics',      brandName:'Asics',       name:'Temporary', category:'shoes',       price:0, origPrice:null, rating:0, reviews:0, tags:[], featured:false, trending:false, desc:'Temporary placeholder. Edit in admin panel.', specs:{}, stripePriceId:'', active:true },
  { id:14, brand:'asics',      brandName:'Asics',       name:'Temporary', category:'hats',        price:0, origPrice:null, rating:0, reviews:0, tags:[], featured:false, trending:false, desc:'Temporary placeholder. Edit in admin panel.', specs:{}, stripePriceId:'', active:true },
  { id:15, brand:'asics',      brandName:'Asics',       name:'Temporary', category:'accessories', price:0, origPrice:null, rating:0, reviews:0, tags:[], featured:false, trending:false, desc:'Temporary placeholder. Edit in admin panel.', specs:{}, stripePriceId:'', active:true },
  { id:16, brand:'oncloud',    brandName:'On Cloud',    name:'Temporary', category:'shoes',       price:0, origPrice:null, rating:0, reviews:0, tags:[], featured:false, trending:false, desc:'Temporary placeholder. Edit in admin panel.', specs:{}, stripePriceId:'', active:true },
  { id:17, brand:'oncloud',    brandName:'On Cloud',    name:'Temporary', category:'shoes',       price:0, origPrice:null, rating:0, reviews:0, tags:[], featured:false, trending:false, desc:'Temporary placeholder. Edit in admin panel.', specs:{}, stripePriceId:'', active:true },
  { id:18, brand:'oncloud',    brandName:'On Cloud',    name:'Temporary', category:'shoes',       price:0, origPrice:null, rating:0, reviews:0, tags:[], featured:false, trending:false, desc:'Temporary placeholder. Edit in admin panel.', specs:{}, stripePriceId:'', active:true },
  { id:19, brand:'oncloud',    brandName:'On Cloud',    name:'Temporary', category:'hats',        price:0, origPrice:null, rating:0, reviews:0, tags:[], featured:false, trending:false, desc:'Temporary placeholder. Edit in admin panel.', specs:{}, stripePriceId:'', active:true },
  { id:20, brand:'oncloud',    brandName:'On Cloud',    name:'Temporary', category:'accessories', price:0, origPrice:null, rating:0, reviews:0, tags:[], featured:false, trending:false, desc:'Temporary placeholder. Edit in admin panel.', specs:{}, stripePriceId:'', active:true },
  { id:21, brand:'brooks',     brandName:'Brooks',      name:'Temporary', category:'shoes',       price:0, origPrice:null, rating:0, reviews:0, tags:[], featured:false, trending:false, desc:'Temporary placeholder. Edit in admin panel.', specs:{}, stripePriceId:'', active:true },
  { id:22, brand:'brooks',     brandName:'Brooks',      name:'Temporary', category:'shoes',       price:0, origPrice:null, rating:0, reviews:0, tags:[], featured:false, trending:false, desc:'Temporary placeholder. Edit in admin panel.', specs:{}, stripePriceId:'', active:true },
  { id:23, brand:'brooks',     brandName:'Brooks',      name:'Temporary', category:'shoes',       price:0, origPrice:null, rating:0, reviews:0, tags:[], featured:false, trending:false, desc:'Temporary placeholder. Edit in admin panel.', specs:{}, stripePriceId:'', active:true },
  { id:24, brand:'brooks',     brandName:'Brooks',      name:'Temporary', category:'hats',        price:0, origPrice:null, rating:0, reviews:0, tags:[], featured:false, trending:false, desc:'Temporary placeholder. Edit in admin panel.', specs:{}, stripePriceId:'', active:true },
  { id:25, brand:'brooks',     brandName:'Brooks',      name:'Temporary', category:'accessories', price:0, origPrice:null, rating:0, reviews:0, tags:[], featured:false, trending:false, desc:'Temporary placeholder. Edit in admin panel.', specs:{}, stripePriceId:'', active:true },
]

// ── Brand list ────────────────────────────────────────────────
export const BRANDS = [
  { key: 'all',        label: 'Show All'    },
  { key: 'adidas',     label: 'Adidas'      },
  { key: 'hoka',       label: 'Hoka'        },
  { key: 'newbalance', label: 'New Balance' },
  { key: 'asics',      label: 'Asics'       },
  { key: 'oncloud',    label: 'On Cloud'    },
  { key: 'brooks',     label: 'Brooks'      },
]

export function getByBrand(brand) {
  return brand === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.brand === brand)
}

export function getFeatured(limit = 4) {
  const real = PRODUCTS.filter(p => p.featured && p.name !== 'Temporary')
  const rest = PRODUCTS.filter(p => p.featured && p.name === 'Temporary')
  return [...real, ...rest].slice(0, limit)
}

export function getTrending(limit = 4) {
  const real = PRODUCTS.filter(p => p.trending && p.name !== 'Temporary')
  const rest = PRODUCTS.filter(p => p.trending && p.name === 'Temporary')
  return [...real, ...rest].slice(0, limit)
}

export function getRecs(productId, limit = 4) {
  const current = PRODUCTS.find(p => p.id === productId)
  if (!current) return []
  return PRODUCTS
    .filter(p => p.id !== productId && (p.brand === current.brand || p.category === current.category))
    .slice(0, limit)
}

export function searchProducts(query, limit = 6) {
  const q = query.toLowerCase().trim()
  if (q.length < 2) return []
  return PRODUCTS.filter(p => {
    const str = `${p.name} ${p.brandName} ${p.category} ${p.desc}`.toLowerCase()
    if (str.includes(q)) return true
    for (let i = 0; i <= q.length - 3; i++) {
      if (str.includes(q.slice(i, i + 3))) return true
    }
    return false
  }).slice(0, limit)
}

export function getSizes(category) {
  if (category === 'shoes') return ['6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12']
  if (category === 'hats')  return ['S/M', 'L/XL']
  return ['One Size']
}