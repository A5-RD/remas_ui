// Import Firebase authentication
import { storage } from "./firebase.js";  // Import Firebase Storage
import { ref, listAll, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";  // Import storage functions
import { auth } from "./firebase.js";  // Import auth
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js"; // Import Auth function



document.addEventListener("DOMContentLoaded", function () {

  // Check user authentication status
  onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("✅ User is logged in:", user.email);
        loadUserFiles(user.email);
    } else {
        console.warn("⚠️ No user logged in. Redirecting...");
        window.location.href = "index.html";
    }
  });

  // Load files from Firebase Storage under users/{email}/files
  function loadUserFiles(email) {
    const storageRef = ref(storage, `users/${email}/files`);  // ✅ Correct way to get a reference
    console.log("📂 Loading files from:", `users/${email}/files`);

    listAll(storageRef)  // ✅ Correct way to list all files
        .then(result => {
            console.log("📂 Files found:", result.items);

            const fileList = document.getElementById("file-list");
            fileList.innerHTML = "";

            if (result.items.length === 0) {
                fileList.innerHTML = "<li>No files found.</li>";
            } else {
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
            console.error("❌ Error loading files:", error);
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
