# scripts/

Deployment and maintenance scripts. Run via `npm run <command>` from the repo root.

| Script | npm command | What it does |
|---|---|---|
| `fly-deploy.sh` | `npm run deploy:fly` | First-time deploy to Fly.io. Prompts for app name, region, and secrets; configures `fly.toml`; deploys the engine image; writes `.lobby/targets.json`. |
| `update-engine.sh` | `npm run update:engine` | Redeploys the latest `ghcr.io/lobby-ws/gamedev:main` image to an existing Fly app without changing config or secrets. |

See [docs/deployment.md](../docs/deployment.md) for full deployment instructions.
