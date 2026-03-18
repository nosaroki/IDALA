import { useState } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { LangCtx } from './components/LangContext';
import TopBar      from './components/TopBar';        
import Loader      from './components/Loader';
import ComingSoon  from './pages/ComingSoon';
import Home        from './pages/Home';
import Practitioners from './pages/Practitioners';
import Spiritual   from './pages/Spiritual';
import Astrology   from './pages/Astrology';
import About       from './pages/About';
import { HelmetProvider } from 'react-helmet-async';
import './styles.css';

function Layout() {
  return (
    <>
      <TopBar />
      <Outlet />
    </>
  );
}

export default function App() {
  const [lang, setLangState] = useState(() => localStorage.getItem('idala-lang') || 'en');
  const setLang = (l) => { setLangState(l); localStorage.setItem('idala-lang', l); };
  const [showLoader, setShowLoader] = useState(true);   // ← loader visible au départ
  const [fading, setFading]         = useState(false);  // ← déclenche le fade-out

    const handleDone = () => {
    setFading(true);                                 // commence le fade
    setTimeout(() => setShowLoader(false), 650);     // retire du DOM après la transition
  };

  return (
    <HelmetProvider>
      <LangCtx.Provider value={{ lang, setLang }}>
        <BrowserRouter>
                {/* Loader overlay — positionné en dehors du router pour couvrir tout */}
          {showLoader && (
            <div className={`loader${fading ? ' fade-out' : ''}`}>
              <Loader onDone={handleDone} />
            </div>
          )}
          <Routes>
            <Route path="/coming-soon" element={<ComingSoon />} />

            <Route element={<Layout />}>
              <Route path="/"              element={<Home />} />
              <Route path="/practitioners" element={<Practitioners />} />
              <Route path="/spiritual"     element={<Spiritual />} />
              <Route path="/astrology"     element={<Astrology />} />
              <Route path="/about"         element={<About />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </LangCtx.Provider>
    </HelmetProvider>
  );
}