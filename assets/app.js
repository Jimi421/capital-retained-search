// Footer year
document.addEventListener('DOMContentLoaded', () => {
  const y = document.getElementById('y');
  if (y) y.textContent = new Date().getFullYear();
});

// Reveal on scroll + stagger + count-up (CSP-safe)
(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targets = [...document.querySelectorAll('.reveal, [data-count], [data-stagger]')];

  if (!('IntersectionObserver' in window) || !targets.length || prefersReduced) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('inview'));
    document.querySelectorAll('[data-count]').forEach(node => {
      node.textContent = node.getAttribute('data-count') + (node.getAttribute('data-suffix') || '');
    });
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const t = e.target;

      if (t.classList.contains('reveal')) t.classList.add('inview');

      if (t.hasAttribute('data-stagger')) {
        const step = Number(t.getAttribute('data-stagger')) || 90;
        [...t.children].forEach((child, i) => child.style.setProperty('--delay', `${i*step}ms`));
        [...t.children].forEach((child) => {
          child.classList.add('reveal','inview');
          child.style.transitionDelay = `var(--delay)`;
        });
      }

      if (t.hasAttribute('data-count')) countUp(t);

      io.unobserve(t);
    });
  }, { rootMargin: '0px 0px -15% 0px', threshold: 0.15 });

  targets.forEach(el => io.observe(el));
})();

function countUp(node){
  const target = Number(node.getAttribute('data-count'));
  if (Number.isNaN(target)) return;
  const suffix = node.getAttribute('data-suffix') || '';
  const duration = 900;
  const start = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - start)/duration);
    const val = Math.round(target * (1 - Math.pow(1 - p, 3)));
    node.textContent = val + suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// Header shadow on scroll
(() => {
  const hdr = document.querySelector('.topbar');
  if (!hdr) return;
  const onScroll = () => {
    if (window.scrollY > 8) hdr.classList.add('scrolled'); else hdr.classList.remove('scrolled');
  };
  onScroll(); window.addEventListener('scroll', onScroll, {passive:true});
})();

