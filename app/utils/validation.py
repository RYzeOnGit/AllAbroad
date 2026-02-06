"""Additional validation utilities."""
from app.utils.email import validate_email_format


def validate_lead_data(name: str, email: str) -> tuple[str, str]:
    """
    Validate and normalize lead data.

    Args:
        name: Lead name
        email: Email address (format validated only; no Resend/automated verification)

    Returns:
        Tuple of (normalized_name, normalized_email)

    Raises:
        ValueError: If validation fails
    """
    normalized_email = validate_email_format(email)
    if not normalized_email:
        raise ValueError("Please enter a valid email address")

    normalized_name = " ".join(name.strip().split())
    if len(normalized_name) < 2:
        raise ValueError("Name must be at least 2 characters long")

    return normalized_name, normalized_email

