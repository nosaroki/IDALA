/* ============================================================
   THE IDALA FAMILY — Footer HTML injector
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  const footer = `
  <footer class="site-footer">
    <div class="footer-brand">THE IDALA FAMILY — The Mindful Links</div>
    <div class="footer-copy">
<span class="en">
  © Made by 
  <a href="https://nod-consulting.com" target="_blank" rel="noopener">
    <span class="brand">NOD Consulting</span>
  </a>. 
  All rights reserved.
</span>

<span class="fr">
  © Créé par 
  <a href="https://nod-consulting.com" target="_blank" rel="noopener">
    <span class="brand">NOD Consulting</span>.
  </a>
  Tous droits réservés.
</span>
    </div>
  </footer>`;
  document.body.insertAdjacentHTML('beforeend', footer);
});

