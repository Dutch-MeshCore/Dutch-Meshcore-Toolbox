import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LangProvider } from './hooks/useLang'
import IndexPage from './pages/IndexPage'
import EditorPage from './pages/EditorPage'
import HowToPage from './pages/HowToPage'

export default function App() {
  return (
    <LangProvider>
    <HashRouter>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/how-to" element={<HowToPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
    </LangProvider>
  )
}
