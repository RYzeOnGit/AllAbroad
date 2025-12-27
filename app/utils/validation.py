"""Additional validation utilities."""
from app.utils.phone import normalize_phone, is_spam_phone


def validate_lead_data(name: str, phone: str) -> tuple[str, str]:
    """
    Validate and normalize lead data.
    
    Args:
        name: Lead name
        phone: Raw phone number
    
    Returns:
        Tuple of (normalized_name, normalized_phone)
    
    Raises:
        ValueError: If validation fails
    """
    # Normalize phone
    normalized_phone = normalize_phone(phone)
    if not normalized_phone:
        raise ValueError("Invalid phone number format")
    
    # Check for spam
    if is_spam_phone(normalized_phone):
        raise ValueError("Phone number appears to be invalid or spam")
    
    # Clean name
    normalized_name = " ".join(name.strip().split())
    if len(normalized_name) < 2:
        raise ValueError("Name must be at least 2 characters long")
    
    return normalized_name, normalized_phone

