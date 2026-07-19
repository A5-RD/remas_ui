import { auth, storage } from "./firebase.js?v=20260605";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { ref, listAll, getBytes, uploadString, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";

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
      loadObjectsList(user.email);
    }
  });
  function loadUserFiles(email) {
    const storageRef = ref(storage, `users/${email}/memories`);
    const fileList = document.getElementById("file-list");
    fileList.innerHTML = "<li>Loading files...</li>";

    listAll(storageRef)
      .then(result => {
        fileList.innerHTML = "";

        if (result.items.length === 0) {
          fileList.innerHTML = "<li>No files found.</li>";
        } else {
          result.items.forEach(fileRef => {
            const li = document.createElement("li");
            li.textContent = fileRef.name;
            li.classList.add("file-item");
            li.dataset.filename = fileRef.name;

            li.addEventListener("click", async (e) => {
              if (e.shiftKey) {
                console.log("Shift-click detected for file:", fileRef.name);
                try {
                  const bytes = await getBytes(fileRef);
                  const text = new TextDecoder().decode(bytes);
                  const data = JSON.parse(text);

                  // Set editor contents
                  document.getElementById('json-filename').textContent = `Editing: ${fileRef.name}`;
                  document.getElementById('json-textarea').value = JSON.stringify(data, null, 2);

                  // Show editor
                  const ed = document.getElementById('json-editor');
                  ed.style.display = 'flex';
                  ed.dataset.filename = fileRef.name; // Save for later (e.g. saving)
                } catch (err) {
                  console.error("Error fetching file contents:", err);
                }
              }
            });


            fileList.appendChild(li);
          });
        }
      })
      .catch(error => {
        console.error("Error loading files:", error);
        if (error?.code === "storage/unauthorized") {
          fileList.innerHTML = "<li>Permission denied. Check Firebase Storage Rules for users/{email}/memories.</li>";
        } else {
          fileList.innerHTML = "<li>Error loading files. Check console.</li>";
        }
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
  const uploadBlendButton = document.getElementById("upload-blend");
  const blendFileInput = document.getElementById("blend-file-input");


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

  const RENDERABLE_EXTS = new Set(['glb', 'gltf', 'obj']);
  const NEEDS_CONVERSION_EXTS = new Set(['blend', 'blend1']);

  async function uploadObjectFile(userEmail, file) {
    const objectRef = ref(storage, `users/${userEmail}/objects/${file.name}`);
    const snapshot = await uploadBytes(objectRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return { downloadURL, filename: file.name };
  }

  async function convertBlendOnBackend(filename) {
    const token = await auth.currentUser.getIdToken();
    const res = await fetch(`${apiBase}/api/blender/convert/${encodeURIComponent(filename)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Conversion failed (${res.status})`);
    }
    return res.json(); // { url, filename }
  }

  function loadObjectInSigma(downloadURL, filename) {
    const sigmaIframe = document.getElementById('sigma-iframe');
    if (sigmaIframe?.contentWindow) {
      sigmaIframe.contentWindow.postMessage(
        { type: 'load-model', url: downloadURL, filename },
        '*'
      );
    }
  }

  function addObjectToList(filename, downloadURL) {
    const objectsList = document.getElementById('objects-list');
    const emptyMsg = objectsList.querySelector('.empty-msg');
    if (emptyMsg) emptyMsg.remove();

    const existing = [...objectsList.querySelectorAll('li')].find(li => li.dataset.filename === filename);
    if (existing) return;

    const li = document.createElement('li');
    li.textContent = filename;
    li.dataset.filename = filename;
    li.dataset.url = downloadURL || '';
    li.classList.add('file-item');
    li.title = 'Click to view in Sigma';
    li.addEventListener('click', () => {
      const url = li.dataset.url;
      if (!url) return;
      sigmaBtn.click();
      loadObjectInSigma(url, filename);
    });
    objectsList.appendChild(li);
    return li;
  }

  async function loadObjectsList(userEmail) {
    const objectsList = document.getElementById('objects-list');
    objectsList.innerHTML = '';

    try {
      const objectsRef = ref(storage, `users/${userEmail}/objects`);
      const result = await listAll(objectsRef);

      const renderableItems = result.items.filter(item => {
        const ext = item.name.split('.').pop().toLowerCase();
        return RENDERABLE_EXTS.has(ext);
      });

      if (renderableItems.length === 0) {
        objectsList.innerHTML = '<li class="empty-msg">No objects uploaded.</li>';
        return;
      }

      for (const itemRef of renderableItems) {
        const url = await getDownloadURL(itemRef);
        addObjectToList(itemRef.name, url);
      }
    } catch (err) {
      console.error('Error loading objects:', err);
      objectsList.innerHTML = '<li class="empty-msg">Error loading objects.</li>';
    }
  }

  if (uploadBlendButton && blendFileInput) {
    uploadBlendButton.addEventListener("click", () => {
      blendFileInput.click();
    });

    blendFileInput.addEventListener("change", async () => {
      const file = blendFileInput.files && blendFileInput.files[0];
      if (!file) return;

      const ext = file.name.split('.').pop().toLowerCase();
      const userEmail = auth.currentUser?.email;
      if (!userEmail) {
        alert("User not authenticated");
        blendFileInput.value = "";
        return;
      }

      try {
        if (NEEDS_CONVERSION_EXTS.has(ext)) {
          // Upload .blend to Firebase Storage first
          await uploadObjectFile(userEmail, file);

          // Show a status item while converting
          const objectsList = document.getElementById('objects-list');
          const emptyMsg = objectsList.querySelector('.empty-msg');
          if (emptyMsg) emptyMsg.remove();
          const converting = document.createElement('li');
          converting.textContent = `Converting ${file.name}…`;
          converting.style.color = '#00d0ff';
          converting.classList.add('file-item');
          objectsList.appendChild(converting);

          // Ask backend to convert .blend → .glb
          const { url, filename: glbName } = await convertBlendOnBackend(file.name);
          converting.remove();

          addObjectToList(glbName, url);
          sigmaBtn.click();
          loadObjectInSigma(url, glbName);

        } else if (RENDERABLE_EXTS.has(ext)) {
          const { downloadURL, filename } = await uploadObjectFile(userEmail, file);
          addObjectToList(filename, downloadURL);
          sigmaBtn.click();
          loadObjectInSigma(downloadURL, filename);

        } else {
          alert(`Unsupported file type: .${ext}\nSupported: .blend, .glb, .gltf, .obj`);
        }
      } catch (err) {
        console.error(err);
        alert(`Upload failed: ${err.message}`);
      } finally {
        blendFileInput.value = "";
      }
    });
  }

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
