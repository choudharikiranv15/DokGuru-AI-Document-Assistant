"""
Subscription Plans Configuration
Defines limits for each plan tier
"""

PLAN_LIMITS = {
    'free': {
        'max_documents': 3,
        'max_queries_per_day': 20,
        'max_chat_histories': 5,          # Max 5 saved chat sessions
        'max_queries_per_chat': 50,       # Max 50 queries per chat session
        'chat_history_retention_days': 7,  # Chats deleted after 7 days
        'features': {
            'voice_input': True,
            'multilingual': False,
            'streaming_mode': False,
            'audio_generation': True,
            'priority_support': False
        }
    },
    'basic': {
        'max_documents': 10,
        'max_queries_per_day': 100,
        'max_chat_histories': 20,         # Max 20 saved chat sessions
        'max_queries_per_chat': 200,      # Max 200 queries per chat session
        'chat_history_retention_days': 30, # Chats deleted after 30 days
        'features': {
            'voice_input': True,
            'multilingual': True,
            'streaming_mode': True,
            'audio_generation': True,
            'priority_support': False
        }
    },
    'premium': {
        'max_documents': 50,
        'max_queries_per_day': 500,
        'max_chat_histories': 100,        # Max 100 saved chat sessions
        'max_queries_per_chat': 1000,     # Max 1000 queries per chat session
        'chat_history_retention_days': 90, # Chats deleted after 90 days
        'features': {
            'voice_input': True,
            'multilingual': True,
            'streaming_mode': True,
            'audio_generation': True,
            'priority_support': True
        }
    },
    'enterprise': {
        'max_documents': -1,              # Unlimited
        'max_queries_per_day': -1,        # Unlimited
        'max_chat_histories': -1,         # Unlimited
        'max_queries_per_chat': -1,       # Unlimited
        'chat_history_retention_days': -1, # Never deleted
        'features': {
            'voice_input': True,
            'multilingual': True,
            'streaming_mode': True,
            'audio_generation': True,
            'priority_support': True,
            'custom_models': True,
            'api_access': True
        }
    }
}

def get_plan_limits(plan_type: str) -> dict:
    """
    Get limits for a specific plan

    Args:
        plan_type: Plan name (free, basic, premium, enterprise)

    Returns:
        Dictionary with plan limits
    """
    return PLAN_LIMITS.get(plan_type.lower(), PLAN_LIMITS['free'])

def check_limit(plan_type: str, limit_name: str, current_value: int) -> tuple:
    """
    Check if user has reached a limit

    Args:
        plan_type: User's plan (free, basic, premium, enterprise)
        limit_name: Name of the limit to check (e.g., 'max_chat_histories')
        current_value: Current count for the user

    Returns:
        (allowed: bool, limit: int, message: str)
    """
    limits = get_plan_limits(plan_type)
    max_limit = limits.get(limit_name, 0)

    # -1 means unlimited
    if max_limit == -1:
        return (True, -1, "")

    if current_value >= max_limit:
        return (
            False,
            max_limit,
            f"You've reached the {limit_name} limit ({max_limit}) for your {plan_type} plan. Please upgrade to continue."
        )

    return (True, max_limit, "")

def get_upgrade_message(plan_type: str, feature: str) -> str:
    """
    Get upgrade message for a specific feature

    Args:
        plan_type: Current plan
        feature: Feature name

    Returns:
        Upgrade message string
    """
    messages = {
        'max_chat_histories': f"Your {plan_type} plan allows limited chat history. Upgrade for more!",
        'max_queries_per_chat': f"You've reached the query limit for this chat. Start a new chat or upgrade your plan.",
        'max_documents': f"Document limit reached. Upgrade to {get_next_plan(plan_type)} for more documents.",
        'max_queries_per_day': f"Daily query limit reached. Upgrade for unlimited queries!"
    }
    return messages.get(feature, f"Upgrade to {get_next_plan(plan_type)} for more features!")

def get_next_plan(current_plan: str) -> str:
    """Get the next plan tier"""
    plan_order = ['free', 'basic', 'premium', 'enterprise']
    try:
        current_index = plan_order.index(current_plan.lower())
        if current_index < len(plan_order) - 1:
            return plan_order[current_index + 1]
    except ValueError:
        pass
    return 'premium'
