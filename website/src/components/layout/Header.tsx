import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Github, Moon, Star, Sun } from 'lucide-react'
import beamzLogo from '../../BEAMZ_logo_new.svg'
import { useTheme } from '@/hooks/useTheme'

export function Header() {
  const [stars, setStars] = useState<number | null>(null)
  const [version, setVersion] = useState<string | null>(null)
  const { theme, toggleTheme } = useTheme()

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
      <div className="max-w-7xl mx-auto grid grid-cols-[auto_1fr_auto] sm:grid-cols-3 items-center h-14 px-3 sm:px-4">
        <Link to="/" className="flex items-center gap-1 font-bold text-lg tracking-tight hover:opacity-80 transition-opacity">
          <img src={beamzLogo} alt="BEAMZ" className="h-7 w-auto invert dark:invert-0" />
          BEAMZ
        </Link>
        <nav className="flex items-center justify-center gap-4 sm:gap-6 text-sm sm:text-base">
          <Link
            to="/docs"
            className="text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            Docs
          </Link>
          <Link
            to="/examples"
            className="text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            Examples
          </Link>
        </nav>
        <div className="flex items-center justify-end gap-2 sm:gap-4">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="hidden sm:flex items-center justify-center rounded-lg p-2 text-foreground glass-btn"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
          <a
            href="https://github.com/quentinwach/beamz"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open BEAMZ on GitHub"
            title="Open BEAMZ on GitHub"
            className="flex h-9 w-9 items-center justify-center gap-2 rounded-lg text-sm font-medium text-foreground glass-btn sm:h-auto sm:w-auto sm:px-3 sm:py-1.5"
          >
            <Github className="h-4 w-4" />
            <span className="hidden sm:inline">GitHub</span>
            {version && (
              <span className="hidden text-xs opacity-70 sm:inline">{version}</span>
            )}
            {stars != null && (
              <span className="hidden items-center gap-0.5 text-xs opacity-70 sm:flex">
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
