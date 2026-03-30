// ── Theme Toggle ──────────────────────────────────────────────────────────
(function () {
  const toggle = document.querySelector('[data-theme-toggle]');
  const root   = document.documentElement;
  let theme = root.getAttribute('data-theme') ||
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  root.setAttribute('data-theme', theme);

  const sunSVG  = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
  const moonSVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

  if (toggle) {
    toggle.innerHTML = theme === 'dark' ? sunSVG : moonSVG;
    toggle.addEventListener('click', () => {
      theme = theme === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', theme);
      toggle.innerHTML = theme === 'dark' ? sunSVG : moonSVG;
    });
  }
})();

// ── Slider Label Maps ─────────────────────────────────────────────────────
const labelMaps = {
  sex:     { 0: 'Female', 1: 'Male' },
  cp:      { 0: 'Typical Angina', 1: 'Atypical Angina', 2: 'Non-Anginal Pain', 3: 'Asymptomatic' },
  fbs:     { 0: 'No', 1: 'Yes' },
  restecg: { 0: 'Normal', 1: 'ST-T Abnormality', 2: 'LVH' },
  exang:   { 0: 'No', 1: 'Yes' },
  slope:   { 0: 'Upsloping', 1: 'Flat', 2: 'Downsloping' },
  thal:    { 0: 'Unknown', 1: 'Normal', 2: 'Fixed Defect', 3: 'Reversable Defect' }
};

// ── Live Slider Updates ───────────────────────────────────────────────────
document.querySelectorAll('input[type="range"]').forEach(input => {
  const valEl = document.getElementById(input.id + '-val');
  if (!valEl) return;

  const update = () => {
    const map = labelMaps[input.id];
    valEl.textContent = map ? (map[input.value] ?? input.value) : input.value;
    const pct = ((input.value - input.min) / (input.max - input.min)) * 100;
    input.style.background =
      `linear-gradient(to right, var(--color-primary) ${pct}%, var(--color-surface-offset) ${pct}%)`;
  };

  input.addEventListener('input', update);
  update();
});

// ── DOM refs ──────────────────────────────────────────────────────────────
const form        = document.getElementById('predictorForm');
const resultCard  = document.getElementById('resultCard');
const resultTitle = document.getElementById('resultTitle');
const resultDesc  = document.getElementById('resultDesc');
const resultIcon  = document.getElementById('resultIcon');
const probSafeBar = document.getElementById('probSafeBar');
const probRiskBar = document.getElementById('probRiskBar');
const probSafePct = document.getElementById('probSafePct');
const probRiskPct = document.getElementById('probRiskPct');
const predictBtn  = document.getElementById('predictBtn');
const mailStatus  = document.getElementById('mailStatus');

// ── Form Submit ───────────────────────────────────────────────────────────
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Email validation: if filled, must be valid format
  const emailInput = document.getElementById('userEmail');
  const emailVal   = emailInput ? emailInput.value.trim() : '';
  if (emailVal && !emailVal.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    emailInput.style.borderColor = 'var(--color-error)';
    emailInput.focus();
    return;
  }
  if (emailInput) emailInput.style.borderColor = '';

  predictBtn.disabled = true;
  predictBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Analysing…`;

  const data = {};
  form.querySelectorAll('input[type="range"]').forEach(inp => { data[inp.name] = inp.value; });
  if (emailVal) data.email = emailVal;

  try {
    const res  = await fetch('/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();

    if (json.error) { showError(json.error); return; }

    const hasDisease = json.prediction === 1;

    // Show result card
    resultCard.classList.add('visible');
    resultCard.style.borderColor = hasDisease ? 'var(--color-notification)' : 'var(--color-success)';
    resultIcon.textContent  = hasDisease ? '⚠️' : '✅';
    resultTitle.textContent = hasDisease ? 'High Risk Detected' : 'Low Risk — Looks Healthy!';
    resultTitle.style.color = hasDisease ? 'var(--color-notification)' : 'var(--color-success)';
    resultDesc.textContent  = hasDisease
      ? `The model estimates a ${json.probability_disease}% probability of heart disease. Please consult a cardiologist.`
      : `The model estimates only a ${json.probability_disease}% probability of heart disease. Keep up your healthy lifestyle!`;

    // Animate bars
    setTimeout(() => {
      probSafeBar.style.width = json.probability_no_disease + '%';
      probRiskBar.style.width = json.probability_disease + '%';
      probSafePct.textContent = json.probability_no_disease + '%';
      probRiskPct.textContent = json.probability_disease + '%';
    }, 100);

    // Mail status badge
    mailStatus.style.display = 'flex';
    mailStatus.className = 'mail-status';
    if (emailVal && json.mail_sent) {
      mailStatus.classList.add('sent');
      mailStatus.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4 20-7z"/></svg>
        Report sent to <strong>${emailVal}</strong>`;
    } else if (emailVal && !json.mail_sent) {
      mailStatus.classList.add('failed');
      mailStatus.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/></svg>
        Email failed to send. Check server SMTP config.`;
    } else {
      mailStatus.classList.add('skipped');
      mailStatus.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/>
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
        No email address provided — results shown above only.`;
    }

    resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (err) {
    showError('Network error. Is the server running?');
  } finally {
    predictBtn.disabled = false;
    predictBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> Predict Risk`;
  }
});

function showError(msg) {
  resultCard.classList.add('visible');
  resultIcon.textContent  = '❌';
  resultTitle.textContent = 'Error';
  resultTitle.style.color = 'var(--color-error)';
  resultDesc.textContent  = msg;
  resultCard.style.borderColor = 'var(--color-error)';
  if (mailStatus) mailStatus.style.display = 'none';
}

// Spinner keyframe (injected once)
const style = document.createElement('style');
style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(style);
