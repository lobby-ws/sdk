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
    { key: 'accentColor', type: 'color', label: 'Accent', initial: '#f97316' },
    { key: 'uiPointerEvents', type: 'toggle', label: 'UI Pointer Events', initial: true },
  ]))

  const accent = props.accentColor || '#f97316'
  const uiPointerEvents = props.uiPointerEvents !== false
  const { root } = createShowcaseArea(world, app, {
    activationMode: props.activationMode,
  })
  const state = {
    parentDowns: 0,
    childDowns: 0,
    stopChildDowns: 0,
    uiCardDowns: 0,
    uiButtonDowns: 0,
    uiStopDowns: 0,
    lastEvent: uiPointerEvents
      ? 'Hover and click the prim buttons or the UI buttons to watch bubbling.'
      : 'UI pointer events are disabled. The prim station still responds.',
  }

  addCheckerFloor(app, root, {
    width: 18,
    depth: 14,
    tileSize: 2,
    colorA: '#10161c',
    colorB: '#18242d',
  })

  addInfoPanel(app, root, {
    position: [0, 0.76, -5.25],
    width: 620,
    height: 236,
    title: 'Pointer Events Showcase',
    lines: [
      'Both stations use the same pointer event model: enter / leave on hover, down / up on click, bubbling from leaf to parent.',
      'The amber buttons bubble to their parent. The blue buttons call stopPropagation so the parent never sees the click.',
      'Edit: apps/showcasePointerEvents/index.js',
    ],
    accent,
    size: 0.0042,
  })

  const status = createStatusPanel(app, root, accent)
  const sync = () => syncStatus(status, state, uiPointerEvents)

  buildPrimStation(app, root, state, sync, accent)
  buildUiStation(app, root, state, sync, uiPointerEvents)
  sync()
}

function buildPrimStation(app, root, state, sync, accent) {
  addPedestal(app, root, {
    position: [-4.8, 0, 1],
    size: [5.3, 0.52, 3.4],
    accent,
    color: '#1f2730',
  })

  addInfoPanel(app, root, {
    position: [-4.8, 0.76, 2.45],
    width: 280,
    height: 138,
    title: 'Scene Nodes',
    lines: [
      'Left button bubbles to the parent plate.',
      'Right button stops propagation at the leaf node.',
    ],
    accent,
    size: 0.0037,
    titleSize: 24,
    bodySize: 15,
  })

  const panel = app.create('prim', {
    type: 'box',
    size: [3.5, 1.7, 0.28],
    position: [-4.8, 1.45, 0.55],
    color: '#273444',
    roughness: 0.22,
    metalness: 0.08,
    cursor: 'pointer',
    castShadow: true,
    receiveShadow: true,
  })
  panel.onPointerEnter = () => {
    panel.color = '#334155'
    panel.emissive = accent
    panel.emissiveIntensity = 0.25
    state.lastEvent = 'Prim panel pointer enter.'
    sync()
  }
  panel.onPointerLeave = () => {
    panel.color = '#273444'
    panel.emissive = null
    state.lastEvent = 'Prim panel pointer leave.'
    sync()
  }
  panel.onPointerDown = () => {
    state.parentDowns += 1
    panel.color = '#475569'
    state.lastEvent = 'Prim panel pointer down.'
    sync()
  }
  panel.onPointerUp = () => {
    panel.color = '#334155'
    state.lastEvent = 'Prim panel pointer up.'
    sync()
  }

  const bubbleButton = createPrimButton(app, {
    position: [-0.85, -0.2, 0.22],
    color: '#fdba74',
    accent: '#f97316',
    title: 'Bubble',
    line: 'parent also fires',
  })
  bubbleButton.group.onPointerDown = () => {
    state.childDowns += 1
    bubbleButton.base.color = '#fb923c'
    state.lastEvent = 'Prim bubble button down. Parent also receives pointerdown.'
    sync()
  }
  bubbleButton.group.onPointerUp = () => {
    bubbleButton.base.color = '#fdba74'
    state.lastEvent = 'Prim bubble button up.'
    sync()
  }

  const stopButton = createPrimButton(app, {
    position: [0.85, -0.2, 0.22],
    color: '#7dd3fc',
    accent: '#0ea5e9',
    title: 'Stop',
    line: 'leaf only',
  })
  stopButton.group.onPointerDown = event => {
    state.stopChildDowns += 1
    stopButton.base.color = '#38bdf8'
    state.lastEvent = 'Prim stop button down. stopPropagation prevented the parent click.'
    sync()
    event.stopPropagation()
  }
  stopButton.group.onPointerUp = event => {
    stopButton.base.color = '#7dd3fc'
    state.lastEvent = 'Prim stop button up.'
    sync()
    event.stopPropagation()
  }

  panel.add(bubbleButton.group)
  panel.add(stopButton.group)
  root.add(panel)
}

