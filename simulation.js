import { auth, storage } from "./firebase.js?v=20260605";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { ref, listAll, getBytes, getMetadata, uploadString, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";

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

  function enableSectionResize(section) {
    const handle = section.querySelector('.section-resize-handle');
    if (!handle) return;

    const resizeSection = (event) => {
      const newHeight = event.clientY - section.getBoundingClientRect().top;
      if (newHeight >= 80 && newHeight <= window.innerHeight - 100) {
        section.style.height = `${newHeight}px`;
      }
    };

    const stopResizeSection = () => {
      document.removeEventListener('mousemove', resizeSection);
      document.removeEventListener('mouseup', stopResizeSection);
    };

    handle.addEventListener('mousedown', (event) => {
      event.preventDefault();
      document.addEventListener('mousemove', resizeSection);
      document.addEventListener('mouseup', stopResizeSection);
    });
  }

  enableSectionResize(fileExplorer);
  enableSectionResize(document.getElementById('objects-section'));

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

  function formatHeader(bytes) {
    const header = bytes.slice(0, 32);
    const hex = Array.from(header).map(byte => byte.toString(16).padStart(2, '0')).join(' ');
    const ascii = new TextDecoder('ascii', { fatal: false }).decode(header);
    const signature = ascii.startsWith('BLENDER')
      ? 'Blender .blend'
      : hex.startsWith('28 b5 2f fd')
        ? 'Zstandard-compressed data (not a directly readable .blend)'
        : 'unknown/non-Blender data';
    return { ascii, hex, signature };
  }

  async function readStoredObjectHeader(objectRef, filename) {
    const [metadata, downloadURL] = await Promise.all([
      getMetadata(objectRef),
      getDownloadURL(objectRef),
    ]);
    const response = await fetch(downloadURL, { headers: { Range: 'bytes=0-31' } });
    if (!response.ok) throw new Error(`Stored-header fetch failed (${response.status})`);

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Stored-header response has no readable body');
    const { value } = await reader.read();
    await reader.cancel();

    const header = formatHeader(value || new Uint8Array());
    console.log('[upload] Firebase object verification:', {
      filename,
      path: objectRef.fullPath,
      requestedRange: 'bytes=0-31',
      responseStatus: response.status,
      contentRange: response.headers.get('content-range'),
      contentEncoding: response.headers.get('content-encoding'),
      storageContentType: metadata.contentType,
      storageContentEncoding: metadata.contentEncoding || null,
      storageSize: metadata.size,
      storageMd5: metadata.md5Hash || null,
      header,
    });
    return header;
  }

  async function uploadObjectFile(userEmail, file) {
    try {
      const localHeader = formatHeader(new Uint8Array(await file.slice(0, 32).arrayBuffer()));
      console.log('[upload] local file verification:', {
        filename: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        lastModified: new Date(file.lastModified).toISOString(),
        header: localHeader,
      });

      const objectRef = ref(storage, `users/${userEmail}/objects/${file.name}`);
      const metadata = { contentType: file.type || 'application/octet-stream' };
      const snapshot = await uploadBytes(objectRef, file, metadata);
      const storedHeader = await readStoredObjectHeader(snapshot.ref, file.name);
      if (storedHeader.hex !== localHeader.hex) {
        console.error('[upload] HEADER MISMATCH: local and stored bytes differ', {
          filename: file.name,
          localHeader,
          storedHeader,
        });
      }
      const downloadURL = await getDownloadURL(snapshot.ref);
      return { downloadURL, filename: file.name };
    } catch (err) {
      console.error('[upload] uploadObjectFile failed for', file.name, err);
      throw err;
    }
  }

  async function listBlendObjects(filename) {
    const token = await auth.currentUser.getIdToken();
    const res = await fetch(`${apiBase}/api/blender/list-objects/${encodeURIComponent(filename)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const raw = await res.text();
      console.error('[blend] list-objects response status:', res.status, 'url:', res.url);
      console.error('[blend] response headers:', Array.from(res.headers.entries()));
      console.error('[blend] raw response body:', raw);
      let detail = "";
      try {
        detail = JSON.parse(raw)?.detail || "";
      } catch (_) {
        detail = raw?.trim?.() || "";
      }
      // surfaced error includes backend detail when available
      const errMsg = detail || `Failed to list objects (${res.status})`;
      console.error('[blend] detail:', errMsg);
      throw new Error(errMsg);
    }
    const data = await res.json();
    return data.objects; // [{ name, type, visible }]
  }

  async function convertBlendOnBackend(filename, selectedObjects) {
    const traceId = `ui-${Date.now()}-${crypto.randomUUID()}`;
    const requestUrl = `${apiBase}/api/blender/convert/${encodeURIComponent(filename)}`;
    const requestBody = selectedObjects && selectedObjects.length ? selectedObjects : null;
    const startedAt = performance.now();
    console.groupCollapsed(`[blend:${traceId}] conversion request`);
    console.log('filename:', filename);
    console.log('url:', requestUrl);
    console.log('selected object count:', selectedObjects?.length || 0);
    console.log('selected objects:', selectedObjects || []);
    console.log('online:', navigator.onLine);
    console.groupEnd();

    let res;
    try {
      const token = await auth.currentUser.getIdToken();
      res = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-REMAS-Trace-ID': traceId,
        },
        body: JSON.stringify(requestBody),
      });
    } catch (err) {
      console.error(`[blend:${traceId}] network failure after ${Math.round(performance.now() - startedAt)}ms`, {
        name: err?.name,
        message: err?.message,
        url: requestUrl,
        online: navigator.onLine,
      });
      throw new Error(`Conversion request could not reach the API (trace ${traceId}): ${err?.message || err}`);
    }

    console.info(`[blend:${traceId}] response received after ${Math.round(performance.now() - startedAt)}ms`, {
      status: res.status,
      statusText: res.statusText,
      headers: Array.from(res.headers.entries()),
    });
    if (!res.ok) {
      const raw = await res.text();
      console.error(`[blend:${traceId}] convert response status:`, res.status, 'url:', res.url);
      console.error(`[blend:${traceId}] raw response body:`, raw);
      let detail = "";
      try {
        detail = JSON.parse(raw)?.detail || "";
      } catch (_) {
        detail = raw?.trim?.() || "";
      }
      const errMsg = detail || `Conversion failed (${res.status})`;
      console.error(`[blend:${traceId}] detail:`, errMsg);
      throw new Error(`${errMsg} (trace ${traceId})`);
    }
    const data = await res.json();
    console.info(`[blend:${traceId}] conversion succeeded after ${Math.round(performance.now() - startedAt)}ms`, data);
    return data; // { url, filename, cached, trace_id }
  }

  // Modal logic
  async function isBlendHeaderValid(filename) {
    const userEmail = auth.currentUser?.email;
    if (!userEmail) return false;
    try {
      const objectRef = ref(storage, `users/${userEmail}/objects/${filename}`);
      const bytes = await getBytes(objectRef);
      const hdr = new TextDecoder('ascii', { fatal: false }).decode(bytes.slice(0, 16));
      return hdr.includes('BLENDER');
    } catch (err) {
      console.error('[blend] header check failed', err);
      return false;
    }
  }

  async function downloadStoredFile(filename) {
    const userEmail = auth.currentUser?.email;
    if (!userEmail) throw new Error('Not authenticated');
    const objectRef = ref(storage, `users/${userEmail}/objects/${filename}`);
    const bytes = await getBytes(objectRef);
    const blob = new Blob([bytes], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function openBlendModal(filename, onLoad) {
    // quick client-side validation: check header bytes before asking backend
    try {
      const valid = await isBlendHeaderValid(filename);
      if (!valid) {
        const proceed = confirm(`${filename} in storage does not look like a valid .blend. Download stored blob for inspection?`);
        if (proceed) {
          try { await downloadStoredFile(filename); } catch (err) { alert('Download failed: ' + (err?.message || err)); }
        }
        return;
      }
    } catch (err) {
      console.warn('[blend] header validation error', err);
    }
    const modal = document.getElementById('blend-modal');
    const title = document.getElementById('blend-modal-title');
    const loadingEl = document.getElementById('blend-modal-loading');
    const listEl = document.getElementById('blend-object-list');
    const loadBtn = document.getElementById('blend-load-btn');
    const closeBtn = document.getElementById('blend-modal-close');
    const selectAllBtn = document.getElementById('blend-select-all');
    const deselectAllBtn = document.getElementById('blend-deselect-all');

    title.textContent = filename;
    loadingEl.style.display = 'block';
    listEl.innerHTML = '';
    modal.style.display = 'flex';

    listBlendObjects(filename).then(objects => {
      loadingEl.style.display = 'none';

      if (!objects.length) {
        listEl.innerHTML = '<li style="color:#888;padding:8px;">No objects found.</li>';
        return;
      }

      objects.forEach(obj => {
        const li = document.createElement('li');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = true;
        cb.value = obj.name;

        const label = document.createElement('span');
        label.textContent = obj.name;

        const typeTag = document.createElement('span');
        typeTag.className = 'obj-type';
        typeTag.textContent = obj.type;

        li.appendChild(cb);
        li.appendChild(label);
        li.appendChild(typeTag);
        li.addEventListener('click', (e) => {
          if (e.target !== cb) cb.checked = !cb.checked;
        });
        listEl.appendChild(li);
      });
    }).catch(err => {
      loadingEl.style.display = 'none';
      listEl.innerHTML = '<li style="color:#888;padding:8px;">Could not read object list. You can still load the full file.</li>';
      loadBtn.textContent = 'Load Full File';
      loadBtn.onclick = () => {
        close();
        onLoad(null);
      };
      console.error('[blend] list objects failed:', err);
    });

    const close = () => { modal.style.display = 'none'; };
    closeBtn.onclick = close;
    modal.onclick = (e) => { if (e.target === modal) close(); };

    selectAllBtn.onclick = () => {
      listEl.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
    };
    deselectAllBtn.onclick = () => {
      listEl.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    };

    loadBtn.onclick = () => {
      const selected = [...listEl.querySelectorAll('input[type="checkbox"]:checked')]
        .map(cb => cb.value);
      close();
      onLoad(selected);
    };
  }

  // Queue for models waiting until sigma iframe is ready
  let pendingSigmaModel = null;
  let sigmaReady = false;

  // currently selected object list item (for deletion)
  let selectedObjectLi = null;

  function setSelectedObject(li) {
    // toggle if clicking the currently selected item
    if (selectedObjectLi === li) {
      selectedObjectLi.classList.remove('selected');
      selectedObjectLi = null;
      return;
    }

    if (selectedObjectLi) selectedObjectLi.classList.remove('selected');
    selectedObjectLi = li;
    if (selectedObjectLi) selectedObjectLi.classList.add('selected');
  }

  function preserveObjectSelection(li) {
    if (selectedObjectLi !== li) setSelectedObject(li);
  }

  window.addEventListener('message', (event) => {
    if (event.data?.type === 'sigma-ready') {
      sigmaReady = true;
      if (pendingSigmaModel) {
        const { url, filename } = pendingSigmaModel;
        pendingSigmaModel = null;
        _sendToSigma(url, filename);
      }
    }
  });

  function _sendToSigma(url, filename) {
    const sigmaIframe = document.getElementById('sigma-iframe');
    if (sigmaIframe?.contentWindow) {
      sigmaIframe.contentWindow.postMessage({ type: 'load-model', url, filename }, '*');
    }
  }

  function loadObjectInSigma(downloadURL, filename) {
    if (sigmaReady) {
      _sendToSigma(downloadURL, filename);
    } else {
      pendingSigmaModel = { url: downloadURL, filename };
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
    li.title = 'Click to select and view in Sigma';
    li.addEventListener('click', () => {
      preserveObjectSelection(li);
      const url = li.dataset.url;
      if (!url) return;
      sigmaBtn.click();
      loadObjectInSigma(url, filename);
    });
    objectsList.appendChild(li);
    return li;
  }

  // concurrency helper: map inputs to async mapper with limited concurrency
  async function pMap(inputs, mapper, concurrency = 8) {
    const results = [];
    const executing = new Set();

    for (const input of inputs) {
      const p = (async () => mapper(input))();
      results.push(p);
      executing.add(p);
      p.finally(() => executing.delete(p));

      if (executing.size >= concurrency) {
        // wait for any to finish before launching more
        await Promise.race(executing);
      }
    }

    return Promise.all(results);
  }

  // Debug helper: fetch first bytes of a stored object and display header hex
  async function debugGetBlendHeader(filename) {
    const userEmail = auth.currentUser?.email;
    if (!userEmail) {
      console.warn('[debug] no authenticated user');
      alert('Not authenticated');
      return;
    }

    try {
      const objectRef = ref(storage, `users/${userEmail}/objects/${filename}`);
      const bytes = await getBytes(objectRef);
      const header = Array.from(bytes.slice(0, 32)).map(b => b.toString(16).padStart(2, '0')).join(' ');
      console.log(`[debug] header bytes for ${filename}:`, header);
      alert(`Header bytes for ${filename}:\n${header}`);
    } catch (err) {
      console.error('[debug] failed to fetch blend header:', err);
      alert('Error fetching file header: ' + (err?.message || err));
    }
  }

  async function loadObjectsList(userEmail) {
    const objectsList = document.getElementById('objects-list');
    objectsList.innerHTML = '<li class="empty-msg">Loading objects…</li>';

    try {
      const objectsRef = ref(storage, `users/${userEmail}/objects`);
      console.log(`[objects] querying path: users/${userEmail}/objects`);
      const result = await listAll(objectsRef);

      console.log(`[objects] found ${result.items.length} items, prefixes: ${result.prefixes.length}`);
      result.items.forEach(i => console.log('[objects] item:', i.fullPath));

      const ALL_OBJECT_EXTS = new Set(['glb', 'gltf', 'obj', 'blend', 'blend1', 'fbx']);
      const items = result.items.filter(item => {
        const ext = item.name.split('.').pop().toLowerCase();
        return ALL_OBJECT_EXTS.has(ext);
      });

      // Clear and prepare fragment to batch DOM updates
      objectsList.innerHTML = '';

      if (items.length === 0) {
        objectsList.innerHTML = '<li class="empty-msg">No objects uploaded.</li>';
        return;
      }

      // Resolve download URLs with limited concurrency, then create DOM nodes in a fragment
      const results = await pMap(items, async (itemRef) => {
        const ext = itemRef.name.split('.').pop().toLowerCase();
        if (RENDERABLE_EXTS.has(ext)) {
          try {
            const url = await getDownloadURL(itemRef);
            return { kind: 'renderable', name: itemRef.name, url };
          } catch (err) {
            console.warn('[objects] failed to get URL for', itemRef.name, err);
            return { kind: 'renderable', name: itemRef.name, url: null, error: err };
          }
        } else {
          return { kind: 'blend', name: itemRef.name };
        }
      }, /*concurrency=*/8);

      const frag = document.createDocumentFragment();
      for (const r of results) {
        if (r.kind === 'renderable') {
          const li = document.createElement('li');
          li.textContent = r.name;
          li.dataset.filename = r.name;
          li.dataset.url = r.url || '';
          li.classList.add('file-item');
          li.title = 'Click to select and view in Sigma';
          li.addEventListener('click', () => {
            preserveObjectSelection(li);
            const url = li.dataset.url;
            if (!url) return;
            sigmaBtn.click();
            loadObjectInSigma(url, r.name);
          });
          frag.appendChild(li);
        } else {
          const li = document.createElement('li');
          li.textContent = r.name + ' ⚙';
          li.dataset.filename = r.name;
          li.classList.add('file-item');
          li.title = 'Click to select and choose objects to convert';
          li.addEventListener('click', () => {
            preserveObjectSelection(li);
            openBlendModal(r.name, async (selectedObjects) => {
              li.textContent = `Converting ${r.name}…`;
              li.style.color = '#00d0ff';
              try {
                const { url, filename: glbName } = await convertBlendOnBackend(r.name, selectedObjects);
                li.textContent = r.name + ' ⚙';
                li.style.color = '';
                // append converted glb to list
                const newLi = document.createElement('li');
                newLi.textContent = glbName;
                newLi.dataset.filename = glbName;
                newLi.dataset.url = url || '';
                newLi.classList.add('file-item');
                newLi.title = 'Click to select and view in Sigma';
                newLi.addEventListener('click', () => {
                  preserveObjectSelection(newLi);
                  if (!newLi.dataset.url) return;
                  sigmaBtn.click();
                  loadObjectInSigma(newLi.dataset.url, glbName);
                });
                frag.appendChild(newLi);
                sigmaBtn.click();
                loadObjectInSigma(url, glbName);
              } catch (err) {
                li.textContent = r.name + ' ⚙ (failed)';
                li.style.color = '#ff6666';
                console.error(err);
              }
            });
          });
          frag.appendChild(li);
        }
      }

      objectsList.appendChild(frag);
    } catch (err) {
      console.error('[objects] Error loading objects:', err);
      objectsList.innerHTML = `<li class="empty-msg">Error: ${err.code || err.message}</li>`;
    }
  }

  function addBlendToList(filename) {
    const objectsList = document.getElementById('objects-list');
    const emptyMsg = objectsList.querySelector('.empty-msg');
    if (emptyMsg) emptyMsg.remove();

    const existing = [...objectsList.querySelectorAll('li')].find(li => li.dataset.filename === filename);
    if (existing) return;

    const li = document.createElement('li');
    li.textContent = filename + ' ⚙';
    li.dataset.filename = filename;
    li.classList.add('file-item');
    li.title = 'Click to select and choose objects to convert (Ctrl/Cmd/Alt+click to inspect)';
    li.addEventListener('click', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) {
        debugGetBlendHeader(filename);
        return;
      }
      preserveObjectSelection(li);
      openBlendModal(filename, async (selectedObjects) => {
        li.textContent = `Converting ${filename}…`;
        li.style.color = '#00d0ff';
        try {
          const { url, filename: glbName } = await convertBlendOnBackend(filename, selectedObjects);
          li.textContent = filename + ' ⚙';
          li.style.color = '';
          addObjectToList(glbName, url);
          sigmaBtn.click();
          loadObjectInSigma(url, glbName);
        } catch (err) {
          li.textContent = filename + ' ⚙ (failed)';
          li.style.color = '#ff6666';
          console.error(err);
        }
      });
    });
    objectsList.appendChild(li);
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
        try {
          const header = formatHeader(new Uint8Array(await file.slice(0, 32).arrayBuffer()));
          console.log('[blend-upload] selected file signature:', { filename: file.name, header });
          if (!header.ascii.startsWith('BLENDER')) {
            const proceed = confirm(`${file.name} is ${header.signature}.\nHeader: ${header.hex}\n\nA valid .blend begins with BLENDER. Upload anyway?`);
            if (!proceed) { blendFileInput.value = ""; return; }
          }
        } catch (hdrErr) {
          console.warn('[blend-upload] could not inspect file header', hdrErr);
        }

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

          converting.remove();
          // Show object selection modal before converting
          addBlendToList(file.name);
          // Open modal immediately for the newly uploaded blend so user can select objects
          openBlendModal(file.name, async (selectedObjects) => {
            try {
              // find the newly added list item (if needed for status)
              const li = document.getElementById('objects-list').querySelector(`[data-filename="${file.name}"]`);
              if (li) { li.textContent = `Converting ${file.name}…`; li.style.color = '#00d0ff'; }
              const { url, filename: glbName } = await convertBlendOnBackend(file.name, selectedObjects);
              if (li) { li.textContent = file.name + ' ⚙'; li.style.color = ''; }
              addObjectToList(glbName, url);
              sigmaBtn.click();
              loadObjectInSigma(url, glbName);
            } catch (err) {
              console.error(err);
              const li = document.getElementById('objects-list').querySelector(`[data-filename="${file.name}"]`);
              if (li) { li.textContent = file.name + ' ⚙ (failed)'; li.style.color = '#ff6666'; }
            }
          });

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

  // Remove object button handler
  const removeObjectButton = document.getElementById('remove-object');
  if (removeObjectButton) {
    removeObjectButton.addEventListener('click', async () => {
      if (!selectedObjectLi) {
        alert('No object selected. Click an object to select it first.');
        return;
      }

      const filename = selectedObjectLi.dataset.filename;
      if (!filename) {
        alert('Selected item has no filename');
        return;
      }

      const confirmDelete = confirm(`Delete object ${filename}? This cannot be undone.`);
      if (!confirmDelete) return;

      try {
        const userEmail = auth.currentUser?.email;
        if (!userEmail) throw new Error('User not authenticated');
        const objectRef = ref(storage, `users/${userEmail}/objects/${filename}`);
        await deleteObject(objectRef);
        // remove from DOM
        selectedObjectLi.remove();
        selectedObjectLi = null;
        alert('Deleted ' + filename);
      } catch (err) {
        console.error('[objects] failed to delete object:', err);
        alert('Delete failed: ' + (err?.message || err));
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
  const findObjectsButton = document.getElementById("find-objects");
  const objectSearchContainer = document.getElementById("object-search-container");
  const objectSearchInput = document.getElementById("object-search-input");


  findButton.addEventListener("click", () => {
    const isVisible = searchContainer.style.display === "block";
    searchContainer.style.display = isVisible ? "none" : "block";
    if (!isVisible) {
      searchInput.focus();
    } else {
      clearSearch();
    }
  });

  findObjectsButton.addEventListener("click", () => {
    const isVisible = objectSearchContainer.style.display === "block";
    objectSearchContainer.style.display = isVisible ? "none" : "block";
    if (!isVisible) {
      objectSearchInput.focus();
    } else {
      clearObjectSearch();
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

  objectSearchInput.addEventListener("input", () => {
    const query = objectSearchInput.value.trim().toLowerCase();
    document.querySelectorAll('#objects-list li').forEach(item => {
      const name = item.dataset.filename || item.textContent;
      item.style.display = query === "" || name.toLowerCase().includes(query)
        ? "list-item"
        : "none";
    });
  });

  function clearObjectSearch() {
    objectSearchInput.value = "";
    document.querySelectorAll('#objects-list li').forEach(item => {
      item.style.display = "list-item";
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
