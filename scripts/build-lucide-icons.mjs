// 把專案用到的 PrimeIcons class（pi pi-xxx）換成 Lucide 圖形：產生 src/assets/lucide-icons.css，
// 每個 icon 以 CSS mask 畫在 .pi::before 上，模板、Button 的 icon prop、選單的 icon 字串都不用改。
// 新增 icon 時在 MAP 加一行，執行 `npm run icons`；原始碼出現未對應的 pi-xxx 會直接報錯（這就是檢查）。
// ponytail: lucide-static 只在產生時用（devDependency），執行期只多一支約 20KB 的 CSS；
// 若之後 icon 用量大到上百個，再改用 @lucide/vue 元件。
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const STROKE = 1.75 // Lucide 預設 2，略細一點較精緻

const MAP = {
  'angle-down': 'chevron-down',
  'angle-left': 'chevron-left',
  'angle-right': 'chevron-right',
  'arrow-left': 'arrow-left',
  'arrow-right': 'arrow-right',
  'arrow-right-arrow-left': 'arrow-left-right',
  bars: 'menu',
  book: 'book-open',
  briefcase: 'briefcase',
  'chart-bar': 'chart-column',
  'chart-line': 'chart-line',
  'chart-pie': 'chart-pie',
  check: 'check',
  'chevron-down': 'chevron-down',
  'chevron-up': 'chevron-up',
  'cloud-upload': 'cloud-upload',
  cog: 'settings',
  copy: 'copy',
  desktop: 'monitor',
  dollar: 'dollar-sign',
  download: 'download',
  envelope: 'mail',
  'exclamation-triangle': 'triangle-alert',
  filter: 'funnel',
  flag: 'flag',
  folder: 'folder',
  globe: 'globe',
  history: 'history',
  home: 'house',
  'info-circle': 'info',
  language: 'languages',
  list: 'list',
  minus: 'minus',
  moon: 'moon',
  palette: 'palette',
  pencil: 'pencil',
  plus: 'plus',
  refresh: 'refresh-cw',
  search: 'search',
  send: 'send',
  'sign-in': 'log-in',
  'sign-out': 'log-out',
  'sliders-h': 'sliders-horizontal',
  spinner: 'loader-circle',
  star: 'star',
  'star-fill': 'star',
  sun: 'sun',
  'th-large': 'layout-grid',
  times: 'x',
  trash: 'trash-2',
  upload: 'upload',
  wallet: 'wallet',
  'wave-pulse': 'activity',
}
// 不是圖形的修飾 class，或 Lucide 沒有的品牌 icon（維持 PrimeIcons 字型）
const KEEP = new Set(['fw', 'spin', 'google'])
const FILLED = new Set(['star-fill'])

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const iconDir = join(root, 'node_modules/lucide-static/icons')

// 檢查：原始碼用到的每個 pi-xxx 都要有對應
const used = new Set()
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.(vue|js|ts)$/.test(name)) for (const m of readFileSync(p, 'utf8').matchAll(/\bpi-([a-z][a-z-]*)/g)) used.add(m[1])
  }
}
walk(join(root, 'src'))
const missing = [...used].filter((n) => !MAP[n] && !KEEP.has(n))
if (missing.length) throw new Error(`沒有對應 Lucide 的 PrimeIcons：${missing.join(', ')}（請加進 MAP 或 KEEP）`)

const dataUri = (piName) => {
  let svg = readFileSync(join(iconDir, `${MAP[piName]}.svg`), 'utf8')
    .replace(/<!--.*?-->/gs, '')
    .replace(/\s*class="[^"]*"/, '')
    .replace(/stroke-width="2"/, `stroke-width="${STROKE}"`)
    .replace(/stroke="currentColor"/, 'stroke="#000"')
  if (FILLED.has(piName)) svg = svg.replace(/fill="none"/, 'fill="#000"')
  svg = svg.replace(/\s+/g, ' ').replace(/> </g, '><').trim()
  return `url("data:image/svg+xml,${encodeURIComponent(svg).replace(/%20/g, ' ').replace(/%3D/g, '=').replace(/%3A/g, ':').replace(/%2F/g, '/').replace(/%22/g, "'")}")`
}

const names = Object.keys(MAP).sort()
// :root 的 --lucide-xxx 也給 App.vue 的表格排序箭頭用
const out = `/* 由 scripts/build-lucide-icons.mjs 產生，請勿手改；新增 icon 改 MAP 後執行 npm run icons */
:root {
${names.map((n) => `  --lucide-${n}: ${dataUri(n)};`).join('\n')}
}

${names.map((n) => `.pi-${n} { --lucide-icon: var(--lucide-${n}); }`).join('\n')}

${names.map((n) => `.pi.pi-${n}::before`).join(',\n')} {
  content: '';
  display: block;
  width: 1em;
  height: 1em;
  background-color: currentColor;
  -webkit-mask: var(--lucide-icon) center / contain no-repeat;
  mask: var(--lucide-icon) center / contain no-repeat;
}
`
writeFileSync(join(root, 'src/assets/lucide-icons.css'), out)
console.log(`lucide-icons.css: ${names.length} icons，原始碼用到 ${used.size} 個 pi class，全部有對應`)
