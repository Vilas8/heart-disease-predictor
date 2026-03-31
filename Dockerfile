# Locked to Python 3.11 — guarantees pre-built cp311 wheels for all packages
FROM python:3.11-slim

WORKDIR /app

# Minimal build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for Docker layer caching
COPY requirements.txt .

# Upgrade pip, then install — prefer binary wheels, never compile from source
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --prefer-binary -r requirements.txt

# Copy application source
COPY . .

# Train model at build time so .pkl files exist before gunicorn starts
RUN python train_model.py

# Render free tier injects PORT=10000 — expose it
EXPOSE 10000

# CRITICAL: Use shell form (not exec form) so $PORT is expanded at runtime
# --timeout 300 gives gunicorn 5 min to boot on slow free-tier instances
# --preload loads the Flask app before forking workers (faster boot)
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-10000} --workers 1 --threads 4 --timeout 300 --preload app:app"]
