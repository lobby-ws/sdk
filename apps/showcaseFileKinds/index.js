import {
  addCheckerFloor,
  addInfoPanel,
  addPedestal,
  createShowcaseArea,
  hidePlaceholder,
  withShowcaseActivationMode,
} from '@shared/showcase.js'

const DEFAULT_TEXTURE_URL = 'asset://sky.jpg'
const DEFAULT_HDR_URL = 'asset://sky.hdr'
const DEFAULT_MODEL_URL = 'asset://Model.glb'
const DEFAULT_AVATAR_URL = 'asset://avatar.vrm'
const DEFAULT_EMOTE_URL = 'asset://emote-talk.glb'
const DEFAULT_AUDIO_URL = 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3'

export default (world, app, fetch, props) => {
  app.keepActive = true
  hidePlaceholder(app)

  app.configure(withShowcaseActivationMode([
    { key: 'accentColor', type: 'color', label: 'Accent', initial: '#14b8a6' },
    { key: 'textureFile', type: 'file', kind: 'texture', label: 'Texture File' },
    { key: 'hdrFile', type: 'file', kind: 'hdr', label: 'HDR File' },
    { key: 'audioFile', type: 'file', kind: 'audio', label: 'Audio File' },
    { key: 'avatarFile', type: 'file', kind: 'avatar', label: 'Avatar File' },
    { key: 'emoteFile', type: 'file', kind: 'emote', label: 'Emote File' },
    { key: 'modelFile', type: 'file', kind: 'model', label: 'Model File' },
  ]))

  const accent = props.accentColor || '#14b8a6'
  const textureFile = props.textureFile?.url ? props.textureFile : { url: DEFAULT_TEXTURE_URL, name: 'sky.jpg' }
  const hdrFile = props.hdrFile?.url ? props.hdrFile : { url: DEFAULT_HDR_URL, name: 'sky.hdr' }
  const audioFile = props.audioFile?.url ? props.audioFile : { url: DEFAULT_AUDIO_URL, name: 't-rex-roar.mp3' }
  const avatarFile = props.avatarFile?.url ? props.avatarFile : { url: DEFAULT_AVATAR_URL, name: 'avatar.vrm' }
  const emoteFile = props.emoteFile?.url ? props.emoteFile : { url: DEFAULT_EMOTE_URL, name: 'emote-talk.glb' }
  const modelFile = props.modelFile?.url ? props.modelFile : { url: DEFAULT_MODEL_URL, name: 'Model.glb' }

  const { root } = createShowcaseArea(world, app, {
    activationMode: props.activationMode,
  })

  addCheckerFloor(app, root, {
    width: 18,
    depth: 14,
    tileSize: 2,
    colorA: '#10161c',
    colorB: '#18242b',
  })

  addInfoPanel(app, root, {
    position: [0, 0.76, -5.25],
    width: 620,
    height: 236,
    title: 'File Kinds Showcase',
    lines: [
      'File props hand your app an object with type, name, and url. This exhibit wires those picker kinds into live consumers.',
      'Texture, audio, avatar, emote, and model are used directly. HDR is shown as metadata here because applying it would replace world lighting globally.',
      'Edit: apps/showcaseFileKinds/index.js',
    ],
    accent,
    size: 0.0042,
  })

  buildTextureStage(app, root, textureFile, hdrFile)
  const audioNode = buildAudioModelStage(app, root, audioFile)
  buildAvatarStage(app, root, avatarFile, emoteFile)
  const modelStatus = createStatusPanel(app, root, accent)
  modelStatus.value = `texture ${describe(textureFile)} | hdr ${describe(hdrFile)}`
  modelStatus.detail = app.create('uitext', {
    value: `avatar ${describe(avatarFile)} | emote ${describe(emoteFile)} | model ${describe(modelFile)} | audio ${describe(audioFile)}`,
    fontSize: 15,
    color: '#99f6e4',
    lineHeight: 1.24,
  })
  modelStatus.panel.add(modelStatus.detail)

  if (world.isClient && modelFile?.url) {
    void loadModel()
  }

  async function loadModel() {
    try {
      const node = await world.load('model', modelFile.url)
      node.position.set(4.8, 0.76, 1.2)
      node.scale.setScalar(1.35)
      root.add(node)
      modelStatus.value = `model loaded from ${describe(modelFile)}`
    } catch (err) {
      console.error('[showcaseFileKinds] model load failed:', err)
      modelStatus.value = 'model load failed'
    }
  }

  addControlPad(app, root, {
    position: [-2.4, 0, -0.95],
    accent: '#22c55e',
    title: 'Play Audio',
    description: 'use audio file kind',
    label: 'Play file kind audio',
    onTrigger: () => {
      if (!world.isClient) return
      audioNode.play()
      modelStatus.value = `audio playing from ${describe(audioFile)}`
    },
  })
  addControlPad(app, root, {
    position: [2.4, 0, -0.95],
    accent: '#64748b',
    title: 'Stop Audio',
    description: 'stop playback',
    label: 'Stop file kind audio',
    onTrigger: () => {
      if (!world.isClient) return
      audioNode.stop()
      modelStatus.value = 'audio stopped'
    },
  })
}

