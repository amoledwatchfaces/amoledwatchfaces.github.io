// Configuration
const INITIAL_LOAD_COUNT = 6;
const LOAD_MORE_STEP = 12;

let currentFilter = 'all'; // 'all' | 'analog' | 'digital' | 'weather'
let currentSort = 'release-desc'; // 'release-desc' | 'updated-desc' | 'alphabetical'
let visibleCount = INITIAL_LOAD_COUNT;

function getPortfolio() {
  return window.portfolio || [];
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
    // Only show available items if isAvailable is defined
    if (item.isAvailable === false) return false;

    if (currentFilter === 'analog') return item.isAnalog === true;
    if (currentFilter === 'digital') return item.isAnalog === false;
    if (currentFilter === 'weather') return item.hasWeather === true;
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

  const hasIcon2 = Boolean(item.icon2);
  const iconsHtml = hasIcon2
    ? `<div class="watch-icons-wrapper dual-icons">
        <img src="${item.icon}" alt="${item.appName}" class="watch-icon-preview primary-icon" />
        <img src="${item.icon2}" alt="${item.appName} variation" class="watch-icon-preview secondary-icon" />
      </div>`
    : `<div class="watch-icons-wrapper single-icon">
        <img src="${item.icon}" alt="${item.appName}" class="watch-icon-preview" />
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
function initCollection() {
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

  // Initial render
  render(false);
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCollection);
} else {
  initCollection();
}
