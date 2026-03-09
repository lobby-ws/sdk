import {
  addCheckerFloor,
  addInfoPanel,
  addPedestal,
  bindAreaHotEvent,
  createShowcaseArea,
  hidePlaceholder,
  withShowcaseActivationMode,
} from '@shared/showcase.js'

const VIDEO_SRC = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'

export default (world, app, fetch, props) => {
  app.keepActive = true
  hidePlaceholder(app)

  app.configure(withShowcaseActivationMode([
    {
      key: 'fit',
      type: 'switch',
      label: 'Fit Mode',
      options: [
        { label: 'Contain', value: 'contain' },
        { label: 'Cover', value: 'cover' },
        { label: 'None', value: 'none' },
      ],
      initial: 'contain',
    },
    { key: 'lit', type: 'toggle', label: 'Lit Material', initial: false },
    { key: 'doubleside', type: 'toggle', label: 'Double Sided', initial: true },
    { key: 'volume', type: 'range', label: 'Volume', min: 0, max: 1, step: 0.05, initial: 0.5 },
    { key: 'loop', type: 'toggle', label: 'Loop', initial: true },
  ]))

  const area = createShowcaseArea(world, app, {
    activationMode: props.activationMode,
  })
  const { root } = area
  const status = createStatusPanel(app, root)
  const fit = props.fit || 'contain'

  addCheckerFloor(app, root, {
    width: 18,
    depth: 14,
    tileSize: 2,
    colorA: '#11161d',
    colorB: '#18232d',
  })

  addInfoPanel(app, root, {
    position: [0, 0.76, -5.25],
    width: 560,
    height: 226,
    title: 'Video Showcase',
    lines: [
      'This exhibit demonstrates plane-based video playback with runtime controls and material flags.',
      'The clip uses a public CC0 sample so the SDK does not need bundled video assets.',
      'Edit: apps/showcaseVideo/index.js',
    ],
    accent: '#ef4444',
    size: 0.0042,
  })

  addPedestal(app, root, {
    position: [0, 0, 1],
    size: [8.8, 0.5, 4.2],
    accent: '#ef4444',
    color: '#1f2730',
  })

  const mainScreen = app.create('video', {
    src: VIDEO_SRC,
    width: 6,
    height: 3.375,
    position: [0, 3.25, 2.25],
    rotation: [0, Math.PI, 0],
    fit,
    lit: props.lit === true,
    doubleside: props.doubleside !== false,
    loop: props.loop !== false,
    volume: num(props.volume, 0.5),
    group: 'music',
    spatial: true,
    refDistance: 1.8,
    maxDistance: 16,
    rolloffFactor: 1.2,
    color: '#020617',
  })
  const floorPreview = app.create('video', {
    src: VIDEO_SRC,
    width: 2.6,
    height: 1.46,
    position: [0, 0.72, 0.2],
    rotation: [-Math.PI / 2, 0, 0],
    fit,
    lit: false,
    doubleside: false,
    loop: props.loop !== false,
    volume: 0,
    spatial: false,
    color: '#0f172a',
  })
  root.add(mainScreen)
  root.add(floorPreview)

  addControlPedestal(app, root, {
    position: [-3.2, 0, -0.9],
    accent: '#22c55e',
    title: 'Play',
    description: 'start playback',
    label: 'Play video',
    onTrigger: () => {
      if (!world.isClient) return
      mainScreen.play(true)
      floorPreview.play(true)
      status.value = `Playing clip with fit="${fit}".`
    },
  })
  addControlPedestal(app, root, {
    position: [0, 0, -0.9],
    accent: '#f59e0b',
    title: 'Pause',
    description: 'freeze current frame',
    label: 'Pause video',
    onTrigger: () => {
      if (!world.isClient) return
      mainScreen.pause()
      floorPreview.pause()
      status.value = 'Video paused.'
    },
  })
  addControlPedestal(app, root, {
    position: [3.2, 0, -0.9],
    accent: '#38bdf8',
    title: 'Restart',
    description: 'seek to time 0',
    label: 'Restart video',
    onTrigger: () => {
      if (!world.isClient) return
      mainScreen.time = 0
      floorPreview.time = 0
      mainScreen.play(true)
      floorPreview.play(true)
      status.value = 'Video restarted from time 0.'
    },
  })

  if (!world.isClient) return

  const onUpdate = () => {
    if (mainScreen.loading) {
      status.value = 'Loading video source...'
      return
    }
    const time = Number.isFinite(mainScreen.time) ? mainScreen.time.toFixed(1) : '0.0'
    const duration = Number.isFinite(mainScreen.duration) ? mainScreen.duration.toFixed(1) : '--'
    status.value = `time ${time}s / ${duration}s | playing ${mainScreen.playing ? 'yes' : 'no'} | fit "${fit}"`
  }
  bindAreaHotEvent(app, area, 'update', onUpdate)
}

function addControlPedestal(app, root, { position, accent, title, description, label, onTrigger }) {
  const group = app.create('group')
  group.position.set(position[0], 0, position[2])
  addPedestal(app, group, {
    size: [2.4, 0.42, 2.2],
    accent,
    color: '#1c232c',
    topColor: '#293542',
  })
  addInfoPanel(app, group, {
    position: [0, 0.62, 0],
    width: 200,
    height: 108,
    title,
    lines: [description],
    accent,
    size: 0.0034,
    titleSize: 22,
    bodySize: 15,
  })
  const action = app.create('action', {
    label,
    distance: 3.2,
    duration: 0.15,
    onTrigger,
  })
  action.position.set(0, 0.8, 0)
  group.add(action)
  root.add(group)
}

function createStatusPanel(app, root) {
  const panel = app.create('ui', {
    width: 540,
    height: 86,
    size: 0.004,
    pivot: 'bottom-center',
    position: [0, 0.32, -2.8],
    backgroundColor: 'rgba(8, 12, 16, 0.9)',
    borderWidth: 4,
    borderColor: '#ef4444',
    borderRadius: 18,
    padding: 16,
    gap: 8,
    lit: false,
    doubleside: true,
    pointerEvents: false,
  })
  const text = app.create('uitext', {
    value: 'Use the controls to start playback. The floor preview mirrors the same source.',
    fontSize: 18,
    color: '#fecaca',
    lineHeight: 1.24,
  })
  panel.add(text)
  root.add(panel)
  return text
}

function num(value, fallback) {
  return Number.isFinite(value) ? value : fallback
}
