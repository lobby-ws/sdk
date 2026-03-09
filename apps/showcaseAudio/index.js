import {
  addCheckerFloor,
  addInfoPanel,
  addPedestal,
  createShowcaseArea,
  hidePlaceholder,
  withShowcaseActivationMode,
} from '@shared/showcase.js'

const AUDIO_SRC = 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3'

export default (world, app, fetch, props) => {
  app.keepActive = true
  hidePlaceholder(app)

  app.configure(withShowcaseActivationMode([
    { key: 'masterVolume', type: 'range', label: 'Master Volume', min: 0, max: 1, step: 0.05, initial: 0.65 },
    { key: 'speakerDistance', type: 'range', label: 'Spatial Distance', min: 3, max: 20, step: 0.5, initial: 11 },
    { key: 'speakerRolloff', type: 'range', label: 'Rolloff', min: 0.5, max: 5, step: 0.1, initial: 2.6 },
    { key: 'ambientEnabled', type: 'toggle', label: 'Start Ambient Loop', initial: false },
  ]))

  const { root } = createShowcaseArea(world, app, {
    activationMode: props.activationMode,
  })
  const status = createStatusPanel(app, root)
  const volume = num(props.masterVolume, 0.65)
  const distance = num(props.speakerDistance, 11)
  const rolloff = num(props.speakerRolloff, 2.6)
  let ambientPlaying = props.ambientEnabled === true

  addCheckerFloor(app, root, {
    width: 18,
    depth: 14,
    tileSize: 2,
    colorA: '#11161c',
    colorB: '#1a222b',
  })

  addInfoPanel(app, root, {
    position: [0, 0.76, -5.25],
    width: 580,
    height: 234,
    title: 'Audio Showcase',
    lines: [
      'The left speaker is a spatial music emitter. The right speaker narrows its cone and falls off harder.',
      'Use the front controls to satisfy browser gesture requirements, then walk around to hear the difference.',
      'Edit: apps/showcaseAudio/index.js',
    ],
    accent: '#22c55e',
    size: 0.0042,
  })

  const ambient = app.create('audio', {
    src: AUDIO_SRC,
    volume: volume * 0.35,
    loop: true,
    group: 'music',
    spatial: false,
  })
  root.add(ambient)

  const leftSpeaker = buildSpeaker(app, root, {
    position: [-4.8, 1.15, 1],
    color: '#22c55e',
    title: 'Spatial Music',
    line: `maxDistance ${distance.toFixed(1)}m`,
  })
  const leftAudio = app.create('audio', {
    src: AUDIO_SRC,
    volume,
    loop: true,
    group: 'music',
    spatial: true,
    refDistance: 1.5,
    maxDistance: distance,
    rolloffFactor: rolloff,
    coneInnerAngle: 360,
    coneOuterAngle: 360,
    coneOuterGain: 0,
    position: [-4.8, 1.3, 1],
  })
  root.add(leftAudio)

  const rightSpeaker = buildSpeaker(app, root, {
    position: [4.8, 1.15, 1],
    color: '#38bdf8',
    title: 'Directional SFX',
    line: 'cone 35 / 140 degrees',
  })
  rightSpeaker.rotation.y = Math.PI / 2
  const rightAudio = app.create('audio', {
    src: AUDIO_SRC,
    volume: volume * 0.85,
    loop: true,
    group: 'sfx',
    spatial: true,
    refDistance: 1,
    maxDistance: distance * 0.9,
    rolloffFactor: rolloff + 0.8,
    coneInnerAngle: 35,
    coneOuterAngle: 140,
    coneOuterGain: 0.08,
    position: [4.8, 1.3, 1],
  })
  rightAudio.rotation.y = Math.PI / 2
  root.add(rightAudio)

  if (props.ambientEnabled === true && world.isClient) {
    ambient.play(true)
  }

  addControlPedestal(app, root, {
    position: [-3.1, 0, -0.8],
    accent: '#22c55e',
    title: 'Play',
    description: 'Start all emitters',
    label: 'Play audio',
    onTrigger: () => {
      if (!world.isClient) return
      ambient.play(true)
      leftAudio.play(true)
      rightAudio.play(true)
      ambientPlaying = true
      status.value = 'Audio running. Walk left and right to hear spatial differences.'
    },
  })
  addControlPedestal(app, root, {
    position: [0, 0, -0.8],
    accent: '#38bdf8',
    title: 'Pause',
    description: 'Pause all emitters',
    label: 'Pause audio',
    onTrigger: () => {
      if (!world.isClient) return
      ambient.pause()
      leftAudio.pause()
      rightAudio.pause()
      ambientPlaying = false
      status.value = 'Audio paused.'
    },
  })
  addControlPedestal(app, root, {
    position: [3.1, 0, -0.8],
    accent: '#f59e0b',
    title: 'Ambient',
    description: 'Toggle non-spatial bed',
    label: 'Toggle ambient',
    onTrigger: () => {
      if (!world.isClient) return
      if (ambientPlaying) {
        ambient.pause()
      } else {
        ambient.play(true)
      }
      ambientPlaying = !ambientPlaying
      status.value = 'Ambient bed toggled. The center bed ignores distance entirely.'
    },
  })
}

function buildSpeaker(app, root, { position, color, title, line }) {
  const group = app.create('group')
  group.position.set(position[0], 0, position[2])

  addPedestal(app, group, {
    size: [3.8, 0.5, 3],
    accent: color,
    color: '#1f2730',
  })

  group.add(
    app.create('prim', {
      type: 'cylinder',
      size: [0.6, 0.8, 1.8],
      position: [0, 1.15, 0],
      color: '#e2e8f0',
      emissive: color,
      emissiveIntensity: 0.35,
      roughness: 0.18,
      metalness: 0.5,
      castShadow: true,
      receiveShadow: true,
    })
  )
  group.add(
    app.create('prim', {
      type: 'cylinder',
      size: [0.34, 0.34, 0.18],
      position: [0, 1.15, 0.48],
      color: '#020617',
      roughness: 0.1,
      metalness: 0.2,
      castShadow: false,
    })
  )
  addInfoPanel(app, group, {
    position: [0, 0.76, 1.95],
    width: 250,
    height: 122,
    title,
    lines: [line],
    accent: color,
    size: 0.0037,
    titleSize: 26,
    bodySize: 16,
  })
  root.add(group)
  return group
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
    width: 460,
    height: 86,
    size: 0.004,
    pivot: 'bottom-center',
    position: [0, 0.32, -2.8],
    backgroundColor: 'rgba(8, 12, 16, 0.9)',
    borderWidth: 4,
    borderColor: '#22c55e',
    borderRadius: 18,
    padding: 16,
    gap: 8,
    lit: false,
    doubleside: true,
    pointerEvents: false,
  })
  const text = app.create('uitext', {
    value: 'Press Play to unlock audio playback and then move through the exhibit.',
    fontSize: 18,
    color: '#dbeafe',
    lineHeight: 1.24,
  })
  panel.add(text)
  root.add(panel)
  return text
}

function num(value, fallback) {
  return Number.isFinite(value) ? value : fallback
}
