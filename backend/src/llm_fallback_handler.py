"""
LLM Fallback Handler with Multi-Provider Support
Supports: Groq, Cerebras, Google Gemini, SambaNova, DeepSeek, Mistral, OpenRouter, Cohere
Includes: Text and Vision models
Structured by Plan Tier: Free vs Pro

Performance Features:
- Connection timeout (30s) to prevent hanging requests
- Retry with exponential backoff for rate limits (429)
- Automatic provider cascade on failures
"""
import os
import logging
import time
from typing import Dict, Any, Optional, List
from openai import OpenAI
import httpx

logger = logging.getLogger(__name__)

# Timeout configuration
REQUEST_TIMEOUT = 30  # 30 seconds max per provider
MAX_RETRIES = 2  # Max retries for rate-limited requests
RETRY_BASE_DELAY = 1  # Base delay for exponential backoff (seconds)


# Provider tier configuration
# PRO_TIER: Best models, highest limits - for paid users
# FREE_TIER: Good models, free limits - for free users
# Note: Free tier has rate limits, fallback handles 429 errors automatically
PROVIDER_TIERS = {
    'pro': [
        'Groq',           # Fast, reliable, good limits
        'Cerebras',       # Ultra-fast, high free tier (fastest!)
        'Google Gemini',  # 1M context, very capable
        'Mistral',        # High quality European
    ],
    'free': [
        'Google Gemini',          # 1500 free requests/day, great multilingual
        'SambaNova',              # Free tier available
        # OpenRouter free models (verified from API Nov 2025)
        'OpenRouter-Grok',        # Grok 4.1 Fast - xAI (most reliable)
        'OpenRouter-Llama',       # Llama 3.3 70B - reliable
        'OpenRouter-Gemma',       # Gemma 3 27B - fast
        'OpenRouter-Mistral',     # Mistral Small 3.1 - vision
        'OpenRouter-Llama-405B',  # Hermes 3 Llama 405B - largest
        'OpenRouter-Qwen3',       # Qwen 3 235B - multilingual
        'OpenRouter-Gemini',      # Gemini 2.0 Flash - 1M context
        'Cohere',                 # Trial tier
        'Hugging Face',           # Free tier with limits
    ]
}


