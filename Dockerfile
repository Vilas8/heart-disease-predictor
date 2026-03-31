# Locked to Python 3.11 — guarantees pre-built cp311 wheels for all packages
FROM python:3.11-slim

WORKDIR /app

# Minimal build tools (only needed for any C extensions that still require it)
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

# Use 1 worker (free tier has 512MB RAM — 2 workers causes OOM/timeout)
# $PORT is injected by Render at runtime (defaults to 10000)
CMD gunicorn --bind 0.0.0.0:${PORT:-10000} --workers 1 --threads 2 --timeout 120 app:app
