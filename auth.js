

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
            errorMessage.innerText = ""; // Clear errors
            playIntroAnimation();
        })
        .catch((error) => {
            errorMessage.innerText = "Invalid email or password. Please try again.";
        });
};

// Function to reset password
window.resetPassword = function() {
    const resetEmail = document.getElementById("reset-email").value;
    const resetPopup = document.getElementById("reset-popup");
    const resetMessage = document.getElementById("reset-message");
    const checkmark = document.getElementById("reset-checkmark");

    if (!resetEmail) {
        resetMessage.innerText = "Please enter your email.";
        return;
    }

    sendPasswordResetEmail(auth, resetEmail)
        .then(() => {
            resetMessage.style.display = "none";
            checkmark.style.display = "block";
            setTimeout(() => {
                resetPopup.style.display = "none"; // Close popup
            }, 2000);
        })
        .catch((error) => {
            resetMessage.innerText = "No account found with that email.";
        });
};

// Function to show fading logo animation
function playIntroAnimation() {
    document.body.innerHTML = `
        <div class="intro-animation">
            <img src="your-logo.png" alt="Logo">
        </div>
    `;
}
