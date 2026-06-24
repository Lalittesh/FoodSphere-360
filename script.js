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

  const DEFAULT_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="%23E8F3EC"/>
      <circle cx="50" cy="40" r="20" fill="%231B6B4A"/>
      <path d="M20 80C20 63.4315 33.4315 50 50 50C66.5685 50 80 63.4315 80 80" stroke="%231B6B4A" stroke-width="6" stroke-linecap="round"/>
    </svg>`
  )}`;

  const DEFAULT_NGO_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="%23FFE3D1"/>
      <circle cx="50" cy="40" r="20" fill="%23FF7A33"/>
      <path d="M20 80C20 63.4315 33.4315 50 50 50C66.5685 50 80 63.4315 80 80" stroke="%23FF7A33" stroke-width="6" stroke-linecap="round"/>
    </svg>`
  )}`;

  /* ---------------------------------------------------------
     Navbar: scroll state + mobile toggle
  --------------------------------------------------------- */
  function initNavbar() {
    renderNavbar();
  }

  function setupGuestMobileNav() {
    const toggle = $('.nav-toggle');
    const navLinks = $('#navLinks');
    if (toggle && navLinks) {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = toggle.classList.toggle('open');
        navLinks.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });

      // Close guest nav links when a link is clicked
      $$('a', navLinks).forEach(link => {
        link.addEventListener('click', () => {
          toggle.classList.remove('open');
          navLinks.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });

      // Close guest nav if clicked outside
      document.addEventListener('click', (e) => {
        if (!toggle.contains(e.target) && !navLinks.contains(e.target)) {
          toggle.classList.remove('open');
          navLinks.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }

  function renderNavbar() {
    const navbar = $('.navbar');
    if (!navbar) return;

    const path = window.location.pathname.split('/').pop() || 'index.html';
    const currentUser = JSON.parse(localStorage.getItem('fs360_currentUser') || 'null');

    // For login, register guest views
    if (!currentUser || path === 'login.html' || path === 'register.html') {
      setupGuestMobileNav();
      return;
    }

    const isDonor = currentUser.role === 'donor';
    const userAvatar = currentUser.avatar || (isDonor ? DEFAULT_AVATAR : DEFAULT_NGO_AVATAR);
    const roleBadgeClass = isDonor ? 'badge-donor' : 'badge-ngo';
    const profilePage = isDonor ? 'profile-donor.html' : 'profile-ngo.html';

    // Generate links based on role
    let linksHtml = '';
    let mobileLinksHtml = '';

    const isLanding = path === 'index.html';

    if (isLanding) {
      linksHtml = `
        <a href="#home" class="active">Home</a>
        <a href="#about">About</a>
        <a href="#impact">Impact</a>
        <a href="#how-it-works">How It Works</a>
        <a href="#contact">Contact</a>
      `;
    }

    if (isDonor) {
      const donorLinks = [
        { href: 'donor-dashboard.html', text: 'Dashboard' },
        { href: 'create-donation.html', text: 'List Food' },
        { href: 'my-donations.html', text: 'My Donations' },
        { href: 'emergency-requests.html', text: 'Emergency Requests' },
        { href: 'profile-donor.html', text: 'Profile' }
      ];
      donorLinks.forEach(link => {
        if (!isLanding) {
          const isActive = path === link.href ? 'class="active"' : '';
          linksHtml += `<a href="${link.href}" ${isActive} data-transition>${link.text}</a>`;
        }
        
        // Mobile grid items (short labels)
        let label = link.text;
        if (label === 'My Donations') label = 'Donations';
        if (label === 'Emergency Requests') label = 'Emergency';
        const mobileActive = path === link.href ? 'active' : '';
        mobileLinksHtml += `<a href="${link.href}" class="mobile-nav-item ${mobileActive}" data-transition>${label}</a>`;
      });
    } else {
      const ngoLinks = [
        { href: 'ngo-dashboard.html', text: 'Dashboard' },
        { href: 'accepted-donations.html', text: 'Accepted Pickups' },
        { href: 'emergency-requests.html', text: 'Emergency Requests' },
        { href: 'profile-ngo.html', text: 'Profile' }
      ];
      ngoLinks.forEach(link => {
        if (!isLanding) {
          if (link.text !== 'Profile') {
            const isActive = path === link.href ? 'class="active"' : '';
            linksHtml += `<a href="${link.href}" ${isActive} data-transition>${link.text}</a>`;
          }
        }
        
        // Mobile grid items (short labels)
        let label = link.text;
        if (label === 'Accepted Pickups') label = 'Accepted';
        if (label === 'Emergency Requests') label = 'Emergency';
        const mobileActive = path === link.href ? 'active' : '';
        mobileLinksHtml += `<a href="${link.href}" class="mobile-nav-item ${mobileActive}" data-transition>${label}</a>`;
      });
    }

    // Unread count check
    const notifications = JSON.parse(localStorage.getItem('fs360_notifications') || '[]');
    const userNotifs = notifications.filter(n => n.role === currentUser.role || n.role === 'all');
    const unreadCount = userNotifs.filter(n => !n.read).length;
    const badgeStyle = unreadCount > 0 ? '' : 'style="display: none;"';

    navbar.innerHTML = `
      <div class="container">
        <!-- Logo / Brand (Line 1 Left on Mobile) -->
        <a href="index.html" class="brand" data-transition>
          <span class="brand-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8 6 6 9 6 13a6 6 0 0 0 12 0c0-4-2-7-6-11z"/></svg>
          </span>
          FoodSphere<span class="accent">360</span>
        </a>

        <!-- Desktop Navigation Links (Centered) -->
        <nav class="nav-links desktop-only" id="navLinks">
          ${linksHtml}
        </nav>

        <!-- Right actions: Notification Bell + Avatar Dropdown -->
        <div class="nav-actions">
          <!-- Desktop Logout Button beside avatar -->
          ${isDonor ? '<button class="btn btn-ghost logout-btn desktop-logout-btn">Log Out</button>' : ''}

          <!-- Notification Bell Icon (Beside Profile Image) -->
          <div class="notif-bell-container">
            <button class="notif-bell-btn" id="notifBellBtn" aria-label="Notifications">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span class="notif-badge" id="notifBellBadge" ${badgeStyle}>${unreadCount}</span>
            </button>
            
            <!-- Notification Dropdown Panel -->
            <div class="notif-dropdown-panel" id="notifDropdownPanel">
              <div class="notif-panel-header">
                <h4>Recent Notifications</h4>
                <button class="btn btn-ghost btn-xs" id="markAllReadDropdownBtn" style="font-size: 0.72rem; padding: 4px 8px; font-weight: 700;">Mark all read</button>
              </div>
              <div class="notif-panel-body" id="notifDropdownBody">
                <!-- Loaded dynamically -->
              </div>
              <div class="notif-panel-footer">
                <a href="notifications.html" class="notif-view-all" data-transition>View All Notifications</a>
              </div>
            </div>
          </div>

          <!-- User Profile Avatar with Dropdown -->
          <div class="profile-dropdown-container">
            <button class="profile-trigger-btn" id="profileTriggerBtn" aria-label="Toggle profile menu">
              <img class="nav-profile-avatar" id="navProfileAvatar" src="${userAvatar}" alt="${currentUser.name}">
            </button>
            <div class="profile-dropdown-menu" id="profileDropdown">
              <div class="dropdown-header-info">
                <span class="dropdown-user-name">${currentUser.name}</span>
                <span class="dropdown-user-role ${roleBadgeClass}">${currentUser.role}</span>
              </div>
              <a href="${isDonor ? 'donor-dashboard.html' : 'ngo-dashboard.html'}" class="dropdown-item" data-transition>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
                Go to Dashboard
              </a>
              <a href="${profilePage}" class="dropdown-item" data-transition>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                View Profile
              </a>
              <a href="${profilePage}" class="dropdown-item" data-transition>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                Edit Profile
              </a>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item logout-btn" style="color: #E0463A;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E0463A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                Logout
              </button>
            </div>
          </div>

          <!-- Hamburger Toggle Menu (Line 1 Right on Mobile) -->
          <button class="nav-toggle" id="navToggle" aria-label="Toggle menu" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>

      <!-- Mobile Dropdown Drawer (Line 2 and Line 3) -->
      <div class="mobile-menu-drawer" id="mobileMenuDrawer">
        <!-- LINE 2: User details row -->
        <div class="mobile-user-row">
          <img class="nav-profile-avatar clickable-mobile-avatar" id="mobileNavAvatar" src="${userAvatar}" alt="${currentUser.name}">
          <div class="mobile-user-meta">
            <span class="nav-user-name">${currentUser.name}</span>
            <span class="nav-user-role ${roleBadgeClass}">${currentUser.role}</span>
          </div>
        </div>
        <!-- LINE 3: Grid navigation links -->
        <div class="mobile-nav-grid">
          ${mobileLinksHtml}
        </div>
      </div>
    `;

    setupNavbarListeners();
  }

  function setupNavbarListeners() {
    const nav = $('.navbar');
    if (!nav) return;

    // Scroll effect
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 16);
    onScroll();
    window.removeEventListener('scroll', onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });

    // Mobile Toggle Hamburger
    const toggle = $('.nav-toggle');
    const drawer = $('#mobileMenuDrawer');
    if (toggle && drawer) {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = toggle.classList.toggle('open');
        drawer.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        
        // Close other panels
        $('#profileDropdown')?.classList.remove('active');
        $('#notifDropdownPanel')?.classList.remove('active');
      });
    }

    // Profile Dropdown Toggle
    const profileTrigger = $('#profileTriggerBtn');
    const profileDropdown = $('#profileDropdown');
    if (profileTrigger && profileDropdown) {
      profileTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('active');
        
        // Close other panels
        $('#notifDropdownPanel')?.classList.remove('active');
        drawer?.classList.remove('open');
        toggle?.classList.remove('open');
      });
    }

    // Clicking avatar on mobile row should also toggle profile dropdown
    const mobileAvatar = $('#mobileNavAvatar');
    if (mobileAvatar && profileDropdown) {
      mobileAvatar.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('active');
        
        // Close notifications
        $('#notifDropdownPanel')?.classList.remove('active');
      });
    }

    // Notification Dropdown Toggle
    const notifBell = $('#notifBellBtn');
    const notifDropdown = $('#notifDropdownPanel');
    if (notifBell && notifDropdown) {
      notifBell.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = notifDropdown.classList.toggle('active');
        
        if (isOpen) {
          renderNotificationDropdownList();
        }

        // Close other panels
        profileDropdown?.classList.remove('active');
        drawer?.classList.remove('open');
        toggle?.classList.remove('open');
      });
    }

    // Bind Logout Buttons
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

    // Mark All Read from Dropdown
    const markAllReadBtn = $('#markAllReadDropdownBtn');
    if (markAllReadBtn) {
      markAllReadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentUser = JSON.parse(localStorage.getItem('fs360_currentUser'));
        if (!currentUser) return;

        const allNotifs = JSON.parse(localStorage.getItem('fs360_notifications') || '[]');
        let updated = false;
        allNotifs.forEach(n => {
          if ((n.role === currentUser.role || n.role === 'all') && !n.read) {
            n.read = true;
            updated = true;
          }
        });

        if (updated) {
          localStorage.setItem('fs360_notifications', JSON.stringify(allNotifs));
          showToast('success', 'Inbox Read', 'All notifications marked as read.');
          
          updateNotifBadge();
          renderNotificationDropdownList();
          
          if (typeof initNotificationsPage === 'function') {
            initNotificationsPage();
          }
        }
      });
    }

    // Click outside to close dropdowns
    document.addEventListener('click', (e) => {
      if (profileDropdown && !profileTrigger?.contains(e.target) && !profileDropdown.contains(e.target) && !mobileAvatar?.contains(e.target)) {
        profileDropdown.classList.remove('active');
      }
      if (notifDropdown && !notifBell?.contains(e.target) && !notifDropdown.contains(e.target)) {
        notifDropdown.classList.remove('active');
      }
    });
  }

  function updateNotifBadge() {
    const badge = $('#notifBellBadge');
    if (!badge) return;

    const currentUser = JSON.parse(localStorage.getItem('fs360_currentUser') || 'null');
    if (!currentUser) return;

    const notifications = JSON.parse(localStorage.getItem('fs360_notifications') || '[]');
    const userNotifs = notifications.filter(n => n.role === currentUser.role || n.role === 'all');
    const unreadCount = userNotifs.filter(n => !n.read).length;

    badge.textContent = unreadCount;
    if (unreadCount > 0) {
      badge.style.display = '';
    } else {
      badge.style.display = 'none';
    }
  }

  function renderNotificationDropdownList() {
    const listContainer = $('#notifDropdownBody');
    if (!listContainer) return;

    const currentUser = JSON.parse(localStorage.getItem('fs360_currentUser'));
    if (!currentUser) return;

    const notifs = JSON.parse(localStorage.getItem('fs360_notifications') || '[]');
    const userNotifs = notifs.filter(n => n.role === currentUser.role || n.role === 'all');
    const latestNotifs = [...userNotifs].reverse().slice(0, 5);

    if (latestNotifs.length === 0) {
      listContainer.innerHTML = `
        <div style="padding: 20px; text-align: center; color: var(--ink-soft); font-size: 0.82rem;">
          No notifications yet.
        </div>`;
      return;
    }

    let html = '';
    latestNotifs.forEach(n => {
      let iconColor = 'var(--green)';
      let iconBg = 'var(--sage)';
      let iconSvg = '';

      if (n.type === 'success') {
        iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3"/></svg>';
      } else if (n.type === 'alert') {
        iconColor = '#E0463A';
        iconBg = '#FEE2E2';
        iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
      } else { // match
        iconColor = 'var(--orange-dark)';
        iconBg = 'var(--orange-soft)';
        iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8 6 6 9 6 13a6 6 0 0 0 12 0c0-4-2-7-6-11z"/></svg>';
      }

      const unreadClass = !n.read ? 'unread' : '';
      const actionHtml = !n.read 
        ? `<button class="notif-item-action mark-single-read-dropdown-btn" data-id="${n.id}" title="Mark as read">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
           </button>` 
        : '';

      html += `
        <div class="notif-panel-item ${unreadClass}">
          <div class="notif-item-icon" style="background: ${iconBg}; color: ${iconColor};">
            <span style="width:16px; height:16px; display:block;">${iconSvg}</span>
          </div>
          <div class="notif-item-content">
            <span class="notif-item-title">${n.title}</span>
            <span class="notif-item-desc">${n.desc}</span>
            <span class="notif-item-time">${n.time}</span>
          </div>
          ${actionHtml}
        </div>`;
    });

    listContainer.innerHTML = html;

    $$('.mark-single-read-dropdown-btn', listContainer).forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const allNotifs = JSON.parse(localStorage.getItem('fs360_notifications') || '[]');
        const match = allNotifs.find(n => n.id === id);
        if (match) {
          match.read = true;
          localStorage.setItem('fs360_notifications', JSON.stringify(allNotifs));
          showToast('success', 'Notification Read', 'Alert marked as read.');
          
          updateNotifBadge();
          renderNotificationDropdownList();
          
          if (typeof initNotificationsPage === 'function') {
            initNotificationsPage();
          }
        }
      });
    });
  }

  function propagateAvatars() {
    const currentUser = JSON.parse(localStorage.getItem('fs360_currentUser') || 'null');
    if (!currentUser) return;

    const isDonor = currentUser.role === 'donor';
    const userAvatar = currentUser.avatar || (isDonor ? DEFAULT_AVATAR : DEFAULT_NGO_AVATAR);

    // Dashboard header profile avatar
    const headerAvatar = $('#dashboardHeaderAvatar');
    if (headerAvatar) {
      headerAvatar.src = userAvatar;
      headerAvatar.alt = currentUser.name;
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
    const donorPages = ['donor-dashboard.html', 'create-donation.html', 'my-donations.html', 'profile-donor.html'];
    const ngoPages = ['ngo-dashboard.html', 'accepted-donations.html', 'donation-details.html', 'ngo-reports.html', 'profile-ngo.html'];

    // If logged in, prevent accessing login and register pages, auto-redirect to dashboards
    if (currentUser && (path === 'login.html' || path === 'register.html')) {
      window.location.href = currentUser.role === 'donor' ? 'donor-dashboard.html' : 'ngo-dashboard.html';
      return;
    }

    // If logged in on landing page, update navbar actions dynamically
    if (currentUser && (path === 'index.html' || path === '' || path === '/')) {
      const navActions = $('.nav-actions');
      const navbar = $('.navbar');
      if (navActions && navbar) {
        const dashboardUrl = currentUser.role === 'donor' ? 'donor-dashboard.html' : 'ngo-dashboard.html';
        const isDonor = currentUser.role === 'donor';
        const userAvatar = currentUser.avatar || (isDonor ? DEFAULT_AVATAR : DEFAULT_NGO_AVATAR);
        const roleBadgeClass = isDonor ? 'badge-donor' : 'badge-ngo';
        const profilePage = isDonor ? 'profile-donor.html' : 'profile-ngo.html';

        // Unread count
        const notifications = JSON.parse(localStorage.getItem('fs360_notifications') || '[]');
        const userNotifs = notifications.filter(n => n.role === currentUser.role || n.role === 'all');
        const unreadCount = userNotifs.filter(n => !n.read).length;
        const badgeStyle = unreadCount > 0 ? '' : 'style="display: none;"';

        navActions.innerHTML = `
          <a href="${dashboardUrl}" class="btn btn-primary" style="margin-right:10px;" data-transition>Go to Dashboard</a>
          
          <!-- Notification Bell Icon -->
          <div class="notif-bell-container" style="margin-right:10px;">
            <button class="notif-bell-btn" id="notifBellBtn" aria-label="Notifications">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span class="notif-badge" id="notifBellBadge" ${badgeStyle}>${unreadCount}</span>
            </button>
            <div class="notif-dropdown-panel" id="notifDropdownPanel">
              <div class="notif-panel-header">
                <h4>Recent Notifications</h4>
                <button class="btn btn-ghost btn-xs" id="markAllReadDropdownBtn" style="font-size: 0.72rem; padding: 4px 8px; font-weight: 700;">Mark all read</button>
              </div>
              <div class="notif-panel-body" id="notifDropdownBody"></div>
              <div class="notif-panel-footer">
                <a href="notifications.html" class="notif-view-all" data-transition>View All Notifications</a>
              </div>
            </div>
          </div>

          <!-- User Profile Avatar with Dropdown -->
          <div class="profile-dropdown-container">
            <button class="profile-trigger-btn" id="profileTriggerBtn" aria-label="Toggle profile menu">
              <img class="nav-profile-avatar" id="navProfileAvatar" src="${userAvatar}" alt="${currentUser.name}">
            </button>
            <div class="profile-dropdown-menu" id="profileDropdown">
              <div class="dropdown-header-info">
                <span class="dropdown-user-name">${currentUser.name}</span>
                <span class="dropdown-user-role ${roleBadgeClass}">${currentUser.role}</span>
              </div>
              <a href="${profilePage}" class="dropdown-item" data-transition>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                View Profile
              </a>
              <a href="${profilePage}" class="dropdown-item" data-transition>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                Edit Profile
              </a>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item logout-btn" style="color: #E0463A;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E0463A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                Logout
              </button>
            </div>
          </div>

          <button class="nav-toggle" id="navToggle" aria-label="Toggle menu" aria-expanded="false" style="margin-left: 10px;">
            <span></span><span></span><span></span>
          </button>
        `;
        
        let mobileDrawer = $('#mobileMenuDrawer');
        if (!mobileDrawer) {
          mobileDrawer = document.createElement('div');
          mobileDrawer.id = 'mobileMenuDrawer';
          mobileDrawer.className = 'mobile-menu-drawer';
          navbar.appendChild(mobileDrawer);
        }

        let mobileLinksHtml = '';
        if (isDonor) {
          mobileLinksHtml = `
            <a href="donor-dashboard.html" class="mobile-nav-item">Dashboard</a>
            <a href="create-donation.html" class="mobile-nav-item">List Food</a>
            <a href="my-donations.html" class="mobile-nav-item">Donations</a>
            <a href="emergency-requests.html" class="mobile-nav-item">Emergency</a>
            <a href="${profilePage}" class="mobile-nav-item">Profile</a>
          `;
        } else {
          mobileLinksHtml = `
            <a href="ngo-dashboard.html" class="mobile-nav-item">Dashboard</a>
            <a href="accepted-donations.html" class="mobile-nav-item">Accepted</a>
            <a href="emergency-requests.html" class="mobile-nav-item">Emergency</a>
            <a href="${profilePage}" class="mobile-nav-item">Profile</a>
          `;
        }
        mobileDrawer.innerHTML = `
          <div class="mobile-user-row">
            <img class="nav-profile-avatar clickable-mobile-avatar" id="mobileNavAvatar" src="${userAvatar}" alt="${currentUser.name}">
            <div class="mobile-user-meta">
              <span class="nav-user-name">${currentUser.name}</span>
              <span class="nav-user-role ${roleBadgeClass}">${currentUser.role}</span>
            </div>
          </div>
          <div class="mobile-nav-grid">
            ${mobileLinksHtml}
          </div>
        `;
        
        setupNavbarListeners();
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

      // Dynamically display links matching the current user role
      if (currentUser.role === 'donor') {
        $$('.ngo-only').forEach(el => el.style.display = 'none');
        $$('.donor-only').forEach(el => el.style.display = '');
      } else if (currentUser.role === 'ngo') {
        $$('.donor-only').forEach(el => el.style.display = 'none');
        $$('.ngo-only').forEach(el => el.style.display = '');
      }
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
    const currentUser = JSON.parse(localStorage.getItem('fs360_currentUser') || 'null');

    // 1. Add current NGO marker (green)
    if (currentUser) {
      const NGO_COORDS = {
        'Food Relief Foundation': [9.9285, 78.1250],
        'Community Kitchen Madurai': [9.9320, 78.1090],
        'Helping Hands NGO': [9.9220, 78.1310],
        'Annai Food Support Trust': [9.9180, 78.1110]
      };
      const ngoCoords = NGO_COORDS[currentUser.name] || [9.9252, 78.1198];
      const ngoMarker = L.marker(ngoCoords, { icon: createCustomIcon(true) })
        .addTo(map)
        .bindPopup(`<strong>${currentUser.name} (You)</strong><br>NGO Workspace Location`);
      markers.push(ngoMarker);
    }

    // 2. Add available (pending) donation markers (orange)
    pendingDons.forEach(d => {
      if (d.latitude && d.longitude) {
        const marker = L.marker([d.latitude, d.longitude], { icon: createCustomIcon(false) })
          .addTo(map)
          .bindPopup(`
            <strong>${d.foodItem}</strong><br>
            Quantity: ${d.quantity}<br>
            Expiry: ${d.expiry}<br>
            Donor: <strong>${d.donorName}</strong><br>
            Phone: <strong>${d.donorPhone || 'N/A'}</strong><br>
            Email: <strong>${d.donorEmail}</strong><br>
            <div style="display:flex; gap:6px; margin-top:8px;">
              ${d.donorPhone ? `<a href="tel:${d.donorPhone}" class="btn btn-ghost btn-sm" style="flex:1; padding:4px; font-size:0.7rem; text-align:center; border:1px solid var(--line); border-radius:4px; display:inline-block; text-decoration:none;">Call</a>` : ''}
              <a href="mailto:${d.donorEmail}" class="btn btn-ghost btn-sm" style="flex:1; padding:4px; font-size:0.7rem; text-align:center; border:1px solid var(--line); border-radius:4px; display:inline-block; text-decoration:none;">Email</a>
            </div>
            <button class="btn btn-primary btn-sm accept-map-btn" data-id="${d.id}" style="margin-top:8px; padding:6px 12px; font-size:0.75rem; width:100%;">Accept Match</button>
          `);
        markers.push(marker);
      }
    });

    // 3. Add active pickup locations for this NGO (green markers)
    if (currentUser) {
      const allDons = JSON.parse(localStorage.getItem('fs360_donations') || '[]');
      const activePickups = allDons.filter(d => d.matchedNgo === currentUser.name && d.status === 'Accepted');
      activePickups.forEach(d => {
        if (d.latitude && d.longitude) {
          const marker = L.marker([d.latitude, d.longitude], { icon: createCustomIcon(true) })
            .addTo(map)
            .bindPopup(`
              <strong>Active Pickup: ${d.foodItem}</strong><br>
              Quantity: ${d.quantity}<br>
              Donor: <strong>${d.donorName}</strong><br>
              Phone: <strong>${d.donorPhone || 'N/A'}</strong><br>
              Status: <span class="status-badge status-accepted">${d.status}</span><br>
              <a href="donation-details.html?id=${d.id}" class="btn btn-ghost btn-sm" style="margin-top:8px; padding:6px 12px; font-size:0.75rem; display:inline-block; width:100%; text-align:center; border:1px solid var(--line); border-radius:4px; text-decoration:none;">View Details</a>
            `);
          markers.push(marker);
        }
      });
    }

    map.on('popupopen', (e) => {
      const btn = e.popup.getElement().querySelector('.accept-map-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          const donId = btn.dataset.id;
          const allDons = JSON.parse(localStorage.getItem('fs360_donations') || '[]');

          const don = allDons.find(item => item.id === donId);
          if (don) {
            don.status = 'Accepted';
            don.matchedNgo = currentUser.name;
            don.ngoEmail = currentUser.email;
            don.acceptedAt = new Date().toISOString();
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
            Donor: <strong>${d.donorName}</strong><br>
            Phone: <strong>${d.donorPhone || 'N/A'}</strong><br>
            Email: <strong>${d.donorEmail}</strong><br>
            Status: <strong>${d.status}</strong><br>
            <div style="display:flex; gap:6px; margin-top:8px; margin-bottom:4px;">
              ${d.donorPhone ? `<a href="tel:${d.donorPhone}" class="btn btn-ghost btn-sm" style="flex:1; padding:4px; font-size:0.7rem; text-align:center; border:1px solid var(--line); border-radius:4px; display:inline-block; text-decoration:none;">Call</a>` : ''}
              <a href="mailto:${d.donorEmail}" class="btn btn-ghost btn-sm" style="flex:1; padding:4px; font-size:0.7rem; text-align:center; border:1px solid var(--line); border-radius:4px; display:inline-block; text-decoration:none;">Email</a>
            </div>
            <a href="donation-details.html?id=${d.id}" class="btn btn-ghost btn-sm" style="margin-top:4px; padding:6px 12px; font-size:0.75rem; display:inline-block; width:100%; text-align:center;">View Details</a>
          `);
        markers.push(marker);
      }
    });

    if (markers.length > 0) {
      const group = new L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  /* Helper to compress uploaded image via Canvas to fit localStorage limit (<30kb) */
  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const max_size = 400; // Keep long edge under 400px
          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7); // compress to quality 0.7 JPEG
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  }

  const PEXELS_API_KEY = "pO9cJ0X9tvDogb8z5rFMCVhaQGCzVjfktbtbPWs7g8Wh1jUxWQtST56D";

  /* Async helper to fetch first matching food image from Pexels API */
  async function searchPexels(foodItem) {
    try {
      const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(foodItem)}&per_page=1`, {
        headers: {
          'Authorization': PEXELS_API_KEY
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.photos && data.photos.length > 0) {
          return data.photos[0].src.medium; // medium size is perfect for cards and details
        }
      }
    } catch (error) {
      console.warn('Pexels API fetch failed, using fallback:', error);
    }
    // Fallback image categorizer
    return getFoodPhoto(foodItem);
  }

  /* Donation logic for forms and views */
  function initCreateDonationForm() {
    const form = $('#createDonationForm');
    if (!form) return;

    const fileInput = $('#photoUploadInput', form);
    const uploadPlaceholder = $('#uploadPlaceholder', form);
    const previewContainer = $('#uploadPreviewContainer', form);
    const previewImg = $('#uploadPreviewImg', form);
    const fileNameDiv = $('#uploadFileName', form);
    const removeBtn = $('#removePhotoBtn', form);

    // Handle file input changes and drag-over / drop
    if (fileInput) {
      const handleFile = async (file) => {
        if (!file || !file.type.startsWith('image/')) {
          showToast('warn', 'Invalid File', 'Please select a valid image file.');
          return;
        }
        try {
          const compressedBase64 = await compressImage(file);
          if (previewImg) previewImg.src = compressedBase64;
          if (fileNameDiv) fileNameDiv.textContent = file.name;
          if (previewContainer) previewContainer.style.display = 'flex';
          if (uploadPlaceholder) uploadPlaceholder.style.display = 'none';
        } catch (err) {
          console.error('Image compression error:', err);
          showToast('error', 'Upload Error', 'Failed to compress image.');
        }
      };

      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleFile(file);
      });

      // drag & drop styling / mechanics
      const dropZone = fileInput.parentElement;
      if (dropZone) {
        ['dragenter', 'dragover'].forEach(eventName => {
          dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--green)';
            dropZone.style.background = 'var(--sage)';
          }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
          dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--line)';
            dropZone.style.background = 'var(--white)';
          }, false);
        });

        dropZone.addEventListener('drop', (e) => {
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        });
      }
    }

    // Handle Remove Button click
    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (fileInput) fileInput.value = '';
        if (previewImg) previewImg.src = '';
        if (previewContainer) previewContainer.style.display = 'none';
        if (uploadPlaceholder) uploadPlaceholder.style.display = 'flex';
      });
    }

    // Handle Form Submit
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const foodItem = $('#foodItem', form).value.trim();
      const quantityVal = $('#quantity', form).value.trim();
      const expiryVal = $('#expiry', form).value.trim();
      const pickupNotes = $('#pickupNotes', form).value.trim();
      
      if (!foodItem || !quantityVal || !expiryVal) {
        showToast('error', 'Incomplete Form', 'Please fill in all required fields.');
        return;
      }

      const submitBtn = $('button[type="submit"]', form);
      submitBtn.classList.add('is-loading');
      submitBtn.disabled = true;

      try {
        let photoUrl = '';
        // If user uploaded a photo, use the Base64 representation
        if (previewImg && previewImg.src && !previewImg.src.startsWith(window.location.origin) && previewImg.src !== '') {
          photoUrl = previewImg.src;
        } else {
          // Otherwise, fetch from Pexels API in background
          photoUrl = await searchPexels(foodItem);
        }

        // Format Expiry Date beautifully
        const expiryDate = new Date(expiryVal);
        const formattedExpiry = 'Pickup Before: ' + expiryDate.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

        const currentUser = JSON.parse(localStorage.getItem('fs360_currentUser'));
        const donations = JSON.parse(localStorage.getItem('fs360_donations') || '[]');
        
        const lat = 9.9252 + (Math.random() - 0.5) * 0.02;
        const lon = 78.1198 + (Math.random() - 0.5) * 0.02;

        const newDonation = {
          id: 'don_' + Date.now(),
          foodItem,
          quantity: quantityVal + ' Servings',
          expiry: formattedExpiry,
          pickupNotes,
          donorName: currentUser.name,
          donorEmail: currentUser.email,
          donorPhone: currentUser.phone || '',
          status: 'Pending',
          matchedNgo: '',
          latitude: lat,
          longitude: lon,
          photoUrl: photoUrl
        };
        
        donations.push(newDonation);
        localStorage.setItem('fs360_donations', JSON.stringify(donations));
        
        showToast('success', 'Donation Created', 'Your surplus food donation listing is active!');
        
        setTimeout(() => {
          window.location.href = 'my-donations.html';
        }, 1000);
      } catch (err) {
        console.error('Error listing food:', err);
        showToast('error', 'Error', 'Something went wrong listing food.');
      } finally {
        submitBtn.classList.remove('is-loading');
        submitBtn.disabled = false;
      }
    });
  }

  function initMyDonations() {
    const container = $('#myDonationsList');
    if (!container) return;

    const currentUser = JSON.parse(localStorage.getItem('fs360_currentUser'));
    const donations = JSON.parse(localStorage.getItem('fs360_donations') || '[]');
    const myDons = donations.filter(d => d.donorEmail === currentUser.email);

    // Compute dynamic dashboard stats if on Donor Dashboard
    const statsFoodContributedEl = $('#statsFoodContributed');
    const statsCarbonSavedEl = $('#statsCarbonSaved');
    const statsNgoPartnersEl = $('#statsNgoPartners');

    if (statsFoodContributedEl || statsCarbonSavedEl || statsNgoPartnersEl) {
      let totalMeals = 0;
      const matchedNgos = new Set();

      myDons.forEach(d => {
        const qtyNum = parseInt(d.quantity) || 0;
        if (d.status === 'Accepted' || d.status === 'Delivered') {
          totalMeals += qtyNum;
          if (d.matchedNgo) matchedNgos.add(d.matchedNgo);
        }
      });

      if (statsFoodContributedEl) {
        const baseMeals = 340 + totalMeals;
        statsFoodContributedEl.textContent = `${baseMeals.toLocaleString()} meals`;
      }
      if (statsCarbonSavedEl) {
        // Assume roughly 0.45kg CO2 saved per meal
        const baseCarbon = 150 + Math.round(totalMeals * 0.45);
        statsCarbonSavedEl.textContent = `${baseCarbon.toLocaleString()} kg`;
      }
      if (statsNgoPartnersEl) {
        const baseNgos = 4 + matchedNgos.size;
        statsNgoPartnersEl.textContent = `${baseNgos} NGOs`;
      }
    }
    
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
          <td data-label="Food Item">
            <div style="display:flex; align-items:center; gap:12px;">
              ${d.photoUrl ? `<img src="${d.photoUrl}" style="width:40px; height:40px; border-radius:6px; object-fit:cover;" loading="lazy">` : ''}
              <strong>${d.foodItem}</strong>
            </div>
          </td>
          <td data-label="Quantity">${d.quantity}</td>
          <td data-label="Expiry Window">${d.expiry}</td>
          <td data-label="Status"><span class="status-badge ${statusClass}">${d.status}</span></td>
          <td data-label="Matched NGO">${d.matchedNgo ? `Matched with <strong>${d.matchedNgo}</strong>` : 'Awaiting match...'}</td>
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
    const users = JSON.parse(localStorage.getItem('fs360_users') || '[]');
    pendingDons.forEach(d => {
      const donorUser = users.find(u => u.email === d.donorEmail);
      const donorAvatar = donorUser?.avatar || DEFAULT_AVATAR;
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
            
            <div class="contact-details" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--line); font-size: 0.82rem;">
              <div style="margin-bottom: 8px; color: var(--ink); display: flex; align-items: center; gap: 8px;">
                <img class="card-user-avatar" src="${donorAvatar}" alt="${d.donorName}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;">
                <span>Donor: <strong>${d.donorName}</strong></span>
              </div>
              <div style="margin-bottom: 4px; color: var(--ink-soft);">Phone: <strong>${d.donorPhone || 'N/A'}</strong></div>
              <div style="margin-bottom: 8px; color: var(--ink-soft);">Email: <strong>${d.donorEmail}</strong></div>
              <div style="display: flex; gap: 8px; margin-top: 8px; margin-bottom: 4px;">
                ${d.donorPhone ? `<a href="tel:${d.donorPhone}" class="btn btn-ghost btn-sm" style="flex: 1; padding: 6px; font-size: 0.75rem; text-align: center; border: 1px solid var(--line); border-radius: 6px; display: flex; align-items: center; justify-content: center; background: transparent; cursor: pointer; text-decoration: none;">Call Donor</a>` : ''}
                <a href="mailto:${d.donorEmail}" class="btn btn-ghost btn-sm" style="flex: 1; padding: 6px; font-size: 0.75rem; text-align: center; border: 1px solid var(--line); border-radius: 6px; display: flex; align-items: center; justify-content: center; background: transparent; cursor: pointer; text-decoration: none;">Email Donor</a>
              </div>
            </div>

            <div class="don-card-actions" style="margin-top: 12px; padding-top: 0;">
              <button class="btn btn-primary accept-don-btn" data-id="${d.id}" style="width: 100%;">Accept Match</button>
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
          don.acceptedAt = new Date().toISOString();
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
    const currentUser = JSON.parse(localStorage.getItem('fs360_currentUser'));
    if (!currentUser) return;
    const donations = JSON.parse(localStorage.getItem('fs360_donations') || '[]');
    const acceptedDons = donations.filter(d => d.ngoEmail === currentUser.email);

    // Compute dynamic dashboard stats if on NGO Dashboard page
    const statsPeopleServedEl = $('#statsPeopleServed');
    const statsFoodReceivedEl = $('#statsFoodReceived');
    const statsMealsDistributedEl = $('#statsMealsDistributed');
    const statsActiveMatchesEl = $('#statsActiveMatches');

    if (statsPeopleServedEl || statsFoodReceivedEl || statsMealsDistributedEl || statsActiveMatchesEl) {
      let totalMeals = 0;
      let activeCount = 0;
      let completedCount = 0;

      acceptedDons.forEach(d => {
        const qtyNum = parseInt(d.quantity) || 0;
        if (d.status === 'Delivered') {
          totalMeals += qtyNum;
          completedCount++;
        } else if (d.status === 'Accepted') {
          activeCount++;
        }
      });

      // Update elements dynamically
      if (statsPeopleServedEl) {
        // Estimate 1 person served per meal, plus some baseline
        const basePeople = 1200 + totalMeals;
        statsPeopleServedEl.textContent = `${basePeople.toLocaleString()}+ served`;
      }
      if (statsFoodReceivedEl) {
        // Assume roughly 0.25kg per meal + baseline
        const totalKg = 420 + (totalMeals * 0.25);
        statsFoodReceivedEl.textContent = `${Math.round(totalKg).toLocaleString()} kg received`;
      }
      if (statsMealsDistributedEl) {
        const baseMeals = 1850 + totalMeals;
        statsMealsDistributedEl.textContent = `${baseMeals.toLocaleString()}+ meals`;
      }
      if (statsActiveMatchesEl) {
        statsActiveMatchesEl.textContent = `${activeCount} active match${activeCount === 1 ? '' : 'es'}`;
      }
    }

    if (!container) return;

    // Also initialize Leaflet Map on accepted-donations.html for active pickups routing
    initAcceptedPickupsMap(acceptedDons);

    if (acceptedDons.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>You haven't accepted any donations yet.</p>
          <a href="ngo-dashboard.html#availableDonationsSection" class="btn btn-accent btn-sm">Browse Available Food</a>
        </div>`;
      return;
    }
    
    let html = `
      <table class="dashboard-table">
        <thead>
          <tr>
            <th>Food Item</th>
            <th>Quantity</th>
            <th>Donor Contact Details</th>
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
          <td data-label="Food Item">
            <div style="display:flex; align-items:center; gap:12px;">
              ${d.photoUrl ? `<img src="${d.photoUrl}" style="width:40px; height:40px; border-radius:6px; object-fit:cover;" loading="lazy">` : ''}
              <strong>${d.foodItem}</strong>
            </div>
          </td>
          <td data-label="Quantity">${d.quantity}</td>
          <td data-label="Donor Contact Details">
            <div style="font-size: 0.85rem; line-height: 1.4; color: var(--ink);">
              <div><strong>${d.donorName}</strong></div>
              <div style="color: var(--ink-soft);">${d.donorEmail}</div>
              <div style="color: var(--ink-soft);">${d.donorPhone || 'N/A'}</div>
              <div style="display: flex; gap: 8px; margin-top: 6px;">
                ${d.donorPhone ? `<a href="tel:${d.donorPhone}" class="btn btn-ghost btn-xs" style="padding: 2px 6px; font-size: 0.7rem; border: 1px solid var(--line); border-radius: 4px; display: inline-block; text-decoration: none;">Call</a>` : ''}
                <a href="mailto:${d.donorEmail}" class="btn btn-ghost btn-xs" style="padding: 2px 6px; font-size: 0.7rem; border: 1px solid var(--line); border-radius: 4px; display: inline-block; text-decoration: none;">Email</a>
              </div>
            </div>
          </td>
          <td data-label="Status"><span class="status-badge ${statusClass}">${d.status}</span></td>
          <td data-label="Actions"><a href="donation-details.html?id=${d.id}" class="btn btn-ghost btn-sm">View Details</a></td>
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
    const users = JSON.parse(localStorage.getItem('fs360_users') || '[]');
    const donorUser = users.find(u => u.email === don.donorEmail);
    const donorAvatar = donorUser?.avatar || DEFAULT_AVATAR;

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
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px;">
              <img class="nav-profile-avatar" src="${donorAvatar}" alt="${don.donorName}" style="width: 50px; height: 50px; border: 2.5px solid var(--white); box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <div>
                <div style="font-weight: 700; font-size: 1.05rem; color: var(--ink);">${don.donorName}</div>
                <div style="font-size: 0.82rem; color: var(--ink-soft);">Food Donor Partner</div>
              </div>
            </div>
            <p>Email: <strong>${don.donorEmail}</strong></p>
            <p>Contact Phone: <strong>${don.donorPhone || 'N/A'}</strong></p>
            <div style="display: flex; gap: 12px; margin-top: 14px;">
              ${don.donorPhone ? `<a href="tel:${don.donorPhone}" class="btn btn-ghost btn-sm" style="padding: 8px 16px; border: 1px solid var(--line); border-radius: 8px; font-weight: 600; display: inline-block; text-decoration: none;">Call Donor</a>` : ''}
              <a href="mailto:${don.donorEmail}" class="btn btn-ghost btn-sm" style="padding: 8px 16px; border: 1px solid var(--line); border-radius: 8px; font-weight: 600; display: inline-block; text-decoration: none;">Email Donor</a>
            </div>
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
        don.deliveredAt = new Date().toISOString();
        localStorage.setItem('fs360_donations', JSON.stringify(allDons));
        showToast('success', 'Status Updated', 'Donation has been successfully marked as collected/delivered!');
        initDonationDetails();
      });
    }
  }

  /* NGO Reporting Center implementation */
  function initNgoReports() {
    const pageEl = $('#ngoReportsPage');
    if (!pageEl) return;

    const currentUser = JSON.parse(localStorage.getItem('fs360_currentUser'));
    const donations = JSON.parse(localStorage.getItem('fs360_donations') || '[]');
    const acceptedDons = donations.filter(d => d.ngoEmail === currentUser.email);

    // Tab buttons
    const tabBtnDonation = $('#tabBtnDonation');
    const tabBtnDistribution = $('#tabBtnDistribution');
    const tabBtnInvoice = $('#tabBtnInvoice');
    const tabBtnHistory = $('#tabBtnHistory');

    // View containers
    const viewDonation = $('#viewDonationReport');
    const viewDistribution = $('#viewDistributionReport');
    const viewInvoice = $('#viewInvoiceReceipt');
    const viewHistory = $('#viewDonationHistory');

    const tabs = [
      { btn: tabBtnDonation, view: viewDonation, name: 'donation' },
      { btn: tabBtnDistribution, view: viewDistribution, name: 'distribution' },
      { btn: tabBtnInvoice, view: viewInvoice, name: 'invoice' },
      { btn: tabBtnHistory, view: viewHistory, name: 'history' }
    ];

    function activateTab(tabName) {
      tabs.forEach(t => {
        if (t.name === tabName) {
          if (t.btn) t.btn.classList.add('active');
          if (t.view) t.view.classList.add('active');
        } else {
          if (t.btn) t.btn.classList.remove('active');
          if (t.view) t.view.classList.remove('active');
        }
      });
    }

    // Set active tab based on query param
    const urlParams = new URLSearchParams(window.location.search);
    const initialTab = urlParams.get('tab') || 'donation';
    activateTab(initialTab);

    // Bind tab clicks
    tabs.forEach(t => {
      if (t.btn) {
        t.btn.addEventListener('click', () => {
          activateTab(t.name);
          // Update URL silently
          const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?tab=' + t.name;
          window.history.pushState({ path: newUrl }, '', newUrl);
        });
      }
    });

    // 1. Generate Donation Report
    function renderDonationReport() {
      const tableContainer = $('#donationReportTableContainer');
      if (!tableContainer) return;

      if (acceptedDons.length === 0) {
        tableContainer.innerHTML = `
          <div class="empty-state">
            <p>You haven't accepted any donations yet to generate a report.</p>
            <a href="ngo-dashboard.html#availableDonationsSection" class="btn btn-accent btn-sm">Browse Available Food</a>
          </div>`;
        return;
      }

      let html = `
        <table class="dashboard-table">
          <thead>
            <tr>
              <th>NGO Name</th>
              <th>Donation ID</th>
              <th>Donor Name</th>
              <th>Food Item</th>
              <th>Quantity</th>
              <th>Acceptance Date</th>
              <th>Distribution Status</th>
              <th>Distribution Date</th>
            </tr>
          </thead>
          <tbody>`;

      acceptedDons.reverse().forEach(d => {
        const acceptDate = d.acceptedAt ? new Date(d.acceptedAt).toLocaleDateString() + ' ' + new Date(d.acceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';
        const deliveryDate = d.deliveredAt ? new Date(d.deliveredAt).toLocaleDateString() + ' ' + new Date(d.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';
        let statusClass = 'status-accepted';
        if (d.status === 'Delivered') statusClass = 'status-delivered';

        html += `
          <tr>
            <td data-label="NGO Name"><strong>${currentUser.name}</strong></td>
            <td data-label="Donation ID"><code>${d.id}</code></td>
            <td data-label="Donor Name">${d.donorName}</td>
            <td data-label="Food Item">
              <div style="display:flex; align-items:center; gap:8px;">
                ${d.photoUrl ? `<img src="${d.photoUrl}" style="width:30px; height:30px; border-radius:4px; object-fit:cover;" loading="lazy">` : ''}
                <span>${d.foodItem}</span>
              </div>
            </td>
            <td data-label="Quantity"><strong>${d.quantity}</strong></td>
            <td data-label="Acceptance Date">${acceptDate}</td>
            <td data-label="Distribution Status"><span class="status-badge ${statusClass}">${d.status}</span></td>
            <td data-label="Distribution Date">${deliveryDate}</td>
          </tr>`;
      });

      html += `</tbody></table>`;
      tableContainer.innerHTML = html;
    }

    // 2. Generate Distribution Report
    function renderDistributionReport() {
      const statsGrid = $('#distributionStatsGrid');
      const tableContainer = $('#distributionSummaryTableContainer');
      if (!statsGrid || !tableContainer) return;

      let totalReceived = acceptedDons.length;
      let totalMeals = 0;
      let activeCount = 0;
      let completedCount = 0;

      acceptedDons.forEach(d => {
        const qtyNum = parseInt(d.quantity) || 0;
        if (d.status === 'Delivered') {
          totalMeals += qtyNum;
          completedCount++;
        } else if (d.status === 'Accepted') {
          activeCount++;
        }
      });

      // estimate people served: 1.2 persons per meal
      let totalPeopleServed = Math.round(totalMeals * 1.2);

      // Render stats cards
      statsGrid.innerHTML = `
        <div class="impact-card" style="padding: 20px;">
          <div class="ic-icon" style="background:var(--sage);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B6B4A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <h3>${totalReceived}</h3>
          <p class="ic-label" style="margin-bottom: 0;">Donations Claimed</p>
        </div>
        <div class="impact-card" style="padding: 20px;">
          <div class="ic-icon" style="background:var(--orange-soft);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF7A33" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7h-9a2 2 0 0 0-2 2v9"/><path d="M14 17H5a2 2 0 0 1-2-2V6"/></svg>
          </div>
          <h3>${totalMeals.toLocaleString()}</h3>
          <p class="ic-label" style="margin-bottom: 0;">Meals Distributed</p>
        </div>
        <div class="impact-card" style="padding: 20px;">
          <div class="ic-icon" style="background:var(--orange-soft);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF7A33" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
          <h3>${totalPeopleServed.toLocaleString()}</h3>
          <p class="ic-label" style="margin-bottom: 0;">People Fed / Served</p>
        </div>
        <div class="impact-card" style="padding: 20px;">
          <div class="ic-icon" style="background:var(--sage);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1B6B4A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
          </div>
          <h3>${activeCount} Active / ${completedCount} Done</h3>
          <p class="ic-label" style="margin-bottom: 0;">Logistics Split</p>
        </div>
      `;

      // Render summary split table
      tableContainer.innerHTML = `
        <table class="dashboard-table">
          <thead>
            <tr>
              <th>Status Categorization</th>
              <th>Match Count</th>
              <th>Percentage Contribution</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td data-label="Status Categorization"><span class="status-badge status-accepted">Active Pickup (Accepted)</span></td>
              <td data-label="Match Count"><strong>${activeCount}</strong></td>
              <td data-label="Percentage Contribution">${totalReceived > 0 ? Math.round((activeCount / totalReceived) * 100) : 0}%</td>
            </tr>
            <tr>
              <td data-label="Status Categorization"><span class="status-badge status-delivered">Completed Distribution (Delivered)</span></td>
              <td data-label="Match Count"><strong>${completedCount}</strong></td>
              <td data-label="Percentage Contribution">${totalReceived > 0 ? Math.round((completedCount / totalReceived) * 100) : 0}%</td>
            </tr>
          </tbody>
        </table>
      `;
    }

    // 3. Generate Invoice / Receipt
    function renderInvoiceReceiptTab() {
      const selectEl = $('#invoiceDonationSelect');
      if (!selectEl) return;

      // Populate dropdown option selector
      selectEl.innerHTML = '<option value="">-- Choose Accepted Donation --</option>';
      acceptedDons.forEach(d => {
        const option = document.createElement('option');
        option.value = d.id;
        option.textContent = `${d.foodItem} - ${d.quantity} (by ${d.donorName}) [${d.status}]`;
        selectEl.appendChild(option);
      });

      const handleSelectDonation = (donId) => {
        const receiptContainer = $('#invoiceReceiptPrintContainer');
        const emptyState = $('#invoiceReceiptEmptyState');
        const cardEl = $('#invoiceReceiptCard');

        if (!donId) {
          if (receiptContainer) receiptContainer.style.display = 'none';
          if (emptyState) emptyState.style.display = 'block';
          return;
        }

        const don = acceptedDons.find(d => d.id === donId);
        if (!don) return;

        if (emptyState) emptyState.style.display = 'none';
        if (receiptContainer) receiptContainer.style.display = 'block';

        const refNo = `FS360-REF-${don.id.split('_')[1] || don.id}`;
        const acceptDate = don.acceptedAt ? new Date(don.acceptedAt).toLocaleDateString() + ' ' + new Date(don.acceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';
        const deliveryDate = don.deliveredAt ? new Date(don.deliveredAt).toLocaleDateString() + ' ' + new Date(don.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending Collection';

        if (cardEl) {
          cardEl.innerHTML = `
            <div class="invoice-header">
              <div>
                <div class="invoice-brand">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--green);"><path d="M12 2C8 6 6 9 6 13a6 6 0 0 0 12 0c0-4-2-7-6-11z"/></svg>
                  FoodSphere 360
                </div>
                <div style="font-size: 0.85rem; color: #5C6A60; margin-top: 6px;">Surplus Rescue &amp; Distribution Network</div>
              </div>
              <div style="text-align: right;">
                <h1 class="invoice-title">RECEIPT</h1>
                <div style="font-size: 0.85rem; font-weight: 700; margin-top: 6px;">Ref: <code>${refNo}</code></div>
              </div>
            </div>

            <div class="invoice-details-grid">
              <div>
                <h5 style="text-transform: uppercase; font-size: 0.76rem; font-weight: 700; color: var(--green); margin: 0 0 8px;">Claimant NGO</h5>
                <div style="font-weight: 700; font-size: 1rem; color: #1A2E22;">${currentUser.name}</div>
                <div style="font-size: 0.85rem; color: #5C6A60; margin-top: 4px;">Email: ${currentUser.email}</div>
                <div style="font-size: 0.85rem; color: #5C6A60;">Phone: ${currentUser.phone || 'N/A'}</div>
              </div>
              <div style="text-align: right;">
                <h5 style="text-transform: uppercase; font-size: 0.76rem; font-weight: 700; color: var(--green); margin: 0 0 8px;">Donating Partner</h5>
                <div style="font-weight: 700; font-size: 1rem; color: #1A2E22;">${don.donorName}</div>
                <div style="font-size: 0.85rem; color: #5C6A60; margin-top: 4px;">Email: ${don.donorEmail}</div>
                <div style="font-size: 0.85rem; color: #5C6A60;">Phone: ${don.donorPhone || 'N/A'}</div>
              </div>
            </div>

            <table class="invoice-table">
              <thead>
                <tr>
                  <th>Item Description</th>
                  <th>Quantity / Vol.</th>
                  <th>Claim Date</th>
                  <th>Distribution Date</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div style="font-weight: 700; color: #1A2E22;">${don.foodItem}</div>
                    <div style="font-size: 0.75rem; color: #7F8E84; margin-top: 4px;">Notes: ${don.pickupNotes || 'None'}</div>
                  </td>
                  <td><strong>${don.quantity}</strong></td>
                  <td>${acceptDate}</td>
                  <td><span style="font-weight: 600; color: ${don.status === 'Delivered' ? 'var(--green-dark)' : '#E0463A'};">${deliveryDate}</span></td>
                </tr>
              </tbody>
            </table>

            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; border-top: 1px dashed #C4D3CB; padding-top: 24px;">
              <div>
                <div style="font-size: 0.8rem; color: #7F8E84;">Tax Exemption Reference: SEC-12A(1)(b)</div>
                <div style="font-size: 0.75rem; color: #7F8E84; margin-top: 2px;">This is a system-generated donation receipt. No physical signature is required.</div>
              </div>
              <div style="text-align: right; width: 200px;">
                <div style="border-bottom: 1px solid #7F8E84; height: 30px;"></div>
                <div style="font-size: 0.8rem; font-weight: 700; color: var(--green-dark); margin-top: 6px;">Authorized Signatory</div>
                <div style="font-size: 0.75rem; color: #7F8E84;">${currentUser.name} Logistics Desk</div>
              </div>
            </div>
          `;
        }
      };

      selectEl.addEventListener('change', (e) => {
        handleSelectDonation(e.target.value);
      });
    }

    // 4. Generate Donation History Log
    function renderDonationHistory(filterStatus = 'all') {
      const tableContainer = $('#donationHistoryTableContainer');
      if (!tableContainer) return;

      let filtered = acceptedDons;
      if (filterStatus !== 'all') {
        filtered = acceptedDons.filter(d => d.status === filterStatus);
      }

      if (filtered.length === 0) {
        tableContainer.innerHTML = `
          <div class="empty-state">
            <p>No historical records matching the "${filterStatus}" filter criteria were found.</p>
          </div>`;
        return;
      }

      let html = `
        <table class="dashboard-table">
          <thead>
            <tr>
              <th>Reference ID</th>
              <th>Food Item Description</th>
              <th>Donor Organization</th>
              <th>Volumetric Quantity</th>
              <th>Distribution Status</th>
              <th>Last Transaction Date</th>
            </tr>
          </thead>
          <tbody>`;

      filtered.reverse().forEach(d => {
        const transDate = d.deliveredAt ? new Date(d.deliveredAt).toLocaleDateString() : (d.acceptedAt ? new Date(d.acceptedAt).toLocaleDateString() : 'N/A');
        let statusClass = 'status-accepted';
        if (d.status === 'Delivered') statusClass = 'status-delivered';

        html += `
          <tr>
            <td data-label="Reference ID"><code>${d.id}</code></td>
            <td data-label="Food Item Description">
              <div style="display:flex; align-items:center; gap:8px;">
                ${d.photoUrl ? `<img src="${d.photoUrl}" style="width:30px; height:30px; border-radius:4px; object-fit:cover;" loading="lazy">` : ''}
                <strong>${d.foodItem}</strong>
              </div>
            </td>
            <td data-label="Donor Organization">${d.donorName}</td>
            <td data-label="Volumetric Quantity">${d.quantity}</td>
            <td data-label="Distribution Status"><span class="status-badge ${statusClass}">${d.status}</span></td>
            <td data-label="Last Transaction Date"><strong>${transDate}</strong></td>
          </tr>`;
      });

      html += `</tbody></table>`;
      tableContainer.innerHTML = html;
    }

    // Bind Print buttons
    $$('.print-report-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        window.print();
      });
    });

    const printInvoiceBtn = $('#printInvoiceBtn');
    if (printInvoiceBtn) {
      printInvoiceBtn.addEventListener('click', () => {
        window.print();
      });
    }

    const printHistoryBtn = $('#printHistoryBtn');
    if (printHistoryBtn) {
      printHistoryBtn.addEventListener('click', () => {
        window.print();
      });
    }

    // Bind History Filters
    const historyFilter = $('#historyFilter');
    if (historyFilter) {
      historyFilter.addEventListener('change', (e) => {
        renderDonationHistory(e.target.value);
      });
    }

    // Initial renders
    renderDonationReport();
    renderDistributionReport();
    renderInvoiceReceiptTab();
    renderDonationHistory();
  }

  /* ---------------------------------------------------------
     Profile Management System Logic
     --------------------------------------------------------- */
  function updateProfileStats(currentUser) {
    const donations = JSON.parse(localStorage.getItem('fs360_donations') || '[]');
    if (currentUser.role === 'donor') {
      const myDons = donations.filter(d => d.donorEmail === currentUser.email);
      let totalMeals = 0;
      const matchedNgos = new Set();
      myDons.forEach(d => {
        const qtyNum = parseInt(d.quantity) || 0;
        if (d.status === 'Accepted' || d.status === 'Delivered') {
          totalMeals += qtyNum;
          if (d.matchedNgo) matchedNgos.add(d.matchedNgo);
        }
      });
      const baseMeals = 340 + totalMeals;
      const baseCarbon = 150 + Math.round(totalMeals * 0.45);
      const baseNgos = 4 + matchedNgos.size;

      const statFood = $('#profileStatFood');
      const statCarbon = $('#profileStatCarbon');
      const statNgos = $('#profileStatNgos');
      if (statFood) statFood.textContent = `${baseMeals.toLocaleString()} meals`;
      if (statCarbon) statCarbon.textContent = `${baseCarbon.toLocaleString()} kg`;
      if (statNgos) statNgos.textContent = `${baseNgos} NGO${baseNgos !== 1 ? 's' : ''}`;
    } else {
      const acceptedDons = donations.filter(d => d.ngoEmail === currentUser.email);
      let totalMeals = 0;
      let activeCount = 0;
      acceptedDons.forEach(d => {
        const qtyNum = parseInt(d.quantity) || 0;
        if (d.status === 'Delivered') {
          totalMeals += qtyNum;
        } else if (d.status === 'Accepted') {
          activeCount++;
        }
      });
      const basePeople = 1200 + totalMeals;
      const totalKg = 420 + (totalMeals * 0.25);

      const statPeople = $('#profileStatPeople');
      const statFood = $('#profileStatFood');
      const statActive = $('#profileStatActive');
      if (statPeople) statPeople.textContent = `${basePeople.toLocaleString()}+ served`;
      if (statFood) statFood.textContent = `${Math.round(totalKg).toLocaleString()} kg`;
      if (statActive) statActive.textContent = `${activeCount} active match${activeCount === 1 ? '' : 'es'}`;
    }
  }

  function initProfileForm() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    const isDonor = path === 'profile-donor.html';
    const isNgo = path === 'profile-ngo.html';
    if (!isDonor && !isNgo) return;

    const currentUser = JSON.parse(localStorage.getItem('fs360_currentUser'));
    if (!currentUser) {
      window.location.href = 'login.html';
      return;
    }

    const avatarImg = $('#profileAvatarImg');
    const photoInput = $('#profilePhotoInput');
    const changePhotoBtn = $('#changePhotoBtn');
    const cardName = $('#profileCardName');

    // Populate Left Card
    if (avatarImg) {
      avatarImg.src = currentUser.avatar || (isDonor ? DEFAULT_AVATAR : DEFAULT_NGO_AVATAR);
    }
    if (cardName) {
      cardName.textContent = currentUser.name;
    }
    updateProfileStats(currentUser);

    // Populate Form Inputs
    if (isDonor) {
      $('#donorFullName').value = currentUser.name || '';
      $('#donorEmail').value = currentUser.email || '';
      $('#donorPhone').value = currentUser.phone || '';
      $('#donorOrgName').value = currentUser.orgName || '';
      $('#donorAddress').value = currentUser.address || '';
      $('#donorCity').value = currentUser.city || '';
      $('#donorState').value = currentUser.state || '';
      $('#donorPincode').value = currentUser.pincode || '';
      $('#donorAbout').value = currentUser.about || '';
    } else {
      $('#ngoName').value = currentUser.name || '';
      $('#ngoEmail').value = currentUser.email || '';
      $('#ngoPhone').value = currentUser.phone || '';
      $('#ngoRegNum').value = currentUser.regNumber || '';
      $('#ngoAddress').value = currentUser.address || '';
      $('#ngoCity').value = currentUser.city || '';
      $('#ngoState').value = currentUser.state || '';
      $('#ngoPincode').value = currentUser.pincode || '';
      $('#ngoAbout').value = currentUser.about || '';
    }

    // Photo Upload Listeners
    if (photoInput) {
      const triggerPhotoInput = (e) => {
        e.preventDefault();
        photoInput.click();
      };
      changePhotoBtn?.addEventListener('click', triggerPhotoInput);
      avatarImg?.parentElement?.addEventListener('click', triggerPhotoInput);
      
      photoInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
          if (!file.type.startsWith('image/')) {
            showToast('warn', 'Invalid File', 'Please select a valid image file.');
            return;
          }
          try {
            const compressedBase64 = await compressImage(file);
            if (avatarImg) avatarImg.src = compressedBase64;
            showToast('success', 'Photo Loaded', 'Photo loaded successfully. Save changes to keep it.');
          } catch (err) {
            console.error('Image compression error:', err);
            showToast('error', 'Upload Error', 'Failed to compress image.');
          }
        }
      });
    }

    // Cancel Changes Action
    const cancelBtn = $('#cancelChangesBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        if (avatarImg) {
          avatarImg.src = currentUser.avatar || (isDonor ? DEFAULT_AVATAR : DEFAULT_NGO_AVATAR);
        }
        if (photoInput) {
          photoInput.value = '';
        }
        if (isDonor) {
          $('#donorFullName').value = currentUser.name || '';
          $('#donorEmail').value = currentUser.email || '';
          $('#donorPhone').value = currentUser.phone || '';
          $('#donorOrgName').value = currentUser.orgName || '';
          $('#donorAddress').value = currentUser.address || '';
          $('#donorCity').value = currentUser.city || '';
          $('#donorState').value = currentUser.state || '';
          $('#donorPincode').value = currentUser.pincode || '';
          $('#donorAbout').value = currentUser.about || '';
          clearFieldError($('#donorFullName').closest('.field'));
          clearFieldError($('#donorEmail').closest('.field'));
          clearFieldError($('#donorPhone').closest('.field'));
        } else {
          $('#ngoName').value = currentUser.name || '';
          $('#ngoEmail').value = currentUser.email || '';
          $('#ngoPhone').value = currentUser.phone || '';
          $('#ngoRegNum').value = currentUser.regNumber || '';
          $('#ngoAddress').value = currentUser.address || '';
          $('#ngoCity').value = currentUser.city || '';
          $('#ngoState').value = currentUser.state || '';
          $('#ngoPincode').value = currentUser.pincode || '';
          $('#ngoAbout').value = currentUser.about || '';
          clearFieldError($('#ngoName').closest('.field'));
          clearFieldError($('#ngoEmail').closest('.field'));
          clearFieldError($('#ngoPhone').closest('.field'));
          clearFieldError($('#ngoRegNum').closest('.field'));
        }
        showToast('success', 'Changes Discarded', 'Your profile details have been restored to current settings.');
      });
    }

    // Save Changes Action
    const form = isDonor ? $('#profileDonorForm') : $('#profileNgoForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Get form values
        let nameVal, emailVal, phoneVal, regVal = '', orgVal = '', addrVal, cityVal, stateVal, pinVal, aboutVal;
        if (isDonor) {
          nameVal = $('#donorFullName').value.trim();
          emailVal = $('#donorEmail').value.trim().toLowerCase();
          phoneVal = $('#donorPhone').value.trim();
          orgVal = $('#donorOrgName').value.trim();
          addrVal = $('#donorAddress').value.trim();
          cityVal = $('#donorCity').value.trim();
          stateVal = $('#donorState').value.trim();
          pinVal = $('#donorPincode').value.trim();
          aboutVal = $('#donorAbout').value.trim();
        } else {
          nameVal = $('#ngoName').value.trim();
          emailVal = $('#ngoEmail').value.trim().toLowerCase();
          phoneVal = $('#ngoPhone').value.trim();
          regVal = $('#ngoRegNum').value.trim();
          addrVal = $('#ngoAddress').value.trim();
          cityVal = $('#ngoCity').value.trim();
          stateVal = $('#ngoState').value.trim();
          pinVal = $('#ngoPincode').value.trim();
          aboutVal = $('#ngoAbout').value.trim();
        }

        // 2. Validate inputs
        let valid = true;
        const nameField = isDonor ? $('#donorFullName').closest('.field') : $('#ngoName').closest('.field');
        const emailField = isDonor ? $('#donorEmail').closest('.field') : $('#ngoEmail').closest('.field');
        const phoneField = isDonor ? $('#donorPhone').closest('.field') : $('#ngoPhone').closest('.field');

        if (!nameVal) {
          setFieldError(nameField, 'Name is required');
          valid = false;
        } else {
          clearFieldError(nameField);
        }

        if (!emailVal || !isValidEmail(emailVal)) {
          setFieldError(emailField, 'Please enter a valid email address');
          valid = false;
        } else {
          // Check if email already registered by someone else
          const users = JSON.parse(localStorage.getItem('fs360_users') || '[]');
          if (users.some(u => u.email === emailVal && u.email !== currentUser.email)) {
            setFieldError(emailField, 'Email address is already in use by another account');
            valid = false;
          } else {
            clearFieldError(emailField);
          }
        }

        if (!phoneVal || !isValidPhone(phoneVal)) {
          setFieldError(phoneField, 'Please enter a valid phone number');
          valid = false;
        } else {
          clearFieldError(phoneField);
        }

        if (!isDonor) {
          const regField = $('#ngoRegNum').closest('.field');
          if (!regVal) {
            setFieldError(regField, 'Registration number is required');
            valid = false;
          } else {
            clearFieldError(regField);
          }
        }

        // Optional Pincode Validation
        const pinField = isDonor ? $('#donorPincode').closest('.field') : $('#ngoPincode').closest('.field');
        if (pinVal && !/^\d{6}$/.test(pinVal)) {
          setFieldError(pinField, 'Pincode must be exactly 6 digits');
          valid = false;
        } else {
          clearFieldError(pinField);
        }

        if (!valid) {
          showToast('error', 'Validation Error', 'Please check highlighted fields.');
          return;
        }

        // 3. Save to localStorage
        const saveBtn = $('#saveChangesBtn');
        if (saveBtn) {
          saveBtn.classList.add('is-loading');
          saveBtn.disabled = true;
        }

        setTimeout(() => {
          const oldEmail = currentUser.email;
          const oldName = currentUser.name;

          // Update current user values
          currentUser.name = nameVal;
          currentUser.email = emailVal;
          currentUser.phone = phoneVal;
          currentUser.address = addrVal;
          currentUser.city = cityVal;
          currentUser.state = stateVal;
          currentUser.pincode = pinVal;
          currentUser.about = aboutVal;
          if (isDonor) {
            currentUser.orgName = orgVal;
          } else {
            currentUser.regNumber = regVal;
          }

          // Check if avatar has changed
          if (avatarImg && avatarImg.src && !avatarImg.src.startsWith('data:image/svg+xml')) {
            currentUser.avatar = avatarImg.src;
          }

          // Update fs360_users
          const users = JSON.parse(localStorage.getItem('fs360_users') || '[]');
          const userIdx = users.findIndex(u => u.email === oldEmail);
          if (userIdx !== -1) {
            // Preserve password and role from existing record
            const fullUpdatedUser = { ...users[userIdx], ...currentUser };
            users[userIdx] = fullUpdatedUser;
          } else {
            users.push(currentUser);
          }
          localStorage.setItem('fs360_users', JSON.stringify(users));

          // Save session user
          localStorage.setItem('fs360_currentUser', JSON.stringify(currentUser));

          // Synchronize details in fs360_donations database
          const donations = JSON.parse(localStorage.getItem('fs360_donations') || '[]');
          let donationUpdated = false;
          donations.forEach(don => {
            if (isDonor) {
              if (don.donorEmail === oldEmail) {
                don.donorName = nameVal;
                don.donorEmail = emailVal;
                don.donorPhone = phoneVal;
                donationUpdated = true;
              }
            } else {
              if (don.ngoEmail === oldEmail) {
                don.matchedNgo = nameVal;
                don.ngoEmail = emailVal;
                donationUpdated = true;
              }
            }
          });
          if (donationUpdated) {
            localStorage.setItem('fs360_donations', JSON.stringify(donations));
          }

          // UI Refresh
          if (cardName) {
            cardName.textContent = currentUser.name;
          }
          const navNames = $$('.nav-user-name');
          navNames.forEach(el => el.textContent = currentUser.name);

          if (saveBtn) {
            saveBtn.classList.remove('is-loading');
            saveBtn.disabled = false;
          }

          showToast('success', 'Changes Saved', 'Your profile details have been successfully updated.');
        }, 1200);
      });
    }
  }

  /* ---------------------------------------------------------
     Notifications Page Logic
     --------------------------------------------------------- */
  function seedNotifications() {
    const list = localStorage.getItem('fs360_notifications');
    if (!list) {
      const sampleNotifications = [
        { id: 'notif_1', type: 'success', title: 'Donation Delivered', desc: 'Hotel Meridian Vegetable Biryani was successfully delivered to Asha Foundation.', time: '2 hours ago', read: false, role: 'donor' },
        { id: 'notif_2', type: 'match', title: 'New Match Accepted', desc: 'Asha Foundation claimed your Lemon Rice surplus listing.', time: '5 hours ago', read: false, role: 'donor' },
        { id: 'notif_3', type: 'alert', title: 'New Donation Available', desc: 'Hotel Meridian listed 30 servings of South Indian Meals in your radius.', time: '1 day ago', read: true, role: 'ngo' },
        { id: 'notif_4', type: 'success', title: 'Pickup Completed', desc: 'You successfully completed the delivery of 40 Servings of Idly & Sambar.', time: '2 days ago', read: true, role: 'ngo' },
        { id: 'notif_5', type: 'alert', title: 'Profile Updated', desc: 'Your account contact phone details were changed.', time: '3 days ago', read: true, role: 'all' }
      ];
      localStorage.setItem('fs360_notifications', JSON.stringify(sampleNotifications));
    }
  }

  function initNotificationsPage() {
    const container = $('#notificationsList');
    if (!container) return;

    seedNotifications();
    const currentUser = JSON.parse(localStorage.getItem('fs360_currentUser'));
    if (!currentUser) {
      window.location.href = 'login.html';
      return;
    }

    const renderNotifs = (filter = 'all') => {
      const notifs = JSON.parse(localStorage.getItem('fs360_notifications') || '[]');
      const userNotifs = notifs.filter(n => n.role === currentUser.role || n.role === 'all');
      
      let filtered = userNotifs;
      if (filter === 'unread') filtered = userNotifs.filter(n => !n.read);
      else if (filter === 'alerts') filtered = userNotifs.filter(n => n.type === 'alert');
      else if (filter === 'matches') filtered = userNotifs.filter(n => n.type === 'match');

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <p>No notifications found matching this category.</p>
          </div>`;
        return;
      }

      let html = '<div style="display:flex; flex-direction:column; gap:14px;">';
      filtered.forEach(n => {
        let iconHtml = '';
        let borderClass = '';
        if (n.type === 'success') {
          iconHtml = TOAST_ICONS.success;
          borderClass = 'border-left: 4px solid var(--green);';
        } else if (n.type === 'alert') {
          iconHtml = TOAST_ICONS.error;
          borderClass = 'border-left: 4px solid #E0463A;';
        } else {
          iconHtml = TOAST_ICONS.warn;
          borderClass = 'border-left: 4px solid var(--orange);';
        }

        html += `
          <div class="impact-card" style="padding:18px 22px; display:flex; align-items:flex-start; gap:16px; transition:none; ${borderClass} opacity:${n.read ? '0.72' : '1'}; position:relative;">
            <span style="width:24px; height:24px; display:block; flex-shrink:0;">${iconHtml}</span>
            <div style="flex:1;">
              <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:8px;">
                <h4 style="font-size:1.05rem; font-family:var(--body); font-weight:700; color:var(--ink);">${n.title}</h4>
                <span style="font-size:0.75rem; color:var(--ink-soft); font-weight:600;">${n.time}</span>
              </div>
              <p style="font-size:0.88rem; color:var(--ink-soft); margin:6px 0 0 0;">${n.desc}</p>
            </div>
            ${!n.read ? `<button class="btn btn-ghost btn-xs mark-read-btn" data-id="${n.id}" style="padding:4px 8px; font-size:0.7rem; border-radius:4px; font-weight:700; margin-left:12px;">Mark read</button>` : ''}
          </div>`;
      });
      html += '</div>';
      container.innerHTML = html;

      // Bind individual mark read click listeners
      $$('.mark-read-btn', container).forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const allNotifs = JSON.parse(localStorage.getItem('fs360_notifications') || '[]');
          const match = allNotifs.find(n => n.id === id);
          if (match) {
            match.read = true;
            localStorage.setItem('fs360_notifications', JSON.stringify(allNotifs));
            showToast('success', 'Notification Read', 'Alert marked as read.');
            renderNotifs(filter);
          }
        });
      });
    };

    // Filter Buttons
    $$('.notif-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.notif-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderNotifs(btn.dataset.filter);
      });
    });

    // Mark all as read
    $('#markAllReadBtn')?.addEventListener('click', () => {
      const allNotifs = JSON.parse(localStorage.getItem('fs360_notifications') || '[]');
      let updated = false;
      allNotifs.forEach(n => {
        if ((n.role === currentUser.role || n.role === 'all') && !n.read) {
          n.read = true;
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem('fs360_notifications', JSON.stringify(allNotifs));
        showToast('success', 'Inbox Read', 'All notifications marked as read.');
        const currentActive = $('.notif-filter-btn.active')?.dataset.filter || 'all';
        renderNotifs(currentActive);
      } else {
        showToast('warn', 'Already Read', 'All notifications are already read.');
      }
    });

    renderNotifs('all');
  }

  /* ---------------------------------------------------------
     Emergency Requests Page Logic
     --------------------------------------------------------- */
  function seedEmergencyRequests() {
    const list = localStorage.getItem('fs360_emergency_requests');
    if (!list) {
      const sampleRequests = [
        { id: 'emerg_1', ngoName: 'Asha Foundation', phone: '+91 87654 32109', itemsNeeded: '100 Packs of Rice or Biryani', location: 'Sellur Flood Relief Temp Camp', latitude: 9.9390, longitude: 78.1170, urgency: 'Urgent', status: 'Active' },
        { id: 'emerg_2', ngoName: 'Community Kitchen Madurai', phone: '+91 76543 21098', itemsNeeded: '50 Servings Breakfast (Idly/Pongal)', location: 'Madurai Slum Board Low Resource Area', latitude: 9.9140, longitude: 78.1250, urgency: 'High', status: 'Active' },
        { id: 'emerg_3', ngoName: 'Helping Hands NGO', phone: '+91 65432 10987', itemsNeeded: '30 Meals Packaged Dry Roti/Subji', location: 'Madurai Junction Night Shelter Center', latitude: 9.9210, longitude: 78.1090, urgency: 'Medium', status: 'Active' }
      ];
      localStorage.setItem('fs360_emergency_requests', JSON.stringify(sampleRequests));
    }
  }

  function initEmergencyRequestsMap(activeRequests) {
    const mapEl = $('#map');
    if (!mapEl || !window.L) return;

    if (window.emergencyMap) {
      window.emergencyMap.remove();
    }

    const map = L.map('map').setView([9.9252, 78.1198], 13);
    window.emergencyMap = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const markers = [];
    activeRequests.forEach(req => {
      if (req.latitude && req.longitude) {
        // Red color pulse for emergencies
        const marker = L.marker([req.latitude, req.longitude], {
          icon: L.divIcon({
            className: 'custom-leaflet-marker',
            html: `<span class="map-marker" style="background:#E0463A; box-shadow: 0 0 0 0 rgba(224,70,58,.5); animation: marker-pulse 2s ease-out infinite;"></span>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9]
          })
        })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:var(--body); line-height:1.4;">
            <span style="font-size:0.7rem; font-weight:700; color:#fff; background:#E0463A; padding:2px 6px; border-radius:4px; text-transform:uppercase;">${req.urgency}</span>
            <div style="margin-top:6px; font-weight:700; font-size:0.9rem; color:var(--ink);">${req.ngoName}</div>
            <div style="font-size:0.8rem; color:var(--ink-soft); margin-top:2px;">Needs: <strong>${req.itemsNeeded}</strong></div>
            <div style="font-size:0.8rem; color:var(--ink-soft);">Location: ${req.location}</div>
            <div style="font-size:0.8rem; color:var(--ink-soft);">Phone: <strong>${req.phone}</strong></div>
            <button class="btn btn-accent btn-sm claim-emerg-btn" data-id="${req.id}" style="margin-top:8px; padding:5px 10px; font-size:0.75rem; width:100%;">Fulfill Request</button>
          </div>
        `);
        markers.push(marker);
      }
    });

    map.on('popupopen', (e) => {
      const btn = e.popup.getElement().querySelector('.claim-emerg-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          const reqId = btn.dataset.id;
          const currentUser = JSON.parse(localStorage.getItem('fs360_currentUser'));
          if (currentUser.role !== 'donor') {
            showToast('error', 'Action Denied', 'Only registered food Donors can fulfill emergency requests.');
            return;
          }
          
          const requests = JSON.parse(localStorage.getItem('fs360_emergency_requests') || '[]');
          const idx = requests.findIndex(r => r.id === reqId);
          if (idx !== -1) {
            requests[idx].status = 'Fulfilled';
            requests[idx].fulfilledBy = currentUser.name;
            localStorage.setItem('fs360_emergency_requests', JSON.stringify(requests));
            showToast('success', 'Fulfillment Registered', 'Thank you! You have claimed this emergency relief dispatch. Coordinate logistics directly.');
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          }
        });
      }
    });

    if (markers.length > 0) {
      const group = new L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  function initEmergencyRequestsPage() {
    const pageEl = $('#emergencyRequestsPage');
    if (!pageEl) return;

    seedEmergencyRequests();
    const currentUser = JSON.parse(localStorage.getItem('fs360_currentUser'));
    if (!currentUser) {
      window.location.href = 'login.html';
      return;
    }

    // Populate user-specific visibility
    const submitCard = $('#emergencySubmitCard');
    if (submitCard) {
      // Only NGOs can submit emergency requests
      if (currentUser.role === 'ngo') {
        submitCard.style.display = 'block';
      } else {
        submitCard.style.display = 'none';
      }
    }

    const renderRequests = () => {
      const requests = JSON.parse(localStorage.getItem('fs360_emergency_requests') || '[]');
      const activeRequests = requests.filter(r => r.status === 'Active');
      
      initEmergencyRequestsMap(activeRequests);

      const listContainer = $('#activeEmergencyRequestsList');
      if (!listContainer) return;

      if (activeRequests.length === 0) {
        listContainer.innerHTML = `
          <div class="empty-state">
            <p>No active emergency food requests in your zone right now.</p>
          </div>`;
        return;
      }

      let html = '<div class="donations-grid">';
      const users = JSON.parse(localStorage.getItem('fs360_users') || '[]');
      activeRequests.reverse().forEach(req => {
        let badgeColor = 'background: #FFE3D1; color: var(--orange-dark);';
        if (req.urgency === 'Urgent') badgeColor = 'background: #FEE2E2; color: #E0463A;';

        const ngoUser = users.find(u => u.name === req.ngoName);
        const ngoAvatar = ngoUser?.avatar || DEFAULT_NGO_AVATAR;

        html += `
          <div class="donation-card" style="border: 1.5px solid #FEE2E2;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span class="eyebrow" style="${badgeColor} padding: 4px 10px; font-size: 0.7rem; border-radius:10px;">${req.urgency} EMERGENCY</span>
            </div>
            <div class="don-card-content" style="padding-top:8px;">
              <h4 style="margin-bottom:8px; display: flex; align-items: center; gap: 8px;">
                <img class="card-user-avatar" src="${ngoAvatar}" alt="${req.ngoName}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;">
                <span>NGO: ${req.ngoName}</span>
              </h4>
              <p style="margin-bottom:6px; color:var(--ink); font-size:0.95rem;"><strong>Needs: ${req.itemsNeeded}</strong></p>
              <p style="font-size:0.83rem; color:var(--ink-soft); margin-bottom:4px;">Location: <strong>${req.location}</strong></p>
              <p style="font-size:0.83rem; color:var(--ink-soft); margin-bottom:12px;">Contact: <strong>${req.phone}</strong></p>
              
              <div style="display:flex; gap:8px; margin-top:8px;">
                <a href="tel:${req.phone}" class="btn btn-ghost btn-sm" style="flex:1; padding:6px; font-size:0.75rem; text-align:center; border:1px solid var(--line); border-radius:6px; display:inline-block; text-decoration:none;">Call NGO</a>
                ${currentUser.role === 'donor' ? `<button class="btn btn-accent btn-sm fulfill-req-btn" data-id="${req.id}" style="flex:1.2;">Fulfill Request</button>` : ''}
              </div>
            </div>
          </div>`;
      });
      html += '</div>';
      listContainer.innerHTML = html;

      // Bind buttons
      $$('.fulfill-req-btn', listContainer).forEach(btn => {
        btn.addEventListener('click', () => {
          const reqId = btn.dataset.id;
          const requests = JSON.parse(localStorage.getItem('fs360_emergency_requests') || '[]');
          const idx = requests.findIndex(r => r.id === reqId);
          if (idx !== -1) {
            requests[idx].status = 'Fulfilled';
            requests[idx].fulfilledBy = currentUser.name;
            localStorage.setItem('fs360_emergency_requests', JSON.stringify(requests));
            showToast('success', 'Fulfillment Registered', 'Thank you! Coordinate emergency logistics directly.');
            renderRequests();
          }
        });
      });
    };

    // Bind Submission Form
    const form = $('#emergencyRequestForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const items = $('#emergencyItems').value.trim();
        const loc = $('#emergencyLocation').value.trim();
        const urgency = $('#emergencyUrgency').value;

        if (!items || !loc) {
          showToast('error', 'Incomplete Form', 'Please specify items needed and collection location.');
          return;
        }

        const requests = JSON.parse(localStorage.getItem('fs360_emergency_requests') || '[]');
        
        // Random coords in Madurai
        const lat = 9.9252 + (Math.random() - 0.5) * 0.02;
        const lon = 78.1198 + (Math.random() - 0.5) * 0.02;

        const newRequest = {
          id: 'emerg_' + Date.now(),
          ngoName: currentUser.name,
          phone: currentUser.phone || '+91 99999 99999',
          itemsNeeded: items,
          location: loc,
          latitude: lat,
          longitude: lon,
          urgency: urgency,
          status: 'Active'
        };

        requests.push(newRequest);
        localStorage.setItem('fs360_emergency_requests', JSON.stringify(requests));
        showToast('success', 'Emergency Alert Sent', 'Your emergency food request has been broadcasted to all nearby donors.');
        
        // Reset form and refresh list
        form.reset();
        renderRequests();
      });
    }

    renderRequests();
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
    const path = window.location.pathname.split('/').pop() || 'index.html';
    if (path === 'index.html') {
      initHomepageMap();
    }

    // Dashboard views
    initCreateDonationForm();
    initMyDonations();
    initAvailableDonations();
    initAcceptedDonations();
    initDonationDetails();
    initNgoReports();
    initProfileForm();
    initNotificationsPage();
    initEmergencyRequestsPage();
    
    // Propagate avatars to header and details
    propagateAvatars();

    // Cross-tab profile updates
    window.addEventListener('storage', (e) => {
      if (e.key === 'fs360_currentUser') {
        const currentUser = JSON.parse(e.newValue || 'null');
        if (currentUser) {
          $$('.nav-user-name').forEach(el => el.textContent = currentUser.name);
          
          // Cross-tab avatar updates
          const isDonor = currentUser.role === 'donor';
          const userAvatar = currentUser.avatar || (isDonor ? DEFAULT_AVATAR : DEFAULT_NGO_AVATAR);
          $$('.nav-profile-avatar').forEach(el => el.src = userAvatar);
          
          const headerAvatar = $('#dashboardHeaderAvatar');
          if (headerAvatar) {
            headerAvatar.src = userAvatar;
          }
        }
      }
    });
  });
})();


