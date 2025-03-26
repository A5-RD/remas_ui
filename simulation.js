// Firebase Initialization
const firebaseConfig = {
  apiKey: "AIzaSyA9WkNeMgcrgmhUA97UPbp7R4pj-IZFnK0",
  authDomain: "atom5engineering.firebaseapp.com",
  projectId: "atom5engineering",
  storageBucket: "atom5engineering.firebasestorage.app", // Correct bucket name
  messagingSenderId: "956458197323",
  appId: "1:956458197323:web:e01873bb7fa92ac70a08ce",
  measurementId: "G-X7H184TN54"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const storage = firebase.storage();
const auth = firebase.auth();

// Ensure the user is authenticated
auth.onAuthStateChanged(async function(user) {
  if (user) {
    console.log("User authenticated:", user.email);
    const token = await user.getIdTokenResult();
    console.log("User token claims:", token.claims);

    loadFiles(user);
  } else {
    console.log("User not authenticated. Redirecting to login.");
    window.location.href = "index.html";
  }
});

// Function to load files from Firebase Storage
function loadFiles(user) {
  const sanitizedEmail = user.email.replace(/\./g, '_').replace(/@/g, '_at_');
  const userBucketPath = `users/${sanitizedEmail}/files/`;
  const fileList = document.getElementById("file-list");

  // Get reference to the user's folder in Firebase Storage
  const filesRef = storage.ref(userBucketPath);

  // List all the files in the user's folder
  filesRef.listAll().then((result) => {
    if (result.items.length === 0) {
      fileList.innerHTML = "<li>No files found.</li>";
    } else {
      result.items.forEach((fileRef) => {
        const li = document.createElement("li");
        li.textContent = fileRef.name; // Display file name
        li.onclick = function() {
          openFile(fileRef);
        };
        fileList.appendChild(li);
      });
    }
  }).catch((error) => {
    console.error("Error loading files:", error);
    fileList.innerHTML = `<li>Error loading files. ${error.message}</li>`;
  });
}

// Function to open and read a clicked file (e.g., JSON)
function openFile(fileRef) {
  fileRef.getDownloadURL().then((url) => {
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("File Content:", data);
      })
      .catch((error) => {
        console.error("Error fetching file:", error);
      });
  }).catch((error) => {
    console.error("Error getting file URL:", error);
  });
}

// Minimize or close file explorer
document.getElementById("minimize-explorer").addEventListener("click", function() {
  document.getElementById("file-explorer").classList.toggle("minimized");
});
