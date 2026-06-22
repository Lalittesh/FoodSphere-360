/* ============================================================
   FoodSphere 360 — script.js
   Shared + page-specific vanilla JS
   ============================================================ */
(() => {
  'use strict';

  /* ---------------------------------------------------------
     Utilities
  --------------------------------------------------------- */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     Navbar: scroll state + mobile toggle
  --------------------------------------------------------- */
  function initNavbar() {
    const nav = $('.navbar');
    if (!nav) return;
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const toggle = $('.nav-toggle');
    const links = $('.nav-links');
    if (toggle && links) {
      toggle.addEventListener('click', () => {
        const open = toggle.classList.toggle('open');
        links.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      $$('.nav-links a').forEach(a => a.addEventListener('click', () => {
        toggle.classList.remove('open');
        links.classList.remove('open');
      }));
    }
  }

  /* ---------------------------------------------------------
     Back to top button
  --------------------------------------------------------- */
  function initBackToTop() {
    const btn = $('.back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 600);
    }, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' }));
  }

  /* ---------------------------------------------------------
     Scroll reveal via IntersectionObserver
  --------------------------------------------------------- */
  function initScrollReveal() {
    const items = $$('.reveal');
    if (!items.length) return;
    if (reducedMotion || !('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    items.forEach(el => io.observe(el));
  }

  /* ---------------------------------------------------------
     Animated counters (stats strip + impact bars)
  --------------------------------------------------------- */
  function animateCount(el, target, duration = 1800, suffix = '') {
    const start = performance.now();
    const startVal = 0;
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      const val = Math.floor(startVal + (target - startVal) * eased);
      el.textContent = val.toLocaleString('en-IN') + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target.toLocaleString('en-IN') + suffix;
    }
    if (reducedMotion) {
      el.textContent = target.toLocaleString('en-IN') + suffix;
      return;
    }
    requestAnimationFrame(tick);
  }

  function initCounters() {
    const nums = $$('.stat-num[data-target]');
    if (!nums.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.target, 10);
          const suffixEl = el.querySelector('.stat-suffix');
          const suffix = suffixEl ? suffixEl.outerHTML : '';
          const numTarget = target;
          // animate a text node before the suffix span
          const start = performance.now();
          const duration = 1900;
          function tick(now) {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            const val = Math.floor(numTarget * eased);
            el.innerHTML = val.toLocaleString('en-IN') + suffix;
            if (p < 1) requestAnimationFrame(tick);
            else el.innerHTML = numTarget.toLocaleString('en-IN') + suffix;
          }
          if (reducedMotion) {
            el.innerHTML = numTarget.toLocaleString('en-IN') + suffix;
          } else {
            requestAnimationFrame(tick);
          }
          io.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    nums.forEach(el => io.observe(el));
  }

  /* ---------------------------------------------------------
     Impact bars (width animation on view)
  --------------------------------------------------------- */
  function initImpactBars() {
    const bars = $$('.ic-bar span[data-width]');
    if (!bars.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.width = entry.target.dataset.width;
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    bars.forEach(el => io.observe(el));
  }

  /* ---------------------------------------------------------
     Timeline: progress fill + step highlight on scroll
  --------------------------------------------------------- */
  function initTimeline() {
    const steps = $$('.timeline-step');
    const fill = $('.timeline-track-fill');
    if (!steps.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('in-view');
      });
      if (fill) {
        const inView = steps.filter(s => s.classList.contains('in-view')).length;
        const pct = (inView / steps.length) * 100;
        fill.style.width = pct + '%';
      }
    }, { threshold: 0.55 });
    steps.forEach(el => io.observe(el));
  }

  /* ---------------------------------------------------------
     Live activity feed
  --------------------------------------------------------- */
  const ACTIVITY_TEMPLATES = [
    { icon: 'donate', color: 'var(--green)', bg: 'var(--sage)', text: '<strong>Spice Route Kitchen</strong> donated 120 meals' },
    { icon: 'accept', color: 'var(--orange)', bg: 'var(--orange-soft)', text: '<strong>Asha Foundation</strong> accepted a food package' },
    { icon: 'waste', color: 'var(--green)', bg: 'var(--sage)', text: 'Food waste reduced by <strong>58 kg</strong> this hour' },
    { icon: 'pickup', color: 'var(--orange)', bg: 'var(--orange-soft)', text: '<strong>Green Leaf Bakery</strong> scheduled a pickup' },
    { icon: 'donate', color: 'var(--green)', bg: 'var(--sage)', text: '<strong>Hotel Meridian</strong> listed surplus banquet food' },
    { icon: 'accept', color: 'var(--orange)', bg: 'var(--orange-soft)', text: '<strong>Sunrise Shelter</strong> matched with a new donor' },
    { icon: 'ai', color: 'var(--green)', bg: 'var(--sage)', text: 'AI verified freshness for <strong>3 new listings</strong>' },
    { icon: 'donate', color: 'var(--green)', bg: 'var(--sage)', text: '<strong>Priya R.</strong> donated a household surplus box' },
    { icon: 'waste', color: 'var(--orange)', bg: 'var(--orange-soft)', text: 'Carbon impact: <strong>140 kg CO₂e</strong> avoided today' },
    { icon: 'accept', color: 'var(--green)', bg: 'var(--sage)', text: '<strong>Little Stars Orphanage</strong> received dinner supplies' },
  ];

  const FEED_ICONS = {
    donate: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7h-9a2 2 0 0 0-2 2v9"/><path d="M14 17H5a2 2 0 0 1-2-2V6"/><path d="M14 3l3 3-3 3"/><path d="M10 21l-3-3 3-3"/></svg>',
    accept: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
    waste: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>',
    pickup: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h11v8H3z"/><path d="M14 11h4l3 3v1h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/></svg>',
    ai: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l1.8 4.6L18 8l-4.2 1.4L12 14l-1.8-4.6L6 8l4.2-1.4z"/><path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9z"/></svg>',
  };

  function timeAgoLabel() {
    return 'Just now';
  }

  function addActivityItem(list) {
    if (!list) return;
    const tpl = ACTIVITY_TEMPLATES[Math.floor(Math.random() * ACTIVITY_TEMPLATES.length)];
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.innerHTML = `
      <div class="ai-icon" style="background:${tpl.bg}; color:${tpl.color}">
        <span style="width:18px;height:18px;display:block;color:${tpl.color}">${FEED_ICONS[tpl.icon]}</span>
      </div>
      <div>
        <p class="ai-text">${tpl.text}</p>
        <p class="ai-time">${timeAgoLabel()}</p>
      </div>`;
    list.prepend(item);
    // age out previous "Just now" labels
    $$('.ai-time', list).forEach((t, i) => { if (i > 0 && t.textContent === 'Just now') t.textContent = 'Moments ago'; });
    const children = Array.from(list.children);
    if (children.length > 8) children.slice(8).forEach(c => c.remove());
  }

  function initActivityFeed() {
    const list = $('#activityList');
    if (!list) return;
    // seed initial items
    for (let i = 0; i < 5; i++) addActivityItem(list);
    setInterval(() => addActivityItem(list), 4200);
  }

  /* ---------------------------------------------------------
     Map markers — randomized tooltips already in HTML; just
     stagger pulse animation delays for organic feel
  --------------------------------------------------------- */
  function initMapMarkers() {
    $$('.map-marker').forEach((m, i) => {
      m.style.animationDelay = (i * 0.4) + 's';
    });
  }

  /* ---------------------------------------------------------
     Testimonial carousel
  --------------------------------------------------------- */
  function initCarousel() {
    const track = $('.carousel-track');
    if (!track) return;
    const slides = $$('.testimonial-slide', track);
    const dotsWrap = $('.carousel-dots');
    let current = 0;
    let timer = null;

    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      if (i === 0) dot.classList.add('active');
      dot.setAttribute('aria-label', `Show testimonial ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    });

    function render() {
      slides.forEach((s, i) => s.classList.toggle('active', i === current));
      $$('button', dotsWrap).forEach((d, i) => d.classList.toggle('active', i === current));
    }
    function goTo(i) {
      current = (i + slides.length) % slides.length;
      render();
      resetTimer();
    }
    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }
    function resetTimer() {
      if (timer) clearInterval(timer);
      if (!reducedMotion) timer = setInterval(next, 6000);
    }

    $('.carousel-arrow.next')?.addEventListener('click', next);
    $('.carousel-arrow.prev')?.addEventListener('click', prev);
    render();
    resetTimer();
  }

  /* ---------------------------------------------------------
     Typing effect (hero sub-line, optional element)
  --------------------------------------------------------- */
  function initTypingEffect() {
    const el = $('#typedText');
    if (!el) return;
    const phrases = ['AI-powered platform', 'Smart NGO matching', 'Real-time impact tracking'];
    let phraseIndex = 0, charIndex = 0, deleting = false;

    function step() {
      const current = phrases[phraseIndex];
      if (!deleting) {
        charIndex++;
        el.textContent = current.slice(0, charIndex);
        if (charIndex === current.length) {
          deleting = true;
          setTimeout(step, 1500);
          return;
        }
      } else {
        charIndex--;
        el.textContent = current.slice(0, charIndex);
        if (charIndex === 0) {
          deleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
        }
      }
      setTimeout(step, deleting ? 35 : 65);
    }
    if (reducedMotion) { el.textContent = phrases[0]; return; }
    step();
  }

  /* ---------------------------------------------------------
     Newsletter form (footer)
  --------------------------------------------------------- */
  function initNewsletter() {
    const form = $('.newsletter-form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = $('input', form);
      if (!input.value || !input.value.includes('@')) {
        showToast('error', 'Enter a valid email', 'We need a working email to send impact updates.');
        return;
      }
      showToast('success', 'Subscribed', `We'll send impact updates to ${input.value}.`);
      input.value = '';
    });
  }

  /* ---------------------------------------------------------
     Toast notifications (global)
  --------------------------------------------------------- */
  function ensureToastStack() {
    let stack = $('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      stack.setAttribute('aria-live', 'polite');
      document.body.appendChild(stack);
    }
    return stack;
  }

  const TOAST_ICONS = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="#1B6B4A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="#E0463A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v5"/><circle cx="12" cy="16" r=".6" fill="#E0463A"/></svg>',
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="#FF7A33" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M10.3 3.9L1.8 18a1.5 1.5 0 0 0 1.3 2.2h17.8a1.5 1.5 0 0 0 1.3-2.2L13.7 3.9a1.5 1.5 0 0 0-2.6 0z"/><circle cx="12" cy="16.5" r=".6" fill="#FF7A33"/></svg>',
  };

  function showToast(type, title, message, duration = 4500) {
    const stack = ensureToastStack();
    const toast = document.createElement('div');
    toast.className = 'toast';
    if (type === 'error') toast.classList.add('toast-error');
    if (type === 'warn') toast.classList.add('toast-warn');
    toast.innerHTML = `
      <span class="toast-icon">${TOAST_ICONS[type] || TOAST_ICONS.success}</span>
      <div class="toast-body"><strong>${title}</strong><span>${message}</span></div>
      <button class="toast-close" aria-label="Dismiss notification">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>`;
    stack.appendChild(toast);
    const remove = () => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 350);
    };
    toast.querySelector('.toast-close').addEventListener('click', remove);
    setTimeout(remove, duration);
  }
  window.FS360Toast = showToast;

  /* ---------------------------------------------------------
     Smooth scroll for in-page anchor links
  --------------------------------------------------------- */
  function initSmoothAnchors() {
    $$('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (id.length < 2) return;
        const target = $(id);
        if (!target) return;
        e.preventDefault();
        const y = target.getBoundingClientRect().top + window.scrollY - 84;
        window.scrollTo({ top: y, behavior: reducedMotion ? 'auto' : 'smooth' });
      });
    });
  }

  /* ---------------------------------------------------------
     Page transitions for nav between pages (login/register/home)
  --------------------------------------------------------- */
  function initPageTransitions() {
    const overlay = document.createElement('div');
    overlay.className = 'page-transition';
    overlay.innerHTML = `<div class="brand-mark"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8 6 6 9 6 13a6 6 0 0 0 12 0c0-4-2-7-6-11z"/></svg></div>`;
    document.body.appendChild(overlay);

    // reveal-in on load
    requestAnimationFrame(() => {
      overlay.classList.add('animate-out');
      setTimeout(() => overlay.remove(), 600);
    });

    $$('a[data-transition]').forEach(a => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (!href || href.startsWith('#') || a.target === '_blank') return;
        e.preventDefault();
        const fresh = document.createElement('div');
        fresh.className = 'page-transition';
        fresh.innerHTML = overlay.innerHTML;
        document.body.appendChild(fresh);
        requestAnimationFrame(() => fresh.classList.add('animate-in'));
        setTimeout(() => { window.location.href = href; }, 500);
      });
    });
  }

  /* ---------------------------------------------------------
     ===========================================================
     AUTH PAGES (login / register)
     ===========================================================
  --------------------------------------------------------- */

  function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  function isValidPhone(v) { return /^[0-9+\-\s()]{7,15}$/.test(v); }

  function setFieldError(fieldEl, msg) {
    const shell = $('.input-shell', fieldEl) || fieldEl;
    const errEl = $('.field-error', fieldEl);
    shell.classList.add('error');
    shell.classList.remove('success');
    if (errEl) { errEl.querySelector('span') ? errEl.querySelector('span').textContent = msg : errEl.textContent = msg; errEl.classList.add('show'); errEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v5"/><circle cx="12" cy="16" r=".6" fill="currentColor"/></svg><span>${msg}</span>`; }
  }
  function clearFieldError(fieldEl) {
    const shell = $('.input-shell', fieldEl) || fieldEl;
    const errEl = $('.field-error', fieldEl);
    shell.classList.remove('error');
    if (errEl) errEl.classList.remove('show');
  }
  function setFieldSuccess(fieldEl) {
    const shell = $('.input-shell', fieldEl) || fieldEl;
    shell.classList.add('success');
  }

  /* ----- Theme toggle (auth pages) ----- */
  function initThemeToggle() {
    const btn = $('.theme-toggle');
    if (!btn) return;
    const stored = window.__fs360Theme || null;
    if (stored === 'dark') document.body.classList.add('dark');
    btn.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      window.__fs360Theme = document.body.classList.contains('dark') ? 'dark' : 'light';
    });
  }

  /* ----- Password show/hide ----- */
  function initPasswordToggles() {
    $$('.input-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetInput = $('input', btn.closest('.input-shell'));
        const shown = btn.classList.toggle('shown');
        targetInput.type = shown ? 'text' : 'password';
        btn.setAttribute('aria-label', shown ? 'Hide password' : 'Show password');
      });
    });
  }

  /* ----- Login form ----- */
  function initLoginForm() {
    const form = $('#loginForm');
    if (!form) return;

    const emailField = $('#emailField');
    const passField = $('#passwordField');
    const emailInput = $('#email', form);
    const passInput = $('#password', form);

    emailInput.addEventListener('input', () => {
      if (!emailInput.value) { clearFieldError(emailField); return; }
      if (isValidEmail(emailInput.value)) { clearFieldError(emailField); setFieldSuccess(emailField); }
      else setFieldError(emailField, 'Enter a valid email address');
    });
    passInput.addEventListener('input', () => {
      if (!passInput.value) { clearFieldError(passField); return; }
      if (passInput.value.length >= 6) { clearFieldError(passField); setFieldSuccess(passField); }
      else setFieldError(passField, 'Password must be at least 6 characters');
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      if (!isValidEmail(emailInput.value)) { setFieldError(emailField, 'Enter a valid email address'); valid = false; }
      if (passInput.value.length < 6) { setFieldError(passField, 'Password must be at least 6 characters'); valid = false; }
      if (!valid) { showToast('error', 'Check your details', 'Some fields need your attention.'); return; }

      const submitBtn = $('button[type="submit"]', form);
      submitBtn.classList.add('is-loading');
      submitBtn.disabled = true;

      setTimeout(() => {
        submitBtn.classList.remove('is-loading');
        submitBtn.disabled = false;
        showToast('success', 'Welcome back!', 'Login successful. Redirecting to your dashboard…');
        form.reset();
        $$('.input-shell', form).forEach(s => s.classList.remove('success'));
      }, 1600);
    });

    $('#guestBtn')?.addEventListener('click', () => {
      showToast('success', 'Continuing as guest', 'You can browse donations without an account.');
    });
  }

  /* ----- Register form: role select + multistep + strength + validation ----- */
  function initRegisterForm() {
    const form = $('#registerForm');
    if (!form) return;

    /* Role selection */
    let selectedRole = null;
    const roleCards = $$('.role-card');
    roleCards.forEach(card => {
      card.addEventListener('click', () => {
        roleCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedRole = card.dataset.role;
        $('#roleError')?.classList.remove('show');
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
      });
    });

    /* Multistep */
    const steps = $$('.form-step', form);
    const progressSteps = $$('.progress-step');
    let stepIndex = 0;

    function showStep(i) {
      steps.forEach((s, idx) => s.classList.toggle('active', idx === i));
      progressSteps.forEach((p, idx) => {
        p.classList.toggle('active', idx === i);
        p.classList.toggle('done', idx < i);
      });
      stepIndex = i;
    }

    function validateStep1() {
      if (!selectedRole) {
        $('#roleError')?.classList.add('show');
        showToast('warn', 'Choose a role', 'Select whether you are donating or receiving food.');
        return false;
      }
      return true;
    }

    function validateStep2() {
      let valid = true;
      const name = $('#fullName', form);
      const email = $('#regEmail', form);
      const phone = $('#phone', form);

      if (name.value.trim().length < 2) { setFieldError($('#fullNameField'), 'Enter your full name'); valid = false; }
      else { clearFieldError($('#fullNameField')); setFieldSuccess($('#fullNameField')); }

      if (!isValidEmail(email.value)) { setFieldError($('#regEmailField'), 'Enter a valid email address'); valid = false; }
      else { clearFieldError($('#regEmailField')); setFieldSuccess($('#regEmailField')); }

      if (!isValidPhone(phone.value)) { setFieldError($('#phoneField'), 'Enter a valid phone number'); valid = false; }
      else { clearFieldError($('#phoneField')); setFieldSuccess($('#phoneField')); }

      return valid;
    }

    function passwordScore(pw) {
      let score = 0;
      if (pw.length >= 8) score++;
      if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
      if (/\d/.test(pw)) score++;
      if (/[^A-Za-z0-9]/.test(pw)) score++;
      return Math.min(score, 4);
    }
    const strengthLabels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];

    const pwInput = $('#regPassword', form);
    const confirmInput = $('#confirmPassword', form);
    const meter = $('.strength-meter', form);

    pwInput?.addEventListener('input', () => {
      const score = pwInput.value ? passwordScore(pwInput.value) : 0;
      meter.dataset.level = score;
      $('.strength-label', meter).textContent = pwInput.value ? strengthLabels[score] : 'Enter a password';
      if (pwInput.value && pwInput.value.length < 8) setFieldError($('#regPasswordField'), 'Use at least 8 characters');
      else clearFieldError($('#regPasswordField'));
    });
    confirmInput?.addEventListener('input', () => {
      if (!confirmInput.value) { clearFieldError($('#confirmPasswordField')); return; }
      if (confirmInput.value === pwInput.value) { clearFieldError($('#confirmPasswordField')); setFieldSuccess($('#confirmPasswordField')); }
      else setFieldError($('#confirmPasswordField'), 'Passwords do not match');
    });

    function validateStep3() {
      let valid = true;
      if (!pwInput.value || pwInput.value.length < 8) { setFieldError($('#regPasswordField'), 'Use at least 8 characters'); valid = false; }
      if (confirmInput.value !== pwInput.value || !confirmInput.value) { setFieldError($('#confirmPasswordField'), 'Passwords do not match'); valid = false; }
      const terms = $('#termsCheck', form);
      if (!terms.checked) {
        showToast('warn', 'Accept the terms', 'Please agree to the Terms & Conditions to continue.');
        valid = false;
      }
      return valid;
    }

    $$('.btn-step-next', form).forEach(btn => {
      btn.addEventListener('click', () => {
        if (stepIndex === 0 && !validateStep1()) return;
        if (stepIndex === 1 && !validateStep2()) return;
        showStep(Math.min(stepIndex + 1, steps.length - 1));
      });
    });
    $$('.btn-step-back', form).forEach(btn => {
      btn.addEventListener('click', () => showStep(Math.max(stepIndex - 1, 0)));
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateStep3()) return;

      const submitBtn = $('button[type="submit"]', form);
      submitBtn.classList.add('is-loading');
      submitBtn.disabled = true;

      setTimeout(() => {
        submitBtn.classList.remove('is-loading');
        submitBtn.disabled = false;
        openSuccessModal();
      }, 1700);
    });

    showStep(0);
  }

  function openSuccessModal() {
    const overlay = $('#successModal');
    if (!overlay) return;
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden', 'false');
  }
  function initModalClose() {
    $$('.modal-overlay').forEach(overlay => {
      $$('[data-modal-close]', overlay).forEach(btn => {
        btn.addEventListener('click', () => {
          overlay.classList.remove('show');
          overlay.setAttribute('aria-hidden', 'true');
        });
      });
    });
  }

  /* ---------------------------------------------------------
     Init
  --------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initBackToTop();
    initScrollReveal();
    initCounters();
    initImpactBars();
    initTimeline();
    initActivityFeed();
    initMapMarkers();
    initCarousel();
    initTypingEffect();
    initNewsletter();
    initSmoothAnchors();
    initPageTransitions();

    initThemeToggle();
    initPasswordToggles();
    initLoginForm();
    initRegisterForm();
    initModalClose();
  });
})();
