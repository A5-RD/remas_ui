// Report startup failures even if module dependencies fail before evaluation.
(() => {
  let initialized = false;
  let authResolved = false;
  const show = message => {
    const status = document.getElementById('simulation-startup-status');
    if (!status) return;
    status.textContent = message;
    status.hidden = false;
    Object.assign(status.style, {
      position: 'fixed', top: '12px', left: '12px', right: '12px', zIndex: '10000',
      padding: '12px', background: '#573332', color: '#fff', font: '14px sans-serif',
    });
  };
  const hide = () => {
    const status = document.getElementById('simulation-startup-status');
    if (status) status.hidden = true;
  };
  window.addEventListener('remas-simulation-initialized', () => { initialized = true; hide(); });
  window.addEventListener('remas-simulation-auth-resolved', () => { authResolved = true; hide(); });
  window.addEventListener('error', event => {
    if (!initialized && (event.target?.type === 'module' || event.error)) {
      show('Simulation failed to start. Check your connection, browser console, and access to Firebase scripts.');
    }
  }, true);
  window.addEventListener('unhandledrejection', () => {
    if (!initialized) show('Simulation failed to start. Check your connection and access to Firebase scripts.');
  });
  setTimeout(() => {
    if (!initialized) show('Simulation did not start. Check your connection, browser console, and access to Firebase scripts.');
    else if (!authResolved) show('Waiting for authentication. Check your connection and sign-in status.');
  }, 15000);
})();