# ASNB Studio

A browser game editor and multiplayer player built with Three.js, cannon-es, Node, Supabase and OpenAI.

## Run

Node 22.12+ recommended.

```sh
npm install
npm run build
NODE_ENV=production PORT=4000 npm start
```

For development: `PORT=4000 npm run dev`. Open http://localhost:4000. `.env.local` is ignored by Git. AI requires `OPENAI_API_KEY`; `OPENAI_MODEL` defaults to `gpt-4.1-mini`. A remote AI endpoint also requires `ASNB_ACCESS_TOKEN` (enter it in Assistant → Server access). No key is included in this repository.

Keep the Node process running. A static `dist` upload alone cannot run AI or authoritative multiplayer. HTTPS reverse proxies/tunnels must forward WebSocket upgrades on `/session` to the **same Node port** as the website. All active rooms currently live in that one Node process; don't round-robin players across independent replicas.

## Create, publish and play

- Select, move, rotate, scale, group, duplicate and delete objects. Explorer and Properties operate on the same scene. Undo/redo covers scene edits.
- Assistant supports Auto, Replace and Edit. Replacement receives no starter geometry. Edits keep the current scene and selected context. Unsupported assets are never fabricated.
- Templates include Physics Playground, Sky Sprint and Citadel Treasure Crew. Their gameplay supports cooperative collecting, races and interactive physics props.
- Sign in to publish an immutable snapshot. `/games` lists separate published games. Every `/play/<slug>?room=<name>` has its **own** players, physics, interactions, collectibles and scores. Use Room → New room, or share the current URL to join friends. Rooms are public to anyone with the link, not access-controlled invite rooms.
- Third-person is the default. Use **C** or the camera selector for first-person, third-person and top-down views. WASD/arrows move, Space jumps, E interacts. Touch movement and interaction buttons are included.

## Authoritative multiplayer

The Node server loads published projects from Supabase using a publishable key, then runs cannon-es at 60Hz and sends snapshots at 20Hz. Clients send inputs and interaction requests, not accepted positions, scores or object state. The server assigns guest session ids, bounds inputs, validates proximity/cooldowns, computes collisions, and resolves shared collectibles once. New arrivals receive the current room state. Disconnects clean up player bodies; empty rooms expire after ten minutes. Restarting the server resets rooms.

Rooms are capped at 20 players. The process has room/connection caps, payload limits, message-rate limits and heartbeats; these are resource guards, not a tested capacity promise. Player interpolation is included; client prediction/reconciliation, lag compensation, identity-bound competitive profiles and horizontal room scheduling remain future work.

Local playtests use the same physics simulation in the browser. Local playtests don't join published rooms. Movement is authoritative in published sessions; scripts cannot set authoritative transforms. Local scripts may still change presentation. Door movement, visibility, light state and audio play/pause are shared through validated interaction components. Audio play/pause is shared, not sample-accurate timeline synchronization; browser user-gesture rules still apply.

## Models and scene hierarchy

Use **Import GLB** to upload a self-contained glTF 2.0 binary file (sign-in required, max 20MB). Embedded geometry/materials/textures are supported by GLTFLoader; externally referenced resources are rejected. Models needing Draco, KTX2 or other unconfigured decoders may fail. Imported models are rendered as one editor asset; internal nodes retain their render hierarchy but aren't individually editable in Explorer. Uploaded files are public assets.

Objects can have `parentId`, with **local** position/rotation/size relative to their parent. Group makes a root container; Parent in Properties reparents while preserving world pose. Nesting is limited to 16 levels, cycles and missing references are rejected. Deleting a container deletes its descendants. Duplicate preserves internal references.

Solid primitive boxes, spheres and cylinders have physics colliders. Imported solid models use box proxies; arbitrary triangle-mesh collision, rigged character animation, vehicles and joints are not implemented. Dynamic mass is configurable in Properties. Dynamic objects cannot be parents of child scene objects; use one rigid model or static groups.

## Audio and scripts

Properties supports MP3 upload (10MB), HTTPS audio URLs, volume, looping, spatial attenuation and interaction targets. Audio and model uploads use creator-owned Storage paths with immutable uploads. Assets are publicly readable by URL. Per-user storage quotas, cleanup tools, private asset sharing and general texture/animation asset management remain future work.

