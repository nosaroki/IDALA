/* ============================================================
   THE IDALA FAMILY — Shared Navigation & Language Logic
   nav.js
   ============================================================ */

/* ----- Language ----- */
(function () {
  // Restore saved language on load
  const saved = localStorage.getItem('idala-lang') || 'en';
  applyLang(saved);

  // Highlight active nav link based on current file
  const file = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.topbar-nav a[data-page]').forEach(a => {
    if (a.dataset.page === file) a.classList.add('active');
  });
})();

function setLang(lang) {
  localStorage.setItem('idala-lang', lang);
  applyLang(lang);
}

function applyLang(lang) {
  if (lang === 'fr') {
    document.body.classList.add('lang-fr');
  } else {
    document.body.classList.remove('lang-fr');
  }
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === lang);
  });
}

/* ----- Testimonials carousel ----- */
function initTestimonials() {
  const track = document.getElementById('testimonialsTrack');
  if (!track) return;

  const BASE = 44; // seconds
  let dur = BASE;

  document.getElementById('prevBtn')?.addEventListener('click', () => {
    dur = Math.min(dur * 1.4, 120);
    track.style.animationDuration = dur + 's';
  });
  document.getElementById('nextBtn')?.addEventListener('click', () => {
    dur = Math.max(dur * 0.65, 8);
    track.style.animationDuration = dur + 's';
  });
}

document.addEventListener('DOMContentLoaded', initTestimonials);
