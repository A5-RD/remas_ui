import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Import as a module without requiring a package-wide module configuration.
const source = await readFile(new URL('../sigma-live.js', import.meta.url), 'utf8');
const { createLivePreview } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

class Vector3 {
  constructor(x = 0, y = 0, z = 0) { Object.assign(this, { x, y, z }); }
  clone() { return new Vector3(this.x, this.y, this.z); }
  copy(v) { Object.assign(this, { x: v.x, y: v.y, z: v.z }); return this; }
  add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
}
class Quaternion {
  constructor(x = 0, y = 0, z = 0, w = 1) { Object.assign(this, { x, y, z, w }); }
  clone() { return new Quaternion(this.x, this.y, this.z, this.w); }
  copy(q) { Object.assign(this, { x: q.x, y: q.y, z: q.z, w: q.w }); return this; }
  invert() { this.x *= -1; this.y *= -1; this.z *= -1; return this; }
  setFromAxisAngle(v, angle) { const s = Math.sin(angle / 2); return this.copy(new Quaternion(v.x * s, v.y * s, v.z * s, Math.cos(angle / 2))); }
  setFromEuler(e) {
    const [x, y, z] = [e.x, e.y, e.z].map((v) => v / 2);
    return this.copy(new Quaternion(
      Math.sin(x) * Math.cos(y) * Math.cos(z) + Math.cos(x) * Math.sin(y) * Math.sin(z),
      Math.cos(x) * Math.sin(y) * Math.cos(z) - Math.sin(x) * Math.cos(y) * Math.sin(z),
      Math.cos(x) * Math.cos(y) * Math.sin(z) + Math.sin(x) * Math.sin(y) * Math.cos(z),
      Math.cos(x) * Math.cos(y) * Math.cos(z) - Math.sin(x) * Math.sin(y) * Math.sin(z)));
  }
  multiply(q) {
    const { x, y, z, w } = this;
    return this.copy(new Quaternion(w*q.x + x*q.w + y*q.z - z*q.y, w*q.y - x*q.z + y*q.w + z*q.x,
      w*q.z + x*q.y - y*q.x + z*q.w, w*q.w - x*q.x - y*q.y - z*q.z));
  }
  premultiply(q) { return this.copy(q.clone().multiply(this)); }
}
class Euler { constructor(x, y, z) { Object.assign(this, { x, y, z }); } }
const THREE = { Vector3, Quaternion, Euler };
const bone = (name) => ({ name, isBone: true, position: new Vector3(1, 2, 3), quaternion: new Quaternion() });
const rig = (...bones) => ({ traverse: (visit) => bones.forEach(visit) });
const track = (property, aliases, a, b) => ({ property, aliases, keyframes: [{ frame: 1, value: a }, { frame: 13, value: b }] });
const payload = (tracks) => ({ version: 1, plan: { frame_start: 1, frame_end: 13, fps: 12, bone_motions: tracks } });

function fixture(bones = [bone('hand.L')]) {
  const model = rig(...bones);
  const models = new Map([['avatar.glb', model]]);
  const messages = [];
  return { bones, model, models, messages, preview: createLivePreview(THREE, () => models, (...args) => messages.push(args)) };
}

test('requires confirmation, one rig, supported version and valid tracks', () => {
  const { preview, models } = fixture();
  const p = payload([track('location', ['hand.L'], [0, 0, 0], [1, 2, 3])]);
  assert.throws(() => preview.start(p, 'a', false), /confirmed/);
  assert.throws(() => preview.start({ ...p, version: 2 }, 'a', true), /unsupported/);
  assert.throws(() => preview.start(payload([track('scale', ['hand.L'], [0, 0, 0], [1, 2, 3])]), 'a', true), /unsupported/);
  models.clear();
  assert.throws(() => preview.start(p, 'a', true), /No rigged/);
  models.set('a.glb', rig(bone('hand.L')));
  models.set('b.glb', rig(bone('hand.L')));
  assert.throws(() => preview.start(p, 'a', true), /Multiple/);
});

test('exact ordered aliases, interpolation, axis conversion, freezing and restoration', () => {
  const { preview, bones: [hand], messages } = fixture();
  const p = payload([
    track('location', ['not-present', 'hand.L'], [0, 0, 0], [2, 4, 6]),
    track('rotation_euler', ['hand.L'], [0, 0, 0], [0, 0, Math.PI]),
    track('location', ['missing'], [0, 0, 0], [1, 1, 1]),
  ]);
  const before = performance.now();
  preview.start(p, 'req', true);
  assert.match(messages[0][2], /Missing bones: missing/);
  preview.update(before + 2000);
  assert.deepEqual(hand.position, new Vector3(3, 8, -1));
  assert.ok(Math.abs(Math.abs(hand.quaternion.y) - 1) < 1e-8);
  assert.match(messages.at(-1)[2], /frozen/);
  const frozen = hand.quaternion.clone();
  preview.update(before + 10000);
  assert.deepEqual(hand.quaternion, frozen);
  preview.stop();
  assert.deepEqual(hand.position, new Vector3(1, 2, 3));
  assert.deepEqual(hand.quaternion, new Quaternion());
});

test('removing the animated model restores it and reports the error', () => {
  const { preview, bones: [hand], model, messages } = fixture();
  preview.start(payload([track('location', ['hand.L'], [1, 2, 3], [1, 2, 3])]), 'req', true);
  preview.update(performance.now());
  assert.notDeepEqual(hand.position, new Vector3(1, 2, 3));
  preview.modelRemoved(model);
  assert.deepEqual(hand.position, new Vector3(1, 2, 3));
  assert.equal(messages.at(-1)[1], 'error');
});

test('samples intermediate frames relative to the original position and quaternion', () => {
  const { preview, bones: [hand] } = fixture();
  hand.quaternion.setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 3);
  const rest = hand.quaternion.clone();
  const start = performance.now();
  preview.start(payload([
    track('location', ['hand.L'], [0, 0, 0], [2, 4, 6]),
    track('rotation_euler', ['hand.L'], [0, 0, 0], [0, 0, 0]),
  ]), 'req', true);
  preview.update(start + 500);
  assert.ok(Math.abs(hand.position.x - 2) < 0.01);
  assert.ok(Math.abs(hand.position.y - 5) < 0.01);
  assert.ok(Math.abs(hand.position.z - 1) < 0.01);
  for (const component of ['x', 'y', 'z', 'w']) assert.ok(Math.abs(hand.quaternion[component] - rest[component]) < 1e-8);
  preview.stop();
  assert.deepEqual(hand.quaternion, rest);
});

test('ambiguous and missing bone names are surfaced', () => {
  const duplicate = fixture([bone('same'), bone('same')]);
  assert.throws(() => duplicate.preview.start(payload([track('location', ['same'], [0,0,0], [0,0,0])]), 'x', true), /Ambiguous/);
  const missing = fixture();
  assert.throws(() => missing.preview.start(payload([track('location', ['HAND.L'], [0,0,0], [0,0,0])]), 'x', true), /Missing: HAND.L/);
});
