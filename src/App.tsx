import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LangProvider } from './hooks/useLang'
import HomePage from './pages/HomePage'
import IndexPage from './pages/IndexPage'
import MqttCliPage from './pages/MqttCliPage'
import FilterCliPage from './pages/FilterCliPage'
import FilterGuidePage from './pages/FilterGuidePage'
import KeygenPage from './pages/KeygenPage'
import MctoMqttPage from './pages/MctoMqttPage'
import ConnectedProjectsPage from './pages/ConnectedProjectsPage'
import FlasherPage from './pages/FlasherPage'
import UsbConfigPage from './pages/UsbConfigPage'
import ChangelogPage from './pages/ChangelogPage'
import CliWikiPage from './pages/CliWikiPage'
import GettingStartedPage from './pages/GettingStartedPage'

export default function App() {
  return (
    <LangProvider>
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/channel-browser" element={<IndexPage />} />
        <Route path="/mqtt-cli" element={<MqttCliPage />} />
        <Route path="/filter-cli" element={<FilterCliPage />} />
        <Route path="/filter-guide" element={<FilterGuidePage />} />
        <Route path="/mcmqtt-toml" element={<MctoMqttPage />} />
        <Route path="/connected-projects" element={<ConnectedProjectsPage />} />
        <Route path="/connected-brokers" element={<Navigate to="/connected-projects" replace />} />
        <Route path="/keygen" element={<KeygenPage />} />
        <Route path="/flasher" element={<FlasherPage />} />
        <Route path="/usb-config" element={<UsbConfigPage />} />
        <Route path="/changelog" element={<ChangelogPage />} />
        <Route path="/cli-wiki" element={<CliWikiPage />} />
        <Route path="/getting-started" element={<GettingStartedPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
    </LangProvider>
  )
}