Script saves project JavaScript and runs it in a dedicated worker inside an opaque sandbox iframe. Allowed API: `color(id,hex)`, `position(id,x,y,z)`, `visible(id,bool)`, `audio(id)`, `onUpdate(fn)` and `onInteract(id,fn)`. Commands are bounded and a heartbeat watchdog terminates stalled workers. Public sessions ignore script position/visibility commands to preserve the server simulation. Creator scripts never execute in the Node process or authorize transactions. Authoritative server scripting isn't implemented.

## Supabase configuration

Public defaults point to `asnb.engine`. Override browser settings with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` at build time; override Node reads with `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. Never put secret/service-role keys in the frontend.

`supabase/schema.sql` records the game table and ownership policies. `supabase/realtime-assets.sql` records Storage policies and the earlier Supabase Realtime co-presence policies; authoritative game simulation now uses Node WebSockets, while Supabase remains responsible for Auth, publishing and asset storage. Old version 1 JSON projects remain compatible.

## Verification

```sh
npm test
npm run build
```

Tests cover physics, input bounds, duplicate collectible prevention, interaction distance, late-join world state, game/room isolation over real WebSockets, hierarchy validation, project round-tripping and actual GLTF parsing. Live smoke checks also exercise Supabase project loading into the real game server. Browser camera feel, audio playback, asset uploads and visual transform workflows still require device QA; no browser performance/load-test claim is made.

### Chat and laser tag
Published rooms now relay chat only to currently connected room members. The server does not keep a transcript, persist messages, or replay chat to late joiners. Each tab caches its last 100 messages in sessionStorage (survives refresh; normally cleared when the tab session ends). Clear cache removes that tab's copy. Delivery is best effort: disconnected players miss messages. This is not end-to-end encrypted and clearing one copy does not erase recipients' copies.

Players have articulated arms and legs with procedural walking animation. Select **Templates → Neon laser tag** for a shooter: mouse aim, click/F/FIRE to shoot, C to change camera. Health, fire cooldown, cover raycasts, tags, respawns and practice-target resets run in the authoritative simulation. Four hits tag a player; respawns have two seconds of protection. Practice targets reset after three seconds. Shooter is an initial free-for-all sandbox, with no round timer, teams, reload system or lag compensation yet. Top-down aiming is not enabled.

Validation: automated WebSocket room chat isolation/identity/no snapshot history, raycast cover/fire cadence/health/respawn, template/practice-target and avatar articulation tests. Visual gameplay and mobile QA remain pending.

### Safety, avatars and surfaces
Chat now uses a server-enforced list of approved phrases. Arbitrary text, personal contact details and altered phrases are rejected rather than relying on an incomplete profanity list. Older cached free-text messages are hidden. Mute persists for this tab/room; Unmute all restores visibility. Report sends reporter/target guest IDs, room and a fixed reason to the operator's server log, limited to once per ten seconds. Reports contain no message body. There is no moderation dashboard, account ban system, or human moderation service yet. Guest IDs change on reconnect; mute/report is not a durable identity system. Safe chat limits text exposure; it cannot prevent all abusive gameplay.

The Avatar button saves shirt, trousers, skin, hair colour/style and a cap on this device. Appearance is validated on the server and shared with room members. Walking uses distance-driven steps with blended speed, opposite arm/leg swing and teleport reset. Shift sprints at a server-controlled speed. These are procedural block characters, not motion-captured rigs.

Surface properties expose roughness, metalness and emissive colour/intensity. Workspace exposes exposure, fog start/end, sun colour and sun position. Reflection lighting uses a generated studio environment; imported GLB materials retain their own surfaces. All settings save/export/publish with the scene and have bounded validation. These upgrades do not add photoreal assets, skeletal animation import, terrain streaming, ray tracing or a complete AAA rendering pipeline. Browser visual QA is still pending.

### Willowbrook town benchmark
Choose **Templates → Willowbrook town**. The benchmark includes connected roads, pavement, pedestrian markings, four building exteriors, street lamps, benches, planters, trees, procedural brick/grass/asphalt surfaces, a cloud sky, two cars and a four-stamp tour objective. Collect all four stamps and return to the green finish plaza. Buildings are currently exterior shells.

