// This adapter is for the isolated loopback server, not an authentication system.
if (location.hostname !== '127.0.0.1') throw new Error('Local adapter requires 127.0.0.1');

export const app = {};
export const auth = { currentUser: {
  uid: 'local', email: 'local@remas.invalid', getIdToken: async () => 'local',
} };
export const storage = {};
export const getAuth = () => auth;
export const getStorage = () => storage;
export function onAuthStateChanged(_auth, callback) {
  let active = true;
  queueMicrotask(() => { if (active) callback(auth.currentUser); });
  return () => { active = false; };
}
export async function signInWithEmailAndPassword() { return { user: auth.currentUser }; }
export async function sendPasswordResetEmail() { throw new Error('Local mode has no passwords.'); }

function parsePath(path) {
  const parts = path.split('/');
  if (parts[0] !== 'users' || parts[1] !== auth.currentUser.email ||
      !['memories', 'objects'].includes(parts[2]) || parts.length > 4 ||
      (parts.length === 4 && (!parts[3] || parts[3] === '.' || parts[3] === '..' || parts[3].includes('\\')))) {
    throw new Error('Invalid local storage path');
  }
  return { kind: parts[2], name: parts[3] };
}
export function ref(_storage, path) {
  const { name } = parsePath(path);
  return { fullPath: path, name: name || path.split('/').pop() };
}
async function request(path, options) {
  const response = await fetch(path, options);
  if (!response.ok) {
    let detail = '';
    try { detail = (await response.json()).detail || ''; } catch (_) {}
    throw new Error(detail || `Local storage request failed (${response.status})`);
  }
  return response;
}
function fileUrl(item) {
  const { kind, name } = parsePath(item.fullPath);
  if (!name) throw new Error('A filename is required');
  return kind === 'memories' ? `/local/memories/${encodeURIComponent(name)}` :
    `/local/files/users/${encodeURIComponent(auth.currentUser.email)}/objects/${encodeURIComponent(name)}`;
}
export async function listAll(item) {
  const { kind, name } = parsePath(item.fullPath);
  if (name) throw new Error('Expected a directory');
  const data = await (await request(kind === 'memories' ? '/local/memories' : '/api/blender/list-blender-objects')).json();
  const names = kind === 'memories' ? data : data.objects.map(object => object.name);
  return { items: names.map(name => ref(storage, `${item.fullPath}/${name}`)), prefixes: [] };
}
export async function getBytes(item) { return new Uint8Array(await (await request(fileUrl(item))).arrayBuffer()); }
export async function getDownloadURL(item) { return new URL(fileUrl(item), location.origin).href; }
export async function getMetadata(item) {
  const response = await request(fileUrl(item), { method: 'HEAD' });
  return { size: Number(response.headers.get('content-length')) || 0, contentType: response.headers.get('content-type') };
}
export async function uploadString(item, value) {
  if (parsePath(item.fullPath).kind !== 'memories') throw new Error('Expected a memory');
  await request(fileUrl(item), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: value });
  return { ref: item };
}
export async function uploadBytes(item, file) {
  const { kind, name } = parsePath(item.fullPath);
  if (kind !== 'objects' || !name) throw new Error('Expected an object filename');
  const form = new FormData();
  form.append('file', file, name);
  await request('/api/blender/upload-blend', { method: 'POST', body: form });
  return { ref: item };
}
export function uploadBytesResumable(item, file) {
  const task = { snapshot: { ref: item, bytesTransferred: 0, totalBytes: file.size } };
  task.on = (_event, progress, failure, complete) => {
    progress(task.snapshot);
    uploadBytes(item, file).then(() => {
      task.snapshot.bytesTransferred = file.size;
      progress(task.snapshot);
      complete();
    }, failure);
  };
  return task;
}
export async function deleteObject(item) {
  const { kind, name } = parsePath(item.fullPath);
  if (!name) throw new Error('A filename is required');
  await request(kind === 'memories' ? fileUrl(item) : `/api/blender/delete-blend/${encodeURIComponent(name)}`, { method: 'DELETE' });
}