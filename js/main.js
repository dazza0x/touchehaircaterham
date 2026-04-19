/* Touché Hairdressing — Caterham | Main JS */

(function () {
  'use strict';

  /* ── Mobile nav ── */
  const hamburger = document.querySelector('.nav__hamburger');
  const mobileMenu = document.querySelector('.nav__mobile');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
      const open = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });

    // Close on link click
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', false);
        document.body.style.overflow = '';
      });
    });
  }

  /* ── Sticky nav shadow ── */
  const nav = document.querySelector('.nav');
  if (nav) {
    window.addEventListener('scroll', function () {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  /* ── Active nav link ── */
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.nav__links a, .nav__mobile a').forEach(function (link) {
    const linkPath = new URL(link.href).pathname.replace(/\/$/, '') || '/';
    if (linkPath === currentPath) {
      link.classList.add('active');
    }
  });

  /* ── FAQ accordion ── */
  document.querySelectorAll('.faq-question').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      // Close all
      document.querySelectorAll('.faq-item.open').forEach(function (el) {
        el.classList.remove('open');
      });
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ── Scroll-triggered reveals ──
     Any element with [data-reveal] or [data-reveal-stagger] fades/slides in
     when it crosses ~12% into the viewport. One-shot: once revealed, we stop
     observing. Falls back to instant-visible if IntersectionObserver is
     unavailable. prefers-reduced-motion is handled in CSS (forces visible). */
  const revealTargets = document.querySelectorAll('[data-reveal], [data-reveal-stagger]');
  if (revealTargets.length) {
    if (!('IntersectionObserver' in window)) {
      revealTargets.forEach(function (el) { el.classList.add('is-revealed'); });
    } else {
      const revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

      revealTargets.forEach(function (el) { revealObserver.observe(el); });
    }
  }

  /* ── Contact form submission ── */
  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const btn = contactForm.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.textContent = 'Sending…';
      btn.disabled = true;
      // Simulate — replace with real form handler (Formspree, Netlify Forms, etc.)
      setTimeout(function () {
        const msg = document.createElement('p');
        msg.style.cssText = 'margin-top:1rem;color:#4a7c4e;font-weight:700;font-size:.9rem;';
        msg.textContent = 'Thank you! We\'ll be in touch shortly.';
        contactForm.appendChild(msg);
        contactForm.reset();
        btn.textContent = originalText;
        btn.disabled = false;
      }, 1200);
    });
  }

})();
