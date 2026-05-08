// api/create-checkout.js
// Vercel Serverless Function — runs on the SERVER, never exposed to browser
// This is where your Stripe SECRET key lives safely
//
// Vercel automatically deploys any file in /api as a serverless endpoint
// This becomes: https://www.boringthings.org/api/create-checkout

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Allow requests from your domain only
  const origin = req.headers.origin
  const allowedOrigins = [
    'https://www.boringthings.org',
    'https://boringthings.org',
    'http://localhost:5173',  // local dev
    'http://localhost:4173',  // local preview
  ]

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  try {
    const { lineItems, customerEmail } = req.body

    // Validate we received line items
    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({ error: 'No items in cart' })
    }

    // Validate each line item has required fields
    for (const item of lineItems) {
      if (!item.price || !item.quantity) {
        return res.status(400).json({ error: 'Invalid line item — missing price or quantity' })
      }
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,

      // Customer email pre-fill (if logged in)
      ...(customerEmail ? { customer_email: customerEmail } : {}),

      // Collect shipping address
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU'],
      },

      // Collect phone number
      phone_number_collection: {
        enabled: true,
      },

      // Where to send customer after payment
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.boringthings.org'}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.boringthings.org'}?checkout=cancel`,

      // Metadata for your records
      metadata: {
        source: 'boringthings_store',
      },
    })

    // Return the session URL to redirect the customer
    return res.status(200).json({ url: session.url })

  } catch (err) {
    console.error('Stripe checkout error:', err)
    return res.status(500).json({
      error: err.message || 'Failed to create checkout session',
    })
  }
}
