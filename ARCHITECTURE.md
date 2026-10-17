# ASNB Engine architecture

| Layer | Current implementation | Remaining |
|---|---|---|
| Engine | Three.js, cannon-es collision/rigid bodies, Web Audio, cleanup | Vehicles, joints, triangle mesh colliders, animated rigs |
| Scene | Stable ids, nested local transforms, parent validation, components | Prefab system, editing imported internal model nodes |
| Gameplay | Server-validated interactions, shared collectibles, scores and room snapshots | Sandboxed authoritative creator scripts, rich gameplay component library |
| Editor | Viewport transforms, grouping, parent editing, history, model/audio uploads | Full asset browser, animation and terrain tools |
| Platform | Supabase Auth/publishing/assets, game gallery, independent game rooms | Durable room progress, discovery/moderation, per-user quotas |
| Multiplayer | Node WebSocket sessions, fixed physics loop, interpolation | Prediction, rollback/lag compensation, multi-process scheduling |
| AI | Structured worlds and components, fresh/edit intent | Arbitrary tested behaviour generation |

A published URL identifies a game snapshot and a room name. The server loads the snapshot via Supabase, owns the room's physics and world state, accepts only inputs/actions, and sends snapshots to its clients. Different slugs and rooms never share Simulation instances. Room state is in memory and resets on process restart.

Supabase does not run the 60Hz physics loop. It provides identities, game JSON and assets. The earlier Realtime movement implementation is superseded by the Node session transport; creator scripts remain isolated client code and cannot mutate authoritative positions. Publishing and storage access remain protected by RLS.
