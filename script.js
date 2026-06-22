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

  /* ----- Login form ---  /* ----- Login form ----- */
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

      const emailVal = emailInput.value.trim().toLowerCase();
      const passVal = passInput.value;

      const users = JSON.parse(localStorage.getItem('fs360_users') || '[]');
      const user = users.find(u => u.email === emailVal);

      if (!user) {
        setFieldError(emailField, 'Email address not found');
        showToast('error', 'Login Failed', 'Incorrect email address.');
        return;
      }

      if (user.password !== passVal) {
        setFieldError(passField, 'Incorrect password');
        showToast('error', 'Login Failed', 'Incorrect password.');
        return;
      }

      const submitBtn = $('button[type="submit"]', form);
      submitBtn.classList.add('is-loading');
      submitBtn.disabled = true;

      setTimeout(() => {
        submitBtn.classList.remove('is-loading');
        submitBtn.disabled = false;
        
        // Save current user session
        localStorage.setItem('fs360_currentUser', JSON.stringify(user));
        
        showToast('success', 'Welcome back!', 'Login successful. Redirecting to your dashboard…');
        
        // Perform page transition redirect
        const overlay = document.createElement('div');
        overlay.className = 'page-transition';
        overlay.innerHTML = `<div class="brand-mark"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8 6 6 9 6 13a6 6 0 0 0 12 0c0-4-2-7-6-11z"/></svg></div>`;
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('animate-in'));
        
        setTimeout(() => {
          window.location.href = user.role === 'donor' ? 'donor-dashboard.html' : 'ngo-dashboard.html';
        }, 500);
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
      else {
        // Check if email already exists
        const users = JSON.parse(localStorage.getItem('fs360_users') || '[]');
        if (users.some(u => u.email === email.value.trim().toLowerCase())) {
          setFieldError($('#regEmailField'), 'Email already registered');
          valid = false;
        } else {
          clearFieldError($('#regEmailField'));
          setFieldSuccess($('#regEmailField'));
        }
      }

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

      // Capture inputs
      const name = $('#fullName', form).value.trim();
      const email = $('#regEmail', form).value.trim().toLowerCase();
      const phone = $('#phone', form).value.trim();
      const password = pwInput.value;

      setTimeout(() => {
        submitBtn.classList.remove('is-loading');
        submitBtn.disabled = false;

        const users = JSON.parse(localStorage.getItem('fs360_users') || '[]');
        users.push({ name, email, phone, password, role: selectedRole });
        localStorage.setItem('fs360_users', JSON.stringify(users));

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

  /* ----- Route guards, session management, logout, and mock dashboard data ----- */
  function initAuthRouteGuard() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    const currentUser = JSON.parse(localStorage.getItem('fs360_currentUser') || 'null');

    // Page route categorization
    const donorPages = ['donor-dashboard.html', 'create-donation.html', 'my-donations.html'];
    const ngoPages = ['ngo-dashboard.html', 'available-donations.html', 'accepted-donations.html', 'donation-details.html'];

    // If logged in, prevent accessing login and register pages, auto-redirect to dashboards
    if (currentUser && (path === 'login.html' || path === 'register.html')) {
      window.location.href = currentUser.role === 'donor' ? 'donor-dashboard.html' : 'ngo-dashboard.html';
      return;
    }

    // If logged in on landing page, update navbar actions dynamically
    if (currentUser && (path === 'index.html' || path === '' || path === '/')) {
      const navActions = $('.nav-actions');
      if (navActions) {
        const dashboardUrl = currentUser.role === 'donor' ? 'donor-dashboard.html' : 'ngo-dashboard.html';
        navActions.innerHTML = `
          <a href="${dashboardUrl}" class="btn btn-primary" style="margin-right:10px;" data-transition>Go to Dashboard</a>
          <button class="btn btn-ghost logout-btn">Log Out</button>
          <button class="nav-toggle" id="navToggle" aria-label="Toggle menu" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
        `;
        initNavbar();
      }
    }

    // Protection check
    if (donorPages.includes(path)) {
      if (!currentUser) {
        localStorage.setItem('fs360_authError', 'Access Denied. You must log in first.');
        window.location.href = 'login.html';
        return;
      }
      if (currentUser.role !== 'donor') {
        localStorage.setItem('fs360_authError', 'Access Denied. This page is only accessible by Donors.');
        window.location.href = 'login.html';
        return;
      }
    } else if (ngoPages.includes(path)) {
      if (!currentUser) {
        localStorage.setItem('fs360_authError', 'Access Denied. You must log in first.');
        window.location.href = 'login.html';
        return;
      }
      if (currentUser.role !== 'ngo') {
        localStorage.setItem('fs360_authError', 'Access Denied. This page is only accessible by NGOs.');
        window.location.href = 'login.html';
        return;
      }
    }

    // Check if there is an authorization error message to display
    const storedErr = localStorage.getItem('fs360_authError');
    if (storedErr) {
      localStorage.removeItem('fs360_authError');
      setTimeout(() => {
        showToast('error', 'Access Denied', storedErr);
      }, 300);
    }

    // Display user profile info if logged in
    if (currentUser) {
      const nameElements = $$('.nav-user-name');
      const roleElements = $$('.nav-user-role');
      
      nameElements.forEach(el => el.textContent = currentUser.name);
      roleElements.forEach(el => el.textContent = currentUser.role.toUpperCase());
    }

    // Logout triggers
    $$('.logout-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('fs360_currentUser');
        
        // Full page transition screen overlay
        const overlay = document.createElement('div');
        overlay.className = 'page-transition';
        overlay.innerHTML = `<div class="brand-mark"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8 6 6 9 6 13a6 6 0 0 0 12 0c0-4-2-7-6-11z"/></svg></div>`;
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('animate-in'));
        
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 500);
      });
    });
  }

  /* Helper to create custom animated Leaflet markers using existing CSS pulse rules */
  function createCustomIcon(isGreen) {
    if (!window.L) return null;
    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: `<span class="map-marker ${isGreen ? 'green' : ''}" style="position:relative; display:block; margin:0;"></span>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });
  }

  /* Food category photo keyword categorizer */
  function getFoodPhoto(name) {
    const n = name.toLowerCase();
    if (n.includes('biryani')) return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80';
    if (n.includes('idly') || n.includes('idli') || n.includes('sambar')) return 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80';
    if (n.includes('lemon')) return 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=600&auto=format&fit=crop&q=80';
    if (n.includes('curd')) return 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600&auto=format&fit=crop&q=80';
    if (n.includes('tomato')) return 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&auto=format&fit=crop&q=80';
    if (n.includes('chapati') || n.includes('roti')) return 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=600&auto=format&fit=crop&q=80';
    if (n.includes('south indian') || n.includes('meals') || n.includes('parcel')) return 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600&auto=format&fit=crop&q=80';
    if (n.includes('dosa')) return 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80';
    if (n.includes('upma') || n.includes('pongal')) return 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&auto=format&fit=crop&q=80';
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';
  }

  /* Seed data for offline mockup operations */
  function seedInitialData() {
    // Seed test users if none exist
    const users = localStorage.getItem('fs360_users');
    if (!users || JSON.parse(users).length === 0) {
      const sampleUsers = [
        { name: 'Hotel Meridian', email: 'donor@fs.com', phone: '+91 98765 43210', password: 'password123', role: 'donor' },
        { name: 'Food Relief Foundation', email: 'ngo@fs.com', phone: '+91 87654 32109', password: 'password123', role: 'ngo' },
        { name: 'Community Kitchen Madurai', email: 'community@fs.com', phone: '+91 76543 21098', password: 'password123', role: 'ngo' },
        { name: 'Helping Hands NGO', email: 'helping@fs.com', phone: '+91 65432 10987', password: 'password123', role: 'ngo' },
        { name: 'Annai Food Support Trust', email: 'annai@fs.com', phone: '+91 54321 09876', password: 'password123', role: 'ngo' }
      ];
      localStorage.setItem('fs360_users', JSON.stringify(sampleUsers));
    }

    // Seed sample donations centered around Madurai Tamil Nadu
    const donations = localStorage.getItem('fs360_donations');
    if (!donations || JSON.parse(donations).length === 0) {
      const sampleDonations = [
        {
          id: 'don_1',
          foodItem: 'Vegetable Biryani',
          quantity: '50 Meals',
          expiry: 'Pickup Before: 7:00 PM',
          pickupNotes: 'Contact Manager Chef Rahul at standard service gate 3.',
          donorName: 'Hotel Meridian',
          donorEmail: 'donor@fs.com',
          donorPhone: '+91 98765 43210',
          status: 'Pending',
          matchedNgo: '',
          latitude: 9.9215,
          longitude: 78.1130,
          photoUrl: getFoodPhoto('Vegetable Biryani')
        },
        {
          id: 'don_2',
          foodItem: 'South Indian Meals',
          quantity: '30 Meals',
          expiry: 'Pickup Before: 8:00 PM',
          pickupNotes: 'Front desk collection counter, packages loaded.',
          donorName: 'Hotel Meridian',
          donorEmail: 'donor@fs.com',
          donorPhone: '+91 98765 43210',
          status: 'Pending',
          matchedNgo: '',
          latitude: 9.9250,
          longitude: 78.1220,
          photoUrl: getFoodPhoto('South Indian Meals')
        },
        {
          id: 'don_3',
          foodItem: 'Idly & Sambar',
          quantity: '40 Servings',
          expiry: 'Pickup Before: 10:00 AM',
          pickupNotes: 'Freshly prepared breakfast batch. Direct kitchen corridor.',
          donorName: 'Annai Food Support Trust',
          donorEmail: 'annai@fs.com',
          donorPhone: '+91 54321 09876',
          status: 'Pending',
          matchedNgo: '',
          latitude: 9.9180,
          longitude: 78.1110,
          photoUrl: getFoodPhoto('Idly & Sambar')
        },
        {
          id: 'don_4',
          foodItem: 'Lemon Rice',
          quantity: '25 Packs',
          expiry: 'Pickup Before: 6:00 PM',
          pickupNotes: 'Individually wrapped lunch packs.',
          donorName: 'Hotel Meridian',
          donorEmail: 'donor@fs.com',
          donorPhone: '+91 98765 43210',
          status: 'Pending',
          matchedNgo: '',
          latitude: 9.9260,
          longitude: 78.1150,
          photoUrl: getFoodPhoto('Lemon Rice')
        },
        {
          id: 'don_5',
          foodItem: 'Curd Rice',
          quantity: '20 Packs',
          expiry: 'Pickup Before: 5:00 PM',
          pickupNotes: 'Packed in insulated boxes ready to carry.',
          donorName: 'Hotel Meridian',
          donorEmail: 'donor@fs.com',
          donorPhone: '+91 98765 43210',
          status: 'Pending',
          matchedNgo: '',
          latitude: 9.9200,
          longitude: 78.1280,
          photoUrl: getFoodPhoto('Curd Rice')
        },
        {
          id: 'don_6',
          foodItem: 'Tomato Rice',
          quantity: '15 Packs',
          expiry: 'Pickup Before: 7:00 PM',
          pickupNotes: 'Service entrance collection desk.',
          donorName: 'Hotel Meridian',
          donorEmail: 'donor@fs.com',
          donorPhone: '+91 98765 43210',
          status: 'Pending',
          matchedNgo: '',
          latitude: 9.9310,
          longitude: 78.1210,
          photoUrl: getFoodPhoto('Tomato Rice')
        },
        {
          id: 'don_7',
          foodItem: 'Chapati Meals',
          quantity: '35 Meals',
          expiry: 'Pickup Before: 9:00 PM',
          pickupNotes: 'Comes with dry subji. Collection box ready.',
          donorName: 'Hotel Meridian',
          donorEmail: 'donor@fs.com',
          donorPhone: '+91 98765 43210',
          status: 'Pending',
          matchedNgo: '',
          latitude: 9.9140,
          longitude: 78.1070,
          photoUrl: getFoodPhoto('Chapati Meals')
        },
        {
          id: 'don_8',
          foodItem: 'Meals Parcel',
          quantity: '60 Packs',
          expiry: 'Pickup Before: 8:30 PM',
          pickupNotes: 'Full packed parcel boxes.',
          donorName: 'Hotel Meridian',
          donorEmail: 'donor@fs.com',
          donorPhone: '+91 98765 43210',
          status: 'Pending',
          matchedNgo: '',
          latitude: 9.9290,
          longitude: 78.1050,
          photoUrl: getFoodPhoto('Meals Parcel')
        }
      ];
      localStorage.setItem('fs360_donations', JSON.stringify(sampleDonations));
    }
  }

  /* Map initialization scripts */
  function initHomepageMap() {
    const mapEl = $('#map');
    if (!mapEl || !window.L) return;

    // Center on Madurai Tamil Nadu
    const map = L.map('map').setView([9.9252, 78.1198], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const markers = [
      { coords: [9.9197, 78.1105], title: 'Madurai Junction Pickup Hub', desc: 'Multiple Food Collections<br>Active Pickup Point', green: false },
      { coords: [9.9195, 78.1193], title: 'Meenakshi Temple Area', desc: 'High Donation Activity Area<br>Nearby NGOs Available', green: false },
      { coords: [9.9285, 78.1250], title: 'Food Relief Foundation', desc: 'Food Relief Foundation<br>Accepting Donations<br>People Served: 1200+', green: true },
      { coords: [9.9320, 78.1090], title: 'Community Kitchen Madurai', desc: 'Community Kitchen Madurai<br>Food Distribution Center', green: true },
      { coords: [9.9215, 78.1130], title: 'Restaurant Donor', desc: 'Vegetable Biryani<br>50 Meals Available<br>Pickup Before 7 PM', green: false },
      { coords: [9.9250, 78.1220], title: 'Hotel Donor', desc: 'South Indian Meals<br>30 Meals Available<br>Pickup Before 8 PM', green: false }
    ];

    const leafletMarkers = [];
    markers.forEach(m => {
      const marker = L.marker(m.coords, { icon: createCustomIcon(m.green) })
        .addTo(map)
        .bindPopup(`<strong>${m.title}</strong><br>${m.desc}`);
      leafletMarkers.push(marker);
    });

    const group = new L.featureGroup(leafletMarkers);
    map.fitBounds(group.getBounds().pad(0.1));
  }

  function initAvailableDonationsMap(pendingDons) {
    const mapEl = $('#map');
    if (!mapEl || !window.L) return;

    if (window.availableMap) {
      window.availableMap.remove();
    }

    const map = L.map('map').setView([9.9252, 78.1198], 13);
    window.availableMap = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const markers = [];
    pendingDons.forEach(d => {
      if (d.latitude && d.longitude) {
        const marker = L.marker([d.latitude, d.longitude], { icon: createCustomIcon(false) })
          .addTo(map)
          .bindPopup(`
            <strong>${d.foodItem}</strong><br>
            Quantity: ${d.quantity}<br>
            Expiry: ${d.expiry}<br>
            Donor: ${d.donorName}<br>
            <button class="btn btn-primary btn-sm accept-map-btn" data-id="${d.id}" style="margin-top:8px; padding:6px 12px; font-size:0.75rem; width:100%;">Accept Match</button>
          `);
        markers.push(marker);
      }
    });

    map.on('popupopen', (e) => {
      const btn = e.popup.getElement().querySelector('.accept-map-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          const donId = btn.dataset.id;
          const currentUser = JSON.parse(localStorage.getItem('fs360_currentUser'));
          const allDons = JSON.parse(localStorage.getItem('fs360_donations') || '[]');

          const don = allDons.find(item => item.id === donId);
          if (don) {
            don.status = 'Accepted';
            don.matchedNgo = currentUser.name;
            don.ngoEmail = currentUser.email;
            localStorage.setItem('fs360_donations', JSON.stringify(allDons));
            showToast('success', 'Match Accepted', 'Donation successfully claimed! Redirecting to details...');
            setTimeout(() => {
              window.location.href = `donation-details.html?id=${donId}`;
            }, 1200);
          }
        });
      }
    });

    if (markers.length > 0) {
      const group = new L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  function initAcceptedPickupsMap(acceptedDons) {
    const mapEl = $('#map');
    if (!mapEl || !window.L) return;

    if (window.acceptedMap) {
      window.acceptedMap.remove();
    }

    const map = L.map('map').setView([9.9252, 78.1198], 13);
    window.acceptedMap = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const markers = [];
    acceptedDons.forEach(d => {
      if (d.latitude && d.longitude) {
        const isDelivered = d.status === 'Delivered';
        const marker = L.marker([d.latitude, d.longitude], { icon: createCustomIcon(isDelivered) })
          .addTo(map)
          .bindPopup(`
            <strong>${d.foodItem}</strong><br>
            Quantity: ${d.quantity}<br>
            Donor: ${d.donorName}<br>
            Status: <strong>${d.status}</strong><br>
            <a href="donation-details.html?id=${d.id}" class="btn btn-ghost btn-sm" style="margin-top:8px; padding:6px 12px; font-size:0.75rem; display:inline-block; width:100%; text-align:center;">View Details</a>
          `);
        markers.push(marker);
      }
    });

    if (markers.length > 0) {
      const group = new L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  /* Donation logic for forms and views */
  function initCreateDonationForm() {
    const form = $('#createDonationForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const foodItem = $('#foodItem', form).value.trim();
      const quantity = $('#quantity', form).value.trim();
      const expiry = $('#expiry', form).value.trim();
      const pickupNotes = $('#pickupNotes', form).value.trim();
      
      if (!foodItem || !quantity || !expiry) {
        showToast('error', 'Incomplete Form', 'Please fill in all required fields.');
        return;
      }
      
      const currentUser = JSON.parse(localStorage.getItem('fs360_currentUser'));
      const donations = JSON.parse(localStorage.getItem('fs360_donations') || '[]');
      
      const lat = 9.9252 + (Math.random() - 0.5) * 0.02;
      const lon = 78.1198 + (Math.random() - 0.5) * 0.02;

      const newDonation = {
        id: 'don_' + Date.now(),
        foodItem,
        quantity,
        expiry,
        pickupNotes,
        donorName: currentUser.name,
        donorEmail: currentUser.email,
        donorPhone: currentUser.phone || '',
        status: 'Pending',
        matchedNgo: '',
        latitude: lat,
        longitude: lon,
        photoUrl: getFoodPhoto(foodItem)
      };
      
      donations.push(newDonation);
      localStorage.setItem('fs360_donations', JSON.stringify(donations));
      
      showToast('success', 'Donation Created', 'Your surplus food donation listing is active!');
      
      setTimeout(() => {
        window.location.href = 'my-donations.html';
      }, 1000);
    });
  }

  function initMyDonations() {
    const container = $('#myDonationsList');
    if (!container) return;

    const currentUser = JSON.parse(localStorage.getItem('fs360_currentUser'));
    const donations = JSON.parse(localStorage.getItem('fs360_donations') || '[]');
    const myDons = donations.filter(d => d.donorEmail === currentUser.email);
    
    if (myDons.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>You haven't listed any donations yet.</p>
          <a href="create-donation.html" class="btn btn-accent btn-sm">List Food Now</a>
        </div>`;
      return;
    }
    
    let html = `
      <table class="dashboard-table">
        <thead>
          <tr>
            <th>Food Item</th>
            <th>Quantity / Servings</th>
            <th>Expiry Window</th>
            <th>Status</th>
            <th>Matched NGO / Details</th>
          </tr>
        </thead>
        <tbody>`;
        
    myDons.reverse().forEach(d => {
      let statusClass = 'status-pending';
      if (d.status === 'Accepted') statusClass = 'status-accepted';
      if (d.status === 'Delivered') statusClass = 'status-delivered';
      
      html += `
        <tr>
          <td>
            <div style="display:flex; align-items:center; gap:12px;">
              ${d.photoUrl ? `<img src="${d.photoUrl}" style="width:40px; height:40px; border-radius:6px; object-fit:cover;" loading="lazy">` : ''}
              <strong>${d.foodItem}</strong>
            </div>
          </td>
          <td>${d.quantity}</td>
          <td>${d.expiry}</td>
          <td><span class="status-badge ${statusClass}">${d.status}</span></td>
          <td>${d.matchedNgo ? `Matched with <strong>${d.matchedNgo}</strong>` : 'Awaiting match...'}</td>
        </tr>`;
    });
    
    html += `</tbody></table>`;
    container.innerHTML = html;
  }

  function initAvailableDonations() {
    const container = $('#availableDonationsList');
    if (!container) return;

    const donations = JSON.parse(localStorage.getItem('fs360_donations') || '[]');
    const pendingDons = donations.filter(d => d.status === 'Pending');
    
    // Also initialize Leaflet Map for available donations
    initAvailableDonationsMap(pendingDons);

    if (pendingDons.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No active food donations available in your area right now.</p>
        </div>`;
      return;
    }
    
    let html = '<div class="donations-grid">';
    pendingDons.forEach(d => {
      html += `
        <div class="donation-card">
          ${d.photoUrl ? `
            <div class="don-photo-wrap">
              <img src="${d.photoUrl}" alt="${d.foodItem}" loading="lazy" class="don-photo">
            </div>` : ''}
          <div class="don-card-content">
            <h4>${d.foodItem}</h4>
            <p class="don-qty">Quantity: <strong>${d.quantity}</strong></p>
            <p class="don-exp">Expiry: <strong>${d.expiry}</strong></p>
            <p class="don-donor">Listed by: <strong>${d.donorName}</strong></p>
            <div class="don-card-actions">
              <button class="btn btn-primary accept-don-btn" data-id="${d.id}">Accept Match</button>
            </div>
          </div>
        </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
    
    $$('.accept-don-btn', container).forEach(btn => {
      btn.addEventListener('click', () => {
        const donId = btn.dataset.id;
        const currentUser = JSON.parse(localStorage.getItem('fs360_currentUser'));
        const allDons = JSON.parse(localStorage.getItem('fs360_donations') || '[]');
        
        const don = allDons.find(d => d.id === donId);
        if (don) {
          don.status = 'Accepted';
          don.matchedNgo = currentUser.name;
          don.ngoEmail = currentUser.email;
          localStorage.setItem('fs360_donations', JSON.stringify(allDons));
          showToast('success', 'Match Accepted', 'Donation successfully claimed! Redirecting to details...');
          setTimeout(() => {
            window.location.href = `donation-details.html?id=${donId}`;
          }, 1200);
        }
      });
    });
  }

  function initAcceptedDonations() {
    const container = $('#acceptedDonationsList');
    if (!container) return;

    const currentUser = JSON.parse(localStorage.getItem('fs360_currentUser'));
    const donations = JSON.parse(localStorage.getItem('fs360_donations') || '[]');
    const acceptedDons = donations.filter(d => d.ngoEmail === currentUser.email);
    
    // Also initialize Leaflet Map on dashboard for active pickups routing
    initAcceptedPickupsMap(acceptedDons);

    if (acceptedDons.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>You haven't accepted any donations yet.</p>
          <a href="available-donations.html" class="btn btn-accent btn-sm">Browse Available Food</a>
        </div>`;
      return;
    }
    
    let html = `
      <table class="dashboard-table">
        <thead>
          <tr>
            <th>Food Item</th>
            <th>Quantity</th>
            <th>Donor Name</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>`;
        
    acceptedDons.reverse().forEach(d => {
      let statusClass = 'status-accepted';
      if (d.status === 'Delivered') statusClass = 'status-delivered';
      
      html += `
        <tr>
          <td>
            <div style="display:flex; align-items:center; gap:12px;">
              ${d.photoUrl ? `<img src="${d.photoUrl}" style="width:40px; height:40px; border-radius:6px; object-fit:cover;" loading="lazy">` : ''}
              <strong>${d.foodItem}</strong>
            </div>
          </td>
          <td>${d.quantity}</td>
          <td>${d.donorName}</td>
          <td><span class="status-badge ${statusClass}">${d.status}</span></td>
          <td><a href="donation-details.html?id=${d.id}" class="btn btn-ghost btn-sm">View Details</a></td>
        </tr>`;
    });
    
    html += `</tbody></table>`;
    container.innerHTML = html;
  }

  function initDonationDetails() {
    const container = $('#donationDetails');
    if (!container) return;

    const urlParams = new URLSearchParams(window.location.search);
    const donId = urlParams.get('id');
    
    if (!donId) {
      container.innerHTML = '<p>Error: No donation ID provided.</p>';
      return;
    }

    const allDons = JSON.parse(localStorage.getItem('fs360_donations') || '[]');
    const don = allDons.find(d => d.id === donId);
    
    if (!don) {
      container.innerHTML = '<p>Error: Donation details not found.</p>';
      return;
    }

    let statusClass = 'status-pending';
    if (don.status === 'Accepted') statusClass = 'status-accepted';
    if (don.status === 'Delivered') statusClass = 'status-delivered';

    let actionBtnHtml = '';
    if (don.status === 'Accepted') {
      actionBtnHtml = `<button id="markCollectedBtn" class="btn btn-accent btn-lg" style="margin-top:20px;">Mark as Collected &amp; Delivered</button>`;
    }

    container.innerHTML = `
      <div class="details-card">
        ${don.photoUrl ? `
          <div class="don-photo-wrap" style="height: 240px; margin-bottom: 24px;">
            <img src="${don.photoUrl}" alt="${don.foodItem}" class="don-photo" style="border-radius: var(--radius-md);">
          </div>` : ''}
        <div class="details-header">
          <h3>${don.foodItem}</h3>
          <span class="status-badge ${statusClass}">${don.status}</span>
        </div>
        <div class="details-body">
          <div class="details-section">
            <h5>Donation Details</h5>
            <p>Quantity/Servings: <strong>${don.quantity}</strong></p>
            <p>Expiry Window: <strong>${don.expiry}</strong></p>
            <p>Pickup Notes/Instructions: <strong>${don.pickupNotes || 'None'}</strong></p>
          </div>
          <div class="details-section">
            <h5>Donor Information</h5>
            <p>Organization/Name: <strong>${don.donorName}</strong></p>
            <p>Email: <strong>${don.donorEmail}</strong></p>
            <p>Contact Phone: <strong>${don.donorPhone || 'N/A'}</strong></p>
          </div>
          ${don.matchedNgo ? `
          <div class="details-section">
            <h5>Matched NGO</h5>
            <p>Name: <strong>${don.matchedNgo}</strong></p>
          </div>` : ''}
        </div>
        ${actionBtnHtml}
      </div>`;

    const collectBtn = $('#markCollectedBtn');
    if (collectBtn) {
      collectBtn.addEventListener('click', () => {
        don.status = 'Delivered';
        localStorage.setItem('fs360_donations', JSON.stringify(allDons));
        showToast('success', 'Status Updated', 'Donation has been successfully marked as collected/delivered!');
        initDonationDetails();
      });
    }
  }

  /* ---------------------------------------------------------
     Init
     --------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    seedInitialData();
    initAuthRouteGuard();

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

    // Leaflet homepage map
    initHomepageMap();

    // Dashboard views
    initCreateDonationForm();
    initMyDonations();
    initAvailableDonations();
    initAcceptedDonations();
    initDonationDetails();
  });
})();


