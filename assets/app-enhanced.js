// ===== ENHANCED JAVASCRIPT - Building on existing functionality =====

// Import existing functionality
const loadExistingScripts = () => {
  const script = document.createElement('script');
  script.src = '/assets/app.js';
  document.head.appendChild(script);
};

// Configuration
const CONFIG = {
  API_URL: 'https://api.capitalretainedsearch.com',
  API_TOKEN: process.env.CRS_API_TOKEN || 'bd0c454e-33c0-4577-80e1-d4aeda7e395d', // Replace with actual token
  FORM_ENDPOINT: '/api/contact',
  ANALYTICS_ID: 'UA-XXXXXXXXX-X',
  RECAPTCHA_SITE_KEY: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI' // Replace with actual key
};

// ===== FORM HANDLING WITH API =====
class ContactForm {
  constructor() {
    this.form = document.getElementById('contact-form');
    this.submitBtn = document.getElementById('submit-btn');
    this.formStatus = document.getElementById('form-status');
    this.notification = document.getElementById('notification');
    
    if (this.form) {
      this.init();
    }
  }
  
  init() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    
    // Real-time validation
    this.form.querySelectorAll('input, textarea, select').forEach(field => {
      field.addEventListener('blur', () => this.validateField(field));
      field.addEventListener('input', () => this.clearError(field));
    });
    
    // Phone number formatting
    const phoneField = document.getElementById('phone');
    if (phoneField) {
      phoneField.addEventListener('input', (e) => this.formatPhone(e));
    }
  }
  
  formatPhone(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 6) {
      value = `${value.slice(0, 3)}-${value.slice(3, 6)}-${value.slice(6, 10)}`;
    } else if (value.length >= 3) {
      value = `${value.slice(0, 3)}-${value.slice(3)}`;
    }
    e.target.value = value;
  }
  
  validateField(field) {
    const errorElement = document.getElementById(`${field.id}-error`);
    if (!errorElement) return;
    
    let isValid = true;
    let errorMessage = '';
    
    // Required fields
    if (field.hasAttribute('required') && !field.value.trim()) {
      isValid = false;
      errorMessage = 'This field is required';
    }
    
    // Email validation
    if (field.type === 'email' && field.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(field.value)) {
        isValid = false;
        errorMessage = 'Please enter a valid email address';
      }
    }
    
    // Phone validation
    if (field.type === 'tel' && field.value) {
      const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
      if (!phoneRegex.test(field.value)) {
        isValid = false;
        errorMessage = 'Please enter a valid phone number (xxx-xxx-xxxx)';
      }
    }
    
    if (!isValid) {
      field.classList.add('error');
      errorElement.textContent = errorMessage;
      errorElement.classList.add('show');
    } else {
      this.clearError(field);
    }
    
    return isValid;
  }
  
  clearError(field) {
    field.classList.remove('error');
    const errorElement = document.getElementById(`${field.id}-error`);
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.classList.remove('show');
    }
  }
  
  async handleSubmit(e) {
    e.preventDefault();
    
    // Validate all fields
    const fields = this.form.querySelectorAll('input[required], textarea[required]');
    let isValid = true;
    
    fields.forEach(field => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });
    
    if (!isValid) {
      this.showNotification('Please fix the errors in the form', 'error');
      return;
    }
    
    // Show loading state
    this.setLoading(true);
    
    // Prepare form data
    const formData = new FormData(this.form);
    const data = Object.fromEntries(formData);
    
    // Add metadata
    data.timestamp = new Date().toISOString();
    data.source = 'website';
    data.page = window.location.pathname;
    
    try {
      // Send to API
      const response = await this.sendToAPI(data);
      
      if (response.ok) {
        this.handleSuccess();
      } else {
        throw new Error('Failed to submit form');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      this.handleError(error);
    } finally {
      this.setLoading(false);
    }
  }
  
  async sendToAPI(data) {
    // Option 1: Send to your custom API
    if (CONFIG.API_URL && CONFIG.API_TOKEN) {
      return await fetch(`${CONFIG.API_URL}${CONFIG.FORM_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.API_TOKEN}`,
        },
        body: JSON.stringify(data)
      });
    }
    
    // Option 2: Use Netlify Forms (if deployed on Netlify)
    const formData = new FormData(this.form);
    return await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(formData).toString()
    });
  }
  
  handleSuccess() {
    // Clear form
    this.form.reset();
    
    // Show success message
    this.showFormStatus('Thank you! We\'ll be in touch within 24 hours.', 'success');
    this.showNotification('Your message has been sent successfully!', 'success');
    
    // Track conversion
    this.trackEvent('Form', 'Submit', 'Contact');
    
    // Redirect after delay (optional)
    setTimeout(() => {
      window.location.href = '/thank-you';
    }, 3000);
  }
  
  handleError(error) {
    this.showFormStatus('Something went wrong. Please try again or email us directly.', 'error');
    this.showNotification('Failed to send message. Please try again.', 'error');
    
    // Track error
    this.trackEvent('Form', 'Error', error.message);
  }
  
  setLoading(isLoading) {
    if (isLoading) {
      this.submitBtn.classList.add('loading');
      this.submitBtn.disabled = true;
    } else {
      this.submitBtn.classList.remove('loading');
      this.submitBtn.disabled = false;
    }
  }
  
  showFormStatus(message, type) {
    if (!this.formStatus) return;
    
    this.formStatus.textContent = message;
    this.formStatus.className = `form-status ${type}`;
    this.formStatus.style.display = 'block';
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      this.formStatus.style.display = 'none';
    }, 10000);
  }
  
  showNotification(message, type) {
    if (!this.notification) return;
    
    this.notification.textContent = message;
    this.notification.className = `notification ${type} show`;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.notification.classList.remove('show');
    }, 5000);
  }
  
  trackEvent(category, action, label) {
    // Google Analytics tracking
    if (typeof gtag !== 'undefined') {
      gtag('event', action, {
        event_category: category,
        event_label: label
      });
    }
    
    // Custom analytics
    if (CONFIG.API_URL) {
      fetch(`${CONFIG.API_URL}/api/analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.API_TOKEN}`,
        },
        body: JSON.stringify({
          category,
          action,
          label,
          timestamp: new Date().toISOString(),
          page: window.location.pathname
        })
      }).catch(console.error);
    }
  }
}

