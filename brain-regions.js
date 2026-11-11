// Visualization annotations, not medical or atlas coordinates.
// Position volumes are illustrative graph units documented in REMAS/BRAIN_AREAS.md.
export const REGIONS = [
  { id: 'frontal_lobe', label: 'Frontal lobe', parent: 'frontal_lobe', type: 'lobe', color: '#78aee8', center: [0, 5, 14], radii: [14, 8, 6] },
  { id: 'prefrontal_cortex', label: 'Prefrontal cortex', parent: 'frontal_lobe', type: 'lobe', color: '#8eb8e8', center: [0, 8, 17], radii: [10, 5, 4] },
  { id: 'motor_cortex', label: 'Motor cortex', parent: 'frontal_lobe', type: 'lobe', color: '#6f9ed8', center: [0, 5, 7], radii: [12, 5, 4] },
  { id: 'parietal_lobe', label: 'Parietal lobe', parent: 'parietal_lobe', type: 'lobe', color: '#aab4ee', center: [0, 9, -5], radii: [14, 6, 7] },
  { id: 'somatosensory_cortex', label: 'Somatosensory cortex', parent: 'parietal_lobe', type: 'lobe', color: '#b0bce6', center: [0, 7, 1], radii: [11, 4, 4] },
  { id: 'temporal_lobe', label: 'Temporal lobe', parent: 'temporal_lobe', type: 'lobe', color: '#d8a982', center: [0, -5, 0], radii: [14, 6, 8] },
  { id: 'auditory_cortex', label: 'Auditory cortex', parent: 'temporal_lobe', type: 'lobe', color: '#e6b07f', center: [0, -6, 1], radii: [11, 3, 3] },
  { id: 'occipital_lobe', label: 'Occipital lobe', parent: 'occipital_lobe', type: 'lobe', color: '#c29ee0', center: [0, 3, -17], radii: [11, 7, 4] },
  { id: 'visual_cortex', label: 'Visual cortex', parent: 'occipital_lobe', type: 'lobe', color: '#c9a5df', center: [0, 3, -20], radii: [9, 5, 2] },
  { id: 'limbic_system', label: 'Limbic system', parent: 'limbic_system', type: 'structure', color: '#e4a6b0', center: [0, -3, 1], radii: [7, 5, 5] },
  { id: 'hippocampus', label: 'Hippocampus', parent: 'limbic_system', type: 'structure', color: '#d996a8', center: [0, -7, -1], radii: [4, 2, 3] },
  { id: 'amygdala', label: 'Amygdala', parent: 'limbic_system', type: 'structure', color: '#e79c9e', center: [0, -5, 4], radii: [3, 2, 2] },
  { id: 'basal_ganglia', label: 'Basal ganglia', parent: 'subcortical', type: 'structure', color: '#bc9dcc', center: [0, 1, 1], radii: [4, 3, 3] },
  { id: 'thalamus', label: 'Thalamus', parent: 'subcortical', type: 'structure', color: '#a99ccb', center: [0, 2, -1], radii: [3, 3, 3] },
  { id: 'insula', label: 'Insula', parent: 'insula', type: 'structure', color: '#c1a8a0', center: [0, 0, 0], radii: [7, 4, 3] },
  { id: 'cerebellum', label: 'Cerebellum', parent: 'cerebellum', type: 'structure', color: '#9dcbb5', center: [0, -12, -15], radii: [10, 4, 5] },
  { id: 'brainstem', label: 'Brainstem', parent: 'brainstem', type: 'structure', color: '#8eb9a8', center: [0, -8, -9], radii: [2, 6, 3] },
  { id: 'unassigned', label: 'Unassigned / mixed', parent: 'unassigned', type: 'unassigned', color: '#9ca7b0', center: [39, -5, 0], radii: [5, 7, 7] },
  { id: 'superior_frontal_gyrus', label: 'Superior frontal gyrus · frontal lobe', parent: 'frontal_lobe', type: 'gyrus', color: '#82afe0', center: [0, 13, 9], patch: [4.5, 3.2] },
  { id: 'middle_frontal_gyrus', label: 'Middle frontal gyrus · frontal lobe', parent: 'frontal_lobe', type: 'gyrus', color: '#8db7e4', center: [0, 7, 12], patch: [5, 3] },
  { id: 'inferior_frontal_gyrus', label: 'Inferior frontal gyrus · frontal lobe', parent: 'frontal_lobe', type: 'gyrus', color: '#739ed0', center: [0, 1, 11], patch: [4.5, 2.8] },
  { id: 'precentral_gyrus', label: 'Precentral gyrus · frontal lobe', parent: 'frontal_lobe', type: 'gyrus', color: '#6696ce', center: [0, 8, 6], patch: [2.4, 5] },
  { id: 'orbitofrontal_cortex', label: 'Orbitofrontal cortex · frontal lobe', parent: 'frontal_lobe', type: 'gyrus', color: '#9ab9d8', center: [0, -2, 14], patch: [4.8, 3] },
  { id: 'postcentral_gyrus', label: 'Postcentral gyrus · parietal lobe', parent: 'parietal_lobe', type: 'gyrus', color: '#a6b6e0', center: [0, 7, 1], patch: [2.2, 5] },
  { id: 'superior_parietal_lobule', label: 'Superior parietal lobule', parent: 'parietal_lobe', type: 'gyrus', color: '#adb9e4', center: [0, 12, -7], patch: [4.4, 4] },
  { id: 'inferior_parietal_lobule', label: 'Inferior parietal lobule', parent: 'parietal_lobe', type: 'gyrus', color: '#9aa9db', center: [0, 4, -4], patch: [5.4, 3.7] },
  { id: 'supramarginal_gyrus', label: 'Supramarginal gyrus · parietal lobe', parent: 'parietal_lobe', type: 'gyrus', color: '#b4bde9', center: [0, 2, 0], patch: [3.1, 2.7] },
  { id: 'angular_gyrus', label: 'Angular gyrus · parietal lobe', parent: 'parietal_lobe', type: 'gyrus', color: '#a2afe0', center: [0, 4, -9], patch: [3.5, 2.8] },
  { id: 'precuneus', label: 'Precuneus · medial parietal lobe', parent: 'parietal_lobe', type: 'gyrus', color: '#b4b8e4', center: [0, 13, -12], patch: [3.1, 3.5], medial: true },
  { id: 'superior_temporal_gyrus', label: 'Superior temporal gyrus · temporal lobe', parent: 'temporal_lobe', type: 'gyrus', color: '#e2b27f', center: [0, -3, 2], patch: [5.4, 2.4] },
  { id: 'middle_temporal_gyrus', label: 'Middle temporal gyrus · temporal lobe', parent: 'temporal_lobe', type: 'gyrus', color: '#dba577', center: [0, -8, -1], patch: [5.5, 2.5] },
  { id: 'inferior_temporal_gyrus', label: 'Inferior temporal gyrus · temporal lobe', parent: 'temporal_lobe', type: 'gyrus', color: '#d49a72', center: [0, -12, -4], patch: [4.7, 2.2] },
  { id: 'fusiform_gyrus', label: 'Fusiform gyrus · ventral temporal lobe', parent: 'temporal_lobe', type: 'gyrus', color: '#c98686', center: [0, -13, -9], patch: [4.4, 2.4] },
  { id: 'parahippocampal_gyrus', label: 'Parahippocampal gyrus · medial temporal lobe', parent: 'temporal_lobe', type: 'gyrus', color: '#c997a4', center: [0, -10, 1], patch: [4.3, 2.2], medial: true },
  { id: 'entorhinal_cortex', label: 'Entorhinal cortex · medial temporal lobe', parent: 'temporal_lobe', type: 'gyrus', color: '#bc8e9d', center: [0, -8, 4], patch: [2.5, 1.8], medial: true },
  { id: 'cuneus', label: 'Cuneus · occipital lobe', parent: 'occipital_lobe', type: 'gyrus', color: '#c0a0e2', center: [0, 10, -20], patch: [3.8, 2.7], medial: true },
  { id: 'lingual_gyrus', label: 'Lingual gyrus · occipital lobe', parent: 'occipital_lobe', type: 'gyrus', color: '#b391d4', center: [0, 0, -20], patch: [4.1, 2.8], medial: true },
  { id: 'lateral_occipital_cortex', label: 'Lateral occipital cortex', parent: 'occipital_lobe', type: 'gyrus', color: '#c7a6df', center: [0, 5, -17], patch: [5.1, 3] },
  { id: 'pericalcarine_cortex', label: 'Pericalcarine cortex · occipital lobe', parent: 'occipital_lobe', type: 'gyrus', color: '#b99bd6', center: [0, 5, -22], patch: [3.8, 2], medial: true },
];

