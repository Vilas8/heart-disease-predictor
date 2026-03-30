// ── Theme Toggle ──────────────────────────────────────────
(function () {
  const toggle = document.querySelector('[data-theme-toggle]');
  const root = document.documentElement;
  let theme = root.getAttribute('data-theme') ||
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  root.setAttribute('data-theme', theme);

  const sunSVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
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

// ── Slider Label Maps ─────────────────────────────────────
const labelMaps = {
  sex: { 0: 'Female', 1: 'Male' },
  cp: { 0: 'Typical Angina', 1: 'Atypical Angina', 2: 'Non-Anginal Pain', 3: 'Asymptomatic' },
  fbs: { 0: 'No', 1: 'Yes' },
  restecg: { 0: 'Normal', 1: 'ST-T Abnormality', 2: 'LVH' },
  exang: { 0: 'No', 1: 'Yes' },
  slope: { 0: 'Upsloping', 1: 'Flat', 2: 'Downsloping' },
  thal: { 0: 'Unknown', 1: 'Normal', 2: 'Fixed Defect', 3: 'Reversable Defect' }
};

// ── Live Slider Updates ───────────────────────────────────
document.querySelectorAll('input[type="range"]').forEach(input => {
  const valEl = document.getElementById(input.id + '-val');
  if (!valEl) return;

  const updateDisplay = () => {
    const map = labelMaps[input.id];
    valEl.textContent = map ? (map[input.value] || input.value) : input.value;
    // Update track fill
    const pct = ((input.value - input.min) / (input.max - input.min)) * 100;
    input.style.background =
      `linear-gradient(to right, var(--color-primary) ${pct}%, var(--color-surface-offset) ${pct}%)`;
  };

  input.addEventListener('input', updateDisplay);
  updateDisplay();
});

// ── Predict Form Submit ───────────────────────────────────
const form = document.getElementById('predictorForm');
const resultCard = document.getElementById('resultCard');
const resultTitle = document.getElementById('resultTitle');
const resultDesc = document.getElementById('resultDesc');
const resultIcon = document.getElementById('resultIcon');
const probSafeBar = document.getElementById('probSafeBar');
const probRiskBar = document.getElementById('probRiskBar');
const probSafePct = document.getElementById('probSafePct');
const probRiskPct = document.getElementById('probRiskPct');
const predictBtn = document.getElementById('predictBtn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  predictBtn.disabled = true;
  predictBtn.textContent = 'Analyzing…';

  const data = {};
  form.querySelectorAll('input[type="range"]').forEach(inp => {
    data[inp.name] = inp.value;
  });

  try {
    const res = await fetch('/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();

    if (json.error) {
      showError(json.error);
      return;
    }

    const hasDisease = json.prediction === 1;
    resultCard.classList.add('visible');
    resultCard.style.borderColor = hasDisease
      ? 'var(--color-notification)'
      : 'var(--color-success)';

    resultIcon.textContent = hasDisease ? '⚠️' : '✅';
    resultTitle.textContent = hasDisease ? 'High Risk Detected' : 'Low Risk — Looks Healthy!';
    resultTitle.style.color = hasDisease ? 'var(--color-notification)' : 'var(--color-success)';
    resultDesc.textContent = hasDisease
      ? `The model estimates a ${json.probability_disease}% probability of heart disease. Please consult a cardiologist for proper diagnosis.`
      : `The model estimates only a ${json.probability_disease}% probability of heart disease. Maintain a healthy lifestyle!`;

    // Animate bars
    setTimeout(() => {
      probSafeBar.style.width = json.probability_no_disease + '%';
      probRiskBar.style.width = json.probability_disease + '%';
      probSafePct.textContent = json.probability_no_disease + '%';
      probRiskPct.textContent = json.probability_disease + '%';
    }, 100);

    resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (err) {
    showError('Network error. Please try again.');
  } finally {
    predictBtn.disabled = false;
    predictBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> Predict Risk';
  }
});

function showError(msg) {
  resultCard.classList.add('visible');
  resultIcon.textContent = '❌';
  resultTitle.textContent = 'Error';
  resultTitle.style.color = 'var(--color-error)';
  resultDesc.textContent = msg;
  resultCard.style.borderColor = 'var(--color-error)';
}
