// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

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
const auth = getAuth(app);

// Function to handle login
window.login = function() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorMessage = document.getElementById("error-message");

    if (!email || !password) {
        errorMessage.innerText = "Please enter both email and password.";
        return;
    }

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Successful login
            console.log("Login successful:", userCredential.user);
            errorMessage.innerText = ""; // Clear any previous errors
            playIntroAnimation();
        })
        .catch((error) => {
            console.error("Login failed:", error.message);
            errorMessage.innerText = "Invalid email or password. Please try again.";
        });
};

// Function to reset password
window.resetPassword = function() {
    const resetEmail = document.getElementById("reset-email").value;
    const resetMessage = document.getElementById("reset-message");

    if (!resetEmail) {
        resetMessage.innerText = "Please enter your email.";
        return;
    }

    sendPasswordResetEmail(auth, resetEmail)
        .then(() => {
            resetMessage.innerText = "Password reset email sent. Check your inbox.";
        })
        .catch((error) => {
            console.error("Password reset failed:", error.message);
            resetMessage.innerText = "Error sending reset email. Please try again.";
        });
};

// Function to play intro animation (replace this with actual animation logic)
function playIntroAnimation() {
    document.body.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-size: 24px; font-weight: bold;">
            Intro Animation Playing...
        </div>`;
}
