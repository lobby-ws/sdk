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
const LINK_ID = 'starter-sdk-linked-video-wall'

export default (world, app, fetch, props) => {
  app.keepActive = true
  hidePlaceholder(app)

  app.configure(withShowcaseActivationMode([
    {
      key: 'fit',
      type: 'switch',
      label: 'Fit',
      options: [
        { label: 'Cover', value: 'cover' },
        { label: 'Contain', value: 'contain' },
        { label: 'None', value: 'none' },
      ],
      initial: 'cover',
    },
    { key: 'volume', type: 'range', label: 'Lead Volume', min: 0, max: 1, step: 0.05, initial: 0.45 },
    { key: 'seekSeconds', type: 'range', label: 'Jump Time', min: 0, max: 10, step: 0.5, initial: 4 },
  ]))

  const fit = props.fit || 'cover'
  const leadVolume = num(props.volume, 0.45)
  const area = createShowcaseArea(world, app, {
    activationMode: props.activationMode,
  })
  const { root } = area

  addCheckerFloor(app, root, {
    width: 18,
    depth: 14,
    tileSize: 2,
    colorA: '#10161c',
    colorB: '#18232d',
  })

  addInfoPanel(app, root, {
    position: [0, 0.76, -5.3],
    width: 580,
    height: 228,
    title: 'Linked Video Showcase',
    lines: [
      'All three screens use the same `linked` id, so one transport state drives every surface.',
      'Only the center screen carries audible volume to avoid three overlapping emitters.',
      'Edit: apps/showcaseLinkedVideo/index.js',
    ],
    accent: '#ef4444',
    size: 0.0042,
  })

  addPedestal(app, root, {
    position: [0, 0, 1],
    size: [8.6, 0.52, 4.2],
    accent: '#ef4444',
    color: '#1f2730',
  })

  const lead = buildScreen(app, root, {
    position: [0, 2.7, 1.5],
    width: 4.6,
    height: 2.6,
    rotationY: 0,
    fit,
    volume: leadVolume,
  })
  buildScreen(app, root, {
    position: [-3.2, 2.2, 0.65],
    width: 2.2,
    height: 1.25,
    rotationY: 0.42,
    fit,
    volume: 0,
  })
  buildScreen(app, root, {
    position: [3.2, 2.2, 0.65],
    width: 2.2,
    height: 1.25,
    rotationY: -0.42,
    fit,
    volume: 0,
  })

  const status = createStatusPanel(app, root)

  addTransportPad(app, root, {
    position: [-3.2, 0, -0.9],
    accent: '#22c55e',
    title: 'Play',
    description: 'start wall playback',
    label: 'Play linked video',
    onTrigger: () => {
      if (!world.isClient) return
      lead.play(true)
      status.value = 'Linked video wall playing.'
    },
  })
  addTransportPad(app, root, {
    position: [0, 0, -0.9],
    accent: '#f59e0b',
    title: 'Pause',
    description: 'freeze all screens',
    label: 'Pause linked video',
    onTrigger: () => {
      if (!world.isClient) return
      lead.pause()
      status.value = 'Linked video wall paused.'
    },
  })
  addTransportPad(app, root, {
    position: [3.2, 0, -0.9],
    accent: '#38bdf8',
    title: 'Jump',
    description: `seek to ${num(props.seekSeconds, 4).toFixed(1)}s`,
    label: 'Jump linked video',
    onTrigger: () => {
      if (!world.isClient) return
      lead.time = num(props.seekSeconds, 4)
      lead.play()
      status.value = `Linked wall jumped to ${num(props.seekSeconds, 4).toFixed(1)}s.`
    },
  })

  if (!world.isClient) return

  const onUpdate = () => {
    if (lead.loading) return
    const time = Number.isFinite(lead.time) ? lead.time.toFixed(1) : '0.0'
    status.value = `lead time ${time}s | playing ${lead.playing ? 'yes' : 'no'} | linked id "${LINK_ID}"`
  }
  bindAreaHotEvent(app, area, 'update', onUpdate)
}

function buildScreen(app, root, { position, width, height, rotationY, fit, volume }) {
  const actualRotationY = Math.PI + rotationY
  const offsetX = Math.sin(actualRotationY) * 0.09
  const offsetZ = Math.cos(actualRotationY) * 0.09

  root.add(
    app.create('prim', {
      type: 'box',
      size: [width + 0.32, height + 0.32, 0.16],
      position,
      rotation: [0, actualRotationY, 0],
      color: '#0f172a',
      roughness: 0.24,
      metalness: 0.12,
      castShadow: true,
      receiveShadow: true,
    })
  )

  const video = app.create('video', {
    src: VIDEO_SRC,
    linked: LINK_ID,
    width,
    height,
    position: [position[0] + offsetX, position[1], position[2] + offsetZ],
    rotation: [0, actualRotationY, 0],
    fit,
    lit: false,
    doubleside: false,
    loop: true,
    volume,
    group: 'music',
    spatial: volume > 0,
    refDistance: 1.8,
    maxDistance: 18,
    rolloffFactor: 1.2,
    color: '#020617',
  })
  root.add(video)
  return video
}

function addTransportPad(app, root, { position, accent, title, description, label, onTrigger }) {
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
    width: 190,
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
    height: 84,
    size: 0.004,
    pivot: 'bottom-center',
    billboard: 'y',
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
    value: 'The three screens share one transport state through the same linked id.',
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
