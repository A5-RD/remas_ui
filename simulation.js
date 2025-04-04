import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getStorage, ref, listAll, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";

// Firebase Configuration (use the same as in your auth.js)
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
const storage = getStorage(app);

document.addEventListener("DOMContentLoaded", function () {
  // Check if user is logged in (using modular SDK)
  onAuthStateChanged(auth, function(user) {
    if (!user) {
      // Redirect to login page if not authenticated
      window.location.href = "index.html";
    } else {
      // Load user files if authenticated
      loadUserFiles(user.email);
    }
  });

  // Load files from Firebase Storage under users/{email}/files
  function loadUserFiles(email) {
    const storageRef = ref(storage, `users/${email}/files`);
    const fileList = document.getElementById("file-list");
    fileList.innerHTML = "<li>Loading files...</li>";
    console.log("Loading files from: users/" + email + "/files");

    listAll(storageRef)
      .then(result => {
        if (result.items.length === 0) {
          fileList.innerHTML = "<li>No files found.</li>";
        } else {
          fileList.innerHTML = "";
          result.items.forEach(fileRef => {
            getDownloadURL(fileRef).then(url => {
              const li = document.createElement("li");
              li.textContent = fileRef.name;
              li.onclick = () => window.open(url, "_blank");
              fileList.appendChild(li);
            });
          });
        }
      })
      .catch(error => {
        console.error("Error loading files:", error);
        fileList.innerHTML = "<li>Error loading files. Please check console.</li>";
      });
  }

  // The rest of your code remains unchanged
});
