import { Github } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-border py-6 mt-12">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-3 text-sm text-muted-foreground opacity-50">
        <nav className="flex items-center gap-4">
          <a
            href="https://github.com/QuentinWach/beamz"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
          <span className="text-border">|</span>
          <a
            href="https://pypi.org/project/beamz/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            PyPI
          </a>
          <span className="text-border">|</span>
          <a
            href="https://github.com/QuentinWach/beamz/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            MIT License
          </a>
        </nav>
        <p>Created by <a href="https://quentinwach.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors underline">Quentin Wach</a>.</p>
      </div>
    </footer>
  )
}
