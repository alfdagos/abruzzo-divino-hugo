// Cookie consent GDPR (DECISIONS #19). Mostra il banner finché l'utente non
// sceglie; alla scelta aggiorna Google Consent Mode v2 e salva in localStorage.
(function () {
  var KEY = 'cookie_consent';
  var banner = document.getElementById('cookie-banner');
  if (!banner) return;

  var stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) {}
  if (!stored) banner.classList.add('is-visible');

  function decide(value) {
    try { localStorage.setItem(KEY, value); } catch (e) {}
    if (value === 'granted' && typeof window.gtag === 'function') {
      window.gtag('consent', 'update', { 'analytics_storage': 'granted' });
    }
    banner.classList.remove('is-visible');
  }

  var accept = banner.querySelector('[data-cookie-accept]');
  var reject = banner.querySelector('[data-cookie-reject]');
  if (accept) accept.addEventListener('click', function () { decide('granted'); });
  if (reject) reject.addEventListener('click', function () { decide('denied'); });
})();
