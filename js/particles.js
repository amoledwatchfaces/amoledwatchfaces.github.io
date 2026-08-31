function isWinterSeason() {
  // Allow query param override for preview/testing (e.g. ?snow=true or ?snow=1)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('snow') === 'true' || urlParams.get('snow') === '1') {
    return true;
  }

  const now = new Date();
  const month = now.getMonth(); // 0 = Jan, ..., 10 = Nov, 11 = Dec

  // Active for entire November, December, and January
  // (In JS, getMonth() is 0-indexed: 10 = Nov, 11 = Dec, 0 = Jan)
  if (month === 10 || month === 11 || month === 0) {
    return true;
  }

  return false;
}

// Dynamically load tsParticles on-demand only when winter season is active
function loadParticlesLibrary(callback) {
  if (typeof particlesJS === 'function') {
    if (callback) callback();
    return;
  }

  const existingScript = document.getElementById('tsparticles-script');
  if (existingScript) {
    existingScript.addEventListener('load', () => { if (callback) callback(); }, { once: true });
    return;
  }

  const script = document.createElement('script');
  script.id = 'tsparticles-script';
  script.src = 'https://cdn.jsdelivr.net/npm/tsparticles@1.37.5/tsparticles.min.js';
  script.async = true;
  script.onload = () => {
    if (callback) callback();
  };
  document.head.appendChild(script);
}

function initSnowParticles() {
  const container = document.getElementById('particles-js');
  const toggleBtn = document.getElementById('snow-toggle');

  if (!isWinterSeason()) {
    if (container) container.style.display = 'none';
    if (toggleBtn) toggleBtn.style.display = 'none';
    return;
  }

  // Reveal the toggle button during the winter season
  if (toggleBtn) {
    toggleBtn.style.display = 'flex';
  }

  const isSnowDisabled = localStorage.getItem('snowDisabled') === 'true';

  if (isSnowDisabled) {
    if (container) container.style.display = 'none';
    if (toggleBtn) {
      toggleBtn.classList.add('disabled');
      toggleBtn.classList.remove('active');
      toggleBtn.setAttribute('aria-pressed', 'false');
      toggleBtn.setAttribute('aria-label', 'Enable snow animation');
    }
    return;
  }

  if (container) {
    container.style.display = 'block';
  }

  if (toggleBtn) {
    toggleBtn.classList.add('active');
    toggleBtn.classList.remove('disabled');
    toggleBtn.setAttribute('aria-pressed', 'true');
    toggleBtn.setAttribute('aria-label', 'Disable snow animation');
  }

  loadParticlesLibrary(() => {
    renderSnow();
  });
}

function renderSnow() {
  if (typeof particlesJS !== 'function') return;

  const isLight = document.documentElement.getAttribute('data-theme') === 'light' ||
    (!document.documentElement.getAttribute('data-theme') && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches);

  const particleColor = isLight ? ['#94a3b8', '#cbd5e1', '#64748b'] : ['#ffffff', '#e2e8f0', '#94a3b8'];

  particlesJS('particles-js', {
    particles: {
      number: {
        value: 48,
        density: {
          enable: true,
          value_area: 750
        }
      },
      color: {
        value: particleColor
      },
      shape: {
        type: 'circle'
      },
      opacity: {
        value: isLight ? 0.45 : 0.7,
        random: true,
        anim: {
          enable: true,
          speed: 0.6,
          opacity_min: 0.15,
          sync: false
        }
      },
      size: {
        value: 4.5,
        random: true,
        anim: {
          enable: false
        }
      },
      line_linked: {
        enable: false
      },
      move: {
        enable: true,
        speed: 3.5,
        direction: 'bottom',
        random: true,
        straight: false,
        out_mode: 'out',
        bounce: false
      }
    },
    interactivity: {
      detect_on: 'canvas',
      events: {
        onhover: {
          enable: false
        },
        onclick: {
          enable: false
        },
        resize: true
      }
    },
    retina_detect: true
  });

  // Ensure canvas never intercepts click or hover events
  setTimeout(() => {
    const canvases = document.querySelectorAll('#particles-js canvas, .tsparticles-canvas-el');
    canvases.forEach((c) => {
      c.style.pointerEvents = 'none';
    });
  }, 50);
}

// Setup snow toggle button click handler
function setupSnowToggle() {
  const toggleBtn = document.getElementById('snow-toggle');
  const container = document.getElementById('particles-js');
  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    const isCurrentlyDisabled = localStorage.getItem('snowDisabled') === 'true';
    if (isCurrentlyDisabled) {
      localStorage.setItem('snowDisabled', 'false');
      initSnowParticles();
    } else {
      localStorage.setItem('snowDisabled', 'true');
      if (container) {
        container.style.display = 'none';
      }
      toggleBtn.classList.add('disabled');
      toggleBtn.classList.remove('active');
      toggleBtn.setAttribute('aria-pressed', 'false');
      toggleBtn.setAttribute('aria-label', 'Enable snow animation');
    }
  });
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initSnowParticles();
    setupSnowToggle();
  });
} else {
  initSnowParticles();
  setupSnowToggle();
}

// Watch for theme toggles to adjust snowflake contrast
const themeObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
      initSnowParticles();
    }
  });
});
themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
