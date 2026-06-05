// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js"; // Import Firebase Storage

const firebaseConfig = {
    apiKey: "AIzaSyDv3KzWRT2nje-GR_kvb7XCnLXsrJrG_D8",
    authDomain: "remas-storage.firebaseapp.com",
    projectId: "remas-storage",
    storageBucket: "remas-storage.firebasestorage.app",
    messagingSenderId: "157514987438",
    appId: "1:157514987438:web:3044502cd36513dc1cfa3f",
    measurementId: "G-3R53FPDSE5"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
const auth = getAuth(app);  // Firebase Authentication
const storage = getStorage(app); // Firebase Storage

export { app, auth, storage, firebaseConfig };  // Export storage so other files can use it