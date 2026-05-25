import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { TocEntry } from '@/types/notebook'

export function TableOfContents({ entries }: { entries: TocEntry[] }) {
  const [activeId, setActiveId] = useState<string>('')
  const [indicator, setIndicator] = useState({ top: 0, height: 0 })
  const listRef = useRef<HTMLUListElement | null>(null)
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({})
  const activeEntryId = entries.some((entry) => entry.id === activeId)
    ? activeId
    : entries[0]?.id || ''

  useEffect(() => {
    if (!entries.length) return

    const updateActiveSection = () => {
      const headings = entries
        .map((entry) => document.getElementById(entry.id))
        .filter((heading): heading is HTMLElement => Boolean(heading))

      if (!headings.length) return

      const activationOffset = 120
      let currentId = headings[0].id

      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= activationOffset) {
          currentId = heading.id
        } else {
          break
        }
      }

      const atPageEnd =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4

      setActiveId(atPageEnd ? headings[headings.length - 1].id : currentId)
    }

    let frame = window.requestAnimationFrame(updateActiveSection)

    const scheduleUpdate = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(updateActiveSection)
    }

    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
    }
  }, [entries])

  useLayoutEffect(() => {
    const list = listRef.current
    const activeItem = itemRefs.current[activeEntryId]

    if (!list || !activeItem) return

    const updateIndicator = () => {
      const listRect = list.getBoundingClientRect()
      const itemRect = activeItem.getBoundingClientRect()

      setIndicator({
        top: itemRect.top - listRect.top,
        height: itemRect.height,
      })
    }

    updateIndicator()

    const resizeObserver = new ResizeObserver(updateIndicator)
    resizeObserver.observe(list)
    resizeObserver.observe(activeItem)
    window.addEventListener('resize', updateIndicator)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateIndicator)
    }
  }, [activeEntryId, entries])

  if (!entries.length) return null

  return (
    <nav className="hidden xl:block w-60 shrink-0">
      <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
        <h4 className="text-sm font-semibold mb-3 text-foreground">On this page</h4>
        <ul ref={listRef} className="relative text-sm">
          <span
            aria-hidden="true"
            className="absolute left-0 top-0 bottom-0 w-px bg-border"
          />
          <span
            aria-hidden="true"
            className="absolute left-0 w-0.5 bg-foreground transition-[height,transform] duration-200 ease-out"
            style={{
              height: indicator.height,
              transform: `translateY(${indicator.top}px)`,
            }}
          />
          {entries.map((entry) => (
            <li
              key={entry.id}
              ref={(el) => {
                itemRefs.current[entry.id] = el
              }}
              style={{ paddingLeft: `${(entry.level - 1) * 0.75}rem` }}
            >
              <a
                href={`#${entry.id}`}
                className={`block border-l-2 border-transparent py-1.5 pl-4 leading-snug transition-colors hover:text-foreground ${
                  activeEntryId === entry.id
                    ? 'text-foreground font-medium bg-muted/50'
                    : 'text-muted-foreground'
                }`}
              >
                {entry.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
