# Original UI: local backend contract

This is the original index, simulation, Ψ and Σ interface in an explicit
`127.0.0.1` mode. It is not a production authentication bypass: the local
identity is `local@remas.invalid`, has no password and the token is a placeholder.
Only a separate, loopback-guarded server may accept it. Production remains on
Firebase and its existing API URL. Serve these files on the same origin as the
API; do not redirect this interface to `local.html`.

## Server integration required

* Serve `/` as `index.html` and the original UI's files, including
  `page-resources.js`, `firebase-adapter.js`, `local-firebase.js`,
  `local-graph.js`, `sigma-live.js`, `styles.css`, `logo.png`, and the
  `vendor/three/` subtree, with correct JavaScript MIME types. Existing local
  app currently serves only its separate page and blocks the original files.
* The original pages use inline styles and inline module scripts, import maps,
  same-origin iframes, WebGL and blob/data model resources. The current local
  CSP blocks inline code and `frame-ancestors 'none'` blocks Ψ/Σ. Provide a CSP
  that permits these for same-origin pages while retaining `connect-src 'self'`,
  restricting frames to self, and blocking external resources. Account for
  dynamic import maps, inline style attributes, WebGL and blob/data assets.
* Keep the existing loopback, Host, Origin and cross-site request protections;
  never mount the local identity or its write routes on the production server.
* `GET /local/memories` returns a JSON array of filenames;
  `GET /local/memories/{filename}` returns the JSON file. These already exist.
  Add `PUT /local/memories/{filename}` accepting raw JSON bytes and
  `DELETE /local/memories/{filename}`. Return non-2xx on invalid JSON, missing
  files or storage failure. Restrict names to `[a-z]{5}[0-9]{5}.json`, contain
  paths in the memory directory, reject symlinks, and use atomic writes. These
  modify the actual local memory files, not a ZIP snapshot; delete is permanent.
* Existing `/api/blender/list-blender-objects`, `/upload-blend` (multipart field
  `file`), `/delete-blend/{filename}`, `/list-objects/{filename}`,
  `/convert/{filename}`, `/camera-presets`, `/scene-config`,
  `/memory-snapshots`, `/memory-snapshots/current`, and `/simulate/{filename}`
  must remain available under `/api/blender` with the local identity override.
  Object listing needs all supported extensions, not just `.blend`.
* `GET` and `HEAD /local/files/users/local%40remas.invalid/objects/{filename}`
  must serve objects; `HEAD` must report content length and type. Converted
  model and render URLs returned by the backend must be same-origin. A range
  request is used only for optional post-upload diagnostic verification.
* The existing render endpoint requires a snapshot. Play uploads or reuses the
  ZIP via the existing snapshot API; its contents are independent of the memory
  browser. Existing local render behavior may force a seated Ava and piano.

Backend path validation, safe writes, object limits, secure Blender execution,
and access controls must be enforced server-side. The adapter's name checks are
not a security boundary. Existing object upload uses the Blender API; its
progress is reported only at start and completion, not resumable.

## Offline 3D dependencies

Three.js 0.183.2 was copied from an existing local installation, including its
MIT license. Production continues to use Three.js 0.160.0 from its original CDN.
No installed 3d-force-graph or fonts were found: Ψ uses a deterministic 3D
spherical layout with orbit, hover labels, component highlighting and editing,
not the production force layout, particle animation, or full control behavior.
Local fonts fall back to system sans-serif; toolbar symbols use text glyphs.
No external SDKs, fonts, or graph libraries are requested on loopback.