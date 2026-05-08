// ============================================================
// stripe.js — Dynamic Stripe Checkout
//
// HOW THIS WORKS:
// Instead of a static payment link (which only shows one product),
// this builds a real Stripe Checkout Session with every item in
// the customer's cart — correct products, quantities and prices.
//
// SETUP STEPS (one time):
// 1. Run: npm install @stripe/stripe-js
// 2. Go to https://dashboard.stripe.com/test/products
// 3. For EACH product, create it in Stripe and copy its Price ID
//    (looks like: price_1ABC123defGHI456)
// 4. Paste each Price ID into STRIPE_PRICE_IDS below, matching by product id
// 5. Replace YOUR_PUBLISHABLE_KEY with your real key from:
//    https://dashboard.stripe.com/test/apikeys  (starts with pk_test_...)
//
// NOTE: This uses Stripe Checkout — Stripe hosts the payment page.
// Your secret key NEVER touches the frontend. Only the publishable key is used here.
// ============================================================

import { loadStripe } from '@stripe/stripe-js'

// ── Your Stripe publishable key (safe to put in frontend) ───
// Get it from: https://dashboard.stripe.com/test/apikeys
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51TUSXCCgB0JifsjYrCJehkJ50wFBy59ra5erfkB3nmd1vDJqk0dthyKPIjqEGtYEtb6UYBtwms2AZMpAOHNRZmFr00yASpZjNZ'

// ── Map your product IDs to Stripe Price IDs ────────────────
// For each product in products.js, create it in your Stripe dashboard
// and paste its Price ID here.
//
// To get a Price ID:
// 1. Go to https://dashboard.stripe.com/test/products
// 2. Click "Add product"
// 3. Set name and price — Stripe generates a Price ID like price_1Abc...
// 4. Copy that Price ID and paste it here next to the matching product id
//
// For admin-added products: add a stripePriceId field when creating
// the product in the admin panel (we added that field below)
export const STRIPE_PRICE_IDS = {
  // Base products from products.js — fill these in after creating them in Stripe
  1:  'price_REPLACE_WITH_REAL_ID',  // Hoka Clifton 9         $135
  2:  'price_REPLACE_WITH_REAL_ID',  // Hoka Bondi 8           $165
  3:  'price_REPLACE_WITH_REAL_ID',  // Hoka Mach 6            $145
  4:  'price_REPLACE_WITH_REAL_ID',  // Hoka Speedgoat 5       $155
  5:  'price_REPLACE_WITH_REAL_ID',  // Hoka Arahi 7           $140
  6:  'price_REPLACE_WITH_REAL_ID',  // Hoka Running Cap        $38
  7:  'price_REPLACE_WITH_REAL_ID',  // Hoka Sport Duffel Bag   $65
  8:  'price_REPLACE_WITH_REAL_ID',  // NB Fresh Foam 1080v13  $165
  9:  'price_REPLACE_WITH_REAL_ID',  // NB 990v6               $185
  10: 'price_REPLACE_WITH_REAL_ID',  // NB FuelCell SuperComp  $250
  11: 'price_REPLACE_WITH_REAL_ID',  // NB Fresh Foam 860v14   $140
  12: 'price_REPLACE_WITH_REAL_ID',  // NB Hierro v8 Trail     $135
  13: 'price_REPLACE_WITH_REAL_ID',  // NB Athletics Cap        $32
  14: 'price_REPLACE_WITH_REAL_ID',  // NB Running Belt         $28
  15: 'price_REPLACE_WITH_REAL_ID',  // Asics Gel-Kayano 31    $160
  16: 'price_REPLACE_WITH_REAL_ID',  // Asics Gel-Nimbus 26    $165
  17: 'price_REPLACE_WITH_REAL_ID',  // Asics MetaSpeed Sky+   $250
  18: 'price_REPLACE_WITH_REAL_ID',  // Asics Gel-Cumulus 26   $130
  19: 'price_REPLACE_WITH_REAL_ID',  // Asics Gel-Trabuco 12   $120
  20: 'price_REPLACE_WITH_REAL_ID',  // Asics Performance Hat   $36
  21: 'price_REPLACE_WITH_REAL_ID',  // Asics Training Gear Bag $55
  22: 'price_REPLACE_WITH_REAL_ID',  // On Cloud Cloudmonster 2 $170
  23: 'price_REPLACE_WITH_REAL_ID',  // On Cloud Cloudflow 4   $140
  24: 'price_REPLACE_WITH_REAL_ID',  // On Cloud Cloud 5       $130
  25: 'price_REPLACE_WITH_REAL_ID',  // On Cloud Cloudultra 2  $180
  26: 'price_REPLACE_WITH_REAL_ID',  // On Cloud Cloudswift 3  $150
  27: 'price_REPLACE_WITH_REAL_ID',  // On Cloud Lightweight Cap $45
  28: 'price_REPLACE_WITH_REAL_ID',  // On Cloud Running Vest   $80
  29: 'price_REPLACE_WITH_REAL_ID',  // Brooks Ghost 16        $140
  30: 'price_REPLACE_WITH_REAL_ID',  // Brooks Glycerin 21     $160
  31: 'price_REPLACE_WITH_REAL_ID',  // Brooks Hyperion Max 2  $200
  32: 'price_REPLACE_WITH_REAL_ID',  // Brooks Adrenaline GTS  $130
  33: 'price_REPLACE_WITH_REAL_ID',  // Brooks Cascadia 17     $130
  34: 'price_REPLACE_WITH_REAL_ID',  // Brooks Podium Hat       $30
  35: 'price_1TUXhxCgB0JifsjYJyyAp3Yo',  // rEAL
}

