// simulation.js
import { auth, storage } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { ref, listAll, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";

document.addEventListener("DOMContentLoaded", () => {
  const simContainer = document.getElementById("simulation-container");
  const fileList = document.getElementById("file-list");
  const rightPanel = document.getElementById("right-panel");
  const glowHandle = document.getElementById("right-panel-glow");
  const fullscreenBtn = document.getElementById("fullscreen-btn");

  // Hide container until authenticated
  simContainer.style.display = "none";

  onAuthStateChanged(auth, user => {
    if (!user) {
      window.location.href = "index.html";
    } else {
      simContainer.style.display = "flex";
      loadUserFiles(user.email);
    }
  });

  function loadUserFiles(email) {
    const storageRef = ref(storage, `users/${email}/files`);
    fileList.innerHTML = "<li>Loading files...</li>";

    listAll(storageRef)
      .then(result => {
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
        console.error("Error loading files:", error);
        fileList.innerHTML = "<li>Error loading files. Check console.</li>";
      });
  }

  // Fullscreen toggle
  fullscreenBtn.addEventListener("click", () => {
    const elem = document.documentElement;
    if (!document.fullscreenElement) {
      elem.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  });

  // Resizable right panel by dragging left edge
  rightPanel.addEventListener("mousedown", e => {
    // if clicking near the left edge of the panel
    if (e.offsetX < 8) {
      e.preventDefault();
      // ensure panel is expanded
      rightPanel.classList.remove("collapsed");
      document.addEventListener("mousemove", resizePanel);
      document.addEventListener("mouseup", stopResize);
    }
  });

  function resizePanel(e) {
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth >= 100 && newWidth <= 600) {
      rightPanel.style.width = newWidth + "px";
    }
  }
  function stopResize() {
    document.removeEventListener("mousemove", resizePanel);
    document.removeEventListener("mouseup", stopResize);
  }

  // Collapse/expand via glow handle
  glowHandle.addEventListener("click", () => {
    rightPanel.classList.toggle("collapsed");
  });
});
