---
name: building-hyperfy-apps
description: >
  Builds 3D apps for the Hyperfy virtual world SDK. Creates prims, groups,
  images, audio, video, actions, anchors, particles, and UI. Enforces real-world
  dimensions, collision physics, and performance best practices. Use when user
  asks to "build a Hyperfy app", "add a node", "fix physics", "players fall
  through", "set up multiplayer", "sync state", "objects underground", or
  "why is this laggy".
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Building Hyperfy Apps

Create interactive 3D apps for the Hyperfy virtual world platform.

## When to Use This Skill

- Creating new apps in `apps/` folder
- Adding or modifying nodes (prims, groups, images, audio, video, UI, etc.)
- Setting up multiplayer networking with `app.send`/`app.on`
- Adding player interaction (actions, triggers, anchors)
- Creating particle effects or UI elements

## When NOT to Use This Skill

- Non-Hyperfy JavaScript projects
- Modifying server infrastructure (not app scripts)
- Working with files outside `apps/`, `shared/`, or `assets/`

---

## Classify the Request First

**Problem-First** (diagnose before building):
- "Players fall through the floor"
- "Multiplayer desyncs"
- "Objects appear underground"
- "Late joiners see wrong state"
→ Check references/common-mistakes.md, then fix

**Tool-First** (apply patterns directly):
- "Add a prim"
- "Create a trigger zone"
- "Set up networking"
→ Use decision trees and checklists below

---

## Rationalizations to Reject

| Rationalization | Why It's Wrong | Required Action |
|-----------------|----------------|-----------------|
| "I'll add physics later" | Players fall through immediately | Add `physics: 'static'` on creation |
| "Position [0,0,0] is fine" | Prim origins are centered, half is underground | Lift by `height / 2` |
| "Math.random() works" | Different result on each client | Use `prng(seed)` for determinism |
| "Might need networking" | Performance cost, complexity | Only add when explicitly required |
| "Looks fine in my test" | Z-fighting varies by angle/distance | Use 0.01m+ offsets for overlapping |
| "Quick prototype, skip cleanup" | Memory leaks accumulate | Always add `destroy` handler |
| "This refactor improves it" | User didn't ask | Only make requested changes |

---

## Determinism Rules (Non-Negotiable)

All multiplayer-visible behavior MUST be deterministic:

| Rule | Why | Violation |
|------|-----|-----------|
| Use `prng(seed)` for randomization | `Math.random()` differs per client | Desync bug |
| Server owns shared state | Client-only changes invisible to others | Ghost state |
| Derive visuals from `app.state` | Local state diverges on reconnect | Late-joiner bug |

**Never use for shared state:**
- `Math.random()` or `num()`
- `Date.now()` for game logic
- Client-generated IDs
- Unsynced timers

---

## Quick Reference

### Prim Sizes (origin at center)

| Type | Size Format | Example |
|------|-------------|---------|
| box | `[width, height, depth]` | `[1, 2, 1]` |
| sphere | `[radius]` | `[0.5]` |
| cylinder | `[topRadius, bottomRadius, height]` | `[0.5, 0.5, 2]` |
| cone | `[radius, height]` | `[0.5, 1]` |
| torus | `[radius, tubeRadius]` | `[0.4, 0.1]` |
| plane | `[width, height]` | `[2, 2]` |

### Physics Types

| Type | Use Case |
|------|----------|
| `null` | No collision (decorative, grass) |
| `'static'` | Immovable (walls, floors, furniture) |
| `'kinematic'` | Moved by code (doors, platforms, elevators) |
| `'dynamic'` | Physics-simulated (falling objects, balls) |

### Event Loops

| Event | Rate | Use Case |
|-------|------|----------|
| `update` | Every frame | General logic |
| `fixedUpdate` | Fixed timestep | Physics calculations |
| `animate` | Distance-based | Visual animations |
| `destroy` | On removal | Cleanup handlers |

---

## Decision Trees

### Choosing Node Type

```
Need visuals?
├── Simple shape → prim (box, sphere, cylinder, cone, torus, plane)
├── 2D image → image
├── Video playback → video
├── VRM character → avatar
├── Particle effects → particles
└── UI elements → ui + uitext/uiimage/uiinput/uiview

Need interaction?
├── Click prompt → action
├── Player seating/vehicle → anchor
└── Enter/exit zone → prim with trigger: true

Need hierarchy?
└── Grouping children → group

Need physics body?
├── On prim → use physics prop directly
└── Custom geometry → rigidbody + collider
```

