// backend/routes/stripeWebhook.routes.js
import express from 'express';
import { addCredits } from '../services/credit.service.js';
import { CREDIT_PACKAGES } from '../config/creditCosts.js';
import Stripe from 'stripe';
import User from '../models/user.model.js';
import CreditTransaction from '../models/creditTransaction.model.js';
import { verifyFirebaseToken } from '../middleware/authMiddleware.js';

const router = express.Router();
const stripeMode = (process.env.STRIPE_MODE || 'test').toLowerCase();
const stripeApiKey =
  stripeMode === 'live'
    ? process.env.STRIPE_SECRET_KEY_LIVE || process.env.STRIPE_LIVE
    : process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SANDBOX_SECRET_KEY || process.env.STRIPE_LIVE;
const stripe = new Stripe(stripeApiKey, { apiVersion: '2025-12-15.clover' });

const endpointSecret =
  stripeMode === 'live'
    ? process.env.STRIPE_WEBHOOK_SECRET_LIVE || process.env.STRIPE_WEBHOOK_SECRET
    : process.env.STRIPE_WEBHOOK_SECRET_TEST || process.env.STRIPE_WEBHOOK_SECRET;

console.log(`(stripeWebhook) Stripe mode: ${stripeMode}`);

/**
 * Verify Stripe webhook signature
 */
const verifyWebhookSignature = (req) => {
  const sig = req.headers['stripe-signature'];
  console.log('(stripeWebhook) Incoming webhook headers:', {
    hasStripeSignature: Boolean(sig),
    contentType: req.headers['content-type'],
    userAgent: req.headers['user-agent'],
  });
  console.log('(stripeWebhook) Incoming webhook raw body info:', {
    bodyType: typeof req.body,
    bodyIsBuffer: Buffer.isBuffer(req.body),
    bodyLength: Buffer.isBuffer(req.body) ? req.body.length : undefined,
    hasEndpointSecret: Boolean(endpointSecret),
  });

  if (!sig) {
    throw new Error('No Stripe signature found');
  }

  if (!endpointSecret) {
    throw new Error('Stripe webhook secret not configured');
  }

  return stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
};

/**
 * Handle successful checkout session
 */
const handleCheckoutSessionCompleted = async (session) => {
  console.log(`(stripeWebhook) Checkout session completed: ${session.id}`);
  console.log('(stripeWebhook) Checkout session summary:', {
    id: session.id,
    mode: session.mode,
    payment_status: session.payment_status,
    amount_total: session.amount_total,
    currency: session.currency,
    livemode: session.livemode,
    customer: session.customer,
    customer_email: session.customer_email,
    metadata: session.metadata,
  });

  try {
    // Extract metadata
    const { metadata } = session;
    const creditPackageId = metadata?.creditPackage;
    const firebaseUID = metadata?.firebaseUID;

    if (!creditPackageId || !firebaseUID) {
      console.error('(stripeWebhook) Missing required metadata', { metadata });
      return;
    }

    // Get package details
    const creditPackage = CREDIT_PACKAGES[creditPackageId.toUpperCase()];
    if (!creditPackage) {
      console.error(`(stripeWebhook) Invalid credit package: ${creditPackageId}`);
      return;
    }

    // Find user by Firebase UID
    const user = await User.findOne({ firebaseUID: firebaseUID });
    if (!user) {
      console.error(`(stripeWebhook) User not found: ${firebaseUID}`);
      return;
    }

    console.log('(stripeWebhook) Matched Mongo user for fulfillment:', {
      firebaseUID,
      mongoUserId: user._id?.toString(),
      currentCreditBalance: user.creditBalance,
      email: user.email,
    });

    // Add credits to user account
    console.log('(stripeWebhook) Granting credits via addCredits()', {
      mongoUserId: user._id?.toString(),
      creditsToAdd: creditPackage.credits,
      referenceId: session.id,
      actionType: 'PURCHASE',
    });
    const newBalance = await addCredits(
      user._id,
      creditPackage.credits,
      'PURCHASE',
      session.id,
      {
        stripeSessionId: session.id,
        packageId: creditPackageId,
        packageName: creditPackage.name,
        amountPaid: session.amount_total / 100, // Convert from cents
        currency: session.currency,
        purchasedAt: new Date().toISOString()
      }
    );

    console.log(`(stripeWebhook) Added ${creditPackage.credits} credits to user ${firebaseUID}. New balance: ${newBalance}`);

    // TODO: Send confirmation email to user
    // await sendPurchaseConfirmation(user.email, creditPackage, newBalance);

  } catch (error) {
    console.error('(stripeWebhook) Error handling checkout session:', error);
    throw error;
  }
};