function buildUiStation(app, root, state, sync, uiPointerEvents) {
  addPedestal(app, root, {
    position: [4.8, 0, 1],
    size: [5.3, 0.52, 3.4],
    accent: '#14b8a6',
    color: '#1f2730',
  })

  addInfoPanel(app, root, {
    position: [4.8, 0.76, 2.45],
    width: 280,
    height: 138,
    title: 'UI Tree',
    lines: [
      uiPointerEvents ? 'The whole card is interactive.' : 'Root card pointer events are disabled.',
      'The blue button still demonstrates stopPropagation when the card is active.',
    ],
    accent: '#14b8a6',
    size: 0.0037,
    titleSize: 24,
    bodySize: 15,
  })

  const card = app.create('ui', {
    width: 320,
    height: 226,
    size: 0.0062,
    billboard: 'y',
    position: [4.8, 1.92, 0.9],
    backgroundColor: 'rgba(8, 12, 16, 0.94)',
    borderWidth: 4,
    borderColor: '#14b8a6',
    borderRadius: 20,
    padding: 16,
    gap: 10,
    doubleside: true,
    pointerEvents: uiPointerEvents,
    cursor: uiPointerEvents ? 'pointer' : null,
  })
  card.onPointerEnter = () => {
    card.backgroundColor = 'rgba(15, 23, 42, 0.96)'
    state.lastEvent = 'UI card pointer enter.'
    sync()
  }
  card.onPointerLeave = () => {
    card.backgroundColor = 'rgba(8, 12, 16, 0.94)'
    state.lastEvent = 'UI card pointer leave.'
    sync()
  }
  card.onPointerDown = () => {
    state.uiCardDowns += 1
    state.lastEvent = 'UI card pointer down.'
    sync()
  }
  card.onPointerUp = () => {
    state.lastEvent = 'UI card pointer up.'
    sync()
  }

  card.add(
    app.create('uitext', {
      value: 'UI Buttons',
      fontSize: 26,
      fontWeight: 'bold',
      color: '#f8fafc',
      textAlign: 'center',
    })
  )
  card.add(
    app.create('uitext', {
      value: uiPointerEvents ? 'pointerEvents: true' : 'pointerEvents: false',
      fontSize: 16,
      color: '#5eead4',
      textAlign: 'center',
    })
  )
  card.add(
    app.create('uitext', {
      value: 'Child UI nodes resolve pointer hits exactly like scene nodes do.',
      fontSize: 16,
      color: '#cbd5e1',
      lineHeight: 1.24,
      textAlign: 'center',
    })
  )

  const row = app.create('uiview', {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    margin: [10, 0, 0, 0],
  })
  row.add(createUiButton(app, {
    color: '#f97316',
    hoverColor: '#ea580c',
    label: 'Bubble',
    line: 'card also fires',
    onDown: () => {
      state.uiButtonDowns += 1
      state.lastEvent = 'UI bubble button down. The UI card also receives pointerdown.'
      sync()
    },
    onUp: () => {
      state.lastEvent = 'UI bubble button up.'
      sync()
    },
  }))
  row.add(createUiButton(app, {
    color: '#0ea5e9',
    hoverColor: '#0284c7',
    label: 'Stop',
    line: 'leaf only',
    onDown: event => {
      state.uiStopDowns += 1
      state.lastEvent = 'UI stop button down. stopPropagation prevented the UI card click.'
      sync()
      event.stopPropagation()
    },
    onUp: event => {
      state.lastEvent = 'UI stop button up.'
      sync()
      event.stopPropagation()
    },
  }))
  card.add(row)
  root.add(card)
}

