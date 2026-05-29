// Parallax verticale del background hero: translateY = scrollY * 0.5.
// Usa requestAnimationFrame per evitare jank.
(function () {
  const target = document.querySelector('[data-parallax-hero]');
  if (!target) return;
  let scheduled = false;
  let lastY = 0;
  function update() {
    target.style.transform = 'translate3d(0, ' + lastY * 0.5 + 'px, 0)';
    scheduled = false;
  }
  window.addEventListener(
    'scroll',
    () => {
      lastY = window.scrollY;
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );
})();
