import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './components/pages/LandingPage';
import MultiplayerPage from './components/pages/MultiplayerPage';
import SinglePlayerPage from './components/pages/SinglePlayerPage';
import { GameProvider } from './context/GameContext';
import { AuthProvider } from './context/AuthContext';
import { MultiplayerProvider } from './context/MultiplayerContext';

function App() {
  return (
    <GameProvider>
      <AuthProvider>
        <MultiplayerProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/multiplayer" element={<MultiplayerPage />} />
              <Route path="/play" element={<SinglePlayerPage />} />
            </Routes>
          </BrowserRouter>
        </MultiplayerProvider>
      </AuthProvider>
    </GameProvider>
  );
}

export default App;
