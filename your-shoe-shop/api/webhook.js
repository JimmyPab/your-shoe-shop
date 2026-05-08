// api/webhook.js
// Stripe Webhook — Stripe calls this after successful payment
// This lets you confirm orders, send emails, update inventory etc.
//
// SETUP:
// 1. Go to https://dashboard.stripe.com/test/webhooks
// 2. Click "Add endpoint"
// 3. URL: https://www.boringthings.org/api/webhook
// 4. Events to listen for: checkout.session.completed
// 5. Copy the "Signing secret" (whsec_...)
// 6. Add to Vercel env vars as: STRIPE_WEBHOOK_SECRET

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Vercel needs raw body for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
}

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event

  try {
    const rawBody = await getRawBody(req)

    if (webhookSecret) {
      // Verify the webhook came from Stripe
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
    } else {
      // No webhook secret set — parse without verification (dev only)
      event = JSON.parse(rawBody.toString())
      console.warn('⚠️  STRIPE_WEBHOOK_SECRET not set — skipping signature verification')
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object

      console.log('✅ Payment confirmed:', {
        sessionId:     session.id,
        customerEmail: session.customer_email || session.customer_details?.email,
        amount:        session.amount_total / 100,
        currency:      session.currency,
      })

      // Here you could:
      // - Send a confirmation email
      // - Update inventory in a database
      // - Create an order record
      // For now we log it — orders are tracked in localStorage on the frontend

      break
    }

    case 'payment_intent.payment_failed': {
      const intent = event.data.object
      console.log('❌ Payment failed:', intent.id)
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  res.status(200).json({ received: true })
}
