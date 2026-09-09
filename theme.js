function init() {
  initThemeToggle();
  initHeadingAnchors();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function initThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;

  const getTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme) return currentTheme;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  };

  const setTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateToggleIcon(theme);
  };

  const updateToggleIcon = (theme) => {
    const sunIcon = toggleBtn.querySelector('.sun-icon');
    const moonIcon = toggleBtn.querySelector('.moon-icon');
    if (theme === 'light') {
      if (sunIcon) sunIcon.style.display = 'none';
      if (moonIcon) moonIcon.style.display = 'block';
      toggleBtn.setAttribute('aria-label', 'Switch to dark theme');
    } else {
      if (sunIcon) sunIcon.style.display = 'block';
      if (moonIcon) moonIcon.style.display = 'none';
      toggleBtn.setAttribute('aria-label', 'Switch to light theme');
    }
  };

  // Sync initial state of toggle icon
  updateToggleIcon(getTheme());

  toggleBtn.addEventListener('click', () => {
    const newTheme = getTheme() === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  });
}

function showToast(message) {
  let toast = document.querySelector('.anchor-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'anchor-toast';
    toast.innerHTML = `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg><span></span>`;
    document.body.appendChild(toast);
  }
  toast.querySelector('span').textContent = message;
  toast.classList.add('show');
  clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve, reject) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      resolve();
    } catch (err) {
      reject(err);
    } finally {
      document.body.removeChild(ta);
    }
  });
}

function initHeadingAnchors() {
  const linkSvg = '<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M440-280H280q-83 0-141.5-58.5T80-480q0-83 58.5-141.5T280-680h160v80H280q-50 0-85 35t-35 85q0 50 35 85t85 35h160v80ZM320-440v-80h320v80H320Zm200 160v-80h160q50 0 85-35t35-85q0-50-35-85t-85-35H520v-80h160q83 0 141.5 58.5T880-480q0 83-58.5 141.5T680-280H520Z"/></svg>';

  const seenIds = new Set();

  const addAnchorToHeading = (heading, id) => {
    if (!id || seenIds.has(id) || heading.querySelector('.heading-anchor')) return;
    seenIds.add(id);

    const anchor = document.createElement('a');
    anchor.className = 'heading-anchor';
    anchor.href = '#' + id;
    anchor.setAttribute('aria-label', 'Copy link to this section');
    anchor.setAttribute('title', 'Copy link to this section');
    anchor.innerHTML = linkSvg;

    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const url = window.location.origin + window.location.pathname + '#' + id;
      copyText(url).then(() => {
        showToast('Link copied to clipboard!');
      }).catch(() => {
        showToast('Link copied to clipboard!');
      });

      if (window.history && window.history.pushState) {
        window.history.pushState(null, '', '#' + id);
      } else {
        window.location.hash = id;
      }

      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });

    heading.appendChild(anchor);
  };

  // 1. Direct headings with IDs: h2[id], h3[id]
  document.querySelectorAll('main h2[id], main h3[id]').forEach(heading => {
    addAnchorToHeading(heading, heading.id);
  });

  // 2. Sections or cards with IDs: section[id], .card[id], .guide-method[id]
  document.querySelectorAll('main section[id], main .card[id], main .guide-method[id]').forEach(container => {
    const id = container.id;
    if (!id || id === 'particles-js') return;
    const heading = container.querySelector('h2, h3');
    if (heading) {
      addAnchorToHeading(heading, id);
    }
  });
}
