/**
 * Maps raw Supabase Auth error messages (always in English, and often
 * pretty cryptic) into friendly, "chat dari admin"-style copy the user
 * actually understands — with an i18n key pair so it works in both
 * languages the app supports.
 *
 * Supabase doesn't give us a stable machine-readable error code on the
 * client for every case (older supabase-js just gives `message`), so we
 * match on the well-known substrings GoTrue returns. If nothing matches,
 * we fall back to a generic-but-still-friendly message instead of dumping
 * the raw English string on the user.
 */

export type AuthErrorKind =
  | "invalid_credentials"
  | "invalid_email"
  | "email_not_confirmed"
  | "user_exists"
  | "weak_password"
  | "rate_limit"
  | "network"
  | "generic";

export type MappedAuthError = {
  kind: AuthErrorKind;
  titleKey: string;
  /** full version — use in the toast */
  messageKey: string;
  /** one-liner — use in the small inline error box under the form */
  shortMessageKey: string;
  /** true when a "resend confirmation email" action makes sense here */
  canResend: boolean;
};

const RULES: Array<{ test: RegExp; kind: AuthErrorKind }> = [
  { test: /invalid login credentials/i, kind: "invalid_credentials" },
  { test: /email.*not.*confirmed/i, kind: "email_not_confirmed" },
  { test: /unable to validate email address/i, kind: "invalid_email" },
  { test: /user already registered/i, kind: "user_exists" },
  { test: /already.*registered/i, kind: "user_exists" },
  { test: /password should be at least/i, kind: "weak_password" },
  { test: /password.*(too short|at least \d+ characters)/i, kind: "weak_password" },
  { test: /rate limit/i, kind: "rate_limit" },
  { test: /security purposes.*only request this once/i, kind: "rate_limit" },
  { test: /failed to fetch|network|load failed/i, kind: "network" },
];

const KEY_BY_KIND: Record<AuthErrorKind, { title: string; message: string; short: string }> = {
  invalid_credentials: {
    title: "auth.err.invalidCredentialsTitle",
    message: "auth.err.invalidCredentials",
    short: "auth.err.invalidCredentialsShort",
  },
  invalid_email: {
    title: "auth.err.invalidEmailTitle",
    message: "auth.err.invalidEmail",
    short: "auth.err.invalidEmailShort",
  },
  email_not_confirmed: {
    title: "auth.err.emailNotConfirmedTitle",
    message: "auth.err.emailNotConfirmed",
    short: "auth.err.emailNotConfirmedShort",
  },
  user_exists: {
    title: "auth.err.userExistsTitle",
    message: "auth.err.userExists",
    short: "auth.err.userExistsShort",
  },
  weak_password: {
    title: "auth.err.weakPasswordTitle",
    message: "auth.err.weakPassword",
    short: "auth.err.weakPasswordShort",
  },
  rate_limit: {
    title: "auth.err.rateLimitTitle",
    message: "auth.err.rateLimit",
    short: "auth.err.rateLimitShort",
  },
  network: {
    title: "auth.err.networkTitle",
    message: "auth.err.network",
    short: "auth.err.networkShort",
  },
  generic: {
    title: "auth.err.genericTitle",
    message: "auth.err.generic",
    short: "auth.err.genericShort",
  },
};

export function mapAuthError(rawMessage: string | null | undefined): MappedAuthError {
  const raw = rawMessage ?? "";
  const rule = RULES.find((r) => r.test.test(raw));
  const kind: AuthErrorKind = rule?.kind ?? "generic";
  const keys = KEY_BY_KIND[kind];
  return {
    kind,
    titleKey: keys.title,
    messageKey: keys.message,
    shortMessageKey: keys.short,
    canResend: kind === "email_not_confirmed",
  };
}
