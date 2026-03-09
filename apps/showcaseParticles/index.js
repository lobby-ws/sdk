import {
  addCheckerFloor,
  addInfoPanel,
  addPedestal,
  createShowcaseArea,
  hidePlaceholder,
  withShowcaseActivationMode,
} from '@shared/showcase.js'

export default (world, app, fetch, props) => {
  app.keepActive = true
  hidePlaceholder(app)

  app.configure(withShowcaseActivationMode([
    { key: 'fountainRate', type: 'range', label: 'Fountain Rate', min: 0, max: 120, step: 1, initial: 70 },
    { key: 'smokeRate', type: 'range', label: 'Smoke Rate', min: 0, max: 60, step: 1, initial: 22 },
    { key: 'sparkPower', type: 'range', label: 'Burst Power', min: 0.2, max: 2, step: 0.1, initial: 1 },
    { key: 'ambientEnabled', type: 'toggle', label: 'Ambient Emitters', initial: true },
  ]))

  const { root } = createShowcaseArea(world, app, {
    activationMode: props.activationMode,
  })
  const status = createStatusPanel(app, root)
  const ambientEnabled = props.ambientEnabled !== false
  const sparkPower = num(props.sparkPower, 1)

  addCheckerFloor(app, root, {
    width: 18,
    depth: 14,
    tileSize: 2,
    colorA: '#11171d',
    colorB: '#19242b',
  })

  addInfoPanel(app, root, {
    position: [0, 0.76, -5.25],
    width: 560,
    height: 210,
    title: 'Particles Showcase',
    lines: [
      'Three stations cover sustained emitters, soft volumetric smoke, and one-shot bursts.',
      'The front action pad respawns a burst emitter so you can test repeatable VFX triggers.',
      'Edit: apps/showcaseParticles/index.js',
    ],
    accent: '#a855f7',
    size: 0.0042,
  })

  buildEmitterPad(app, root, {
    position: [-5.4, 0, 1],
    accent: '#22d3ee',
    title: 'Fountain',
    line: 'world-space additive spray',
  })
  buildEmitterPad(app, root, {
    position: [0, 0, 1],
    accent: '#94a3b8',
    title: 'Smoke',
    line: 'soft alpha fade + drag',
  })
  buildEmitterPad(app, root, {
    position: [5.4, 0, 1],
    accent: '#fb7185',
    title: 'Burst',
    line: 'spawned on demand',
  })

  const fountain = app.create('particles', {
    emitting: ambientEnabled,
    shape: ['circle', 0.28, 0.2, true],
    rate: num(props.fountainRate, 70),
    life: '0.9~1.5',
    speed: '2.5~5',
    size: '0.05~0.12',
    alpha: '0.6~1',
    color: '#67e8f9',
    emissive: '1.8~2.8',
    direction: 0.08,
    force: new Vector3(0, -3.2, 0),
    blending: 'additive',
    space: 'world',
    position: [-5.4, 0.5, 1],
  })
  fountain.colorOverLife = '0,#cffafe|0.6,#22d3ee|1,#0ea5e9'
  fountain.alphaOverLife = '0,0|0.15,1|1,0'
  fountain.sizeOverLife = '0,0.4|0.35,1|1,0.25'
  root.add(fountain)

  const smoke = app.create('particles', {
    emitting: ambientEnabled,
    shape: ['cone', 0.2, 0.5, 18],
    rate: num(props.smokeRate, 22),
    life: '2.2~3.5',
    speed: '0.35~0.8',
    size: '0.45~0.85',
    alpha: '0.08~0.22',
    color: '#cbd5e1',
    emissive: '0.15',
    direction: 0.7,
    force: new Vector3(0, 0.18, 0),
    blending: 'normal',
    space: 'world',
    position: [0, 0.45, 1],
  })
  smoke.colorOverLife = '0,#94a3b8|0.6,#64748b|1,#0f172a'
  smoke.alphaOverLife = '0,0|0.15,0.8|1,0'
  smoke.sizeOverLife = '0,0.4|1,1.4'
  root.add(smoke)

  addTriggerPad(app, root, status, sparkPower)
}

function buildEmitterPad(app, root, { position, accent, title, line }) {
  addPedestal(app, root, {
    position,
    size: [4.2, 0.5, 3],
    accent,
  })
  addInfoPanel(app, root, {
    position: [position[0], 0.76, 2.35],
    width: 250,
    height: 122,
    title,
    lines: [line],
    accent,
    size: 0.0037,
    titleSize: 26,
    bodySize: 16,
  })
}

function addTriggerPad(app, root, status, sparkPower) {
  const group = app.create('group')
  group.position.set(5.4, 0, 1)

  const action = app.create('action', {
    label: 'Spawn burst',
    distance: 3.4,
    duration: 0.15,
    onTrigger: () => {
      const burst = app.create('particles', {
        shape: ['point'],
        loop: false,
        duration: 0.45,
        rate: 0,
        bursts: [{ time: 0, count: Math.round(26 * sparkPower) }],
        life: '0.25~0.65',
        speed: `${1.8 * sparkPower}~${4.2 * sparkPower}`,
        size: '0.05~0.14',
        color: '#fb7185',
        emissive: '3.4',
        alpha: '0.9~1',
        direction: 0.92,
        blending: 'additive',
        space: 'world',
        max: 60,
        force: new Vector3(0, -4.5, 0),
        position: [5.4, 0.7, 1],
        onEnd: () => root.remove(burst),
      })
      burst.colorOverLife = '0,#fecdd3|0.4,#fb7185|1,#7f1d1d'
      burst.alphaOverLife = '0,1|0.7,0.6|1,0'
      burst.sizeOverLife = '0,1|1,0.1'
      root.add(burst)
      status.value = 'Burst respawned. This pattern is useful for weapon hits, impacts, and scripted beats.'
    },
  })
  action.position.set(0, 0.85, 0)
  group.add(action)
  root.add(group)
}

function createStatusPanel(app, root) {
  const panel = app.create('ui', {
    width: 520,
    height: 84,
    size: 0.004,
    pivot: 'bottom-center',
    position: [0, 0.32, -2.85],
    backgroundColor: 'rgba(8, 12, 16, 0.9)',
    borderWidth: 4,
    borderColor: '#a855f7',
    borderRadius: 18,
    padding: 16,
    gap: 8,
    lit: false,
    doubleside: true,
    pointerEvents: false,
  })
  const text = app.create('uitext', {
    value: 'The two ambient emitters loop continuously. Use the burst pad for one-shot VFX.',
    fontSize: 18,
    color: '#e9d5ff',
    lineHeight: 1.24,
  })
  panel.add(text)
  root.add(panel)
  return text
}

function num(value, fallback) {
  return Number.isFinite(value) ? value : fallback
}
