/*

The getPremiumStatus.jsx function:

- Checks the Firebase auth state for a logged-in user
- Queries Firestore for documents in the path customers/[userId]/subscriptions
- Specifically looks for subscriptions with status "trialing" or "active"
- Returns a boolean (true if active subscription found, false otherwise)

The application is using Firebase Extensions for Stripe, which automatically creates these collections in Firestore when users subscribe.

*/

//import { FirebaseApp } from "firebase/app"
import { app } from '../../../config/firestore.js'
import { getAuth } from "firebase/auth"
import {
  collection,
  getFirestore,
  onSnapshot,
  query,
  where,
} from "firebase/firestore"

export const getPremiumStatus = async => {
  const auth = getAuth(app) // pass in an instance of the app

  // add a delay to ensure auth state is ready
  if (!auth.currentUser) {
    return false // return false for non-premium users instead of throwing an error
  }

  //if (!userId) throw new Error("User not logged in")

  // get a reference to the firestore database and search for the subscription status of
  // active or trialing  
  const userId = auth.currentUser?.uid // get the user
  const db = getFirestore(app)
  const subscriptionsRef = collection(db, "customers", userId, "subscriptions")
  const q = query(
    subscriptionsRef,
    where("status", "in", ["trialing", "active"])
  )

  // wait to get the result, return true or false based on if it found active or trialing subs
  return new Promise((resolve, reject) => {
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // In this implementation we only expect one active or trialing subscription to exist.
        //console.log("Subscription snapshot", snapshot.docs.length)
        if (snapshot.docs.length === 0) {
          //console.log("No active or trialing subscriptions found")
          resolve(false)
        } else {
          //console.log("Active or trialing subscription found")
          resolve(true)
        }
        unsubscribe()
      },
      reject
    )
  })
}