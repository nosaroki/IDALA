/* ============================================================
   THE IDALA FAMILY — Nav HTML injector
   Include this after nav.js in every page:
     <script src="nav-html.js"></script>
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  const nav = `
  <header class="topbar">
    <div class="topbar-brand">THE IDALA FAMILY</div>
    <nav class="topbar-nav">
      <a href="index.html" data-page="index.html">
        <span class="en">Home</span><span class="fr">Accueil</span>
      </a>
      <a href="practitioners.html" data-page="practitioners.html">
        <span class="en">Practitioners</span><span class="fr">Praticiens</span>
      </a>
      <a href="spiritual.html" data-page="spiritual.html">
        <span class="en">Spiritual Guidance</span><span class="fr">Guidance Spirituelle</span>
      </a>
      <a href="astrology.html" data-page="astrology.html">
        <span class="en">Birth Chart</span><span class="fr">Thème Astral</span>
      </a>
      <a href="about.html" data-page="about.html">
        <span class="en">About</span><span class="fr">À propos</span>
      </a>
      <div class="lang-toggle">
        <button class="lang-btn" data-lang="en" onclick="setLang('en')">EN</button>
        <button class="lang-btn" data-lang="fr" onclick="setLang('fr')">FR</button>
      </div>
    </nav>
  </header>`;

  document.body.insertAdjacentHTML('afterbegin', nav);

  // re-highlight active page after injection
  const file = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.topbar-nav a[data-page]').forEach(a => {
    if (a.dataset.page === file) a.classList.add('active');
  });

  // re-apply saved lang so nav labels render correctly
  const saved = localStorage.getItem('idala-lang') || 'en';
  applyLang(saved);
});
