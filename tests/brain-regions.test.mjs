import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REGIONS, classifyMap, positionMap, neighborhood } from '../brain-regions.js';

test('local annotations are scoped and ambiguous Maps remain unassigned', () => {
  assert.equal(classifyMap('wlkpt12006', {}, true), 'frontal_lobe');
  assert.equal(classifyMap('avnrd10005', {}, true), 'parietal_lobe');
  assert.equal(classifyMap('avpit10004', {}, true), 'auditory_area');
  assert.equal(classifyMap('debjh32368', {}, true), 'unknown');
  assert.equal(classifyMap('wlkpt12006', {}, false), 'unknown');
  const explicit = { associations: { 'from central_nervous_system.parietal_lobe.english_word_search import word_search': [0, 0] } };
  assert.equal(classifyMap('other12345', explicit, false), 'parietal_lobe');
  explicit.associations['from central_nervous_system.frontal_lobe.motor_skills import MotorSkills'] = [1, 0];
  assert.equal(classifyMap('other12345', explicit, false), 'unknown');
  for (const region of REGIONS.filter(region => region.id !== 'unknown')) {
    assert.equal(classifyMap('other12345', {
      associations: [`central_nervous_system.${region.id}.example`],
    }, false), region.id);
  }
  assert.equal(classifyMap('other12345', { associations: 'other.frontal_lobe.example' }, false), 'unknown');
});

test('region metadata preserves labels and hides decorative globes', () => {
  assert.deepEqual(REGIONS.map(region => region.id), [
    'frontal_lobe', 'parietal_lobe', 'occipital_lobe', 'auditory_area',
    'emotional_area', 'cerebellum', 'unknown',
  ]);
  for (const region of REGIONS) {
    assert.ok(region.label && region.color);
    assert.deepEqual(region.radii, [0, 0, 0]);
    assert.equal(region.center.length, 3);
  }
});

const samples = region => Array.from({ length: 2000 }, (_, n) => positionMap(`node${n}`, region));
const mean = (points, selector) => points.reduce((sum, point) => sum + selector(point), 0) / points.length;

test('positions are deterministic, finite, bounded, and vary across IDs', () => {
  for (const region of REGIONS) {
    const points = samples(region.id);
    for (let n = 0; n < points.length; n++) {
      const id = `node${n}`;
      const position = points[n];
      assert.deepEqual(position, positionMap(id, region.id));
      assert.equal(position.length, 3);
      assert.ok(position.every(Number.isFinite));
      assert.ok(Math.hypot(...position) < 47);
    }
    assert.equal(new Set(points.map(point => point.join(','))).size, points.length);
  }
  assert.deepEqual(positionMap('node', 'nonexistent'), positionMap('node', 'unknown'));
  const before = positionMap('stable', 'frontal_lobe');
  samples('occipital_lobe').reverse();
  assert.deepEqual(positionMap('stable', 'frontal_lobe'), before);
});

test('brain regions occupy bilateral solids with a midline fissure', () => {
  for (const region of REGIONS.filter(region => region.id !== 'unknown')) {
    const points = samples(region.id);
    const left = points.filter(([x]) => x < 0).length;
    assert.ok(left > 800 && left < 1200, `${region.id} should occupy both hemispheres`);
    assert.ok(points.every(([x]) => Math.abs(x) >= 0.6), `${region.id} should leave a fissure`);
    for (let axis = 0; axis < 3; axis++) {
      const values = points.map(point => point[axis]);
      assert.ok(Math.max(...values) - Math.min(...values) > 5, `${region.id} should vary on axis ${axis}`);
    }
  }
  // The cortical envelope contains interior points as well as outer points;
  // it is not just a shell or a set of small, separate region ellipsoids.
  const frontal = samples('frontal_lobe');
  const normalizedRadius = ([x, y, z]) => {
    const section = Math.sqrt(1 - (z / 25) ** 2);
    return Math.hypot((Math.abs(x) - 0.7) / (18 * section),
      (y - 0.5 - 1.5 * z / 22) / (13 * section));
  };
  assert.ok(frontal.some(point => normalizedRadius(point) < 0.15));
  assert.ok(frontal.some(point => normalizedRadius(point) > 0.85));
  const widest = frontal.filter(([, , z]) => z < 8);
  const tip = frontal.filter(([, , z]) => z > 18);
  assert.ok(mean(widest, ([x]) => Math.abs(x)) > mean(tip, ([x]) => Math.abs(x)));
});

test('anatomical biases are ordered and unassigned nodes are separate', () => {
  const frontal = samples('frontal_lobe');
  const parietal = samples('parietal_lobe');
  const occipital = samples('occipital_lobe');
  const auditory = samples('auditory_area');
  const emotional = samples('emotional_area');
  const cerebellum = samples('cerebellum');
  const unknown = samples('unknown');
  const depth = point => point[2];
  assert.ok(mean(frontal, depth) > mean(parietal, depth));
  assert.ok(mean(parietal, depth) > mean(occipital, depth));
  assert.ok(mean(parietal, point => point[1]) > mean(frontal, point => point[1]));
  assert.ok(mean(auditory, point => point[1]) < mean(parietal, point => point[1]));
  assert.ok(mean(auditory, point => Math.abs(point[0])) > mean(emotional, point => Math.abs(point[0])));
  assert.ok(mean(cerebellum, point => point[1]) < mean(occipital, point => point[1]));
  assert.ok(mean(cerebellum, depth) < mean(parietal, depth));
  assert.ok(unknown.every(([x]) => x > 30));
  for (const brain of [frontal, parietal, occipital, auditory, emotional, cerebellum]) {
    assert.ok(brain.every(([x]) => Math.abs(x) < 20));
  }
});

test('neighbor depth handles cycles, duplicate links and object endpoints', () => {
  const links = [{ source: 'a', target: 'b' }, { source: { id: 'b' }, target: { id: 'c' } },
    { source: 'c', target: 'a' }, { source: 'c', target: 'd' }, { source: 'a', target: 'b' },
    { source: 'x', target: 'y' }];
  assert.deepEqual([...neighborhood('a', links, 1)].sort(), ['a', 'b', 'c']);
  assert.deepEqual([...neighborhood('a', links, 2)].sort(), ['a', 'b', 'c', 'd']);
  assert.deepEqual([...neighborhood('x', links, null)].sort(), ['x', 'y']);
});