// ===== ENHANCED TIMELINE INTERACTION =====
class InteractiveTimeline {
  constructor() {
    this.timeline = document.querySelector('.timeline-enhanced');
    if (!this.timeline) return;
    
    this.items = this.timeline.querySelectorAll('.timeline-item');
    this.init();
  }
  
  init() {
    this.items.forEach((item, index) => {
      item.addEventListener('click', () => this.activateItem(index));
      item.addEventListener('mouseenter', () => this.showDetails(item));
      item.addEventListener('mouseleave', () => this.hideDetails(item));
    });
    
    // Auto-progress through timeline
    this.startAutoProgress();
  }
  
  activateItem(index) {
    this.items.forEach((item, i) => {
      if (i <= index) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }
  
  showDetails(item) {
    const details = item.querySelector('.timeline-details');
    if (details) {
      details.style.maxHeight = details.scrollHeight + 'px';
    }
  }
  
  hideDetails(item) {
    const details = item.querySelector('.timeline-details');
    if (details && !item.classList.contains('active')) {
      details.style.maxHeight = '0';
    }
  }
  
  startAutoProgress() {
    let currentIndex = 0;
    
    setInterval(() => {
      this.activateItem(currentIndex);
      currentIndex = (currentIndex + 1) % this.items.length;
    }, 3000);
  }
}

// ===== SMOOTH SCROLL WITH OFFSET =====
class SmoothScroll {
  constructor() {
    this.offset = 80; // Topbar height
    this.init();
  }
  
  init() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => this.handleClick(e));
    });
  }
  
  handleClick(e) {
    const href = e.currentTarget.getAttribute('href');
    if (href === '#') return;
    
    e.preventDefault();
    const target = document.querySelector(href);
    
    if (target) {
      const top = target.offsetTop - this.offset;
      window.scrollTo({
        top,
        behavior: 'smooth'
      });
      
      // Update URL without jumping
      history.pushState(null, null, href);
    }
  }
}

// ===== LAZY LOADING FOR IMAGES =====
class LazyLoader {
  constructor() {
    this.images = document.querySelectorAll('img[data-src]');
    this.imageOptions = {
      threshold: 0,
      rootMargin: '0px 0px 50px 0px'
    };
    
    if ('IntersectionObserver' in window) {
      this.init();
    } else {
      this.loadAllImages();
    }
  }
  
  init() {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          this.loadImage(img);
          imageObserver.unobserve(img);
        }
      });
    }, this.imageOptions);
    
    this.images.forEach(img => imageObserver.observe(img));
  }
  
  loadImage(img) {
    img.src = img.dataset.src;
    img.removeAttribute('data-src');
    img.classList.add('loaded');
  }
  
  loadAllImages() {
    this.images.forEach(img => this.loadImage(img));
  }
}

