# src/tts_handler.py - Text-to-Speech using Piper TTS
"""
Piper TTS Handler - Fast, offline, neural text-to-speech

Supported Languages:
- English (en): en_US-lessac-medium voice
- Hindi (hi): hi_IN-pratham-medium voice
- Kannada: NOT SUPPORTED (use Google Cloud TTS or EdgeTTS)

Piper is ~10x faster than cloud TTS and works completely offline.
Uses the piper-tts Python library for cross-platform compatibility.
"""
import os
import wave
import hashlib
import logging
from typing import Dict, Any, Optional, Generator

logger = logging.getLogger(__name__)

# Audio compression library
try:
    from pydub import AudioSegment
    PYDUB_AVAILABLE = True
except ImportError:
    PYDUB_AVAILABLE = False
    logger.warning("pydub not available - WAV files will not be compressed to MP3")

# Check if piper-tts Python library is available
try:
    from piper import PiperVoice
    PIPER_AVAILABLE = True
except ImportError:
    PIPER_AVAILABLE = False
    logger.warning("piper-tts not installed. Install with: pip install piper-tts")


class PiperTTSHandler:
    """
    Piper TTS Handler for fast, offline text-to-speech synthesis.

    Supports English and Hindi with high-quality neural voices.
    Uses the piper-tts Python library (not CLI) for cross-platform support.
    """

    # Voice configurations for each supported language
    VOICE_CONFIG = {
        'en': {
            'model': 'en_US-lessac-medium',
            'docker_path': '/app/tts_models/en_US-lessac-medium.onnx',
            'description': 'English (US) - Lessac voice'
        },
        'hi': {
            'model': 'hi_IN-pratham-medium',
            'docker_path': '/app/tts_models/hi_IN-pratham-medium.onnx',
            'description': 'Hindi - Pratham voice'
        }
    }

    # Local development model paths (if downloaded)
    LOCAL_MODEL_DIR = './data/piper_models'

    def __init__(self, output_dir: str = "./data/audio"):
        """
        Initialize Piper TTS handler.

        Args:
            output_dir: Directory to save generated audio files
        """
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)

        # Check if piper-tts library is available
        self.piper_available = PIPER_AVAILABLE

        # Check which voice models are available and load them
        self.available_voices = {}
        self._voice_objects = {}

        if self.piper_available:
            self._load_available_voices()

        if self.piper_available and self.available_voices:
            logger.info(f"Piper TTS initialized. Available voices: {list(self.available_voices.keys())}")
        elif self.piper_available:
            logger.warning("Piper library installed but no voice models found")
        else:
            logger.warning("Piper TTS not available (piper-tts not installed)")

    def _load_available_voices(self):
        """
        Check which voice models are available and pre-load them.
        """
        for lang, config in self.VOICE_CONFIG.items():
            model_path = None

            # Check Docker path first (production)
            if os.path.exists(config['docker_path']):
                model_path = config['docker_path']
            # Check local development path
            elif os.path.exists(os.path.join(self.LOCAL_MODEL_DIR, f"{config['model']}.onnx")):
                model_path = os.path.join(self.LOCAL_MODEL_DIR, f"{config['model']}.onnx")

            if model_path:
                try:
                    # Load the voice model
                    self._voice_objects[lang] = PiperVoice.load(model_path)
                    self.available_voices[lang] = model_path
                    logger.info(f"Loaded Piper voice for {lang}: {model_path}")
                except Exception as e:
                    logger.warning(f"Failed to load Piper voice for {lang}: {e}")

    def is_available(self, language: str = 'en') -> bool:
        """Check if Piper TTS is available for the given language."""
        return self.piper_available and language in self.available_voices

    def get_supported_languages(self) -> list:
        """Get list of languages supported by available Piper models."""
        return list(self.available_voices.keys())

    def synthesize(self, text: str, language: str = 'en',
                   output_filename: Optional[str] = None) -> Dict[str, Any]:
        """
        Synthesize speech from text using Piper TTS.

        Args:
            text: Text to convert to speech
            language: Language code ('en' or 'hi')
            output_filename: Optional custom filename (without extension)

        Returns:
            dict with 'audio_path', 'duration', 'text', 'filename', 'engine', 'language'
        """
        if not text or len(text.strip()) == 0:
            raise ValueError("Text cannot be empty")

        if not self.piper_available:
            raise Exception("Piper TTS library not installed")

        # Validate language support
        if language not in self.available_voices:
            raise ValueError(f"Language '{language}' not supported by Piper. Available: {list(self.available_voices.keys())}")

        try:
            # Generate filename
            if output_filename is None:
                text_hash = hashlib.md5(f"{text}{language}".encode()).hexdigest()[:8]
                output_filename = f"piper_{language}_{text_hash}"

            # Use MP3 format if pydub is available, otherwise WAV
            output_format = 'mp3' if PYDUB_AVAILABLE else 'wav'
            output_path = os.path.join(self.output_dir, f"{output_filename}.{output_format}")

            # Check cache
            if os.path.exists(output_path):
                file_size = os.path.getsize(output_path)
                if file_size > 100:  # Ensure cached file is valid
                    logger.info(f"Using cached Piper audio: {output_filename}.{output_format} ({file_size} bytes)")
                    duration = self._get_audio_duration(output_path, text, is_mp3=(output_format == 'mp3'))
                    return {
                        'audio_path': output_path,
                        'duration': duration,
                        'text': text,
                        'filename': f"{output_filename}.{output_format}",
                        'language': language,
                        'engine': 'Piper TTS (cached)'
                    }
                else:
                    # Remove corrupted cache file
                    logger.warning(f"Removing corrupted cached file: {output_path}")
                    os.remove(output_path)

            # Get voice object for language
            voice = self._voice_objects[language]

            logger.info(f"Synthesizing with Piper ({language}): {len(text)} characters")

            # Synthesize to WAV first (Piper only outputs WAV)
            temp_wav_path = os.path.join(self.output_dir, f"{output_filename}_temp.wav")
            with wave.open(temp_wav_path, 'wb') as wav_file:
                voice.synthesize_wav(text, wav_file)

            # Verify WAV was created
            if not os.path.exists(temp_wav_path):
                raise Exception("Piper failed to create audio file")

            wav_size = os.path.getsize(temp_wav_path)
            if wav_size < 100:
                raise Exception(f"Piper generated invalid audio ({wav_size} bytes)")

            # Convert WAV to MP3 for compression (reduces size by ~90%)
            if PYDUB_AVAILABLE:
                try:
                    logger.info(f"Compressing WAV ({wav_size} bytes) to MP3...")
                    audio = AudioSegment.from_wav(temp_wav_path)
                    # Export as MP3 with 128kbps bitrate (good quality, ~10x smaller than WAV)
                    audio.export(output_path, format="mp3", bitrate="128k")
                    mp3_size = os.path.getsize(output_path)
                    compression_ratio = (1 - mp3_size / wav_size) * 100
                    logger.info(f"Compressed to MP3: {mp3_size} bytes (saved {compression_ratio:.1f}%)")
                    # Remove temporary WAV file
                    os.remove(temp_wav_path)
                except Exception as e:
                    logger.warning(f"MP3 conversion failed: {e}. Falling back to WAV.")
                    # If conversion fails, rename temp WAV as final output
                    os.rename(temp_wav_path, output_path.replace('.mp3', '.wav'))
                    output_path = output_path.replace('.mp3', '.wav')
                    output_format = 'wav'
            else:
                # No pydub, use WAV directly
                os.rename(temp_wav_path, output_path)

            file_size = os.path.getsize(output_path)
            logger.info(f"Piper audio file created: {output_path}, size: {file_size} bytes")

            # Get duration with text fallback
            is_mp3 = output_path.endswith('.mp3')
            duration = self._get_audio_duration(output_path, text, is_mp3=is_mp3)

            result = {
                'audio_path': output_path,
                'duration': duration,
                'text': text,
                'filename': os.path.basename(output_path),
                'language': language,
                'voice': self.VOICE_CONFIG[language]['model'],
                'engine': 'Piper TTS'
            }

            logger.info(f"Piper synthesis complete. Duration: {duration:.2f}s")
            return result

        except Exception as e:
            logger.error(f"Piper TTS error: {e}")
            raise Exception(f"Failed to synthesize with Piper: {str(e)}")

    def _get_audio_duration(self, audio_path: str, text: str = None, is_mp3: bool = False) -> float:
        """Get duration of audio file in seconds with fallbacks."""
        # For MP3 files, try pydub first
        if is_mp3 and PYDUB_AVAILABLE:
            try:
                audio = AudioSegment.from_mp3(audio_path)
                duration = len(audio) / 1000.0  # pydub returns milliseconds
                if duration > 0:
                    return duration
            except Exception as e:
                logger.warning(f"Could not get MP3 duration with pydub: {e}")

        # For WAV files, try reading WAV metadata
        if not is_mp3:
            try:
                with wave.open(audio_path, 'r') as wav_file:
                    frames = wav_file.getnframes()
                    rate = wav_file.getframerate()
                    duration = frames / float(rate)
                    if duration > 0:
                        return duration
            except Exception as e:
                logger.warning(f"Could not get WAV duration: {e}")

        # Fallback: File size based estimation
        try:
            file_size = os.path.getsize(audio_path)
            if is_mp3 and file_size > 1000:
                # MP3 at 128kbps: ~16KB per second
                estimated = file_size / 16000
                if estimated > 0.5:
                    return estimated
            elif not is_mp3 and file_size > 44:
                # WAV at 22050Hz, 16-bit mono = ~44100 bytes/sec
                estimated = (file_size - 44) / 44100
                if estimated > 0.5:
                    return estimated
        except Exception:
            pass

        # Last resort: Text-based estimation (150 WPM)
        if text:
            word_count = len(text.split())
            return max(1.0, (word_count / 150) * 60)

        # Absolute minimum
        return 3.0

    def synthesize_streaming(self, text: str, language: str = 'en',
                             chunk_size: int = 8192) -> Generator[bytes, None, None]:
        """
        Synthesize speech and yield audio data in chunks.

        Note: Piper Python library doesn't support true streaming,
        so this generates the full audio then yields chunks.

        Args:
            text: Text to convert to speech
            language: Language code ('en' or 'hi')
            chunk_size: Size of audio chunks to yield

        Yields:
            Audio chunks (bytes)
        """
        if not text or len(text.strip()) == 0:
            raise ValueError("Text cannot be empty")

        if language not in self.available_voices:
            raise ValueError(f"Language '{language}' not supported by Piper")

        try:
            # Generate to temp file then stream
            result = self.synthesize(text, language)

            with open(result['audio_path'], 'rb') as f:
                while True:
                    chunk = f.read(chunk_size)
                    if not chunk:
                        break
                    yield chunk

        except Exception as e:
            logger.error(f"Piper streaming error: {e}")
            raise


# Backwards compatibility alias
TTSHandler = PiperTTSHandler
