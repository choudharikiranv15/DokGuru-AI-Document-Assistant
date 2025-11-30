# src/google_cloud_tts_handler.py - Google Cloud Text-to-Speech Handler
"""
Google Cloud TTS Handler - High-quality neural TTS for Indian languages

Supports:
- English (en-US, en-IN) - WaveNet and Neural2 voices
- Hindi (hi-IN) - Neural2 voices
- Kannada (kn-IN) - Neural2 voices
- Tamil (ta-IN) - Neural2 voices
- Telugu (te-IN) - Neural2 voices

Quality Tiers:
- Standard: Good quality, FREE up to 4M chars/month ($4/1M after)
- WaveNet: Excellent quality ($16/1M chars, 1M free)
- Neural2: Best quality, natural ($16/1M chars, 1M free)

DEFAULT: Using Standard voices to stay within FREE tier
Set USE_NEURAL_VOICES=true for higher quality (costs more)

Authentication Options:
1. GOOGLE_APPLICATION_CREDENTIALS env var (path to service account JSON)
2. GOOGLE_CLOUD_CREDENTIALS env var (JSON content as string - for Cloud Run)
3. Default credentials (when running on GCP)
"""
import os
import json
import logging
import hashlib
import tempfile
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Check if Google Cloud TTS is available
try:
    from google.cloud import texttospeech
    from google.oauth2 import service_account
    GOOGLE_TTS_AVAILABLE = True
except ImportError:
    GOOGLE_TTS_AVAILABLE = False
    logger.warning("Google Cloud TTS not installed. Install: pip install google-cloud-texttospeech")


