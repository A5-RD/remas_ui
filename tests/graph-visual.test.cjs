const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const psi = fs.readFileSync(path.join(root, 'psi.html'), 'utf8');
const adapter = fs.readFileSync(path.join(root, 'local-graph.js'), 'utf8');

test('graph container fills iframe using a valid selector for its numeric ID', () => {
  assert.match(psi, /\[id="3d-graph"\]\s*\{\s*width:\s*100%;\s*height:\s*100%;\s*\}/);
});

test('association targets without loaded JSON files do not become graph nodes', () => {
  const start = psi.indexOf('    function buildAdjacency(memories) {');
  const end = psi.indexOf('    function endpointId(', start);
  assert.ok(start >= 0 && end > start);
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${psi.slice(start, end)}\nthis.buildAdjacency = buildAdjacency;`, context);

  const { nodes, links } = context.buildAdjacency([
    { filename: 'aaaaa11111', data: { associations: ['bbbbb22222', 'ccccc33333'] } },
    { filename: 'bbbbb22222', data: { associations: ['aaaaa11111'] } },
  ]);

  assert.deepEqual(Array.from(nodes, node => node.id), ['aaaaa11111', 'bbbbb22222']);
  assert.deepEqual(Array.from(links, link => [link.source, link.target]), [
    ['aaaaa11111', 'bbbbb22222'],
    ['bbbbb22222', 'aaaaa11111'],
  ]);
  assert.ok(Array.from(nodes).every(node => !node.placeholder));
});

test('brain-area selection brightens only matching Map nodes without rendering globes', () => {
  const start = psi.indexOf('    function graphNodeColor(node) {');
  const end = psi.indexOf('    function graphLinkColor(', start);
  assert.ok(start >= 0 && end > start);
  const context = {};
  vm.createContext(context);
  vm.runInContext(`let selectedBrainArea = 'motor_cortex'; let brightenNodes = true;\n${psi.slice(start, end)}\nthis.graphNodeColor = graphNodeColor;`, context);
  assert.equal(context.graphNodeColor({ regionId: 'motor_cortex' }), '#ffffff');
  assert.equal(context.graphNodeColor({ regionId: 'visual_cortex' }), '#3b3b3b');
  assert.doesNotMatch(psi, /createBrainHemisphereMeshes|SphereGeometry\(1,\s*(40|24)/);
  assert.match(psi, /psi-map-areas/);
  assert.match(psi, /node\.regionId = areaId/);
  assert.match(psi, /brainArea: selectedBrainArea \|\| ''/);
  assert.match(psi, /\(event\.data\.brainArea !== '' && !availableBrainAreas\.has\(event\.data\.brainArea\)\)/);
});

class Element {
  constructor() { this.listeners = {}; this.style = {}; this.dataset = {}; this.hidden = false; this.checked = true; this.value = ''; this.offsetWidth = 180; this.offsetHeight = 120; }
  addEventListener(name, callback) { (this.listeners[name] ||= []).push(callback); }
  fire(name, event = {}) { for (const callback of this.listeners[name] || []) callback({ preventDefault() {}, ...event }); }
  contains(target) { return target === this; }
  appendChild(child) { (this.children ||= []).push(child); }
  replaceChildren(...children) { this.children = children; }
  add(child) { (this.children ||= []).push(child); }
  focus() { this.focused = true; }
}
class Object3D {
  constructor() {
    this.children = []; this.parent = null;
    this.position = { set: (...values) => { this.position.values = values; }, copy: value => { this.position.values = value.values ? [...value.values] : [value.x, value.y, value.z]; } };
    this.scale = { set: (...values) => { this.scale.values = values; }, copy: value => { this.scale.values = [...value.values]; } };
  }
  add(object) { this.children.push(object); object.parent = this; }
  remove(object) { this.children = this.children.filter(child => child !== object); object.parent = null; }
  traverse(callback) { callback(this); this.children.forEach(child => child.traverse(callback)); }
}
class Geometry { constructor(...parameters) { this.parameters = parameters; this.disposed = 0; } dispose() { this.disposed++; } setFromPoints(points) { this.points = points; return this; } }
class Material { constructor(options = {}) { Object.assign(this, options); this.disposed = 0; this.color = { set: value => { this.color.value = value; } }; this.color.set(options.color); } dispose() { this.disposed++; } }
class Mesh extends Object3D { constructor(geometry, material) { super(); this.geometry = geometry; this.material = material; this.userData = {}; } }
class Vector3 { constructor(x, y, z) { Object.assign(this, { x, y, z }); } length() { return Math.hypot(this.x, this.y, this.z); } }
const THREE = { Group: Object3D, Scene: Object3D, Mesh, Line: Mesh, SphereGeometry: Geometry, BufferGeometry: Geometry, MeshBasicMaterial: Material, LineBasicMaterial: Material, Vector3 };

function pageHarness(isLocal, embedded = false) {
  const elements = new Map(), document = new Element();
  document.createElement = () => new Element();
  document.getElementById = id => { if (embedded && id === 'show-connections') return null; if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); };
  const graphs = [], classifications = [], positions = [], observers = [], messages = [];
  document.getElementById('3d-graph').clientWidth = 800;
  document.getElementById('3d-graph').clientHeight = 600;
  const fixtures = [
    { filename: 'aaaaa11111', data: { description: '<a>', associations: ['bbbbb22222'] } },
    { filename: 'bbbbb22222', data: { associations: ['ccccc33333'] } },
    { filename: 'ddddd44444', data: { associations: ['eeeee55555'] } },
    { filename: 'eeeee55555', data: {} },
  ];
  function ForceGraph3D() {
    return () => {
      const graph = { _scene: new Object3D(), scene() { return this._scene; }, _destructor() { this.destroyed = true; } };
      for (const method of ['nodeRelSize', 'nodeOpacity', 'linkWidth', 'linkOpacity', 'linkDirectionalParticleWidth', 'backgroundColor', 'enableNodeDrag', 'width', 'height']) graph[method] = function (value) { this[method + 'Value'] = value; return this; };
      graph.cameraPosition = function (position, target, duration) { this.camera = { position, target, duration }; this.cameraCalls = (this.cameraCalls || 0) + 1; return this; };
      for (const method of ['graphData', 'nodeColor', 'nodeLabel', 'linkColor', 'linkVisibility', 'linkDirectionalParticles', 'onNodeClick', 'onNodeRightClick']) graph[method] = function (value) { if (value === undefined) return this[method + 'Value']; this[method + 'Value'] = value; return this; };
      graphs.push(graph);
      return graph;
    };
  }
  const window = new Element();
  Object.assign(window, { innerWidth: 800, innerHeight: 600, location: { origin: 'https://remas.test' } });
  window.parent = embedded ? { postMessage: (data, origin) => messages.push({ data, origin }) } : window;
  const context = {
    THREE, ForceGraph3D, isLocal, document, window,
    ResizeObserver: class { constructor(callback) { this.callback = callback; observers.push(this); } observe(element) { this.element = element; } disconnect() { this.disconnected = true; } },
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
  return { context, elements, graphs, classifications, positions, document, window, observers, messages };
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
    assert.equal(graph.scene().children.length, 0);
    assert.doesNotMatch(psi, /region-legend|wireframe|addRegionBoundaries/);
    assert.equal(graph.linkDirectionalParticles() === 0, isLocal);
    if (!isLocal) {
      assert.equal(graph.enableNodeDragValue, false);
      assert.equal(graph.widthValue, 800);
      assert.equal(graph.heightValue, 600);
    }
    assert.ok(graph.camera.position.x > graph.camera.target.x);
    assert.ok(graph.camera.position.y > graph.camera.target.y);
    assert.ok(graph.camera.position.z > graph.camera.target.z);
    h.elements.get('3d-graph').clientWidth = 400;
    h.elements.get('3d-graph').clientHeight = 500;
    h.observers[0].callback();
    assert.equal(graph.cameraCalls, 1);
    if (!isLocal) { assert.equal(graph.widthValue, 400); assert.equal(graph.heightValue, 500); }

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
    assert.equal(h.observers[0].disconnected, true);
    assert.equal(graph.destroyed, true);
  });
}

test('initial framing waits for a visible viewport and fits node bounds without reframing', async () => {
  const h = pageHarness(false), element = h.elements.get('3d-graph');
  element.clientWidth = 0; element.clientHeight = 0;
  await h.context.buildGraph({ email: 'test' });
  const graph = h.graphs[0];
  assert.equal(graph.camera, undefined);
  element.clientWidth = 300; element.clientHeight = 900;
  h.observers[0].callback();
  const { position, target } = graph.camera;
  const direction = [position.x - target.x, position.y - target.y, position.z - target.z];
  const distance = Math.hypot(...direction);
  const d = direction.map(v => v / distance), rlen = Math.hypot(d[0], d[2]);
  const right = [d[2] / rlen, 0, -d[0] / rlen];
  const up = [d[1] * right[2], rlen, -d[1] * right[0]];
  const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
  for (const node of graph.graphData().nodes) {
    const p = [node.x - target.x, node.y - target.y, node.z - target.z];
    const depth = distance - dot(p, d);
    assert.ok(Math.abs(dot(p, right)) / depth < Math.tan(25 * Math.PI / 180) / 3);
    assert.ok(Math.abs(dot(p, up)) / depth < Math.tan(25 * Math.PI / 180));
  }
  element.clientWidth = 900; h.observers[0].callback();
  assert.equal(graph.cameraCalls, 1);
});

for (const isLocal of [true, false]) {
  test(`embedded ${isLocal ? 'local' : 'production'} graph validates messages and synchronizes Show All`, async () => {
    const h = pageHarness(isLocal, true);
    assert.equal(h.messages[0].data.type, 'psi-ready');
    assert.equal(h.messages[0].origin, 'https://remas.test');
    const send = (origin, source, data) => h.window.fire('message', { origin, source, data });
    const data = { type: 'psi-set-connections', showConnections: false };
    send('https://evil.test', h.window.parent, data);
    send('https://remas.test', {}, data);
    send('https://remas.test', h.window.parent, { ...data, showConnections: 'false' });
    send('https://remas.test', h.window.parent, { type: 'unknown', showConnections: false });
    await h.context.buildGraph({ email: 'test' });
    const graph = h.graphs[0];
    assert.ok(graph.graphData().links.every(link => graph.linkVisibility()(link)));
    send('https://remas.test', h.window.parent, data);
    assert.ok(graph.graphData().links.every(link => !graph.linkVisibility()(link)));
    h.elements.get('show-all').fire('click');
    assert.equal(h.messages.at(-1).data.type, 'psi-connections-changed');
    assert.equal(h.messages.at(-1).data.showConnections, true);
    assert.ok(graph.graphData().links.every(link => graph.linkVisibility()(link)));
    send('https://remas.test', h.window.parent, data);
    await h.context.buildGraph({ email: 'test' });
    assert.ok(h.graphs[1].graphData().links.every(link => !h.graphs[1].linkVisibility()(link)));
  });
}

test('standalone graph ignores messages and keeps its checkbox and Show All functional', async () => {
  const h = pageHarness(true), checkbox = h.elements.get('show-connections');
  await h.context.buildGraph({ email: 'test' });
  h.window.fire('message', { origin: 'https://remas.test', source: h.window,
    data: { type: 'psi-set-connections', showConnections: false } });
  assert.equal(checkbox.checked, true);
  checkbox.checked = false; checkbox.fire('change');
  assert.ok(h.graphs[0].graphData().links.every(link => !h.graphs[0].linkVisibility()(link)));
  h.elements.get('show-all').fire('click');
  assert.equal(checkbox.checked, true);
  assert.equal(h.messages.length, 0);
});

test('brain-area dropdown lists loaded areas and sends the selected area to Ψ', () => {
  const simulation = fs.readFileSync(path.join(root, 'simulation.js'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'simulation.html'), 'utf8');
  const start = simulation.indexOf("  const psiFrame = document.getElementById('psi-iframe');");
  const end = simulation.indexOf('  const availableMemoryFiles = [];', start);
  assert.ok(start >= 0 && end > start);
  const frame = new Element(), controls = new Map(), window = new Element(), sent = [];
  frame.contentWindow = { postMessage: (data, origin) => sent.push({ data, origin }) };
  window.location = { origin: 'https://remas.test' };
  for (const id of ['show-connections', 'brighten-nodes', 'brain-area-filter']) controls.set(id, new Element());
  const document = { getElementById: id => id === 'psi-iframe' ? frame : controls.get(id) };
  vm.runInNewContext(simulation.slice(start, end), {
    document, window,
    Option: class { constructor(text, value) { this.text = text; this.value = value; } },
  });
  const areaSelect = controls.get('brain-area-filter');
  assert.equal(sent.at(-1).data.brainArea, '');
  assert.equal(sent.at(-1).origin, 'https://remas.test');
  const send = (origin, source, data) => window.fire('message', { origin, source, data });
  send('https://evil.test', frame.contentWindow, { type: 'psi-map-areas', areas: [{ id: 'frontal_lobe', label: 'Frontal lobe' }] });
  assert.equal(areaSelect.children, undefined);
  send('https://remas.test', frame.contentWindow, { type: 'psi-map-areas', areas: [
    { id: 'frontal_lobe', label: 'Frontal lobe' },
    { id: 'visual_cortex', label: 'Visual cortex' },
    { id: 'unassigned', label: 'Unassigned' },
  ] });
  assert.equal(areaSelect.disabled, false);
  assert.deepEqual(areaSelect.children.map(option => option.value), ['', 'frontal_lobe', 'visual_cortex']);
  areaSelect.value = 'visual_cortex';
  areaSelect.fire('change');
  assert.equal(sent.at(-1).data.brainArea, 'visual_cortex');
  assert.equal(sent.at(-1).data.showConnections, true);
  send('https://remas.test', frame.contentWindow, { type: 'psi-map-areas', areas: [{ id: 'frontal_lobe', label: 'Frontal lobe' }] });
  assert.equal(areaSelect.value, '');
  assert.equal(areaSelect.disabled, false);
  assert.match(html, /<label class="graph-connections-control"><input id="show-connections" type="checkbox" checked> Show connections<\/label>/);
  assert.match(html, /id="brain-area-filter"/);
  assert.match(psi, /if \(window\.parent !== window\) \{[\s\S]*type: 'psi-map-areas'/);
  assert.match(psi, /if \(selectedBrainArea\) return node\.regionId === selectedBrainArea \? '#ffffff' : '#3b3b3b'/);
  assert.doesNotMatch(psi, /createBrainHemisphereMeshes/);
  assert.match(html, /id="start"[^>]*aria-label="Start simulation"[^>]*><svg/);
  assert.doesNotMatch(html, /play_arrow/);
});

test('local graph picks nodes independently of overlays, suppresses right drags, and rebuilds without leaking meshes', () => {
  const canvas = new Element();
  canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 });
  canvas.remove = () => {};
  const parent = { clientWidth: 100, clientHeight: 100, appendChild() {} };
  let picked = null;
  let camera, renderer, controls, observer;
  class Camera { constructor() { camera = this; this.position = { set: (...values) => { this.position.values = values; } }; } updateProjectionMatrix() { this.projections = (this.projections || 0) + 1; } lookAt(target) { this.lookTarget = target.values; } }
  class Renderer { constructor() { renderer = this; this.domElement = canvas; } setPixelRatio() {} setSize(...size) { this.size = size; } render() {} dispose() {} }
  class Controls { constructor() { controls = this; this.target = { set: (...values) => { this.target.values = values; } }; } update() {} dispose() {} }
  class Raycaster { setFromCamera() {} intersectObjects(objects) { return picked ? [{ object: objects.find(object => object.userData.node.id === picked) }] : []; } }
  const localThree = { ...THREE, PerspectiveCamera: Camera, WebGLRenderer: Renderer, Raycaster, Vector2: class { set() {} }, Color: class {} };
  const context = { THREE: localThree, OrbitControls: Controls, window: { devicePixelRatio: 1 }, ResizeObserver: class { constructor(callback) { this.callback = callback; observer = this; } observe(element) { this.element = element; } disconnect() {} }, requestAnimationFrame: () => 1, cancelAnimationFrame() {}, Math };
  const source = adapter.replace(/^import .*;\n/gm, '').replace('export function ForceGraph3D()', 'function ForceGraph3D()');
  vm.createContext(context);
  vm.runInContext(source + '\nthis.ForceGraph3D = ForceGraph3D;', context);
  const graph = context.ForceGraph3D()(parent);
  const nodes = [{ id: 'a', fx: 1, fy: 2, fz: 3 }, { id: 'b', fx: 4, fy: 5, fz: 6 }], links = [{ source: 'a', target: 'b' }];
  graph.graphData({ nodes, links });
  graph.cameraPosition({ x: 30, y: 20, z: 40 }, { x: 2, y: 3, z: 4 });
  assert.deepEqual(camera.position.values, [30, 20, 40]);
  assert.deepEqual(controls.target.values, [2, 3, 4]);
  assert.deepEqual(camera.lookTarget, [2, 3, 4]);
  parent.clientWidth = 400; parent.clientHeight = 200; observer.callback();
  assert.deepEqual(renderer.size, [400, 200]);
  assert.equal(camera.aspect, 2);
  assert.deepEqual(camera.position.values, [30, 20, 40]);
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