// ===== PERFORMANCE MONITORING =====
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.init();
  }
  
  init() {
    // Core Web Vitals
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
        this.sendMetrics();
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      
      // First Input Delay
      new PerformanceObserver((entryList) => {
        const firstInput = entryList.getEntries()[0];
        this.metrics.fid = firstInput.processingStart - firstInput.startTime;
        this.sendMetrics();
      }).observe({ type: 'first-input', buffered: true });
      
      // Cumulative Layout Shift
      let clsValue = 0;
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        this.metrics.cls = clsValue;
        this.sendMetrics();
      }).observe({ type: 'layout-shift', buffered: true });
    }
  }
  
  sendMetrics() {
    if (CONFIG.API_URL) {
      fetch(`${CONFIG.API_URL}/api/metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.API_TOKEN}`,
        },
        body: JSON.stringify({
          ...this.metrics,
          timestamp: new Date().toISOString(),
          page: window.location.pathname,
          userAgent: navigator.userAgent
        })
      }).catch(console.error);
    }
  }
}

// ===== COOKIE CONSENT (GDPR) =====
class CookieConsent {
  constructor() {
    this.cookieName = 'crs_cookie_consent';
    this.consentGiven = this.checkConsent();
    
    if (!this.consentGiven) {
      this.showBanner();
    }
  }
  
  checkConsent() {
    return document.cookie.includes(this.cookieName + '=true');
  }
  
  showBanner() {
    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.innerHTML = `
      <div class="cookie-content">
        <p>We use cookies to enhance your experience. By continuing, you agree to our use of cookies.</p>
        <div class="cookie-actions">
          <button class="btn btn-outline btn-sm" id="cookie-settings">Settings</button>
          <button class="btn btn-primary btn-sm" id="cookie-accept">Accept</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(banner);
    
    document.getElementById('cookie-accept').addEventListener('click', () => {
      this.acceptCookies();
      banner.remove();
    });
    
    document.getElementById('cookie-settings').addEventListener('click', () => {
      this.showSettings();
    });
    
    // Show banner with animation
    setTimeout(() => banner.classList.add('show'), 100);
  }
  
  acceptCookies() {
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `${this.cookieName}=true; expires=${expires.toUTCString()}; path=/`;
    
    // Initialize analytics after consent
    this.initAnalytics();
  }
  
  showSettings() {
    // Implement cookie settings modal
    console.log('Cookie settings - to be implemented');
  }
  
  initAnalytics() {
    // Initialize Google Analytics
    if (CONFIG.ANALYTICS_ID) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${CONFIG.ANALYTICS_ID}`;
      document.head.appendChild(script);
      
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', CONFIG.ANALYTICS_ID);
    }
  }
}

// ===== ACCESSIBILITY ENHANCEMENTS =====
class AccessibilityHelper {
  constructor() {
    this.init();
  }
  
  init() {
    // Skip links
    this.enhanceSkipLinks();
    
    // Keyboard navigation
    this.setupKeyboardNav();
    
    // ARIA live regions
    this.setupLiveRegions();
    
    // Focus management
    this.manageFocus();
  }
  
  enhanceSkipLinks() {
    const skipLink = document.querySelector('.skip');
    if (skipLink) {
      skipLink.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(skipLink.getAttribute('href'));
        if (target) {
          target.tabIndex = -1;
          target.focus();
        }
      });
    }
  }
  
  setupKeyboardNav() {
    document.addEventListener('keydown', (e) => {
      // Escape key closes modals
      if (e.key === 'Escape') {
        this.closeActiveModal();
      }
      
      // Tab trapping in modals
      if (e.key === 'Tab') {
        this.handleTabKey(e);
      }
    });
  }
  
  setupLiveRegions() {
    // Form status announcements
    const formStatus = document.getElementById('form-status');
    if (formStatus) {
      formStatus.setAttribute('role', 'status');
      formStatus.setAttribute('aria-live', 'polite');
    }
    
    // Notification announcements
    const notification = document.getElementById('notification');
    if (notification) {
      notification.setAttribute('role', 'alert');
      notification.setAttribute('aria-live', 'assertive');
    }
  }
  
  manageFocus() {
    // Restore focus after modal close
    let previousFocus = null;
    
    document.addEventListener('modal-open', (e) => {
      previousFocus = document.activeElement;
      e.detail.modal.focus();
    });
    
    document.addEventListener('modal-close', () => {
      if (previousFocus) {
        previousFocus.focus();
        previousFocus = null;
      }
    });
  }
  
  closeActiveModal() {
    const activeModal = document.querySelector('.modal.active');
    if (activeModal) {
      activeModal.classList.remove('active');
      document.dispatchEvent(new Event('modal-close'));
    }
  }
  
  handleTabKey(e) {
    const activeModal = document.querySelector('.modal.active');
    if (!activeModal) return;
    
    const focusableElements = activeModal.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="email"], input[type="tel"], select'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey && document.activeElement === firstElement) {
      lastElement.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      firstElement.focus();
      e.preventDefault();
    }
  }
}

