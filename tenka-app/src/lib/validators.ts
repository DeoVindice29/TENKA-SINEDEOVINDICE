/**
 * Lightweight, dependency-free helpers shared by the auth forms.
 * Kept deliberately simple — the source of truth for "is this email
 * real" is always Supabase itself; this is just a fast client-side
 * sanity check so obviously-broken input doesn't round-trip to the
 * server first.
 */

// Good-enough RFC 5322-ish check: local@domain.tld, no spaces.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

/** Normalizes an email for auth calls: trims whitespace, lowercases. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