function createPrimButton(app, { position, color, accent, title, line }) {
  const group = app.create('group')
  group.position.set(position[0], position[1], position[2])

  const base = app.create('prim', {
    type: 'box',
    size: [1.1, 0.56, 0.2],
    color,
    roughness: 0.18,
    metalness: 0.08,
    cursor: 'pointer',
    castShadow: true,
    receiveShadow: true,
  })
  const label = app.create('ui', {
    width: 180,
    height: 70,
    size: 0.0035,
    position: [0, 0.68, 0.02],
    pivot: 'bottom-center',
    billboard: 'y',
    pointerEvents: false,
    backgroundColor: 'rgba(8, 12, 16, 0.9)',
    borderWidth: 3,
    borderColor: accent,
    borderRadius: 16,
    padding: 12,
    gap: 4,
    doubleside: true,
  })
  label.add(app.create('uitext', { value: title, fontSize: 18, fontWeight: 'bold', color: '#f8fafc', textAlign: 'center' }))
  label.add(app.create('uitext', { value: line, fontSize: 14, color: accent, textAlign: 'center' }))

  group.add(base)
  group.add(label)
  return { group, base }
}

function createUiButton(app, { color, hoverColor, label, line, onDown, onUp }) {
  const button = app.create('uiview', {
    width: 132,
    padding: [12, 12, 12, 12],
    gap: 4,
    backgroundColor: color,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
  })
  button.onPointerEnter = () => {
    button.backgroundColor = hoverColor
  }
  button.onPointerLeave = () => {
    button.backgroundColor = color
  }
  button.onPointerDown = onDown
  button.onPointerUp = onUp
  button.add(app.create('uitext', { value: label, fontSize: 18, fontWeight: 'bold', color: '#f8fafc', textAlign: 'center' }))
  button.add(app.create('uitext', { value: line, fontSize: 14, color: '#ecfeff', textAlign: 'center' }))
  return button
}

function createStatusPanel(app, root, accent) {
  const panel = app.create('ui', {
    width: 660,
    height: 132,
    size: 0.004,
    pivot: 'bottom-center',
    billboard: 'y',
    position: [0, 0.32, -2.8],
    backgroundColor: 'rgba(8, 12, 16, 0.9)',
    borderWidth: 4,
    borderColor: accent,
    borderRadius: 18,
    padding: 16,
    gap: 8,
    lit: false,
    doubleside: true,
    pointerEvents: false,
  })
  const prim = app.create('uitext', {
    value: '',
    fontSize: 18,
    color: '#fed7aa',
  })
  const ui = app.create('uitext', {
    value: '',
    fontSize: 18,
    color: '#99f6e4',
  })
  const last = app.create('uitext', {
    value: '',
    fontSize: 16,
    color: '#e2e8f0',
    lineHeight: 1.24,
  })
  panel.add(prim)
  panel.add(ui)
  panel.add(last)
  root.add(panel)
  return { prim, ui, last }
}

function syncStatus(status, state, uiPointerEvents) {
  status.prim.value = `prim panel ${state.parentDowns} | bubble button ${state.childDowns} | stop button ${state.stopChildDowns}`
  status.ui.value = uiPointerEvents
    ? `ui card ${state.uiCardDowns} | bubble button ${state.uiButtonDowns} | stop button ${state.uiStopDowns}`
    : 'ui card pointer events are disabled in props'
  status.last.value = state.lastEvent
}
