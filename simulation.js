// Firebase Initialization
const firebaseConfig = {
    apiKey: "AIzaSyA9WkNeMgcrgmhUA97UPbp7R4pj-IZFnK0",
    authDomain: "atom5engineering.firebaseapp.com",
    projectId: "atom5engineering",
    storageBucket: "atom5engineering.appspot.com", // Use your actual Firebase Storage bucket here
    messagingSenderId: "956458197323",
    appId: "1:956458197323:web:e01873bb7fa92ac70a08ce",
    measurementId: "G-X7H184TN54"
};
firebase.initializeApp(firebaseConfig);

const storage = firebase.storage();
const auth = firebase.auth();

// Ensure the user is authenticated
auth.onAuthStateChanged(function(user) {
    if (user) {
        // User is logged in, now fetch their files from Firebase Storage
        loadFiles(user);
    } else {
        // Redirect to login page if not authenticated
        window.location.href = "index.html";
    }
});

// Function to load files from Firebase Storage
function loadFiles(user) {
    const userBucketPath = `users/${user.uid}/files/`; // Adjust path as needed
    const fileList = document.getElementById("file-list");

    // Get reference to the user's folder in Firebase Storage
    const filesRef = storage.ref(userBucketPath);

    // List all the files in the user's folder
    filesRef.listAll().then((result) => {
        result.items.forEach((fileRef) => {
            // For each file, create a list item
            const li = document.createElement("li");
            li.textContent = fileRef.name;  // Display file name
            li.onclick = function() {
                // Handle file click (e.g., open and load JSON file)
                openFile(fileRef);
            };
            fileList.appendChild(li);
        });
    }).catch((error) => {
        console.error("Error loading files:", error);
        fileList.innerHTML = "Failed to load files.";
    });
}

// Function to open and manipulate a clicked file (e.g., JSON)
function openFile(fileRef) {
    fileRef.getDownloadURL().then((url) => {
        // Fetch the file content (JSON) from the URL
        fetch(url)
            .then(response => response.json())
            .then(data => {
                console.log("File Content:", data);
                // Process the file content as needed, e.g., send to API for manipulation
                // You can also display it in the simulation area, if needed
            })
            .catch((error) => {
                console.error("Error fetching file:", error);
            });
    }).catch((error) => {
        console.error("Error getting file URL:", error);
    });
}

// Minimize or close file explorer functionality (as you had before)
document.getElementById("minimize-explorer").addEventListener("click", function() {
    document.getElementById("file-explorer").classList.toggle("minimized");
});
