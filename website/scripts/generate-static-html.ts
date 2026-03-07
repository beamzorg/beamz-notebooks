import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { marked } from 'marked'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.resolve(__dirname, '../dist')
const DATA_DIR = path.resolve(__dirname, '../src/data')
const BASE_URL = '/beamz-notebooks'
const SITE_URL = 'https://quentinwach.com/beamz-notebooks'

interface ParsedOutput {
  type: string
  content: string
  mimeType?: string
}

interface ParsedCell {
  cellType: 'markdown' | 'code'
  source: string
  highlightedHtml?: string
  outputs: ParsedOutput[]
  executionCount?: number | null
}

interface ParsedNotebook {
  slug: string
  title: string
  description: string
  tags: string[]
  author: string
  publishedDate: string
  updatedDate: string
  previewImage?: string
  cells: ParsedCell[]
}

interface NotebookMeta {
  slug: string
  title: string
  description: string
  tags: string[]
  author: string
  publishedDate: string
  updatedDate: string
  previewImage?: string
}

interface ParsedDoc {
  slug: string
  title: string
  order: number
  content: string
  toc: { id: string; text: string; level: number }[]
}

interface DocMeta {
  slug: string
  title: string
  order: number
}

function parseGenTs(filePath: string): ParsedNotebook {
  const content = fs.readFileSync(filePath, 'utf-8')
  const jsonStart = content.indexOf('const data: ParsedNotebook = ') + 'const data: ParsedNotebook = '.length
  const jsonEnd = content.lastIndexOf('\n\nexport default data')
  const json = content.slice(jsonStart, jsonEnd)
  return JSON.parse(json)
}

function parseMetaRegistry(filePath: string): NotebookMeta[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const jsonStart = content.indexOf('export const notebooks: NotebookMeta[] = ') + 'export const notebooks: NotebookMeta[] = '.length
  const json = content.slice(jsonStart).trim()
  return JSON.parse(json)
}

function parseDocGenTs(filePath: string): ParsedDoc {
  const content = fs.readFileSync(filePath, 'utf-8')
  const jsonStart = content.indexOf('const data: ParsedDoc = ') + 'const data: ParsedDoc = '.length
  const jsonEnd = content.lastIndexOf('\n\nexport default data')
  const json = content.slice(jsonStart, jsonEnd)
  return JSON.parse(json)
}

function parseDocMetaRegistry(filePath: string): DocMeta[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const jsonStart = content.indexOf('export const docs: DocMeta[] = ') + 'export const docs: DocMeta[] = '.length
  const json = content.slice(jsonStart).trim()
  return JSON.parse(json)
}

function buildDocPage(
  doc: ParsedDoc,
  assets: { scripts: string[]; stylesheets: string[] },
): string {
  const contentHtml = marked.parse(doc.content) as string
  const themeScript = `<script>(function(){var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')})()</script>`
  const stylesheetTags = assets.stylesheets.map(href => `<link rel="stylesheet" href="${href}" />`).join('\n    ')
  const scriptTags = assets.scripts.map(src => `<script type="module" src="${src}"></script>`).join('\n    ')

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(doc.title)} — BEAMZ Docs</title>
    <meta name="description" content="${escapeHtml(doc.title)}" />
    <meta property="og:title" content="${escapeHtml(doc.title)}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${SITE_URL}/docs/${doc.slug}" />
    <link rel="canonical" href="${SITE_URL}/docs/${doc.slug}" />
    <link rel="icon" type="image/png" href="${BASE_URL}/favicon.png" />
    ${themeScript}
    ${stylesheetTags}
  </head>
  <body>
    <div id="root">
      <article style="max-width:800px;margin:0 auto;padding:2rem 1rem">
        ${contentHtml}
      </article>
    </div>
    ${scriptTags}
  </body>
