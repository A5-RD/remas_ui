// Import Firebase authentication

import { auth } from './firebase.js';  // Import from firebase.js
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";  // Import onAuthStateChanged


document.addEventListener("DOMContentLoaded", function () {
  
  // Check user authentication status
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
        console.log("✅ User is logged in:", user.email);
        loadUserFiles(user.email);  // Call the function with the user's email
    } else {
        console.warn("⚠️ No user is logged in. Redirecting to login...");
        window.location.href = "index.html";  // Redirect if not logged in
    }
  });

  // Load files from Firebase Storage under users/{email}/files
  function loadUserFiles(email) {
    const storageRef = storage.ref(`users/${email}/files`);
    const fileList = document.getElementById("file-list");

    fileList.innerHTML = "<li>Loading files...</li>";
    console.log("🔍 Attempting to load files from path:", `users/${email}/files`);

    storageRef.listAll()
      .then(result => {
        console.log("✅ Storage listAll() success. Items found:", result.items.length);

        if (result.items.length === 0) {
          fileList.innerHTML = "<li>No files found.</li>";
          console.log("⚠️ No files found for user:", email);
        } else {
          fileList.innerHTML = "";
          result.items.forEach(fileRef => {
            console.log("📂 Found file:", fileRef.name);

            fileRef.getDownloadURL()
              .then(url => {
                console.log("🔗 File URL retrieved:", url);
                const li = document.createElement("li");
                li.textContent = fileRef.name;
                li.onclick = () => window.open(url, "_blank");
                fileList.appendChild(li);
              })
              .catch(urlError => {
                console.error("❌ Error getting download URL for", fileRef.name, urlError);
              });
          });
        }
      })
      .catch(error => {
        console.error("❌ Error loading files:", error);
        fileList.innerHTML = "<li>Error loading files. Please check console.</li>";
      });
}


  // Toggle Right Panel (minimize/restore)
  const rightPanel = document.getElementById("right-panel");
  const minimizePanelBtn = document.getElementById("minimize-panel");
  minimizePanelBtn.addEventListener("click", function () {
    if (rightPanel.classList.contains("minimized")) {
      rightPanel.classList.remove("minimized");
    } else {
      rightPanel.classList.add("minimized");
    }
  });

  // Toggle File Explorer (minimize/restore) inside the right panel
  const fileExplorer = document.getElementById("file-explorer");
  const minimizeExplorerBtn = document.getElementById("minimize-explorer");
  minimizeExplorerBtn.addEventListener("click", function () {
    if (fileExplorer.classList.contains("minimized")) {
      fileExplorer.classList.remove("minimized");
      minimizeExplorerBtn.textContent = "➖";
    } else {
      fileExplorer.classList.add("minimized");
      minimizeExplorerBtn.textContent = "➕";
    }
  });

  // Fullscreen Toggle for the simulation canvas
  const fullscreenBtn = document.getElementById("fullscreen-btn");
  fullscreenBtn.addEventListener("click", function () {
    const canvas = document.getElementById("simulation-canvas");
    if (!document.fullscreenElement) {
      canvas.requestFullscreen().catch(err => console.error("Error entering fullscreen:", err));
    } else {
      document.exitFullscreen().catch(err => console.error("Error exiting fullscreen:", err));
    }
  });

  // (Optional) Resizable Right Panel: Drag the left edge to adjust width
  rightPanel.addEventListener("mousedown", function (e) {
    // Only trigger resizing if near the left edge (e.g., within 8px)
    if (e.offsetX < 8) {
      e.preventDefault();
      document.addEventListener("mousemove", resizeRightPanel);
      document.addEventListener("mouseup", stopResizingRightPanel);
    }
  });

  function resizeRightPanel(e) {
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth >= 200 && newWidth <= 600) {
      rightPanel.style.width = newWidth + "px";
    }
  }
  
  function stopResizingRightPanel() {
    document.removeEventListener("mousemove", resizeRightPanel);
    document.removeEventListener("mouseup", stopResizingRightPanel);
  }

  // (Optional) Resizable File Explorer: Drag the top edge to adjust its height
  fileExplorer.addEventListener("mousedown", function (e) {
    // Trigger resizing if near the top edge (e.g., within 8px)
    if (e.offsetY < 8) {
      e.preventDefault();
      document.addEventListener("mousemove", resizeFileExplorer);
      document.addEventListener("mouseup", stopResizingFileExplorer);
    }
  });

  function resizeFileExplorer(e) {
    const newHeight = window.innerHeight - e.clientY;
    if (newHeight >= 150 && newHeight <= 600) {
      fileExplorer.style.height = newHeight + "px";
    }
  }

  function stopResizingFileExplorer() {
    document.removeEventListener("mousemove", resizeFileExplorer);
    document.removeEventListener("mouseup", stopResizingFileExplorer);
  }
});