const validAreas = new Set(REGIONS.map(region => region.id));

// Provisional display fallback for the original local starter Maps only.
const LEGACY_LOCAL_MAPS = {
  frontal_lobe: `avfin10003 avpbt10001 avpps10002 bdvel10020 deriv61651 heads10032 hmotn33667 hndsp10019 lfoot10029 lhfor10022 lhhan10023 lhupa10021 lshin10028 lshld10034 lthig10027 neckk10031 plann48454 rfoot10026 rhfor10012 rhhan10013 rhind10015 rhmid10016 rhpin10018 rhrin10017 rhthu10014 rhupa10011 rshin10025 rshld10033 rthig10024 spine10030 wlkdr12005 wlkmg12008 wlkpt12006 wlksp12004 wlkvf12002 wlkvl12007 wlkvt12003`,
  parietal_lobe: `avnrd10005 ebkjl36874 erebj38679 erwjk17987 fbjhk43987 fknju29878 handw10008 movwd10007 rehiu23687 renkj31298 walkw12001 wdbjh39873 whiuo12343`,
  auditory_cortex: `avpit10004 qwero23876`,
  limbic_system: `bwuey18769 dnskj38769 ebwjh19276 fnkjl14652 hwoei47398 rbehh26873 weoij46873 weoij46875`,
  unassigned: `debjh32368 vweyi23874 werbj23687 wrkjn23468`,
};
const legacyAssignments = new Map(Object.entries(LEGACY_LOCAL_MAPS)
  .flatMap(([area, ids]) => ids.trim().split(/\s+/).map(id => [id, area])));

