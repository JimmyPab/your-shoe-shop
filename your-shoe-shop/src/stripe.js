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
const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_KEY_HERE'

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
  // ── Real products ──
  101: 'price_1TUu11CgB0JifsjY7uDcfJaL',  // Adidas Men's Supernova 2  $65
  102: 'price_1TUu3dCgB0JifsjY9kmvIArD',  // Adidas Men's Racer TR23   $90

  // ── Temporary placeholders — add Price IDs when you have real products ──
  // Add more as you create real products in Stripe
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