/**
 * Handle failed payment
 */
const handlePaymentFailed = async (paymentIntent) => {
  console.log(`(stripeWebhook) Payment failed: ${paymentIntent.id}`);

  try {
    // TODO: Notify user of payment failure
    // Could send email, create notification, etc.

  } catch (error) {
    console.error('(stripeWebhook) Error handling payment failure:', error);
  }
};

/**
 * Handle subscription events (for existing subscribers during transition)
 */
const handleInvoicePaymentSucceeded = async (invoice) => {
  console.log(`(stripeWebhook) Invoice payment succeeded: ${invoice.id}`);

  // During transition, we might still have subscription events
  // This handler ensures we don't break existing functionality
};

/**
 * Main webhook endpoint
 */
router.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  let event;

  try {
    // Verify webhook signature
    event = verifyWebhookSignature(req);
    console.log('(stripeWebhook) Webhook signature verified:', {
      eventId: event.id,
      type: event.type,
      apiVersion: event.api_version,
      livemode: event.livemode,
      created: event.created,
    });
  } catch (err) {
    console.error('(stripeWebhook) Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`(stripeWebhook) Received event: ${event.type}`);

  try {
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
        
      // Add more event handlers as needed
      case 'customer.subscription.deleted':
        console.log('(stripeWebhook) Subscription deleted - transition period');
        break;
        
      default:
        console.log(`(stripeWebhook) Unhandled event type: ${event.type}`);
    }
    
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error(`(stripeWebhook) Error handling event ${event.type}:`, error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

/**
 * Create checkout session for credit purchases
 */
router.post('/create-checkout-session', verifyFirebaseToken, async (req, res) => {
  try {
    const { packageId, successUrl, cancelUrl } = req.body;
const firebaseUID = req.user?.uid;
//const firebaseUID = req.user?.firebaseUID; previous line was this before
    
    if (!firebaseUID) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Validate packageId
    if (!packageId) {
      return res.status(400).json({ error: 'Package ID is required' });
    }
    
    // Get package details
    const creditPackage = CREDIT_PACKAGES[packageId.toUpperCase()];
    if (!creditPackage) {
      return res.status(400).json({ error: 'Invalid credit package' });
    }
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: creditPackage.name,
            description: `${creditPackage.credits} Meadow Credits - ${creditPackage.description}`,
            images: [] // Add product images if available
          },
          unit_amount: creditPackage.price * 100, // Convert to cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl || `${process.env.FRONTEND_URL}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/pricing`,
      metadata: {
        creditPackage: packageId,
        firebaseUID: firebaseUID
      },
      customer_email: req.user.email,
      billing_address_collection: 'auto',
      allow_promotion_codes: true
    });
    
    console.log(`(stripeWebhook) Created checkout session: ${session.id} for package: ${packageId}`);
    
    res.json({
      sessionId: session.id,
      url: session.url
    });
    
  } catch (error) {
    console.error('(stripeWebhook) Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

/**
 * Get user's credit purchase history
 */
router.get('/purchase-history', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const purchases = await CreditTransaction.find({
      user: userId,
      actionType: 'PURCHASE'
    })
    .sort({ createdAt: -1 })
    .limit(20);
    
    res.json({ purchases });
    
  } catch (error) {
    console.error('(stripeWebhook) Error fetching purchase history:', error);
    res.status(500).json({ error: 'Failed to fetch purchase history' });
  }
});

/**
 * Get available credit packages
 */
router.get('/credit-packages', (req, res) => {
  try {
    const packages = Object.values(CREDIT_PACKAGES).map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      credits: pkg.credits,
      price: pkg.price,
      description: pkg.description,
      popular: pkg.popular || false,
      valuePerCredit: pkg.price / pkg.credits
    }));
    
    res.json({ packages });
    
  } catch (error) {
    console.error('(stripeWebhook) Error fetching credit packages:', error);
    res.status(500).json({ error: 'Failed to fetch credit packages' });
  }
});

export default router;
