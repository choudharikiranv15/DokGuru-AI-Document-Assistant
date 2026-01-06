"""
Comprehensive Input Validation Module
Provides secure validation for all user inputs
"""
import re
import bleach
from typing import Tuple, Optional
import magic
import PyPDF2
from io import BytesIO

# Email validation with disposable domain blocking
DISPOSABLE_DOMAINS = {
    '10minutemail.com', 'tempmail.com', 'guerrillamail.com',
    'mailinator.com', 'throwaway.email', 'yopmail.com',
    'temp-mail.org', 'fakeinbox.com', 'trashmail.com',
    'getnada.com', 'maildrop.cc', 'sharklasers.com'
}

# Common weak passwords
COMMON_PASSWORDS = {
    'password', 'password123', '12345678', 'qwerty', 'abc123',
    'password1', '123456', '1234567890', 'letmein', 'welcome',
    'monkey', 'dragon', 'master', 'sunshine', 'princess',
    'admin', 'admin123', 'root', 'toor', 'pass'
}

def validate_email(email: str) -> Tuple[bool, str]:
    """
    Comprehensive email validation

    Args:
        email: Email address to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not email:
        return False, "Email is required"

    # Length check
    if len(email) > 254:  # RFC 5321
        return False, "Email address is too long"

    # Format validation
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        return False, "Invalid email format"

    # Split and validate parts
    try:
        local, domain = email.rsplit('@', 1)
    except ValueError:
        return False, "Invalid email format"

    # Local part validation
    if len(local) > 64:  # RFC 5321
        return False, "Email local part is too long"

    # Check for disposable email domains
    if domain.lower() in DISPOSABLE_DOMAINS:
        return False, "Disposable email addresses are not allowed"

    # Reject plus addressing (optional - uncomment if needed)
    # if '+' in local:
    #     return False, "Email aliases with '+' are not allowed"

    return True, "Valid email"


def validate_password(password: str) -> Tuple[bool, str]:
    """
    Comprehensive password strength validation
    Enforces strong password requirements

    Args:
        password: Password to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not password:
        return False, "Password is required"

    # Minimum length
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"

    # Maximum length (prevent DoS)
    if len(password) > 128:
        return False, "Password is too long (maximum 128 characters)"

    # Require uppercase letter
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"

    # Require lowercase letter
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"

    # Require digit
    if not re.search(r'[0-9]', password):
        return False, "Password must contain at least one number"

    # Require special character
    if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/;\'`~]', password):
        return False, "Password must contain at least one special character (!@#$%^&* etc.)"

    # Check for common passwords
    if password.lower() in COMMON_PASSWORDS:
        return False, "This password is too common. Please choose a stronger password"

    # Check for repeated characters
    if re.search(r'(.)\1{2,}', password):
        return False, "Password contains too many repeated characters"

    # Check for sequential characters
    sequences = ['abcd', '1234', 'qwerty', 'asdf', 'zxcv']
    for seq in sequences:
        if seq in password.lower():
            return False, f"Password contains sequential characters ({seq})"

    return True, "Strong password"


