const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const psi = fs.readFileSync(path.join(root, 'psi.html'), 'utf8');
const adapter = fs.readFileSync(path.join(root, 'local-graph.js'), 'utf8');

class Element {
  constructor() { this.listeners = {}; this.style = {}; this.dataset = {}; this.hidden = false; this.checked = true; this.value = ''; this.offsetWidth = 180; this.offsetHeight = 120; }
  addEventListener(name, callback) { (this.listeners[name] ||= []).push(callback); }
  fire(name, event = {}) { for (const callback of this.listeners[name] || []) callback({ preventDefault() {}, ...event }); }
  contains(target) { return target === this; }
  appendChild(child) { (this.children ||= []).push(child); }
  focus() { this.focused = true; }
}
class Object3D {
  constructor() {
    this.children = []; this.parent = null;
    this.position = { set: (...values) => { this.position.values = values; }, copy: value => { this.position.values = [value.x, value.y, value.z]; } };
    this.scale = { set: (...values) => { this.scale.values = values; } };
  }
  add(object) { this.children.push(object); object.parent = this; }
  remove(object) { this.children = this.children.filter(child => child !== object); object.parent = null; }
  traverse(callback) { callback(this); this.children.forEach(child => child.traverse(callback)); }
}
class Geometry { constructor() { this.disposed = 0; } dispose() { this.disposed++; } setFromPoints(points) { this.points = points; return this; } }
class Material { constructor(options = {}) { this.disposed = 0; this.color = { set: value => { this.color.value = value; } }; this.color.set(options.color); } dispose() { this.disposed++; } }
class Mesh extends Object3D { constructor(geometry, material) { super(); this.geometry = geometry; this.material = material; this.userData = {}; } }
class Vector3 { constructor(x, y, z) { Object.assign(this, { x, y, z }); } length() { return Math.hypot(this.x, this.y, this.z); } }
const THREE = { Group: Object3D, Scene: Object3D, Mesh, Line: Mesh, SphereGeometry: Geometry, BufferGeometry: Geometry, MeshBasicMaterial: Material, LineBasicMaterial: Material, Vector3 };

function pageHarness(isLocal) {
  const elements = new Map(), document = new Element();
  document.createElement = () => new Element();
  document.getElementById = id => { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); };
  const graphs = [], classifications = [], positions = [];
  const fixtures = [
    { filename: 'aaaaa11111', data: { description: '<a>', associations: ['bbbbb22222'] } },
    { filename: 'bbbbb22222', data: { associations: ['ccccc33333'] } },
    { filename: 'ddddd44444', data: { associations: ['eeeee55555'] } },
    { filename: 'eeeee55555', data: {} },
  ];
  function ForceGraph3D() {
    return () => {
      const graph = { _scene: new Object3D(), scene() { return this._scene; }, _destructor() { this.destroyed = true; } };
      for (const method of ['nodeRelSize', 'nodeOpacity', 'linkWidth', 'linkOpacity', 'linkDirectionalParticleWidth', 'backgroundColor', 'enableNodeDrag']) graph[method] = function (value) { this[method + 'Value'] = value; return this; };
      for (const method of ['graphData', 'nodeColor', 'nodeLabel', 'linkColor', 'linkVisibility', 'linkDirectionalParticles', 'onNodeClick', 'onNodeRightClick']) graph[method] = function (value) { if (value === undefined) return this[method + 'Value']; this[method + 'Value'] = value; return this; };
      graphs.push(graph);
      return graph;
    };
  }
  const context = {
    THREE, ForceGraph3D, isLocal, document, window: { innerWidth: 800, innerHeight: 600 },
    REGIONS: [{ id: 'vision', label: '<Vision>', color: '#f00', center: [1, 2, 3], radii: [4, 5, 6] }, { id: 'unknown', label: 'Unknown', color: '#888', center: [0, 0, 0], radii: [2, 2, 2] }],
    classifyMap(id, data, local) { classifications.push([id, data, local]); return 'vision'; },
    positionMap(id, region) { positions.push([id, region]); return [id.charCodeAt(0), region === 'unknown' ? 2 : 1, 3]; },
    neighborhood(id, links, depth) {
      const result = new Set([id]);
      for (let i = 0; i < depth; i++) {
        const next = new Set(result);
        for (const link of links) {
          const a = typeof link.source === 'object' ? link.source.id : link.source;
          const b = typeof link.target === 'object' ? link.target.id : link.target;
          if (result.has(a)) next.add(b);
          if (result.has(b)) next.add(a);
        }
        for (const value of next) result.add(value);
      }
      return result;
    },
    auth: { currentUser: { email: 'test' } }, storage: {}, TextDecoder, console,
    ref: (_storage, value) => value,
    listAll: async () => ({ items: fixtures.map(f => ({ name: f.filename + '.json', data: f.data })) }),
    getBytes: async item => new TextEncoder().encode(JSON.stringify(item.data)),
  };
  const start = psi.indexOf('    const highlightedNodes = new Set();');
  const end = psi.indexOf('    onAuthStateChanged(auth, user => {', start);
  assert.ok(start >= 0 && end > start);
  vm.createContext(context);
  vm.runInContext(psi.slice(start, end) + '\nthis.buildGraph = buildGraph;', context);
  return { context, elements, graphs, classifications, positions, document };
}

