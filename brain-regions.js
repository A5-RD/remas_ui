// Visualization annotations, not persisted Map fields or anatomical claims.
// Positions are illustrative volumes in graph units; they are not MRI coordinates.
export const REGIONS = [
  { id: 'frontal_lobe', label: 'Frontal lobe · motor and planning', color: '#78aee8', center: [0, 5, 15], radii: [19, 13, 12] },
  { id: 'parietal_lobe', label: 'Parietal lobe · spatial and language', color: '#aab4ee', center: [0, 13, -2], radii: [18, 11, 12] },
  { id: 'occipital_lobe', label: 'Occipital lobe · visual', color: '#c29ee0', center: [0, 3, -18], radii: [16, 11, 9] },
  { id: 'auditory_area', label: 'Auditory area · sound', color: '#e6b07f', center: [-13, -7, -3], radii: [8, 8, 13] },
  { id: 'emotional_area', label: 'Emotional area · affect', color: '#e4a6b0', center: [0, -4, 1], radii: [9, 7, 9] },
  { id: 'cerebellum', label: 'Cerebellum', color: '#9dcbb5', center: [0, -13, -17], radii: [13, 7, 8] },
  { id: 'unknown', label: 'Unassigned / mixed', color: '#9ca7b0', center: [39, -5, 0], radii: [7, 8, 8] },
];

// Annotations for the local initial data set, grouped by the closest project
// function. File IDs alone are not unique across cloud users, so these labels
// are deliberately never applied to deployed users by filename.
const LOCAL_MAPS = {
  frontal_lobe: `avfin10003 avpbt10001 avpps10002 bdvel10020 deriv61651 heads10032 hmotn33667 hndsp10019 lfoot10029 lhfor10022 lhhan10023 lhupa10021 lshin10028 lshld10034 lthig10027 neckk10031 plann48454 rfoot10026 rhfor10012 rhhan10013 rhind10015 rhmid10016 rhpin10018 rhrin10017 rhthu10014 rhupa10011 rshin10025 rshld10033 rthig10024 spine10030 wlkdr12005 wlkmg12008 wlkpt12006 wlksp12004 wlkvf12002 wlkvl12007 wlkvt12003`,
  parietal_lobe: `avnrd10005 ebkjl36874 erebj38679 erwjk17987 fbjhk43987 fknju29878 handw10008 movwd10007 rehiu23687 renkj31298 walkw12001 wdbjh39873 whiuo12343`,
  auditory_area: `avpit10004 qwero23876`,
  emotional_area: `bwuey18769 dnskj38769 ebwjh19276 fnkjl14652 hwoei47398 rbehh26873 weoij46873 weoij46875`,
  unknown: `debjh32368 vweyi23874 werbj23687 wrkjn23468`,
};
const localAssignments = new Map(Object.entries(LOCAL_MAPS).flatMap(([region, ids]) => ids.trim().split(/\s+/).map(id => [id, region])));
const regions = new Map(REGIONS.map(region => [region.id, region]));

export function classifyMap(id, data, isLocal) {
  if (isLocal && localAssignments.has(id)) return localAssignments.get(id);
  // Explicit project callable paths are evidence of a functional association,
  // not proof of anatomical localization. Ambiguous Maps remain unassigned.
  const associations = JSON.stringify(data?.associations ?? '');
  const matches = [...associations.matchAll(/central_nervous_system\.(frontal_lobe|parietal_lobe|occipital_lobe|auditory_area|emotional_area|cerebellum)\./g)];
  const found = new Set(matches.map(match => match[1]));
  return found.size === 1 ? [...found][0] : 'unknown';
}

function hash(value) {
  let result = 2166136261;
  for (let i = 0; i < value.length; i++) result = Math.imul(result ^ value.charCodeAt(i), 16777619);
  return (result >>> 0) / 4294967296;
}

export function positionMap(id, regionId) {
  const region = regions.get(regionId) || regions.get('unknown');
  // Uniform deterministic distribution inside the region ellipsoid. Reordering
  // or adding Maps does not move existing points.
  const angle = hash(`${id}:angle`) * Math.PI * 2;
  const y = 2 * hash(`${id}:axis`) - 1;
  const radial = Math.cbrt(hash(`${id}:radius`)) * 0.9;
  const ring = Math.sqrt(1 - y * y);
  const unit = [ring * Math.cos(angle), y, ring * Math.sin(angle)];
  return region.center.map((center, i) => center + region.radii[i] * radial * unit[i]);
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