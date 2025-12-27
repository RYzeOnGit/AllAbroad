"""Phone number normalization and spam detection."""
import re
from typing import Optional
import phonenumbers
from phonenumbers import NumberParseException


def normalize_phone(phone: str, default_region: str = "US") -> Optional[str]:
    """
    Normalize phone number to E.164 format.
    
    Args:
        phone: Raw phone number string
        default_region: Default region code for parsing (ISO 3166-1 alpha-2)
    
    Returns:
        Normalized phone number in E.164 format, or None if invalid
    """
    if not phone:
        return None
    
    # Remove all non-digit characters except +
    cleaned = re.sub(r"[^\d+]", "", phone.strip())
    
    # If no + and starts with 0, might be a local format
    if not cleaned.startswith("+") and cleaned.startswith("0"):
        cleaned = cleaned[1:]
    
    try:
        # Parse the phone number
        parsed = phonenumbers.parse(cleaned, default_region)
        
        # Check if valid
        if not phonenumbers.is_valid_number(parsed):
            return None
        
        # Format as E.164
        normalized = phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
        return normalized
    
    except NumberParseException:
        return None


def is_spam_phone(phone: str) -> bool:
    """
    Basic spam detection for phone numbers.
    
    Detects:
    - Repeated digits (e.g., 1111111111)
    - Sequential digits (e.g., 1234567890)
    - Too short after normalization
    
    Args:
        phone: Phone number string (can be raw or normalized)
    
    Returns:
        True if phone appears to be spam
    """
    if not phone:
        return True
    
    # Extract digits only for pattern checking
    digits = re.sub(r"[^\d]", "", phone)
    
    if len(digits) < 7:  # Too short
        return True
    
    # Check for repeated digits (more than 6 consecutive same digits)
    if re.search(r"(\d)\1{5,}", digits):
        return True
    
    # Check for sequential digits (ascending or descending)
    # Convert to list of integers
    try:
        digit_list = [int(d) for d in digits[-10:]]  # Check last 10 digits
        if len(digit_list) >= 6:
            # Check ascending sequence
            is_ascending = all(digit_list[i] == digit_list[i-1] + 1 for i in range(1, len(digit_list)))
            # Check descending sequence
            is_descending = all(digit_list[i] == digit_list[i-1] - 1 for i in range(1, len(digit_list)))
            
            if is_ascending or is_descending:
                return True
    except (ValueError, IndexError):
        pass
    
    # Check for obvious test numbers (e.g., 555-0100 pattern)
    if re.search(r"555[-\s]?0\d{3}", phone, re.IGNORECASE):
        return True
    
    return False

