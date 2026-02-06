/**
 * Central list of degrees, subjects, and currencies for the lead form and admin.
 * Edit this file to add, remove, or reorder options.
 */

/** Degree levels. For now: Bachelor's and Master's only. PhD, Diploma, etc. are planned for later. */
export const DEGREES = [
  "Bachelor's",
  "Master's",
]

/** Subject areas. Include "Other" for a free-text fallback in the form. */
export const SUBJECTS = [
  'Computer Science',
  'Business',
  'Engineering',
  'Medicine / Health',
  'Law',
  'Arts & Humanities',
  'Sciences',
  'Social Sciences',
  'Education',
  'Other',
]

/** Currencies for tuition (budget) amount */
export const CURRENCIES = ['USD', 'EUR', 'INR', 'GBP']
