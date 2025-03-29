import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDP8Tzkb6pSqUHfvPrpPW5CMsAJr12Hnd4",
  authDomain: "playplanner-26d8a.firebaseapp.com",
  databaseURL: "https://playplanner-26d8a-default-rtdb.firebaseio.com",
  projectId: "playplanner-26d8a",
  storageBucket: "playplanner-26d8a.appspot.com",
  messagingSenderId: "718282925849",
  appId: "1:718282925849:web:e6d0e24d2616b07f174788",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize all services
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);
const storage = getStorage(app);
const rtdb = getDatabase(app);

// Connect to emulators in development mode
if (process.env.NODE_ENV === "development") {
  // Authentication
  connectAuthEmulator(auth, "http://localhost:9099");

  // Firestore (Updated port to 8081)
  connectFirestoreEmulator(db, "localhost", 8081);

  // Cloud Functions
  connectFunctionsEmulator(functions, "localhost", 5001);

  // Cloud Storage (Port 9199 remains the same)
  connectStorageEmulator(storage, "localhost", 9199);

  // Realtime Database (Updated port to 9001)
  connectDatabaseEmulator(rtdb, "localhost", 9001);
}

export { auth, db, functions, storage, rtdb };
