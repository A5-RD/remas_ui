import { auth, storage } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { ref, listAll, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";

document.addEventListener("DOMContentLoaded", () => {
  const simContainer = document.getElementById("simulation-container");

  // Hide container until authenticated
  simContainer.style.display = "none";

  onAuthStateChanged(auth, user => {
    if (!user) {
      window.location.href = "index.html";
    } else {
      simContainer.style.display = "flex";
      //loadUserFiles(user.email);
    }
  });

  function loadUserFiles(email) {
    const storageRef = ref(storage, `users/${email}/memories`);
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


  const rightPanel = document.getElementById("right-panel");
  // Panel Resize
  rightPanel.addEventListener("mousedown", e => {
    if (e.offsetX < 8) {  // Check if the mouse is within the resizing area
      e.preventDefault();
      document.addEventListener("mousemove", resizePanel);
      document.addEventListener("mouseup", stopResize);
    }
  });

  function resizePanel(e) {
    let newWidth = window.innerWidth - e.clientX;

    // If the new width is within 20px of 0, set it to 0
    if (newWidth < 100) {
      newWidth = 0;
    }

    // Ensure the width stays within the defined range (100px - 600px)
    if (newWidth >= 0 && newWidth <= 600) {
      rightPanel.style.width = newWidth + "px";
    }
  }

  function stopResize() {
    document.removeEventListener("mousemove", resizePanel);
    document.removeEventListener("mouseup", stopResize);
  }

  // const fileExplorer = document.getElementById("file-explorer");
  // const fileExplorerHeader = document.getElementById("file-explorer-header");
  // const fileList = document.getElementById("file-list");
  // For resizing file explorer
  // fileExplorer.addEventListener("mousedown", e => {
  //   if (e.offsetY > fileExplorer.offsetHeight - 8) { // Detect drag on the bottom edge
  //     e.preventDefault();
  //     document.addEventListener("mousemove", resizeFileExplorer);
  //     document.addEventListener("mouseup", stopResizeFileExplorer);
  //   }
  // });

  // function resizeFileExplorer(e) {
  //   const newHeight = e.clientY - fileExplorer.getBoundingClientRect().top;
  //   if (newHeight >= 30 && newHeight <= window.innerHeight - 100) { // Minimum and maximum height
  //     fileExplorer.style.height = newHeight + "px";
  //   }
  // }
  //
  // function stopResizeFileExplorer() {
  //   document.removeEventListener("mousemove", resizeFileExplorer);
  //   document.removeEventListener("mouseup", stopResizeFileExplorer);
  // }


  const psiBtn = document.getElementById("psi-btn");
  const sigmaBtn = document.getElementById("sigma-btn");
  const psiContainer = document.getElementById("psi-container");
  const sigmaContainer = document.getElementById("sigma-container");


  // Default view: Psi is selected
  showPsiContainer();

  // Switch between Psi and Sigma tabs
  psiBtn.addEventListener("click", () => {
    psiBtn.classList.add("selected");
    sigmaBtn.classList.remove("selected");
    showPsiContainer();
  });

  sigmaBtn.addEventListener("click", () => {
    sigmaBtn.classList.add("selected");
    psiBtn.classList.remove("selected");
    showSigmaContainer();
  });

  function showPsiContainer() {
    // Hide both containers
    psiContainer.style.display = "block";
    sigmaContainer.style.display = "none";
  }

  function showSigmaContainer() {
    // Hide both containers
    psiContainer.style.display = "none";
    sigmaContainer.style.display = "block";
  }

  const fullscreenBtn = document.getElementById("fullscreen-btn");

  // Fullscreen toggle
  fullscreenBtn.addEventListener("click", () => {
    const elem = document.documentElement;
    if (!document.fullscreenElement) {
      elem.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  });


  // Start with Psi active (optional)
  psiContainer.classList.add('active');



});
