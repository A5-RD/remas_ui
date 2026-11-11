# Ψ page: Maps and scene workflow

## Maps in Ψ

The right-hand **Maps** panel lists the user's persisted JSON Maps (called
memories by the storage and backend APIs). The name change is a UI label, not a
file or API migration. Each graph point represents a loaded JSON Map, and links
represent Map IDs found in its `associations` only when the target JSON file is
also loaded. References to missing Maps are omitted from the graph. Hovering
over a point shows its top-level `description`, or a clear fallback when one is
unavailable.

Selecting a graph point highlights its connected component. Double-clicking a
Map point opens its JSON editor; it does not load an object into the scene.
The panel also supports searching filenames, adding and removing Maps, and
Shift-clicking a Map to edit its JSON. Editing a Map changes its stored data;
the graph is a visualization, not the simulation itself.

## Brain-region view

Ψ places Map dots deterministically into illustrative 3D volumes selected by
the root-level `brain_area` label. The available labels and volume coordinates
are documented in the REMAS repository's [BRAIN_AREAS.md](../REMAS/BRAIN_AREAS.md).
Region boundaries are invisible; hovering shows the description and area
label. This is **not an anatomical atlas**: positions are visualization
coordinates, not measured locations or claims that a Map belongs exclusively
to a brain structure.

Every persisted Map has a root-level `brain_area` label. The UI uses a valid
stored label first; older Maps without one can use the provisional local
registry or association-based fallback. New ambiguous Maps are shown as
`unassigned`. The sample-only repository at
`REMAS_local_dev/fake_memories/` contains clearly synthetic Maps for all labels.
Assignments control display placement only and do not affect Map traversal or
simulation.

Use **Show connections** in the right panel to hide or show all graph lines. Right-click a Map and
choose **Show Neighbors**: a positive depth displays edges among nodes up to
that many association hops from the chosen Map. A blank depth shows all edges,
including other components. **Show All** clears the neighbor filter and turns
connections back on. Connection controls do not change the stored Maps.

## Objects and play

The **Objects** panel lists available Blender files. Double-click an entry to
highlight it for actions such as deletion; double-click it again to deselect
it. A single click does not select or load an object, and double-clicking does
not load it into Σ. There is no Objects-panel play button. The main simulation
Play button starts a render using a memory snapshot and scene configuration.

Currently Σ normalizes each loaded model independently to a largest dimension
of 3, centers it horizontally, and places its lowest point on the grid. It
publishes those preview transforms for the simulation, where matching Σ
transforms can override scene-configuration transforms. This is a preview
heuristic, **not** reliable real-world scaling or initial placement for a
multi-object scene. The simulation also uses a saved or uploaded ZIP snapshot,
not necessarily the current Maps shown in Ψ.

## Intended scene playback

- An explicit Play action should construct the scene rather than relying on a
  double-click or independently normalized preview objects.
- The scene configuration should identify the starting Map and required
  objects, with explicit scale, initial position, rotation, visibility, units,
  and coordinate conventions. Preserve relationships between objects (for
  example, an avatar, bench, and piano) rather than scaling each one to fit.
- Apply the same authoritative initial transforms in preview and render, and
  define clearly when user adjustments override the configuration. Validate
  missing Maps, objects, and unsupported transforms before starting playback.
- Resolve the starting Map and its associations from the chosen snapshot;
  document which snapshot is being used and refresh Ψ when the underlying Map
  set changes. Map traversal and simulation behavior remain backend concerns.

These are design requirements, not a claim that synchronized physical scaling,
scene placement, or automatic Map-driven object loading is implemented today.