def validate_pdf_file(file_obj) -> Tuple[bool, str]:
    """
    Comprehensive PDF file validation
    Checks MIME type, magic bytes, and PDF structure

    Args:
        file_obj: File object to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    try:
        # Save current position
        current_pos = file_obj.tell()

        # Read first 2048 bytes for magic detection
        header = file_obj.read(2048)
        file_obj.seek(current_pos)

        # Check magic bytes using python-magic
        try:
            mime = magic.from_buffer(header, mime=True)
            if mime != 'application/pdf':
                return False, f"File is not a PDF. Detected type: {mime}"
        except Exception as e:
            # Fallback to manual PDF signature check
            if not header.startswith(b'%PDF-'):
                return False, "File does not have a valid PDF signature"

        # Try to parse as PDF using PyPDF2
        try:
            # Reset to start
            file_obj.seek(0)
            pdf_reader = PyPDF2.PdfReader(file_obj)

            # Check if PDF is encrypted
            if pdf_reader.is_encrypted:
                file_obj.seek(current_pos)
                return False, "Encrypted PDFs are not supported"

            # Check if PDF has pages
            if len(pdf_reader.pages) == 0:
                file_obj.seek(current_pos)
                return False, "PDF file has no pages"

            # Check for suspicious JavaScript (potential malware)
            for page in pdf_reader.pages[:10]:  # Check first 10 pages
                if '/JS' in str(page) or '/JavaScript' in str(page):
                    file_obj.seek(current_pos)
                    return False, "PDF contains JavaScript which is not allowed for security reasons"

            # Reset file position
            file_obj.seek(current_pos)

        except PyPDF2.errors.PdfReadError as e:
            file_obj.seek(current_pos)
            return False, f"Corrupted or invalid PDF: {str(e)}"
        except Exception as e:
            file_obj.seek(current_pos)
            return False, f"PDF validation error: {str(e)}"

        return True, "Valid PDF file"

    except Exception as e:
        return False, f"File validation error: {str(e)}"


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent directory traversal and other attacks

    Args:
        filename: Original filename

    Returns:
        Sanitized filename
    """
    if not filename:
        return "unnamed_file.pdf"

    # Remove any path components
    filename = filename.split('/')[-1].split('\\')[-1]

    # Remove dangerous characters
    filename = re.sub(r'[^\w\s.-]', '', filename)

    # Remove leading/trailing dots and spaces
    filename = filename.strip('. ')

    # Prevent directory traversal
    if '..' in filename or filename.startswith('.'):
        filename = filename.replace('..', '')

    # Ensure it has a PDF extension
    if not filename.lower().endswith('.pdf'):
        filename = filename + '.pdf'

    # Limit length
    if len(filename) > 255:
        name_part = filename[:-4]  # Remove .pdf
        filename = name_part[:251] + '.pdf'

    return filename or "unnamed_file.pdf"


def sanitize_html_output(text: str, allow_markdown: bool = False) -> str:
    """
    Sanitize text to prevent XSS attacks

    Args:
        text: Text to sanitize
        allow_markdown: If True, allow safe markdown tags

    Returns:
        Sanitized text
    """
    if not text:
        return ""

    # Define allowed tags based on mode
    if allow_markdown:
        allowed_tags = [
            'p', 'br', 'strong', 'em', 'b', 'i', 'u',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
            'a', 'span'
        ]
        allowed_attrs = {
            'a': ['href', 'title'],
            'code': ['class'],
            'pre': ['class']
        }
    else:
        # Minimal HTML allowed
        allowed_tags = ['b', 'i', 'u', 'strong', 'em', 'code', 'pre', 'br']
        allowed_attrs = {}

    # Sanitize using bleach
    cleaned = bleach.clean(
        text,
        tags=allowed_tags,
        attributes=allowed_attrs,
        strip=True,
        strip_comments=True
    )

    # Additional XSS prevention
    # Remove javascript: protocol
    cleaned = re.sub(r'javascript:', '', cleaned, flags=re.IGNORECASE)

    # Remove on* event handlers
    cleaned = re.sub(r'\bon\w+\s*=', '', cleaned, flags=re.IGNORECASE)

    return cleaned


