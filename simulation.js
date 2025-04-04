// Import Firebase authentication
import { storage , auth} from "./firebase.js";  // Import Firebase Storage
import { ref, listAll, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";  // Import storage functions
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


  // File Explorer Minimize Button
  const fileExplorer = document.getElementById("file-explorer");
  const fileExplorerMinimize = document.createElement("button");
  fileExplorerMinimize.id = "file-explorer-minimize";
  fileExplorerMinimize.innerHTML = "−"; // Minimize symbol
  document.getElementById("file-explorer-header").appendChild(fileExplorerMinimize);

  fileExplorerMinimize.addEventListener("click", function () {
      fileExplorer.classList.toggle("collapsed");
  });

  // Resizable Right Panel
  rightPanel.addEventListener("mousedown", function (e) {
    if (e.offsetX < 8) {
      e.preventDefault();
      document.addEventListener("mousemove", resizeRightPanel);
      document.addEventListener("mouseup", stopResizingRightPanel);
    }
  });

  function resizeRightPanel(e) {
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth >= 10 && newWidth <= 600) {
      rightPanel.style.width = newWidth + "px";
      if (newWidth <= 20) {
        rightPanel.classList.add("hidden");
      } else {
        rightPanel.classList.remove("hidden");
      }
    }
  }




  
  function stopResizingRightPanel() {
    document.removeEventListener("mousemove", resizeRightPanel);
    document.removeEventListener("mouseup", stopResizingRightPanel);
  }

  // Show glow effect when hovering near right edge
  document.addEventListener("mousemove", function (e) {
    if (e.clientX > window.innerWidth - 10) {
      rightPanelGlow.classList.add("visible");
    } else {
      rightPanelGlow.classList.remove("visible");
    }
  });

  // Expand right panel when dragging from right edge
  rightPanelGlow.addEventListener("mousedown", function (e) {
    if (rightPanel.classList.contains("hidden")) {
      rightPanel.classList.remove("hidden");
      rightPanel.style.width = "300px";
    }
  });

});