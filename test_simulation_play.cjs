const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, 'simulation.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, 'simulation.html'), 'utf8');
function section(start, end) {
  const first = source.indexOf(start);
  const last = source.indexOf(end, first);
  assert.ok(first >= 0 && last > first, `${start} section exists`);
  return source.slice(first, last);
}
const code = [
  section('  function setSimulationBusy(', '  function readSimulationSettings('),
  section('  async function readApiResponse(', '  async function postSimulationJson('),
  section('  async function openSimulationRunModal(', '  async function requestSigmaSceneState('),
  section('  function validateSnapshot(', '  async function runLiveRigPreview('),
  section('  async function runAvaSimulation(', '  function playBufferedVideo('),
].join('\n') + '\nthis.run = runAvaSimulation; this.open = openSimulationRunModal; this.stop = stopSimulation;';

const snapshot = (id = 'a') => ({ memory_snapshot_id: id.repeat(64), filenames: ['zzzzz10001.json', 'rootm10001.json'] });
const response = (data, status = 200) => ({ ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(data) });
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function harness() {
  const user = { uid: 'alice', getIdToken: async () => 'token' };
  const video = {
    style: {}, pause() { this.pauses = (this.pauses || 0) + 1; },
    removeAttribute(name) { if (name === 'src') this.src = ''; }, load() {},
    async play() { this.playCount = (this.playCount || 0) + 1; },
  };
  const config = { default: 'frame', simulation: { start_memory_filename: 'rootm10001.json', duration_seconds: 'N/A' } };
  const requests = [];
  const c = {
    auth: { currentUser: user }, apiBase: '', crypto: { randomUUID: () => 'test' }, DOMException, AbortController,
    simulationSession: null, simulationSessionToken: 0, modalOpenToken: 0,
    simulationRunModal: { style: {}, classList: { remove() {} } }, simulationRunVideo: video,
    simulationRunProgress: { hidden: true }, simulationRunElapsed: {},
    simulationRunSubmit: {}, simulationRunPlay: {}, simulationRunLive: {}, simulationRunRefresh: {}, simulationRunStop: {},
    memoryZipInput: { files: [{ name: 'memory.zip' }], value: 'selected' },
    sceneConfigInput: { files: [{ name: 'scene.json' }], value: 'selected' },
    snapshotStatus: {}, zipRequirement: {}, sceneConfigStatus: {}, savedMemorySnapshot: null,
    latestSigmaSceneState: [], defaultSimulationBlendFilename: 'ava.blend',
    setSimulationStatus(message, tone) { c.status = message; c.tone = tone; },
    refreshSimulationRunOptions() {}, loadCameraPresets: async () => {},
    requestSigmaSceneState: async () => [], updateSimulationSceneSummary() {},
    resolveStoragePathUrl: async () => 'fallback',
    document: { getElementById: () => null }, window: { location: { origin: '' } },
    console: { error() {}, warn() {} }, clearTimeout,
    setInterval(fn) { c.progressTick = fn; return 42; },
    clearInterval(id) { assert.equal(id, 42); c.progressTick = null; },
    fetch: async (url, opts = {}) => {
      requests.push({ url, ...opts });
      if (c.fetchOverride) return c.fetchOverride(url, opts);
      if (url.endsWith('scene-config')) return response(config);
      if (url.endsWith('memory-snapshots/current') || url.endsWith('memory-snapshots')) return response(snapshot());
      throw new Error('Unexpected request: ' + url);
    },
    fetchApi: async (url) => c.fetch(url),
    postSimulationJson: async (url, body, session) => {
      requests.push({ url, method: 'RENDER', body });
      if (c.renderOverride) return c.renderOverride(url, body, session);
      return response({ url: 'video' });
    },
  };
  vm.createContext(c);
  vm.runInContext(code, c);
  return { c, user, video, config, requests };
}
const renders = requests => requests.filter(r => r.method === 'RENDER');

test('HTML IDs are unique', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  assert.match(html, /<progress aria-label="Simulation request in progress"><\/progress>/);
});

