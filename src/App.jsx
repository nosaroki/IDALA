// import { useState } from 'react';
// import { HashRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
// import { LangCtx } from './components/LangContext';
// import TopBar      from './components/TopBar';        
// import Loader      from './components/Loader';
// import ScrollToTop from './components/ScrollToTop';
// // import ComingSoon  from './pages/ComingSoon';
// import Home        from './pages/Home';
// import Practitioners from './pages/Practitioners';
// import Spiritual   from './pages/Spiritual';
// import Retreats   from './pages/Retreats'
// import Corporate  from './pages/Corporate'
// import Astrology   from './pages/Astrology';
// import About       from './pages/About';
// import NotFound    from './pages/NotFound';
// import JoinUs from './pages/JoinUs'
// import RequireAuth from './components/RequireAuth';
// import Login from './pages/admin/Login';
// import PractitionersList from './pages/admin/PractitionersList';
// import Practices from './pages/admin/Practices';
// import PracticePage from './pages/practices/[slug]';
// import PractitionerPage from './pages/practices/PractitionerPage'
// import Candidatures from './pages/admin/Candidatures'
// import Onboarding from './pages/Onboarding'
// import DiagnosticBubble from './components/DiagnosticBubble';
// import Reservation from './pages/Reservation';
// import ReservationConfirmation from './pages/ReservationConfirmation';
// import CancelReservation from './pages/CancelReservation';
// import CGU from './pages/CGU';
// import Diagnostic from './pages/Diagnostic';
// import Seance from './pages/Seance';
// import OnboardingPaymentReturn from './pages/OnboardingPaymentReturn'
// import OnboardingPaymentRefresh from './pages/OnboardingPaymentRefresh'
// import ModifyReservation from './pages/ModifyReservation'
// import DiagnosticSeance from './pages/DiagnosticSeance'
// import { CookieConsentProvider } from './cookies/CookieConsentProvider';
// import CookieBanner from './cookies/CookieBanner';


// import { HelmetProvider } from 'react-helmet-async';
// import './styles.css';

// function Layout() {
//   const location = useLocation();
//   const path = location.pathname;

//   // Masquer le DiagnosticBubble sur : détail praticien, réservation, confirmation
//   const hideBubble =
//     /^\/practices\/[^/]+\/[^/]+$/.test(path) ||   // détail praticien (2 segments après /practices)
//     path.startsWith('/reservation');               // réservation + confirmation

//   return (
//     <>
//       <TopBar />
//       <Outlet />
//       {!hideBubble && <DiagnosticBubble />}
//     </>
//   );
// }

// export default function App() {
//   const [lang, setLangState] = useState(() => localStorage.getItem('idala-lang') || 'fr');
//   const setLang = (l) => { setLangState(l); localStorage.setItem('idala-lang', l); };
//   const [showLoader, setShowLoader] = useState(true);   
//   const [fading, setFading]         = useState(false);  

//     const handleDone = () => {
//     setFading(true);                                 
//     setTimeout(() => setShowLoader(false), 650);     
//   };

//   return (
//     <HelmetProvider>
//       <LangCtx.Provider value={{ lang, setLang }}>
//         <HashRouter>
//           <CookieConsentProvider>
//           <CookieBanner />
        
//           <ScrollToTop />
//           {showLoader && (
//             <div className={`loader${fading ? ' fade-out' : ''}`}>
//               <Loader onDone={handleDone} />
//             </div>
//           )}
//           <Routes>
//             {/* <Route path="/coming-soon" element={<ComingSoon />} /> */}
//               <Route path="/admin/login" element={<Login />} />

//             {/* Routes admin protégées */}
//             <Route element={<RequireAuth />}>
//               <Route path="/admin/praticiens" element={<PractitionersList />} />
//               <Route path="/admin/pratiques"  element={<Practices />} />
//               <Route path="/admin/candidatures"  element={<Candidatures />} />
//             </Route>

//             {/* Route onboarding publique */}
//                <Route path="/onboarding/:token" element={<Onboarding />} />
//                <Route path="/onboarding-paiement/retour" element={<OnboardingPaymentReturn />} />
//                <Route path="/onboarding-paiement/refresh" element={<OnboardingPaymentRefresh />} />
//                <Route path="/annulation/:token" element={<CancelReservation />} />
//                <Route path="/diagnostic" element={<Diagnostic />} />
//                <Route path="/seance/:sessionId" element={<Seance />} />
//                <Route path="/modifier/:token" element={<ModifyReservation />} />
//                <Route path="/diagnostic-seance" element={<DiagnosticSeance />} />


