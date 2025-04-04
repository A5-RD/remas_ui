// firebase.js

// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";

// Your Firebase configuration
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

export { app };  // Export the initialized app to be used in other files