**On foot:** WASD/arrows move, Shift sprints, Space jumps; characters automatically step over low kerbs. Character facing follows travel direction, limbs use distance-driven strides, knees/elbows articulate, feet have shoes, idle breathing and an airborne pose are procedural. A dedicated character contact material avoids ground friction dragging walking speed below its intended value.

**Driving:** approach an unoccupied car and press E. WASD/arrows steer and accelerate/reverse, Space brakes, E exits once slow enough and an adjacent position is clear, R recovers a stopped car. Cars use cannon-es RaycastVehicle with four-wheel suspension, engine force, steering smoothing, braking and server-validated exclusive seats. Driver disconnect releases the seat and parks the car. Vehicle chassis/wheels and occupancy are shared in room snapshots; remote dynamic transforms interpolate. Controls stop accelerating after stale input. Third-person chase camera automatically follows heading after manual look stops. Wheel visuals, windows, roof, headlights and brake lights are procedural.

Movement/engine effects are synthesised locally with no music or external assets. Effects can be muted using the header button. Browser user-gesture audio rules apply. This remains an initial small-town benchmark, not photorealism: no interiors, traffic AI, pedestrians, automotive drivetrain or network prediction/rollback. Town, vehicle ownership, driving/braking/exiting, stale input, kerb stepping and two-client shared vehicle snapshots have automated coverage. Browser/device camera, audio and visual playtesting remains pending.

Vehicle components require a root solid box without authored children; decorative car parts are created by the renderer. The schema carries bounded mass, maxSpeed and engineForce values. Vehicles can be created by AI using the same supported component. Texture/material/environment settings survive save/export/publish.

## Creator foundations release

The primary editor now has **Build / Gameplay / Look / Test / Project** workspaces. Start with **Build → Templates → Creator Foundations Lab**, or use **Project → New baseplate** and insert a floor from the catalogue. No JSON is needed for the basic authoring flow.

| Area | Usable foundation | Current boundary |
| --- | --- | --- |
| Editor | Catalogue, move/rotate/scale, world/local transform space, root-object alignment, lock/hide, tags, collapsible Explorer, drag reparenting | No arbitrary docking/layout system |
| Geometry | Static, root, unrotated box subtraction | No general mesh CSG |
| Terrain | Seeded stepped terrain tiles, raising/lowering selected tiles, grass surface | No smooth sculpting or heightmap import |
| Assets | Searchable built-in catalogue, device-local reusable model shelf, existing public GLB/audio imports | No public asset marketplace or package update tracking |
| Appearance | Existing PBR-style surface controls, day/sunset/night presets, simple particle emitter | No advanced post-processing editor |
| Characters | Rigged procedural avatar, editable NPC speed and straight-segment waypoints | No obstacle pathfinding or full character authoring |
| Animation | GLB embedded clips, clip name, speed and loop settings | No timeline, animation graph, or IK authoring |
| Physics | Distance, spring, hinge and rigid-lock links; spring demonstration prefab | Links are authored at object centres; no pivot/axis editor yet |
| Gameplay | Interact/touch/timer rules with move, visibility, light, audio, score, respawn, finish and points-purchase actions | A bounded declarative rule system, not arbitrary server JavaScript |
| UI | Labels, score, health, inventory totals and interaction buttons at screen percentages | Form-based authoring, not a full visual layout editor |
| Audio | Existing upload, spatial playback, loop and volume controls plus speaker prefab | No mixer graph or voice chat |
| Multiplayer | Existing authoritative rooms; rules, physics links, NPCs, inventory and vehicles share simulation state | No matchmaking; recurring object updates use distance-based interest, while initial geometry loads in full |
| Persistence | Device profile token restores score, checkpoint and inventory from local server storage | Not linked to creator accounts; world changes still reset with rooms/server |
| Testing | Scene warnings, FPS/draw calls/triangles, local two-player test bot, phone/tablet viewport previews and movement latency simulation | DOM tests cover tools; graphics/device gameplay QA still pending |
| Diagnostics | Captured runtime/script messages, basic local editor action count; api.log() in local script sandbox | No stepping debugger or production analytics service |
| Projects | Automatic/manual local recovery, cloud drafts, last 20 cloud revisions and optimistic save conflict checks | Not simultaneous live scene merging |
| Sharing | Owner/editor/viewer access by account UUID; owner-only permission changes | No email invitations or live cursors |
| AI/extensions | Generation schema supports new scene components; trusted bundled extension registry | No downloaded third-party plugin code or public MCP endpoint |
| Platform | Published gallery/links, existing safe chat/reporting, local point purchases/inventory, HUD translations | No real-money payments, asset moderation service or automatic translation |

