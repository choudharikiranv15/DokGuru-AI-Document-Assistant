"""
Streaming Chat Handler - Real-time LLM + TTS streaming
Generates TTS audio chunks while LLM is still generating text
"""

import json
import logging
import queue
import threading
import time
from typing import Generator, Optional
from dataclasses import dataclass
import re

logger = logging.getLogger(__name__)


@dataclass
class StreamChunk:
    """Represents a chunk of streamed data"""
    text: Optional[str] = None
    audio_url: Optional[str] = None
    chunk_type: str = 'text'  # 'text', 'audio', 'done'
    metadata: dict = None


class StreamingChatHandler:
    """
    Handles real-time streaming of LLM responses with parallel TTS generation

    Flow:
    1. LLM streams tokens → buffer until sentence complete
    2. Send sentence to frontend (user sees text immediately)
    3. Generate TTS for sentence in background thread
    4. Send audio URL when ready
    5. Frontend auto-plays audio queue
    """

    def __init__(self, llm_client, tts_handler, sentence_buffer_size: int = 150):
        """
        Args:
            llm_client: Groq/Gemini client for streaming
            tts_handler: TTS handler for audio generation
            sentence_buffer_size: Min characters before triggering TTS
        """
        self.llm_client = llm_client
        self.tts_handler = tts_handler
        self.sentence_buffer_size = sentence_buffer_size
        self.audio_queue = queue.Queue()

    def stream_chat_response(
        self,
        question: str,
        context: str,
        language: str = 'en',
        user_id: str = None
    ) -> Generator[str, None, None]:
        """
        Stream LLM response with parallel TTS generation

        Yields:
            Server-Sent Events (SSE) formatted strings:
            - Text chunks: data: {"type": "text", "content": "..."}
            - Audio URLs: data: {"type": "audio", "url": "..."}
            - Completion: data: {"type": "done"}
        """

        try:
            # Build prompt
            prompt = self._build_prompt(question, context, language)

            # Start LLM streaming
            logger.info(f"Starting streaming response for user {user_id}")
            stream = self._get_llm_stream(prompt)

            # Process stream
            buffer = ""
            sentence_count = 0
            full_response = ""

            for chunk in stream:
                # Extract text delta from chunk
                delta = self._extract_delta(chunk)
                if not delta:
                    continue

                buffer += delta
                full_response += delta

                # Check if we have a complete sentence or enough text
                if self._is_sentence_boundary(buffer) or len(buffer) >= self.sentence_buffer_size:
                    sentence = buffer.strip()

                    if sentence:
                        sentence_count += 1
                        logger.debug(f"Sentence {sentence_count}: {sentence[:50]}...")

                        # Send text to frontend immediately
                        yield self._format_sse({
                            'type': 'text',
                            'content': sentence,
                            'sentence_id': sentence_count
                        })

                        # Generate TTS in background thread
                        threading.Thread(
                            target=self._generate_tts_async,
                            args=(sentence, sentence_count, language, user_id),
                            daemon=True
                        ).start()

                    buffer = ""

            # Send remaining buffer
            if buffer.strip():
                sentence_count += 1
                yield self._format_sse({
                    'type': 'text',
                    'content': buffer.strip(),
                    'sentence_id': sentence_count
                })

                # Generate TTS for final chunk
                threading.Thread(
                    target=self._generate_tts_async,
                    args=(buffer.strip(), sentence_count, language, user_id),
                    daemon=True
                ).start()

            # Wait briefly for first audio to generate
            time.sleep(0.3)  # Piper TTS is fast (0.3s)

            # Send any ready audio URLs
            while not self.audio_queue.empty():
                audio_data = self.audio_queue.get_nowait()
                yield self._format_sse(audio_data)

            # Send completion signal
            yield self._format_sse({
                'type': 'done',
                'full_response': full_response,
                'total_sentences': sentence_count
            })

            logger.info(f"Streaming complete: {sentence_count} sentences, {len(full_response)} chars")

        except Exception as e:
            logger.error(f"Streaming error: {e}", exc_info=True)
            yield self._format_sse({
                'type': 'error',
                'message': str(e)
            })

    def _get_llm_stream(self, prompt: str):
        """Get streaming response from LLM"""
        try:
            # Groq streaming
            if hasattr(self.llm_client, 'chat'):
                return self.llm_client.chat.completions.create(
                    model="llama-3.1-70b-versatile",
                    messages=[
                        {"role": "system", "content": "You are a helpful assistant. Answer concisely."},
                        {"role": "user", "content": prompt}
                    ],
                    stream=True,
                    temperature=0.7,
                    max_tokens=1000
                )
            else:
                raise ValueError("LLM client doesn't support streaming")

        except Exception as e:
            logger.error(f"LLM streaming error: {e}")
            raise

    def _extract_delta(self, chunk) -> str:
        """Extract text delta from streaming chunk"""
        try:
            # Groq format
            if hasattr(chunk, 'choices') and chunk.choices:
                delta = chunk.choices[0].delta
                if hasattr(delta, 'content') and delta.content:
                    return delta.content
            return ""
        except Exception as e:
            logger.warning(f"Delta extraction error: {e}")
            return ""

    def _is_sentence_boundary(self, text: str) -> bool:
        """Check if text ends with sentence boundary"""
        if not text:
            return False

        # Sentence ending punctuation
        sentence_endings = ['. ', '! ', '? ', '.\n', '!\n', '?\n']
        return any(text.endswith(ending) for ending in sentence_endings)

    def _generate_tts_async(
        self,
        text: str,
        sentence_id: int,
        language: str,
        user_id: str
    ):
        """Generate TTS in background thread"""
        try:
            start_time = time.time()

            # Generate audio
            result = self.tts_handler.synthesize(
                text=text,
                language=language,
                output_filename=f"stream_{user_id}_{sentence_id}"
            )

            elapsed = time.time() - start_time
            logger.info(f"TTS generated for sentence {sentence_id} in {elapsed:.2f}s")

            # Add to queue
            audio_data = {
                'type': 'audio',
                'sentence_id': sentence_id,
                'audio_url': result.get('audio_url'),
                'duration': result.get('duration', 0),
                'engine': result.get('engine', 'unknown')
            }

            self.audio_queue.put(audio_data)

        except Exception as e:
            logger.error(f"TTS generation error for sentence {sentence_id}: {e}")
            # Don't fail the entire stream, just log the error

    def _build_prompt(self, question: str, context: str, language: str) -> str:
        """Build prompt for LLM"""
        lang_instruction = {
            'en': 'Answer in English.',
            'hi': 'Answer in Hindi.',
            'kan': 'Answer in Kannada.'
        }.get(language, 'Answer in English.')

        return f"""Context: {context}

Question: {question}

{lang_instruction} Be concise and cite page numbers if available."""

    def _format_sse(self, data: dict) -> str:
        """Format data as Server-Sent Event"""
        return f"data: {json.dumps(data)}\n\n"