test('uploads raw files to authoritative validation endpoints and renders selected memory', async () => {
  const { c, video, config, requests } = harness();
  const json = c.sceneConfigInput.files[0], zip = c.memoryZipInput.files[0];
  await c.run();
  assert.equal(requests[0].method, 'PUT');
  assert.equal(requests[0].body, json);
  assert.equal(requests[1].body, zip);
  assert.equal(requests[1].headers['Content-Type'], 'application/zip');
  assert.equal(renders(requests)[0].body.start_memory_filename, config.simulation.start_memory_filename);
  assert.equal(renders(requests)[0].body.memory_snapshot_id, snapshot().memory_snapshot_id);
  assert.equal(renders(requests)[0].body.duration_seconds, null);
  assert.equal(video.loop, true);
  assert.equal(video.playCount, 1);
  assert.equal(c.simulationRunStop.disabled, false);
  assert.equal(c.simulationRunProgress.hidden, true);
  assert.equal(c.progressTick, null);
});

test('waiting for rendering shows indeterminate elapsed progress and clears it on stop', async () => {
  const { c } = harness();
  const pending = deferred(), started = deferred();
  c.renderOverride = () => { started.resolve(); return pending.promise; };
  const run = c.run();
  await started.promise;
  assert.equal(c.simulationRunProgress.hidden, false);
  assert.match(c.status, /server is preparing and rendering/);
  assert.match(c.simulationRunElapsed.textContent, /^Elapsed \d+:\d\d$/);
  c.progressTick();
  c.stop();
  assert.equal(c.simulationRunProgress.hidden, true);
  assert.equal(c.progressTick, null);
  pending.resolve(response({ url: 'old-video' }));
  await run;
  assert.match(c.status, /Stopped/);
});

test('render timeout explains failure and preserves saved snapshot', async () => {
  const { c } = harness();
  c.renderOverride = () => response({ detail: 'Blender timed out while rendering simulation' }, 504);
  await c.run();
  assert.match(c.status, /timed out \(504\)/);
  assert.match(c.status, /saved ZIP is still available/);
  assert.equal(c.savedMemorySnapshot.memory_snapshot_id, snapshot().memory_snapshot_id);
  assert.equal(c.simulationRunProgress.hidden, true);
  assert.equal(c.progressTick, null);
});

test('reuse fetches current snapshot, selects sorted first memory and plays once', async () => {
  const { c, video, config, requests } = harness();
  c.memoryZipInput.files = []; c.sceneConfigInput.files = [];
  c.savedMemorySnapshot = snapshot('b');
  config.simulation = { start_memory_filename: null, duration_seconds: 3 };
  await c.run();
  assert.equal(renders(requests)[0].body.start_memory_filename, 'rootm10001.json');
  assert.equal(renders(requests)[0].body.memory_snapshot_id, snapshot().memory_snapshot_id);
  assert.equal(renders(requests)[0].body.duration_seconds, 3);
  assert.equal(video.loop, false);
});

test('rejects invalid JSON and ZIP through backend and preserves independent successful upload', async () => {
  for (const failed of ['scene-config', 'memory-snapshots']) {
    const { c, requests } = harness();
    c.fetchOverride = (url) => url.endsWith(failed) ? response({ detail: `invalid ${failed}` }, 422) : response({ default: 'frame', simulation: {} });
    await c.run();
    assert.match(c.status, new RegExp(`invalid ${failed}`));
    assert.equal(renders(requests).length, 0);
    assert.equal(c.memoryZipInput.value, 'selected');
    assert.equal(c.sceneConfigInput.value, failed === 'scene-config' ? 'selected' : '');
    if (failed === 'memory-snapshots') assert.match(c.sceneConfigStatus.textContent, /saved/i);
  }
});

test('missing configured memory, malformed snapshot and failed lookup never render', async () => {
  for (const kind of ['missing', 'malformed', 'lookup']) {
    const { c, requests, config } = harness();
    if (kind === 'missing') config.simulation.start_memory_filename = 'other10001.json';
    if (kind === 'malformed') c.fetchOverride = url => url.endsWith('scene-config') ? response(config) : response({ memory_snapshot_id: 'bad', filenames: [] });
    if (kind === 'lookup') {
      c.memoryZipInput.files = [];
      c.fetchOverride = () => response({ detail: 'storage unavailable' }, 503);
    }
    await c.run();
    assert.equal(renders(requests).length, 0);
    assert.match(c.status, kind === 'missing' ? /not in the ZIP/ : kind === 'malformed' ? /Invalid memory snapshot/ : /storage unavailable/);
  }
});

test('late modal lookup cannot replace a newly uploaded snapshot', async () => {
  const { c } = harness();
  const lookup = deferred();
  c.fetchApi = () => lookup.promise;
  const opening = c.open();
  await c.run();
  lookup.resolve(response(snapshot('b')));
  await opening;
  assert.equal(c.savedMemorySnapshot.memory_snapshot_id, snapshot().memory_snapshot_id);
  assert.match(c.snapshotStatus.textContent, /2 memories/);
});

