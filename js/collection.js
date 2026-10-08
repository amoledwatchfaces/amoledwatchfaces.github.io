// Configuration
const INITIAL_LOAD_COUNT = 6;
const LOAD_MORE_STEP = 12;

let portfolioData = [];
let currentFilter = 'all'; // 'all' | 'free' | 'analog' | 'digital' | 'weather'
let currentSort = 'release-desc'; // 'release-desc' | 'updated-desc' | 'alphabetical'
let searchQuery = '';
let visibleCount = INITIAL_LOAD_COUNT;

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function fetchPortfolio() {
  if (portfolioData.length > 0) return portfolioData;
  if (window.portfolio && Array.isArray(window.portfolio) && window.portfolio.length > 0) {
    portfolioData = window.portfolio;
    return portfolioData;
  }
  try {
    const res = await fetch('/data/portfolio.json');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    portfolioData = await res.json();
    window.portfolio = portfolioData;
    return portfolioData;
  } catch (err) {
    console.error('Failed to load data/portfolio.json:', err);
    return [];
  }
}

let localizedDescriptions = {};
let currentDescLang = 'en';

async function loadLocalizedDescriptions(lang) {
  if (!lang || lang === 'en') {
    localizedDescriptions = {};
    currentDescLang = 'en';
    return;
  }
  if (currentDescLang === lang && Object.keys(localizedDescriptions).length > 0) {
    return;
  }
  try {
    const res = await fetch(`/locales/descriptions/${lang}.json?v=1.3`);
    if (res.ok) {
      localizedDescriptions = await res.json();
      currentDescLang = lang;
    } else {
      localizedDescriptions = {};
      currentDescLang = lang;
    }
  } catch (err) {
    console.warn(`Could not load locales/descriptions/${lang}.json:`, err);
    localizedDescriptions = {};
    currentDescLang = lang;
  }
}

function getItemDescription(item) {
  if (!item) return '';
  const lang = window.i18n ? window.i18n.getLanguage() : 'en';
  if (lang !== 'en' && localizedDescriptions && localizedDescriptions[item.id]) {
    return localizedDescriptions[item.id];
  }
  return item.shortDescription || '';
}

function getPortfolio() {
  return portfolioData.length > 0 ? portfolioData : (window.portfolio || []);
}

// Helper: parse date strings like "Aug 26, 2026" or return 0 for "Unknown"
function parseDate(dateStr) {
  if (!dateStr || dateStr === 'Unknown') return 0;
  const timestamp = Date.parse(dateStr);
  return isNaN(timestamp) ? 0 : timestamp;
}

// Get filtered and sorted list
function getProcessedList() {
  const items = getPortfolio();
  // 1. Filter
  let list = items.filter((item) => {
    // Only show watch faces (not standalone utility apps)
    if (item.isWatchFace === false) return false;

    // Only show available items if isAvailable is defined (or available on GitHub)
    if (item.isAvailable === false && !item.isAvailableOnGithub) return false;

    if (currentFilter === 'free' && !item.isFree) return false;
    if (currentFilter === 'analog' && !item.isAnalog) return false;
    if (currentFilter === 'digital' && item.isAnalog) return false;
    if (currentFilter === 'weather' && !item.hasWeather) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nameMatch = (item.appName || '').toLowerCase().includes(q);
      const descMatch = getItemDescription(item).toLowerCase().includes(q);
      if (!nameMatch && !descMatch) return false;
    }

    return true; // 'all'
  });

  // 2. Sort
  list.sort((a, b) => {
    if (currentSort === 'alphabetical') {
      return a.appName.localeCompare(b.appName);
    }
    if (currentSort === 'updated-desc') {
      const dateA = parseDate(a.lastUpdated) || parseDate(a.releaseDate);
      const dateB = parseDate(b.lastUpdated) || parseDate(b.releaseDate);
      return dateB - dateA;
    }
    // Default: release-desc
    const dateA = parseDate(a.releaseDate);
    const dateB = parseDate(b.releaseDate);
    return dateB - dateA;
  });

  return list;
}