# ============================================================================
# Advanced: Optimized Streaming with Smart Buffering
# ============================================================================

class OptimizedStreamingHandler(StreamingChatHandler):
    """
    Enhanced streaming with:
    - Intelligent sentence detection (handles abbreviations)
    - Adaptive buffering (longer sentences = better TTS quality)
    - Pre-warming TTS engine
    - Audio format optimization
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Common abbreviations that shouldn't trigger sentence break
        self.abbreviations = {
            'Dr.', 'Mr.', 'Mrs.', 'Ms.', 'Prof.', 'Sr.', 'Jr.',
            'vs.', 'etc.', 'e.g.', 'i.e.', 'p.m.', 'a.m.',
            'approx.', 'dept.', 'fig.', 'no.', 'vol.'
        }

    def _is_sentence_boundary(self, text: str) -> bool:
        """Smart sentence detection that handles abbreviations"""
        if not text or len(text) < 10:
            return False

        # Check for sentence ending
        if not any(text.endswith(p) for p in ['. ', '! ', '? ', '.\n', '!\n', '?\n']):
            return False

        # Check if it's an abbreviation
        words = text.strip().split()
        if not words:
            return False

        last_word = words[-1].rstrip('.,!?')
        if f"{last_word}." in self.abbreviations:
            return False

        # Check for minimum sentence length (avoid very short sentences)
        if len(text.strip()) < 20:
            return False

        return True

    def _optimize_audio_format(self, audio_data: dict) -> dict:
        """Optimize audio for streaming (lower bitrate, smaller chunks)"""
        # Future: Convert to lower bitrate MP3 or Opus for faster streaming
        # For now, return as-is
        return audio_data


# ============================================================================
# Usage Example
# ============================================================================

def example_usage():
    """Example of how to use streaming in Flask route"""

    from flask import Response, request

    @app.route('/api/chat/ask-stream', methods=['POST'])
    def ask_stream():
        data = request.json
        question = data.get('question')
        document_id = data.get('document_id')
        language = data.get('language', 'en')

        # Get context from vector DB
        context = retrieve_context(document_id, question)

        # Initialize streaming handler
        from src.llm_handler import get_llm_client
        from src.tts_handler import TTSHandler

        llm_client = get_llm_client()
        tts_handler = TTSHandler()

        streaming_handler = StreamingChatHandler(
            llm_client=llm_client,
            tts_handler=tts_handler
        )

        # Stream response
        return Response(
            streaming_handler.stream_chat_response(
                question=question,
                context=context,
                language=language,
                user_id=request.user_id
            ),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'X-Accel-Buffering': 'no'  # Disable Nginx buffering
            }
        )