// ===== SERVICE WORKER FOR OFFLINE =====
class ServiceWorkerManager {
  constructor() {
    if ('serviceWorker' in navigator) {
      this.register();
    }
  }
  
  async register() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            this.showUpdateNotification();
          }
        });
      });
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
  
  showUpdateNotification() {
    const notification = document.getElementById('notification');
    if (notification) {
      notification.textContent = 'A new version is available. Please refresh the page.';
      notification.className = 'notification info show';
    }
  }
}

// ===== INITIALIZE EVERYTHING =====
document.addEventListener('DOMContentLoaded', () => {
  // Load existing scripts
  loadExistingScripts();
  
  // Initialize enhanced features
  new ContactForm();
  new InteractiveTimeline();
  new SmoothScroll();
  new LazyLoader();
  new PerformanceMonitor();
  new CookieConsent();
  new AccessibilityHelper();
  new ServiceWorkerManager();
  
  // Add page-specific animations
  initializeAnimations();
  
  // Initialize chat widget (if needed)
  initializeChatWidget();
});

// ===== PAGE ANIMATIONS =====
function initializeAnimations() {
  // Parallax effect on hero
  const hero = document.querySelector('.hero');
  if (hero) {
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      const parallax = scrolled * 0.5;
      hero.style.backgroundPositionY = `calc(35% + ${parallax}px)`;
    });
  }
  
  // Typing effect for hero title
  const heroTitle = document.querySelector('.display');
  if (heroTitle) {
    const text = heroTitle.textContent;
    heroTitle.textContent = '';
    heroTitle.style.visibility = 'visible';
    
    let index = 0;
    const typeWriter = () => {
      if (index < text.length) {
        heroTitle.textContent += text.charAt(index);
        index++;
        setTimeout(typeWriter, 50);
      }
    };
    
    // Start typing after page load
    setTimeout(typeWriter, 500);
  }
  
  // Animate metrics on scroll
  const metrics = document.querySelectorAll('[data-count]');
  if (metrics.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateValue(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    
    metrics.forEach(metric => observer.observe(metric));
  }
}

function animateValue(element) {
  const target = parseInt(element.getAttribute('data-count'));
  const suffix = element.getAttribute('data-suffix') || '';
  const duration = 2000;
  const start = 0;
  const increment = target / (duration / 16);
  let current = start;
  
  const updateValue = () => {
    current += increment;
    if (current < target) {
      element.textContent = Math.floor(current) + suffix;
      requestAnimationFrame(updateValue);
    } else {
      element.textContent = target + suffix;
    }
  };
  
  updateValue();
}

// ===== CHAT WIDGET =====
function initializeChatWidget() {
  // Only initialize if enabled
  if (!CONFIG.ENABLE_CHAT) return;
  
  const chatButton = document.createElement('div');
  chatButton.className = 'chat-widget';
  chatButton.innerHTML = `
    <button class="chat-button" aria-label="Open chat">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
        <path d="M12 6C9.79 6 8 7.79 8 10C8 12.21 9.79 14 12 14C14.21 14 16 12.21 16 10C16 7.79 14.21 6 12 6Z" fill="currentColor"/>
      </svg>
      <span class="chat-badge">1</span>
    </button>
  `;
  
  document.body.appendChild(chatButton);
  
  chatButton.querySelector('.chat-button').addEventListener('click', () => {
    openChatWindow();
  });
}

function openChatWindow() {
  // Implement chat window opening logic
  // This could open Intercom, Drift, or custom chat
  console.log('Opening chat window...');
}

// ===== COOKIE BANNER STYLES =====
const cookieStyles = `
.cookie-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #0f213d 0%, #0d1a32 100%);
  color: white;
  padding: 20px;
  transform: translateY(100%);
  transition: transform 0.3s ease;
  z-index: 9998;
  box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.2);
}

.cookie-banner.show {
  transform: translateY(0);
}

.cookie-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.cookie-actions {
  display: flex;
  gap: 12px;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 14px;
}

.chat-widget {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9997;
}

.chat-button {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--gradient-brand);
  border: none;
  color: white;
  box-shadow: var(--shadow-xl);
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-button:hover {
  transform: scale(1.1);
  box-shadow: 0 10px 40px rgba(64, 144, 52, 0.3);
}

.chat-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 20px;
  height: 20px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}
`;

// Inject cookie banner styles
const styleSheet = document.createElement('style');
styleSheet.textContent = cookieStyles;
document.head.appendChild(styleSheet);

// ===== EXPORT FOR TESTING =====
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ContactForm,
    InteractiveTimeline,
    SmoothScroll,
    LazyLoader,
    PerformanceMonitor,
    CookieConsent,
    AccessibilityHelper,
    ServiceWorkerManager
  };
}
