import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router'
import { Layout } from '@/components/layout/Layout'
import { HomePage } from '@/pages/HomePage'
import { NotebookPage } from '@/pages/NotebookPage'
import { DocsPage } from '@/pages/DocsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export default function App() {
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const theme = storedTheme === 'dark' || (storedTheme == null && prefersDark) ? 'dark' : 'light'
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [])

  return (
    <BrowserRouter basename="/beamz-notebooks/">
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="examples" element={<HomePage />} />
          <Route path="examples/:slug" element={<NotebookPage />} />
          <Route path="docs" element={<DocsPage />} />
          <Route path="docs/:slug" element={<DocsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
