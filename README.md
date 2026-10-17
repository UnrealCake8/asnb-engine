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
- Custom JavaScript playtests in a worker inside an opaque sandbox iframe. Only validated position/color messages affect the scene. Network access is blocked by CSP; workers stop after two seconds. Scripts are temporary and are not included in exports.

## Scope

This is a single-player prototype, not yet a general-purpose engine or Roblox-compatible runtime. No multiplayer, vehicle simulation, accounts, asset uploads, publishing service, or RBXLX importer. AI produces supported scene data rather than arbitrary gameplay scripts. Collision is axis-aligned boxes only; spheres and cylinders are visuals/triggers. The first-person controller is deliberately simple.

For remote AI use, set a strong `ASNB_ACCESS_TOKEN`, bind `HOST` deliberately, and use HTTPS. The editor accepts that token per session. AI access is denied for non-local hostnames without a configured token. A process-wide generation lock bounds concurrency; add durable per-user quotas and authentication before a public launch. Never expose the API key in frontend code.

## Project format

See `src/project.js` for the strict generation schema and runtime validator. Units are arbitrary; Y is up. Spawn is the player's feet position. Each object has an id, name, shape, position, size, hex color, and behaviour. Version 1 accepts up to 200 objects.

## Verification

`npm test` checks project round-tripping and rejects malformed/unsafe data. `npm run build` bundles the browser client. Live API testing requires an account with available quota. Browser playtesting should cover collision, jump reach, pointer lock, touch, triggers, and custom scripts before release.