function buildTextureStage(app, root, textureFile, hdrFile) {
  addPedestal(app, root, {
    position: [-4.8, 0, 1.1],
    size: [3.4, 0.5, 3.4],
    accent: '#38bdf8',
    color: '#1f2730',
  })
  root.add(
    app.create('image', {
      src: textureFile.url,
      width: 2.3,
      height: 1.5,
      fit: 'cover',
      position: [-4.8, 2.0, 1.15],
      lit: false,
      doubleside: true,
      castShadow: false,
      receiveShadow: false,
    })
  )
  addInfoPanel(app, root, {
    position: [-4.8, 0.76, 3.25],
    width: 260,
    height: 126,
    title: 'Texture + HDR',
    lines: [
      `texture: ${describe(textureFile)}`,
      `hdr: ${describe(hdrFile)}`,
      'HDR urls usually feed sky.hdr or reflection setups.',
    ],
    accent: '#38bdf8',
    size: 0.0035,
    titleSize: 24,
    bodySize: 14,
  })
}

function buildAvatarStage(app, root, avatarFile, emoteFile) {
  addPedestal(app, root, {
    position: [0, 0, 1.1],
    size: [3.4, 0.5, 3.4],
    accent: '#22c55e',
    color: '#1f2730',
  })
  const avatar = app.create('avatar', {
    src: avatarFile.url,
    emote: emoteFile.url,
  })
  avatar.position.set(0, 0.5, 1.25)
  avatar.rotation.y = Math.PI
  root.add(avatar)
  addInfoPanel(app, root, {
    position: [0, 0.76, 3.25],
    width: 260,
    height: 126,
    title: 'Avatar + Emote',
    lines: [
      `avatar: ${describe(avatarFile)}`,
      `emote: ${describe(emoteFile)}`,
      'These two file kinds plug straight into an avatar node.',
    ],
    accent: '#22c55e',
    size: 0.0035,
    titleSize: 24,
    bodySize: 14,
  })
}

function buildAudioModelStage(app, root, audioFile) {
  addPedestal(app, root, {
    position: [4.8, 0, 1.1],
    size: [3.4, 0.5, 3.4],
    accent: '#f59e0b',
    color: '#1f2730',
  })
  root.add(
    app.create('prim', {
      type: 'sphere',
      size: [0.2],
      position: [4.8, 2.5, 1.2],
      color: '#fff7ed',
      emissive: '#f59e0b',
      emissiveIntensity: 1,
      castShadow: false,
    })
  )
  addInfoPanel(app, root, {
    position: [4.8, 0.76, 3.25],
    width: 260,
    height: 126,
    title: 'Model + Audio',
    lines: [
      `audio: ${describe(audioFile)}`,
      'The model file is loaded asynchronously with world.load().',
      'Use the pads to test the audio file kind.',
    ],
    accent: '#f59e0b',
    size: 0.0035,
    titleSize: 24,
    bodySize: 14,
  })
  const audio = app.create('audio', {
    src: audioFile.url,
    volume: 0.75,
    loop: false,
    group: 'music',
    spatial: true,
    refDistance: 1.4,
    maxDistance: 14,
    rolloffFactor: 1.6,
    position: [4.8, 1.1, 1.2],
  })
  root.add(audio)
  return audio
}

function createStatusPanel(app, root, accent) {
  const panel = app.create('ui', {
    width: 620,
    height: 118,
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
  const value = app.create('uitext', {
    value: '',
    fontSize: 18,
    color: '#ccfbf1',
    lineHeight: 1.22,
  })
  panel.add(value)
  root.add(panel)
  return { panel, value }
}

function addControlPad(app, root, { position, accent, title, description, label, onTrigger }) {
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

function describe(file) {
  return file?.name || file?.url || 'none'
}
