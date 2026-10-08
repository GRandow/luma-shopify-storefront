/**
 * A light email check for forms on every page (the footer newsletter). It
 * only catches typos such as a missing "@" or domain; Klaviyo validates the
 * address for real. Kept out of zod on purpose, so the schema library stays
 * in the checkout chunk instead of the bundle every page downloads.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

export function isEmailAddress(value: string): boolean {
  return value.length <= 254 && EMAIL_PATTERN.test(value);
}
