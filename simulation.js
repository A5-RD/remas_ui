// Firebase Configuration
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
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const storage = firebase.storage();

// Load user files from Firebase Storage
function loadUserFiles(email) {
  const storageRef = storage.ref(`users/${email}/files`);
  const fileList = document.getElementById("file-list");
  fileList.innerHTML = "<li>Loading files...</li>";

  console.log("Loading files from: users/" + email + "/files");
  storageRef.listAll()
    .then(result => {
      if (result.items.length === 0) {
        fileList.innerHTML = "<li>No files found.</li>";
      } else {
        fileList.innerHTML = "";
        result.items.forEach(fileRef => {
          fileRef.getDownloadURL().then(url => {
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

// Minimize the right panel
document.getElementById("minimize-panel").addEventListener("click", function() {
  const panel = document.getElementById("right-panel");
  panel.style.display = (panel.style.display === "none") ? "block" : "none";
});

// Minimize the file explorer
document.getElementById("minimize-explorer").addEventListener("click", function() {
  const explorer = document.getElementById("file-explorer");
  explorer.style.display = (explorer.style.display === "none") ? "block" : "none";
});

// Fullscreen toggle
document.getElementById("fullscreen-btn").addEventListener("click", function() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});