//             <Route element={<Layout />}>
//               <Route path="/"              element={<Home />} />
//               <Route path="/practitioners" element={<Practitioners />} />
//               <Route path="/practices/:slug" element={<PracticePage />} />
//               <Route path="/practices/:practiceSlug/:practitionerSlug" element={<PractitionerPage />} />
//               <Route path="/retreats"   element={<Retreats />} />
//               <Route path="/corporate"  element={<Corporate />} />
//               <Route path="/spiritual"     element={<Spiritual />} />
//               <Route path="/astrology"     element={<Astrology />} />
//               <Route path="/about"         element={<About />} />
//               <Route path="/join" element={<JoinUs />} />
//               <Route path="/reservation/confirmation" element={<ReservationConfirmation />} />
//               <Route path="/reservation/:praticienSlug/:pratiqueSlug/:offreId" element={<Reservation />} />
//               <Route path="*" element={<NotFound />} />
//               <Route path="/cgu" element={<CGU />} />
//             </Route>
//           </Routes>
//           </CookieConsentProvider>  
//         </HashRouter>
//       </LangCtx.Provider>
//     </HelmetProvider>
//   );
// }

import { useState, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { LangCtx } from './components/LangContext';
import TopBar      from './components/TopBar';
import Loader      from './components/Loader';
import ScrollToTop from './components/ScrollToTop';
import RequireAuth from './components/RequireAuth';
import DiagnosticBubble from './components/DiagnosticBubble';
import { CookieConsentProvider } from './cookies/CookieConsentProvider';
import CookieBanner from './cookies/CookieBanner';
import { HelmetProvider } from 'react-helmet-async';
import './styles.css';

// Pages chargées à la demande (code splitting)
const Home        = lazy(() => import('./pages/Home'));
const Practitioners = lazy(() => import('./pages/Practitioners'));
const Spiritual   = lazy(() => import('./pages/Spiritual'));
const Retreats    = lazy(() => import('./pages/Retreats'));
const Corporate   = lazy(() => import('./pages/Corporate'));
const Astrology   = lazy(() => import('./pages/Astrology'));
const About       = lazy(() => import('./pages/About'));
const NotFound    = lazy(() => import('./pages/NotFound'));
const JoinUs      = lazy(() => import('./pages/JoinUs'));
const Login       = lazy(() => import('./pages/admin/Login'));
const PractitionersList = lazy(() => import('./pages/admin/PractitionersList'));
const Practices   = lazy(() => import('./pages/admin/Practices'));
const PracticePage = lazy(() => import('./pages/practices/[slug]'));
const PractitionerPage = lazy(() => import('./pages/practices/PractitionerPage'));
const Candidatures = lazy(() => import('./pages/admin/Candidatures'));
const Onboarding  = lazy(() => import('./pages/Onboarding'));
const Reservation = lazy(() => import('./pages/Reservation'));
const ReservationConfirmation = lazy(() => import('./pages/ReservationConfirmation'));
const CancelReservation = lazy(() => import('./pages/CancelReservation'));
const CGU         = lazy(() => import('./pages/CGU'));
const Diagnostic  = lazy(() => import('./pages/Diagnostic'));
const Seance      = lazy(() => import('./pages/Seance'));
const OnboardingPaymentReturn = lazy(() => import('./pages/OnboardingPaymentReturn'));
const OnboardingPaymentRefresh = lazy(() => import('./pages/OnboardingPaymentRefresh'));
const ModifyReservation = lazy(() => import('./pages/ModifyReservation'));
const DiagnosticSeance = lazy(() => import('./pages/DiagnosticSeance'));

function Layout() {
  const location = useLocation();
  const path = location.pathname;

  const hideBubble =
    /^\/practices\/[^/]+\/[^/]+$/.test(path) ||
    path.startsWith('/reservation');

  return (
    <>
      <TopBar />
      <Outlet />
      {!hideBubble && <DiagnosticBubble />}
    </>
  );
}

export default function App() {
  const [lang, setLangState] = useState(() => localStorage.getItem('idala-lang') || 'fr');
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
          <CookieConsentProvider>
          <CookieBanner />

          <ScrollToTop />
          {showLoader && (
            <div className={`loader${fading ? ' fade-out' : ''}`}>
              <Loader onDone={handleDone} />
            </div>
          )}
          <Suspense fallback={null}>
          <Routes>
              <Route path="/admin/login" element={<Login />} />

            <Route element={<RequireAuth />}>
              <Route path="/admin/praticiens" element={<PractitionersList />} />
              <Route path="/admin/pratiques"  element={<Practices />} />
              <Route path="/admin/candidatures"  element={<Candidatures />} />
            </Route>

               <Route path="/onboarding/:token" element={<Onboarding />} />
               <Route path="/onboarding-paiement/retour" element={<OnboardingPaymentReturn />} />
               <Route path="/onboarding-paiement/refresh" element={<OnboardingPaymentRefresh />} />
               <Route path="/annulation/:token" element={<CancelReservation />} />
               <Route path="/diagnostic" element={<Diagnostic />} />
               <Route path="/seance/:sessionId" element={<Seance />} />
               <Route path="/modifier/:token" element={<ModifyReservation />} />
               <Route path="/diagnostic-seance" element={<DiagnosticSeance />} />

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
          </Suspense>
          </CookieConsentProvider>
        </HashRouter>
      </LangCtx.Provider>
    </HelmetProvider>
  );
}