"use client";
import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  getFirestore,
  onSnapshot,
  doc,
  updateDoc
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

// get firebase user ID bc we need them logged in before they buy product
// export const getCheckoutUrl = async (app, priceId) => {
export async function getCheckoutUrl(app, priceId) {
  // THIS IS SUPPOSED TO WORK FOR BOTH STRIPE TEST AND LIVE
  try {
    const auth = getAuth(app);
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User is not authenticated");

    const userDoc = await getUserDocument(app)

    // check which stripe customer ID to use (live or test)
    const stripeCustomerId = process.env.NODE_ENV === 'production'
      ? userDoc.stripeCustomerIdLive
      : userDoc.stripeCustomerIdTest

    //create customer if doesn't exist for current environment
    if (!stripeCustomerId) {
      // Create new customer logic here
      try {
        // call the firebase function to create a new STripe customer
        const functions = getFunctions(app, 'us-central1')
        const createCustomerFunction = httpsCallable(
          functions,
          'ext-firestore-stripe-payments-upgx-createCustomer'
        )

        // Execute the function with user details
        const { data } = await createCustomerFunction({
          email: auth.currentUser.email,
          name: auth.currentUser.displayName || auth.currentUser.email.split('@')[0]
        })

        // Get the newly created customer ID
        const newCustomerId = data.customerId

        // Update the user document with the new Stripe customer ID
        const userRef = doc(db, 'users', userId)
        if (process.env.NODE_ENV === 'production') {
          await updateDoc(userRef, { stripeCustomerIdLive: newCustomerId })
        } else {
          await updateDoc(userRef, { stripeCustomerIdTest: newCustomerId })
        }

        // use the new customer ID for this checkout session
        stripeCustomerId = newCustomerId

        console.log(` Created new Stripe customer: ${newCustomerId} in ${process.env.NODE_ENV} mode.`)
      } catch (error) {
        console.error('Failed to create Stripe customer:', error)
        throw new Error('Unable to create customer profile. Please try again later.')
      }
    }

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
      success_url: `${window.location.origin}/profile`,
      cancel_url: `${window.location.origin}/profile`,
      allow_promotion_codes: true
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
          console.log("Stripe Checkout URL:", url);
          unsubscribe();
          resolve(url);
        }
      });
    });

    export const getPortalUrl = async (app) => {
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
          returnUrl: window.location.origin,
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
