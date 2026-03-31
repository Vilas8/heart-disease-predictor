from flask import Flask, render_template, request, jsonify
from flask_mail import Mail, Message
import pickle
import numpy as np
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# SECRET_KEY is required by Flask-Mail session handling
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'cardiopredict-secret-key-change-in-prod')

# ── Flask-Mail Configuration ─────────────────────────────────────────────
MAIL_USERNAME = os.environ.get('MAIL_USERNAME', '')
app.config['MAIL_SERVER']         = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT']           = int(os.environ.get('MAIL_PORT', 587))
app.config['MAIL_USE_TLS']        = os.environ.get('MAIL_USE_TLS', 'true').lower() == 'true'
app.config['MAIL_USE_SSL']        = os.environ.get('MAIL_USE_SSL', 'false').lower() == 'true'
app.config['MAIL_USERNAME']       = MAIL_USERNAME
app.config['MAIL_PASSWORD']       = os.environ.get('MAIL_PASSWORD', '')
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER', MAIL_USERNAME)

mail = Mail(app)

# ── ML Model Loading ───────────────────────────────────────────────
MODEL_PATH  = os.path.join('model', 'model.pkl')
SCALER_PATH = os.path.join('model', 'scaler.pkl')

model  = None
scaler = None

def load_artifacts():
    global model, scaler
    if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
        with open(MODEL_PATH, 'rb') as f:
            model = pickle.load(f)
        with open(SCALER_PATH, 'rb') as f:
            scaler = pickle.load(f)
        print('Model and scaler loaded successfully.')
    else:
        print('WARNING: model files not found. Run train_model.py first.')

load_artifacts()

# ── Feature label maps (for email summary) ──────────────────────────────
FEATURE_LABELS = {
    'age':      ('Age',                         lambda v: f'{int(float(v))} yrs'),
    'sex':      ('Gender',                      lambda v: 'Male' if int(float(v)) == 1 else 'Female'),
    'cp':       ('Chest Pain Type',             lambda v: ['Typical Angina','Atypical Angina','Non-Anginal Pain','Asymptomatic'][int(float(v))]),
    'trestbps': ('Resting BP',                  lambda v: f'{int(float(v))} mmHg'),
    'chol':     ('Cholesterol',                 lambda v: f'{int(float(v))} mg/dl'),
    'fbs':      ('Fasting BS > 120 mg/dl',      lambda v: 'Yes' if int(float(v)) == 1 else 'No'),
    'restecg':  ('Resting ECG',                 lambda v: ['Normal','ST-T Abnormality','LVH'][int(float(v))]),
    'thalach':  ('Max Heart Rate',              lambda v: f'{int(float(v))} bpm'),
    'exang':    ('Exercise Induced Angina',     lambda v: 'Yes' if int(float(v)) == 1 else 'No'),
    'oldpeak':  ('ST Depression (Oldpeak)',     lambda v: float(v)),
    'slope':    ('ST Slope',                    lambda v: ['Upsloping','Flat','Downsloping'][int(float(v))]),
    'ca':       ('Major Vessels (Fluoroscopy)', lambda v: int(float(v))),
    'thal':     ('Thalassemia',                 lambda v: ['Unknown','Normal','Fixed Defect','Reversable Defect'][int(float(v))]),
}

