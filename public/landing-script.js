/* ================================================================
   RECEPS — Premium Interactions & Animations
   - IntersectionObserver scroll reveals
   - Navbar scroll state
   - Mobile menu
   - Smooth anchor scrolling
   ================================================================ */

(function () {
  'use strict';

  // --- SCROLL REVEAL with IntersectionObserver ---
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -60px 0px',
    }
  );

  revealElements.forEach((el) => revealObserver.observe(el));

  // --- NAVBAR SCROLL STATE ---
  const navbar = document.getElementById('navbar');
  let ticking = false;

  function handleNavScroll() {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleNavScroll();
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true }
  );
  handleNavScroll();

  // ── Preservação do código de indicação ──────────────────────────
  // Lê ?ref=XXX da URL da landing e injeta nos links de assinatura,
  // mantendo o sistema de indicação funcional ao compartilhar receps.com.br?ref=...
  (function preserveReferralCode() {
    const params = new URLSearchParams(window.location.search);
    let ref = params.get('ref');

    // Se veio na URL, salva na session pra sobreviver à navegação interna
    if (ref) {
      try { sessionStorage.setItem('receps_ref', ref); } catch (e) {}
    } else {
      // Se não veio na URL, tenta recuperar da session
      try { ref = sessionStorage.getItem('receps_ref'); } catch (e) {}
    }

    if (!ref) return;

    // Injeta ?ref nos links que apontam pro app
    const appLinks = document.querySelectorAll(
      'a[href*="app.receps.com.br"]'
    );
    appLinks.forEach((link) => {
      try {
        const url = new URL(link.href);
        url.searchParams.set('ref', ref);
        link.href = url.toString();
      } catch (e) {}
    });
  })();

  // --- MOBILE MENU ---
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileLinks = document.querySelectorAll('.mobile-link, .btn-mobile-cta');

  function toggleMobileMenu() {
    const isOpen = mobileMenu.classList.contains('open');

    if (isOpen) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  }

  function openMobileMenu() {
    hamburger.classList.add('active');
    mobileMenu.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    hamburger.classList.remove('active');
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', toggleMobileMenu);

  mobileLinks.forEach((link) => {
    link.addEventListener('click', () => {
      closeMobileMenu();
    });
  });

  // Close on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileMenu();
  });

  // --- SMOOTH ANCHOR SCROLLING ---
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      const navHeight = navbar.offsetHeight;
      const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth',
      });
    });
  });


  // --- CHART BAR ANIMATION ---
  const chartBars = document.querySelectorAll('.chart-bar');

  const chartObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          chartBars.forEach((bar, i) => {
            const targetHeight = bar.style.height;
            bar.style.height = '0%';
            bar.style.transition = `height 800ms cubic-bezier(0.32, 0.72, 0, 1) ${i * 80}ms`;

            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                bar.style.height = targetHeight;
              });
            });
          });
          chartObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  const chartContainer = document.querySelector('.chart-bars');
  if (chartContainer) {
    chartObserver.observe(chartContainer);
  }

  // --- MAGNETIC HOVER for primary buttons (desktop only) ---
  if (window.matchMedia('(hover: hover)').matches) {
    const magneticBtns = document.querySelectorAll('.btn-primary, .btn-glow');

    magneticBtns.forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        btn.style.transform = `translate(${x * 0.08}px, ${y * 0.08}px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
        btn.style.transition = 'all 700ms cubic-bezier(0.32, 0.72, 0, 1)';
      });

      btn.addEventListener('mouseenter', () => {
        btn.style.transition = 'none';
      });
    });
  }
})();
