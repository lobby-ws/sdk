# Lobby WS Worlds SDK

## Setup

Recommended Node.js version: 22.11.0

```
npm i && npm run dev
```

## Start building

1. Find your admin code in `.env` ADMIN_CODE=
2. In the chat box, type `/admin <admin code>`
3. Tell your coding agent: "Create a new app and make a tree"
4. Find the "Add" pane in the menu to bring your Tree app in the scene

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
  - WORLD_ID, ADMIN_CODE, DEPLOY_CODE, JWT_SECRET (secrets)
- The script will:
  - Configure `fly.toml` and fill public URLs for your app (`https://<app>.fly.dev`)
  - Initialize the Fly app (no deploy), set secrets, then deploy the engine image
  - Add/update a `.lobby/targets.json` entry for your app
- When it completes:
  - Visit: `https://<app>.fly.dev/`
  - Note: you may need to wait a minute or so before the website is live.

1. Deploy your apps

- Use the target added by the deploy script:
  - `gamedev apps deploy <AppName> --target <app>`
- Or run continuous dev against a remote world:
  - `gamedev dev --target <app>`

1. Update the deployed engine later

- Pull the latest engine image and roll it out:
  - `npm run update:engine`
