// Giveaways & Promo Code Generator Client Script
const GIVEAWAY_ENDPOINT = "https://giveawayapi-66490687416.europe-west1.run.app";

document.addEventListener('DOMContentLoaded', () => {
  // Public UI Elements
  const cardElement = document.getElementById('giveaway-card');
  const badgeElement = document.getElementById('giveaway-badge');
  const iconElement = document.getElementById('giveaway-icon');
  const titleElement = document.getElementById('giveaway-title');
  const authorLink = document.getElementById('giveaway-author-link');
  const inventoryNumber = document.getElementById('inventory-number');
  const claimButton = document.getElementById('btn-claim-promo');
  const claimArea = document.getElementById('claim-action-area');
  const codeRevealArea = document.getElementById('code-reveal-area');
  const promoCodeText = document.getElementById('promo-code-text');
  const copyCodeBtn = document.getElementById('btn-copy-code');
  const redeemDirectBtn = document.getElementById('btn-redeem-direct');

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

  let activeGiveawayData = null;
  let parsedCsvCodes = [];

  // Restore saved admin secret
  const savedSecret = localStorage.getItem('awf_admin_secret');
  if (savedSecret && adminSecretInput) {
    adminSecretInput.value = savedSecret;
  }

  /**
   * Render already claimed code
   */
  function showClaimedCode(code, redeemUrl) {
    if (!code) return;
    claimButton.style.display = 'none';
    codeRevealArea.style.display = 'flex';
    promoCodeText.textContent = code;

    const targetRedeemUrl = redeemUrl || `https://play.google.com/redeem?code=${encodeURIComponent(code)}`;
    redeemDirectBtn.href = targetRedeemUrl;

    copyCodeBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(code);
        const originalHtml = copyCodeBtn.innerHTML;
        copyCodeBtn.innerHTML = `
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg> Copied!
        `;
        copyCodeBtn.style.background = 'var(--accent)';
        copyCodeBtn.style.color = '#000000';

        setTimeout(() => {
          copyCodeBtn.innerHTML = originalHtml;
          copyCodeBtn.style.background = '';
          copyCodeBtn.style.color = '';
        }, 2000);
      } catch (err) {
        console.warn('Clipboard write failed:', err);
      }
    };
  }

  /**
   * Fetch active giveaway info
   */
  async function loadGiveaway() {
    try {
      const response = await fetch(`${GIVEAWAY_ENDPOINT}?action=get`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      if (!data.success || !data.giveaway) {
        setEmptyGiveawayState();
        return;
      }

      activeGiveawayData = data.giveaway;
      renderGiveaway(data.giveaway, data.isActive);

    } catch (err) {
      console.warn('Could not load active giveaway from Cloud Function:', err);
      setEmptyGiveawayState();
    }
  }

  /**
   * Render giveaway card content
   */
  function renderGiveaway(giveaway, isActive) {
    iconElement.src = giveaway.iconUrl || 'assets/logo_notification.webp';
    iconElement.alt = giveaway.title || 'Watch Face';
    titleElement.textContent = giveaway.title || 'Featured Watch Face';

    if (giveaway.playStoreUrl) {
      authorLink.href = giveaway.playStoreUrl;
    }

    inventoryNumber.textContent = giveaway.remainingCodes;

    // Check localStorage for previously claimed code
    const savedCode = localStorage.getItem(`awf_giveaway_code_${giveaway.packageName || 'active'}`);
    if (savedCode) {
      showClaimedCode(savedCode);
      return;
    }

    if (!isActive || giveaway.remainingCodes <= 0) {
      badgeElement.className = 'giveaway-badge-top out-of-codes';
      badgeElement.innerHTML = `<span class="live-dot" style="background:#ef4444"></span> Giveaway Ended`;
      claimButton.disabled = true;
      claimButton.textContent = 'All Promo Codes Claimed';
      return;
    }

    badgeElement.className = 'giveaway-badge-top';
    badgeElement.innerHTML = `<span class="live-dot"></span> Active Giveaway`;
    claimButton.disabled = false;
    claimButton.innerHTML = `
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 12 20 22 4 22 4 12"></polyline>
        <rect x="2" y="7" width="20" height="5"></rect>
        <line x1="12" y1="22" x2="12" y2="7"></line>
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
      </svg>
      Claim Free Promo Code
    `;
  }

  /**
   * Fallback state if no active giveaway
   */
  function setEmptyGiveawayState() {
    badgeElement.className = 'giveaway-badge-top out-of-codes';
    badgeElement.innerHTML = `No Active Giveaway`;
    titleElement.textContent = 'Stay Tuned for Next Giveaway';
    inventoryNumber.textContent = '0';
    claimButton.disabled = true;
    claimButton.textContent = 'Check Back Soon';
  }

  /**
   * Handle Claim Button Click
   */
  claimButton.addEventListener('click', async () => {
    if (claimButton.disabled) return;

    claimButton.disabled = true;
    claimButton.innerHTML = `<div class="spinner"></div> Generating Code...`;

    try {
      const response = await fetch(`${GIVEAWAY_ENDPOINT}?action=claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'claim' })
      });

      const data = await response.json();

      if (response.ok && data.success && data.code) {
        const pkg = activeGiveawayData?.packageName || 'active';
        localStorage.setItem(`awf_giveaway_code_${pkg}`, data.code);
        if (typeof data.remainingCodes === 'number') {
          inventoryNumber.textContent = data.remainingCodes;
        }
        showClaimedCode(data.code, data.redeemUrl);
      } else if (response.status === 429) {
        if (data.code) {
          const pkg = activeGiveawayData?.packageName || 'active';
          localStorage.setItem(`awf_giveaway_code_${pkg}`, data.code);
          showClaimedCode(data.code, data.redeemUrl);
        } else {
          alert(data.error || 'You have already claimed a promo code for this giveaway.');
          claimButton.disabled = false;
          claimButton.textContent = 'Claim Free Promo Code';
        }
      } else if (response.status === 410 || data.isOutOfCodes) {
        inventoryNumber.textContent = '0';
        badgeElement.className = 'giveaway-badge-top out-of-codes';
        badgeElement.innerHTML = `Out of Codes`;
        claimButton.disabled = true;
        claimButton.textContent = 'All Promo Codes Claimed';
      } else {
        alert(data.error || 'Could not claim promo code. Please try again in a moment.');
        claimButton.disabled = false;
        claimButton.textContent = 'Claim Free Promo Code';
      }

    } catch (err) {
      console.error('Error claiming promo code:', err);
      alert('Network error while claiming code. Please check your internet connection.');
      claimButton.disabled = false;
      claimButton.textContent = 'Claim Free Promo Code';
    }
  });

  /* ==========================================================================
     Admin Modal Functionality
     ========================================================================== */

  function openAdminModal() {
    if (adminBackdrop) {
      adminBackdrop.style.display = 'flex';
      adminStatus.style.display = 'none';
      if (titleInput) titleInput.focus();
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

  // Check URL hash on load
  if (window.location.hash === '#admin') {
    openAdminModal();
  }

  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#admin') {
      openAdminModal();
    }
  });

  // Keyboard shortcut Ctrl + Shift + A or Cmd + Shift + A
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      openAdminModal();
    }
    if (e.key === 'Escape' && adminBackdrop.style.display === 'flex') {
      closeAdminModal();
    }
  });

  if (closeAdminBtn) {
    closeAdminBtn.addEventListener('click', closeAdminModal);
  }

  if (adminBackdrop) {
    adminBackdrop.addEventListener('click', (e) => {
      if (e.target === adminBackdrop) {
        closeAdminModal();
      }
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

          setTimeout(() => {
            closeAdminModal();
            loadGiveaway();
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
          <span class="material-symbols-outlined">rocket_launch</span>
          Publish Giveaway
        `;
      }
    });
  }

  loadGiveaway();
});