### Rules
Open **Gameplay → Rules**. Choose a source object, event, target and action. Interact rules attach an E prompt; touch rules compare player overlap; timers repeat with a minimum one-second cooldown. `once` is per player for player-triggered rules and per world for timers. Timer rules have no player and cannot award points, purchase inventory, respawn or finish a player. Purchase actions spend the player's score and add the target object ID to inventory; they do not transfer real money. Rules are evaluated by the simulation in local tests and by Node in published rooms. Client packets cannot submit arbitrary actions.

### Cloud drafts
Use the existing account button to sign in, then **Project → Cloud projects**. Save a new draft or open one you can access. Save updates only the revision you opened, so stale edits are rejected. Check for changes/reopen to load a newer draft; save as new to keep your conflicting work. Version restore changes your local scene; save again to record a new cloud revision. Share by the collaborator's account UUID, which they can obtain with **Show my account ID**. No invitation messages are sent. Viewers can open drafts but cannot save them; editors cannot change access. Cloud draft sharing does not change published-game visibility.

The deployed schema is recorded in `supabase/projects.sql`; role/trigger tests are in `supabase/tests/asnb_projects_rls.sql`. These tests were run against the selected `asnb.engine` project and rolled back all fixture users/data.

### Device player data
The Node process uses `ASNB_DATA_DIR` (default `.asnb-data`) for signed device profile tokens and saved data. The browser stores its game-specific token locally and presents it on reconnect. The server periodically saves the current score/checkpoint/inventory and saves again on disconnect. Keep this directory persistent and backed up. Clearing browser storage loses access to that device profile; deleting the server data directory removes progress. Tokens are bearer credentials for a device profile, not verified Roblox-like accounts. Multiple tabs using one token can overwrite the same profile. Shared collectibles and object changes are room state, separate from individual saved progress. No chat transcripts are written into this store.

### Validation
Automated coverage includes the catalogue-to-rules-to-HUD-to-terrain-to-recovery DOM workflow, each prefab, terrain/CSG geometry, declarative rules, NPC patrols, GLB clip playback, device profile restart/forgery checks, physics and real two-client room/vehicle tests. Cloud role tests cover owner/editor/viewer/outsider access, revision conflicts, protected sharing and forged history rejection. Browser rendering, camera feel, touch controls and audio still require device QA.

The foundation release also passed a live production HTTP generation smoke test after adding hex-colour and transform bounds to the AI output schema. The generated scene passed the same runtime validator used for imported projects.

### Per-item client JavaScript
Select an item and open **Client script** in the inspector. Edit JavaScript, click **Save item script**, then Play. Scripts can be enabled, disabled or removed, and survive project export, cloud saves and publication. AI edits preserve scripts on surviving object IDs.

```js
self.color('#aa77ff');
self.onInteract(() => self.audio());
api.onUpdate(dt => {
  // Update a client effect here. dt is seconds.
});
```

`self` exposes `id`, `name`, `startPosition`, `color(hex)`, `position(x,y,z)`, `visible(bool)`, `audio()` and `onInteract(fn)`. The project API also offers `color(id,hex)`, `position(id,x,y,z)`, `visible(id,bool)`, `audio(id)`, `log(message)`, `onUpdate(fn)` and `onInteract(id,fn)`. Interaction events require the item's interaction component. Scripts are limited to 10,000 characters per item. Stop and Play to restart after editing.

These scripts run together in the existing sandboxed client worker, with a stall watchdog and no network access. They are client effects, not authoritative server JavaScript: published clients cannot move or hide physics objects through this API. Use server rules for shared state. A stalled item can stop the shared worker; independent script isolation, autocomplete and arbitrary server scripting are not implemented yet.
