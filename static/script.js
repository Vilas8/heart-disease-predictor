// ── Theme toggle ──────────────────────────────────────────────────────────
(function(){
  const t = document.querySelector('[data-theme-toggle]');
  const r = document.documentElement;
  let d = matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';
  r.setAttribute('data-theme', d);
  if (t) {
    updateToggleIcon(t, d);
    t.addEventListener('click', () => {
      d = d === 'dark' ? 'light' : 'dark';
      r.setAttribute('data-theme', d);
      updateToggleIcon(t, d);
    });
  }
  function updateToggleIcon(btn, theme) {
    btn.innerHTML = theme === 'dark'
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }
})();

// ── Slider live labels ────────────────────────────────────────────────────
const sliderMeta = {
  age:      { fmt: v => v },
  trestbps: { fmt: v => v },
  chol:     { fmt: v => v },
  thalach:  { fmt: v => v },
  oldpeak:  { fmt: v => parseFloat(v).toFixed(1) },
  ca:       { fmt: v => v },
};
Object.entries(sliderMeta).forEach(([id, meta]) => {
  const el  = document.getElementById(id);
  const val = document.getElementById(id + '-val');
  if (!el || !val) return;
  const update = () => { val.textContent = meta.fmt(el.value); };
  el.addEventListener('input', update);
  update();
});

// ── Pill Toggles ──────────────────────────────────────────────────────────
document.querySelectorAll('.pill-toggle').forEach(group => {
  const hiddenInput = document.getElementById(group.id.replace('-pills', ''));
  group.querySelectorAll('.pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      group.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (hiddenInput) hiddenInput.value = btn.dataset.val;
    });
  });
});

// ── Custom Select Dropdowns ───────────────────────────────────────────────
document.querySelectorAll('.custom-select').forEach(sel => {
  const trigger = sel.querySelector('.select-trigger');
  const label   = sel.querySelector('.select-label');
  const options = sel.querySelectorAll('.select-dropdown li');
  const hiddenId = sel.id.replace('-select', '');
  const hidden   = document.getElementById(hiddenId);

  trigger.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = sel.classList.contains('open');
    document.querySelectorAll('.custom-select.open').forEach(s => {
      s.classList.remove('open');
      s.querySelector('.select-trigger').setAttribute('aria-expanded', 'false');
    });
    if (!isOpen) {
      sel.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
    }
  });

  options.forEach(opt => {
    opt.addEventListener('click', () => {
      options.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      label.textContent = opt.textContent;
      if (hidden) hidden.value = opt.dataset.val;
      sel.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    });
  });
});

document.addEventListener('click', () => {
  document.querySelectorAll('.custom-select.open').forEach(s => {
    s.classList.remove('open');
    s.querySelector('.select-trigger').setAttribute('aria-expanded', 'false');
  });
});

// ── Form Submit ───────────────────────────────────────────────────────────
const form      = document.getElementById('predictorForm');
const btn       = document.getElementById('predictBtn');
const card      = document.getElementById('resultCard');
const icon      = document.getElementById('resultIcon');
const title     = document.getElementById('resultTitle');
const desc      = document.getElementById('resultDesc');
const safeBar   = document.getElementById('probSafeBar');
const riskBar   = document.getElementById('probRiskBar');
const safePct   = document.getElementById('probSafePct');
const riskPct   = document.getElementById('probRiskPct');
const mailBadge = document.getElementById('mailStatus');

form.addEventListener('submit', async e => {
  e.preventDefault();
  btn.disabled = true;
  btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> Analysing…';

  // Collect all form values including hidden inputs from pills/selects
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  try {
    const res  = await fetch('/predict', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Server error ${res.status}`);
    }

    const json = await res.json();

    if (json.error) throw new Error(json.error);

    const isRisk   = json.prediction === 1;
    // probability = [p_no_disease, p_disease]
    const safeProb = Math.round((json.probability[0] ?? 0) * 100);
    const riskProb = Math.round((json.probability[1] ?? 0) * 100);

    icon.textContent  = isRisk ? '🫀' : '💚';
    title.textContent = isRisk ? 'High Risk Detected' : 'Low Risk Detected';
    desc.textContent  = isRisk
      ? 'The model indicates elevated heart disease risk. Please consult a cardiologist for a full evaluation.'
      : 'The model indicates low heart disease risk. Maintain a healthy lifestyle and attend regular checkups.';
    title.style.color = isRisk ? 'var(--color-notification)' : 'var(--color-success)';

    card.classList.add('visible');

    requestAnimationFrame(() => {
      safeBar.style.width = safeProb + '%';
      riskBar.style.width = riskProb + '%';
      safePct.textContent = safeProb + '%';
      riskPct.textContent = riskProb + '%';
    });

    // Mail status
    if (json.email_status) {
      mailBadge.style.display = 'flex';
      mailBadge.className = 'mail-status ' + json.email_status;
      const msgs = {
        sent:    '✉️ Report sent to your inbox.',
        failed:  '⚠️ Could not send email — check server config.',
        skipped: 'ℹ️ No email provided — result not sent.',
      };
      mailBadge.textContent = msgs[json.email_status] || '';
    }

    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  } catch (err) {
    card.classList.add('visible');
    icon.textContent  = '⚠️';
    title.textContent = 'Something went wrong';
    title.style.color = 'var(--color-error)';
    desc.textContent  = err.message || 'Please try again.';
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> Predict Risk';
  }
});
