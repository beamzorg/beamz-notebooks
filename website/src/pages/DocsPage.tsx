import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import type { Components } from 'react-markdown'
import { TableOfContents } from '@/components/layout/TableOfContents'
import { docs } from '@/data/docs.gen'
import type { ParsedDoc } from '@/types/doc'

const modules = import.meta.glob<{ default: ParsedDoc }>('@/data/doc-*.gen.ts')

const loaders: Record<string, () => Promise<{ default: ParsedDoc }>> = {}
for (const [path, loader] of Object.entries(modules)) {
  const match = path.match(/doc-(.+)\.gen\.ts$/)
  if (match) loaders[match[1]] = loader
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function urlTransform(
  url: string,
  _key: string,
  _node: Readonly<{ type: string; properties?: Record<string, unknown> }>
): string {
  if (url.startsWith('data:')) return url
  return defaultUrlTransform(url) ?? ''
}

const components: Components = {
  h1: ({ children, ...props }) => {
    const text = String(children)
    return <h1 id={slugify(text)} {...props}>{children}</h1>
  },
  h2: ({ children, ...props }) => {
    const text = String(children)
    return <h2 id={slugify(text)} {...props}>{children}</h2>
  },
  h3: ({ children, ...props }) => {
    const text = String(children)
    return <h3 id={slugify(text)} {...props}>{children}</h3>
  },
  h4: ({ children, ...props }) => {
    const text = String(children)
    return <h4 id={slugify(text)} {...props}>{children}</h4>
  },
  img: ({ src, alt, ...props }) => <img src={src ?? ''} alt={alt ?? ''} {...props} className="max-w-full h-auto" />,
}

export function DocsPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [doc, setDoc] = useState<ParsedDoc | null>(null)
  const [loading, setLoading] = useState(true)
  const contentRef = useRef<HTMLElement>(null)

  // Default to first doc by order if no slug
  const activeSlug = slug || (docs.length > 0 ? docs[0].slug : undefined)

  useEffect(() => {
    if (!activeSlug) {
      navigate('/', { replace: true })
      return
    }
    if (!slug && activeSlug) {
      navigate(`/docs/${activeSlug}`, { replace: true })
      return
    }
  }, [activeSlug, slug, navigate])

  useEffect(() => {
    if (!activeSlug || !loaders[activeSlug]) {
      setLoading(false)
      return
    }

    setLoading(true)
    loaders[activeSlug]().then(mod => {
      setDoc(mod.default)
      setLoading(false)
    })
  }, [activeSlug])

  // Wire up copy-to-clipboard buttons on doc code blocks
  useEffect(() => {
    const el = contentRef.current
    if (!el) return

    const handler = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest('.doc-copy-btn')
      if (!btn) return
      const block = btn.closest('.doc-code-block') as HTMLElement | null
      if (!block) return
      const code = block.dataset.code
      if (!code) return

      // Decode HTML entities
      const decoded = code.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
      navigator.clipboard.writeText(decoded)

      // Swap icon to checkmark
      const svg = btn.querySelector('svg')
      if (svg) {
        const original = svg.outerHTML
        svg.outerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
        setTimeout(() => {
          const check = btn.querySelector('svg')
          if (check) check.outerHTML = original
        }, 2000)
      }
    }

    el.addEventListener('click', handler)
    return () => el.removeEventListener('click', handler)
  }, [doc])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-2/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Page not found</h1>
        <Link to="/" className="text-primary underline">Back to home</Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex gap-8">
        {/* Sidebar navigation */}
        <nav className="hidden md:block w-48 shrink-0">
          <div className="sticky top-20">
            <h4 className="text-sm font-semibold mb-3 text-foreground">Documentation</h4>
            <ul className="space-y-1 text-sm">
              {docs.map((d) => (
                <li key={d.slug}>
                  <Link
                    to={`/docs/${d.slug}`}
                    className={`block py-1 px-2 rounded transition-colors hover:text-foreground ${
                      activeSlug === d.slug
                        ? 'text-foreground font-medium bg-muted'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {d.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Main content */}
        <article ref={contentRef} className="flex-1 min-w-0 max-w-4xl notebook-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex, rehypeRaw]}
            components={components}
            urlTransform={urlTransform}
          >
            {doc.content}
          </ReactMarkdown>
        </article>

        {/* TOC sidebar */}
        <TableOfContents entries={doc.toc} />
      </div>
    </div>
  )
}
