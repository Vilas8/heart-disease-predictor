# 🫀 Heart Disease Predictor

A Flask-based Machine Learning web app that predicts heart disease risk using a Random Forest model trained on Cleveland Heart Disease dataset features.

## ✨ Features

- 🎚️ **Interactive sliders** for all 13 clinical input features
- 🤖 **Random Forest ML model** for predictions
- 📊 **Probability bars** showing risk vs. no-risk likelihood
- 🌙 **Dark/Light mode** toggle
- ⚡ **Ready to deploy** on Render or Vercel

## 🧪 Input Features

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

# 4. Train the model (creates model/model.pkl & model/scaler.pkl)
python train_model.py

# 5. Run the app
python app.py
# Visit: http://localhost:5000
```

## ☁️ Deploy on Render

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo
4. Render auto-detects `render.yaml`
5. Build command: `pip install -r requirements.txt && python train_model.py`
6. Start command: `gunicorn app:app`
7. Deploy! 🎉

## ☁️ Deploy on Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import the repo — `vercel.json` is pre-configured
4. **Note:** For full ML support on Vercel, add a build step or use Render instead (recommended for Python/ML)

## ⚠️ Disclaimer

This app is for **educational purposes only**. Always consult a licensed medical professional for health decisions.

---
Built with ❤️ using Flask + scikit-learn by [Vilas Kumar N](https://github.com/Vilas8)
