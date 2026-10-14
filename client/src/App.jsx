import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { GameProvider } from './context/GameContext';
import { AudioProvider } from './context/AudioContext';
import Notification from './components/Notification';
import GlobalModals from './components/GlobalModals';
import InstallPwaButton from './components/InstallPwaButton';
import UpdateManager from './components/UpdateManager';
import BackNavigationHandler from './components/BackNavigationHandler';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import HowToPlay from './pages/HowToPlay';
import Lobby from './pages/Lobby';
import BoardSetup from './pages/BoardSetup';
import GamePage from './pages/GamePage';
import LegalPage from './pages/LegalPage';
import AdminDashboard from './pages/AdminDashboard';
import { initAnalytics } from './services/analytics';
import './App.css';

function App() {
  useEffect(() => {
    const cleanup = initAnalytics();
    return cleanup;
  }, []);

  return (
    <BrowserRouter>
      <AudioProvider>
        <SocketProvider>
          <GameProvider>
            <div className="app-wrapper">
              <BackNavigationHandler />
              <UpdateManager />
              <Notification />
              <GlobalModals />
              <InstallPwaButton />
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/how-to-play" element={<HowToPlay />} />
                <Route path="/lobby" element={<Lobby />} />
                <Route path="/board-setup" element={<BoardSetup />} />
                <Route path="/game" element={<GamePage />} />
                <Route path="/legal" element={<LegalPage />} />
                
                {/* Obfuscated secure administration portal */}
                <Route path="/sys-admin-panel-92f7" element={<AdminDashboard />} />

                {/* Honeypots & Decoys: redirect predictable paths to home */}
                <Route path="/admin" element={<Navigate to="/" replace />} />
                <Route path="/dashboard" element={<Navigate to="/" replace />} />
                <Route path="/cpanel" element={<Navigate to="/" replace />} />
              </Routes>
              <Footer />
            </div>
          </GameProvider>
        </SocketProvider>
      </AudioProvider>
    </BrowserRouter>
  );
}

export default App;