// Render individual watch face card
function createCardElement(item) {
  const card = document.createElement('div');
  card.className = 'card collection-card';

  const isAvail = item.isAvailable !== false;
  const isGithub = Boolean(item.isAvailableOnGithub && item.githubLink);

  const playStoreUrl = `https://play.google.com/store/apps/details?id=${encodeURIComponent(item.packageName)}&utm_source=website&utm_medium=catalog&utm_campaign=collection`;
  const primaryUrl = isAvail ? playStoreUrl : (isGithub ? item.githubLink : playStoreUrl);
  const primaryAria = isAvail
    ? `${escapeHtml(item.appName)} on Google Play`
    : (isGithub ? `${escapeHtml(item.appName)} on GitHub` : `${escapeHtml(item.appName)}`);

  const iconSrc = `/assets/icons/${item.id}.webp`;
  const icon2Src = `/assets/icons/${item.id}_1.webp`;
  const hasIcon2 = Boolean(item.hasAltImages);

  const iconsHtml = hasIcon2
    ? `<div class="watch-icons-wrapper dual-icons">
        <img src="${iconSrc}" alt="${escapeHtml(item.appName)} Wear OS Watch Face" class="watch-icon-preview primary-icon" width="140" height="140" loading="lazy" decoding="async" />
        <img src="${icon2Src}" alt="${escapeHtml(item.appName)} variation" class="watch-icon-preview secondary-icon" width="140" height="140" loading="lazy" decoding="async" />
      </div>`
    : `<div class="watch-icons-wrapper single-icon">
        <img src="${iconSrc}" alt="${escapeHtml(item.appName)} Wear OS Watch Face" class="watch-icon-preview" width="140" height="140" loading="lazy" decoding="async" />
      </div>`;

  const badgesList = [];
  if (isAvail) {
    badgesList.push(`
        <a href="${playStoreUrl}" target="_blank" rel="noopener" class="play-store-badge">
          <img src="/assets/google-play-badge.svg" alt="Get it on Google Play" width="135" height="40" loading="lazy" decoding="async" />
        </a>`.trim());
  }
  if (isGithub) {
    badgesList.push(`
        <a href="${escapeHtml(item.githubLink)}" target="_blank" rel="noopener" class="github-badge">
          <img src="/assets/github-badge.svg" alt="Get it on GitHub" width="135" height="40" loading="lazy" decoding="async" />
        </a>`.trim());
  }

  const openSourceHtml = item.isOpenSource
    ? `<span class="badge-pill badge-opensource">${window.i18n ? window.i18n.t('apps_page.badge_opensource', 'Open Source') : 'Open Source'}</span>`
    : '';

  card.innerHTML = `
    <a href="${primaryUrl}" target="_blank" rel="noopener" class="watch-preview-link" aria-label="${primaryAria}">
      ${iconsHtml}
    </a>
    <div class="collection-info">
      <div class="collection-header">
        <h3>
          <a href="${primaryUrl}" target="_blank" rel="noopener" class="collection-title-link">
            ${escapeHtml(item.appName)}
          </a>
        </h3>
        <div class="collection-badges">
          ${openSourceHtml}
          ${item.isFree
            ? `<span class="badge-pill">${window.i18n ? window.i18n.t('apps_page.badge_free', 'Free') : 'Free'}</span>`
            : `<span class="badge-pill badge-paid">${window.i18n ? window.i18n.t('apps_page.badge_paid', 'Paid') : 'Paid'}</span>`}
        </div>
      </div>
      <p class="collection-desc">${escapeHtml(getItemDescription(item))}</p>
      <div class="links" style="margin-top: auto; padding-top: 14px;">
        ${badgesList.join('\n        ')}
      </div>
    </div>
  `;

  return card;
}

