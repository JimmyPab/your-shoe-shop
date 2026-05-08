// ============================================================
// stripe.js — Frontend Stripe Checkout
//
// This calls our backend /api/create-checkout which uses
// the Stripe SECRET key safely on the server to build a
// real checkout session with ALL cart items.
// ============================================================

// ── Stripe Price IDs ─────────────────────────────────────────
// These are safe to have on the frontend — they're public IDs
// Get them from: https://dashboard.stripe.com/test/products
// Click a product → copy the price_1... ID under Pricing
export const STRIPE_PRICE_IDS = {
  101: 'price_1TUu11CgB0JifsjY7uDcfJaL',  // Adidas Men's Supernova 2  $65
  102: 'price_1TUu3dCgB0JifsjY9kmvIArD',  // Adidas Men's Racer TR23   $90
  // Add more here as you create products in Stripe
}

// ── Main checkout function ────────────────────────────────────
// cartItems   = array of { id, qty, size } from your cart state
// liveCatalog = full product list from buildLiveCatalog()
// userEmail   = logged-in user's email (optional, pre-fills Stripe form)
export async function redirectToStripeCheckout(cartItems, liveCatalog, userEmail = null) {
  // Build line items from cart
  const lineItems = []
  const missingPriceIds = []

  for (const cartItem of cartItems) {
    const product = liveCatalog.find(p => p.id === cartItem.id)
    if (!product) continue

    // Get Price ID — check product object first, then the map above
    const priceId = product.stripePriceId || STRIPE_PRICE_IDS[product.id]

    if (!priceId || priceId.includes('REPLACE') || priceId === '') {
      missingPriceIds.push(product.name)
      continue
    }

    lineItems.push({
      price:    priceId,
      quantity: cartItem.qty,
    })
  }

  // If no items have Price IDs set up yet
  if (lineItems.length === 0) {
    const names = missingPriceIds.length > 0
      ? missingPriceIds.join(', ')
      : 'items in cart'
    return {
      success: false,
      error: `Checkout not available yet.\n\nThese products need Stripe Price IDs:\n${names}\n\nGo to dashboard.stripe.com → Products → copy the Price ID for each product and add it to src/stripe.js`,
    }
  }

  // Warn about items skipped due to missing Price IDs
  if (missingPriceIds.length > 0) {
    console.warn('Skipped items (no Price ID):', missingPriceIds.join(', '))
  }

  // Call our backend serverless function to create the Stripe session
  try {
    const response = await fetch('/api/create-checkout', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lineItems,
        customerEmail: userEmail,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Checkout API error:', data)
      return {
        success: false,
        error: data.error || 'Checkout failed. Please try again.',
      }
    }

    if (!data.url) {
      return {
        success: false,
        error: 'No checkout URL returned from server.',
      }
    }

    // Redirect to Stripe Checkout page
    window.location.href = data.url
    return { success: true }

  } catch (err) {
    console.error('Failed to reach checkout API:', err)
    return {
      success: false,
      error: 'Could not connect to checkout. Please check your internet connection and try again.',
    }
  }
}