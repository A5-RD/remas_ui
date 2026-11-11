const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'simulation.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
function section(start, end) {
  const first = source.indexOf(start);
  const last = source.indexOf(end, first);
  assert.ok(first >= 0 && last > first, `${start} section exists`);
  return source.slice(first, last);
}
const code = [
  section('  let selectedObjectLi = null;', "  window.addEventListener('message'"),
  section('  function addBlendToList(', '  // Remove object button handler'),
].join('\n') + '\nthis.addBlend = addBlendToList; this.selected = () => selectedObjectLi;';

class Element {
  constructor() {
    this.dataset = {};
    this.style = {};
    this.listeners = {};
    this.children = [];
    const classes = new Set();
    this.classList = {
      add: (...names) => names.forEach(name => classes.add(name)),
      remove: name => classes.delete(name),
      contains: name => classes.has(name),
    };
  }
  addEventListener(type, handler) { this.listeners[type] = handler; }
  appendChild(child) { child.parent = this; this.children.push(child); }
  remove() { this.parent.children = this.parent.children.filter(child => child !== this); }
  querySelectorAll(selector) { return selector === 'li' ? this.children : []; }
  querySelector(selector) {
    return selector === 'li' ? this.children[0] || null
      : selector === '.empty-msg' ? this.children.find(child => child.classList.contains('empty-msg')) || null : null;
  }
  set innerHTML(value) {
    this.children = [];
    if (value.includes('empty-msg')) {
      const child = new Element();
      child.classList.add('empty-msg');
      child.textContent = value.replace(/<[^>]*>/g, '');
      this.appendChild(child);
    }
  }
}

function harness() {
  const list = new Element(), input = new Element(), button = new Element();
  button.textContent = '+';
  const alerts = [], loaded = [];
  const c = {
    document: { getElementById: () => list, createElement: () => new Element() },
    auth: { currentUser: { email: 'test@example.com' } },
    uploadBlendButton: button, blendFileInput: input,
    NEEDS_CONVERSION_EXTS: new Set(['blend', 'blend1']),
    RENDERABLE_EXTS: new Set(['glb', 'gltf', 'obj']),
    formatHeader: () => ({ ascii: 'BLENDER' }),
    uploadObjectFile: async (_email, file, { onProgress }) => {
      onProgress(50, 5, 10);
      return { filename: file.name, downloadURL: 'model-url' };
    },
    sigmaBtn: { click() {} }, loadObjectInSigma: (...args) => loaded.push(args),
    debugGetBlendHeader() {}, confirm: () => true, alert: message => alerts.push(message),
    console: { info() {}, warn() {}, error() {} },
  };
  vm.createContext(c);
  vm.runInContext(code, c);
  return { c, list, input, button, alerts, loaded };
}
const file = name => ({ name, size: 10, slice: () => ({ arrayBuffer: async () => new ArrayBuffer(0) }) });
const rows = list => list.children.map(child => child.textContent);

test('converted blend rows use plain filenames and retain double-click selection', () => {
  const { c, list } = harness();
  c.addBlend('avatar.blend', { convertedFilename: 'avatar.glb' });
  const row = list.children[0];
  assert.equal(row.textContent, 'avatar.blend');
  assert.equal(row.dataset.convertedFilename, 'avatar.glb');
  assert.doesNotMatch(css, /#objects-list\s+li\.blend-item\[data-converted[^\]]*\]::after/);
  assert.match(css, /#objects-list li\.selected\s*\{/);
  row.listeners.dblclick({});
  assert.equal(c.selected(), row);
  assert.ok(row.classList.contains('selected'));
  row.listeners.dblclick({});
  assert.equal(c.selected(), null);
});

test('progress remains visible until success, without replacing selection or alerting', async () => {
  const { c, list, input, button, alerts } = harness();
  c.addBlend('selected.blend');
  const selected = list.children[0];
  selected.listeners.dblclick({});
  let finish, started;
  const progress = new Promise(resolve => { started = resolve; });
  c.uploadObjectFile = async (_email, f, { onProgress }) => {
    onProgress(50, 5, 10);
    started();
    await new Promise(resolve => { finish = resolve; });
    return { filename: f.name };
  };
  input.files = [file('new.blend')];
  const upload = input.listeners.change();
  await progress;
  assert.match(rows(list).join(' '), /new\.blend: uploading… \(50%/);
  assert.equal(button.disabled, true);
  finish();
  await upload;
  assert.deepEqual(rows(list), ['selected.blend', 'new.blend']);
  assert.equal(c.selected(), selected);
  assert.ok(selected.classList.contains('selected'));
  assert.equal(button.disabled, false);
  assert.deepEqual(alerts, []);
});

test('failure and skipped rows remain; successful retry removes only its own status', async () => {
  const { c, list, input, alerts } = harness();
  c.addBlend('selected.blend');
  const selected = list.children[0];
  selected.listeners.dblclick({});
  c.uploadObjectFile = async () => { throw new Error('network down'); };
  input.files = [file('failed.blend'), file('unsupported.fbx')];
  await input.listeners.change();
  assert.match(rows(list).join(' '), /failed\.blend: failed \(network down\)/);
  assert.match(rows(list).join(' '), /unsupported\.fbx: skipped/);
  c.uploadObjectFile = async (_email, f) => ({ filename: f.name });
  input.files = [file('failed.blend')];
  await input.listeners.change();
  assert.deepEqual(rows(list), ['selected.blend', '[upload] unsupported.fbx: skipped (unsupported .fbx)', 'failed.blend']);
  assert.equal(c.selected(), selected);
  assert.deepEqual(alerts, []);
});

test('re-uploading a selected blend preserves its existing row and selection', async () => {
  const { c, list, input } = harness();
  c.addBlend('avatar.blend', { convertedFilename: 'avatar.glb' });
  const selected = list.children[0];
  selected.listeners.dblclick({});
  input.files = [file('avatar.blend')];
  await input.listeners.change();
  assert.deepEqual(rows(list), ['avatar.blend']);
  assert.equal(list.children[0], selected);
  assert.equal(c.selected(), selected);
  assert.ok(selected.classList.contains('selected'));
  assert.equal(selected.dataset.convertedFilename, 'avatar.glb');
});

test('successful renderable upload leaves an empty-list message and loads Sigma', async () => {
  const { list, input, loaded, alerts } = harness();
  input.files = [file('model.glb')];
  await input.listeners.change();
  assert.deepEqual(rows(list), ['No .blend files uploaded.']);
  assert.deepEqual(loaded, [['model-url', 'model.glb']]);
  assert.deepEqual(alerts, []);
});