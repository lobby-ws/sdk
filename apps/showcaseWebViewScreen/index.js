import { addCheckerFloor, addInfoPanel, addPedestal, hidePlaceholder } from '@shared/showcase.js'

export default (world, app, fetch, props) => {
  app.keepActive = true
  hidePlaceholder(app)

  app.configure([
    { key: 'accentColor', type: 'color', label: 'Accent', initial: '#2563eb' },
    { key: 'pointerEvents', type: 'toggle', label: 'Pointer Events', initial: true },
    { key: 'width', type: 'number', label: 'Width', min: 240, max: 640, step: 10, initial: 420 },
    { key: 'height', type: 'number', label: 'Height', min: 180, max: 420, step: 10, initial: 260 },
  ])

  const accent = props.accentColor || '#2563eb'
  const root = app.create('group')

  app.add(root)

  addCheckerFloor(app, root, {
    width: 18,
    depth: 14,
    tileSize: 2,
    colorA: '#10161c',
    colorB: '#18232d',
  })

  addPedestal(app, root, {
    position: [0, 0, 1.1],
    size: [8.2, 0.52, 4],
    accent,
    color: '#1f2730',
  })

  addInfoPanel(app, root, {
    position: [0, 0.76, -5.3],
    width: 560,
    height: 212,
    title: 'Screen WebView Showcase',
    lines: [
      'A screen-space webview behaves like an iframe HUD instead of a diegetic 3D object.',
      'This one sits near the upper right of the viewport and stays pinned there as you move.',
      'Edit: apps/showcaseWebViewScreen/index.js',
    ],
    accent,
    size: 0.0042,
  })

  root.add(
    app.create('webview', {
      src: buildScreenHtml(accent),
      space: 'screen',
      width: Math.round(num(props.width, 420)),
      height: Math.round(num(props.height, 260)),
      position: [0.78, 0.22, 55],
      pointerEvents: props.pointerEvents !== false,
    })
  )

  const badge = app.create('ui', {
    space: 'screen',
    width: 280,
    height: 62,
    position: [0.24, 0.12, 50],
    pointerEvents: false,
    backgroundColor: 'rgba(8, 12, 16, 0.92)',
    borderWidth: 4,
    borderColor: accent,
    borderRadius: 18,
    padding: 14,
  })
  badge.add(
    app.create('uitext', {
      value: 'Screen WebView overlay active',
      fontSize: 18,
      fontWeight: 'bold',
      color: '#eff6ff',
      textAlign: 'center',
    })
  )
  root.add(badge)
}

function buildScreenHtml(accent) {
  return htmlDataUrl(`
    <html>
      <body style="margin:0;background:#eff6ff;color:#0f172a;font-family:system-ui,sans-serif;">
        <div style="height:100%;display:flex;flex-direction:column;padding:18px;box-sizing:border-box;gap:14px;">
          <div style="font-size:28px;font-weight:700;">Overlay Panel</div>
          <div style="font-size:14px;color:${accent};">screen-space iframe</div>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">
            <div style="padding:14px;border-radius:14px;background:white;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
              <div style="font-size:12px;text-transform:uppercase;color:#64748b;">CPU</div>
              <div style="font-size:24px;font-weight:700;">18%</div>
            </div>
            <div style="padding:14px;border-radius:14px;background:white;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
              <div style="font-size:12px;text-transform:uppercase;color:#64748b;">GPU</div>
              <div style="font-size:24px;font-weight:700;">44%</div>
            </div>
          </div>
          <button id="refreshBtn" style="padding:12px;border:0;border-radius:14px;background:${accent};color:white;font-weight:700;">Refresh Snapshot</button>
        </div>
        <script>
          let tick = 0
          document.getElementById('refreshBtn').onclick = e => {
            tick += 1
            e.target.textContent = 'Refresh Snapshot (' + tick + ')'
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
