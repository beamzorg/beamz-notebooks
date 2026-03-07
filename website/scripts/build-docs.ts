import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHighlighter } from 'shiki'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DOCS_DIR = path.resolve(__dirname, '../../docs')
const DATA_DIR = path.resolve(__dirname, '../src/data')

function slugify(filename: string): string {
  return filename.replace(/\.md$/, '').replace(/[^a-z0-9]+/gi, '_').toLowerCase()
}

interface Frontmatter {
  title: string
  order: number
}

function parseFrontmatter(content: string): { frontmatter: Frontmatter; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) {
    return { frontmatter: { title: 'Untitled', order: 999 }, body: content }
  }

  const raw = match[1]
  const body = match[2]

  let title = 'Untitled'
  let order = 999

  const titleMatch = raw.match(/^title:\s*(.+)$/m)
  if (titleMatch) title = titleMatch[1].trim()

  const orderMatch = raw.match(/^order:\s*(\d+)$/m)
  if (orderMatch) order = parseInt(orderMatch[1], 10)

  return { frontmatter: { title, order }, body }
}

function extractToc(markdown: string): { id: string; text: string; level: number }[] {
  // Strip fenced code blocks before extracting headings so that
  // code comments like "# comment" aren't treated as headings
  const stripped = markdown.replace(/```[\s\S]*?```/g, '')
  const toc: { id: string; text: string; level: number }[] = []
  const headingRegex = /^(#{1,4})\s+(.+)$/gm
  let match
  while ((match = headingRegex.exec(stripped)) !== null) {
    const level = match[1].length
    const text = match[2].trim()
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    toc.push({ id, text, level })
  }
  return toc
}

async function highlightCodeBlocks(markdown: string): Promise<string> {
  const highlighter = await createHighlighter({
    themes: ['github-light', 'github-dark'],
    langs: ['python', 'typescript', 'javascript', 'bash', 'json', 'yaml', 'html', 'css'],
  })

  // Replace fenced code blocks with Shiki-highlighted HTML wrapped in CodeCell-style container
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
  const result = markdown.replace(codeBlockRegex, (_, lang, code) => {
    const language = lang || 'text'
    const trimmedCode = code.replace(/\n$/, '')
    const escapedSource = trimmedCode.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\n/g, '&#10;')
    let shikiHtml: string
    try {
      shikiHtml = highlighter.codeToHtml(trimmedCode, {
        lang: language,
        themes: { light: 'github-light', dark: 'github-dark' },
      })
    } catch {
      const escaped = trimmedCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')
      shikiHtml = `<pre><code class="language-${language}">${escaped}</code></pre>`
    }
    // Collapse newlines inside Shiki HTML to prevent react-markdown from
    // interpreting code comments (e.g. "# comment") as markdown headings.
    // The <span class="line"> elements already separate lines visually.
    shikiHtml = shikiHtml.replace(/\n/g, '&#10;')
    // Wrap in the same structure as CodeCell component
    return `<div class="doc-code-block group relative my-2" data-code="${escapedSource}"><div class="flex items-center justify-between bg-muted/50 border border-border rounded-t-md px-3 py-1 text-xs text-muted-foreground"><span>${language}</span><button class="doc-copy-btn opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded" title="Copy code"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg></button></div><div class="border border-t-0 border-border rounded-b-md">${shikiHtml}</div></div>`
  })

  highlighter.dispose()
  return result
}

async function main() {
  console.log('Building docs data...')

  if (!fs.existsSync(DOCS_DIR)) {
    console.log('No docs/ directory found, skipping.')
    return
  }

  // Clean existing doc gen files only
  if (fs.existsSync(DATA_DIR)) {
    for (const f of fs.readdirSync(DATA_DIR)) {
      if (f.startsWith('doc-') && f.endsWith('.gen.ts')) fs.unlinkSync(path.join(DATA_DIR, f))
      if (f === 'docs.gen.ts') fs.unlinkSync(path.join(DATA_DIR, f))
    }
  }
  fs.mkdirSync(DATA_DIR, { recursive: true })

  const mdFiles = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md'))
  console.log(`Found ${mdFiles.length} doc files: ${mdFiles.join(', ')}`)

  const allMeta: { slug: string; title: string; order: number }[] = []

  for (const file of mdFiles) {
    const filePath = path.join(DOCS_DIR, file)
    const raw = fs.readFileSync(filePath, 'utf-8')
    const slug = slugify(file)

    const { frontmatter, body } = parseFrontmatter(raw)
    const toc = extractToc(body)
    const content = await highlightCodeBlocks(body)

    const docData = {
      slug,
      title: frontmatter.title,
      order: frontmatter.order,
      content,
      toc,
    }

    const docModule = `// AUTO-GENERATED — do not edit\nimport type { ParsedDoc } from '@/types/doc'\n\nconst data: ParsedDoc = ${JSON.stringify(docData, null, 2)}\n\nexport default data\n`
    fs.writeFileSync(path.join(DATA_DIR, `doc-${slug}.gen.ts`), docModule)

    allMeta.push({ slug, title: frontmatter.title, order: frontmatter.order })
    console.log(`  ✓ ${file} → ${slug} (${toc.length} TOC entries)`)
  }

  // Sort by order
  allMeta.sort((a, b) => a.order - b.order)

  const metaModule = `// AUTO-GENERATED — do not edit\nimport type { DocMeta } from '@/types/doc'\n\nexport const docs: DocMeta[] = ${JSON.stringify(allMeta, null, 2)}\n`
  fs.writeFileSync(path.join(DATA_DIR, 'docs.gen.ts'), metaModule)

  console.log(`Done! Generated data for ${allMeta.length} docs.`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