function animateCardEntry(card, delayMs = 0) {
  if (typeof card.animate === 'function') {
    card.animate(
      [
        { opacity: 0, transform: 'translateY(-24px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ],
      {
        duration: 750,
        delay: delayMs,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        fill: 'both'
      }
    );
  }
}

let previouslyRenderedCount = 0;

// Render the grid and update pagination controls
function render(isAppend = false) {
  const grid = document.getElementById('collection-grid');
  const countEl = document.getElementById('collection-count');
  const loadMoreBtn = document.getElementById('load-more-btn');
  const showAllBtn = document.getElementById('show-all-btn');
  const actionsContainer = document.getElementById('collection-actions');

  if (!grid) return;

  const processedList = getProcessedList();
  const total = processedList.length;

  if (total === 0) {
    const lang = window.i18n ? window.i18n.getLanguage() : 'en';
    const emptyTitle = window.i18n ? window.i18n.t('collection.empty_title', 'No watch faces found') : 'No watch faces found';
    let emptyDesc = `No results matching "<strong>${escapeHtml(searchQuery)}</strong>". Try checking for typos or clear your search.`;
    if (lang === 'sk') {
      emptyDesc = `Žiadne výsledky pre výraz "<strong>${escapeHtml(searchQuery)}</strong>". Skúste skontrolovať preklepy alebo vymazať vyhľadávanie.`;
    } else if (lang === 'de') {
      emptyDesc = `Keine Ergebnisse für „<strong>${escapeHtml(searchQuery)}</strong>“. Bitte überprüfe die Schreibweise oder setze die Suche zurück.`;
    } else if (lang === 'es') {
      emptyDesc = `No hay resultados para «<strong>${escapeHtml(searchQuery)}</strong>». Comprueba la ortografía o restablece la búsqueda.`;
    } else if (lang === 'pl') {
      emptyDesc = `Brak wyników dla „<strong>${escapeHtml(searchQuery)}</strong>”. Sprawdź pisownię lub zresetuj wyszukiwanie.`;
    }
    const clearBtnText = window.i18n ? window.i18n.t('collection.clear_search', 'Clear search') : 'Clear search';

    grid.innerHTML = `
      <div class="collection-empty-state">
        <svg class="empty-icon" xmlns="http://www.w3.org/2000/svg" height="36px" viewBox="0 -960 960 960" width="36px" fill="currentColor">
          <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/>
        </svg>
        <h3>${emptyTitle}</h3>
        <p>${emptyDesc}</p>
        <button type="button" class="btn-clear-search" id="empty-clear-btn">${clearBtnText}</button>
      </div>
    `;
    if (countEl) {
      if (lang === 'sk') countEl.textContent = '0 nájdených ciferníkov';
      else if (lang === 'de') countEl.textContent = '0 Zifferblätter gefunden';
      else if (lang === 'es') countEl.textContent = '0 esferas encontradas';
      else if (lang === 'pl') countEl.textContent = '0 znalezionych tarcz';
      else countEl.textContent = '0 watch faces found';
    }
    if (actionsContainer) {
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
      if (showAllBtn) showAllBtn.style.display = 'none';
    }

    const emptyClearBtn = document.getElementById('empty-clear-btn');
    if (emptyClearBtn) {
      emptyClearBtn.addEventListener('click', () => {
        const searchInput = document.getElementById('collection-search');
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
        }
        searchQuery = '';
        const searchClearBtn = document.getElementById('search-clear-btn');
        if (searchClearBtn) searchClearBtn.style.display = 'none';
        visibleCount = INITIAL_LOAD_COUNT;
        render(false);
      });
    }
    return;
  }

  const targetCount = Math.min(visibleCount, total);

  if (!isAppend) {
    // Clear and render first page
    grid.innerHTML = '';
    const fragment = document.createDocumentFragment();
    const itemsToDisplay = processedList.slice(0, targetCount);
    itemsToDisplay.forEach((item, index) => {
      const card = createCardElement(item);
      fragment.appendChild(card);
      animateCardEntry(card, Math.min(index * 50, 350));
    });
    grid.appendChild(fragment);
  } else {
    // Incrementally append only newly revealed cards
    const fragment = document.createDocumentFragment();
    const itemsToAppend = processedList.slice(previouslyRenderedCount, targetCount);
    itemsToAppend.forEach((item, index) => {
      const card = createCardElement(item);
      fragment.appendChild(card);
      animateCardEntry(card, Math.min(index * 50, 450));
    });
    grid.appendChild(fragment);
  }

  previouslyRenderedCount = targetCount;

  // Update item counter
  if (countEl) {
    const lang = window.i18n ? window.i18n.getLanguage() : 'en';
    if (lang === 'sk') {
      countEl.textContent = `Zobrazených ${targetCount} z ${total} ciferníkov`;
    } else if (lang === 'de') {
      countEl.textContent = `${targetCount} von ${total} Zifferblättern angezeigt`;
    } else if (lang === 'es') {
      countEl.textContent = `Mostrando ${targetCount} de ${total} esferas`;
    } else if (lang === 'pl') {
      countEl.textContent = `Wyświetlanie ${targetCount} z ${total} tarcz`;
    } else {
      countEl.textContent = `Showing ${targetCount} of ${total} watch faces`;
    }
  }

  // Update button visibility and state
  if (actionsContainer) {
    if (targetCount >= total) {
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
      if (showAllBtn) showAllBtn.style.display = 'none';
    } else {
      if (loadMoreBtn) {
        loadMoreBtn.style.display = 'inline-flex';
        const remaining = total - targetCount;
        const nextBatch = Math.min(remaining, LOAD_MORE_STEP);
        const loadMoreText = window.i18n ? window.i18n.t('collection.load_more', 'Load More') : 'Load More';
        loadMoreBtn.textContent = `${loadMoreText} (+${nextBatch})`;
      }
      if (showAllBtn) {
        showAllBtn.style.display = 'inline-flex';
        const showAllText = window.i18n ? window.i18n.t('collection.show_all', 'Show All') : 'Show All';
        showAllBtn.textContent = showAllText;
      }
    }
  }
}

// Setup event listeners
async function initCollection() {
  const currentLang = window.i18n ? window.i18n.getLanguage() : 'en';
  if (currentLang !== 'en') {
    await loadLocalizedDescriptions(currentLang);
  }
  await fetchPortfolio();

  // Search input & clear button
  const searchInput = document.getElementById('collection-search');
  const searchClearBtn = document.getElementById('search-clear-btn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      if (searchClearBtn) {
        searchClearBtn.style.display = searchQuery ? 'inline-flex' : 'none';
      }
      visibleCount = INITIAL_LOAD_COUNT;
      render(false);
    });
  }

  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      searchQuery = '';
      searchClearBtn.style.display = 'none';
      visibleCount = INITIAL_LOAD_COUNT;
      render(false);
    });
  }

  // Filter chips
  const chips = document.querySelectorAll('.filter-chip');
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.dataset.filter || 'all';
      visibleCount = INITIAL_LOAD_COUNT;
      render(false);
    });
  });

  // Sort dropdown
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      visibleCount = INITIAL_LOAD_COUNT;
      render(false);
    });
  }

  // Load More button
  const loadMoreBtn = document.getElementById('load-more-btn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      visibleCount += LOAD_MORE_STEP;
      render(true);
    });
  }

  // Show All button
  const showAllBtn = document.getElementById('show-all-btn');
  if (showAllBtn) {
    showAllBtn.addEventListener('click', () => {
      visibleCount = getPortfolio().length;
      render(true);
    });
  }

  // Render Latest Release featured card
  initLatestRelease();

  // Render Featured Sales cards
  initFeaturedSales();

  // Initial render
  render(false);
}

