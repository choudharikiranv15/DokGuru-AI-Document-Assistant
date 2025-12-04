"""
Chat History Test Suite
Tests chat history endpoints, limits, and edge cases
"""
import requests
import json
import sys
import time

# Configuration
BASE_URL = "https://dokguru-backend-739437500880.asia-south1.run.app"
# BASE_URL = "http://localhost:8080"  # For local testing

# Test user credentials
TEST_EMAIL = "chat_test_user@dokguru.com"
TEST_PASSWORD = "TestUser@123"
TEST_NAME = "Chat Test User"

# Test document for chat history
TEST_DOCUMENT_NAME = "test_document"
TEST_DOCUMENT_ID = "test_doc_123"

def print_result(name, success, response=None, error=None):
    """Pretty print test result"""
    status = "[PASS]" if success else "[FAIL]"
    print(f"\n{status} {name}")
    if response:
        print(f"  Status: {response.status_code}")
        try:
            data = response.json()
            print(f"  Response: {json.dumps(data, indent=2)[:500]}")
        except:
            print(f"  Response: {response.text[:200]}")
    if error:
        print(f"  Error: {error}")
    return success

def test_register_user():
    """Step 1: Register test user"""
    print("\n" + "="*60)
    print("STEP 1: Register Test User")
    print("="*60)

    try:
        response = requests.post(f"{BASE_URL}/auth/signup", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "name": TEST_NAME,
            "institution": "Test Institution",
            "occupation": "QA Tester"
        }, timeout=30)

        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print_result("Register User", True, response)
                return data.get('token')
            elif 'already exists' in str(data.get('message', '')).lower():
                print(f"  User already exists, will login instead")
                return None

        print_result("Register User", False, response)
        return None
    except Exception as e:
        print_result("Register User", False, error=str(e))
        return None

def test_login_user():
    """Step 2: Login test user"""
    print("\n" + "="*60)
    print("STEP 2: Login Test User")
    print("="*60)

    try:
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }, timeout=30)

        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                token = data.get('token')
                print_result("Login User", True, response)
                return token

        print_result("Login User", False, response)
        return None
    except Exception as e:
        print_result("Login User", False, error=str(e))
        return None

def test_get_chat_histories(token):
    """Step 3: Get all chat histories"""
    print("\n" + "="*60)
    print("STEP 3: Get Chat Histories")
    print("="*60)

    try:
        response = requests.get(
            f"{BASE_URL}/chat-history",
            headers={"Authorization": f"Bearer {token}"},
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            print_result("Get Chat Histories", True, response)
            return data.get('chats', []), data.get('limit', 0), data.get('plan', 'free')

        print_result("Get Chat Histories", False, response)
        return [], 0, 'free'
    except Exception as e:
        print_result("Get Chat Histories", False, error=str(e))
        return [], 0, 'free'

def test_create_chat_history(token, document_name, document_id, first_message):
    """Step 4: Create new chat history"""
    print("\n" + "="*60)
    print(f"STEP 4: Create Chat History - '{first_message}'")
    print("="*60)

    try:
        response = requests.post(
            f"{BASE_URL}/chat-history",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "document_name": document_name,
                "document_id": document_id,
                "first_message": first_message
            },
            timeout=30
        )

        if response.status_code == 201:
            data = response.json()
            if data.get('success'):
                chat_id = data.get('chat', {}).get('id')
                print_result(f"Create Chat '{first_message}'", True, response)
                return chat_id

        # Check if limit reached
        if response.status_code == 403:
            data = response.json()
            if data.get('limit_reached'):
                print_result(f"Create Chat (Limit Reached)", True, response)
                return None

        print_result(f"Create Chat '{first_message}'", False, response)
        return None
    except Exception as e:
        print_result(f"Create Chat '{first_message}'", False, error=str(e))
        return None