# ── Email HTML builder ─────────────────────────────────────────────────
def build_email_html(prediction, prob_disease, prob_safe, data):
    status_color = '#dd6974' if prediction == 1 else '#6daa45'
    status_text  = 'HIGH RISK — Heart Disease Likely' if prediction == 1 else 'LOW RISK — Looks Healthy'
    status_emoji = '\u26a0\ufe0f' if prediction == 1 else '\u2705'
    advice = (
        'The model detected elevated risk indicators. Please consult a cardiologist for a thorough evaluation.'
        if prediction == 1 else
        'The model found low risk indicators. Keep up a healthy lifestyle and schedule regular check-ups.'
    )

    # Build rows using string concatenation to avoid f-string brace conflicts with HTML
    rows = ''
    for key, (label, fmt) in FEATURE_LABELS.items():
        value = fmt(data.get(key, 0))
        rows += (
            '<tr>'
            '<td style="padding:6px 12px;color:#7a7974;font-size:13px;">' + label + '</td>'
            '<td style="padding:6px 12px;font-weight:600;font-size:13px;">' + str(value) + '</td>'
            '</tr>'
        )

    safe_bar_width  = str(prob_safe) + '%'
    risk_bar_width  = str(prob_disease) + '%'
    safe_pct_str    = str(prob_safe) + '%'
    disease_pct_str = str(prob_disease) + '%'

    html = (
        '<!DOCTYPE html><html lang="en">'
        '<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>'
        '<body style="margin:0;padding:0;background:#f7f6f2;font-family:\'Inter\',Arial,sans-serif;">'
        '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f6f2;padding:32px 0;">'
        '<tr><td align="center">'
        '<table width="580" cellpadding="0" cellspacing="0"'
        ' style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">'
        '<tr><td style="background:#1c1b19;padding:24px 32px;">'
        '<span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.02em;">\u2764\ufe0f CardioPredict</span>'
        '</td></tr>'
        '<tr><td style="background:' + status_color + ';padding:20px 32px;text-align:center;">'
        '<p style="margin:0;color:#fff;font-size:22px;font-weight:700;">' + status_emoji + ' ' + status_text + '</p>'
        '</td></tr>'
        '<tr><td style="padding:28px 32px 16px;">'
        '<p style="margin:0 0 16px;font-size:14px;color:#7a7974;">Prediction Probabilities</p>'
        '<table width="100%" cellpadding="0" cellspacing="0">'
        '<tr>'
        '<td style="font-size:13px;color:#28251d;padding-bottom:6px;">No Heart Disease</td>'
        '<td style="font-size:13px;font-weight:700;color:#437a22;text-align:right;padding-bottom:6px;">' + safe_pct_str + '</td>'
        '</tr>'
        '<tr><td colspan="2"><div style="background:#edeae5;border-radius:4px;height:8px;overflow:hidden;">'
        '<div style="background:#6daa45;height:8px;width:' + safe_bar_width + ';border-radius:4px;"></div></div></td></tr>'
        '<tr><td colspan="2" style="height:10px;"></td></tr>'
        '<tr>'
        '<td style="font-size:13px;color:#28251d;padding-bottom:6px;">Heart Disease</td>'
        '<td style="font-size:13px;font-weight:700;color:#a13544;text-align:right;padding-bottom:6px;">' + disease_pct_str + '</td>'
        '</tr>'
        '<tr><td colspan="2"><div style="background:#edeae5;border-radius:4px;height:8px;overflow:hidden;">'
        '<div style="background:#dd6974;height:8px;width:' + risk_bar_width + ';border-radius:4px;"></div></div></td></tr>'
        '</table>'
        '</td></tr>'
        '<tr><td style="padding:0 32px 20px;">'
        '<p style="margin:0;font-size:14px;color:#28251d;line-height:1.6;background:#f7f6f2;border-radius:8px;padding:14px 16px;">' + advice + '</p>'
        '</td></tr>'
        '<tr><td style="padding:0 32px 28px;">'
        '<p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#28251d;">Your Input Parameters</p>'
        '<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dcd9d5;border-radius:8px;overflow:hidden;">'
        '<thead><tr style="background:#f3f0ec;">'
        '<th style="padding:8px 12px;text-align:left;font-size:12px;color:#7a7974;font-weight:600;">PARAMETER</th>'
        '<th style="padding:8px 12px;text-align:left;font-size:12px;color:#7a7974;font-weight:600;">VALUE</th>'
        '</tr></thead>'
        '<tbody>' + rows + '</tbody>'
        '</table>'
        '</td></tr>'
        '<tr><td style="background:#f7f6f2;padding:16px 32px;border-top:1px solid #dcd9d5;">'
        '<p style="margin:0;font-size:11px;color:#bab9b4;text-align:center;line-height:1.6;">'
        '\u26a0\ufe0f This is an educational AI tool and does not constitute medical advice.<br>'
        'Always consult a qualified healthcare professional for clinical decisions.'
        '</p>'
        '</td></tr>'
        '</table>'
        '</td></tr>'
        '</table>'
        '</body></html>'
    )
    return html

# ── Health check endpoint ──────────────────────────────────────────────────
@app.route('/health')
def health():
    return jsonify({'status': 'ok', 'model_loaded': model is not None}), 200

# ── Routes ────────────────────────────────────────────────────────
@app.route('/')
def index():
    return render_template('index.html')


@app.route('/predict', methods=['POST'])
def predict():
    if model is None or scaler is None:
        return jsonify({'error': 'Model not loaded. Run train_model.py first.'}), 500

    try:
        data = request.get_json(force=True)

        features = [
            float(data['age']),      float(data['sex']),     float(data['cp']),
            float(data['trestbps']), float(data['chol']),    float(data['fbs']),
            float(data['restecg']),  float(data['thalach']), float(data['exang']),
            float(data['oldpeak']),  float(data['slope']),   float(data['ca']),
            float(data['thal'])
        ]

        features_scaled = scaler.transform(np.array([features]))
        prediction      = int(model.predict(features_scaled)[0])
        probability     = model.predict_proba(features_scaled)[0].tolist()  # [p_no_disease, p_disease]

        # ── Email ──────────────────────────────────────────────────────
        user_email   = data.get('email', '').strip()
        email_status = 'skipped'

        if user_email and app.config.get('MAIL_USERNAME'):
            try:
                prob_safe    = round(probability[0] * 100, 1)
                prob_disease = round(probability[1] * 100, 1)
                subject  = '\u26a0\ufe0f CardioPredict \u2014 High Risk Detected' if prediction == 1 else '\u2705 CardioPredict \u2014 Low Risk Result'
                html_body = build_email_html(prediction, prob_disease, prob_safe, data)
                msg = Message(subject=subject, recipients=[user_email], html=html_body)
                mail.send(msg)
                email_status = 'sent'
            except Exception as e:
                print(f'Mail send failed: {e}')
                email_status = 'failed'

        return jsonify({
            'prediction':   prediction,
            'probability':  probability,   # [p_no_disease, p_disease]  ← JS reads [0] and [1]
            'email_status': email_status,
        })

    except KeyError as e:
        return jsonify({'error': f'Missing field: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port, debug=False)
