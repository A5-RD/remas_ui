// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA9WkNeMgcrgmhUA97UPbp7R4pj-IZFnK0",
  authDomain: "atom5engineering.firebaseapp.com",
  projectId: "atom5engineering",
  storageBucket: "atom5engineering.firebasestorage.app",
  messagingSenderId: "956458197323",
  appId: "1:956458197323:web:e01873bb7fa92ac70a08ce",
  measurementId: "G-X7H184TN54"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

function showResetPopup() {
    document.getElementById("reset-popup").style.display = "block";
}

function closeResetPopup() {
    document.getElementById("reset-popup").style.display = "none";
}

function sendResetRequest() {
    const email = document.getElementById("reset-email").value;

    if (!email) {
        alert("Please enter your email.");
        return;
    }

    const mailtoLink = `mailto:help@atom5engineering.com?subject=Password Reset Request&body=User email: ${email}`;
    window.location.href = mailtoLink;

    alert("Your request has been sent. We will contact you shortly.");
    closeResetPopup();
}