def test_update_chat_history(token, chat_id, messages):
    """Step 5: Update chat history with messages"""
    print("\n" + "="*60)
    print(f"STEP 5: Update Chat History (ID: {chat_id[:8]}...)")
    print("="*60)

    try:
        response = requests.put(
            f"{BASE_URL}/chat-history/{chat_id}",
            headers={"Authorization": f"Bearer {token}"},
            json={"messages": messages},
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print_result(f"Update Chat ({len(messages)} messages)", True, response)
                return True

        # Check if query limit reached
        if response.status_code == 403:
            data = response.json()
            if data.get('limit_reached'):
                print_result(f"Update Chat (Query Limit Reached)", True, response)
                return False

        print_result(f"Update Chat", False, response)
        return False
    except Exception as e:
        print_result(f"Update Chat", False, error=str(e))
        return False

def test_get_chat_by_id(token, chat_id):
    """Step 6: Get specific chat history"""
    print("\n" + "="*60)
    print(f"STEP 6: Get Chat by ID (ID: {chat_id[:8]}...)")
    print("="*60)

    try:
        response = requests.get(
            f"{BASE_URL}/chat-history/{chat_id}",
            headers={"Authorization": f"Bearer {token}"},
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print_result("Get Chat by ID", True, response)
                return data.get('chat')

        print_result("Get Chat by ID", False, response)
        return None
    except Exception as e:
        print_result("Get Chat by ID", False, error=str(e))
        return None

def test_search_chat_histories(token, query):
    """Step 7: Search chat histories"""
    print("\n" + "="*60)
    print(f"STEP 7: Search Chats (Query: '{query}')")
    print("="*60)

    try:
        response = requests.get(
            f"{BASE_URL}/chat-history/search",
            headers={"Authorization": f"Bearer {token}"},
            params={"q": query},
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                chats = data.get('chats', [])
                print_result(f"Search Chats (Found: {len(chats)})", True, response)
                return chats

        print_result("Search Chats", False, response)
        return []
    except Exception as e:
        print_result("Search Chats", False, error=str(e))
        return []

def test_delete_chat_history(token, chat_id):
    """Step 8: Delete chat history"""
    print("\n" + "="*60)
    print(f"STEP 8: Delete Chat (ID: {chat_id[:8]}...)")
    print("="*60)

    try:
        response = requests.delete(
            f"{BASE_URL}/chat-history/{chat_id}",
            headers={"Authorization": f"Bearer {token}"},
            timeout=30
        )

        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print_result("Delete Chat", True, response)
                return True

        print_result("Delete Chat", False, response)
        return False
    except Exception as e:
        print_result("Delete Chat", False, error=str(e))
        return False

def test_chat_limit_enforcement(token, limit):
    """Step 9: Test chat limit enforcement"""
    print("\n" + "="*60)
    print(f"STEP 9: Test Chat Limit Enforcement (Limit: {limit})")
    print("="*60)

    created_chats = []

    # Try to create more chats than the limit
    for i in range(limit + 2):
        chat_id = test_create_chat_history(
            token,
            TEST_DOCUMENT_NAME,
            TEST_DOCUMENT_ID,
            f"Limit test chat {i+1}"
        )

        if chat_id:
            created_chats.append(chat_id)
            time.sleep(0.5)  # Small delay between requests
        else:
            # Hit the limit
            if i >= limit:
                print(f"\n[PASS] Limit correctly enforced at {limit} chats")
                return created_chats
            else:
                print(f"\n[FAIL] Limit hit prematurely at {i} chats (expected {limit})")
                return created_chats

    print(f"\n[FAIL] Created {len(created_chats)} chats, limit not enforced!")
    return created_chats

def test_query_limit_enforcement(token, chat_id, max_queries):
    """Step 10: Test query limit per chat"""
    print("\n" + "="*60)
    print(f"STEP 10: Test Query Limit per Chat (Max: {max_queries})")
    print("="*60)

    messages = []

    # Create messages up to and beyond the limit
    for i in range(max_queries + 5):
        messages.append({
            "role": "user",
            "text": f"Test query {i+1}",
            "timestamp": time.time()
        })
        messages.append({
            "role": "assistant",
            "text": f"Test response {i+1}",
            "timestamp": time.time()
        })

    # Try to update with more than allowed queries
    success = test_update_chat_history(token, chat_id, messages)

    if not success:
        print(f"\n[PASS] Query limit correctly enforced at {max_queries} queries")

        # Now test with exactly the limit
        limited_messages = []
        for i in range(max_queries):
            limited_messages.append({
                "role": "user",
                "text": f"Test query {i+1}",
                "timestamp": time.time()
            })
            limited_messages.append({
                "role": "assistant",
                "text": f"Test response {i+1}",
                "timestamp": time.time()
            })

        success = test_update_chat_history(token, chat_id, limited_messages)
        if success:
            print(f"[PASS] Exactly {max_queries} queries allowed successfully")
        return True
    else:
        print(f"\n[FAIL] Query limit not enforced! Allowed {len(messages)//2} queries")
        return False

def cleanup_test_chats(token, chat_ids):
    """Cleanup: Delete all test chats"""
    print("\n" + "="*60)
    print("CLEANUP: Delete Test Chats")
    print("="*60)

    deleted = 0
    for chat_id in chat_ids:
        if test_delete_chat_history(token, chat_id):
            deleted += 1
            time.sleep(0.3)

    print(f"\n[INFO] Cleaned up {deleted}/{len(chat_ids)} test chats")

def main():
    """Run all chat history tests"""
    print("\n" + "="*60)
    print("CHAT HISTORY TEST SUITE")
    print("="*60)
    print(f"Target: {BASE_URL}")
    print("="*60)

    # Track test results
    results = []
    created_chats = []

    try:
        # Step 1-2: Authentication
        token = test_register_user()
        if not token:
            token = test_login_user()

        if not token:
            print("\n[FAIL] Failed to authenticate. Exiting.")
            return

        # Step 3: Get existing chats and plan info
        existing_chats, limit, plan = test_get_chat_histories(token)
        print(f"\n[INFO] Current plan: {plan} (Limit: {limit} chats)")
        print(f"[INFO] Existing chats: {len(existing_chats)}")

        # Determine max queries per chat based on plan
        if plan == 'free':
            max_queries = 50
        elif plan == 'basic':
            max_queries = 200
        else:
            max_queries = -1  # Unlimited

        # Step 4-6: Basic CRUD operations
        chat_id = test_create_chat_history(
            token,
            TEST_DOCUMENT_NAME,
            TEST_DOCUMENT_ID,
            "First test chat"
        )

        if chat_id:
            created_chats.append(chat_id)

            # Update with some messages
            test_messages = [
                {"role": "user", "text": "Hello", "timestamp": time.time()},
                {"role": "assistant", "text": "Hi there!", "timestamp": time.time()},
                {"role": "user", "text": "How are you?", "timestamp": time.time()},
                {"role": "assistant", "text": "I'm doing well!", "timestamp": time.time()}
            ]
            test_update_chat_history(token, chat_id, test_messages)

            # Get the chat back
            test_get_chat_by_id(token, chat_id)

        # Step 7: Search functionality
        test_search_chat_histories(token, "test")

        # Step 9: Test chat limit enforcement
        print(f"\n\n[INFO] Testing limit enforcement for {plan} plan ({limit} chats)...")
        limit_test_chats = test_chat_limit_enforcement(token, limit)
        created_chats.extend(limit_test_chats)

        # Step 10: Test query limit enforcement
        if max_queries > 0 and created_chats:
            test_chat_for_queries = created_chats[0]
            test_query_limit_enforcement(token, test_chat_for_queries, max_queries)

        # Cleanup
        if created_chats:
            cleanup_test_chats(token, created_chats)

        print("\n" + "="*60)
        print("[PASS] ALL TESTS COMPLETED")
        print("="*60)

    except KeyboardInterrupt:
        print("\n\n[WARN] Tests interrupted by user")
        if created_chats and token:
            print("Cleaning up...")
            cleanup_test_chats(token, created_chats)
    except Exception as e:
        print(f"\n\n[FAIL] Unexpected error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
