# config/config.py
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # API Keys - Primary (Pro Tier)
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")  # Google Gemini

    # API Keys - Pro Tier LLMs
    CEREBRAS_API_KEY = os.getenv("CEREBRAS_API_KEY")  # Ultra-fast, 1M tokens/day free
    DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")  # No rate limits, very cheap
    MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")    # High quality European

    # API Keys - Free Tier LLMs (Fallbacks)
    SAMBANOVA_API_KEY = os.getenv("SAMBANOVA_API_KEY")
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
    COHERE_API_KEY = os.getenv("COHERE_API_KEY")       # Trial tier available
    HUGGINGFACE_API_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN")

    # Supabase Configuration (for pgvector persistent storage)
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")

    # Model Configuration
    EMBEDDING_MODEL = "all-MiniLM-L6-v2"
    LLM_MODEL = "llama-3.1-8b-instant"  # Groq model
    GEMINI_VISION_MODEL = "models/gemini-2.0-flash"  # Gemini Vision for image understanding

    # Vector Database
    VECTOR_DB_PATH = "./data/chroma_db"
    COLLECTION_NAME = "pdf_documents"

    # PDF Processing
    CHUNK_SIZE = 1000
    CHUNK_OVERLAP = 200
    MAX_IMAGE_SIZE = (800, 600)

    # Retrieval
    TOP_K_RESULTS = 5
    SIMILARITY_THRESHOLD = 0.7

    # Paths
    PDF_UPLOAD_DIR = "./data/pdfs"
    UPLOAD_FOLDER = "./data/pdfs"  # Alias for PDF_UPLOAD_DIR (used by image extraction)
    PROCESSED_DATA_DIR = "./data/processed"

    # Redis Configuration (Dual Support: Upstash + Local)
    # Upstash (Production - Serverless)
    UPSTASH_REDIS_REST_URL = os.getenv("UPSTASH_REDIS_REST_URL")
    UPSTASH_REDIS_REST_TOKEN = os.getenv("UPSTASH_REDIS_REST_TOKEN")

    # Local Redis (Development - Optional)
    REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
    REDIS_DB = int(os.getenv("REDIS_DB", 0))
    REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)

    # Cache Settings
    QUERY_CACHE_TTL = int(os.getenv("QUERY_CACHE_TTL", 3600))  # 1 hour
    SESSION_TTL = int(os.getenv("SESSION_TTL", 86400))  # 24 hours
    RATE_LIMIT_MAX = int(os.getenv("RATE_LIMIT_MAX", 100))  # requests per window
    RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", 3600))  # 1 hour

    # TTS (Text-to-Speech) Settings
    TTS_SPEED_MULTIPLIER = float(os.getenv("TTS_SPEED_MULTIPLIER", 1.25))  # 1.0 = normal, 1.25 = 25% faster, 1.5 = 50% faster
