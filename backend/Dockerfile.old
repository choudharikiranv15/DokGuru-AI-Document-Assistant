# ============================================================================
# DokGuru Voice - PRODUCTION IMAGE
# ============================================================================
# This builds on top of the base image with only lightweight app dependencies
# Build time: ~3-5 minutes (vs 30+ minutes without base image!)
#
# Prerequisites:
#   1. Build and push base image first (see Dockerfile.base)
#   2. Update the FROM line below with your Docker Hub username
#
# To build:
#   docker build -t dokguru-voice:latest .
#
# To run locally:
#   docker run -p 8080:8080 --env-file .env dokguru-voice:latest
# ============================================================================

# ============================================================================
# STAGE 1: Use pre-built base image
# ============================================================================
FROM choudharikiranv15/dokguru-base:latest

LABEL maintainer="DokGuru Team"
LABEL description="Production image for DokGuru Voice API"
LABEL version="1.0"

# ============================================================================
# SET WORKING DIRECTORY
# ============================================================================
WORKDIR /app

# ============================================================================
# INSTALL LIGHTWEIGHT APPLICATION DEPENDENCIES
# ============================================================================
# Copy only requirements file first (for layer caching)
COPY requirements-app.txt ./

# Install app-specific dependencies (fast - only ~30 packages)
RUN pip install --no-cache-dir -r requirements-app.txt

# ============================================================================
# COPY APPLICATION CODE
# ============================================================================
# Copy source code
COPY src/ ./src/
COPY app.py ./
COPY app_minimal.py ./
COPY config/ ./config/
COPY migrations/ ./migrations/

# Copy Gunicorn configuration
COPY gunicorn.conf.py ./

# Copy environment template (will be overridden by Render env vars)
COPY .env.example ./.env.example

# ============================================================================
# CREATE NECESSARY DIRECTORIES
# ============================================================================
RUN mkdir -p \
    data/pdfs \
    data/audio \
    data/chroma_db \
    templates \
    static

# Copy templates and static files (directories already exist in repo)
COPY templates/ ./templates/
COPY static/ ./static/

# ============================================================================
# SET PERMISSIONS
# ============================================================================
# Make data directories writable
RUN chmod -R 755 /app && \
    chmod -R 777 data/

# ============================================================================
# EXPOSE PORT
# ============================================================================
EXPOSE 8080

# ============================================================================
# ENVIRONMENT VARIABLES
# ============================================================================
ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PORT=8080

# ============================================================================
# HEALTH CHECK
# ============================================================================
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${PORT}/ || exit 1

# ============================================================================
# STARTUP COMMAND
# ============================================================================
# Use app_minimal.py for faster startup and lower memory usage (required for free tier)
# Render will override PORT via environment variable
CMD gunicorn --bind 0.0.0.0:$PORT app_minimal:app -c gunicorn.conf.py

# ============================================================================
# IMAGE INFO
# ============================================================================
# Log startup information
RUN echo "DokGuru Voice Production Image v1.0" && \
    echo "Base image: choudharikiranv15/dokguru-base:latest" && \
    echo "Build date: $(date)"
