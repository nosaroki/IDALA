import { useState } from 'react';
import { HashRouter, Routes, Route, Outlet } from 'react-router-dom';
import { LangCtx } from './components/LangContext';
import TopBar      from './components/TopBar';        
import Loader      from './components/Loader';
import ScrollToTop from './components/ScrollToTop';
import ComingSoon  from './pages/ComingSoon';
import Home        from './pages/Home';
import Practitioners from './pages/Practitioners';
// import Spiritual   from './pages/Spiritual';
import Astrology   from './pages/Astrology';
import About       from './pages/About';
import NotFound    from './pages/NotFound';
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
  const [showLoader, setShowLoader] = useState(true);   
  const [fading, setFading]         = useState(false);  

    const handleDone = () => {
    setFading(true);                                 
    setTimeout(() => setShowLoader(false), 650);     
  };

  return (
    <HelmetProvider>
      <LangCtx.Provider value={{ lang, setLang }}>
        <HashRouter>
          <ScrollToTop />
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
              {/* <Route path="/spiritual"     element={<Spiritual />} /> */}
              <Route path="/astrology"     element={<Astrology />} />
              <Route path="/about"         element={<About />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </HashRouter>
      </LangCtx.Provider>
    </HelmetProvider>
  );
}