# Lobby WS Worlds SDK

## Setup

Recommended Node.js version: 22.11.0

```
npm i && npm run dev
```

## World Presets

This SDK worktree now includes named showcase presets under `worlds/`.

```bash
npm run world:list
npm run world:use -- minimal
npm run world:use -- showcase-engine
npm run world:save -- my-layout
```

`world.json` remains the active manifest that app-server syncs. The `world:use` command copies a preset from `worlds/*.world.json` into `world.json`.

The combined zoo/museum backlog for `showcase-engine` lives in [SHOWCASE_ENGINE_CHECKLIST.md](./SHOWCASE_ENGINE_CHECKLIST.md).

## Start building

Before any coding agent does work in this SDK repo, require this pre-read from the repository root:

- Codex: read `AGENTS.md`
- Claude Code: read `CLAUDE.md`
- OpenClaw: read `skills/lobby-ws/SKILL.md`
- Do not start work until the required file is read

1. Tell your coding agent: "Create a new app and make a tree"
   - _tip_: point your agent to `/docs/scripts/` API reference for extra accuracy
2. Find the "Add" pane in the menu to bring your Tree app in the scene

## Updating the engine

- Update your engine & sdk locally
  - `npm install gamedev@latest`
