// Year in footer
document.addEventListener('DOMContentLoaded', () => {
  const y = document.getElementById('y');
  if (y) y.textContent = new Date().getFullYear();

  initContactForm();
});

// On-scroll reveal (adds .inview; metrics count-up)
(() => {
  const targets = [...document.querySelectorAll('.reveal, [data-count]')];
  if (!('IntersectionObserver' in window) || !targets.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const t = e.target;

      // reveal
      if (t.classList.contains('reveal')) t.classList.add('inview');

      // count-up numbers
      if (t.hasAttribute('data-count')) countUp(t);

      io.unobserve(t);
    });
  }, {rootMargin: '0px 0px -15% 0px', threshold: 0.15});

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
    if (window.scrollY > 8) hdr.classList.add('scrolled');
    else hdr.classList.remove('scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, {passive:true});
})();

function initContactForm(){
  const form = document.querySelector('form[name="contact"]');
  if (!form) return;

  const statusNode = form.querySelector('[data-form-status]');
  const submitBtn = form.querySelector('button[type="submit"]');
  const fieldConfigs = [
    {name: 'name', required: true, message: 'Please enter your name.'},
    {name: 'company', required: false},
    {name: 'email', required: true, message: 'A valid email helps us reach you.'},
    {name: 'phone', required: false},
    {name: 'message', required: true, message: 'Let us know what role you need help filling.'}
  ];

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const resetStatus = () => {
    if (!statusNode) return;
    statusNode.textContent = '';
    statusNode.className = 'form-status';
  };

  const setStatus = (type, message) => {
    if (!statusNode) return;
    statusNode.textContent = message;
    statusNode.className = `form-status ${type}`;
  };

  const setFieldError = (field, message) => {
    const errorNode = field && field.getAttribute('aria-describedby')
      ? document.getElementById(field.getAttribute('aria-describedby'))
      : null;
    if (!field || !errorNode) return;
    if (message) {
      field.classList.add('input-error');
      field.setAttribute('aria-invalid', 'true');
      errorNode.textContent = message;
    } else {
      field.classList.remove('input-error');
      field.removeAttribute('aria-invalid');
      errorNode.textContent = '';
    }
  };

  const validateField = (config) => {
    const field = form.elements.namedItem(config.name);
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) return false;
    const value = field.value.trim();

    if (config.required && !value) {
      setFieldError(field, config.message || 'This field is required.');
      return true;
    }

    if (config.name === 'email' && value && !emailPattern.test(value)) {
      setFieldError(field, 'Enter a valid email address.');
      return true;
    }

    setFieldError(field, '');
    return false;
  };

  form.addEventListener('input', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
    const config = fieldConfigs.find((f) => f.name === target.name);
    if (config) validateField(config);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    resetStatus();

    let hasErrors = false;
    fieldConfigs.forEach((config) => {
      const invalid = validateField(config);
      if (invalid) hasErrors = true;
    });
    if (hasErrors) {
      setStatus('error', 'Please fix the highlighted fields and try again.');
      return;
    }

    const payload = {};
    fieldConfigs.forEach((config) => {
      const field = form.elements.namedItem(config.name);
      if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
        payload[config.name] = field.value.trim();
      }
    });

    form.classList.add('is-submitting');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Network response was not ok');

      form.reset();
      fieldConfigs.forEach((config) => {
        const field = form.elements.namedItem(config.name);
        if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
          setFieldError(field, '');
        }
      });

      setStatus('success', 'Thanks! We received your message and will be in touch shortly.');

      const analyticsPayload = {
        formName: 'contact',
        timestamp: new Date().toISOString()
      };
      if (Array.isArray(window.dataLayer)) {
        window.dataLayer.push({event: 'contact_form_submitted', ...analyticsPayload});
      }
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'contact_form_submitted', analyticsPayload);
      }
      if (window.analytics && typeof window.analytics.track === 'function') {
        window.analytics.track('Contact Form Submitted', {...analyticsPayload, email: payload.email});
      }
    } catch (error) {
      console.error('Contact form submission failed', error);
      setStatus('error', 'We could not send your message right now. Please try again or email kathryn@capitalretainedsearch.com.');
    } finally {
      form.classList.remove('is-submitting');
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

