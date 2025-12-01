# src/multilingual_tts_handler.py - Optimized Multilingual TTS
"""
Optimized Multilingual Text-to-Speech Handler

Architecture:
1. English: Piper TTS (Fast, Offline, 0.3s) → EdgeTTS (Online, 0.5s) → gTTS (Fallback, 2s)
2. Indian Languages (HI, KN, TA, TE): EdgeTTS (High quality, 0.5s) → gTTS (Fallback, 2s)
3. Other Languages: gTTS (100+ languages)

Performance:
- English: 0.3-0.5s (vs 2s with gTTS) - 4x faster
- Regional: 0.5-1s (vs 2s with gTTS) - 2x faster
"""
import os
import logging
import hashlib
from typing import Dict, Any, Optional
from gtts import gTTS
from pathlib import Path

logger = logging.getLogger(__name__)


class MultilingualTTSHandler:
    """
    Multilingual TTS handler with gTTS as primary and Coqui as fallback

    Supported Languages:
    - English (en)
    - Hindi (hi)
    - Kannada (kn)
    - Tamil (ta)
    - Telugu (te)
    - And 100+ more via gTTS
    """

    # Language codes supported by gTTS (Limited to 3 languages as per requirements)
    SUPPORTED_LANGUAGES = {
        'en': 'English',
        'kn': 'Kannada',
        'hi': 'Hindi',
    }

    def __init__(self, output_dir="./data/audio", enable_coqui_fallback=False):
        """
        Initialize optimized multilingual TTS handler

        Args:
            output_dir: Directory to save generated audio files
            enable_coqui_fallback: Enable Coqui TTS (deprecated, disabled by default)
        """
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)

        # Initialize Piper TTS (Fast offline for English + Hindi)
        self.piper_handler = None
        self.piper_available = False
        self.piper_languages = []

        try:
            from src.tts_handler import PiperTTSHandler
            self.piper_handler = PiperTTSHandler(output_dir=output_dir)
            if self.piper_handler.piper_available and self.piper_handler.available_voices:
                self.piper_available = True
                self.piper_languages = list(self.piper_handler.available_voices.keys())
                logger.info(f"Piper TTS available for: {self.piper_languages} (fast, offline)")
            else:
                logger.info("Piper TTS not available. Using cloud TTS.")
        except Exception as e:
            logger.warning(f"Piper TTS not available: {e}")
            self.piper_available = False

        # Initialize EdgeTTS (High-quality for Indian languages)
        self.edge_handler = None
        self.edge_available = False

        try:
            from src.edge_tts_handler import EdgeTTSHandler
            self.edge_handler = EdgeTTSHandler(output_dir=output_dir)
            if self.edge_handler.is_available():
                self.edge_available = True
                logger.info("✓ EdgeTTS available (Excellent quality for HI, KN, TA, TE, 0.5s)")
            else:
                logger.info("ℹ EdgeTTS not available. Using gTTS.")
        except Exception as e:
            logger.warning(f"EdgeTTS not available: {e}. Using gTTS.")
            self.edge_available = False

        # Initialize Azure TTS (Optional premium)
        self.azure_handler = None
        self.azure_available = False

        try:
            from src.azure_tts_handler import AzureTTSHandler
            self.azure_handler = AzureTTSHandler(output_dir=output_dir)
            if self.azure_handler.is_configured():
                self.azure_available = True
                logger.info("✓ Azure Neural TTS available (Premium quality)")
            else:
                logger.info("ℹ Azure TTS not configured (optional).")
        except Exception as e:
            logger.warning(f"Azure TTS not available: {e}")
            self.azure_available = False

        # Initialize Google Cloud TTS (High quality, $300 credits available)
        self.gcloud_handler = None
        self.gcloud_available = False

        try:
            from src.google_cloud_tts_handler import GoogleCloudTTSHandler
            self.gcloud_handler = GoogleCloudTTSHandler(output_dir=output_dir)
            if self.gcloud_handler.is_available():
                self.gcloud_available = True
                logger.info("✓ Google Cloud TTS available (Neural2 voices)")
            else:
                logger.info("ℹ Google Cloud TTS not configured.")
        except Exception as e:
            logger.warning(f"Google Cloud TTS not available: {e}")
            self.gcloud_available = False

        logger.info(f"Multilingual TTS initialized (Piper: {self.piper_available}, EdgeTTS: {self.edge_available}, GCloud: {self.gcloud_available}, Azure: {self.azure_available}, gTTS: ✓)")

    def detect_language(self, text: str) -> str:
        """
        Auto-detect language from text

        Args:
            text: Input text

        Returns:
            Language code (e.g., 'en', 'hi', 'kn')
        """
        try:
            from langdetect import detect
            detected = detect(text)

            # Map langdetect codes to gTTS codes
            lang_mapping = {
                'en': 'en',
                'hi': 'hi',
                'kn': 'kn',
                'ta': 'ta',
                'te': 'te',
                'mr': 'mr',
                'bn': 'bn',
                'gu': 'gu',
                'ml': 'ml',
                'pa': 'pa',
                'ur': 'ur',
            }

            result = lang_mapping.get(detected, 'en')
            logger.info(f"Detected language: {result} ({self.SUPPORTED_LANGUAGES.get(result, 'Unknown')})")
            return result

        except ImportError:
            logger.warning("langdetect not installed. Install with: pip install langdetect")
            logger.info("Defaulting to English")
            return 'en'
        except Exception as e:
            logger.warning(f"Language detection failed: {e}. Defaulting to English")
            return 'en'

    def get_expected_file_extension(self, language: str = 'auto') -> str:
        """
        Get the expected file extension for the TTS engine that will be used.

        Args:
            language: Language code ('en', 'hi', 'kn', 'auto' for auto-detection)

        Returns:
            File extension ('.wav' or '.mp3') based on which TTS engine will be used
        """
        # Auto-detect language if requested
        if language == 'auto':
            language = 'en'  # Default to English for extension determination

        # Determine which TTS engine will be used based on language and availability
        # This logic mirrors the synthesize() method's engine selection

        # Piper TTS (WAV format) - for English and Hindi if available
        if language in self.piper_languages and self.piper_available:
            return '.wav'

        # All other engines use MP3 format:
        # - Google Cloud TTS: .mp3
        # - EdgeTTS: .mp3
        # - gTTS: .mp3
        return '.mp3'

    def synthesize(self, text: str, language: str = 'auto', output_filename: Optional[str] = None,
                   engine_preference: str = 'auto') -> Dict[str, Any]:
        """
        Convert text to speech with engine selection

        Args:
            text: Text to convert to speech
            language: Language code ('en', 'hi', 'kn', 'auto' for auto-detection)
            output_filename: Optional custom filename (without extension)
            engine_preference: 'auto', 'gtts', 'azure', 'coqui'

        Returns:
            dict with 'audio_path', 'duration', 'text', 'filename', 'language', 'engine'
        """
        try:
            if not text or len(text.strip()) == 0:
                raise ValueError("Text cannot be empty")

            # Auto-detect language if requested
            if language == 'auto':
                language = self.detect_language(text)

            # Validate language
            if language not in self.SUPPORTED_LANGUAGES and language != 'en':
                logger.warning(f"Unsupported language: {language}. Defaulting to English")
                language = 'en'

            # Clean text for TTS
            cleaned_text = self._clean_text_for_tts(text)

            # Decide which engine to use based on preference and availability
            if engine_preference == 'azure' and self.azure_available:
                # User explicitly wants Azure
                logger.info(f"Using Azure Neural TTS for {language} (user preference)")
                return self._synthesize_with_azure(cleaned_text, language, output_filename)

            elif engine_preference == 'gtts':
                # User explicitly wants gTTS
                logger.info(f"Using gTTS for {language} (user preference)")
                return self._synthesize_with_gtts(cleaned_text, language, output_filename)

            elif engine_preference == 'coqui' and language == 'en' and self.coqui_available:
                # User explicitly wants Coqui (English only)
                logger.info("Using Coqui TTS for English (user preference)")
                return self._synthesize_with_coqui(cleaned_text, output_filename)

            else:
                # Auto mode: Optimized engine selection
                # Priority: Piper (offline) → Google Cloud (reliable) → EdgeTTS (may fail in cloud) → Azure → gTTS
                # Google Cloud TTS is prioritized over EdgeTTS because it doesn't have 403 issues in cloud environments

                # Check if Piper supports this language (English + Hindi)
                if self.piper_available and language in self.piper_languages:
                    # Piper available for this language: Use it first (fastest, offline)
                    logger.info(f"Using Piper TTS for {self.SUPPORTED_LANGUAGES.get(language, language)} (fast, offline)")
                    return self._synthesize_with_piper(cleaned_text, language, output_filename)

                elif language == 'en':
                    # English without Piper: GCloud > EdgeTTS > Azure > gTTS
                    if self.gcloud_available:
                        logger.info("Using Google Cloud TTS for English (Standard, FREE tier)")
                        return self._synthesize_with_gcloud(cleaned_text, language, output_filename)
                    elif self.edge_available:
                        logger.info("Using EdgeTTS for English (0.5s, online)")
                        return self._synthesize_with_edge(cleaned_text, language, output_filename)
                    elif self.azure_available:
                        logger.info("Using Azure Neural TTS for English (premium)")
                        return self._synthesize_with_azure(cleaned_text, language, output_filename)
                    else:
                        logger.info("Using gTTS for English (fallback)")
                        return self._synthesize_with_gtts(cleaned_text, language, output_filename)

                elif language in ['hi', 'kn', 'ta', 'te', 'ml', 'bn', 'gu', 'mr']:
                    # Indian languages: GCloud > EdgeTTS > Azure > gTTS
                    # Google Cloud TTS is more reliable in cloud environments (no 403 errors)
                    if self.gcloud_available:
                        logger.info(f"Using Google Cloud TTS for {self.SUPPORTED_LANGUAGES.get(language, language)} (Standard, FREE tier)")
                        return self._synthesize_with_gcloud(cleaned_text, language, output_filename)
                    elif self.edge_available:
                        logger.info(f"Using EdgeTTS for {self.SUPPORTED_LANGUAGES.get(language, language)} (0.5s, excellent quality)")
                        return self._synthesize_with_edge(cleaned_text, language, output_filename)
                    elif self.azure_available:
                        logger.info(f"Using Azure Neural TTS for {self.SUPPORTED_LANGUAGES.get(language, language)} (premium)")
                        return self._synthesize_with_azure(cleaned_text, language, output_filename)
                    else:
                        logger.info(f"Using gTTS for {self.SUPPORTED_LANGUAGES.get(language, language)} (fallback)")
                        return self._synthesize_with_gtts(cleaned_text, language, output_filename)

                else:
                    # Other languages: gTTS (supports 100+ languages)
                    logger.info(f"Using gTTS for {self.SUPPORTED_LANGUAGES.get(language, language)} (multi-language support)")
                    return self._synthesize_with_gtts(cleaned_text, language, output_filename)

        except Exception as e:
            logger.error(f"TTS synthesis failed: {e}")
            # Last resort fallback to gTTS English
            logger.warning("Falling back to gTTS English")
            return self._synthesize_with_gtts(text, 'en', output_filename)

    def _synthesize_with_gtts(self, text: str, language: str, output_filename: Optional[str] = None) -> Dict[str, Any]:
        """Synthesize speech using gTTS with improved settings"""
        try:
            # Generate filename
            if output_filename is None:
                text_hash = hashlib.md5(text.encode()).hexdigest()[:8]
                output_filename = f"gtts_{language}_{text_hash}"

            output_path = os.path.join(self.output_dir, f"{output_filename}.mp3")

            logger.info(f"Synthesizing with gTTS ({language}): {len(text)} characters")

            # Google TTS Top-Level Domains for better quality
            # Using co.in domain for Indian languages gives better pronunciation
            tld_map = {
                'hi': 'co.in',  # Hindi - Indian domain
                'kn': 'co.in',  # Kannada - Indian domain
                'ta': 'co.in',  # Tamil - Indian domain
                'te': 'co.in',  # Telugu - Indian domain
                'en': 'com',    # English - default domain
            }

            tld = tld_map.get(language, 'com')

            # For regional languages, use slower speed for better clarity
            use_slow = language in ['kn', 'ta', 'te', 'ml']

            # Create gTTS object with improved settings
            tts = gTTS(
                text=text,
                lang=language,
                slow=use_slow,  # Slower for regional languages = clearer
                tld=tld,  # Use appropriate domain for better pronunciation
                lang_check=False  # Skip lang check
            )

            # Save to file
            tts.save(output_path)

            # Verify file was created and has content
            if not os.path.exists(output_path):
                raise Exception("gTTS failed to create audio file")

            file_size = os.path.getsize(output_path)
            if file_size < 500:  # Less than 500 bytes is likely an error
                logger.warning(f"gTTS generated very small file ({file_size} bytes), regenerating...")
                os.remove(output_path)
                raise Exception(f"gTTS generated invalid audio file ({file_size} bytes)")

            logger.info(f"gTTS audio file created: {output_path}, size: {file_size} bytes")

            # Get actual audio duration using mutagen with text fallback
            duration = self._get_mp3_duration(output_path, text)

            # Ensure reasonable minimum duration based on text length
            min_expected_duration = max(1.0, len(text.split()) / 200 * 60)  # 200 WPM max
            if duration < min_expected_duration * 0.5:
                logger.warning(f"Duration {duration:.2f}s seems too short for {len(text.split())} words, using estimate")
                duration = self._estimate_duration(text, language)

            result = {
                'audio_path': output_path,
                'duration': duration,
                'text': text,
                'filename': f"{output_filename}.mp3",
                'language': language,
                'language_name': self.SUPPORTED_LANGUAGES.get(language, language),
                'engine': 'gTTS'
            }

            logger.info(f"✓ gTTS synthesis complete. Duration: ~{duration:.2f}s, Size: {file_size} bytes")
            return result

        except Exception as e:
            logger.error(f"gTTS synthesis failed: {e}")
            # Try pyttsx3 as last resort for offline TTS
            return self._synthesize_with_pyttsx3(text, language, output_filename)

    def _synthesize_with_pyttsx3(self, text: str, language: str, output_filename: Optional[str] = None) -> Dict[str, Any]:
        """Offline TTS fallback using pyttsx3"""
        try:
            import pyttsx3

            if output_filename is None:
                text_hash = hashlib.md5(text.encode()).hexdigest()[:8]
                output_filename = f"pyttsx3_{language}_{text_hash}"

            output_path = os.path.join(self.output_dir, f"{output_filename}.mp3")

            logger.info(f"Synthesizing with pyttsx3 (offline fallback): {len(text)} characters")

            # Initialize pyttsx3 engine
            engine = pyttsx3.init()

            # Set properties for better quality
            engine.setProperty('rate', 150)  # Speed
            engine.setProperty('volume', 1.0)  # Volume

            # Try to find voice for language
            voices = engine.getProperty('voices')
            for voice in voices:
                if language in voice.languages or language in voice.id.lower():
                    engine.setProperty('voice', voice.id)
                    break

            # Save to file
            engine.save_to_file(text, output_path)
            engine.runAndWait()

            duration = self._estimate_duration(text, language)

            result = {
                'audio_path': output_path,
                'duration': duration,
                'text': text,
                'filename': f"{output_filename}.mp3",
                'language': language,
                'language_name': self.SUPPORTED_LANGUAGES.get(language, language),
                'engine': 'pyttsx3 (offline)'
            }

            logger.info(f"✓ pyttsx3 synthesis complete. Duration: ~{duration:.2f}s")
            return result

        except Exception as e:
            logger.error(f"pyttsx3 fallback failed: {e}")
            raise Exception(f"All TTS methods failed for {language}: {e}")

    def _get_mp3_duration(self, audio_path: str, text: str = None) -> float:
        """Get actual MP3 duration using mutagen with fallbacks"""
        # Try mutagen first
        try:
            from mutagen.mp3 import MP3
            audio = MP3(audio_path)
            duration = audio.info.length
            if duration and duration > 0:
                return duration
        except ImportError:
            logger.debug("mutagen not installed")
        except Exception as e:
            logger.debug(f"mutagen failed: {e}")

        # Fallback: File size based estimation (MP3 at ~128kbps)
        try:
            file_size = os.path.getsize(audio_path)
            if file_size > 0:
                estimated = file_size / 16000
                if estimated > 0.5:
                    return estimated
        except Exception:
            pass

        # Last resort: Text-based estimation
        if text:
            return self._estimate_duration(text, 'en')

        # Absolute minimum
        return 3.0

    def _synthesize_with_coqui(self, text: str, output_filename: Optional[str] = None) -> Dict[str, Any]:
        """Synthesize speech using Coqui TTS (English only, fallback)"""
        try:
            if not self.coqui_handler:
                raise Exception("Coqui TTS not available")

            logger.info(f"Synthesizing with Coqui TTS: {len(text)} characters")

            result = self.coqui_handler.synthesize(text, output_filename)
            result['engine'] = 'Coqui TTS'
            result['language'] = 'en'
            result['language_name'] = 'English'

            return result

        except Exception as e:
            logger.error(f"Coqui TTS failed: {e}. Falling back to gTTS")
            return self._synthesize_with_gtts(text, 'en', output_filename)

    def _synthesize_with_azure(self, text: str, language: str, output_filename: Optional[str] = None) -> Dict[str, Any]:
        """Synthesize speech using Azure Neural TTS (Premium quality)"""
        try:
            if not self.azure_handler or not self.azure_available:
                raise Exception("Azure TTS not available")

            logger.info(f"Synthesizing with Azure Neural TTS: {len(text)} characters")

            result = self.azure_handler.synthesize(text, language, output_filename)
            return result

        except Exception as e:
            logger.error(f"Azure TTS failed: {e}. Falling back to gTTS")
            return self._synthesize_with_gtts(text, language, output_filename)

    def _synthesize_with_piper(self, text: str, language: str = 'en', output_filename: Optional[str] = None) -> Dict[str, Any]:
        """Synthesize speech using Piper TTS (Fast offline TTS for English + Hindi)"""
        try:
            if not self.piper_handler or not self.piper_available:
                raise Exception("Piper TTS not available")

            if language not in self.piper_languages:
                raise Exception(f"Piper doesn't support language: {language}")

            logger.info(f"Synthesizing with Piper TTS ({language}): {len(text)} characters")

            result = self.piper_handler.synthesize(text, language, output_filename)
            result['engine'] = 'Piper TTS'
            result['language_name'] = self.SUPPORTED_LANGUAGES.get(language, language)

            return result

        except Exception as e:
            logger.error(f"Piper TTS failed: {e}. Falling back to GCloud/EdgeTTS/gTTS")
            # Fallback chain: GCloud > EdgeTTS > gTTS
            if self.gcloud_available:
                return self._synthesize_with_gcloud(text, language, output_filename)
            elif self.edge_available:
                return self._synthesize_with_edge(text, language, output_filename)
            else:
                return self._synthesize_with_gtts(text, language, output_filename)

    def _synthesize_with_gcloud(self, text: str, language: str, output_filename: Optional[str] = None) -> Dict[str, Any]:
        """Synthesize speech using Google Cloud TTS (Neural2 voices, reliable in cloud)"""
        try:
            if not self.gcloud_handler or not self.gcloud_available:
                raise Exception("Google Cloud TTS not available")

            logger.info(f"Synthesizing with Google Cloud TTS: {len(text)} characters")

            result = self.gcloud_handler.synthesize(text, language, output_filename)
            result['language_name'] = self.SUPPORTED_LANGUAGES.get(language, language)

            return result

        except Exception as e:
            logger.error(f"Google Cloud TTS failed: {e}. Falling back to EdgeTTS/gTTS")
            # Fallback chain: EdgeTTS > gTTS
            if self.edge_available:
                return self._synthesize_with_edge(text, language, output_filename)
            else:
                return self._synthesize_with_gtts(text, language, output_filename)

    def _synthesize_with_edge(self, text: str, language: str, output_filename: Optional[str] = None) -> Dict[str, Any]:
        """Synthesize speech using EdgeTTS (Excellent quality for Indian languages)"""
        try:
            if not self.edge_handler or not self.edge_available:
                raise Exception("EdgeTTS not available")

            logger.info(f"Synthesizing with EdgeTTS: {len(text)} characters")

            result = self.edge_handler.synthesize(text, language, output_filename)
            result['engine'] = 'EdgeTTS (Microsoft)'
            result['language_name'] = self.SUPPORTED_LANGUAGES.get(language, language)

            return result

        except Exception as e:
            logger.error(f"EdgeTTS failed: {e}. Falling back to gTTS")
            return self._synthesize_with_gtts(text, language, output_filename)

    def _clean_text_for_tts(self, text: str) -> str:
        """
        Clean text for TTS by removing markdown formatting and adding natural pauses

        Args:
            text: Raw text with possible markdown formatting

        Returns:
            Clean text suitable for TTS with improved pacing
        """
        import re

        # Remove markdown bold/italic: **text** or *text*
        text = re.sub(r'\*\*([^\*]+)\*\*', r'\1', text)
        text = re.sub(r'\*([^\*]+)\*', r'\1', text)

        # Remove markdown headers: ## Header -> Header
        text = re.sub(r'#{1,6}\s+', '', text)

        # Remove page references: (Page X)
        text = re.sub(r'\(Page \d+\)', '', text)

        # Remove backticks: `code`
        text = re.sub(r'`([^`]+)`', r'\1', text)

        # Remove excessive newlines
        text = re.sub(r'\n{3,}', '\n\n', text)

        # Remove bullet points and convert to comma-separated
        text = re.sub(r'\n\s*[-*•]\s+', ', ', text)

        # Add natural pauses for better clarity (especially for Kannada)
        # Add pause after sentences
        text = re.sub(r'([।.!?])\s+', r'\1. ', text)  # । is Devanagari full stop

        # Add pause after colons
        text = re.sub(r':\s+', ': ', text)

        # Add pause between list items
        text = re.sub(r',\s+', ', ', text)

        # Remove extra spaces
        text = re.sub(r'\s+', ' ', text)

        return text.strip()

    def _estimate_duration(self, text: str, language: str) -> float:
        """
        Estimate audio duration based on text length and language

        Args:
            text: Input text
            language: Language code

        Returns:
            Estimated duration in seconds
        """
        # Average speaking rates (words per minute)
        # Slower rates for Kannada slow mode for better clarity
        wpm_rates = {
            'en': 150,  # English
            'hi': 140,  # Hindi
            'kn': 100,  # Kannada (slower for clarity with slow=True)
        }

        wpm = wpm_rates.get(language, 140)

        # Estimate word count
        word_count = len(text.split())

        # Calculate duration in seconds
        duration = (word_count / wpm) * 60

        return max(1.0, duration)  # Minimum 1 second

    def synthesize_streaming(self, text: str, language: str = 'auto', engine_preference: str = 'auto'):
        """
        Stream audio synthesis (yields chunks as they're generated)

        Args:
            text: Text to convert to speech
            language: Language code ('en', 'hi', 'kn', 'auto' for auto-detection)
            engine_preference: 'auto', 'gtts', 'azure', 'coqui'

        Yields:
            Audio chunks (bytes) as they're generated
        """
        try:
            if not text or len(text.strip()) == 0:
                raise ValueError("Text cannot be empty")

            # Auto-detect language if requested
            if language == 'auto':
                language = self.detect_language(text)

            # Validate language
            if language not in self.SUPPORTED_LANGUAGES and language != 'en':
                logger.warning(f"Unsupported language: {language}. Defaulting to English")
                language = 'en'

            # Clean text for TTS
            cleaned_text = self._clean_text_for_tts(text)

            # Route to appropriate streaming engine
            if language == 'en' and self.piper_available:
                # Piper supports true streaming
                logger.info("Streaming with Piper TTS for English")
                for chunk in self.piper_handler.synthesize_streaming(cleaned_text):
                    yield chunk

            elif language in ['hi', 'kn', 'ta', 'te', 'ml', 'bn', 'gu', 'mr'] and self.edge_available:
                # EdgeTTS supports streaming
                logger.info(f"Streaming with EdgeTTS for {self.SUPPORTED_LANGUAGES.get(language, language)}")
                for chunk in self.edge_handler.synthesize_streaming(cleaned_text, language):
                    yield chunk

            elif self.edge_available and language == 'en':
                # EdgeTTS fallback for English
                logger.info("Streaming with EdgeTTS for English")
                for chunk in self.edge_handler.synthesize_streaming(cleaned_text, language):
                    yield chunk

            else:
                # gTTS fallback - synthesize full file and stream chunks
                logger.info(f"Streaming with gTTS fallback for {self.SUPPORTED_LANGUAGES.get(language, language)}")
                result = self._synthesize_with_gtts(cleaned_text, language)
                chunk_size = 8192  # 8KB chunks - optimal for network streaming
                with open(result['audio_path'], 'rb') as f:
                    while True:
                        chunk = f.read(chunk_size)
                        if not chunk:
                            break
                        yield chunk

        except Exception as e:
            logger.error(f"Streaming TTS failed: {e}")
            raise Exception(f"Failed to stream speech: {str(e)}")

    def get_supported_languages(self) -> Dict[str, str]:
        """Get list of supported languages"""
        return self.SUPPORTED_LANGUAGES.copy()

    def is_language_supported(self, language: str) -> bool:
        """Check if a language is supported"""
        return language in self.SUPPORTED_LANGUAGES
