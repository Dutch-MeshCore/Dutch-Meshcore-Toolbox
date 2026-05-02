import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LangProvider } from './hooks/useLang'
import HomePage from './pages/HomePage'
import IndexPage from './pages/IndexPage'
import EditorPage from './pages/EditorPage'
import HowToPage from './pages/HowToPage'
import MqttCliPage from './pages/MqttCliPage'
import FirmwarePage from './pages/FirmwarePage'
import KeygenPage from './pages/KeygenPage'

export default function App() {
  return (
    <LangProvider>
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/channel-browser" element={<IndexPage />} />
        <Route path="/channel-browser/editor" element={<EditorPage />} />
        <Route path="/channel-browser/how-to" element={<HowToPage />} />
        <Route path="/mqtt-cli" element={<MqttCliPage />} />
        <Route path="/firmware" element={<FirmwarePage />} />
        <Route path="/keygen" element={<KeygenPage />} />
        <Route path="/editor" element={<Navigate to="/channel-browser/editor" replace />} />
        <Route path="/how-to" element={<Navigate to="/channel-browser/how-to" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
    </LangProvider>
  )
}
