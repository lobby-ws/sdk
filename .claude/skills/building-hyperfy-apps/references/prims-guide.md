# Prims Guide

Detailed guide for creating primitive shapes with physics and materials.

## Shape Types

### Box

```javascript
const box = app.create('prim', {
  type: 'box',
  size: [width, height, depth], // Default: [1, 1, 1]
  position: [0, height/2, 0]    // Lift to sit on ground
})
```

### Sphere

```javascript
const sphere = app.create('prim', {
  type: 'sphere',
  size: [radius], // Default: [0.5]
  position: [0, radius, 0]
})
```

### Cylinder

```javascript
const cylinder = app.create('prim', {
  type: 'cylinder',
  size: [radiusTop, radiusBottom, height], // Default: [0.5, 0.5, 1]
  position: [0, height/2, 0]
})
```

### Cone

```javascript
const cone = app.create('prim', {
  type: 'cone',
  size: [radius, height], // Default: [0.5, 1]
  position: [0, height/2, 0]
})
```

### Torus

```javascript
const torus = app.create('prim', {
  type: 'torus',
  size: [radius, tubeRadius], // Default: [0.4, 0.1]
  position: [0, radius + tubeRadius, 0]
})
```

### Plane

```javascript
const plane = app.create('prim', {
  type: 'plane',
  size: [width, height], // Default: [1, 1]
  doubleside: true // Usually needed for planes
})
```

---

## Origin Positions

**Critical:** All prim origins are at the CENTER of the shape. To place objects on the ground (y=0), lift them:

| Shape | Lift Formula |
|-------|--------------|
| Box | `position.y = height / 2` |
| Sphere | `position.y = radius` |
| Cylinder | `position.y = height / 2` |
| Cone | `position.y = height / 2` |
| Torus | `position.y = radius + tubeRadius` |
| Plane | N/A (2D surface) |

### Example: Table

```javascript
// Table top: 1.2m x 0.05m x 0.8m, surface at 0.75m
const top = app.create('prim', {
  type: 'box',
  size: [1.2, 0.05, 0.8],
  position: [0, 0.75 - 0.025, 0], // Surface at 0.75m
  physics: 'static'
})

// Leg: 0.05m x 0.7m x 0.05m
const leg = app.create('prim', {
  type: 'box',
  size: [0.05, 0.7, 0.05],
  position: [0.5, 0.35, 0.3], // Lifted by height/2
  physics: 'static'
})
```

---

## Physics Types

### null (No Physics)

```javascript
const grass = app.create('prim', {
  type: 'box',
  size: [0.1, 0.3, 0.1],
  color: 'green'
  // physics: null (default)
})
```

Use for: Decorative objects, grass, small details players shouldn't collide with.

### static

```javascript
const wall = app.create('prim', {
  type: 'box',
  size: [5, 3, 0.2],
  position: [0, 1.5, 0],
  physics: 'static'
})
```

Use for: Walls, floors, furniture, buildings - anything that doesn't move.

### kinematic

```javascript
const platform = app.create('prim', {
  type: 'box',
  size: [3, 0.3, 3],
  position: [0, 0.15, 0],
  physics: 'kinematic'
})

app.on('animate', (delta) => {
  platform.position.y = 2 + Math.sin(Date.now() * 0.001) * 2
})
```

Use for: Moving platforms, doors, elevators - objects moved by code.

### dynamic

```javascript
const ball = app.create('prim', {
  type: 'sphere',
  size: [0.3],
  position: [0, 5, 0],
  physics: 'dynamic',
  mass: 1,
  restitution: 0.8 // Bouncy
})
```

Use for: Physics-simulated objects - falling, bouncing, rolling.

---

## Physics Properties

### Mass & Damping

```javascript
const crate = app.create('prim', {
  type: 'box',
  size: [1, 1, 1],
  physics: 'dynamic',
  mass: 10,              // Heavy crate
  linearDamping: 0.5,    // Slow down movement
  angularDamping: 0.5    // Slow down rotation
})
```

