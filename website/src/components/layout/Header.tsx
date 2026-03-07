import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Github, Moon, Star, Sun } from 'lucide-react'
import beamzLogo from '../../BEAMZ_logo_new.svg'
import { useTheme } from '../../hooks/useTheme'

export function Header() {
  const { theme, toggleTheme } = useTheme()
  const [stars, setStars] = useState<number | null>(null)
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    fetch('https://api.github.com/repos/quentinwach/beamz')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.stargazers_count != null) setStars(data.stargazers_count) })
      .catch(() => {})
    fetch('https://api.github.com/repos/quentinwach/beamz/releases/latest')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.tag_name) setVersion(data.tag_name) })
      .catch(() => {})
  }, [])

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto grid grid-cols-3 items-center h-14 px-4">
        <Link to="/" className="flex items-center gap-1 font-bold text-lg tracking-tight hover:opacity-80 transition-opacity">
          <img src={beamzLogo} alt="BEAMZ" className="h-7 w-auto invert dark:invert-0" />
          BEAMZ
        </Link>
        <nav className="flex items-center justify-center gap-6 text-base">
          <Link
            to="/docs"
            className="text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            Docs
          </Link>
          <Link
            to="/"
            className="text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            Examples
          </Link>
        </nav>
        <div className="flex items-center justify-end gap-4">
          <button
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <a
            href="https://github.com/quentinwach/beamz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-foreground glass-btn"
          >
            <Github className="h-4 w-4" />
            <span>Get Started</span>
            {version && (
              <span className="text-xs opacity-70">{version}</span>
            )}
            {stars != null && (
              <span className="flex items-center gap-0.5 text-xs opacity-70">
                <Star className="h-3 w-3 fill-current" />
                {stars}
              </span>
            )}
          </a>
        </div>
      </div>
    </header>
  )
}