// Render the Latest / Most Recent Release card
function initLatestRelease() {
  const container = document.getElementById('latest-release-container');
  if (!container) return;

  const items = getPortfolio().filter((i) => i.isWatchFace !== false);
  if (!items || items.length === 0) return;

  // Find item with the most recent release date
  const sorted = [...items].sort((a, b) => {
    const dateA = parseDate(a.releaseDate);
    const dateB = parseDate(b.releaseDate);
    return dateB - dateA;
  });

  const latest = sorted[0];
  if (!latest) return;

  const isAvail = latest.isAvailable !== false;
  const isGithub = Boolean(latest.isAvailableOnGithub && latest.githubLink);
  const playStoreUrl = `https://play.google.com/store/apps/details?id=${encodeURIComponent(latest.packageName)}`;
  const primaryUrl = isAvail ? playStoreUrl : (isGithub ? latest.githubLink : playStoreUrl);
  const primaryAria = isAvail
    ? `View ${latest.appName} on Google Play`
    : (isGithub ? `View ${latest.appName} on GitHub` : `View ${latest.appName}`);

  // Build candidate images: id.webp, id_1.webp, id_2.webp, id_3.webp
  const iconBase = `/assets/icons/${latest.id}`;
  const candidateImages = latest.hasAltImages
    ? [
        `${iconBase}.webp`,
        `${iconBase}_1.webp`,
        `${iconBase}_2.webp`,
        `${iconBase}_3.webp`
      ]
    : [`${iconBase}.webp`];

  const slidesHtml = candidateImages.map((src, index) => `
    <img src="${src}" alt="${latest.appName} preview variation ${index + 1}" class="latest-release-slide ${index === 0 ? 'active' : ''}" data-index="${index}" />
  `).join('');

  const dotsHtml = candidateImages.map((_, index) => `
    <span class="latest-release-dot ${index === 0 ? 'active' : ''}" data-index="${index}" aria-hidden="true"></span>
  `).join('');

  const lang = window.i18n ? window.i18n.getLanguage() : 'en';
  let comingSoonText = 'Coming Soon';
  let comingSoonAction = 'Available Soon on Google Play';
  if (lang === 'sk') {
    comingSoonText = 'Čoskoro';
    comingSoonAction = 'Čoskoro k dispozícii v Google Play';
  } else if (lang === 'de') {
    comingSoonText = 'Demnächst';
    comingSoonAction = 'Demnächst bei Google Play verfügbar';
  } else if (lang === 'es') {
    comingSoonText = 'Próximamente';
    comingSoonAction = 'Próximamente disponible en Google Play';
  } else if (lang === 'pl') {
    comingSoonText = 'Wkrótce';
    comingSoonAction = 'Wkrótce dostępne w Google Play';
  }

  const badgeStatusHtml = isAvail
    ? `<span class="badge-pill badge-latest">${window.i18n ? window.i18n.t('latest_release.badge', 'New Release') : 'New Release'}</span>`
    : `<span class="badge-pill badge-coming-soon">${comingSoonText}</span>`;

  const badgePriceHtml = latest.isFree
    ? `<span class="badge-pill">${window.i18n ? window.i18n.t('apps_page.badge_free', 'Free') : 'Free'}</span>`
    : `<span class="badge-pill badge-paid">${window.i18n ? window.i18n.t('apps_page.badge_paid', 'Paid') : 'Paid'}</span>`;

  const badgeOpenSourceHtml = latest.isOpenSource
    ? `<span class="badge-pill badge-opensource">${window.i18n ? window.i18n.t('apps_page.badge_opensource', 'Open Source') : 'Open Source'}</span>`
    : '';

  const playBadgeHtml = isAvail
    ? `<a href="${playStoreUrl}" target="_blank" rel="noopener" class="play-store-badge">
        <img src="/assets/google-play-badge.svg" alt="Get it on Google Play" />
      </a>`
    : `<div class="status-coming-soon">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 14 14"></polyline>
        </svg>
        <span>${comingSoonAction}</span>
      </div>`;

  const githubBadgeHtml = isGithub
    ? `<a href="${escapeHtml(latest.githubLink)}" target="_blank" rel="noopener" class="github-badge" aria-label="Get it on GitHub">
        <img src="/assets/github-badge.svg" alt="Get it on GitHub" />
      </a>`
    : '';

  const titleHtml = (isAvail || isGithub)
    ? `<a href="${primaryUrl}" target="_blank" rel="noopener" class="latest-release-title-link">${latest.appName}</a>`
    : latest.appName;

  const previewWrapperHtml = (isAvail || isGithub)
    ? `<a href="${primaryUrl}" target="_blank" rel="noopener" class="latest-release-slides-wrapper" aria-label="${primaryAria}">
        ${slidesHtml}
      </a>`
    : `<div class="latest-release-slides-wrapper">
        ${slidesHtml}
      </div>`;

  const releasePrefix = window.i18n ? window.i18n.t('latest_release.released', 'Released') : 'Released';

  container.innerHTML = `
    <div class="latest-release-card">
      <div class="latest-release-visual">
        ${previewWrapperHtml}
        <div class="latest-release-dots" aria-hidden="true">
          ${dotsHtml}
        </div>
      </div>
      <div class="latest-release-content">
        <div class="latest-release-badge-row">
          ${badgeStatusHtml}
          ${badgePriceHtml}
          ${badgeOpenSourceHtml}
          ${latest.releaseDate ? `<span class="latest-release-date">${releasePrefix}: ${latest.releaseDate}</span>` : ''}
        </div>
        <h3 class="latest-release-title">${titleHtml}</h3>
        <p class="latest-release-desc">${escapeHtml(getItemDescription(latest))}</p>
        <div class="latest-release-actions">
          ${playBadgeHtml}
          ${githubBadgeHtml}
        </div>
      </div>
    </div>
  `;

  // Start smooth slideshow transition
  setupReleaseSlideshow(container);
}