for (const isLocal of [true, false]) {
  test(`${isLocal ? 'local' : 'production'} graph regions, connection filters, interaction and cleanup`, async () => {
    const h = pageHarness(isLocal);
    await h.context.buildGraph({ email: 'test' });
    const graph = h.graphs[0], { nodes, links } = graph.graphData();
    assert.equal(h.classifications.length, 4);
    assert.ok(h.classifications.every(row => row[2] === isLocal));
    const missing = nodes.find(node => node.id === 'ccccc33333');
    assert.equal(missing.regionId, 'unknown');
    assert.equal(missing.regionLabel, 'Unknown');
    assert.deepEqual([missing.fx, missing.fy, missing.fz], [99, 2, 3]);
    assert.equal(nodes[0].x, nodes[0].fx);
    assert.match(graph.nodeLabel()(nodes[0]), isLocal ? /Region: <Vision>/ : /Region: &lt;Vision&gt;/);
    const group = graph.scene().children[0], boundary = group.children[0];
    assert.deepEqual(boundary.position.values, [1, 2, 3]);
    assert.deepEqual(boundary.scale.values, [4, 5, 6]);
    assert.equal(boundary.raycast(), undefined);
    assert.equal(graph.linkDirectionalParticles() === 0, isLocal);
    if (!isLocal) assert.equal(graph.enableNodeDragValue, false);

    // Force-graph may replace endpoint IDs with node objects.
    links[0].source = nodes[0]; links[0].target = nodes[1];
    graph.onNodeClick()(nodes[0]);
    assert.equal(graph.linkColor()(links[0]), 'orange');
    graph.onNodeRightClick()(nodes[0], { clientX: 780, clientY: 590, preventDefault() {} });
    assert.equal(h.elements.get('neighbor-menu').hidden, false);
    assert.equal(h.elements.get('neighbor-menu').style.left, '620px');
    const depth = h.elements.get('neighbor-depth'), menu = h.elements.get('neighbor-menu');
    depth.value = '-1'; menu.fire('submit');
    assert.match(h.elements.get('neighbor-error').textContent, /positive/);
    assert.equal(menu.hidden, false);
    depth.value = '1'; menu.fire('submit');
    assert.deepEqual(Array.from(links, graph.linkVisibility()), [true, false, false]);
    if (!isLocal) assert.deepEqual(Array.from(links, graph.linkDirectionalParticles()), [1, 0, 0]);
    assert.equal(graph.linkColor()(links[0]), 'orange');
    const checkbox = h.elements.get('show-connections');
    checkbox.checked = false; checkbox.fire('change');
    assert.deepEqual(Array.from(links, graph.linkVisibility()), [false, false, false]);
    checkbox.checked = true; checkbox.fire('change');
    assert.deepEqual(Array.from(links, graph.linkVisibility()), [true, false, false]);
    graph.onNodeRightClick()(nodes[0], { clientX: 1, clientY: 1, preventDefault() {} });
    depth.value = ''; menu.fire('submit');
    assert.deepEqual(Array.from(links, graph.linkVisibility()), [true, true, true]);
    graph.onNodeRightClick()(nodes[0], { clientX: 1, clientY: 1, preventDefault() {} });
    depth.value = '2'; menu.fire('submit');
    assert.deepEqual(Array.from(links, graph.linkVisibility()), [true, true, false]);
    checkbox.checked = false; checkbox.fire('change');
    h.elements.get('show-all').fire('click');
    assert.equal(checkbox.checked, true);
    assert.deepEqual(Array.from(links, graph.linkVisibility()), [true, true, true]);
    assert.equal(graph.linkColor()(links[0]), 'white');
    await h.context.buildGraph({ email: 'test' });
    assert.equal(boundary.geometry.disposed, 1);
    assert.equal(boundary.material.disposed, 1);
    assert.equal(group.parent, null);
    assert.equal(graph.destroyed, true);
  });
}

