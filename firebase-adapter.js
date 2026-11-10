// Only production loads the Firebase SDK; loopback never imports external code.
export const isLocal = location.hostname === '127.0.0.1';
const local = isLocal ? await import('./local-firebase.js') : null;
const firebase = isLocal ? local : await import('./firebase.js?v=20260605');
const authSdk = isLocal ? local : await import('https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js');
const storageSdk = isLocal ? local : await import('https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js');
export const { app, auth, storage } = firebase;
export const { getAuth, onAuthStateChanged, signInWithEmailAndPassword, sendPasswordResetEmail } = authSdk;
export const { getStorage, ref, listAll, getBytes, getMetadata, uploadBytes, uploadBytesResumable, uploadString, getDownloadURL, deleteObject } = storageSdk;