let stripePromise = null
function getStripe() {
  if (!stripePromise) stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)
  return stripePromise
}

// ── Main checkout function ───────────────────────────────────
// Call this when customer clicks "Pay with Stripe"
// cartItems = array of { id, qty, size } from your cart state
// liveCatalog = the full product list from buildLiveCatalog()
export async function redirectToStripeCheckout(cartItems, liveCatalog) {
  // ── Build line items from cart ──
  const lineItems = []
  const missingPriceIds = []

  for (const cartItem of cartItems) {
    const product = liveCatalog.find(p => p.id === cartItem.id)
    if (!product) continue

    // Get the Stripe Price ID — check product first (admin-added),
    // then fall back to the STRIPE_PRICE_IDS map
    const stripePriceId = product.stripePriceId || STRIPE_PRICE_IDS[product.id]

    if (!stripePriceId || stripePriceId.startsWith('price_REPLACE')) {
      missingPriceIds.push(product.name)
      continue
    }

    lineItems.push({
      price:    stripePriceId,
      quantity: cartItem.qty,
    })
  }

  // ── Warn if any products are missing a Price ID ──
  if (missingPriceIds.length > 0) {
    const names = missingPriceIds.join(', ')
    console.warn(`⚠️  Missing Stripe Price IDs for: ${names}`)
    console.warn('Add these products to your Stripe Dashboard and update STRIPE_PRICE_IDS in stripe.js')

    // If ALL items are missing — stop and show error
    if (lineItems.length === 0) {
      return {
        success: false,
        error: `Checkout unavailable: Stripe Price IDs not configured yet.\n\nPlease go to your Stripe Dashboard, create these products, and add their Price IDs to src/stripe.js:\n\n${names}`,
      }
    }
  }

  // ── Redirect to Stripe Checkout ──
  try {
    const stripe = await getStripe()
    const { error } = await stripe.redirectToCheckout({
      lineItems,
      mode: 'payment',
      successUrl: `${window.location.origin}?checkout=success`,
      cancelUrl:  `${window.location.origin}?checkout=cancel`,
    })

    if (error) {
      console.error('Stripe error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Stripe checkout failed:', err)
    return { success: false, error: 'Failed to connect to Stripe. Please try again.' }
  }
}