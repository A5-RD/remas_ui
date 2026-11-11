const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'simulation.js'), 'utf8');
function section(start, end) {
  const first = source.indexOf(start), last = source.indexOf(end, first);
  assert.ok(first >= 0 && last > first);
  return source.slice(first, last);
}

function harness(isLocal) {
  const elements = {}, requests = [], writes = [];
  const list = { innerHTML: '', children: [], appendChild(el) { this.children.push(el); } };
  const context = {
    isLocal, storage: {}, availableMemoryFiles: [], TextDecoder, console: { log() {}, error() {} },
    refreshSimulationRunOptions() {},
    document: {
      getElementById(id) { return id === 'file-list' ? list : (elements[id] ||= { style: {}, dataset: {} }); },
      createElement() { return { dataset: {}, classList: { add() {} }, addEventListener(type, cb) { this[type] = cb; } }; },
    },
    ref(_storage, key) { requests.push(key); return { fullPath: key }; },
    async listAll() { if (context.error) throw new Error('denied'); return { items: [{ name: 'zzzzz12345.json' }, { name: 'aaaaa12345.json' }] }; },
    async getBytes() { return new TextEncoder().encode('{"description":"Map"}'); },
    async uploadString(...args) { writes.push(args); },
  };
  vm.createContext(context);
  vm.runInContext([
    section('  async function loadUserFiles(', '  // RIGHT PANEL'),
    section('  async function getUniqueFilename(', '  addMapButton.addEventListener'),
    section('  async function uploadFile(', '  const addMapButton'),
    '\nthis.load = loadUserFiles; this.upload = uploadFile; this.existing = getExistingFilenames;',
  ].join('\n'), context);
  return { context, list, requests, writes, elements };
}

for (const isLocal of [true, false]) {
  test(`${isLocal ? 'local' : 'deployed'} Map list and edit use the storage adapter`, async () => {
    const { context, list, requests, elements } = harness(isLocal);
    await context.load('user@example.test');
    assert.equal(requests[0], 'users/user@example.test/memories');
    assert.deepEqual(Array.from(context.availableMemoryFiles), ['aaaaa12345.json', 'zzzzz12345.json']);
    await list.children[0].click({ shiftKey: true });
    assert.equal(requests[1], 'users/user@example.test/memories/aaaaa12345.json');
    assert.equal(JSON.parse(elements['json-textarea'].value).description, 'Map');
    assert.equal(elements['json-editor'].style.display, 'flex');
  });

  test(`${isLocal ? 'local' : 'deployed'} Map list failure reports the correct source`, async () => {
    const { context, list } = harness(isLocal);
    context.error = true;
    await context.load('user@example.test');
    assert.match(list.children[0].textContent, isLocal ? /local Maps/ : /cloud storage/);
    if (!isLocal) assert.doesNotMatch(list.children[0].textContent, /local/i);
  });
}

test('Map upload validates JSON and writes through adapter', async () => {
  const { context, requests, writes } = harness(false);
  const result = await context.upload('user@example.test', { text: async () => '{"description":"new"}' });
  assert.match(result.filename, /^[a-z]{5}\d{5}\.json$/);
  assert.equal(requests.at(-1), `users/user@example.test/memories/${result.filename}`);
  assert.equal(writes[0][1], '{"description":"new"}');
  await assert.rejects(() => context.upload('user@example.test', { text: async () => '{' }));
  assert.equal(writes.length, 1);
});