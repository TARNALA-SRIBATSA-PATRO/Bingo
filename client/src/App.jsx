import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { GameProvider } from './context/GameContext';
import { AudioProvider } from './context/AudioContext';
import Notification from './components/Notification';
import GlobalModals from './components/GlobalModals';
import InstallPwaButton from './components/InstallPwaButton';
import UpdateManager from './components/UpdateManager';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import HowToPlay from './pages/HowToPlay';
import Lobby from './pages/Lobby';
import BoardSetup from './pages/BoardSetup';
import GamePage from './pages/GamePage';
import LegalPage from './pages/LegalPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AudioProvider>
        <SocketProvider>
          <GameProvider>
            <div className="app-wrapper">
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