### Friction & Bounciness

```javascript
const ice = app.create('prim', {
  type: 'box',
  size: [5, 0.1, 5],
  physics: 'static',
  staticFriction: 0.05,   // Very slippery
  dynamicFriction: 0.02
})

const ball = app.create('prim', {
  type: 'sphere',
  physics: 'dynamic',
  restitution: 1.0  // Perfect bounce
})
```

### Collision Layers

```javascript
const floor = app.create('prim', {
  type: 'box',
  physics: 'static',
  layer: 'environment'
})
```

---

## Trigger Zones

Detect when players enter/exit a volume without blocking them.

```javascript
const zone = app.create('prim', {
  type: 'box',
  size: [4, 4, 4],
  position: [0, 2, 0],
  opacity: 0,           // Invisible
  physics: 'static',    // Required for triggers
  trigger: true,        // Don't block, just detect
  onTriggerEnter: (e) => {
    if (!e.isLocalPlayer) return
    console.log('Player entered zone')
  },
  onTriggerLeave: (e) => {
    if (!e.isLocalPlayer) return
    console.log('Player left zone')
  }
})
```

### Semi-visible Trigger Zone

```javascript
const zone = app.create('prim', {
  type: 'box',
  size: [4, 4, 4],
  color: '#00ff00',
  transparent: true,
  opacity: 0.2,         // Slightly visible
  physics: 'static',
  trigger: true,
  onTriggerEnter: (e) => { /* ... */ }
})
```

---

## Material Properties

### Basic Color

```javascript
const red = app.create('prim', {
  type: 'box',
  color: '#ff0000'
})

const named = app.create('prim', {
  type: 'box',
  color: 'blue'
})
```

### Metallic & Rough

```javascript
// Shiny metal
const metal = app.create('prim', {
  type: 'sphere',
  color: '#888888',
  metalness: 1.0,
  roughness: 0.1
})

// Matte rubber
const rubber = app.create('prim', {
  type: 'sphere',
  color: '#333333',
  metalness: 0.0,
  roughness: 1.0
})
```

### Emissive (Glow/Bloom)

```javascript
const light = app.create('prim', {
  type: 'sphere',
  size: [0.2],
  color: '#ffff00',
  emissive: '#ffff00',      // Usually same as color
  emissiveIntensity: 5      // 0=none, ~5=nice glow, 10+=mega
})
```

### Transparency

```javascript
const glass = app.create('prim', {
  type: 'box',
  size: [2, 2, 0.1],
  color: '#aaddff',
  transparent: true,    // Required for opacity < 1
  opacity: 0.3
})
```

### Textures

```javascript
app.configure([
  { key: 'texture', type: 'file', kind: 'texture', label: 'Texture' }
])

const textured = app.create('prim', {
  type: 'box',
  texture: props.texture?.url
})
```

---

## Z-Fighting Prevention

When surfaces touch or overlap, use small offsets to prevent flickering:

```javascript
// BAD: Wall and floor at same edge causes z-fighting
const floor = app.create('prim', {
  type: 'box',
  size: [10, 0.2, 10],
  position: [0, 0.1, 0]
})
const wall = app.create('prim', {
  type: 'box',
  size: [0.2, 3, 10],
  position: [-5, 1.5, 0]  // Exactly at floor edge
})

// GOOD: Offset wall slightly
const wall = app.create('prim', {
  type: 'box',
  size: [0.2, 3, 10],
  position: [-4.99, 1.5, 0]  // 0.01m offset
})
```

**Rule:** Always use 0.01m+ offsets when surfaces would otherwise touch.

---

## Performance Notes

- Prims with identical materials are automatically instanced
- Changing material properties rebuilds instance groups
- Use `physics: null` for decorative objects
- `cylinder`, `cone`, `torus` use box physics approximations
- `plane` uses thin box for collision