test('local graph picks nodes independently of overlays, suppresses right drags, and rebuilds without leaking meshes', () => {
  const canvas = new Element();
  canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 });
  canvas.remove = () => {};
  const parent = { clientWidth: 100, clientHeight: 100, appendChild() {} };
  let picked = null;
  class Camera { constructor() { this.position = { set() {}, z: 0 }; } updateProjectionMatrix() {} }
  class Renderer { constructor() { this.domElement = canvas; } setPixelRatio() {} setSize() {} render() {} dispose() {} }
  class Controls { update() {} dispose() {} }
  class Raycaster { setFromCamera() {} intersectObjects(objects) { return picked ? [{ object: objects.find(object => object.userData.node.id === picked) }] : []; } }
  const localThree = { ...THREE, PerspectiveCamera: Camera, WebGLRenderer: Renderer, Raycaster, Vector2: class { set() {} }, Color: class {} };
  const context = { THREE: localThree, OrbitControls: Controls, window: { devicePixelRatio: 1 }, ResizeObserver: class { observe() {} disconnect() {} }, requestAnimationFrame: () => 1, cancelAnimationFrame() {}, Math };
  const source = adapter.replace(/^import .*;\n/gm, '').replace('export function ForceGraph3D()', 'function ForceGraph3D()');
  vm.createContext(context);
  vm.runInContext(source + '\nthis.ForceGraph3D = ForceGraph3D;', context);
  const graph = context.ForceGraph3D()(parent);
  const nodes = [{ id: 'a', fx: 1, fy: 2, fz: 3 }, { id: 'b', fx: 4, fy: 5, fz: 6 }], links = [{ source: 'a', target: 'b' }];
  graph.graphData({ nodes, links });
  const [first, second, line] = graph.scene().children;
  assert.deepEqual(first.position.values, [1, 2, 3]);
  assert.deepEqual(Array.from(line.geometry.points, p => [p.x, p.y, p.z]), [[1, 2, 3], [4, 5, 6]]);
  graph.linkVisibility(() => false);
  assert.equal(line.visible, false);
  graph.linkVisibility(() => true);
  assert.equal(line.visible, true);
  const overlay = new Object3D(); graph.scene().add(overlay);
  let clicked = 0; graph.onNodeRightClick(() => clicked++); picked = 'a';
  canvas.fire('pointerdown', { button: 2, clientX: 10, clientY: 10 });
  canvas.fire('pointermove', { clientX: 30, clientY: 10 });
  canvas.fire('pointerup', { button: 2, clientX: 30, clientY: 10 });
  canvas.fire('contextmenu', { clientX: 30, clientY: 10 });
  assert.equal(clicked, 0);
  canvas.fire('pointerdown', { button: 2, clientX: 10, clientY: 10 });
  canvas.fire('pointerup', { button: 2, clientX: 10, clientY: 10 });
  canvas.fire('contextmenu', { clientX: 10, clientY: 10 });
  assert.equal(clicked, 1);
  canvas.fire('pointerdown', { button: 2, clientX: 10, clientY: 10 });
  canvas.fire('contextmenu', { clientX: 10, clientY: 10 });
  canvas.fire('pointermove', { clientX: 30, clientY: 10 });
  canvas.fire('pointerup', { button: 2, clientX: 30, clientY: 10 });
  assert.equal(clicked, 1);
  canvas.fire('pointerdown', { button: 2, clientX: 10, clientY: 10 });
  canvas.fire('contextmenu', { clientX: 10, clientY: 10 });
  canvas.fire('pointerup', { button: 2, clientX: 10, clientY: 10 });
  assert.equal(clicked, 2);
  graph.graphData({ nodes: [nodes[0]], links: [] });
  assert.equal(first.geometry.disposed, 1);
  assert.equal(second.material.disposed, 1);
  assert.equal(line.geometry.disposed, 1);
  assert.equal(graph.scene().children.includes(overlay), true);
  assert.equal(graph.scene().children.length, 2);
});

test('loopback server explicitly allows the region module', () => {
  const server = fs.readFileSync(path.join(root, '..', 'REMAS', 'src', 'local_app.py'), 'utf8');
  assert.match(server, /STATIC_FILES\s*=\s*\{[^}]*'brain-regions\.js'/s);
});