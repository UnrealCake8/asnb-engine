# ASNB Engine architecture and current boundaries

| Layer | Implemented | Remaining |
|---|---|---|
| Engine | Three.js rendering, bounding-box character collisions, lifecycle cleanup, Web Audio playback | Rigid-body physics, slopes, vehicles, animation system |
| Scene model | Validated objects, transforms, stable ids, audio/light/interaction components, target references | Nested model hierarchies, reusable prefabs |
| Gameplay | Nearby interaction events, target actions, saved isolated JS with update and interaction callbacks | Authoritative server scripts and a general component registry |
| Editor | Scene picking, transforms, history, properties, component editing, audio upload | Full asset browser and richer visual event editing |
| Assets | Supabase MP3 storage, HTTPS audio references | Model, texture and animation importing, storage quotas and cleanup |
| Platform | Auth, immutable published snapshots, slugs, public player, ephemeral multiplayer rooms | Discovery, moderation tooling and trusted game servers |
| AI | Structured scene generation and component configuration, edit/replace intent | Arbitrary script generation and behavioural test/repair |

## Multiplayer flow

A published game loads from `asnb_games`. Its URL selects a Realtime topic `asnb:game:<slug>:<room>`. Read/send policies check that the slug belongs to a published game. Guests use random session ids; these are not verified account identities. Presence advertises connections; Broadcast carries bounded movement data, with no per-frame database writes. Clients render interpolated remote avatars.

Gameplay actions, audio, scripts and collectibles are currently local to each player. This is social co-presence, not synchronized world simulation. A browser cannot be trusted to award currency, validate hits or enforce authoritative physics. Those features need an authoritative room server with server-side validation, while Supabase continues handling accounts, storage, publishing and appropriate realtime events.

## Script boundary

A project script runs in a dedicated Worker owned by an opaque sandbox iframe. The engine only accepts validated commands from that iframe. No same-origin permission, direct scene access or network permission is granted. A heartbeat watchdog terminates stalled execution. Commands affect only the local play session and never authorize database changes.
