# ============================================================================
# DokGuru Voice - Cloud Run Optimized Dockerfile (LEAN VERSION)
# ============================================================================
# Optimizations:
# - Multi-stage build to remove build dependencies
# - Only essential system packages in final image
# - Removed: Azure TTS, Anthropic, scikit-learn (~160MB saved)
# - Aggressive cleanup to reduce image size
# - Optimized layer caching for fast rebuilds
#
# Expected size: ~2.3GB (vs ~4GB before optimization)
# First build: 15-20 minutes | Rebuilds: 3-5 minutes
# ============================================================================

# ============================================================================
# STAGE 1: BUILDER (Heavy dependencies compiled here)
# ============================================================================
FROM python:3.11-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    git \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Install PyTorch CPU-only (largest dependency - do first for caching)
RUN pip install --no-cache-dir \
    torch==2.5.1 \
    --index-url https://download.pytorch.org/whl/cpu

# Install ML/AI packages (removed scikit-learn - not used)
RUN pip install --no-cache-dir \
    sentence-transformers==2.7.0 \
    transformers==4.57.1 \
    huggingface-hub==0.36.0 \
    tokenizers==0.22.1 \
    chromadb==1.0.20 \
    numpy==1.26.4 \
    pandas==2.3.3 \
    scipy==1.16.3

# Pre-download ML models (reduces cold start time)
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')"

# ============================================================================
# STAGE 2: RUNTIME (Final lean image)
# ============================================================================
FROM python:3.11-slim

LABEL maintainer="DokGuru Team"
LABEL description="Cloud Run optimized production image for DokGuru Voice"
LABEL version="2.0-lean"

# Install ONLY runtime dependencies (no build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    wget \
    ffmpeg \
    libsndfile1 \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-hin \
    tesseract-ocr-kan \
    default-jre \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder stage
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /root/.cache/huggingface /root/.cache/huggingface

# ============================================================================
# INSTALL LIGHTWEIGHT DEPENDENCIES (Optimized - removed unused packages)
# ============================================================================
RUN pip install --no-cache-dir \
    gTTS==2.5.4 \
    pydub==0.25.1 \
    soundfile==0.13.1 \
    edge-tts==6.1.9 \
    pdfplumber==0.10.3 \
    pypdf==3.17.4 \
    PyMuPDF==1.23.8 \
    tabula-py==2.10.0 \
    pytesseract==0.3.10 \
    Pillow==10.4.0 \
    groq==0.4.1 \
    openai==1.108.1 \
    google-generativeai==0.8.5 \
    SpeechRecognition==3.14.3

# Removed packages (saves ~160MB):
# - azure-cognitiveservices-speech (not used)
# - anthropic (not using Claude API)
# - scikit-learn (not used in this app)

# ============================================================================
# INSTALL PIPER TTS (Lightweight offline TTS)
# ============================================================================
RUN wget -O /tmp/piper.tar.gz https://github.com/rhasspy/piper/releases/download/v1.2.0/piper_amd64.tar.gz && \
    mkdir -p /tmp/piper && \
    tar -xzf /tmp/piper.tar.gz -C /tmp/piper && \
    find /tmp/piper -name "piper" -type f -exec mv {} /usr/local/bin/piper \; && \
    chmod +x /usr/local/bin/piper && \
    rm -rf /tmp/piper.tar.gz /tmp/piper

# Download Piper voice model (only English for now - saves space)
RUN mkdir -p /app/tts_models && \
    wget -O /app/tts_models/en_US-lessac-medium.onnx https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx && \
    wget -O /app/tts_models/en_US-lessac-medium.onnx.json https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json

# ============================================================================
# SET WORKING DIRECTORY
# ============================================================================
WORKDIR /app

# ============================================================================
# INSTALL APPLICATION DEPENDENCIES
# ============================================================================
# Copy requirements first (better layer caching)
COPY requirements-app.txt ./
RUN pip install --no-cache-dir -r requirements-app.txt

# ============================================================================
# COPY APPLICATION CODE
# ============================================================================
COPY src/ ./src/
COPY app.py ./
COPY app_minimal.py ./
COPY config/ ./config/
COPY migrations/ ./migrations/
COPY gunicorn.conf.py ./
COPY .env.example ./.env.example
COPY templates/ ./templates/
COPY static/ ./static/

# ============================================================================
# CREATE NECESSARY DIRECTORIES
# ============================================================================
RUN mkdir -p \
    data/pdfs \
    data/audio \
    data/chroma_db

# ============================================================================
# SET PERMISSIONS
# ============================================================================
RUN chmod -R 755 /app && \
    chmod -R 777 data/

# ============================================================================
# AGGRESSIVE CLEANUP
# ============================================================================
RUN pip cache purge && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /root/.cache/pip

# ============================================================================
# ENVIRONMENT VARIABLES
# ============================================================================
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV FLASK_ENV=production
ENV PORT=8080

# ============================================================================
# EXPOSE PORT
# ============================================================================
EXPOSE 8080

# ============================================================================
# STARTUP COMMAND
# ============================================================================
# Use main app.py directly for full functionality (streaming, file serving)
# app_minimal.py proxy doesn't support SSE streaming or proper file serving
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "app:app", "-c", "gunicorn.conf.py"]
