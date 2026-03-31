# gunicorn.conf.py — applied automatically by gunicorn if present
import os

# Bind to the PORT Render injects (defaults to 10000)
bind = f"0.0.0.0:{os.environ.get('PORT', '10000')}"

# Free tier has 512MB RAM — 1 worker is safe
workers = 1

# Threads allow concurrent requests without multiple processes
threads = 4

# Generous timeout for cold-start on free-tier (300s = 5 min)
timeout = 300

# keepalive — how long to wait for requests on a Keep-Alive connection
keepalive = 5

# Preload the app so workers share memory (faster startup, lower RAM)
preload_app = True

# Log to stdout so Render's dashboard shows logs
accesslog = "-"
errorlog  = "-"
loglevel  = "info"