function setupReleaseSlideshow(container) {
  const allSlides = Array.from(container.querySelectorAll('.latest-release-slide'));
  const allDots = Array.from(container.querySelectorAll('.latest-release-dot'));
  if (allSlides.length <= 1) return;

  // Verify and filter out broken images
  let validIndexes = [0];

  allSlides.forEach((slide, idx) => {
    slide.onerror = () => {
      slide.style.display = 'none';
      if (allDots[idx]) allDots[idx].style.display = 'none';
      validIndexes = validIndexes.filter((i) => i !== idx);
    };
    slide.onload = () => {
      if (!validIndexes.includes(idx)) {
        validIndexes.push(idx);
        validIndexes.sort((a, b) => a - b);
      }
    };
    // In case already loaded from cache
    if (slide.complete && slide.naturalWidth > 0 && !validIndexes.includes(idx)) {
      validIndexes.push(idx);
      validIndexes.sort((a, b) => a - b);
    }
  });

  let currentPointer = 0;
  let timer = null;

  function showSlideAtPointer(pointer) {
    if (validIndexes.length <= 1) return;
    currentPointer = (pointer + validIndexes.length) % validIndexes.length;
    const activeSlideIndex = validIndexes[currentPointer];

    allSlides.forEach((slide, idx) => {
      slide.classList.toggle('active', idx === activeSlideIndex);
    });

    allDots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === activeSlideIndex);
    });
  }

  function startTimer() {
    stopTimer();
    timer = setInterval(() => {
      showSlideAtPointer(currentPointer + 1);
    }, 2800);
  }

  function stopTimer() {
    if (timer) clearInterval(timer);
  }

  // Touch swipe support on the visual container
  const visualEl = container.querySelector('.latest-release-visual');
  if (visualEl) {
    let touchStartX = 0;
    let touchStartY = 0;
    let isSwiping = false;
    let swipeResetTimeout = null;

    visualEl.addEventListener('touchstart', (e) => {
      if (!e.touches || e.touches.length === 0) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isSwiping = false;
      stopTimer();
    }, { passive: true });

    visualEl.addEventListener('touchmove', (e) => {
      if (!e.touches || e.touches.length === 0) return;
      const diffX = e.touches[0].clientX - touchStartX;
      const diffY = e.touches[0].clientY - touchStartY;
      if (Math.abs(diffX) > 10 && Math.abs(diffX) > Math.abs(diffY)) {
        isSwiping = true;
      }
    }, { passive: true });

    visualEl.addEventListener('touchend', (e) => {
      if (!e.changedTouches || e.changedTouches.length === 0) {
        startTimer();
        return;
      }
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;

      // Check if it's a significant horizontal swipe (> 30px)
      if (Math.abs(diffX) > 30 && Math.abs(diffX) > Math.abs(diffY)) {
        isSwiping = true;
        if (swipeResetTimeout) clearTimeout(swipeResetTimeout);
        swipeResetTimeout = setTimeout(() => {
          isSwiping = false;
        }, 400);

        if (diffX < 0) {
          showSlideAtPointer(currentPointer + 1);
        } else {
          showSlideAtPointer(currentPointer - 1);
        }
      }
      startTimer();
    }, { passive: true });

    visualEl.addEventListener('touchcancel', () => {
      isSwiping = false;
      startTimer();
    }, { passive: true });

    // Prevent following the <a> link if user just performed a swipe gesture
    visualEl.addEventListener('click', (e) => {
      if (isSwiping) {
        e.preventDefault();
        e.stopPropagation();
        isSwiping = false;
        if (swipeResetTimeout) clearTimeout(swipeResetTimeout);
      }
    }, true);
  }

  container.addEventListener('mouseenter', stopTimer);
  container.addEventListener('mouseleave', startTimer);

  startTimer();
}