### Choosing Physics Type

```
Does it move?
├── No → 'static' (walls, floors, furniture)
└── Yes
    ├── Moved by script → 'kinematic' (doors, moving platforms)
    └── Physics simulation → 'dynamic' (falling objects)

Is it a trigger zone?
└── Yes → physics: 'static' + trigger: true
```

---

## Workflow Checklists

### New App Checklist

- [ ] Create with `pnpm run apps:new AppName`
- [ ] Use `export default (world, app, fetch, props, setTimeout) => { ... }`
- [ ] Disable placeholder block: `const block = app.get('Block'); if (block) block.active = false;`
- [ ] Real-world dimensions (meters, player ~1.7m tall)
- [ ] Lift prims by height/2 so bottom sits at y=0
- [ ] Add `physics: 'static'` on walkable/solid surfaces
- [ ] No z-fighting (0.01m offsets for touching surfaces)
- [ ] Add `app.on('destroy', () => { ... })` for cleanup

### Adding Networking Checklist

- [ ] Only add if multiplayer sync is required
- [ ] Initialize `app.state` on server
- [ ] Set `app.state.ready = true` after init
- [ ] Send `app.send('init', app.state)` to clients
- [ ] Handle late joiners: check `app.state.ready` on client
- [ ] Use `prng(seed)` for any randomization

### Adding Interaction Checklist

- [ ] Position action node at interaction point
- [ ] Set appropriate `distance` (default 3m)
- [ ] Set `duration` for hold-to-activate (default 0.5s)
- [ ] Implement `onTrigger` callback
- [ ] For trigger zones: `physics: 'static'`, `trigger: true`
- [ ] Check `e.isLocalPlayer` in trigger callbacks

---

## Quality Gate (Must Pass Before Delivery)

Verify ALL before returning code:

- [ ] All prims have appropriate physics (static/kinematic/null)
- [ ] Objects sit on ground (lifted by height/2)
- [ ] No overlapping faces causing z-fighting
- [ ] Uses `prng()` not `Math.random()` for procedural content
- [ ] `destroy` handler cleans up event listeners
- [ ] No unnecessary networking or animation
- [ ] Real-world scale (player ~1.7m, can jump ~1.5m high, ~5m far)
- [ ] Matches blocky/voxel style unless specified otherwise

---

## Common Patterns

### Basic App Structure

```javascript
export default (world, app, fetch, props, setTimeout) => {
  // Disable placeholder if present
  const block = app.get('Block')
  if (block) block.active = false

  // Create content
  const floor = app.create('prim', {
    type: 'box',
    size: [10, 0.2, 10],
    position: [0, 0.1, 0], // Lifted by height/2
    color: '#333333',
    physics: 'static'
  })
  app.add(floor)

  // Cleanup
  app.on('destroy', () => {
    // Remove event listeners, cleanup resources
  })
}
```

### Trigger Zone

```javascript
const zone = app.create('prim', {
  type: 'box',
  size: [4, 4, 4],
  position: [0, 2, 0],
  opacity: 0,
  physics: 'static',
  trigger: true,
  onTriggerEnter: (e) => {
    if (!e.isLocalPlayer) return
    // Player entered
  },
  onTriggerLeave: (e) => {
    if (!e.isLocalPlayer) return
    // Player left
  }
})
```

### Networked State

```javascript
if (world.isServer) {
  app.state.score = 0
  app.state.ready = true
  app.send('init', app.state)
}

if (world.isClient) {
  const init = (state) => {
    // Initialize from server state
  }
  if (app.state.ready) {
    init(app.state)
  } else {
    app.on('init', init)
  }
}
```

---

## Supporting Documentation

- **[references/node-types.md](references/node-types.md)** - Complete API for all node types
- **[references/prims-guide.md](references/prims-guide.md)** - Shapes, physics, materials in detail
- **[references/networking-patterns.md](references/networking-patterns.md)** - Multiplayer sync patterns
- **[references/common-mistakes.md](references/common-mistakes.md)** - Anti-patterns with fixes

---

## Environment Context

- Coordinate system: X=Right, Y=Up, Z=Forward (same as three.js)
- Units: Meters
- Player height: ~1.7m
- Player jump: ~1.5m high, ~5m horizontal
- Rotations: Radians (use `DEG2RAD` constant to convert)
- Style: Blocky/voxel/minecraft unless specified otherwise
