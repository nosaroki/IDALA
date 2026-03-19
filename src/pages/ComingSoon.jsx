// ─────────────────────────────────────────
//  COMING SOON
// ─────────────────────────────────────────

import { useLang } from '../components/LangContext'; 
// import logoidala from '../assets/logoidala.png';

function ComingSoon() {
  const { lang, setLang } = useLang(); 


  return (
    <div className="coming-soon">
      <div className="coming-soon__logo">
        {/* <div className="circle-logo circle-logo--main">
          <img src={logoidala} alt="IDALA Logo" className="coming-soon__logo-img" />
        </div> */}
      </div>

      <span className="eyebrow coming-soon__eyebrow">THE IDALA FAMILY</span>
      <h1 className="coming-soon__title">{lang==='fr'?'Bientôt disponible':'Coming Soon'}</h1>
      <div className="divider divider--center coming-soon__divider"/>
      <p className="coming-soon__subtitle">
        {lang==='fr'
          ?"Nous construisons quelque chose de beau.\nUne plateforme de bien-être holistique conçue pour connecter, aligner et élever."
          :"We are building something beautiful.\nA holistic wellness platform designed to connect, align and elevate."}
      </p>

      <div className="coming-soon__chakra-row">
        {['c1','c2','c3','c4','c5','c6','c7'].map(c=>(
          <div key={c} className="coming-soon__dot" style={{background:`var(--${c})`}}/>
        ))}
      </div>

      <div className="coming-soon__lang-row">
        <button className={`lang-btn${lang==='en'?' active':''}`} onClick={()=>setLang('en')}>EN</button>
        <button className={`lang-btn${lang==='fr'?' active':''}`} onClick={()=>setLang('fr')}>FR</button>
      </div>

      <div className="coming-soon__credit">© 2026 The Idala Family — The Mindful Links</div>
    </div>
  );
}

export default ComingSoon;