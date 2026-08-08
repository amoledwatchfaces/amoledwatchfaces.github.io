document.addEventListener('DOMContentLoaded', () => {
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
});
