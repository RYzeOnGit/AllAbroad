"""
Central list of degrees, subjects, and currencies for the lead form.
Edit this file to add, remove, or reorder options; the form and admin UI will pick up changes.
"""

# Degree levels (must match form dropdown and API validation)
# For now: Bachelor's and Master's only. PhD, Diploma, etc. are planned for later.
DEGREES = (
    "Bachelor's",
    "Master's",
)

# Subject areas. Include "Other" if you want a free-text fallback in the form.
SUBJECTS = (
    "Computer Science",
    "Business",
    "Engineering",
    "Medicine / Health",
    "Law",
    "Arts & Humanities",
    "Sciences",
    "Social Sciences",
    "Education",
    "Other",
)

# Currencies for tuition (budget) amount
CURRENCIES = (
    "USD",
    "EUR",
    "INR",
    "GBP",
    "AED",
)
