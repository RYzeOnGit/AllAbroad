"""Email format validation (no Resend or automated verification)."""
import re
from typing import Optional

# Reasonable email format: local@domain.tld (RFC 5322 simplified)
_EMAIL_RE = re.compile(
    r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$"
)


def validate_email_format(email: str) -> Optional[str]:
    """
    Validate email format and return normalized email (lowercase, stripped).
    No Resend or automated verification - format only.

    Returns:
        Normalized email, or None if invalid format.
    """
    if not email:
        return None
    s = email.strip().lower()
    if not s or len(s) > 254:
        return None
    if not _EMAIL_RE.match(s):
        return None
    return s
