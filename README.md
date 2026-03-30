# 🫐 Heart Disease Predictor

A Flask-based Machine Learning web app that predicts heart disease risk using a Random Forest model trained on Cleveland Heart Disease dataset features — with **email notification support** to deliver results directly to the user's inbox.

## ✨ Features

- 🎚️ **Interactive sliders** for all 13 clinical input features
- 🤖 **Random Forest ML model** for predictions
- 📊 **Probability bars** showing risk vs. no-risk likelihood
- 📧 **Email results** — user enters their email and gets a full HTML report
- 🌙 **Dark/Light mode** toggle
- ⚡ **Ready to deploy** on Render or Vercel

---

## 🪹 Input Features

| Feature | Description | Range |
|---|---|---|
| Age | Patient age in years | 29–77 |
| Sex | 0 = Female, 1 = Male | 0–1 |
| CP | Chest pain type (0–3) | 0–3 |
| Trestbps | Resting blood pressure (mmHg) | 94–200 |
| Chol | Serum cholesterol (mg/dl) | 126–564 |
| Fbs | Fasting blood sugar > 120 mg/dl | 0–1 |
| RestECG | Resting ECG results | 0–2 |
| Thalach | Max heart rate achieved | 71–202 |
| Exang | Exercise induced angina | 0–1 |
| Oldpeak | ST depression induced by exercise | 0–6.2 |
| Slope | Slope of peak exercise ST segment | 0–2 |
| Ca | Major vessels coloured by fluoroscopy | 0–3 |
| Thal | Thalassemia type | 0–3 |

---

## 📧 Email Notification Setup

The app uses **Flask-Mail** to send a styled HTML report to the user's email after prediction. Email is **optional** — users can leave the field blank to skip it.

### Step 1 — Generate a Gmail App Password

> If you use another SMTP provider (Outlook, SendGrid, etc.) skip to Step 2.

1. Go to [myaccount.google.com](https://myaccount.google.com) → **Security**
2. Enable **2-Step Verification** (required)
3. Search for **"App Passwords"** and open it
4. Select App: `Mail` / Device: `Other (Custom name)` → name it `CardioPredict`
5. Click **Generate** → copy the **16-character password**

### Step 2 — Set Environment Variables

**For local development** — copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Then edit `.env`:

```env
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USE_SSL=false
MAIL_USERNAME=your-gmail@gmail.com
MAIL_PASSWORD=abcd efgh ijkl mnop   # <-- 16-char App Password (spaces OK)
MAIL_DEFAULT_SENDER=your-gmail@gmail.com
```

**For Render deployment** — add these in your service's **Environment** tab:

| Key | Value |
|---|---|
| `MAIL_SERVER` | `smtp.gmail.com` |
| `MAIL_PORT` | `587` |
| `MAIL_USE_TLS` | `true` |
| `MAIL_USE_SSL` | `false` |
| `MAIL_USERNAME` | `your-gmail@gmail.com` |
| `MAIL_PASSWORD` | `your-16-char-app-password` |
| `MAIL_DEFAULT_SENDER` | `your-gmail@gmail.com` |

**For Vercel deployment** — add the same keys in **Project Settings → Environment Variables**.

### Other SMTP Providers

| Provider | MAIL_SERVER | PORT | TLS | Notes |
|---|---|---|---|---|
| Gmail | `smtp.gmail.com` | 587 | true | Use App Password |
| Outlook/Hotmail | `smtp-mail.outlook.com` | 587 | true | Regular password |
| Yahoo | `smtp.mail.yahoo.com` | 465 | false (SSL=true) | App Password |
| SendGrid | `smtp.sendgrid.net` | 587 | true | `MAIL_USERNAME=apikey`, password = API key |
| Mailgun | `smtp.mailgun.org` | 587 | true | SMTP credentials from Mailgun dashboard |

> **Note:** If `MAIL_USERNAME` is not set, the app silently skips sending emails — it will not crash.

---

## 🚀 Local Development

```bash
# 1. Clone the repo
git clone https://github.com/Vilas8/heart-disease-predictor.git
cd heart-disease-predictor

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure email (optional)
cp .env.example .env
# Edit .env with your SMTP credentials

# 5. Train the model (creates model/model.pkl & model/scaler.pkl)
python train_model.py

# 6. Run the app
python app.py
# Visit: http://localhost:5000
```

---

## ☁️ Deploy on Render (Recommended)

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your repo — Render auto-reads `render.yaml`
4. Under **Environment**, add your `MAIL_*` variables (see above)
5. **Build command:** `pip install -r requirements.txt && python train_model.py`
6. **Start command:** `gunicorn app:app`
7. Deploy! 🎉

## ☁️ Deploy on Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → import repo
3. Under **Environment Variables**, add your `MAIL_*` variables
4. `vercel.json` is pre-configured — just deploy

> **Tip:** For heavy ML workloads, Render is preferred. Vercel serverless has a 250MB layer limit.

---

## ⚠️ Disclaimer

This app is for **educational purposes only**. Always consult a licensed medical professional for health decisions.

---
Built with ❤️ using Flask + scikit-learn by [Vilas Kumar N](https://github.com/Vilas8)
