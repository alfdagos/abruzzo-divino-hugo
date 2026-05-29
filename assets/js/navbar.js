// Navbar: aggiunge classe .is-scrolled dopo 50px di scroll (cambia sfondo+colori
// via CSS) e gestisce il toggle del mobile menu.
(function () {
  const nav = document.getElementById('site-navbar');
  if (!nav) return;

  // Scroll state
  const onScroll = () => {
    if (window.scrollY > 50) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile menu toggle
  const toggle = nav.querySelector('[data-menu-toggle]');
  const menu = document.getElementById('mobile-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
})();
