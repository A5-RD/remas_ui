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


  // Remove the minimize button at the top of the right panel
  const rightPanelTopMinimize = document.querySelector("#right-panel .minimize-button");
  if (rightPanelTopMinimize) {
      rightPanelTopMinimize.remove();
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

});