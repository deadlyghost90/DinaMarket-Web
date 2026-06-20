import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, set, get, child } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDCIlVTylvqU-yOJzt_PBt8HUm9JNi-6yM",
  authDomain: "dinamarket-pakistan.firebaseapp.com",
  databaseURL: "https://dinamarket-pakistan-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "dinamarket-pakistan",
  storageBucket: "dinamarket-pakistan.firebasestorage.app",
  messagingSenderId: "1004354649208",
  appId: "1:1004354649208:web:05cd63a70c9012d02a818d",
  measurementId: "G-9XRCPFZBN0",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const rtdb = getDatabase(app);

// Healing utility: purges all legacy predefined mock data of sellers/listings
export async function seedInitialData() {
  const dbRef = ref(rtdb);
  try {
    console.log("Database Healer: Scanning for any legacy canned mock products or sellers...");

    // 1. Delete legacy preseeded mock products (p1 to p15)
    for (let i = 1; i <= 15; i++) {
      const prodRef = child(dbRef, `products/p${i}`);
      const snap = await get(prodRef);
      if (snap.exists()) {
        console.log(`Database Healer: Purging legacy mock product p${i}...`);
        await set(ref(rtdb, `products/p${i}`), null);
      }
    }

    // 2. Delete legacy canned mock sellers
    const mockSellers = [
      "seller-peshawar-chappal",
      "seller-sialkot-sports",
      "seller-karachi-biryani",
      "seller-punjab-grocers",
      "seller-lahore-cosmetics",
      "seller-falcon-rentals"
    ];
    for (const sellerId of mockSellers) {
      const selRef = child(dbRef, `sellers/${sellerId}`);
      const snap = await get(selRef);
      if (snap.exists()) {
        console.log(`Database Healer: Purging mock legacy seller profile ${sellerId}...`);
        await set(ref(rtdb, `sellers/${sellerId}`), null);
      }
    }

    // 3. Clear review nodes associated with mock products
    const reviewsSnap = await get(child(dbRef, "reviews"));
    if (reviewsSnap.exists()) {
      const reviews = reviewsSnap.val();
      for (const revId of Object.keys(reviews)) {
        if (revId.match(/^p(?:[1-9]|1[0-5])[-_]rev/i) || revId.startsWith("p1-") || revId.startsWith("p2-") || revId.startsWith("p3-")) {
          console.log(`Database Healer: Purging canned review ${revId}...`);
          await set(ref(rtdb, `reviews/${revId}`), null);
        }
      }
    }

    console.log("Database healer completed: All canned mock data is cleared. System is 100% clean!");
  } catch (error) {
    console.error("Error during database healing: ", error);
  }
}
