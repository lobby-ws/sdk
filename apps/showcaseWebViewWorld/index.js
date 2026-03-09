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
    { key: 'accentColor', type: 'color', label: 'Accent', initial: '#0ea5e9' },
    { key: 'pointerEvents', type: 'toggle', label: 'Pointer Events', initial: true },
    { key: 'doubleside', type: 'toggle', label: 'Double Sided', initial: false },
    { key: 'factor', type: 'range', label: 'Factor', min: 80, max: 260, step: 10, initial: 180 },
  ]))

  const accent = props.accentColor || '#0ea5e9'
  const { root } = createShowcaseArea(world, app, {
    activationMode: props.activationMode,
  })

  addCheckerFloor(app, root, {
    width: 18,
    depth: 14,
    tileSize: 2,
    colorA: '#0f151c',
    colorB: '#17222d',
  })

  addInfoPanel(app, root, {
    position: [0, 0.76, -5.3],
    width: 560,
    height: 226,
    title: 'World WebView Showcase',
    lines: [
      'This exhibit renders HTML into 3D space using a CSS3D iframe with proper world placement.',
      'The bright crossbar sits in front of the webview to make the depth layering obvious.',
      'Edit: apps/showcaseWebViewWorld/index.js',
    ],
    accent,
    size: 0.0042,
  })

  addPedestal(app, root, {
    position: [0, 0, 1],
    size: [8.6, 0.52, 4.2],
    accent,
    color: '#1f2730',
  })

  root.add(
    app.create('prim', {
      type: 'box',
      size: [3.7, 2.25, 0.16],
      position: [0, 2.35, 0.82],
      color: '#0f172a',
      roughness: 0.3,
      metalness: 0.16,
      castShadow: true,
      receiveShadow: true,
    })
  )

  root.add(
    app.create('webview', {
      src: buildWorldHtml(accent),
      width: 3.3,
      height: 1.95,
      factor: num(props.factor, 180),
      doubleside: props.doubleside === true,
      pointerEvents: props.pointerEvents !== false,
      position: [0, 2.35, 0.92],
      rotation: [0, Math.PI, 0],
    })
  )

  root.add(
    app.create('prim', {
      type: 'box',
      size: [2.2, 0.16, 0.28],
      position: [0, 2.15, 0.72],
      color: '#e0f2fe',
      emissive: accent,
      emissiveIntensity: 0.35,
      roughness: 0.16,
      metalness: 0.08,
      castShadow: false,
    })
  )

  root.add(
    app.create('prim', {
      type: 'box',
      size: [0.18, 1.3, 0.18],
      position: [-1.9, 1.15, 1],
      color: '#64748b',
      castShadow: true,
      receiveShadow: true,
    })
  )
  root.add(
    app.create('prim', {
      type: 'box',
      size: [0.18, 1.3, 0.18],
      position: [1.9, 1.15, 1],
      color: '#64748b',
      castShadow: true,
      receiveShadow: true,
    })
  )
}

function buildWorldHtml(accent) {
  return htmlDataUrl(`
    <html>
      <body style="margin:0;background:#08111b;color:#f8fafc;font-family:system-ui,sans-serif;">
        <div style="height:100%;padding:18px;display:flex;flex-direction:column;gap:14px;background:linear-gradient(135deg,#08111b,#0f172a);">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:28px;font-weight:700;">World WebView</div>
              <div style="font-size:14px;color:${accent};">CSS3D surface in 3D space</div>
            </div>
            <div style="padding:6px 12px;border-radius:999px;background:${accent};color:#06283d;font-weight:700;">LIVE</div>
          </div>
          <div style="padding:14px;border-radius:16px;background:rgba(255,255,255,0.06);line-height:1.4;">
            Click the buttons below. The crossbar in front of the panel is regular 3D geometry sitting between you and the iframe.
          </div>
          <div style="display:flex;gap:10px;">
            <button id="countBtn" style="flex:1;padding:12px;border:0;border-radius:14px;background:${accent};color:#04151f;font-weight:700;">Count 0</button>
            <button id="themeBtn" style="flex:1;padding:12px;border:0;border-radius:14px;background:#1e293b;color:#f8fafc;font-weight:700;">Toggle Theme</button>
          </div>
        </div>
        <script>
          let count = 0
          let dark = true
          const countBtn = document.getElementById('countBtn')
          const themeBtn = document.getElementById('themeBtn')
          countBtn.onclick = () => {
            count += 1
            countBtn.textContent = 'Count ' + count
          }
          themeBtn.onclick = () => {
            dark = !dark
            document.body.style.background = dark ? '#08111b' : '#e0f2fe'
            document.body.style.color = dark ? '#f8fafc' : '#0f172a'
          }
        </script>
      </body>
    </html>
  `)
}

function htmlDataUrl(html) {
  return `data:text/html;charset=utf-8,${encodeURIComponent(html.trim())}`
}

function num(value, fallback) {
  return Number.isFinite(value) ? value : fallback
}