class GoogleCloudTTSHandler:
    """
    Google Cloud Text-to-Speech handler for high-quality Indian language synthesis

    Requires:
    - GOOGLE_APPLICATION_CREDENTIALS env var pointing to service account JSON
    - Or running on GCP with default credentials
    """

    # Standard voices (FREE tier - 4M chars/month)
    # Use these by default to minimize costs
    VOICE_MAP_STANDARD = {
        'en': {
            'language_code': 'en-US',
            'name': 'en-US-Standard-C',  # Female, good quality
            'ssml_gender': 'FEMALE'
        },
        'en-IN': {
            'language_code': 'en-IN',
            'name': 'en-IN-Standard-A',  # Indian English female
            'ssml_gender': 'FEMALE'
        },
        'hi': {
            'language_code': 'hi-IN',
            'name': 'hi-IN-Standard-A',  # Hindi female
            'ssml_gender': 'FEMALE'
        },
        'kn': {
            'language_code': 'kn-IN',
            'name': 'kn-IN-Standard-A',  # Kannada female
            'ssml_gender': 'FEMALE'
        },
        'ta': {
            'language_code': 'ta-IN',
            'name': 'ta-IN-Standard-A',  # Tamil female
            'ssml_gender': 'FEMALE'
        },
        'te': {
            'language_code': 'te-IN',
            'name': 'te-IN-Standard-A',  # Telugu female
            'ssml_gender': 'FEMALE'
        },
        'ml': {
            'language_code': 'ml-IN',
            'name': 'ml-IN-Standard-A',  # Malayalam female
            'ssml_gender': 'FEMALE'
        },
        'bn': {
            'language_code': 'bn-IN',
            'name': 'bn-IN-Standard-A',  # Bengali female
            'ssml_gender': 'FEMALE'
        },
        'mr': {
            'language_code': 'mr-IN',
            'name': 'mr-IN-Standard-A',  # Marathi female
            'ssml_gender': 'FEMALE'
        },
        'gu': {
            'language_code': 'gu-IN',
            'name': 'gu-IN-Standard-A',  # Gujarati female
            'ssml_gender': 'FEMALE'
        },
    }

    # Neural2 voices (Premium - $16/1M chars, better quality)
    # Only used if USE_NEURAL_VOICES=true
    VOICE_MAP_NEURAL = {
        'en': {
            'language_code': 'en-US',
            'name': 'en-US-Neural2-F',  # Female, natural
            'ssml_gender': 'FEMALE'
        },
        'en-IN': {
            'language_code': 'en-IN',
            'name': 'en-IN-Neural2-A',  # Indian English female
            'ssml_gender': 'FEMALE'
        },
        'hi': {
            'language_code': 'hi-IN',
            'name': 'hi-IN-Neural2-A',  # Hindi female
            'ssml_gender': 'FEMALE'
        },
        'kn': {
            'language_code': 'kn-IN',
            'name': 'kn-IN-Standard-A',  # Kannada (Neural2 not available)
            'ssml_gender': 'FEMALE'
        },
        'ta': {
            'language_code': 'ta-IN',
            'name': 'ta-IN-Neural2-A',  # Tamil female
            'ssml_gender': 'FEMALE'
        },
        'te': {
            'language_code': 'te-IN',
            'name': 'te-IN-Standard-A',  # Telugu (Neural2 not available)
            'ssml_gender': 'FEMALE'
        },
        'ml': {
            'language_code': 'ml-IN',
            'name': 'ml-IN-Standard-A',  # Malayalam
            'ssml_gender': 'FEMALE'
        },
        'bn': {
            'language_code': 'bn-IN',
            'name': 'bn-IN-Standard-A',  # Bengali
            'ssml_gender': 'FEMALE'
        },
        'mr': {
            'language_code': 'mr-IN',
            'name': 'mr-IN-Standard-A',  # Marathi
            'ssml_gender': 'FEMALE'
        },
        'gu': {
            'language_code': 'gu-IN',
            'name': 'gu-IN-Standard-A',  # Gujarati
            'ssml_gender': 'FEMALE'
        },
    }

    # Default to Standard voices (FREE tier)
    VOICE_MAP = VOICE_MAP_STANDARD

    def __init__(self, output_dir: str = "./data/audio", use_neural: bool = None):
        """
        Initialize Google Cloud TTS handler

        Args:
            output_dir: Directory to save generated audio files
            use_neural: Use Neural2 voices (higher quality, costs $16/1M chars)
                       If None, checks USE_NEURAL_VOICES env var
                       Default: False (use Standard voices - FREE up to 4M chars/month)
        """
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)

        self.client = None
        self.available = False
        self._temp_creds_file = None

        # Determine voice quality tier
        if use_neural is None:
            use_neural = os.environ.get('USE_NEURAL_VOICES', 'false').lower() == 'true'

        self.use_neural = use_neural
        self.voice_map = self.VOICE_MAP_NEURAL if use_neural else self.VOICE_MAP_STANDARD
        voice_tier = "Neural2 (premium)" if use_neural else "Standard (FREE tier)"

        if not GOOGLE_TTS_AVAILABLE:
            logger.warning("Google Cloud TTS library not installed")
            return

        try:
            # Try multiple authentication methods
            credentials = self._get_credentials()

            if credentials:
                self.client = texttospeech.TextToSpeechClient(credentials=credentials)
            else:
                # Fall back to default credentials (GOOGLE_APPLICATION_CREDENTIALS or GCP default)
                self.client = texttospeech.TextToSpeechClient()

            self.available = True
            logger.info(f"Google Cloud TTS initialized - Using {voice_tier} voices")
        except Exception as e:
            logger.warning(f"Google Cloud TTS initialization failed: {e}")
            self.available = False

    def _get_credentials(self):
        """
        Get credentials from various sources:
        1. GOOGLE_CLOUD_CREDENTIALS_BASE64 env var (Base64 encoded JSON - for Cloud Run CI/CD)
        2. GOOGLE_CLOUD_CREDENTIALS env var (JSON string - for Cloud Run)
        3. GOOGLE_TTS_CREDENTIALS env var (JSON string - alternative)
        4. GOOGLE_APPLICATION_CREDENTIALS env var (file path)
        5. Default credentials (GCP environment)
        """
        import base64

        # Option 0: Base64 encoded JSON in GOOGLE_CLOUD_CREDENTIALS_BASE64
        creds_base64 = os.environ.get('GOOGLE_CLOUD_CREDENTIALS_BASE64')
        if creds_base64:
            try:
                creds_json = base64.b64decode(creds_base64).decode('utf-8')
                creds_info = json.loads(creds_json)
                credentials = service_account.Credentials.from_service_account_info(creds_info)
                logger.info("Using credentials from GOOGLE_CLOUD_CREDENTIALS_BASE64 env var")
                return credentials
            except Exception as e:
                logger.warning(f"Failed to decode base64 credentials: {e}")

        # Option 1: JSON content in GOOGLE_CLOUD_CREDENTIALS
        creds_json = os.environ.get('GOOGLE_CLOUD_CREDENTIALS') or os.environ.get('GOOGLE_TTS_CREDENTIALS')
        if creds_json:
            try:
                creds_info = json.loads(creds_json)
                credentials = service_account.Credentials.from_service_account_info(creds_info)
                logger.info("Using credentials from GOOGLE_CLOUD_CREDENTIALS env var")
                return credentials
            except json.JSONDecodeError:
                logger.warning("GOOGLE_CLOUD_CREDENTIALS is not valid JSON")
            except Exception as e:
                logger.warning(f"Failed to parse credentials from env var: {e}")

        # Option 2: Check if GOOGLE_APPLICATION_CREDENTIALS points to valid file
        creds_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
        if creds_path and os.path.exists(creds_path):
            try:
                credentials = service_account.Credentials.from_service_account_file(creds_path)
                logger.info(f"Using credentials from file: {creds_path}")
                return credentials
            except Exception as e:
                logger.warning(f"Failed to load credentials from file: {e}")

        # Return None to use default credentials
        return None

    def is_available(self) -> bool:
        """Check if Google Cloud TTS is available and configured"""
        return self.available and self.client is not None

    def synthesize(self, text: str, language: str = 'en',
                   output_filename: Optional[str] = None,
                   use_neural: bool = True) -> Dict[str, Any]:
        """
        Synthesize speech from text using Google Cloud TTS

        Args:
            text: Text to convert to speech
            language: Language code (en, hi, kn, ta, te, etc.)
            output_filename: Optional custom filename (without extension)
            use_neural: Use Neural2/WaveNet voices (higher quality, costs more)

        Returns:
            dict with 'audio_path', 'duration', 'text', 'filename', 'engine'
        """
        if not self.is_available():
            raise Exception("Google Cloud TTS not available")

        try:
            if not text or len(text.strip()) == 0:
                raise ValueError("Text cannot be empty")

            # Generate filename
            if output_filename is None:
                text_hash = hashlib.md5(f"{text}{language}".encode()).hexdigest()[:8]
                output_filename = f"gcloud_tts_{language}_{text_hash}"

            output_path = os.path.join(self.output_dir, f"{output_filename}.mp3")

            # Check cache
            if os.path.exists(output_path):
                logger.info(f"Using cached Google Cloud TTS audio: {output_filename}.mp3")
                duration = self._get_audio_duration(output_path)
                return {
                    'audio_path': output_path,
                    'duration': duration,
                    'text': text,
                    'filename': f"{output_filename}.mp3",
                    'language': language,
                    'engine': 'Google Cloud TTS (cached)'
                }

            # Get voice config for language (uses self.voice_map set in __init__)
            voice_config = self.voice_map.get(language, self.voice_map['en'])

            # Build synthesis input
            synthesis_input = texttospeech.SynthesisInput(text=text)

            # Build voice parameters
            voice = texttospeech.VoiceSelectionParams(
                language_code=voice_config['language_code'],
                name=voice_config['name'],
                ssml_gender=getattr(texttospeech.SsmlVoiceGender, voice_config['ssml_gender'])
            )

            # Build audio config - MP3 output
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
                speaking_rate=1.0,  # Normal speed
                pitch=0.0,  # Normal pitch
                effects_profile_id=['small-bluetooth-speaker-class-device']  # Optimized for small speakers
            )

            logger.info(f"Synthesizing with Google Cloud TTS ({voice_config['name']}): {len(text)} characters")

            # Call the API
            response = self.client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config
            )

            # Save the audio
            with open(output_path, 'wb') as f:
                f.write(response.audio_content)

            # Get duration
            duration = self._get_audio_duration(output_path)

            # Determine voice type for logging
            voice_type = "Neural2" if "Neural2" in voice_config['name'] else "Standard"

            result = {
                'audio_path': output_path,
                'duration': duration,
                'text': text,
                'filename': f"{output_filename}.mp3",
                'language': language,
                'voice': voice_config['name'],
                'voice_type': voice_type,
                'engine': f'Google Cloud TTS ({voice_type})'
            }

            logger.info(f"✓ Google Cloud TTS synthesis complete. Duration: {duration:.2f}s, Voice: {voice_type}")
            return result

        except Exception as e:
            logger.error(f"Google Cloud TTS error: {e}")
            raise Exception(f"Failed to synthesize with Google Cloud TTS: {str(e)}")

    def _get_audio_duration(self, audio_path: str) -> float:
        """Get duration of MP3 audio file in seconds"""
        try:
            from mutagen.mp3 import MP3
            audio = MP3(audio_path)
            return audio.info.length
        except ImportError:
            logger.warning("mutagen not installed. Using estimated duration.")
            # Estimate based on file size
            file_size = os.path.getsize(audio_path)
            return file_size / 16000  # Rough estimate
        except Exception as e:
            logger.warning(f"Could not get audio duration: {e}")
            return 0.0

    @staticmethod
    def get_supported_languages() -> list:
        """Get list of supported language codes"""
        return list(GoogleCloudTTSHandler.VOICE_MAP.keys())

    def list_voices(self, language_code: str = None) -> list:
        """
        List available voices from Google Cloud TTS

        Args:
            language_code: Optional filter by language (e.g., 'hi-IN')

        Returns:
            List of voice dictionaries
        """
        if not self.is_available():
            return []

        try:
            response = self.client.list_voices(language_code=language_code)
            voices = []
            for voice in response.voices:
                voices.append({
                    'name': voice.name,
                    'language_codes': list(voice.language_codes),
                    'ssml_gender': texttospeech.SsmlVoiceGender(voice.ssml_gender).name,
                    'natural_sample_rate_hertz': voice.natural_sample_rate_hertz
                })
            return voices
        except Exception as e:
            logger.error(f"Failed to list voices: {e}")
            return []
