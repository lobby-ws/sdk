# Deployment

## Local development

```bash
npm install
npm run dev
```

On first run `gamedev dev` generates a `.env` with a local world ID and admin code. Visit `http://localhost:3000`.

### Key environment variables

| Variable | Description |
|---|---|
| `JWT_SECRET` | JWT signing secret — **min 16 chars in production** |
| `ADMIN_CODE` | Admin password. **Leave blank = all players are admins** (unsafe for public worlds) |
| `DEPLOY_CODE` | Password for live-sync deploys (`npm run dev -- --target <app>`) |
| `WORLD_ID` | Unique identifier for this world |
| `PUBLIC_WS_URL` | Public WebSocket URL (`wss://` in production) |
| `PUBLIC_API_URL` | Public API URL (`https://` in production) |
| `ASSETS_BASE_URL` | Base URL for serving uploaded assets |
| `LIVEKIT_*` | Voice chat credentials (optional) |

---

## Deploying to Fly.io

Fly.io is the recommended host (free-tier friendly, global edge VMs).

### Prerequisites

- [Install flyctl](https://fly.io/docs/hands-on/install-flyctl/) and run `flyctl auth login`

### First deploy

```bash
npm run deploy:fly
```

The script prompts for app name, region, and secrets (`WORLD_ID`, `ADMIN_CODE`, `DEPLOY_CODE`, `JWT_SECRET`), configures `fly.toml`, and deploys the engine image. When complete, your world is live at `https://<app>.fly.dev/`.

### Deploy an app

```bash
npm run deploy:app -- <AppName> --target <app>
```

### Update the engine

```bash
npm run update:engine
```

Redeploys the latest `ghcr.io/lobby-ws/gamedev:main` image to your Fly app.

### Live sync (dev/staging only)

Stream local changes to a remote world in real time — no per-app deploys needed:

```bash
npm run dev -- --target <app>
```

Watches `apps/`, `shared/`, `assets/`, and `world.json` and pushes changes in ~1–2 seconds. **Do not use on production** — it can overwrite world state.

---

## Connecting to your world

Share your world URL directly: `https://<app>.fly.dev/`

To connect from a local static preview or another client, use the `?connect=` parameter:

```
https://<app>.fly.dev/?connect=wss://<app>.fly.dev/ws
```
