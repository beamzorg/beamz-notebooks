import { BrowserRouter, Routes, Route } from 'react-router'
import { Layout } from '@/components/layout/Layout'
import { LandingPage } from '@/pages/LandingPage'
import { HomePage } from '@/pages/HomePage'
import { NotebookPage } from '@/pages/NotebookPage'
import { DocsPage } from '@/pages/DocsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export default function App() {
  return (
    <BrowserRouter basename="/beamz-notebooks/">
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<LandingPage />} />
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
