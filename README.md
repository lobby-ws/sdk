# Lobby WS Worlds SDK

## Setup

Recommended Node.js version: 22.11.0

```
npm i && npm run dev
```

## Start building

1. Tell your coding agent: "Create a new app and make a tree"
   - _tip_: point your agent to /docs/scripts/ api reference for extra accuracy
2. Find the "Add" pane in the menu to bring your Tree app in the scene

## Deploying a site

Deploy your world server with Fly.io (free-tier friendly, global edge VMs). If you’ve never used Fly.io, follow these steps — no prior knowledge needed.

1. Install Fly CLI and login

- Install: https://fly.io/docs/hands-on/install-flyctl/
- Login: `flyctl auth login`

2. One‑time deploy

- Run: `npm run deploy:fly`
- You’ll be prompted for:
  - App name (be unique; names are global on Fly)
  - Primary region (e.g., `iad`)
  - Memory (start with 1024 MB; raise if you see OOM)
  - WORLD_ID, ADMIN_CODE, JWT_SECRET (secrets)
- The script will:
  - Configure `fly.toml` and fill public URLs for your app (`https://<app>.fly.dev`)
  - Initialize the Fly app (no deploy), set secrets, then deploy the engine image
  - Add/update a `.lobby/targets.json` entry for your app
- When it completes:
  - Visit: `https://<app>.fly.dev/`
  - Note: you may need to wait a minute or so before the website is live.

## Deploy your apps

- Use the target added by the deploy script:
  - `npm run deploy:app -- <AppName> --target <app>`

## Updating the engine

- To update the engine on your live site:
  - `npm run update:engine`
- Update your engine & sdk locally
  - `npm install gamedev@latest`

## Live sync to your deployed world

Sync your local project to a remote world in real time (no per‑app deploys):

- Prereqs:
  - Your Fly app target exists in `.lobby/targets.json` (created by `npm run deploy:fly`).
  - Secrets are set on the Fly app: `WORLD_ID`, `ADMIN_CODE`

- Start live sync:
  - `npm run dev -- --target <app>`

- What it does:
  - Runs the app-server against your remote world (`worldUrl` in the target).
  - Watches `apps/**`, `shared/**`, `assets/**`, and `world.json`.
  - Pushes changes in ~1–2 seconds without page refresh.

- Notes:
  - Use for dev/staging only — it can overwrite world state.
  - For production, prefer `npm run deploy:app -- <AppName> --target <app>`.

## Import .hyp files

- Drop `.hyp` files in `hyp/` (kept in Git via `hyp/.gitkeep`).
- Extract all packages into `apps/` and `assets/`:
  - `npm run hyp:extract`
