// Experimental conversion of Blender pose-local tracks to a loaded glTF rig.
// This is an axis approximation, not a rig retargeter.
export function createLivePreview(THREE, getModels, report) {
  let active = null;
  const axis = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
  const axisInverse = axis.clone().invert();

  function stop() {
    if (!active) return;
    for (const [bone, rest] of active.rest) {
      bone.position.copy(rest.position);
      bone.quaternion.copy(rest.quaternion);
    }
    active = null;
  }

  function start(payload, requestId, confirmed) {
    stop();
    if (confirmed !== true) throw new Error('Experimental axis mapping was not confirmed.');
    const plan = payload?.plan;
    if (payload?.version !== 1 || !plan || !Number.isInteger(plan.frame_start) ||
        !Number.isInteger(plan.frame_end) || plan.frame_start < 1 || plan.frame_end < plan.frame_start ||
        !Number.isInteger(plan.fps) || plan.fps < 12 || plan.fps > 60 || !Array.isArray(plan.bone_motions)) {
      throw new Error('Invalid or unsupported live plan.');
    }
    const rigs = [];
    for (const [filename, object] of getModels()) {
      if (!/\.(glb|gltf)$/i.test(filename)) continue;
      const bones = new Map();
      object.traverse((node) => {
        if (!node.isBone) return;
        if (!bones.has(node.name)) bones.set(node.name, []);
        bones.get(node.name).push(node);
      });
      if (bones.size) rigs.push({ filename, object, bones });
    }
    if (!rigs.length) throw new Error('No rigged GLB or glTF is loaded in Sigma. Load a compatible avatar first.');
    if (rigs.length !== 1) throw new Error('Multiple rigged models are loaded. Remove all but the intended rig before previewing.');
    const rig = rigs[0];
    const rest = new Map();
    const tracks = [];
    const missing = [];
    const used = new Map();
    for (const motion of plan.bone_motions) {
      if (!motion || !['rotation_euler', 'location'].includes(motion.property) ||
          !Array.isArray(motion.aliases) || !motion.aliases.length ||
          motion.aliases.some((alias) => typeof alias !== 'string' || !alias) ||
          !Array.isArray(motion.keyframes) || !motion.keyframes.length) {
        throw new Error('Invalid or unsupported bone track.');
      }
      const keys = motion.keyframes.map((key) => {
        if (!key || !Number.isInteger(key.frame) || key.frame < plan.frame_start || key.frame > plan.frame_end ||
            !Array.isArray(key.value) || key.value.length !== 3 || !key.value.every(Number.isFinite)) {
          throw new Error('Invalid bone keyframe.');
        }
        return { frame: key.frame, value: key.value.slice() };
      }).sort((a, b) => a.frame - b.frame);
      if (keys.some((key, index) => index > 0 && key.frame === keys[index - 1].frame)) {
        throw new Error('A bone track contains duplicate keyframes.');
      }
      let bone = null;
      for (const alias of motion.aliases) {
        const matches = rig.bones.get(alias);
        if (!matches) continue;
        if (matches.length !== 1) throw new Error(`Ambiguous bone name: ${alias}`);
        bone = matches[0];
        break;
      }
      if (!bone) {
        missing.push(motion.aliases.join(' / '));
        continue;
      }
      if (!rest.has(bone)) rest.set(bone, { position: bone.position.clone(), quaternion: bone.quaternion.clone() });
      if (!used.has(bone)) used.set(bone, new Set());
      if (used.get(bone).has(motion.property)) throw new Error(`Duplicate ${motion.property} track for ${bone.name}.`);
      used.get(bone).add(motion.property);
      tracks.push({ bone, property: motion.property, keys });
    }
    if (!tracks.length) throw new Error(`No bone tracks matched ${rig.filename}.${missing.length ? ` Missing: ${missing.join('; ')}` : ''}`);
    const notes = `Rig: ${rig.filename}. ${tracks.length} track(s). Approximate axes/rest pose; root motion is not applied.${missing.length ? ` Missing bones: ${missing.join('; ')}.` : ''}`;
    active = { requestId, rig: rig.object, rest, tracks, plan, notes, startedAt: performance.now(), ended: false };
    report(requestId, 'info', `Experimental preview playing once. ${notes}`);
  }

  function sample(keys, frame) {
    if (frame <= keys[0].frame) return keys[0].value;
    const last = keys[keys.length - 1];
    if (frame >= last.frame) return last.value;
    let low = 0;
    let high = keys.length - 1;
    while (high - low > 1) {
      const mid = Math.floor((low + high) / 2);
      if (keys[mid].frame <= frame) low = mid;
      else high = mid;
    }
    const a = keys[low], b = keys[high];
    const t = (frame - a.frame) / (b.frame - a.frame);
    return a.value.map((value, i) => value + (b.value[i] - value) * t);
  }

  function update(now) {
    if (!active || active.ended) return;
    const { plan, rest, tracks } = active;
    const frame = Math.min(plan.frame_end, plan.frame_start + Math.max(0, now - active.startedAt) * plan.fps / 1000);
    for (const track of tracks) {
      const value = sample(track.keys, frame);
      const original = rest.get(track.bone);
      if (track.property === 'location') {
        track.bone.position.copy(original.position).add(new THREE.Vector3(value[0], value[2], -value[1]));
      } else {
        const delta = new THREE.Quaternion().setFromEuler(new THREE.Euler(...value, 'XYZ'));
        delta.premultiply(axis).multiply(axisInverse);
        track.bone.quaternion.copy(original.quaternion).multiply(delta);
      }
    }
    if (frame >= plan.frame_end) {
      active.ended = true;
      report(active.requestId, 'info', `Preview ended and is frozen. Stop restores the original pose. ${active.notes}`);
    }
  }

  function modelRemoved(object) {
    if (!active || active.rig !== object) return;
    const requestId = active.requestId;
    stop();
    report(requestId, 'error', 'The preview rig was removed; its original pose was restored.');
  }

  return { start, stop, update, modelRemoved };
}
