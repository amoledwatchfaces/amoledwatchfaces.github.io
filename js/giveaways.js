// Multi-Giveaways & Promo Code Generator Client Script
const GIVEAWAY_ENDPOINT = "https://giveawayapi-66490687416.europe-west1.run.app";

document.addEventListener('DOMContentLoaded', () => {
  const gridElement = document.getElementById('giveaways-grid');

  // Admin Modal Elements
  const adminBackdrop = document.getElementById('admin-modal-backdrop');
  const closeAdminBtn = document.getElementById('btn-close-admin-modal');
  const adminForm = document.getElementById('admin-giveaway-form');
  const adminSecretInput = document.getElementById('admin-secret-input');
  const titleInput = document.getElementById('giveaway-title-input');
  const packageInput = document.getElementById('giveaway-package-input');
  const iconInput = document.getElementById('giveaway-icon-input');
  const csvDropzone = document.getElementById('csv-dropzone');
  const csvFileInput = document.getElementById('csv-file-input');
  const dropzoneLabel = document.getElementById('dropzone-label');
  const detectedCount = document.getElementById('detected-codes-count');
  const manualPasteInput = document.getElementById('csv-manual-paste');
  const adminStatus = document.getElementById('admin-status-message');
  const submitGiveawayBtn = document.getElementById('btn-submit-giveaway');
  const adminListContainer = document.getElementById('admin-giveaways-list');
  const refreshAdminListBtn = document.getElementById('btn-refresh-admin-list');

  let activeGiveawaysList = [];
  let parsedCsvCodes = [];

  // Restore saved admin secret
  const savedSecret = localStorage.getItem('awf_admin_secret');
  if (savedSecret && adminSecretInput) {
    adminSecretInput.value = savedSecret;
  }

  /**
   * Fetch all active giveaways
   */
  async function loadGiveaways() {
    try {
      const response = await fetch(`${GIVEAWAY_ENDPOINT}?action=get`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      const giveaways = data.giveaways || (data.giveaway ? [data.giveaway] : []);

      activeGiveawaysList = giveaways;
      renderGiveawaysGrid(giveaways);

    } catch (err) {
      console.warn('Could not load active giveaways:', err);
      renderEmptyState("Stay tuned! New watch face giveaways are coming soon.");
    }
  }

  /**
   * Render the dynamic grid of giveaway cards
   */
  function renderGiveawaysGrid(giveaways) {
    if (!gridElement) return;
    gridElement.innerHTML = '';

    if (!giveaways || giveaways.length === 0) {
      renderEmptyState("No active giveaways at the moment. Check back soon!");
      return;
    }

    giveaways.forEach(giveaway => {
      const card = createGiveawayCard(giveaway);
      gridElement.appendChild(card);
    });
  }

  /**
   * Render empty state
   */
  function renderEmptyState(message) {
    if (!gridElement) return;
    gridElement.innerHTML = `
      <section class="giveaway-card" style="max-width: 540px; margin: 0 auto; width: 100%;">
        <div class="giveaway-badge-top out-of-codes">
          <span class="live-dot" style="background:#ef4444"></span> No Active Giveaway
        </div>
        <div class="giveaway-icon-wrap">
          <img src="assets/logo_notification.webp" alt="amoledwatchfaces" class="giveaway-icon" />
        </div>
        <h2 class="giveaway-title">Stay Tuned!</h2>
        <p class="tagline" style="margin-bottom: 24px;">${message}</p>
        <a href="./" class="btn-claim-promo" style="text-decoration:none;">Explore Watch Faces</a>
      </section>
    `;
  }

  /**
   * Create an individual giveaway card
   */
  function createGiveawayCard(giveaway) {
    const card = document.createElement('section');
    card.className = 'giveaway-card';
    card.id = `giveaway-card-${giveaway.id}`;
    card.setAttribute('aria-label', `${giveaway.title} Giveaway Card`);

    const isAvailable = Boolean(giveaway.isActive && giveaway.remainingCodes > 0);
    const savedCode = localStorage.getItem(`awf_giveaway_code_${giveaway.id}`);

    card.innerHTML = `
      <div id="badge-${giveaway.id}" class="giveaway-badge-top ${isAvailable ? '' : 'out-of-codes'}">
        <span class="live-dot" style="${isAvailable ? '' : 'background:#ef4444'}"></span>
        ${isAvailable ? 'Active Giveaway' : 'Giveaway Ended'}
      </div>

      <div class="giveaway-icon-wrap">
        <img src="${giveaway.iconUrl || 'assets/logo_notification.webp'}" alt="${giveaway.title}" class="giveaway-icon" />
      </div>

      <h2 class="giveaway-title">${giveaway.title}</h2>
      <div class="giveaway-author">
        by <a href="${giveaway.playStoreUrl || 'https://play.google.com/store/apps/dev?id=5591589606735981545'}" target="_blank" rel="noopener">amoledwatchfaces™</a>
      </div>

      <div class="giveaway-inventory">
        <span>Codes Left:</span>
        <span id="inventory-${giveaway.id}" class="inventory-number">${giveaway.remainingCodes}</span>
      </div>

      <!-- Action Area -->
      <div id="claim-area-${giveaway.id}" style="width: 100%; display: flex; flex-direction: column; align-items: center;">
        <button id="btn-claim-${giveaway.id}" class="btn-claim-promo" type="button" ${isAvailable ? '' : 'disabled'}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 12 20 22 4 22 4 12"></polyline>
            <rect x="2" y="7" width="20" height="5"></rect>
            <line x1="12" y1="22" x2="12" y2="7"></line>
            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
          </svg>
          ${isAvailable ? 'Claim Free Promo Code' : 'All Promo Codes Claimed'}
        </button>
      </div>

      <!-- Revealed Code Box -->
      <div id="reveal-area-${giveaway.id}" class="code-reveal-area" style="display: none;">
        <div class="promo-code-card">
          <span id="code-text-${giveaway.id}" class="promo-code-text">XXXX-XXXX</span>
          <button id="btn-copy-${giveaway.id}" class="btn-copy-code" type="button" title="Copy Promo Code">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy Code
          </button>
        </div>

        <a id="btn-redeem-${giveaway.id}" class="btn-redeem-direct" href="#" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M3 20.5v-17c0-.83.67-1.5 1.5-1.5.35 0 .68.12.95.34l12.44 8.5c.67.46.85 1.38.39 2.05-.1.14-.22.26-.36.36L5.45 21.66c-.27.22-.6.34-.95.34-.83 0-1.5-.67-1.5-1.5z"></path>
          </svg>
          Redeem on Google Play
        </a>

        <p class="claim-note">Tap the button above to automatically apply this code on Google Play, or copy and paste it in the Play Store.</p>
      </div>
    `;

    // Hook up claim button
    const claimBtn = card.querySelector(`#btn-claim-${giveaway.id}`);
    const claimArea = card.querySelector(`#claim-area-${giveaway.id}`);
    const revealArea = card.querySelector(`#reveal-area-${giveaway.id}`);
    const codeText = card.querySelector(`#code-text-${giveaway.id}`);
    const copyBtn = card.querySelector(`#btn-copy-${giveaway.id}`);
    const redeemBtn = card.querySelector(`#btn-redeem-${giveaway.id}`);
    const invCount = card.querySelector(`#inventory-${giveaway.id}`);
    const badgeEl = card.querySelector(`#badge-${giveaway.id}`);

    function renderRevealed(code, redeemUrl) {
      claimArea.style.display = 'none';
      revealArea.style.display = 'flex';
      codeText.textContent = code;
      redeemBtn.href = redeemUrl || `https://play.google.com/redeem?code=${encodeURIComponent(code)}`;

      copyBtn.onclick = async () => {
        try {
          await navigator.clipboard.writeText(code);
          const original = copyBtn.innerHTML;
          copyBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!`;
          copyBtn.style.background = 'var(--accent)';
          copyBtn.style.color = '#000000';
          setTimeout(() => {
            copyBtn.innerHTML = original;
            copyBtn.style.background = '';
            copyBtn.style.color = '';
          }, 2000);
        } catch (e) {
          console.warn('Clipboard failed:', e);
        }
      };
    }

    // Check if user already claimed this specific giveaway
    if (savedCode) {
      renderRevealed(savedCode);
      return card;
    }

    claimBtn.addEventListener('click', async () => {
      if (claimBtn.disabled) return;
      claimBtn.disabled = true;
      claimBtn.innerHTML = `<div class="spinner"></div> Generating Code...`;

      try {
        const response = await fetch(`${GIVEAWAY_ENDPOINT}?action=claim`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'claim', giveawayId: giveaway.id })
        });

        const data = await response.json();

        if (response.ok && data.success && data.code) {
          localStorage.setItem(`awf_giveaway_code_${giveaway.id}`, data.code);
          if (typeof data.remainingCodes === 'number') {
            invCount.textContent = data.remainingCodes;
          }
          renderRevealed(data.code, data.redeemUrl);
        } else if (response.status === 429) {
          if (data.code) {
            localStorage.setItem(`awf_giveaway_code_${giveaway.id}`, data.code);
            renderRevealed(data.code, data.redeemUrl);
          } else {
            alert(data.error || 'You have already claimed a promo code for this giveaway.');
            claimBtn.disabled = false;
            claimBtn.textContent = 'Claim Free Promo Code';
          }
        } else if (response.status === 410 || data.isOutOfCodes) {
          invCount.textContent = '0';
          badgeEl.className = 'giveaway-badge-top out-of-codes';
          badgeEl.innerHTML = `<span class="live-dot" style="background:#ef4444"></span> Out of Codes`;
          claimBtn.disabled = true;
          claimBtn.textContent = 'All Promo Codes Claimed';
        } else {
          alert(data.error || 'Could not claim code. Please try again.');
          claimBtn.disabled = false;
          claimBtn.textContent = 'Claim Free Promo Code';
        }
      } catch (err) {
        console.error('Claim error:', err);
        alert('Network error while claiming promo code.');
        claimBtn.disabled = false;
        claimBtn.textContent = 'Claim Free Promo Code';
      }
    });

    return card;
  }

  /* ==========================================================================
     Admin Modal Functionality
     ========================================================================== */

  function openAdminModal() {
    if (adminBackdrop) {
      adminBackdrop.style.display = 'flex';
      adminStatus.style.display = 'none';
      if (titleInput) titleInput.focus();
      loadAdminGiveawaysList();
    }
  }

  function closeAdminModal() {
    if (adminBackdrop) {
      adminBackdrop.style.display = 'none';
      if (window.location.hash === '#admin') {
        history.replaceState(null, null, ' ');
      }
    }
  }

  if (window.location.hash === '#admin') {
    openAdminModal();
  }

  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#admin') {
      openAdminModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      openAdminModal();
    }
    if (e.key === 'Escape' && adminBackdrop && adminBackdrop.style.display === 'flex') {
      closeAdminModal();
    }
  });

  if (closeAdminBtn) closeAdminBtn.addEventListener('click', closeAdminModal);
  if (adminBackdrop) {
    adminBackdrop.addEventListener('click', (e) => {
      if (e.target === adminBackdrop) closeAdminModal();
    });
  }

  // CSV Drag & Drop and File Picker
  function parseCsvString(text) {
    const lines = text.split(/\r?\n/);
    const codes = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.toLowerCase().includes('promotion code') || trimmed.toLowerCase().includes('promo code')) {
        continue;
      }
      const code = trimmed.split(',')[0].trim().replace(/^["']|["']$/g, '');
      if (code) codes.push(code);
    }
    return Array.from(new Set(codes));
  }

  function handleFiles(files) {
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      parsedCsvCodes = parseCsvString(e.target.result);
      dropzoneLabel.innerHTML = `<strong>Selected file:</strong> ${file.name}`;
      detectedCount.style.display = 'inline-block';
      detectedCount.textContent = `✓ ${parsedCsvCodes.length} promo codes detected`;
    };
    reader.readAsText(file);
  }

  if (csvDropzone) {
    csvDropzone.addEventListener('click', () => {
      csvFileInput.click();
    });

    csvDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      csvDropzone.classList.add('dragover');
    });

    csvDropzone.addEventListener('dragleave', () => {
      csvDropzone.classList.remove('dragover');
    });

    csvDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      csvDropzone.classList.remove('dragover');
      handleFiles(e.dataTransfer.files);
    });

    csvFileInput.addEventListener('change', (e) => {
      handleFiles(e.target.files);
    });
  }

  if (manualPasteInput) {
    manualPasteInput.addEventListener('input', () => {
      const text = manualPasteInput.value.trim();
      if (text) {
        parsedCsvCodes = parseCsvString(text);
        detectedCount.style.display = 'inline-block';
        detectedCount.textContent = `✓ ${parsedCsvCodes.length} promo codes detected`;
      }
    });
  }

  // Admin Form Submit
  if (adminForm) {
    adminForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const secret = adminSecretInput.value.trim();
      const title = titleInput.value.trim();
      const packageName = packageInput.value.trim();
      const iconUrl = iconInput.value.trim() || 'assets/logo_notification.webp';

      if (parsedCsvCodes.length === 0 && manualPasteInput.value.trim()) {
        parsedCsvCodes = parseCsvString(manualPasteInput.value.trim());
      }

      if (parsedCsvCodes.length === 0) {
        adminStatus.className = 'admin-status-message error';
        adminStatus.style.display = 'block';
        adminStatus.textContent = 'Please choose a CSV file or paste promo codes.';
        return;
      }

      localStorage.setItem('awf_admin_secret', secret);

      submitGiveawayBtn.disabled = true;
      submitGiveawayBtn.innerHTML = `<div class="spinner"></div> Publishing Giveaway (${parsedCsvCodes.length} codes)...`;
      adminStatus.style.display = 'none';

      try {
        const response = await fetch(`${GIVEAWAY_ENDPOINT}?action=import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-secret': secret
          },
          body: JSON.stringify({
            action: 'import',
            adminSecret: secret,
            title: title,
            packageName: packageName,
            iconUrl: iconUrl,
            codesArray: parsedCsvCodes
          })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          adminStatus.className = 'admin-status-message success';
          adminStatus.style.display = 'block';
          adminStatus.textContent = `🎉 Success! Published '${title}' with ${result.totalCodes} promo codes.`;

          // Reset inputs
          titleInput.value = '';
          packageInput.value = '';
          iconInput.value = '';
          manualPasteInput.value = '';
          parsedCsvCodes = [];
          dropzoneLabel.innerHTML = `<strong>Click to browse</strong> or drag &amp; drop your Play Console CSV file here`;
          detectedCount.style.display = 'none';

          setTimeout(() => {
            closeAdminModal();
            loadGiveaways();
          }, 1500);
        } else {
          adminStatus.className = 'admin-status-message error';
          adminStatus.style.display = 'block';
          adminStatus.textContent = result.error || 'Failed to upload giveaway.';
        }
      } catch (err) {
        console.error('Admin import error:', err);
        adminStatus.className = 'admin-status-message error';
        adminStatus.style.display = 'block';
        adminStatus.textContent = 'Network error while publishing giveaway.';
      } finally {
        submitGiveawayBtn.disabled = false;
        submitGiveawayBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="m98-537 168-168q14-14 33-20t39-2l52 11q-54 64-85 116t-60 126L98-537Zm205 91q23-72 62.5-136T461-702q88-88 201-131.5T873-860q17 98-26 211T716-448q-55 55-120 95.5T459-289L303-446Zm332.5-97q33.5 0 56.5-23t23-56.5q0-33.5-23-56.5t-56.5-23q-33.5 0-56.5 23t-23 56.5q0 33.5 23 56.5t56.5 23ZM551-85l-64-147q74-29 126.5-60T730-377l10 52q4 20-2 39.5T718-252L551-85ZM162-318q35-35 85-35.5t85 34.5q35 35 35 85t-35 85q-25 25-83.5 43T87-74q14-103 32-161t43-83Z"/></svg>
          Publish Giveaway
        `;
      }
    });
  }

  /* ==========================================================================
     Admin Giveaways List & 1-Click Delete
     ========================================================================== */
  async function loadAdminGiveawaysList() {
    if (!adminListContainer) return;
    adminListContainer.innerHTML = `<p style="color: var(--muted); font-size: 0.88rem; margin: 0;">Loading active giveaways...</p>`;

    try {
      const response = await fetch(`${GIVEAWAY_ENDPOINT}?action=get`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      const giveaways = data.giveaways || (data.giveaway ? [data.giveaway] : []);

      if (!giveaways || giveaways.length === 0) {
        adminListContainer.innerHTML = `<p style="color: var(--muted); font-size: 0.88rem; margin: 0;">No active giveaways found in database.</p>`;
        return;
      }

      adminListContainer.innerHTML = '';
      giveaways.forEach(giveaway => {
        const item = document.createElement('div');
        item.className = 'admin-giveaway-item';
        item.id = `admin-item-${giveaway.id}`;

        item.innerHTML = `
          <div class="admin-giveaway-item-info">
            <img src="${giveaway.iconUrl || 'assets/logo_notification.webp'}" alt="${giveaway.title}" class="admin-giveaway-item-icon" />
            <div class="admin-giveaway-item-text">
              <span class="admin-giveaway-item-title">${giveaway.title}</span>
              <span class="admin-giveaway-item-meta">Remaining: <strong>${giveaway.remainingCodes}</strong> / ${giveaway.totalCodes}</span>
            </div>
          </div>
          <button class="btn-delete-giveaway" type="button" data-id="${giveaway.id}" data-title="${giveaway.title}">
            🗑️ Delete
          </button>
        `;

        const deleteBtn = item.querySelector('.btn-delete-giveaway');
        deleteBtn.addEventListener('click', async () => {
          const secret = adminSecretInput.value.trim();
          if (!secret) {
            alert('Please enter your Admin Secret Key above before deleting.');
            adminSecretInput.focus();
            return;
          }

          const confirmed = confirm(`Are you sure you want to delete the giveaway for "${giveaway.title}"?`);
          if (!confirmed) return;

          deleteBtn.disabled = true;
          deleteBtn.textContent = 'Deleting...';

          try {
            const delRes = await fetch(`${GIVEAWAY_ENDPOINT}?action=delete`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-admin-secret': secret
              },
              body: JSON.stringify({
                action: 'delete',
                giveawayId: giveaway.id,
                adminSecret: secret
              })
            });

            const delJson = await delRes.json();

            if (delRes.ok && delJson.success) {
              item.remove();
              loadGiveaways();
              if (adminListContainer.children.length === 0) {
                adminListContainer.innerHTML = `<p style="color: var(--muted); font-size: 0.88rem; margin: 0;">No active giveaways found in database.</p>`;
              }
            } else {
              alert(delJson.error || 'Failed to delete giveaway.');
              deleteBtn.disabled = false;
              deleteBtn.textContent = '🗑️ Delete';
            }
          } catch (e) {
            console.error('Delete error:', e);
            alert('Network error while deleting giveaway.');
            deleteBtn.disabled = false;
            deleteBtn.textContent = '🗑️ Delete';
          }
        });

        adminListContainer.appendChild(item);
      });
    } catch (e) {
      console.warn('Failed to load admin giveaways list:', e);
      adminListContainer.innerHTML = `<p style="color: #ef4444; font-size: 0.88rem; margin: 0;">Could not load active giveaways.</p>`;
    }
  }

  if (refreshAdminListBtn) {
    refreshAdminListBtn.addEventListener('click', loadAdminGiveawaysList);
  }

  loadGiveaways();
});
