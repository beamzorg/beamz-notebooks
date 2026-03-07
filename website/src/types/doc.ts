import type { TocEntry } from './notebook'

export interface DocMeta {
  slug: string
  title: string
  order: number
}

export interface ParsedDoc {
  slug: string
  title: string
  order: number
  content: string
  toc: TocEntry[]
}
