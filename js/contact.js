// Contact Page Client Script
const CONTACT_ENDPOINT = "https://contactapi-66490687416.europe-west1.run.app";

document.addEventListener('DOMContentLoaded', () => {
  const contactForm = document.getElementById('contact-form');
  const nameInput = document.getElementById('contact-name');
  const emailInput = document.getElementById('contact-email');
  const topicSelect = document.getElementById('contact-topic');
  const watchfaceGroup = document.getElementById('contact-watchface-group');
  const watchfaceSelect = document.getElementById('contact-watchface');
  const messageInput = document.getElementById('contact-message');
  const statusMessage = document.getElementById('contact-status');
  const submitBtn = document.getElementById('btn-submit-contact');
  const honeypotInput = document.getElementById('website-hp');

  // Populate Watch Faces Dropdown from portfolio.js
  if (typeof portfolio !== 'undefined' && Array.isArray(portfolio) && watchfaceSelect) {
    const sorted = [...portfolio].sort((a, b) => a.appName.localeCompare(b.appName));
    sorted.forEach(wf => {
      const opt = document.createElement('option');
      opt.value = wf.appName;
      opt.textContent = `${wf.appName} (${wf.packageName})`;
      watchfaceSelect.appendChild(opt);
    });
  }

  // Pre-select topic or watchface if query params exist (e.g. ?topic=bogo or ?watchface=Aurora)
  const urlParams = new URLSearchParams(window.location.search);
  const paramTopic = urlParams.get('topic');
  const paramWf = urlParams.get('watchface') || urlParams.get('app');

  if (paramTopic && topicSelect) {
    const matchingOption = Array.from(topicSelect.options).find(o => o.value.toLowerCase() === paramTopic.toLowerCase());
    if (matchingOption) topicSelect.value = matchingOption.value;
  }

  if (paramWf && watchfaceSelect) {
    const matchingWf = Array.from(watchfaceSelect.options).find(o => o.value.toLowerCase().includes(paramWf.toLowerCase()));
    if (matchingWf) {
      watchfaceSelect.value = matchingWf.value;
      if (watchfaceGroup) watchfaceGroup.style.display = 'flex';
    }
  }

  // Show/hide watch face selector based on topic
  if (topicSelect && watchfaceGroup) {
    topicSelect.addEventListener('change', () => {
      const val = topicSelect.value;
      if (val === 'Technical Issue / Bug' || val === 'BOGO Promotion Claim' || val === 'Feature Request / Feedback') {
        watchfaceGroup.style.display = 'flex';
      } else {
        watchfaceGroup.style.display = 'flex'; // Keep accessible
      }
    });
  }

  // Form Submit Handler
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const topic = topicSelect.value;
      const watchFace = watchfaceSelect ? watchfaceSelect.value : '';
      const message = messageInput.value.trim();
      const hp = honeypotInput ? honeypotInput.value : '';

      if (!name || !email || !message) {
        showStatus('Please fill in all required fields.', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<div class="spinner" style="width: 18px; height: 18px; border: 2px solid rgba(0,0,0,0.2); border-top-color: #000; border-radius: 50%; animation: spin-loader 0.8s linear infinite;"></div> Sending Message...`;
      statusMessage.style.display = 'none';

      try {
        const response = await fetch(CONTACT_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'contact',
            name: name,
            email: email,
            topic: topic,
            watchFace: watchFace,
            message: message,
            website_hp: hp
          })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          showStatus(result.message || '🎉 Thank you! Your message has been sent successfully. We will get back to you soon.', 'success');
          contactForm.reset();
        } else {
          showStatus(result.error || 'Failed to send message. Please try emailing support@amoledwatchfaces.com directly.', 'error');
        }
      } catch (err) {
        console.error('Contact submission error:', err);
        showStatus('Network error while sending your message. Please email support@amoledwatchfaces.com directly.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor">
            <path d="M120-160v-640l760 320-760 320Zm80-120 474-200-474-200v140l240 60-240 60v140Zm0 0v-400 400Z"/>
          </svg>
          Send Message
        `;
      }
    });
  }

  function showStatus(msg, type) {
    statusMessage.className = `contact-status-message ${type}`;
    statusMessage.textContent = msg;
    statusMessage.style.display = 'block';
    statusMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
});