</html>`
}

function extractAssetPaths(indexHtml: string): { scripts: string[]; stylesheets: string[] } {
  const scripts: string[] = []
  const stylesheets: string[] = []
  const scriptRegex = /<script[^>]+src="([^"]+)"[^>]*>/g
  const linkRegex = /<link[^>]+href="([^"]+)"[^>]*rel="stylesheet"[^>]*>|<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g

  let match
  while ((match = scriptRegex.exec(indexHtml)) !== null) {
    scripts.push(match[1])
  }
  while ((match = linkRegex.exec(indexHtml)) !== null) {
    stylesheets.push(match[1] || match[2])
  }
  return { scripts, stylesheets }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function renderCellToHtml(cell: ParsedCell): string {
  if (cell.cellType === 'markdown') {
    return `<div class="nb-markdown">${marked.parse(cell.source)}</div>`
  }

  let html = '<div class="nb-code-cell">'
  if (cell.highlightedHtml) {
    html += cell.highlightedHtml
  } else {
    html += `<pre><code>${escapeHtml(cell.source)}</code></pre>`
  }

  for (const output of cell.outputs) {
    if (output.type === 'image') {
      const mime = output.mimeType || 'image/png'
      html += `<img src="data:${mime};base64,${output.content}" alt="Output" style="max-width:100%" />`
    } else if (output.type === 'text') {
      html += `<pre class="nb-output">${escapeHtml(output.content)}</pre>`
    } else if (output.type === 'html') {
      html += `<div class="nb-html-output">${output.content}</div>`
    } else if (output.type === 'error') {
      html += `<pre class="nb-error">${escapeHtml(output.content)}</pre>`
    }
  }

  html += '</div>'
  return html
}

function buildNotebookPage(
  nb: ParsedNotebook,
  assets: { scripts: string[]; stylesheets: string[] },
  ogImagePath?: string,
): string {
  const cellsHtml = nb.cells.map(renderCellToHtml).join('\n')
  const description = nb.description.slice(0, 200)
  const ogImage = ogImagePath
    ? `<meta property="og:image" content="${SITE_URL}/examples/${nb.slug}/preview.png" />`
    : ''

  const themeScript = `<script>(function(){var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')})()</script>`
  const stylesheetTags = assets.stylesheets.map(href => `<link rel="stylesheet" href="${href}" />`).join('\n    ')
  const scriptTags = assets.scripts.map(src => `<script type="module" src="${src}"></script>`).join('\n    ')

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(nb.title)} — BEAMZ Examples</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta property="og:title" content="${escapeHtml(nb.title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${SITE_URL}/examples/${nb.slug}" />
    ${ogImage}
    <link rel="canonical" href="${SITE_URL}/examples/${nb.slug}" />
    <link rel="icon" type="image/png" href="${BASE_URL}/favicon.png" />
    ${themeScript}
    ${stylesheetTags}
  </head>
  <body>
    <div id="root">
      <article style="max-width:800px;margin:0 auto;padding:2rem 1rem">
        <h1>${escapeHtml(nb.title)}</h1>
        <p><strong>${escapeHtml(nb.author)}</strong> · ${escapeHtml(nb.publishedDate)}</p>
        ${cellsHtml}
      </article>
    </div>
    ${scriptTags}
  </body>
</html>`
}

function buildGalleryPage(
  notebooks: NotebookMeta[],
  assets: { scripts: string[]; stylesheets: string[] },
): string {
  const galleryHtml = notebooks.map(nb => `
        <a href="${BASE_URL}/examples/${nb.slug}" style="display:block;margin-bottom:1.5rem;text-decoration:none;color:inherit">
          <h2>${escapeHtml(nb.title)}</h2>
          <p>${escapeHtml(nb.description.slice(0, 200))}</p>
          <p style="font-size:0.85em;opacity:0.7">${escapeHtml(nb.author)} · ${escapeHtml(nb.publishedDate)}</p>
        </a>`).join('\n')

  const themeScript = `<script>(function(){var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')})()</script>`
  const stylesheetTags = assets.stylesheets.map(href => `<link rel="stylesheet" href="${href}" />`).join('\n    ')
  const scriptTags = assets.scripts.map(src => `<script type="module" src="${src}"></script>`).join('\n    ')

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>BEAMZ Examples</title>
    <meta name="description" content="Interactive examples and tutorials for BEAMZ photonic simulation." />
    <meta property="og:title" content="BEAMZ Examples" />
    <meta property="og:description" content="Interactive examples and tutorials for BEAMZ photonic simulation." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${SITE_URL}/examples" />
    <link rel="canonical" href="${SITE_URL}/examples" />
    <link rel="icon" type="image/png" href="${BASE_URL}/favicon.png" />
    ${themeScript}
    ${stylesheetTags}
  </head>
  <body>
    <div id="root">
      <main style="max-width:800px;margin:0 auto;padding:2rem 1rem">
        <h1>BEAMZ Examples</h1>
        ${galleryHtml}
      </main>
    </div>
    ${scriptTags}
  </body>
</html>`
}

function buildLandingPage(
  assets: { scripts: string[]; stylesheets: string[] },
): string {
  const themeScript = `<script>(function(){var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')})()</script>`
  const stylesheetTags = assets.stylesheets.map(href => `<link rel="stylesheet" href="${href}" />`).join('\n    ')
  const scriptTags = assets.scripts.map(src => `<script type="module" src="${src}"></script>`).join('\n    ')

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>BEAMZ — Simulate Light. Design Photonics.</title>
    <meta name="description" content="An open-source Python library for photonic device simulation — from waveguides to full circuits." />
    <meta property="og:title" content="BEAMZ — Simulate Light. Design Photonics." />
    <meta property="og:description" content="An open-source Python library for photonic device simulation — from waveguides to full circuits." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${SITE_URL}" />
    <link rel="canonical" href="${SITE_URL}" />
    <link rel="icon" type="image/png" href="${BASE_URL}/favicon.png" />
    ${themeScript}
    ${stylesheetTags}
  </head>
  <body>
    <div id="root">
      <main style="max-width:800px;margin:0 auto;padding:2rem 1rem;text-align:center">
        <h1>BEAMZ</h1>
        <p style="font-size:1.25rem;font-weight:600">Simulate Light. Design Photonics.</p>
        <p>An open-source Python library for photonic device simulation — from waveguides to full circuits.</p>
        <p style="margin-top:1.5rem">
          <a href="${BASE_URL}/docs" style="margin-right:1rem">Get Started</a>
          <a href="${BASE_URL}/examples">View Examples</a>
        </p>
      </main>
    </div>
    ${scriptTags}
  </body>
</html>`
}

async function main() {
  console.log('Generating static HTML pages...')

  const indexHtml = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf-8')
  const assets = extractAssetPaths(indexHtml)
  console.log(`  Assets: ${assets.scripts.length} scripts, ${assets.stylesheets.length} stylesheets`)

  // Save original index.html as 404.html (SPA fallback)
  fs.copyFileSync(path.join(DIST_DIR, 'index.html'), path.join(DIST_DIR, '404.html'))
  console.log('  ✓ Created 404.html')

  // Load notebook metadata registry
  const notebooks = parseMetaRegistry(path.join(DATA_DIR, 'notebooks.gen.ts'))
  console.log(`  Found ${notebooks.length} notebooks`)

  // Generate per-notebook static pages
  const genFiles = fs.readdirSync(DATA_DIR).filter(f => f.startsWith('nb-') && f.endsWith('.gen.ts'))

  for (const genFile of genFiles) {
    const nb = parseGenTs(path.join(DATA_DIR, genFile))
    const outDir = path.join(DIST_DIR, 'examples', nb.slug)
    fs.mkdirSync(outDir, { recursive: true })

    // Write preview image if it's a base64 data URI
    let ogImagePath: string | undefined
    if (nb.previewImage?.startsWith('data:image/')) {
      const match = nb.previewImage.match(/^data:image\/(\w+);base64,(.+)$/)
      if (match) {
        const ext = match[1] === 'jpeg' ? 'jpg' : match[1]
        const imgFile = `preview.${ext}`
        fs.writeFileSync(path.join(outDir, imgFile), Buffer.from(match[2], 'base64'))
        ogImagePath = imgFile
        console.log(`  ✓ Wrote ${nb.slug}/${imgFile}`)
      }
    }

    const html = buildNotebookPage(nb, assets, ogImagePath)
    fs.writeFileSync(path.join(outDir, 'index.html'), html)
    console.log(`  ✓ Generated examples/${nb.slug}/index.html`)
  }

  // Generate /examples/ gallery page
  const examplesDir = path.join(DIST_DIR, 'examples')
  fs.mkdirSync(examplesDir, { recursive: true })
  const galleryHtml = buildGalleryPage(notebooks, assets)
  fs.writeFileSync(path.join(examplesDir, 'index.html'), galleryHtml)
  console.log('  ✓ Generated examples/index.html')

  // Rewrite index.html with landing page content
  const homeHtml = buildLandingPage(assets)
  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), homeHtml)
  console.log('  ✓ Rewrote index.html with landing page content')

  // Generate static docs pages
  const docsMetaPath = path.join(DATA_DIR, 'docs.gen.ts')
  if (fs.existsSync(docsMetaPath)) {
    const docsMeta = parseDocMetaRegistry(docsMetaPath)
    console.log(`  Found ${docsMeta.length} docs`)

    const docGenFiles = fs.readdirSync(DATA_DIR).filter(f => f.startsWith('doc-') && f.endsWith('.gen.ts'))
    for (const genFile of docGenFiles) {
      const doc = parseDocGenTs(path.join(DATA_DIR, genFile))
      const outDir = path.join(DIST_DIR, 'docs', doc.slug)
      fs.mkdirSync(outDir, { recursive: true })

      const html = buildDocPage(doc, assets)
      fs.writeFileSync(path.join(outDir, 'index.html'), html)
      console.log(`  ✓ Generated docs/${doc.slug}/index.html`)
    }
  }

  console.log('Done!')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
