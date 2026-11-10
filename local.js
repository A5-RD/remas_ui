const $ = id => document.getElementById(id);
const state = { snapshot: null, config: null, controller: null };
const seatedPiano = 'Grand_Piano_Full_rigged_rev_02_audio_static.blend';

async function request(path, options = {}) {
  const response = await fetch(path, options);
  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`;
    try { const body = await response.json(); detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail); } catch { /* not JSON */ }
    throw new Error(detail);
  }
  return response.json();
}
function status(text) { $('status').textContent = text; }
async function loadSnapshot() {
  try {
    state.snapshot = await request('/api/blender/memory-snapshots/current');
    $('snapshot-status').textContent = `Saved snapshot: ${state.snapshot.filenames.length} memories.`;
  } catch (error) {
    if (error.message.startsWith('No starting memory snapshot')) {
      state.snapshot = null;
      $('snapshot-status').textContent = 'A ZIP is required for the first run.';
    } else throw error;
  }
}
async function loadConfig() {
  state.config = await request('/api/blender/scene-config');
  $('config-status').textContent = `Using ${state.config.source} configuration: ${state.config.default}.`;
}
async function loadObjects() {
  const selected = new Set([...document.querySelectorAll('#objects input:checked')].map(e => e.value));
  const result = await request('/api/blender/list-blender-objects');
  $('objects').replaceChildren();
  for (const object of result.objects) {
    const li = document.createElement('li'), label = document.createElement('label'), check = document.createElement('input');
    check.type = 'checkbox'; check.value = object.name; check.checked = selected.has(object.name) || object.name === seatedPiano;
    check.disabled = object.name === seatedPiano || !/\.(blend|glb|gltf|obj)$/i.test(object.name);
    label.append(check, ` ${object.name}${object.name === seatedPiano ? ' (included automatically)' : ''}`);
    const download = document.createElement('a'); download.textContent = 'Open';
    download.href = `/local/files/${object.path.split('/').map(encodeURIComponent).join('/')}`; download.target = '_blank'; download.rel = 'noopener';
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'secondary'; remove.textContent = 'Delete';
    remove.addEventListener('click', async () => {
      if (!confirm(`Delete ${object.name} from the local objects directory?`)) return;
      try { await request(`/api/blender/delete-blend/${encodeURIComponent(object.name)}`, {method:'DELETE'}); await loadObjects(); }
      catch (error) { status(`Delete failed: ${error.message}`); }
    });
    li.append(label, download, remove); $('objects').append(li);
  }
}
async function loadMemories() {
  const names = await request('/local/memories'); $('memory-list').replaceChildren();
  for (const name of names) { const option = document.createElement('option'); option.value = option.textContent = name; $('memory-list').append(option); }
}
$('memory-list').addEventListener('change', async event => {
  try { $('memory-content').textContent = JSON.stringify(await request(`/local/memories/${encodeURIComponent(event.target.value)}`), null, 2); }
  catch (error) { $('memory-content').textContent = error.message; }
});
$('refresh-objects').addEventListener('click', () => loadObjects().catch(e => status(e.message)));
$('refresh-memories').addEventListener('click', () => loadMemories().catch(e => status(e.message)));
$('object-form').addEventListener('submit', async event => {
  event.preventDefault(); const file = $('object-file').files[0]; if (!file) return;
  const form = new FormData(); form.append('file', file);
  try { status(`Uploading ${file.name}…`); await request('/api/blender/upload-blend', {method:'POST', body:form}); $('object-file').value = ''; await loadObjects(); status('Object uploaded.'); }
  catch (error) { status(`Upload failed: ${error.message}`); }
});
$('stop').addEventListener('click', () => {
  state.controller?.abort(); $('video').pause(); $('video').removeAttribute('src'); $('video').hidden = true;
  status('Stopped waiting and playback. A Blender render already started may continue on the server.');
});
$('run-form').addEventListener('submit', async event => {
  event.preventDefault(); if (state.controller) return;
  const controller = new AbortController(); state.controller = controller;
  const signal = controller.signal; $('play').disabled = true; $('stop').disabled = false; $('progress').hidden = false;
  $('video').pause(); $('video').hidden = true;
  try {
    const config = $('config').files[0], zip = $('zip').files[0];
    if (config) {
      status('Validating and saving scene configuration…');
      state.config = await request('/api/blender/scene-config', {method:'PUT', headers:{'Content-Type':'application/json'}, body:config, signal});
      $('config').value = ''; $('config-status').textContent = 'Scene configuration saved.';
    } else { status('Loading scene configuration…'); await loadConfig(); }
    if (zip) {
      status('Validating and saving memory ZIP…');
      state.snapshot = await request('/api/blender/memory-snapshots', {method:'POST', headers:{'Content-Type':'application/zip'}, body:zip, signal});
      $('zip').value = ''; $('snapshot-status').textContent = `Saved snapshot: ${state.snapshot.filenames.length} memories.`;
    } else { await loadSnapshot(); }
    if (!state.snapshot) throw new Error('Choose a starting memories ZIP.');
    const settings = state.config.simulation || {}, names = state.snapshot.filenames;
    const start = settings.start_memory_filename || [...names].sort()[0];
    if (!names.includes(start)) throw new Error(`Starting memory ${start} is not in the ZIP.`);
    const repeat = settings.duration_seconds === 'N/A';
    const scene_objects = [...document.querySelectorAll('#objects input:checked:not(:disabled)')].map(input => ({filename:input.value}));
    status(`Rendering ${start} with Blender. This can take several minutes; progress is unknown.`);
    const result = await request('/api/blender/simulate/ava_1.8_dress_packed.blend', {
      method:'POST', headers:{'Content-Type':'application/json'}, signal,
      body:JSON.stringify({memory_snapshot_id:state.snapshot.memory_snapshot_id, start_memory_filename:start,
        duration_seconds:repeat ? null : settings.duration_seconds, camera_preset:state.config.default, embodiment_mode:'simulation', scene_objects})
    });
    if (!result.url || !result.url.startsWith('/local/files/')) throw new Error('Invalid local render URL.');
    $('video').src = result.url; $('video').loop = repeat; $('video').hidden = false;
    status(`Rendered ${start}. ${repeat ? 'Repeating this clip; not live streaming.' : 'Playing once.'}`);
    try { await $('video').play(); } catch { status('Render ready. Use the video controls to play.'); }
  } catch (error) { if (error.name !== 'AbortError') status(`Run failed: ${error.message}`); }
  finally { state.controller = null; $('play').disabled = false; $('stop').disabled = false; $('progress').hidden = true; }
});
Promise.all([loadSnapshot(), loadConfig(), loadObjects(), loadMemories()]).catch(error => status(`Local workspace: ${error.message}`));