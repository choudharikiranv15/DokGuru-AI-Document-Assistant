# src/azure_tts_handler.py - Azure Cognitive Services TTS Handler
"""
Azure TTS Handler for Natural Kannada Voice
- Premium quality neural voices
- Free tier: 5 million characters/month
- Supports English, Kannada, Hindi
"""
import os
import logging
import hashlib
from typing import Dict, Any, Optional
import azure.cognitiveservices.speech as speechsdk

logger = logging.getLogger(__name__)

# Audio compression library
try:
    from pydub import AudioSegment
    PYDUB_AVAILABLE = True
except ImportError:
    PYDUB_AVAILABLE = False
    logger.warning("pydub not available - WAV files will not be compressed to MP3")


class AzureTTSHandler:
    """
    Azure Cognitive Services TTS Handler

    Supported Voices:
    - Kannada: kn-IN-GaganNeural (Male), kn-IN-SapnaNeural (Female)
    - Hindi: hi-IN-MadhurNeural (Male), hi-IN-SwaraNeural (Female)
    - English: en-IN-NeerjaNeural (Female), en-IN-PrabhatNeural (Male)
    """

    # Voice configurations for each language
    VOICE_CONFIG = {
        'kn': {
            'locale': 'kn-IN',
            'voice': 'kn-IN-GaganNeural',  # Male voice (clearer for students)
            'name': 'Gagan (Kannada Male)',
            'rate': '+0%',  # Normal speed
            'pitch': '+0Hz'
        },
        'hi': {
            'locale': 'hi-IN',
            'voice': 'hi-IN-MadhurNeural',  # Male voice
            'name': 'Madhur (Hindi Male)',
            'rate': '+0%',
            'pitch': '+0Hz'
        },
        'en': {
            'locale': 'en-IN',
            'voice': 'en-IN-PrabhatNeural',  # Male voice (Indian accent)
            'name': 'Prabhat (English Indian Male)',
            'rate': '+0%',
            'pitch': '+0Hz'
        }
    }

    def __init__(self, output_dir="./data/audio"):
        """
        Initialize Azure TTS handler

        Args:
            output_dir: Directory to save generated audio files
        """
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)

        # Get Azure credentials from environment
        self.subscription_key = os.getenv('AZURE_SPEECH_KEY')
        self.region = os.getenv('AZURE_SPEECH_REGION', 'centralindia')

        # Check if Azure is configured
        self.is_available = bool(self.subscription_key)

        if not self.is_available:
            logger.warning("Azure Speech not configured. Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in .env")
        else:
            logger.info(f"✅ Azure TTS initialized (Region: {self.region})")

    def synthesize(self, text: str, language: str = 'en', output_filename: Optional[str] = None) -> Dict[str, Any]:
        """
        Convert text to speech using Azure Neural TTS

        Args:
            text: Text to convert to speech
            language: Language code ('en', 'kn', 'hi')
            output_filename: Optional custom filename (without extension)

        Returns:
            dict with 'audio_path', 'duration', 'text', 'filename', 'language', 'engine'
        """
        if not self.is_available:
            raise Exception("Azure TTS not configured. Please set AZURE_SPEECH_KEY in .env")

        if not text or len(text.strip()) == 0:
            raise ValueError("Text cannot be empty")

        # Validate language
        if language not in self.VOICE_CONFIG:
            logger.warning(f"Unsupported language for Azure: {language}. Defaulting to English")
            language = 'en'

        voice_config = self.VOICE_CONFIG[language]

        # Generate filename
        if output_filename is None:
            text_hash = hashlib.md5(text.encode()).hexdigest()[:8]
            output_filename = f"azure_{language}_{text_hash}"

        # Use MP3 format if pydub is available, otherwise WAV
        output_format = 'mp3' if PYDUB_AVAILABLE else 'wav'
        final_output_path = os.path.join(self.output_dir, f"{output_filename}.{output_format}")

        # Check cache first
        if os.path.exists(final_output_path):
            file_size = os.path.getsize(final_output_path)
            if file_size > 100:
                logger.info(f"Using cached Azure audio: {output_filename}.{output_format} ({file_size} bytes)")
                duration = self._get_audio_duration(final_output_path, is_mp3=(output_format == 'mp3'))
                return {
                    'audio_path': final_output_path,
                    'duration': duration,
                    'text': text,
                    'filename': f"{output_filename}.{output_format}",
                    'language': language,
                    'language_name': voice_config['name'],
                    'engine': 'Azure Neural TTS (cached)',
                    'voice': voice_config['voice']
                }

        # Azure SDK always outputs WAV, so we need a temp path
        temp_wav_path = os.path.join(self.output_dir, f"{output_filename}_temp.wav")

        logger.info(f"Synthesizing with Azure TTS ({voice_config['name']}): {len(text)} characters")

        try:
            # Configure Azure Speech
            speech_config = speechsdk.SpeechConfig(
                subscription=self.subscription_key,
                region=self.region
            )

            # Set voice
            speech_config.speech_synthesis_voice_name = voice_config['voice']

            # Configure audio output (Azure SDK outputs WAV)
            audio_config = speechsdk.audio.AudioOutputConfig(filename=temp_wav_path)

            # Create synthesizer
            synthesizer = speechsdk.SpeechSynthesizer(
                speech_config=speech_config,
                audio_config=audio_config
            )

            # Create SSML for better control
            ssml = f"""
            <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='{voice_config['locale']}'>
                <voice name='{voice_config['voice']}'>
                    <prosody rate='{voice_config['rate']}' pitch='{voice_config['pitch']}'>
                        {self._escape_xml(text)}
                    </prosody>
                </voice>
            </speak>
            """

            # Synthesize
            result = synthesizer.speak_ssml_async(ssml).get()

            # Check result
            if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
                logger.info(f"✅ Azure TTS synthesis complete (WAV)")

                # Convert WAV to MP3 for compression (reduces size by ~90%)
                if PYDUB_AVAILABLE:
                    try:
                        wav_size = os.path.getsize(temp_wav_path)
                        logger.info(f"Compressing WAV ({wav_size} bytes) to MP3...")
                        audio = AudioSegment.from_wav(temp_wav_path)
                        # Export as MP3 with 128kbps bitrate
                        audio.export(final_output_path, format="mp3", bitrate="128k")
                        mp3_size = os.path.getsize(final_output_path)
                        compression_ratio = (1 - mp3_size / wav_size) * 100
                        logger.info(f"Compressed to MP3: {mp3_size} bytes (saved {compression_ratio:.1f}%)")
                        # Remove temporary WAV file
                        os.remove(temp_wav_path)
                    except Exception as e:
                        logger.warning(f"MP3 conversion failed: {e}. Falling back to WAV.")
                        os.rename(temp_wav_path, final_output_path.replace('.mp3', '.wav'))
                        final_output_path = final_output_path.replace('.mp3', '.wav')
                        output_format = 'wav'
                else:
                    # No pydub, use WAV directly
                    os.rename(temp_wav_path, final_output_path)

                # Get audio duration
                is_mp3 = final_output_path.endswith('.mp3')
                duration = self._get_audio_duration(final_output_path, is_mp3=is_mp3)

                return {
                    'audio_path': final_output_path,
                    'duration': duration,
                    'text': text,
                    'filename': os.path.basename(final_output_path),
                    'language': language,
                    'language_name': voice_config['name'],
                    'engine': 'Azure Neural TTS',
                    'voice': voice_config['voice']
                }

            elif result.reason == speechsdk.ResultReason.Canceled:
                cancellation = result.cancellation_details
                logger.error(f"Azure TTS canceled: {cancellation.reason}")
                if cancellation.reason == speechsdk.CancellationReason.Error:
                    logger.error(f"Error details: {cancellation.error_details}")
                raise Exception(f"Azure TTS failed: {cancellation.error_details}")

            else:
                raise Exception(f"Unexpected result: {result.reason}")

        except Exception as e:
            logger.error(f"Azure TTS synthesis failed: {e}")
            raise

    def _escape_xml(self, text: str) -> str:
        """Escape XML special characters for SSML"""
        replacements = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&apos;'
        }
        for old, new in replacements.items():
            text = text.replace(old, new)
        return text

    def _get_audio_duration(self, audio_path: str, is_mp3: bool = False) -> float:
        """Get duration of audio file (WAV or MP3)"""
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
                import wave
                with wave.open(audio_path, 'r') as audio_file:
                    frames = audio_file.getnframes()
                    rate = audio_file.getframerate()
                    duration = frames / float(rate)
                    if duration > 0:
                        return duration
            except Exception as e:
                logger.warning(f"Could not get WAV duration: {e}")

        # Fallback: File size estimation
        try:
            file_size = os.path.getsize(audio_path)
            if is_mp3 and file_size > 1000:
                # MP3 at 128kbps: ~16KB per second
                return file_size / 16000
            elif not is_mp3 and file_size > 44:
                # WAV estimation
                return (file_size - 44) / 44100
        except Exception:
            pass

        # Last resort: return minimum duration
        return 3.0

    def get_available_voices(self) -> Dict[str, Dict]:
        """Get list of available voices"""
        return self.VOICE_CONFIG

    def is_configured(self) -> bool:
        """Check if Azure TTS is properly configured"""
        return self.is_available