// Format sale end Unix timestamp to localized 'Offer ends DD/MM/YYYY, HH:mm'
function formatSaleEndTime(saleEndTime) {
  if (!saleEndTime || typeof saleEndTime !== 'number') return null;
  const d = new Date(saleEndTime * 1000);
  if (isNaN(d.getTime())) return null;

  const isDotDate = window.i18n && (window.i18n.getLanguage() === 'sk' || window.i18n.getLanguage() === 'de' || window.i18n.getLanguage() === 'pl');
  const prefix = window.i18n ? window.i18n.t('featured_deals.offer_ends', 'Offer ends') : 'Offer ends';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  if (isDotDate) {
    return `${prefix} ${day}.${month}.${year}, ${hours}:${minutes}`;
  }
  return `${prefix} ${day}/${month}/${year}, ${hours}:${minutes}`;
}

// Localized count string for active deals
function formatActiveDealsCount(count, lang) {
  if (lang === 'sk') {
    if (count === 1) return '1 aktívna zľava';
    if (count >= 2 && count <= 4) return `${count} aktívne zľavy`;
    return `${count} aktívnych zliav`;
  }
  if (lang === 'de') {
    return count === 1 ? '1 aktives Angebot' : `${count} aktive Angebote`;
  }
  if (lang === 'es') {
    return count === 1 ? '1 oferta activa' : `${count} ofertas activas`;
  }
  if (lang === 'fr') {
    return count === 1 ? '1 offre active' : `${count} offres actives`;
  }
  if (lang === 'it') {
    return count === 1 ? '1 offerta attiva' : `${count} offerte attive`;
  }
  if (lang === 'pl') {
    if (count === 1) return '1 aktywna promocja';
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
      return `${count} aktywne promocje`;
    }
    return `${count} aktywnych promocji`;
  }
  if (lang === 'pt') {
    return count === 1 ? '1 oferta ativa' : `${count} ofertas ativas`;
  }
  if (lang === 'ko') {
    return `${count}개의 할인 진행 중`;
  }
  return count === 1 ? '1 active deal' : `${count} active deals`;
}

