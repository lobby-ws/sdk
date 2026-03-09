import {
  addCheckerFloor,
  addInfoPanel,
  addPedestal,
  createShowcaseArea,
  hidePlaceholder,
  withShowcaseActivationMode,
} from '@shared/showcase.js'

const DEFAULT_MODEL_URL = 'asset://Model.glb'

export default (world, app, fetch, props) => {
  app.keepActive = true
  hidePlaceholder(app)

  app.configure(withShowcaseActivationMode([
    { key: 'accentColor', type: 'color', label: 'Accent', initial: '#14b8a6' },
    { key: 'modelFile', type: 'file', kind: 'model', label: 'Model File' },
  ]))

  const accent = props.accentColor || '#14b8a6'
  const { root } = createShowcaseArea(world, app, {
    activationMode: props.activationMode,
  })

  addCheckerFloor(app, root, {
    width: 18,
    depth: 14,
    tileSize: 2,
    colorA: '#10161c',
    colorB: '#19242d',
  })

  addInfoPanel(app, root, {
    position: [0, 0.76, -5.25],
    width: 620,
    height: 236,
    title: 'Model Traversal Showcase',
    lines: [
      'Once a model is loaded, traverse lets you inspect every node in the returned tree and apply changes selectively.',
      'This exhibit counts nodes, highlights mesh nodes, and toggles them active without needing to know the exact hierarchy up front.',
      'Edit: apps/showcaseModelTraversal/index.js',
    ],
    accent,
    size: 0.0042,
  })

  addPedestal(app, root, {
    position: [0, 0, 1.1],
    size: [8.6, 0.5, 4.2],
    accent,
    color: '#1f2730',
  })

  const status = createStatusPanel(app, root, accent)
  const modelAnchor = app.create('group')
  root.add(modelAnchor)

  let modelRoot = null
  let meshNodes = []
  let highlightMeshes = false
  let hideMeshes = false

  addControlPad(app, root, {
    position: [-4.8, 0, -0.95],
    accent: '#38bdf8',
    title: 'Reload',
    description: 'load current model prop',
    label: 'Reload traversal model',
    onTrigger: () => {
      void loadModel()
    },
  })
  addControlPad(app, root, {
    position: [-1.6, 0, -0.95],
    accent: '#14b8a6',
    title: 'Count',
    description: 'run traverse summary',
    label: 'Count model nodes',
    onTrigger: () => {
      summarizeModel()
    },
  })
  addControlPad(app, root, {
    position: [1.6, 0, -0.95],
    accent: '#f59e0b',
    title: 'Tint Meshes',
    description: 'toggle mesh highlight',
    label: 'Toggle mesh tint',
    onTrigger: () => {
      highlightMeshes = !highlightMeshes
      applyMeshState()
      summarizeModel()
    },
  })
  addControlPad(app, root, {
    position: [4.8, 0, -0.95],
    accent: '#8b5cf6',
    title: 'Active',
    description: 'toggle mesh active',
    label: 'Toggle mesh active state',
    onTrigger: () => {
      hideMeshes = !hideMeshes
      applyMeshState()
      summarizeModel()
    },
  })

  if (world.isClient) {
    void loadModel()
  }

  async function loadModel() {
    const file = props.modelFile?.url ? props.modelFile : { url: DEFAULT_MODEL_URL, name: 'Model.glb' }
    if (!world.isClient || !file?.url) return
    status.summary.value = `Loading ${file.name || file.url}...`
    status.detail.value = 'Waiting for world.load("model", url) to return a node tree.'
    try {
      if (modelRoot) {
        modelAnchor.remove(modelRoot)
        modelRoot = null
      }
      const node = await world.load('model', file.url)
      if (!node) return
      node.position.set(0, 0.8, 1.15)
      node.scale.setScalar(1.45)
      modelAnchor.add(node)
      modelRoot = node
      highlightMeshes = false
      hideMeshes = false
      summarizeModel()
    } catch (err) {
      console.error('[showcaseModelTraversal] failed to load model:', err)
      status.summary.value = 'Model load failed.'
      status.detail.value = 'Check the browser console for the loader error.'
    }
  }

  function summarizeModel() {
    if (!modelRoot) {
      status.summary.value = 'No model loaded yet.'
      status.detail.value = 'Use Reload to request the current model file.'
      return
    }
    const names = new Map()
    meshNodes = []
    let totalNodes = 0
    modelRoot.traverse(node => {
      totalNodes += 1
      const key = node.name || 'unnamed'
      names.set(key, (names.get(key) || 0) + 1)
      if (node.name === 'mesh' || node.geometry) {
        meshNodes.push(node)
      }
    })
    applyMeshState()
    const topNames = [...names.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => `${name}:${count}`)
      .join(' | ')
    status.summary.value = `Traverse visited ${totalNodes} nodes and found ${meshNodes.length} mesh-like nodes.`
    status.detail.value = `${topNames || 'No names reported'} | highlight ${highlightMeshes ? 'on' : 'off'} | active ${hideMeshes ? 'hidden' : 'shown'}`
  }

  function applyMeshState() {
    for (const node of meshNodes) {
      node.active = !hideMeshes
      try {
        node.emissive = highlightMeshes ? accent : null
        node.emissiveIntensity = highlightMeshes ? 0.4 : 0
      } catch {}
    }
  }
}

function createStatusPanel(app, root, accent) {
  const panel = app.create('ui', {
    width: 620,
    height: 116,
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
  const summary = app.create('uitext', {
    value: '',
    fontSize: 18,
    color: '#ccfbf1',
    lineHeight: 1.22,
  })
  const detail = app.create('uitext', {
    value: '',
    fontSize: 16,
    color: '#99f6e4',
    lineHeight: 1.24,
  })
  panel.add(summary)
  panel.add(detail)
  root.add(panel)
  return { summary, detail }
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
