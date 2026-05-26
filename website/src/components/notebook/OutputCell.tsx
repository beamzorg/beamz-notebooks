import DOMPurify from 'dompurify'
import AnsiToHtml from 'ansi-to-html'
import type { ParsedOutput } from '@/types/notebook'

const ansiConverter = new AnsiToHtml({ escapeXML: true })

function ImageOutput({ output }: { output: ParsedOutput }) {
  const mime = output.mimeType || 'image/png'
  const src = `data:${mime};base64,${output.content}`
  return (
    <div className="my-6 flex justify-center">
      <img src={src} alt="Cell output" className="max-w-full rounded" />
    </div>
  )
}

function TextOutput({ output }: { output: ParsedOutput }) {
  return (
    <pre className="my-2 bg-muted/30 border border-border rounded-md p-3 text-xs overflow-x-auto whitespace-pre-wrap font-mono">
      {output.content}
    </pre>
  )
}

function HtmlOutput({ output }: { output: ParsedOutput }) {
  const clean = DOMPurify.sanitize(output.content, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'],
  })
  return (
    <div
      className="notebook-html-output my-2"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}

function ErrorOutput({ output }: { output: ParsedOutput }) {
  const html = ansiConverter.toHtml(output.content)
  return (
    <pre
      className="my-2 bg-red-50 border border-red-200 rounded-md p-3 text-xs overflow-x-auto font-mono text-red-900"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function WidgetOutput({ output }: { output: ParsedOutput }) {
  return (
    <div className="my-2 bg-muted/30 border border-border rounded-md p-3 text-sm text-muted-foreground italic">
      {output.content}
    </div>
  )
}

export function OutputCell({ outputs }: { outputs: ParsedOutput[] }) {
  if (!outputs.length) return null

  return (
    <div>
      {outputs.map((output, i) => {
        switch (output.type) {
          case 'image': return <ImageOutput key={i} output={output} />
          case 'text': return <TextOutput key={i} output={output} />
          case 'html': return <HtmlOutput key={i} output={output} />
          case 'error': return <ErrorOutput key={i} output={output} />
          case 'widget': return <WidgetOutput key={i} output={output} />
          default: return null
        }
      })}
    </div>
  )
}
