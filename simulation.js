import { auth, storage } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { ref, listAll, getDownloadURL , uploadString} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";

document.addEventListener("DOMContentLoaded", () => {
  const simContainer = document.getElementById("simulation-container");

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


  function waitForIframeAndSend(iframe, message, maxAttempts = 10) {
    let attempts = 0;

    function trySend() {
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(message, "*");
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(trySend, 100); // retry after 100ms
      } else {
        console.warn("iframe still not available after retries.");
      }
    }

    trySend();
  }

  const iframe = document.getElementById("simulation-editor");
  console.log("iframe:", iframe);
  console.log("iframe.contentWindow:", iframe?.contentWindow);


  function loadUserFiles(email) {
    const storageRef = ref(storage, `users/${email}/memories`);
    const fileList = document.getElementById("file-list");
    fileList.innerHTML = "<li>Loading files...</li>";

    const iframe = document.getElementById("simulation-editor");

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
              li.classList.add("file-item");
              li.dataset.filename = fileRef.name;

              li.addEventListener("click", (e) => {
                if (e.shiftKey) {
                  console.log("Shift-click detected for file:", fileRef.name);

                  getDownloadURL(fileRef).then(url => {
                    fetch(url)
                      .then(response => response.json())
                      .then(data => {
                        // Set editor contents
                        document.getElementById('json-filename').textContent = `Editing: ${fileRef.name}`;
                        document.getElementById('json-textarea').value = JSON.stringify(data, null, 2);

                        // Show editor
                        const ed = document.getElementById('json-editor');
                        ed.style.display = 'flex';
                        ed.dataset.filename = fileRef.name; // Save for later (e.g. saving)
                      })
                      .catch(err => {
                        console.error("Error fetching file contents:", err);
                      });
                  });
                }
              });


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





  // RIGHT PANEL
  const rightPanel = document.getElementById("right-panel");
  const iframeOverlay = document.getElementById("iframe-overlay");

  rightPanel.addEventListener("mousedown", e => {
    if (e.offsetX < 8) {
      e.preventDefault();

      // Show overlay to block iframe interference
      iframeOverlay.style.display = "block";

      // Attach listeners to overlay
      iframeOverlay.addEventListener("mousemove", resizePanel);
      iframeOverlay.addEventListener("mouseup", stopResize);
    }
  });

  function resizePanel(e) {
    let newWidth = window.innerWidth - e.clientX;

    if (newWidth < 140) {
      newWidth = 0;
    }

    if (newWidth >= 0 && newWidth <= 600) {
      rightPanel.style.width = newWidth + "px";
    }
  }

  function stopResize() {
    iframeOverlay.style.display = "none";

    // Clean up listeners
    iframeOverlay.removeEventListener("mousemove", resizePanel);
    iframeOverlay.removeEventListener("mouseup", stopResize);
  }


  const psiBtn = document.getElementById("psi-btn");
  const sigmaBtn = document.getElementById("sigma-btn");
  const psiContainer = document.getElementById("psi-container");
  const sigmaContainer = document.getElementById("sigma-container");

  const overlay = document.getElementById("iframe-overlay");

  rightPanel.addEventListener("mousedown", e => {
    if (e.offsetX < 8) {
      e.preventDefault();
      overlay.style.display = "block"; // block iframe during resize
      document.addEventListener("mousemove", resizePanel);
      document.addEventListener("mouseup", stopResize);
    }
  });

  function stopResize() {
    overlay.style.display = "none"; // restore iframe access
    document.removeEventListener("mousemove", resizePanel);
    document.removeEventListener("mouseup", stopResize);
  }

  // File Explorer
  const fileExplorer = document.getElementById("file-explorer");
  const fileExplorerHeader = document.getElementById("file-explorer-header");
  const fileList = document.getElementById("file-list");
  // For resizing file explorer
  fileExplorer.addEventListener("mousedown", e => {
    if (e.offsetY > fileExplorer.offsetHeight - 8) { // Detect drag on the bottom edge
      e.preventDefault();
      document.addEventListener("mousemove", resizeFileExplorer);
      document.addEventListener("mouseup", stopResizeFileExplorer);
    }
  });

  function resizeFileExplorer(e) {
    const newHeight = e.clientY - fileExplorer.getBoundingClientRect().top;
    if (newHeight >= 30 && newHeight <= window.innerHeight - 100) { // Minimum and maximum height
      fileExplorer.style.height = newHeight + "px";
    }
  }

  function stopResizeFileExplorer() {
    document.removeEventListener("mousemove", resizeFileExplorer);
    document.removeEventListener("mouseup", stopResizeFileExplorer);
  }

  const selectedFiles = new Set();

  fileList.addEventListener("click", (event) => {
    if (event.target.tagName === "LI") {
      const fileName = event.target.textContent;

      if (selectedFiles.has(fileName)) {
        selectedFiles.delete(fileName);
        event.target.classList.remove("selected");
      } else {
        selectedFiles.add(fileName);
        event.target.classList.add("selected");
      }

      console.log("Selected files:", [...selectedFiles]);
    }
  });


  // PSI AND SIGMA
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

  // API INTEGRATION
  const apiBase = "https://remas-api-507506689237.us-central1.run.app";

  // Start Simulation
  document.getElementById("start").addEventListener("click", async () => {
    try {
      const response = await fetch(`${apiBase}/start`, {
        method: "POST"
      });
      if (!response.ok) throw new Error("Start failed");
      console.log("Simulation started");
    } catch (error) {
      console.error("Error starting simulation:", error);
    }
  });

  // Stop Simulation
  document.getElementById("stop").addEventListener("click", async () => {
    try {
      const response = await fetch(`${apiBase}/stop`, {
        method: "POST"
      });
      if (!response.ok) throw new Error("Stop failed");
      console.log("Simulation stopped");
    } catch (error) {
      console.error("Error stopping simulation:", error);
    }
  });


  // Add File
  async function uploadFile(user, file) {
    const filename = await getUniqueFilename(user);

    const formData = new FormData();
    formData.append("user", user);
    formData.append("filename", filename);
    formData.append("file", file);

    const res = await fetch("https://remas-api-507506689237.us-central1.run.app/add-map", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();
    return result;
  }

  const addMapButton = document.getElementById("add-map");
  const fileInput = document.getElementById("file-input");


  async function getUniqueFilename(user) {
    const existing = await getExistingFilenames(user);
    let attempts = 0;

    while (attempts < 1000) {
      const candidate = generateRandomName();
      if (!existing.includes(candidate)) {
        return candidate;
      }
      attempts++;
    }

    throw new Error("Could not find a unique filename after many attempts");
  }


  function generateRandomName() {
    const letters = Array.from({ length: 5 }, () =>
      String.fromCharCode(97 + Math.floor(Math.random() * 26))
    ).join("");
    const digits = Array.from({ length: 5 }, () =>
      Math.floor(Math.random() * 10)
    ).join("");
    return letters + digits + ".json";
  }


  async function getExistingFilenames(user) {
    const res = await fetch(`https://remas-api-507506689237.us-central1.run.app/${user}/memories`);
    const data = await res.json();
    return data;
  }

  addMapButton.addEventListener("click", () => {
    fileInput.click(); // Show file picker
  });

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file || file.type !== "application/json") {
      return;
    }

    const user = auth.currentUser?.email;
    if (!user) {
      alert("User not authenticated");
      return;
    }

    try {
      const result = await uploadFile(user, file);
      alert("Uploaded successfully as " + result.filename);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }
  });

  // Delete
  const removeMapButton = document.getElementById("remove-map");

  removeMapButton.addEventListener("click", async () => {
    if (selectedFiles.size === 0) {
      alert("Please select one or more memory files to delete.");
      return;
    }

    const confirmDelete = confirm(`Are you sure you want to delete ${selectedFiles.size} file(s)?`);
    if (!confirmDelete) return;

    const user = auth.currentUser?.email;
    if (!user) {
      alert("User not authenticated");
      return;
    }

    const filesToDelete = [...selectedFiles];

    for (const fileName of filesToDelete) {
      try {
        const encodedFile = encodeURIComponent(fileName);
        const res = await fetch(`https://remas-api-507506689237.us-central1.run.app/${user}/memories/${encodedFile}`, {
          method: "DELETE"
        });

        if (res.ok) {
          // Remove from list
          const li = [...fileList.children].find(li => li.textContent === fileName);
          if (li) li.remove();

          // Remove from selection
          selectedFiles.delete(fileName);
        } else {
          alert(`Failed to delete ${fileName}`);
        }
      } catch (err) {
        console.error(`Error deleting ${fileName}:`, err);
        alert(`Error deleting ${fileName}`);
      }
    }
  });



  window.addEventListener('delete-file', e => {
    const filename = e.detail.filename;

    const fileItems = document.querySelectorAll('#file-list .file-item');
    fileItems.forEach(item => {
      if (item.textContent.trim() === filename) {
        item.classList.add('selected'); // If your delete button depends on this
        document.getElementById('remove-map').click(); // Simulate the delete click
      }
    });
  });



  // Search
  const findButton = document.getElementById("find");
  const searchContainer = document.getElementById("searchContainer");
  const searchInput = document.getElementById("searchInput");


  findButton.addEventListener("click", () => {
    const isVisible = searchContainer.style.display === "block";
    searchContainer.style.display = isVisible ? "none" : "block";
    if (!isVisible) {
      searchInput.focus();
    } else {
      clearSearch();
    }
  });

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    const items = fileList.querySelectorAll("li");

    let firstMatch = null;

    items.forEach(item => {
      const name = item.textContent.trim().toLowerCase();

      if (query === "" || name.startsWith(query)) {
        item.style.display = "list-item";

        if (!firstMatch) {
          firstMatch = item;
        }
      } else {
        item.style.display = "none";
      }

      // clear all highlights
      item.style.backgroundColor = "";
    });

    // highlight and scroll to first match
    if (firstMatch) {
      firstMatch.style.backgroundColor = "#e0e0e0";
      firstMatch.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  });

  function clearSearch() {
    searchInput.value = "";
    const items = fileList.querySelectorAll("li");
    items.forEach(item => {
      item.style.display = "list-item";
      item.style.backgroundColor = "";
    });
  }

  const psiIframe = document.getElementById("psi-iframe");

  if (psiIframe && psiIframe.contentWindow) {
    psiIframe.contentWindow.postMessage({
      type: "open-json-file",
      filename: "example.json",
      content: '{ "foo": "bar" }'
    }, "*");
  } else {
    console.warn("psi-iframe not found or not loaded yet.");
  }

  window.addEventListener("DOMContentLoaded", () => {
    const iframe = document.getElementById("psi-iframe");

    document.querySelectorAll(".file-link").forEach(link => {
      link.addEventListener("click", (event) => {
        if (!event.shiftKey) return; // ⬅️ only proceed if Shift key is held

        event.preventDefault(); // ⬅️ just in case it's a link
        const filename = link.dataset.filename;

        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage({
            type: "open-json-file",
            filename
          }, "*");
          console.log("Shift+clicked file:", filename);
        }
      });
    });
  });


  // Json editor
  document.getElementById('close-json-editor').onclick = () => {
    document.getElementById('json-editor').style.display = 'none';
  };

  document.getElementById('save-json-btn').onclick = async () => {
    const id = document.getElementById('json-editor').dataset.nodeId;
    try {
      const data = JSON.parse(document.getElementById('json-textarea').value);
      await uploadString(ref(storage, `users/${auth.currentUser.email}/memories/${id}.json`), JSON.stringify(data));
      document.getElementById('json-editor').style.display = 'none';
    } catch(e) { alert('Save error'); console.error(e); }
  };

  document.getElementById('download-json-btn').onclick = () => {
    const filename = document.getElementById('json-editor').dataset.nodeId + '.json';
    const json = document.getElementById('json-textarea').value;

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url); // clean up
  };

  document.getElementById('delete-json-btn').onclick = () => {
    const id = document.getElementById('json-editor').dataset.nodeId;

    // Dispatch a custom event or simulate click if integrated in same DOM
    const event = new CustomEvent('delete-file', { detail: { filename: id + '.json' } });
    window.dispatchEvent(event); // or window.parent if this page is inside an iframe

    document.getElementById('json-editor').style.display = 'none';
  };




});
