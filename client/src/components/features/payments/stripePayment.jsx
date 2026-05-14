"use client";
import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  getFirestore,
  onSnapshot,
} from "firebase/firestore";

import { getFunctions, httpsCallable } from "firebase/functions";
import { API_BASE_URL } from "../../../env-config.js";

export const getCheckoutUrl = async (app, priceId, returnUrl) => {
  const auth = getAuth(app);
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("User is not authenticated");

  // go through firebase database and check for "checkout_sessions"
  const db = getFirestore(app);
  const checkoutSessionRef = collection(
    db,
    "customers",
    userId,
    "checkout_sessions"
  );

  const docRef = await addDoc(checkoutSessionRef, {
    price: priceId,
    success_url: returnUrl,
    cancel_url: returnUrl,
    allow_promotion_codes: true,
    mode: 'payment'
  });

  // return a promise that turns into a URL
  return new Promise((resolve, reject) => {
    const unsubscribe = onSnapshot(docRef, (snap) => {
      const { error, url } = snap.data();
      if (error) {
        unsubscribe();
        reject(new Error(`An error occurred: ${error.message}`));
      }
      if (url) {
        //console.log("Stripe Checkout URL:", url);
        unsubscribe();
        resolve(url);
      }
    });
  });
};

// Credit package price IDs (from backend/config/creditCosts.js)
export const CREDIT_PRODUCTS = {
  sampler: 'price_1SiK1FEK9nhVGtg7NTOHECgM',
  starter: 'price_1SiK2nEK9nhVGtg73Tu1DMUR',
  healer: 'price_1SiK3QEK9nhVGtg7lNkUrqmi',
  healthstyle: 'price_1SiK4NEK9nhVGtg726J49XDi',
  sampler_sub: 'price_1SiQL0EK9nhVGtg7E0eQxahR'
};

export const getCreditCheckoutUrl = async (app, packageId, returnUrl) => {
  const auth = getAuth(app);
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error("User is not authenticated");

  const priceId = CREDIT_PRODUCTS[packageId];
  if (!priceId) {
    throw new Error(`Invalid package ID: ${packageId}`);
  }

  // Determine mode based on package (subscription vs one-time)
  const isSubscription = packageId === 'sampler_sub';

  // For subscriptions, use Firebase extension
  if (isSubscription) {
    const origin = new URL(returnUrl).origin;
    const db = getFirestore(app);
    const checkoutSessionRef = collection(
      db,
      "customers",
      userId,
      "checkout_sessions"
    );

    const docRef = await addDoc(checkoutSessionRef, {
      price: priceId,
      success_url: returnUrl,
      cancel_url: `${origin}/upgrade`,
      allow_promotion_codes: true,
      mode: 'subscription',
      locale: 'auto',
      metadata: {
        type: 'credit_subscription',
        package_id: packageId
      }
    });

    return new Promise((resolve, reject) => {
      const unsubscribe = onSnapshot(docRef, (snap) => {
        const { error, url } = snap.data();
        if (error) {
          unsubscribe();
          reject(new Error(`An error occurred: ${error.message}`));
        }
        if (url) {
          unsubscribe();
          resolve(url);
        }
      });
    });
  }
  
  // For one-time payments, use backend API (Firebase extension bug with promo codes)
  const token = await auth.currentUser.getIdToken();
  const response = await fetch(`${API_BASE_URL}/api/stripe/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      packageId,
      successUrl: returnUrl,
      cancelUrl: `${new URL(returnUrl).origin}/upgrade`
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create checkout session');
  }

  const { url } = await response.json();
  return url;
};

export const getPortalUrl = async (app, dynamicReturnUrl) => {
  const auth = getAuth(app);
  const user = auth.currentUser;

  //let dataWithUrl;
  try {
    const functions = getFunctions(app, "us-central1");
    const functionRef = httpsCallable(
      functions,
      //"ext-firestore-stripe-payments-createPortalLink" // WRONG FUNCTION, created from failed install on firebase extention
      "ext-firestore-stripe-payments-upgx-createPortalLink" // CORRECT FUNCTION, most recent
    );
    const { data } = await functionRef({
      customerId: user?.uid,
      returnUrl: dynamicReturnUrl,
    });

    //dataWithUrl = data;
    //console.log("Reroute to Stripe portal: ", dataWithUrl.url);

    if (!data || !data.url) {
      throw new Error('No portal URL received')
    }

    return data.url
  } catch (error) {
    console.error('Portal URL Error:', error);
    throw error
  }

  //return new Promise((resolve, reject) => {
  //  if (dataWithUrl.url) {
  //    resolve(dataWithUrl.url);
  //  } else {
  //    reject(new Error("No url returned"));
  //  }
  //});
}