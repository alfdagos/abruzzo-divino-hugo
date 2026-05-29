// Fade-in al primo scroll-into-view, una sola volta per elemento.
// Markup: <h2 data-scroll-fade> ... </h2>
(function () {
  const els = document.querySelectorAll('[data-scroll-fade]');
  if (!els.length || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );
  els.forEach((el) => obs.observe(el));
})();
