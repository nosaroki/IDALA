import { useState } from 'react';
import { HashRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { LangCtx } from './components/LangContext';
import TopBar      from './components/TopBar';        
import Loader      from './components/Loader';
import ScrollToTop from './components/ScrollToTop';
// import ComingSoon  from './pages/ComingSoon';
import Home        from './pages/Home';
import Practitioners from './pages/Practitioners';
import Spiritual   from './pages/Spiritual';
import Retreats   from './pages/Retreats'
import Corporate  from './pages/Corporate'
import Astrology   from './pages/Astrology';
import About       from './pages/About';
import NotFound    from './pages/NotFound';
import JoinUs from './pages/JoinUs'
import RequireAuth from './components/RequireAuth';
import Login from './pages/admin/Login';
import PractitionersList from './pages/admin/PractitionersList';
import Practices from './pages/admin/Practices';
import PracticePage from './pages/practices/[slug]';
import PractitionerPage from './pages/practices/PractitionerPage'
import Candidatures from './pages/admin/Candidatures'
import Onboarding from './pages/Onboarding'
import DiagnosticBubble from './components/DiagnosticBubble';
import Reservation from './pages/Reservation';
import ReservationConfirmation from './pages/ReservationConfirmation';
import CancelReservation from './pages/CancelReservation';
import CGU from './pages/CGU';
import Diagnostic from './pages/Diagnostic';
import Seance from './pages/Seance';
import OnboardingPaymentReturn from './pages/OnboardingPaymentReturn'
import OnboardingPaymentRefresh from './pages/OnboardingPaymentRefresh'
import ModifyReservation from './pages/ModifyReservation'

import { HelmetProvider } from 'react-helmet-async';
import './styles.css';

function Layout() {
  const location = useLocation();
  const path = location.pathname;

  // Masquer le DiagnosticBubble sur : détail praticien, réservation, confirmation
  const hideBubble =
    /^\/practices\/[^/]+\/[^/]+$/.test(path) ||   // détail praticien (2 segments après /practices)
    path.startsWith('/reservation');               // réservation + confirmation

  return (
    <>
      <TopBar />
      <Outlet />
      {!hideBubble && <DiagnosticBubble />}
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
            {/* <Route path="/coming-soon" element={<ComingSoon />} /> */}
              <Route path="/admin/login" element={<Login />} />

            {/* Routes admin protégées */}
            <Route element={<RequireAuth />}>
              <Route path="/admin/praticiens" element={<PractitionersList />} />
              <Route path="/admin/pratiques"  element={<Practices />} />
              <Route path="/admin/candidatures"  element={<Candidatures />} />
            </Route>

            {/* Route onboarding publique */}
               <Route path="/onboarding/:token" element={<Onboarding />} />
               <Route path="/onboarding-paiement/retour" element={<OnboardingPaymentReturn />} />
               <Route path="/onboarding-paiement/refresh" element={<OnboardingPaymentRefresh />} />
               <Route path="/annulation/:token" element={<CancelReservation />} />
               <Route path="/diagnostic" element={<Diagnostic />} />
               <Route path="/seance/:sessionId" element={<Seance />} />
               <Route path="/modifier/:token" element={<ModifyReservation />} />


            <Route element={<Layout />}>
              <Route path="/"              element={<Home />} />
              <Route path="/practitioners" element={<Practitioners />} />
              <Route path="/practices/:slug" element={<PracticePage />} />
              <Route path="/practices/:practiceSlug/:practitionerSlug" element={<PractitionerPage />} />
              <Route path="/retreats"   element={<Retreats />} />
              <Route path="/corporate"  element={<Corporate />} />
              <Route path="/spiritual"     element={<Spiritual />} />
              <Route path="/astrology"     element={<Astrology />} />
              <Route path="/about"         element={<About />} />
              <Route path="/join" element={<JoinUs />} />
              <Route path="/reservation/confirmation" element={<ReservationConfirmation />} />
              <Route path="/reservation/:praticienSlug/:pratiqueSlug/:offreId" element={<Reservation />} />
              <Route path="*" element={<NotFound />} />
              <Route path="/cgu" element={<CGU />} />
            </Route>
          </Routes>
        </HashRouter>
      </LangCtx.Provider>
    </HelmetProvider>
  );
}