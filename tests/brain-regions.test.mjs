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
});

test('fixed positions are deterministic and contained in their region', () => {
  for (const region of REGIONS) {
    for (let n = 0; n < 100; n++) {
      const id = `node${n}`;
      const position = positionMap(id, region.id);
      assert.deepEqual(position, positionMap(id, region.id));
      assert.ok(position.reduce((sum, p, i) => sum + ((p - region.center[i]) / region.radii[i]) ** 2, 0) <= 1);
    }
  }
  assert.deepEqual(positionMap('node', 'nonexistent'), positionMap('node', 'unknown'));
});

test('neighbor depth handles cycles, duplicate links and object endpoints', () => {
  const links = [{ source: 'a', target: 'b' }, { source: { id: 'b' }, target: { id: 'c' } },
    { source: 'c', target: 'a' }, { source: 'c', target: 'd' }, { source: 'a', target: 'b' },
    { source: 'x', target: 'y' }];
  assert.deepEqual([...neighborhood('a', links, 1)].sort(), ['a', 'b', 'c']);
  assert.deepEqual([...neighborhood('a', links, 2)].sort(), ['a', 'b', 'c', 'd']);
  assert.deepEqual([...neighborhood('x', links, null)].sort(), ['x', 'y']);
});