def validate_query_text(text: str, max_length: int = 10000) -> Tuple[bool, str]:
    """
    Validate query/chat text

    Args:
        text: Query text to validate
        max_length: Maximum allowed length

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not text or not text.strip():
        return False, "Query text is required"

    if len(text) > max_length:
        return False, f"Query is too long. Maximum {max_length} characters allowed"

    # Check for null bytes (can cause issues)
    if '\x00' in text:
        return False, "Query contains invalid characters"

    return True, "Valid query"


def validate_tts_text(text: str, max_length: int = 5000) -> Tuple[bool, str]:
    """
    Validate text-to-speech input

    Args:
        text: TTS text to validate
        max_length: Maximum allowed length

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not text or not text.strip():
        return False, "Text is required for speech synthesis"

    if len(text) > max_length:
        return False, f"Text is too long. Maximum {max_length} characters allowed"

    # Check for excessive repetition (potential abuse)
    words = text.split()
    if len(words) > 10:
        unique_words = set(words)
        repetition_ratio = len(unique_words) / len(words)
        if repetition_ratio < 0.3:  # Less than 30% unique words
            return False, "Text contains excessive repetition"

    return True, "Valid TTS text"


def validate_document_name(name: str) -> Tuple[bool, str]:
    """
    Validate document name

    Args:
        name: Document name to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not name:
        return False, "Document name is required"

    # Check length
    if len(name) > 255:
        return False, "Document name is too long (max 255 characters)"

    # Check for directory traversal
    if '..' in name or '/' in name or '\\' in name:
        return False, "Invalid document name"

    # Check for null bytes
    if '\x00' in name:
        return False, "Document name contains invalid characters"

    # Must be a PDF
    if not name.lower().endswith('.pdf'):
        return False, "Document must be a PDF file"

    return True, "Valid document name"


def sanitize_sql_input(text: str) -> str:
    """
    Basic SQL injection prevention for text search
    Note: Always use parameterized queries as primary defense

    Args:
        text: Text to sanitize

    Returns:
        Sanitized text
    """
    if not text:
        return ""

    # Remove SQL comment markers
    text = text.replace('--', '').replace('/*', '').replace('*/', '')

    # Remove common SQL injection patterns
    dangerous_patterns = [
        r"(\bOR\b|\bAND\b)\s+['\"]?\d+['\"]?\s*=\s*['\"]?\d+['\"]?",  # OR 1=1
        r";\s*(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|EXEC)",  # Command injection
        r"UNION\s+SELECT",  # Union-based injection
        r"<script",  # XSS attempt
        r"javascript:",  # XSS attempt
    ]

    for pattern in dangerous_patterns:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)

    # Limit length
    if len(text) > 500:
        text = text[:500]

    return text.strip()


def validate_uuid(uuid_str: str) -> Tuple[bool, str]:
    """
    Validate UUID format

    Args:
        uuid_str: UUID string to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not uuid_str:
        return False, "ID is required"

    # UUID v4 pattern
    pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'

    if not re.match(pattern, uuid_str.lower()):
        return False, "Invalid ID format"

    return True, "Valid ID"


def validate_language_code(code: str) -> Tuple[bool, str]:
    """
    Validate language code

    Args:
        code: Language code (e.g., 'en', 'hi', 'es')

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not code:
        return False, "Language code is required"

    # Should be 2-3 letter code
    if not re.match(r'^[a-z]{2,3}(-[A-Z]{2})?$', code):
        return False, "Invalid language code format"

    return True, "Valid language code"


def validate_file_size(file_obj, max_size_mb: int = 50) -> Tuple[bool, str]:
    """
    Validate file size

    Args:
        file_obj: File object to check
        max_size_mb: Maximum size in megabytes

    Returns:
        Tuple of (is_valid, error_message)
    """
    try:
        # Seek to end to get size
        current_pos = file_obj.tell()
        file_obj.seek(0, 2)  # Seek to end
        size = file_obj.tell()
        file_obj.seek(current_pos)  # Reset position

        max_size_bytes = max_size_mb * 1024 * 1024

        if size == 0:
            return False, "File is empty"

        if size > max_size_bytes:
            size_mb = size / (1024 * 1024)
            return False, f"File is too large ({size_mb:.1f}MB). Maximum allowed is {max_size_mb}MB"

        return True, "Valid file size"

    except Exception as e:
        return False, f"Error checking file size: {str(e)}"