export function classifyMap(id, data, isLocal) {
  if (typeof data?.brain_area === 'string' && validAreas.has(data.brain_area)) return data.brain_area;
  if (isLocal && legacyAssignments.has(id)) return legacyAssignments.get(id);

  // Legacy association paths provide only a weak functional hint. A single
  // recognized path maps to its broad area; mixed/unknown paths stay unassigned.
  const associations = JSON.stringify(data?.associations ?? '');
  const matches = [...associations.matchAll(/central_nervous_system\.(frontal_lobe|parietal_lobe|occipital_lobe|auditory_area|emotional_area|cerebellum)\./g)];
  const areaForPath = {
    auditory_area: 'auditory_cortex',
    emotional_area: 'limbic_system',
  };
  const found = new Set(matches.map(match => areaForPath[match[1]] || match[1]));
  return found.size === 1 ? [...found][0] : 'unassigned';
}

function hash(value) {
  let result = 2166136261;
  for (let i = 0; i < value.length; i++) result = Math.imul(result ^ value.charCodeAt(i), 16777619);
  result ^= result >>> 16;
  result = Math.imul(result, 0x7feb352d);
  result ^= result >>> 15;
  result = Math.imul(result, 0x846ca68b);
  result ^= result >>> 16;
  return (result >>> 0) / 4294967296;
}

export function positionMap(id, areaId, distribution = {}) {
  const region = REGIONS.find(item => item.id === areaId) || REGIONS.find(item => item.id === 'unassigned');
  const sample = key => hash(`${id}:${key}`);
  if (region.type === 'gyrus') {
    const count = Math.max(1, distribution.count || 1);
    const index = Math.max(0, distribution.index || 0);
    const side = region.medial ? (sample('side') < 0.5 ? -1 : 1) : (index % 2 ? 1 : -1);
    const center = [...region.center];
    center[0] = side * (region.medial ? 3.2 : 12.5 + 2.2 * sample('lateral-offset'));
    const radial = Math.sqrt((index + 0.5) / count);
    const angle = index * Math.PI * (3 - Math.sqrt(5)) + sample('angle-offset') * 0.12;
    const normal = [center[0] / 18, (center[1] + 1) / 17, center[2] / 23];
    const normalLength = Math.hypot(...normal) || 1;
    for (let axis = 0; axis < 3; axis++) normal[axis] /= normalLength;
    const reference = Math.abs(normal[1]) > 0.92 ? [1, 0, 0] : [0, 1, 0];
    let tangentA = [normal[1] * reference[2] - normal[2] * reference[1], normal[2] * reference[0] - normal[0] * reference[2], normal[0] * reference[1] - normal[1] * reference[0]];
    const tangentLength = Math.hypot(...tangentA) || 1;
    tangentA = tangentA.map(value => value / tangentLength);
    const tangentB = [normal[1] * tangentA[2] - normal[2] * tangentA[1], normal[2] * tangentA[0] - normal[0] * tangentA[2], normal[0] * tangentA[1] - normal[1] * tangentA[0]];
    const u = Math.cos(angle) * radial * region.patch[0];
    const v = Math.sin(angle) * radial * region.patch[1];
    const fold = 0.18 * Math.sin(u * 1.7 + v * 0.7) * Math.cos(v * 1.9);
    return center.map((value, axis) => value + tangentA[axis] * u + tangentB[axis] * v + normal[axis] * fold);
  }
  const count = Math.max(1, distribution.count || 1);
  const index = Math.max(0, distribution.index || 0);
  const vertical = 1 - 2 * (index + 0.5) / count;
  const polar = Math.acos(Math.max(-1, Math.min(1, vertical)));
  const azimuth = index * Math.PI * (3 - Math.sqrt(5)) + sample('angle-offset') * 0.12;
  const radius = Math.cbrt((index + 0.5) / count);
  const direction = [Math.sin(polar) * Math.cos(azimuth), Math.cos(polar), Math.sin(polar) * Math.sin(azimuth)];
  return region.center.map((center, axis) => center + region.radii[axis] * radius * direction[axis]);
}

export function neighborhood(id, links, depth) {
  const adjacent = new Map();
  const endpoint = value => typeof value === 'object' && value !== null ? value.id : value;
  for (const link of links) {
    const a = endpoint(link.source), b = endpoint(link.target);
    if (typeof a !== 'string' || typeof b !== 'string') continue;
    if (!adjacent.has(a)) adjacent.set(a, new Set());
    if (!adjacent.has(b)) adjacent.set(b, new Set());
    adjacent.get(a).add(b); adjacent.get(b).add(a);
  }
  const visited = new Set([id]);
  let frontier = [id];
  for (let step = 0; frontier.length && (depth == null || step < depth); step++) {
    const next = [];
    for (const node of frontier) for (const neighbor of adjacent.get(node) || []) {
      if (!visited.has(neighbor)) { visited.add(neighbor); next.push(neighbor); }
    }
    frontier = next;
  }
  return visited;
}