"""Train a RandomForest heart-disease model using pure numpy (no pandas)."""
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score
import pickle
import os

np.random.seed(42)
n = 1000

age      = np.random.randint(29, 77, n).astype(float)
sex      = np.random.randint(0, 2, n).astype(float)
cp       = np.random.randint(0, 4, n).astype(float)
trestbps = np.random.randint(94, 200, n).astype(float)
chol     = np.random.randint(126, 564, n).astype(float)
fbs      = np.random.randint(0, 2, n).astype(float)
restecg  = np.random.randint(0, 3, n).astype(float)
thalach  = np.random.randint(71, 202, n).astype(float)
exang    = np.random.randint(0, 2, n).astype(float)
oldpeak  = np.round(np.random.uniform(0, 6.2, n), 1)
slope    = np.random.randint(0, 3, n).astype(float)
ca       = np.random.randint(0, 4, n).astype(float)
thal     = np.random.randint(0, 4, n).astype(float)

# Simulate realistic target distribution
target = (
    (age > 55).astype(int) +
    (sex == 1).astype(int) +
    (cp == 0).astype(int) * 2 +
    (trestbps > 140).astype(int) +
    (chol > 240).astype(int) +
    (fbs == 1).astype(int) +
    (thalach < 130).astype(int) +
    (exang == 1).astype(int) * 2 +
    (oldpeak > 2).astype(int)
)
target = (target > 5).astype(int)

# Stack into 2D feature matrix (n x 13)
X = np.column_stack([
    age, sex, cp, trestbps, chol, fbs,
    restecg, thalach, exang, oldpeak, slope, ca, thal
])
y = target

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled  = scaler.transform(X_test)

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train_scaled, y_train)

acc = accuracy_score(y_test, model.predict(X_test_scaled))
print(f"Model Accuracy: {acc:.4f}")

os.makedirs('model', exist_ok=True)
with open('model/model.pkl', 'wb') as f:
    pickle.dump(model, f)
with open('model/scaler.pkl', 'wb') as f:
    pickle.dump(scaler, f)

print("Model and scaler saved to model/")
