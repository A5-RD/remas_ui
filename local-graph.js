// Offline 3D fallback for the small ForceGraph3D surface used by psi.html.
// It uses fixed coordinates when supplied rather than a force simulation.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let previousDispose = null;
export function ForceGraph3D() {
  return element => {
    previousDispose?.();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    camera.position.set(0, 0, 90);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    element.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let nodeColor = () => '#bbb', linkColor = () => 'white', click = () => {}, rightClick = () => {};
    let linkVisible = () => true;
    let nodes = [], links = [], nodeMeshes = [], linkMeshes = [], frame;
    let nodeLabel = n => n.id;

    function resize() {
      const width = Math.max(element.clientWidth, 1), height = Math.max(element.clientHeight, 1);
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    function animate() {
      frame = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();
    function pick(event) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(nodeMeshes)[0]?.object.userData.node;
    }
    let rightStart = null;
    renderer.domElement.addEventListener('pointerdown', event => {
      if (event.button === 2) rightStart = { x: event.clientX, y: event.clientY, moved: false, released: false, menuEvent: null };
    });
    renderer.domElement.addEventListener('click', event => { const node = pick(event); if (node) click(node, event); });
    renderer.domElement.addEventListener('pointermove', event => {
      if (rightStart && Math.hypot(event.clientX - rightStart.x, event.clientY - rightStart.y) > 5) rightStart.moved = true;
      const node = pick(event);
      renderer.domElement.title = node ? nodeLabel(node) : '';
    });
    function finishRightClick(event) {
      const start = rightStart;
      rightStart = null;
      if (!start || start.moved || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 5) return;
      const node = pick(event);
      if (node) rightClick(node, event);
    }
    renderer.domElement.addEventListener('pointerup', event => {
      if (event.button !== 2 || !rightStart) return;
      if (Math.hypot(event.clientX - rightStart.x, event.clientY - rightStart.y) > 5) rightStart.moved = true;
      rightStart.released = true;
      if (rightStart.menuEvent) finishRightClick(rightStart.menuEvent);
    });
    renderer.domElement.addEventListener('contextmenu', event => {
      event.preventDefault();
      if (!rightStart) return;
      // Some browsers dispatch contextmenu on press, others on release.
      if (rightStart.released) finishRightClick(event);
      else rightStart.menuEvent = event;
    });
    renderer.domElement.addEventListener('pointercancel', () => { rightStart = null; });
    previousDispose = () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      scene.traverse(object => { object.geometry?.dispose(); object.material?.dispose(); });
      renderer.dispose();
      renderer.domElement.remove();
      previousDispose = null;
    };
    const graph = {
      graphData(data) {
        if (data === undefined) return { nodes, links };
        for (const mesh of nodeMeshes) {
          scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose();
        }
        for (const { line } of linkMeshes) {
          scene.remove(line); line.geometry.dispose(); line.material.dispose();
        }
        nodeMeshes = []; linkMeshes = [];
        nodes = data.nodes.filter((node, index, all) => all.findIndex(other => other.id === node.id) === index);
        links = data.links;
        const byId = new Map();
        const radius = Math.max(12, Math.cbrt(nodes.length) * 7);
        nodes.forEach((node, index) => {
          const y = 1 - 2 * (index + 0.5) / nodes.length;
          const angle = index * Math.PI * (3 - Math.sqrt(5));
          const r = Math.sqrt(1 - y * y);
          const position = [node.fx, node.fy, node.fz].every(Number.isFinite)
            ? new THREE.Vector3(node.fx, node.fy, node.fz)
            : new THREE.Vector3(Math.cos(angle) * r * radius, y * radius, Math.sin(angle) * r * radius);
          const mesh = new THREE.Mesh(new THREE.SphereGeometry(node.placeholder ? 0.45 : 0.8, 12, 8), new THREE.MeshBasicMaterial({ color: nodeColor(node) }));
          mesh.position.copy(position);
          mesh.userData.node = node;
          scene.add(mesh); nodeMeshes.push(mesh); byId.set(node.id, position);
        });
        links.forEach(link => {
          const from = byId.get(typeof link.source === 'object' ? link.source.id : link.source);
          const to = byId.get(typeof link.target === 'object' ? link.target.id : link.target);
          if (!from || !to) return;
          const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([from, to]), new THREE.LineBasicMaterial({ color: linkColor(link), transparent: true, opacity: 0.25 }));
          line.visible = linkVisible(link);
          scene.add(line); linkMeshes.push({ line, link });
        });
        let extent = radius;
        for (const position of byId.values()) extent = Math.max(extent, position.length());
        // Frame the whole illustrative brain, including the unassigned region,
        // even in narrow viewports where the horizontal field of view is smaller.
        extent = Math.max(extent, 47);
        const verticalHalfFov = 50 * Math.PI / 360;
        const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * camera.aspect);
        camera.position.z = extent * 1.15 / Math.sin(Math.min(verticalHalfFov, horizontalHalfFov));
        return graph;
      },
      nodeColor(value) {
        if (value === undefined) return nodeColor;
        nodeColor = value;
        nodeMeshes.forEach(mesh => mesh.material.color.set(nodeColor(mesh.userData.node)));
        return graph;
      },
      linkColor(value) {
        if (value === undefined) return linkColor;
        linkColor = value;
        linkMeshes.forEach(({ line, link }) => line.material.color.set(linkColor(link)));
        return graph;
      },
      linkVisibility(value) {
        if (value === undefined) return linkVisible;
        linkVisible = typeof value === 'function' ? value : () => Boolean(value);
        linkMeshes.forEach(({ line, link }) => { line.visible = linkVisible(link); });
        return graph;
      },
      scene() { return scene; },
      nodeLabel(value) { nodeLabel = value; return graph; },
      onNodeClick(value) { click = value; return graph; },
      onNodeRightClick(value) { rightClick = value; return graph; },
      backgroundColor(value) { scene.background = new THREE.Color(value); return graph; },
      nodeRelSize() { return graph; }, nodeOpacity() { return graph; },
      linkWidth() { return graph; }, linkOpacity() { return graph; },
      linkDirectionalParticles() { return graph; }, linkDirectionalParticleWidth() { return graph; },
    };
    return graph;
  };
}