class LLMFallbackHandler:
    """
    Handles LLM requests with automatic fallback across multiple providers
    Supports plan-based routing (free vs pro users)
    """

    def __init__(self, config):
        """Initialize all LLM providers"""
        self.config = config
        self.providers = []
        self.providers_by_tier = {'pro': [], 'free': []}

        # Initialize all providers
        self._init_groq()
        self._init_cerebras()
        self._init_google_gemini()
        self._init_sambanova()
        self._init_deepseek()
        self._init_mistral()
        self._init_openrouter()
        self._init_cohere()
        self._init_huggingface()

        # Categorize by tier
        for provider in self.providers:
            if provider['name'] in PROVIDER_TIERS['pro']:
                self.providers_by_tier['pro'].append(provider)
            else:
                self.providers_by_tier['free'].append(provider)

        logger.info(f"LLM Fallback Handler initialized with {len(self.providers)} providers")
        logger.info(f"  Pro tier: {len(self.providers_by_tier['pro'])} providers")
        logger.info(f"  Free tier: {len(self.providers_by_tier['free'])} providers")
        for i, p in enumerate(self.providers):
            tier = 'PRO' if p['name'] in PROVIDER_TIERS['pro'] else 'FREE'
            logger.info(f"  {i+1}. [{tier}] {p['name']} ({p['text_model']})")

    def _create_client(self, api_key: str, base_url: str) -> OpenAI:
        """Create OpenAI client with timeout configuration"""
        return OpenAI(
            api_key=api_key,
            base_url=base_url,
            timeout=httpx.Timeout(REQUEST_TIMEOUT, connect=10.0),  # 30s total, 10s connect
            max_retries=0  # We handle retries ourselves for better control
        )

    def _init_groq(self):
        """Initialize Groq - Fast inference, good for Pro tier"""
        try:
            api_key = getattr(self.config, 'GROQ_API_KEY', None)
            if api_key:
                client = self._create_client(api_key, "https://api.groq.com/openai/v1")
                self.providers.append({
                    'name': 'Groq',
                    'client': client,
                    'text_model': 'llama-3.1-8b-instant',
                    'text_model_large': 'llama-3.3-70b-versatile',
                    'vision_model': None,
                    'max_tokens': 8000,
                    'max_context': 6000,  # TPM limit
                    'temperature': 0.7,
                    'tier': 'pro'
                })
                logger.info("[OK] Groq initialized")
        except Exception as e:
            logger.warning(f"Groq initialization failed: {e}")

    def _init_cerebras(self):
        """Initialize Cerebras - Ultra-fast, 1M tokens/day free"""
        try:
            api_key = getattr(self.config, 'CEREBRAS_API_KEY', None)
            if api_key:
                client = self._create_client(api_key, "https://api.cerebras.ai/v1")
                self.providers.append({
                    'name': 'Cerebras',
                    'client': client,
                    'text_model': 'llama3.1-8b',
                    'text_model_large': 'llama-3.3-70b',
                    'vision_model': None,
                    'max_tokens': 8000,
                    'max_context': 8192,
                    'temperature': 0.7,
                    'tier': 'pro'
                })
                logger.info("[OK] Cerebras initialized")
        except Exception as e:
            logger.warning(f"Cerebras initialization failed: {e}")

    def _init_google_gemini(self):
        """Initialize Google Gemini - 1M context window, very generous free tier"""
        try:
            api_key = getattr(self.config, 'GOOGLE_API_KEY', None)
            if api_key:
                client = self._create_client(api_key, "https://generativelanguage.googleapis.com/v1beta/openai/")
                self.providers.append({
                    'name': 'Google Gemini',
                    'client': client,
                    'text_model': 'gemini-2.0-flash',
                    'text_model_large': 'gemini-1.5-pro',
                    'vision_model': 'gemini-2.0-flash',
                    'max_tokens': 8000,
                    'max_context': 1000000,  # 1M context!
                    'temperature': 0.7,
                    'tier': 'pro'
                })
                logger.info("[OK] Google Gemini initialized (1M context)")
        except Exception as e:
            logger.warning(f"Google Gemini initialization failed: {e}")

    def _init_sambanova(self):
        """Initialize SambaNova - Good free tier"""
        try:
            api_key = getattr(self.config, 'SAMBANOVA_API_KEY', None)
            if api_key:
                client = self._create_client(api_key, "https://api.sambanova.ai/v1")
                self.providers.append({
                    'name': 'SambaNova',
                    'client': client,
                    'text_model': 'Meta-Llama-3.1-8B-Instruct',
                    'text_model_large': 'Meta-Llama-3.1-70B-Instruct',
                    'vision_model': 'Llama-3.2-11B-Vision-Instruct',
                    'max_tokens': 8000,
                    'max_context': 16000,
                    'temperature': 0.7,
                    'tier': 'free'
                })
                logger.info("[OK] SambaNova initialized")
        except Exception as e:
            logger.warning(f"SambaNova initialization failed: {e}")

    def _init_deepseek(self):
        """Initialize DeepSeek - Requires credits/payment, skipped for now"""
        # DeepSeek requires account balance - not free tier
        # Uncomment below if you have DeepSeek credits
        logger.info("[SKIP] DeepSeek skipped (requires payment)")
        return
        # try:
        #     api_key = getattr(self.config, 'DEEPSEEK_API_KEY', None)
        #     if api_key:
        #         client = OpenAI(
        #             api_key=api_key,
        #             base_url="https://api.deepseek.com/v1"
        #         )
        #         self.providers.append({
        #             'name': 'DeepSeek',
        #             'client': client,
        #             'text_model': 'deepseek-chat',
        #             'text_model_large': 'deepseek-chat',
        #             'vision_model': None,
        #             'max_tokens': 8000,
        #             'max_context': 64000,
        #             'temperature': 0.7,
        #             'tier': 'pro'
        #         })
        #         logger.info("[OK] DeepSeek initialized (no rate limits)")
        # except Exception as e:
        #     logger.warning(f"DeepSeek initialization failed: {e}")

    def _init_mistral(self):
        """Initialize Mistral - High quality, European"""
        try:
            api_key = getattr(self.config, 'MISTRAL_API_KEY', None)
            if api_key:
                client = self._create_client(api_key, "https://api.mistral.ai/v1")
                self.providers.append({
                    'name': 'Mistral',
                    'client': client,
                    'text_model': 'mistral-small-latest',
                    'text_model_large': 'mistral-large-latest',
                    'vision_model': 'pixtral-12b-2409',
                    'max_tokens': 8000,
                    'max_context': 32000,
                    'temperature': 0.7,
                    'tier': 'pro'
                })
                logger.info("[OK] Mistral initialized")
        except Exception as e:
            logger.warning(f"Mistral initialization failed: {e}")

    def _init_openrouter(self):
        """Initialize OpenRouter - Aggregator with multiple free models for better fallback"""
        try:
            api_key = getattr(self.config, 'OPENROUTER_API_KEY', None)
            if api_key:
                # Multiple free models from OpenRouter for better reliability
                # Each configured as a separate provider entry for automatic fallback
                # Verified from OpenRouter API Nov 2025
                # Note: Free tier has ~50 req/day limit, 429 errors trigger fallback
                free_models = [
                    {
                        # Grok 4.1 Fast - xAI's model, very reliable
                        'name': 'OpenRouter-Grok',
                        'text_model': 'x-ai/grok-4.1-fast:free',
                        'text_model_large': 'x-ai/grok-4.1-fast:free',
                        'vision_model': None,
                        'max_context': 131072,
                    },
                    {
                        # Llama 3.3 70B - Meta's latest, very reliable
                        'name': 'OpenRouter-Llama',
                        'text_model': 'meta-llama/llama-3.3-70b-instruct:free',
                        'text_model_large': 'meta-llama/llama-3.3-70b-instruct:free',
                        'vision_model': None,
                        'max_context': 128000,
                    },
                    {
                        # Gemma 3 27B - Google's efficient model
                        'name': 'OpenRouter-Gemma',
                        'text_model': 'google/gemma-3-27b-it:free',
                        'text_model_large': 'google/gemma-3-27b-it:free',
                        'vision_model': None,
                        'max_context': 96000,
                    },
                    {
                        # Mistral Small 3.1 - European, supports vision
                        'name': 'OpenRouter-Mistral',
                        'text_model': 'mistralai/mistral-small-3.1-24b-instruct:free',
                        'text_model_large': 'mistralai/mistral-small-3.1-24b-instruct:free',
                        'vision_model': 'mistralai/mistral-small-3.1-24b-instruct:free',
                        'max_context': 96000,
                    },
                    {
                        # Hermes 3 Llama 405B - Largest free model!
                        'name': 'OpenRouter-Llama-405B',
                        'text_model': 'nousresearch/hermes-3-llama-3.1-405b:free',
                        'text_model_large': 'nousresearch/hermes-3-llama-3.1-405b:free',
                        'vision_model': None,
                        'max_context': 128000,
                    },
                    {
                        # Qwen 3 235B - Alibaba's large model
                        'name': 'OpenRouter-Qwen3',
                        'text_model': 'qwen/qwen3-235b-a22b:free',
                        'text_model_large': 'qwen/qwen3-235b-a22b:free',
                        'vision_model': None,
                        'max_context': 40960,
                    },
                    {
                        # Gemini 2.0 Flash Exp - 1M context!
                        'name': 'OpenRouter-Gemini',
                        'text_model': 'google/gemini-2.0-flash-exp:free',
                        'text_model_large': 'google/gemini-2.0-flash-exp:free',
                        'vision_model': 'google/gemini-2.0-flash-exp:free',
                        'max_context': 1000000,
                    },
                ]

                client = self._create_client(api_key, "https://openrouter.ai/api/v1")

                for model_config in free_models:
                    self.providers.append({
                        'name': model_config['name'],
                        'client': client,
                        'text_model': model_config['text_model'],
                        'text_model_large': model_config['text_model_large'],
                        'vision_model': model_config['vision_model'],
                        'max_tokens': 8000,
                        'max_context': model_config['max_context'],
                        'temperature': 0.7,
                        'tier': 'free'
                    })

                logger.info(f"[OK] OpenRouter initialized with {len(free_models)} free models")
        except Exception as e:
            logger.warning(f"OpenRouter initialization failed: {e}")

    def _init_cohere(self):
        """Initialize Cohere - Good for RAG, trial tier available"""
        try:
            api_key = getattr(self.config, 'COHERE_API_KEY', None)
            if api_key:
                # Cohere uses its own SDK format, but has OpenAI-compatible endpoint
                client = self._create_client(api_key, "https://api.cohere.ai/compatibility/v1")
                self.providers.append({
                    'name': 'Cohere',
                    'client': client,
                    # Updated models - command-r was deprecated Sep 2025
                    'text_model': 'command-r-08-2024',
                    'text_model_large': 'command-r-plus-08-2024',
                    'vision_model': None,
                    'max_tokens': 4000,
                    'max_context': 128000,
                    'temperature': 0.7,
                    'tier': 'free'
                })
                logger.info("[OK] Cohere initialized")
        except Exception as e:
            logger.warning(f"Cohere initialization failed: {e}")

    def _init_huggingface(self):
        """Initialize Hugging Face - Free tier with limits"""
        try:
            api_key = getattr(self.config, 'HUGGINGFACE_API_TOKEN', None)
            if api_key:
                client = self._create_client(api_key, "https://router.huggingface.co/v1")
                self.providers.append({
                    'name': 'Hugging Face',
                    'client': client,
                    # Updated to Qwen models available on HF Inference API
                    'text_model': 'Qwen/Qwen2.5-7B-Instruct',
                    'text_model_large': 'Qwen/Qwen2.5-72B-Instruct',
                    'vision_model': None,
                    'max_tokens': 4000,
                    'max_context': 32000,
                    'temperature': 0.7,
                    'tier': 'free'
                })
                logger.info("[OK] Hugging Face initialized")
        except Exception as e:
            logger.warning(f"Hugging Face initialization failed: {e}")

    def _get_providers_for_plan(self, plan_type: str = 'free') -> List[Dict]:
        """Get providers available for a given plan type"""
        if plan_type in ['pro', 'premium', 'enterprise']:
            # Pro users get all providers (pro first, then free as fallback)
            return self.providers_by_tier['pro'] + self.providers_by_tier['free']
        else:
            # Free users only get free tier providers
            return self.providers_by_tier['free']

    def _is_complex_query(self, question: str) -> bool:
        """Determine if query is complex (needs larger model)"""
        complex_keywords = [
            'explain', 'why', 'how', 'analyze', 'compare', 'evaluate',
            'detailed', 'comprehensive', 'step by step', 'methodology',
            'summarize', 'summary'
        ]
        question_lower = question.lower()
        return any(keyword in question_lower for keyword in complex_keywords)

    def _build_messages(self, question: str, conversation_history: List[str],
                       system_prompt: Optional[str] = None) -> List[Dict[str, str]]:
        """Build message array for OpenAI-compatible API"""
        messages = []

        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        else:
            messages.append({
                "role": "system",
                "content": "You are a helpful AI assistant that answers questions based on the provided context. Be concise and accurate."
            })

        if conversation_history:
            # Limit history to last 4 messages to save tokens
            for i, msg in enumerate(conversation_history[-4:]):
                role = "user" if i % 2 == 0 else "assistant"
                messages.append({"role": role, "content": msg})

        messages.append({"role": "user", "content": question})
        return messages

    def _estimate_tokens(self, text: str) -> int:
        """Rough token estimation (1 token ≈ 4 chars)"""
        return len(text) // 4

    def query_text(self, question: str, conversation_history: List[str] = None,
                   system_prompt: Optional[str] = None,
                   max_tokens: int = 2000,
                   plan_type: str = 'free') -> Dict[str, Any]:
        """
        Query with automatic fallback across providers

        Args:
            question: User question
            conversation_history: Previous conversation messages
            system_prompt: Custom system prompt
            max_tokens: Maximum tokens to generate
            plan_type: User's plan type ('free', 'pro', 'premium')

        Returns:
            Dict with 'answer', 'provider', 'model', 'success'
        """
        if conversation_history is None:
            conversation_history = []

        # Get providers based on user's plan
        available_providers = self._get_providers_for_plan(plan_type)

        if not available_providers:
            # Fallback to all providers if none available for tier
            available_providers = self.providers

        # Estimate input tokens
        input_tokens = self._estimate_tokens(question)
        if system_prompt:
            input_tokens += self._estimate_tokens(system_prompt)
        for msg in conversation_history[-4:]:
            input_tokens += self._estimate_tokens(msg)

        logger.info(f"Query for {plan_type} user, ~{input_tokens} input tokens, {len(available_providers)} providers available")

        # Try each provider in order with retry logic
        last_error = None
        for i, provider in enumerate(available_providers):
            # Check if input exceeds provider's context limit
            if input_tokens > provider.get('max_context', 8000):
                logger.warning(f"{provider['name']} context limit ({provider.get('max_context')}) exceeded, skipping...")
                continue

            messages = self._build_messages(question, conversation_history, system_prompt)

            # Choose model based on query complexity
            use_large = self._is_complex_query(question) and plan_type != 'free'
            model = provider.get('text_model_large', provider['text_model']) if use_large else provider['text_model']

            # Retry loop with exponential backoff for rate limits
            for retry in range(MAX_RETRIES + 1):
                try:
                    if retry > 0:
                        delay = RETRY_BASE_DELAY * (2 ** (retry - 1))  # 1s, 2s, 4s...
                        logger.info(f"Retry {retry}/{MAX_RETRIES} for {provider['name']} after {delay}s...")
                        time.sleep(delay)

                    logger.info(f"Trying {provider['name']} ({model})...")

                    response = provider['client'].chat.completions.create(
                        model=model,
                        messages=messages,
                        max_tokens=max_tokens,
                        temperature=provider['temperature']
                    )

                    answer = response.choices[0].message.content
                    tokens_used = response.usage.total_tokens if hasattr(response, 'usage') and response.usage else 0

                    logger.info(f"[SUCCESS] {provider['name']} responded ({len(answer)} chars, {tokens_used} tokens)")

                    return {
                        'success': True,
                        'answer': answer,
                        'provider': provider['name'],
                        'model': model,
                        'tokens_used': tokens_used,
                        'tier': provider.get('tier', 'unknown')
                    }

                except Exception as e:
                    error_msg = str(e)
                    last_error = error_msg

                    # Check for specific errors
                    is_rate_limit = any(x in error_msg.lower() for x in ['rate', 'quota', '429', 'limit', 'exceeded'])
                    is_timeout = any(x in error_msg.lower() for x in ['timeout', 'timed out', 'connection'])
                    is_context_error = any(x in error_msg.lower() for x in ['context', 'token', '413', 'too large', 'maximum'])

                    # Only retry for rate limits and timeouts
                    if (is_rate_limit or is_timeout) and retry < MAX_RETRIES:
                        logger.warning(f"{provider['name']} {'rate limited' if is_rate_limit else 'timed out'}, will retry...")
                        continue
                    elif is_context_error:
                        logger.warning(f"{provider['name']} context exceeded, trying next provider...")
                        break  # Skip retries, try next provider
                    else:
                        logger.warning(f"{provider['name']} failed: {error_msg[:100]}")
                        break  # Skip retries, try next provider

            # If we exit the retry loop without success, try next provider
            if i < len(available_providers) - 1:
                logger.info(f"Moving to next provider...")
                continue

        # All providers failed
        logger.error("All providers failed!")
        return {
            'success': False,
            'answer': "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.",
            'provider': 'None',
            'model': 'None',
            'error': last_error or 'All providers failed'
        }

    def query_vision(self, question: str, image_data: Any,
                    conversation_history: List[str] = None,
                    system_prompt: Optional[str] = None,
                    plan_type: str = 'free') -> Dict[str, Any]:
        """Query vision models with automatic fallback"""
        if conversation_history is None:
            conversation_history = []

        # Get providers with vision support
        available_providers = self._get_providers_for_plan(plan_type)
        vision_providers = [p for p in available_providers if p.get('vision_model')]

        if not vision_providers:
            # Try all providers with vision
            vision_providers = [p for p in self.providers if p.get('vision_model')]

        if not vision_providers:
            return {
                'success': False,
                'answer': "Vision analysis is temporarily unavailable.",
                'provider': 'None',
                'model': 'None'
            }

        for i, provider in enumerate(vision_providers):
            try:
                logger.info(f"Trying {provider['name']} vision...")

                model = provider['vision_model']

                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})

                messages.append({
                    "role": "user",
                    "content": [
                        {"type": "text", "text": question},
                        {"type": "image_url", "image_url": {"url": image_data}}
                    ]
                })

                response = provider['client'].chat.completions.create(
                    model=model,
                    messages=messages,
                    max_tokens=2000
                )

                answer = response.choices[0].message.content
                logger.info(f"[SUCCESS] {provider['name']} vision responded")

                return {
                    'success': True,
                    'answer': answer,
                    'provider': provider['name'],
                    'model': model,
                    'tokens_used': response.usage.total_tokens if hasattr(response, 'usage') and response.usage else 0
                }

            except Exception as e:
                logger.warning(f"{provider['name']} vision failed: {e}")
                if i == len(vision_providers) - 1:
                    return {
                        'success': False,
                        'answer': "Vision analysis failed. Please try again.",
                        'provider': 'None',
                        'model': 'None',
                        'error': str(e)
                    }
                continue

        return {
            'success': False,
            'answer': "Vision analysis unavailable.",
            'provider': 'None',
            'model': 'None'
        }

    def stream_text(self, question: str, conversation_history: List[str] = None,
                   system_prompt: Optional[str] = None,
                   max_tokens: int = 2000,
                   plan_type: str = 'free'):
        """
        Stream text response with automatic fallback across providers

        Yields chunks as they arrive for real-time streaming UX.
        Falls back to next provider on failure.

        Args:
            question: User question
            conversation_history: Previous conversation messages
            system_prompt: Custom system prompt
            max_tokens: Maximum tokens to generate
            plan_type: User's plan type ('free', 'pro', 'premium')

        Yields:
            Dict with 'type' ('chunk', 'done', 'error'), 'content', 'provider', 'model'
        """
        if conversation_history is None:
            conversation_history = []

        available_providers = self._get_providers_for_plan(plan_type)
        if not available_providers:
            available_providers = self.providers

        messages = self._build_messages(question, conversation_history, system_prompt)
        last_error = None

        for i, provider in enumerate(available_providers):
            try:
                use_large = self._is_complex_query(question) and plan_type != 'free'
                model = provider.get('text_model_large', provider['text_model']) if use_large else provider['text_model']

                logger.info(f"Streaming from {provider['name']} ({model})...")

                # Create streaming request
                stream = provider['client'].chat.completions.create(
                    model=model,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=provider['temperature'],
                    stream=True
                )

                # Yield chunks as they arrive
                full_response = ""
                for chunk in stream:
                    if chunk.choices and chunk.choices[0].delta.content:
                        content = chunk.choices[0].delta.content
                        full_response += content
                        yield {
                            'type': 'chunk',
                            'content': content,
                            'provider': provider['name'],
                            'model': model
                        }

                # Yield completion
                logger.info(f"[STREAM SUCCESS] {provider['name']} - {len(full_response)} chars")
                yield {
                    'type': 'done',
                    'content': full_response,
                    'provider': provider['name'],
                    'model': model
                }
                return  # Success, exit generator

            except Exception as e:
                error_msg = str(e)
                last_error = error_msg
                logger.warning(f"{provider['name']} streaming failed: {error_msg[:100]}")

                # Check if retryable
                is_rate_limit = any(x in error_msg.lower() for x in ['rate', 'quota', '429', 'limit'])
                is_timeout = any(x in error_msg.lower() for x in ['timeout', 'timed out'])

                if (is_rate_limit or is_timeout) and i < len(available_providers) - 1:
                    logger.info(f"Falling back to next provider...")
                    continue
                elif i < len(available_providers) - 1:
                    continue

        # All providers failed
        logger.error("All streaming providers failed!")
        yield {
            'type': 'error',
            'content': "I apologize, but I'm experiencing technical difficulties. Please try again.",
            'error': last_error or 'All providers failed'
        }

    def get_provider_status(self) -> Dict[str, Any]:
        """Get status of all providers"""
        return {
            'total_providers': len(self.providers),
            'pro_providers': len(self.providers_by_tier['pro']),
            'free_providers': len(self.providers_by_tier['free']),
            'providers': [
                {
                    'name': p['name'],
                    'tier': p.get('tier', 'unknown'),
                    'text_model': p['text_model'],
                    'vision_model': p.get('vision_model', 'None'),
                    'max_context': p.get('max_context', 'Unknown')
                }
                for p in self.providers
            ]
        }
