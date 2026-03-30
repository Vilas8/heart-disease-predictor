# Use official Python 3.11 slim image — guarantees cp311 wheels, no source compilation
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies needed for scikit-learn / numpy
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (layer caching)
COPY requirements.txt .

# Upgrade pip and install all dependencies from pre-built wheels
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Train the model at build time so it's ready at startup
RUN python train_model.py

# Expose port
EXPOSE 10000

# Start gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:10000", "--workers", "2", "--timeout", "120", "app:app"]
