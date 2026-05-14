/**
 * As of 25 02 24 at 12:42 PM I got the CORS issue resolved and do NOT need to use this script.
 * This has NOT been deployed.
 * I fixed the CORS issue by updating stripPayment.jsx file to use
      "ext-firestore-stripe-payments-upgx-createPortalLink"
      instead of
      "ext-firestore-stripe-payments-createPortalLink" <-- old and produced CORS errors.
 * 
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

//const {onRequest} = require("firebase-functions/v2/https");
//const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });


const {onRequest} = require("firebase-functions/v2/https");
const functions = require("firebase-functions");
const logger = require("firebase-functions/logger");
const cors = require('cors')({origin: true});

exports.createPortalLink = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    // The Stripe extension will handle the portal link creation
    // This wrapper ensures CORS headers are properly set
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed')
      return
    }
    try {
      // existing portal link creation logic here
      res.status(200).json({ url: portalURL })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  });
});

exports.deleteStripeCustomer = functions.https.onCall(async (data, context) => {
  const stripeKey = functions.config().stripe.secret_key;
  const stripe = require('stripe')(stripeKey);

  // Verify admin status here
  if (!context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only function');
  }
  
  const { customerId } = data;
  
  try {
    // Delete the Stripe customer
    const stripe = require('stripe')(process.env.STRIPE_LIVE);
    await stripe.customers.del(customerId);
    return { success: true };
  } catch (error) {
    console.error('Stripe customer deletion error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

exports.addAdmin = functions.https.onRequest(async (req, res) => {
  // This should only be deployed temporarily and removed after use
  const admin = require('firebase-admin');
  
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  
  // Replace with your UID
  const uid = '3LQEKlF9bAcKj8GS0EQpHBAxyEJ3';
  
  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    res.json({ result: `Success! User ${uid} has been made an admin.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
