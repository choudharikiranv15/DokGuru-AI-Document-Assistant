/**
 * Frontend Security Utilities
 * Provides input sanitization and XSS protection
 */

/**
 * Sanitize HTML string to prevent XSS attacks
 * Removes dangerous tags and attributes while keeping safe formatting
 *
 * @param {string} html - HTML string to sanitize
 * @param {object} options - Sanitization options
 * @returns {string} - Sanitized HTML
 */
export function sanitizeHTML(html, options = {}) {
  if (!html) return '';

  const {
    allowedTags = ['b', 'i', 'em', 'strong', 'u', 'p', 'br', 'span', 'div', 'code', 'pre'],
    allowedAttributes = ['class', 'id'],
    stripAll = false
  } = options;

  // If stripAll is true, remove all HTML tags
  if (stripAll) {
    return html.replace(/<[^>]*>/g, '');
  }

  // Create a temporary div element to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Recursive function to sanitize nodes
  function sanitizeNode(node) {
    // Text nodes are safe
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }

    // Only process element nodes
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const tagName = node.tagName.toLowerCase();

    // Check if tag is allowed
    if (!allowedTags.includes(tagName)) {
      // Return inner content without the tag
      return Array.from(node.childNodes).map(sanitizeNode).join('');
    }

    // Create sanitized version of allowed tag
    let result = `<${tagName}`;

    // Add allowed attributes
    for (const attr of node.attributes) {
      if (allowedAttributes.includes(attr.name.toLowerCase())) {
        // Escape attribute values
        const escapedValue = escapeHTML(attr.value);
        result += ` ${attr.name}="${escapedValue}"`;
      }
    }

    result += '>';

    // Recursively sanitize children
    result += Array.from(node.childNodes).map(sanitizeNode).join('');

    result += `</${tagName}>`;

    return result;
  }

  return Array.from(temp.childNodes).map(sanitizeNode).join('');
}

/**
 * Escape HTML special characters to prevent XSS
 * Use this for displaying user input as text
 *
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
export function escapeHTML(str) {
  if (!str) return '';

  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  return String(str).replace(/[&<>"'/]/g, (char) => escapeMap[char]);
}

/**
 * Sanitize URL to prevent javascript: and data: URLs
 * Only allows http:, https:, and mailto: protocols
 *
 * @param {string} url - URL to sanitize
 * @returns {string} - Sanitized URL or empty string if dangerous
 */
export function sanitizeURL(url) {
  if (!url) return '';

  const urlStr = String(url).trim().toLowerCase();

  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  if (dangerousProtocols.some(protocol => urlStr.startsWith(protocol))) {
    console.warn('Blocked dangerous URL protocol:', urlStr);
    return '';
  }

  // Allow only safe protocols
  const safeProtocols = ['http:', 'https:', 'mailto:', 'tel:', 'sms:'];
  const hasProtocol = safeProtocols.some(protocol => urlStr.startsWith(protocol));

  // If no protocol or relative URL, it's safe
  if (!urlStr.includes(':') || hasProtocol) {
    return url;
  }

  // Unknown protocol - block it
  console.warn('Blocked URL with unknown protocol:', urlStr);
  return '';
}

/**
 * Validate and sanitize user input for search queries
 * Prevents SQL injection and other attacks
 *
 * @param {string} query - Search query
 * @param {object} options - Validation options
 * @returns {string} - Sanitized query
 */
export function sanitizeSearchQuery(query, options = {}) {
  if (!query) return '';

  const {
    maxLength = 500,
    allowSpecialChars = false
  } = options;

  let sanitized = String(query).trim();

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Remove dangerous SQL patterns
  const sqlPatterns = [
    /;\s*(DROP|DELETE|UPDATE|INSERT|EXEC|UNION)/gi,
    /--/g,
    /\/\*/g,
    /\*\//g
  ];

  for (const pattern of sqlPatterns) {
    sanitized = sanitized.replace(pattern, '');
  }

  // If special chars not allowed, keep only alphanumeric and basic punctuation
  if (!allowSpecialChars) {
    sanitized = sanitized.replace(/[^a-zA-Z0-9\s.,!?'-]/g, '');
  }

  return sanitized;
}

/**
 * Validate email format (basic validation)
 *
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid format
 */
export function isValidEmail(email) {
  if (!email) return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 *
 * @param {string} password - Password to validate
 * @returns {object} - Validation result with strength and messages
 */
export function validatePassword(password) {
  const result = {
    isValid: false,
    strength: 'weak',
    messages: []
  };

  if (!password) {
    result.messages.push('Password is required');
    return result;
  }

  // Check length
  if (password.length < 6) {
    result.messages.push('Password must be at least 6 characters');
    return result;
  }

  if (password.length < 8) {
    result.messages.push('Consider using 8+ characters for better security');
  }

  let strength = 0;

  // Check for different character types
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;

  // Determine strength
  if (strength <= 1) {
    result.strength = 'weak';
    result.messages.push('Add uppercase, numbers, or symbols for stronger password');
  } else if (strength <= 2) {
    result.strength = 'medium';
    result.messages.push('Good! Consider adding more character variety');
  } else {
    result.strength = 'strong';
    result.isValid = true;
  }

  // Minimum requirement: at least 6 chars
  if (password.length >= 6) {
    result.isValid = true;
  }

  return result;
}

/**
 * Sanitize filename to prevent path traversal
 *
 * @param {string} filename - Filename to sanitize
 * @returns {string} - Safe filename
 */
export function sanitizeFilename(filename) {
  if (!filename) return '';

  // Remove path separators and dangerous characters
  let safe = String(filename)
    .replace(/[<>:"/\\|?*]/g, '') // Windows forbidden chars
    .replace(/\.\./g, '') // Path traversal
    .replace(/^\.+/, '') // Leading dots
    .trim();

  // Limit length
  if (safe.length > 255) {
    const ext = safe.split('.').pop();
    const name = safe.substring(0, 255 - ext.length - 1);
    safe = `${name}.${ext}`;
  }

  return safe || 'unnamed';
}

/**
 * Check if a string contains suspicious patterns
 * Returns array of detected attack types
 *
 * @param {string} text - Text to check
 * @returns {array} - Array of detected attack types
 */
export function detectSuspiciousPatterns(text) {
  if (!text) return [];

  const suspicious = [];

  const patterns = {
    xss: [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i
    ],
    sql: [
      /;\s*(DROP|DELETE|UPDATE|INSERT)/i,
      /UNION\s+SELECT/i,
      /--/,
      /\/\*/
    ],
    pathTraversal: [
      /\.\.\//,
      /\.\.\\/,
      /%2e%2e/i
    ]
  };

  for (const [type, regexList] of Object.entries(patterns)) {
    if (regexList.some(regex => regex.test(text))) {
      suspicious.push(type);
    }
  }

  return suspicious;
}

/**
 * Create a secure Content Security Policy meta tag
 * Use this in your HTML head
 */
export function getCSPMetaTag() {
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co https://accounts.google.com https://*.run.app",
      "font-src 'self' data: https://fonts.gstatic.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self' https://accounts.google.com"
    ].join('; ')
  };
}

// Export all functions as default object
export default {
  sanitizeHTML,
  escapeHTML,
  sanitizeURL,
  sanitizeSearchQuery,
  isValidEmail,
  validatePassword,
  sanitizeFilename,
  detectSuspiciousPatterns,
  getCSPMetaTag
};
