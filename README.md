# ASNB Engine — creator MVP

A browser-based 3D world builder using Three.js and server-side OpenAI generation. Describe a world, edit objects, playtest, and export portable JSON projects.

## Run

Node 22.12+ recommended.

```sh
npm install
# Set OPENAI_API_KEY in an ignored .env.local file
npm run dev
```

Open http://localhost:3000. Without a key the editor, starter game, JSON import/export, and JavaScript playtests still work; AI generation reports its configuration error.

```sh
npm test
npm run build
NODE_ENV=production npm start
```

Keep the Node server: serving `dist` alone does not provide `/api/generate`. No deployment is provisioned by this repository.

## MVP features

- AI creates or updates a structured, validated scene through the Responses API. Default model `gpt-4.1-mini`, configurable with `OPENAI_MODEL`.
- First-person playtesting with mouse look, WASD/arrows, jumping, box collisions, checkpoints, collectibles, hazards, and finish triggers.
- Touch movement buttons; editor orbit camera, picking, property editing, add/delete.
- Automatic browser save, JSON editing, import/export, and an included floating-island game.
- Custom JavaScript playtests in a worker inside an opaque sandbox iframe. Only validated position/color messages affect the scene. Network access is blocked by CSP; workers are terminated if they stop responding for two seconds. Project scripts are saved in exports and run in isolated workers with a heartbeat watchdog.

## Scope

This is a single-player prototype, not yet a general-purpose engine or Roblox-compatible runtime. No vehicle simulation, model uploads, authoritative multiplayer simulation, or RBXLX importer. AI produces supported scene data rather than arbitrary gameplay scripts. Collision uses world-axis bounding boxes; curves and sloped surfaces are approximations. The first-person controller is deliberately simple.

For remote AI use, set a strong `ASNB_ACCESS_TOKEN`, bind `HOST` deliberately, and use HTTPS. The editor accepts that token per session. AI access is denied for non-local hostnames without a configured token. A process-wide generation lock bounds concurrency; add durable per-user quotas and authentication before a public launch. Never expose the API key in frontend code.

## Project format

See `src/project.js` for the strict generation schema and runtime validator. Units are arbitrary; Y is up. Spawn is the player's feet position. Each object has an id, name, shape, position, size, hex color, and behaviour. Version 1 accepts up to 200 objects.

## Verification

`npm test` checks project round-tripping and rejects malformed/unsafe data. `npm run build` bundles the browser client. Live API testing requires an account with available quota. Browser playtesting should cover collision, jump reach, pointer lock, touch, triggers, and custom scripts before release.

## Supabase publishing

Connected to the `asnb.engine` project. Public Supabase configuration is in `src/publishing.js` and can be overridden with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` at build time. These are publishable settings, never a service-role credential.

Create an email/password account, confirm your email if prompted, sign in, then press Publish. Each publication creates an immutable public snapshot with a collision-resistant name-based slug, for example `/play/desert-adventure-a1b2c3d4`. My games lists your publications and lets you remove them. Republish to create a fresh link after editing. Saved custom JavaScript is included in published project snapshots.

The Node production server serves deep play links. Other hosts must rewrite `/play/*` to `index.html`. Share links become publicly reachable once the application itself is deployed. Public players do not overwrite the creator's browser draft.

`supabase/schema.sql` records the applied schema. RLS permits public reads of published games and restricts insertion/deletion to the authenticated owner; clients cannot overwrite snapshots. The database restricts project payloads to 300KB. Email/password auth uses the project's existing Supabase Auth configuration.

## Studio editor (0.2)

The interface now uses a compact Studio-style workspace: transform toolbar, collapsible AI assistant, scene Explorer and Properties. Click an object in the viewport or Explorer; Shift/Ctrl/Cmd-click selects multiple objects. Move/rotate/scale handles apply to the selection. Q selects, W moves, E rotates, R scales, F frames the selection. Ctrl/Cmd A selects all objects, Ctrl/Cmd D duplicates, Delete removes, Ctrl/Cmd Z undoes and Ctrl/Cmd Shift Z redoes. Snap uses 1-unit movement, 15-degree rotation and 0.25-unit scaling.

Workspace properties edit the project name, sky colour and player spawn. Lighting properties edit sun and ambient intensity. Spawn is selectable and movable. Objects expose position, rotation in degrees, size, colour, shape and gameplay behaviour. Old version 1 project files remain supported; missing rotation defaults to zero.

AI mode defaults to Auto: a first structured request classifies the instruction as a new world or an edit. Replacement generation receives no previous geometry; edits receive the current scene and selected object ids. Creators can explicitly choose Replace world or Edit world. Builds, imports and starter resets are undoable. If the scene changes while AI is generating, the stale result is rejected.

Play mode uses world-axis bounding-box collisions for all solid shapes, including rotated objects; sloped surfaces are approximations, not true ramp physics. Saved custom script effects remain client-local, including in multiplayer. The transform UI has build and data tests but still needs browser interaction QA on the target device.

## Multiplayer, interactions, audio and scripts (0.3)

Published play links join a private Supabase Realtime channel scoped by game slug and room. Anyone who can play a public game can join its channel. Presence tracks guests, Broadcast sends movement at 10Hz, and remote capsule avatars interpolate between updates. `?room=friends` creates a separate room; share the full URL to join the same one. Maximum 30 remote avatars rendered per client. Rooms are ephemeral, guest labels are not verified identities, and movement remains client-reported. No authoritative collision, anti-cheat, shared inventory, economy, global collectible state, or shared scripted world state is provided. Local playtests do not join public rooms.

Select an object and use Properties → Audio to paste an HTTPS audio URL or upload an MP3 (sign-in required, maximum 10MB). Uploaded recordings are public assets; the UI asks before upload. Playback supports volume, looping, positional audio, and distance attenuation. Approach an interactive object and press E or tap the onscreen prompt. Audio begins in response to interaction, not autoplay. Stop resets local runtime effects.

Interaction components connect a source object to a target with `toggleAudio`, `toggleVisibility`, `toggleLight`, or `move`. Move uses an offset and toggles back to its original position. Point lights can be attached in Properties; they are currently rendered during playtests. Interactions and scripts are local to each player's session, not broadcast world mutations.

Scripts entered under Script are saved in the project and start on Play, including published games. The isolated worker API provides `api.color(id,hex)`, `api.position(id,x,y,z)`, `api.visible(id,bool)`, `api.audio(id)`, `api.onUpdate(fn)` (dt argument), and `api.onInteract(id,fn)`. No direct DOM, networking, or engine-object access. The sandbox limits forwarded commands and stops stalled workers after two seconds. Scripts are not executed on the Node server. Creator scripts must never be used to authorize transactions.

`supabase/realtime-assets.sql` records the applied room policies and audio bucket setup. Creator asset folders restrict upload access to the signed-in owner. Audio uploads are immutable through this UI. Asset cleanup, per-user storage quotas, and private asset sharing are future work.

Verification includes two live private-channel clients exchanging movement, Presence joins/leaves, data/component validation, and interaction distance/door toggling. Browser audio playback, visual multiplayer interpolation and script event handling still require device QA.
