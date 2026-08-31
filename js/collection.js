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
    const res = await fetch('data/portfolio.json');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    portfolioData = await res.json();
    window.portfolio = portfolioData;
    return portfolioData;
  } catch (err) {
    console.error('Failed to load data/portfolio.json:', err);
    return [];
  }
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

    // Only show available items if isAvailable is defined
    if (item.isAvailable === false) return false;

    if (currentFilter === 'free' && !item.isFree) return false;
    if (currentFilter === 'analog' && !item.isAnalog) return false;
    if (currentFilter === 'digital' && item.isAnalog) return false;
    if (currentFilter === 'weather' && !item.hasWeather) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nameMatch = (item.appName || '').toLowerCase().includes(q);
      const descMatch = (item.shortDescription || '').toLowerCase().includes(q);
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

  const playStoreUrl = `https://play.google.com/store/apps/details?id=${encodeURIComponent(item.packageName)}`;

  const iconSrc = `assets/icons/${item.id}.webp`;
  const icon2Src = `assets/icons/${item.id}_1.webp`;
  const hasIcon2 = Boolean(item.hasAltImages);

  const iconsHtml = hasIcon2
    ? `<div class="watch-icons-wrapper dual-icons">
        <img src="${iconSrc}" alt="${item.appName}" class="watch-icon-preview primary-icon" />
        <img src="${icon2Src}" alt="${item.appName} variation" class="watch-icon-preview secondary-icon" />
      </div>`
    : `<div class="watch-icons-wrapper single-icon">
        <img src="${iconSrc}" alt="${item.appName}" class="watch-icon-preview" />
      </div>`;

  card.innerHTML = `
    <a href="${playStoreUrl}" target="_blank" rel="noopener" class="watch-preview-link" aria-label="${item.appName} on Google Play">
      ${iconsHtml}
    </a>
    <div class="collection-info">
      <div class="collection-header">
        <h3>
          <a href="${playStoreUrl}" target="_blank" rel="noopener" class="collection-title-link">
            ${item.appName}
          </a>
        </h3>
        ${item.isFree ? '<span class="badge-pill">Free</span>' : '<span class="badge-pill badge-paid">Paid</span>'}
      </div>
      <p class="collection-desc">${item.shortDescription || ''}</p>
      <div class="links" style="margin-top: auto; padding-top: 14px;">
        <a href="${playStoreUrl}" target="_blank" rel="noopener" class="play-store-badge">
          <img src="assets/google-play-badge.svg" alt="Get it on Google Play" />
        </a>
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
    grid.innerHTML = `
      <div class="collection-empty-state">
        <svg class="empty-icon" xmlns="http://www.w3.org/2000/svg" height="36px" viewBox="0 -960 960 960" width="36px" fill="currentColor">
          <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/>
        </svg>
        <h3>No watch faces found</h3>
        <p>No results matching "<strong>${escapeHtml(searchQuery)}</strong>". Try checking for typos or clear your search.</p>
        <button type="button" class="btn-clear-search" id="empty-clear-btn">Clear search</button>
      </div>
    `;
    if (countEl) {
      countEl.textContent = `0 watch faces found`;
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
    countEl.textContent = `Showing ${targetCount} of ${total} watch faces`;
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
        loadMoreBtn.textContent = `Load More (+${nextBatch})`;
      }
      if (showAllBtn) {
        showAllBtn.style.display = 'inline-flex';
      }
    }
  }
}

// Setup event listeners
async function initCollection() {
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
  const playStoreUrl = `https://play.google.com/store/apps/details?id=${encodeURIComponent(latest.packageName)}`;

  // Build candidate images: id.webp, id_1.webp, id_2.webp, id_3.webp
  const iconBase = `assets/icons/${latest.id}`;
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
    <button type="button" class="latest-release-dot ${index === 0 ? 'active' : ''}" data-index="${index}" aria-label="Slide ${index + 1}"></button>
  `).join('');

  const badgeStatusHtml = isAvail
    ? `<span class="badge-pill badge-latest">New Release</span>`
    : `<span class="badge-pill badge-coming-soon">Coming Soon</span>`;

  const badgePriceHtml = latest.isFree
    ? `<span class="badge-pill">Free</span>`
    : `<span class="badge-pill badge-paid">Paid</span>`;

  const actionHtml = isAvail
    ? `<div class="links" style="margin-top: 0;">
        <a href="${playStoreUrl}" target="_blank" rel="noopener" class="play-store-badge">
          <img src="assets/google-play-badge.svg" alt="Get it on Google Play" />
        </a>
      </div>`
    : `<div class="status-coming-soon">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 14 14"></polyline>
        </svg>
        <span>Available Soon on Google Play</span>
      </div>`;

  const titleHtml = isAvail
    ? `<a href="${playStoreUrl}" target="_blank" rel="noopener" class="latest-release-title-link">${latest.appName}</a>`
    : latest.appName;

  const previewWrapperHtml = isAvail
    ? `<a href="${playStoreUrl}" target="_blank" rel="noopener" class="latest-release-slides-wrapper" aria-label="View ${latest.appName} on Google Play">
        ${slidesHtml}
      </a>`
    : `<div class="latest-release-slides-wrapper">
        ${slidesHtml}
      </div>`;

  container.innerHTML = `
    <div class="latest-release-card">
      <div class="latest-release-visual">
        ${previewWrapperHtml}
        <div class="latest-release-dots">
          ${dotsHtml}
        </div>
      </div>
      <div class="latest-release-content">
        <div class="latest-release-badge-row">
          ${badgeStatusHtml}
          ${badgePriceHtml}
          ${latest.releaseDate ? `<span class="latest-release-date">Released: ${latest.releaseDate}</span>` : ''}
        </div>
        <h3 class="latest-release-title">${titleHtml}</h3>
        <p class="latest-release-desc">${latest.shortDescription || ''}</p>
        <div class="latest-release-actions">
          ${actionHtml}
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

  allDots.forEach((dot, idx) => {
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      const pointer = validIndexes.indexOf(idx);
      if (pointer !== -1) {
        showSlideAtPointer(pointer);
        startTimer();
      }
    });
  });

  container.addEventListener('mouseenter', stopTimer);
  container.addEventListener('mouseleave', startTimer);

  startTimer();
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCollection);
} else {
  initCollection();
}