test('stop during token retrieval prevents requests and stale UI updates', async () => {
  const { c, user, requests, video } = harness();
  const token = deferred(); user.getIdToken = () => token.promise;
  const run = c.run();
  c.stop();
  token.resolve('token');
  await run;
  assert.equal(requests.length, 0);
  assert.match(c.status, /Stopped/);
  assert.equal(c.simulationRunStop.disabled, true);
  assert.equal(video.style.display, 'none');
});

test('stop during delayed autoplay cannot restore success or Stop', async () => {
  const { c, video } = harness();
  const playing = deferred(), started = deferred();
  video.play = () => { started.resolve(); return playing.promise; };
  const run = c.run();
  await started.promise;
  c.stop();
  playing.reject(Object.assign(new Error('blocked'), { name: 'NotAllowedError' }));
  await run;
  assert.match(c.status, /Stopped/);
  assert.equal(c.simulationRunStop.disabled, true);
  assert.equal(video.src, '');
});

test('auth change while token or render is pending suppresses stale work', async () => {
  for (const stage of ['token', 'render']) {
    const { c, user, requests, video } = harness();
    const pending = deferred(), started = deferred();
    if (stage === 'token') user.getIdToken = () => { started.resolve(); return pending.promise; };
    else c.renderOverride = () => { started.resolve(); return pending.promise; };
    const run = c.run();
    await started.promise;
    c.auth.currentUser = { uid: 'bob' };
    c.stop();
    pending.resolve(stage === 'token' ? 'old-token' : response({ url: 'old-video' }));
    await run;
    assert.equal(video.src, '');
    assert.equal(c.simulationRunStop.disabled, true);
    if (stage === 'token') assert.equal(requests.length, 0);
  }
});

test('auth callback cancels playback and clears private inputs on account change', async () => {
  const { c, user, video } = harness();
  let callback;
  Object.assign(c, {
    sceneConfigUid: user.uid, sceneConfigRequest: 0, availableCameraPresets: [],
    simContainer: { style: {} }, onAuthStateChanged: (_auth, fn) => { callback = fn; },
    loadUserFiles() {}, loadObjectsList() {},
  });
  vm.runInContext(section('  onAuthStateChanged(auth, user => {', '  async function loadUserFiles('), c);
  const pending = deferred(), started = deferred();
  c.renderOverride = () => { started.resolve(); return pending.promise; };
  const run = c.run();
  await started.promise;
  c.auth.currentUser = { uid: 'bob', email: 'bob@example.com' };
  callback(c.auth.currentUser);
  pending.resolve(response({ url: 'old-video' }));
  await run;
  assert.equal(c.simulationRunModal.style.display, 'none');
  assert.equal(c.memoryZipInput.value, '');
  assert.equal(c.sceneConfigInput.value, '');
  assert.equal(c.savedMemorySnapshot, null);
  assert.equal(c.simulationRunStop.disabled, true);
  assert.equal(video.src, '');
});

test('stale completion cannot alter a newer run', async () => {
  const { c, video } = harness();
  const pending = deferred(), started = deferred();
  c.renderOverride = () => { started.resolve(); return pending.promise; };
  const oldRun = c.run();
  await started.promise;
  c.stop();
  c.renderOverride = null;
  await c.run();
  const status = c.status;
  pending.reject(new Error('old render failed'));
  await oldRun;
  assert.equal(c.status, status);
  assert.equal(video.src, 'video');
  assert.equal(c.simulationRunStop.disabled, false);
});

test('autoplay rejection, video failure and Sigma failure are surfaced', async () => {
  const a = harness();
  a.video.play = async () => { throw Object.assign(new Error('blocked'), { name: 'NotAllowedError' }); };
  await a.c.run();
  assert.match(a.c.status, /Autoplay was blocked/);
  assert.equal(a.c.simulationRunStop.disabled, false);
  a.video.error = {};
  a.video.onerror();
  assert.match(a.c.status, /could not be played/);
  assert.equal(a.c.simulationRunStop.disabled, true);
  const b = harness();
  b.c.requestSigmaSceneState = async () => { throw new Error('Sigma timeout'); };
  await b.c.run();
  assert.match(b.c.status, /Sigma timeout/);
  assert.equal(renders(b.requests).length, 0);
});
