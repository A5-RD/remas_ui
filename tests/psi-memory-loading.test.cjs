const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const psi = fs.readFileSync(path.join(root, 'psi.html'), 'utf8');
const simulation = fs.readFileSync(path.join(root, 'simulation.js'), 'utf8');
const begin = psi.indexOf('    async function fetchMemoryFiles(');
const end = psi.indexOf('    function buildAdjacency(', begin);
assert.ok(begin >= 0 && end > begin);

function loader(items, contents) {
  const errors = [];
  const context = {
    TextDecoder, Promise, storage: {},
    console: { error: (...args) => errors.push(args) },
    ref: (_storage, key) => key,
    listAll: async () => ({ items: items.map(name => ({ name })) }),
    getBytes: async item => {
      const data = contents[item.name];
      if (data instanceof Error) throw data;
      return new TextEncoder().encode(data);
    },
  };
  vm.createContext(context);
  vm.runInContext(psi.slice(begin, end) + '\nthis.fetchMemoryFiles = fetchMemoryFiles;', context);
  return { context, errors };
}

test('one unreadable or malformed Map does not hide other nodes', async () => {
  const { context, errors } = loader(['gooda12345.json', 'badxx12345.json', 'denied12345.json', 'readme.txt'], {
    'gooda12345.json': '{"description":"good"}',
    'badxx12345.json': '{invalid',
    'denied12345.json': new Error('access denied'),
  });
  const result = await context.fetchMemoryFiles('a@example.com');
  assert.deepEqual(Array.from(result.memories, x => x.filename), ['gooda12345']);
  assert.deepEqual(Array.from(result.failures), ['badxx12345.json', 'denied12345.json']);
  assert.equal(errors.length, 2);
});

test('empty folder returns no nodes and empty-state message is available', async () => {
  const { context } = loader([], {});
  const result = await context.fetchMemoryFiles('a@example.com');
  assert.equal(result.memories.length, 0);
  assert.equal(result.failures.length, 0);
  assert.match(psi, /No Maps found for this account/);
});

test('graph refresh messages accompany sidebar add, save and delete', () => {
  assert.ok((simulation.match(/type: 'psi-refresh-maps'/g) || []).length >= 4);
  assert.match(psi, /if \(event\.data\.type === 'psi-refresh-maps'\)/);
});