// Render Featured Deals cards with rotation pagination and active deals count
function initFeaturedSales() {
  const container = document.getElementById('featured-sales-container');
  if (!container) return;

  const items = getPortfolio().filter((i) => i.isWatchFace !== false && i.onSale === true);
  if (!items || items.length === 0) {
    container.innerHTML = '';
    return;
  }

  // Filter 100% off promos vs regular discounts
  const freePromos = items.filter((i) => i.discount === 1.0);
  const regularDeals = items.filter((i) => i.discount !== 1.0);

  // Shuffle sets
  const shuffledFree = [...freePromos].sort(() => Math.random() - 0.5);
  const shuffledRegular = [...regularDeals].sort(() => Math.random() - 0.5);

  // If a 100% off promo is available, ensure one appears in the first batch
  const allDeals = [];
  if (shuffledFree.length > 0) {
    allDeals.push(shuffledFree.shift());
  }
  const rest = [...shuffledFree, ...shuffledRegular].sort(() => Math.random() - 0.5);
  allDeals.push(...rest);

  const DEALS_PER_PAGE = 3;
  const totalPages = Math.ceil(allDeals.length / DEALS_PER_PAGE);

  function getDealsForPage(pageIndex) {
    const start = pageIndex * DEALS_PER_PAGE;
    if (start + DEALS_PER_PAGE <= allDeals.length) {
      return allDeals.slice(start, start + DEALS_PER_PAGE);
    }
    if (allDeals.length >= DEALS_PER_PAGE) {
      return allDeals.slice(allDeals.length - DEALS_PER_PAGE);
    }
    return allDeals.slice(start);
  }

  function renderDealCard(item) {
    const isFreePromo = item.discount === 1.0;
    const playStoreUrl = `https://play.google.com/store/apps/details?id=${encodeURIComponent(item.packageName)}`;
    const iconSrc = `/assets/icons/${item.id}.webp`;

    let discountBadgeHtml = '';
    if (isFreePromo) {
      discountBadgeHtml = `<span class="badge-pill badge-sale-free">${window.i18n ? window.i18n.t('featured_deals.badge_free', '100% OFF') : '100% OFF'}</span>`;
    } else if (typeof item.discount === 'number' && item.discount > 0) {
      discountBadgeHtml = `<span class="badge-pill badge-sale-discount">-${Math.round(item.discount * 100)}%</span>`;
    } else {
      discountBadgeHtml = `<span class="badge-pill badge-sale-discount">${window.i18n ? window.i18n.t('featured_deals.badge_sale', 'Sale') : 'Sale'}</span>`;
    }

    const timerText = formatSaleEndTime(item.saleEndTime);

    const timerHtml = timerText
      ? `<span class="sale-card-timer" title="${timerText}">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span>${timerText}</span>
        </span>`
      : '';

    return `
      <div class="featured-sale-card ${isFreePromo ? 'is-free-promo' : ''}">
        <div class="sale-card-visual">
          <a href="${playStoreUrl}" target="_blank" rel="noopener" class="sale-card-img-wrapper" aria-label="View ${item.appName} on Google Play">
            <img src="${iconSrc}" alt="${item.appName} preview" class="sale-card-img" loading="lazy" />
          </a>
        </div>
        <div class="sale-card-content">
          <div class="sale-card-badge-row">
            ${discountBadgeHtml}
            ${timerHtml}
          </div>
          <h4 class="sale-card-title">
            <a href="${playStoreUrl}" target="_blank" rel="noopener" class="sale-card-title-link">${item.appName}</a>
          </h4>
          <div class="sale-card-actions">
            <a href="${playStoreUrl}" target="_blank" rel="noopener" class="play-store-badge">
              <img src="/assets/google-play-badge.svg" alt="Get it on Google Play" />
            </a>
          </div>
        </div>
      </div>
    `;
  }

  const lang = window.i18n ? window.i18n.getLanguage() : 'en';
  const dealsHeading = window.i18n ? window.i18n.t('featured_deals.heading', 'Featured Deals') : 'Featured Deals';
  const countText = formatActiveDealsCount(allDeals.length, lang);

  const dotsHtml = totalPages > 1
    ? Array.from({ length: totalPages }, (_, i) => `
        <button type="button" class="featured-sales-dot ${i === 0 ? 'active' : ''}" data-page="${i}" aria-label="Deals page ${i + 1} of ${totalPages}"></button>
      `).join('')
    : '';

  const controlsHtml = `
    <div class="featured-sales-controls">
      ${totalPages > 1 ? `<div class="featured-sales-dots" role="tablist" aria-label="Featured deals pagination">${dotsHtml}</div>` : ''}
      <span class="featured-sales-count">${countText}</span>
    </div>
  `;

  container.innerHTML = `
    <div class="featured-sales-wrapper">
      <div class="featured-sales-header">
        <h3 id="deals" class="featured-sales-heading">${dealsHeading}</h3>
        ${controlsHtml}
      </div>
      <div class="featured-sales-grid" id="featured-sales-grid">
        ${getDealsForPage(0).map(renderDealCard).join('')}
      </div>
    </div>
  `;

  // Attach heading anchor link for #deals shortcut
  if (typeof window.initHeadingAnchors === 'function') {
    window.initHeadingAnchors();
  }

  // Handle direct hash navigation if URL was loaded with #deals or #featured-deals
  if (window.location.hash === '#deals' || window.location.hash === '#featured-deals') {
    const target = document.getElementById('deals') || container;
    if (target) {
      setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 120);
    }
  }

  // Interactive page rotation via dots & touch swipe
  if (totalPages > 1) {
    let currentPage = 0;
    const gridEl = container.querySelector('#featured-sales-grid');
    const dotBtns = Array.from(container.querySelectorAll('.featured-sales-dot'));

    function goToPage(pageIndex) {
      if (pageIndex < 0 || pageIndex >= totalPages) return;
      if (pageIndex === currentPage) return;
      currentPage = pageIndex;

      dotBtns.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentPage);
      });

      if (gridEl) {
        gridEl.innerHTML = getDealsForPage(currentPage).map(renderDealCard).join('');
        const cards = gridEl.querySelectorAll('.featured-sale-card');
        cards.forEach((card, idx) => {
          if (typeof card.animate === 'function') {
            card.animate(
              [
                { opacity: 0, transform: 'translateY(-12px)' },
                { opacity: 1, transform: 'translateY(0)' }
              ],
              {
                duration: 320,
                delay: idx * 40,
                easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                fill: 'both'
              }
            );
          }
        });
      }
    }

    dotBtns.forEach((dot) => {
      dot.addEventListener('click', () => {
        const p = parseInt(dot.getAttribute('data-page'), 10);
        if (!isNaN(p)) {
          if (p === currentPage) {
            goToPage((currentPage + 1) % totalPages);
          } else {
            goToPage(p);
          }
        }
      });
    });

    // Touch swipe support on featured-sales-grid
    if (gridEl) {
      let touchStartX = 0;
      let touchStartY = 0;
      let isSwiping = false;
      let swipeResetTimeout = null;

      gridEl.addEventListener('touchstart', (e) => {
        if (!e.touches || e.touches.length === 0) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isSwiping = false;
      }, { passive: true });

      gridEl.addEventListener('touchmove', (e) => {
        if (!e.touches || e.touches.length === 0) return;
        const diffX = e.touches[0].clientX - touchStartX;
        const diffY = e.touches[0].clientY - touchStartY;
        if (Math.abs(diffX) > 10 && Math.abs(diffX) > Math.abs(diffY)) {
          isSwiping = true;
        }
      }, { passive: true });

      gridEl.addEventListener('touchend', (e) => {
        if (!e.changedTouches || e.changedTouches.length === 0) return;
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;

        if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY)) {
          isSwiping = true;
          if (swipeResetTimeout) clearTimeout(swipeResetTimeout);
          swipeResetTimeout = setTimeout(() => {
            isSwiping = false;
          }, 400);

          if (diffX < 0) {
            goToPage((currentPage + 1) % totalPages);
          } else {
            goToPage((currentPage - 1 + totalPages) % totalPages);
          }
        }
      }, { passive: true });

      gridEl.addEventListener('touchcancel', () => {
        isSwiping = false;
      }, { passive: true });

      gridEl.addEventListener('click', (e) => {
        if (isSwiping) {
          e.preventDefault();
          e.stopPropagation();
          isSwiping = false;
          if (swipeResetTimeout) clearTimeout(swipeResetTimeout);
        }
      }, true);
    }
  }
}

// Re-render dynamic elements when language changes
window.addEventListener('languageChanged', async (e) => {
  const lang = (e && e.detail && e.detail.lang) || (window.i18n ? window.i18n.getLanguage() : 'en');
  await loadLocalizedDescriptions(lang);
  render(false);
  initLatestRelease();
  initFeaturedSales();
});

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCollection);
} else {
  initCollection();
}
