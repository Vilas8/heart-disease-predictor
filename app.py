from flask import Flask, render_template, request, jsonify
import pickle
import numpy as np
import os

app = Flask(__name__)

# Load model and scaler
MODEL_PATH = os.path.join('model', 'model.pkl')
SCALER_PATH = os.path.join('model', 'scaler.pkl')

model = None
scaler = None

def load_artifacts():
    global model, scaler
    if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
        with open(MODEL_PATH, 'rb') as f:
            model = pickle.load(f)
        with open(SCALER_PATH, 'rb') as f:
            scaler = pickle.load(f)
        print("Model and scaler loaded successfully.")
    else:
        print("WARNING: model/model.pkl or model/scaler.pkl not found.")
        print("Run train_model.py first to generate them.")

load_artifacts()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    if model is None or scaler is None:
        return jsonify({'error': 'Model not loaded. Run train_model.py first.'}), 500

    try:
        data = request.get_json()
        features = [
            float(data['age']),
            float(data['sex']),
            float(data['cp']),
            float(data['trestbps']),
            float(data['chol']),
            float(data['fbs']),
            float(data['restecg']),
            float(data['thalach']),
            float(data['exang']),
            float(data['oldpeak']),
            float(data['slope']),
            float(data['ca']),
            float(data['thal'])
        ]
        features_array = np.array([features])
        features_scaled = scaler.transform(features_array)
        prediction = model.predict(features_scaled)[0]
        probability = model.predict_proba(features_scaled)[0]

        return jsonify({
            'prediction': int(prediction),
            'probability_no_disease': round(float(probability[0]) * 100, 1),
            'probability_disease': round(float(probability[1]) * 100, 1)
        })
    except KeyError as e:
        return jsonify({'error': f'Missing field: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
