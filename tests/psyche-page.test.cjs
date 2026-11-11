const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const psi = fs.readFileSync(path.join(root, 'psi.html'), 'utf8');
const simulation = fs.readFileSync(path.join(root, 'simulation.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'simulation.html'), 'utf8');
function section(source, start, end) {
  const first = source.indexOf(start), last = source.indexOf(end, first);
  assert.ok(first >= 0 && last > first, `${start} section exists`);
  return source.slice(first, last);
}

test('Map graph uses descriptions and safely handles missing data and HTML', () => {
  const code = section(psi, '    function buildAdjacency(', '    async function buildGraph(');
  const context = { isLocal: true };
  vm.createContext(context);
  vm.runInContext(code + '\nthis.build = buildAdjacency; this.label = graphNodeLabel;', context);
  const graph = context.build([
    { filename: 'abcde12345', data: { description: ' <b>Map & details</b> ', associations: { zzzzz12345: [1, 0] } } },
    { filename: 'fghij12345', data: { description: '  ' } },
  ]);
  assert.equal(context.label(graph.nodes[0]), '<b>Map & details</b>');
  assert.equal(context.label(graph.nodes[1]), 'No description available');
  assert.equal(context.label(graph.nodes.find(node => node.placeholder)), 'Referenced Map not found');
  context.isLocal = false;
  assert.equal(context.label(graph.nodes[0]), '&lt;b&gt;Map &amp; details&lt;/b&gt;');
  assert.match(psi, /\.nodeLabel\(graphNodeLabel\)/);
});

function objectHarness(convertedFilename) {
  const rows = [];
  const list = {
    querySelector: () => null,
    querySelectorAll: () => rows,
    appendChild: row => rows.push(row),
  };
  const context = {
    console, alert: message => { context.alert = message; },
    document: {
      getElementById: () => list,
      createElement: () => {
        const classes = new Set(), listeners = new Map();
        return {
          dataset: {}, style: {},
          classList: { add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name) },
          addEventListener(type, handler) { listeners.set(type, handler); },
          fire(type, event = {}) { listeners.get(type)?.({ ctrlKey: false, metaKey: false, altKey: false, ...event }); },
        };
      },
    },
    debugGetBlendHeader: () => { context.inspections++; }, inspections: 0,
    loadCachedBlendOutput: async () => { context.loads++; }, loads: 0,
    openBlendModal: () => { context.modals++; }, modals: 0,
  };
  vm.createContext(context);
  const selection = section(simulation, '  let selectedObjectLi = null;', "  window.addEventListener('message'");
  const blend = section(simulation, '  function addBlendToList(', '  function upsertUploadStatus(');
  vm.runInContext(selection + blend + '\nthis.add = addBlendToList; this.selected = () => selectedObjectLi;', context);
  context.add('scene.blend', { convertedFilename });
  return { context, rows };
}

test('double-click toggles object selection without loading', () => {
  const { context, rows } = objectHarness('scene.glb');
  const row = rows[0];
  row.fire('click'); row.fire('click');
  assert.equal(context.selected(), null);
  row.fire('dblclick');
  assert.equal(context.selected(), row);
  assert.equal(row.classList.contains('selected'), true);
  assert.equal(context.loads, 0);
  assert.equal(context.modals, 0);
  row.fire('dblclick');
  assert.equal(context.selected(), null);
  assert.equal(row.classList.contains('selected'), false);
});

test('double-click switches selection and modifier inspection does not select', () => {
  const { context, rows } = objectHarness(null);
  context.add('another.blend');
  rows[0].fire('dblclick');
  rows[1].fire('dblclick');
  assert.equal(context.selected(), rows[1]);
  assert.equal(rows[0].classList.contains('selected'), false);
  assert.equal(rows[1].classList.contains('selected'), true);
  assert.equal(context.modals, 0);
  rows[0].fire('click', { ctrlKey: true });
  rows[0].fire('dblclick', { ctrlKey: true });
  assert.equal(context.inspections, 1);
  assert.equal(context.selected(), rows[1]);
});

test('sidebar uses Maps and Objects labels', () => {
  assert.match(html, /<span class="explorer-title">Maps<\/span>/);
  assert.match(html, /<span class="explorer-title">Objects<\/span>/);
  assert.doesNotMatch(html, /id="load-selected-object"/);
});