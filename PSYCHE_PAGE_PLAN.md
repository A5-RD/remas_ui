# Ψ page: Maps and scene workflow

## Maps in Ψ

The right-hand **Maps** panel lists the user's persisted JSON Maps (called
memories by the storage and backend APIs). The name change is a UI label, not a
file or API migration. Each graph point represents a Map, and links represent
Map IDs found in its `associations`. References to missing Maps appear as
placeholder points; they do not supply Map data. Hovering over a point shows
its top-level `description`, or a clear fallback when one is unavailable.

Selecting a graph point highlights its connected component. Double-clicking a
Map point opens its JSON editor; it does not load an object into the scene.
The panel also supports searching filenames, adding and removing Maps, and
Shift-clicking a Map to edit its JSON. Editing a Map changes its stored data;
the graph is a visualization, not the simulation itself.

## Brain-region view

Ψ places Maps deterministically inside illustrative, color-coded region
boundaries. Hovering shows both the Map description and its region. The
boundaries are conceptual ellipsoids, **not an anatomical atlas**; positions
do not imply measured locations or that a Map is exclusively stored in one
brain structure. Region names refer to functional folders in the REMAS central
nervous system, not a medical classification.

The local initial set has a reviewed, provisional filename-to-region registry
in [brain-regions.js](brain-regions.js). Four mixed or ambiguous Maps are
explicitly unassigned, and missing association targets also appear in the
unassigned area. The registry does not modify Map JSON: the persisted Map
schema does not support a reliable extra label field, and other serializers may
discard it. Review these annotations when a Map's contents change. Local
filename labels are never applied to cloud users, whose files could reuse IDs;
new or cloud Maps are assigned only when an association explicitly references
a single supported region, otherwise they remain unassigned. Assignments are
display-only and do not affect Map traversal or simulation.

Use **Show connections** to hide or show all graph lines. Right-click a Map and
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