// ─────────────────────────────────────────
//  LOADER  (lotus + 7 orbiting chakra dots)
// ─────────────────────────────────────────
import { useState, useEffect } from 'react';


function Loader({ onDone }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setReady(true), 800);
    const t2 = setTimeout(() => onDone(), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  const RADIUS = 68;
  const COLORS = ['var(--c1)','var(--c2)','var(--c3)','var(--c4)','var(--c5)','var(--c6)','var(--c7)'];

  return (
    <>
      <div className={`loader-orbit${ready ? ' ready' : ''}`}>
        <div className="loader-ring" />
        {COLORS.map((color, i) => {
          const angle = (i / COLORS.length) * 360 - 90;
          const rad   = angle * (Math.PI / 180);
          const cx    = 80 + RADIUS * Math.cos(rad);
          const cy    = 80 + RADIUS * Math.sin(rad);
          return (
            <span
              key={i}
              className="loader-dot"
              style={{ background: color, left: cx, top: cy }}
            />
          );
        })}

        {/* Lotus SVG */}
        <svg className="loader-lotus" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="50" cy="38" rx="8"  ry="18" fill="var(--c6)" opacity=".75" />
          <ellipse cx="50" cy="38" rx="8"  ry="18" fill="var(--c5)" opacity=".65" transform="rotate(-30 50 58)" />
          <ellipse cx="50" cy="38" rx="8"  ry="18" fill="var(--c7)" opacity=".65" transform="rotate(30 50 58)" />
          <ellipse cx="50" cy="38" rx="6"  ry="16" fill="var(--c4)" opacity=".55" transform="rotate(-55 50 60)" />
          <ellipse cx="50" cy="38" rx="6"  ry="16" fill="var(--c2)" opacity=".55" transform="rotate(55 50 60)" />
          <ellipse cx="50" cy="38" rx="5"  ry="14" fill="var(--c4)" opacity=".38" transform="rotate(-80 50 62)" />
          <ellipse cx="50" cy="38" rx="5"  ry="14" fill="var(--c4)" opacity=".38" transform="rotate(80 50 62)" />
          <circle cx="50" cy="56" r="8" fill="var(--gold)" opacity=".88" />
          <circle cx="50" cy="56" r="4" fill="white"      opacity=".92" />
          <line x1="20" y1="68" x2="80" y2="68" stroke="var(--gold-light)" strokeWidth="1" opacity=".5" />
          <line x1="50" y1="68" x2="50" y2="80" stroke="var(--c4)"         strokeWidth="2" opacity=".45" />
        </svg>
      </div>
      <div className="loader-label">THE IDALA FAMILY</div>
    </>
  );
}

export default Loader;