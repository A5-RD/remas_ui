// firebase.js

// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";  
import { getStorage } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";  // Import Storage

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA9WkNeMgcrgmhUA97UPbp7R4pj-IZFnK0",
    authDomain: "atom5engineering.firebaseapp.com",
    projectId: "atom5engineering",
    storageBucket: "atom5engineering.appspot.com",
    messagingSenderId: "956458197323",
    appId: "1:956458197323:web:e01873bb7fa92ac70a08ce",
    measurementId: "G-X7H184TN54"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Services
const auth = getAuth(app);  // Authentication
const storage = getStorage(app);  // Cloud Storage

// Export Firebase modules
export { app, auth, storage };
