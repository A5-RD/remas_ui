// A synchronous bootstrap: no external resources are inserted on loopback.
(() => {
  const local = location.hostname === '127.0.0.1';
  if (!local) {
    const font = document.createElement('link');
    font.rel = 'stylesheet';
    font.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@100&family=Material+Symbols+Outlined&display=swap';
    document.head.appendChild(font);
  } else {
    document.documentElement.classList.add('local-mode');
  }
  if (document.currentScript.dataset.three === 'true') {
    const map = document.createElement('script');
    map.type = 'importmap';
    map.textContent = JSON.stringify({ imports: local ? {
      three: './vendor/three/build/three.module.js',
      'three/addons/': './vendor/three/examples/jsm/',
    } : {
      three: 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js',
      'three/addons/': 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/',
    } });
    document.head.appendChild(map);
  }
})();