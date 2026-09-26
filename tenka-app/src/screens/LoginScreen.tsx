import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/state/AuthContext";
import { useLang } from "@/i18n/LangContext";
import GoogleLogo from "@/components/GoogleLogo";
import SakuraCanvas from "@/components/SakuraCanvas";
import { mapAuthError } from "@/lib/authErrors";
import { isValidEmail, normalizeEmail } from "@/lib/validators";

type Mode = "login" | "signup";
type ToastTone = "success" | "error" | "info";
type ToastState = {
  title: string;
  message: string;
  tone: ToastTone;
  /** shown as a small action button inside the toast, e.g. "Resend email" */
  action?: { label: string; onClick: () => void };
} | null;

/* ---------- tiny inline icons (stroke = currentColor, no deps) ---------- */

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 6h16v12H4z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 6.5 12 12.5l7.5-6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="5"
        y="11"
        width="14"
        height="9"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8 11V8a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconKey() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="8" cy="15.5" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="m10.3 13.2 8.2-8.2M15.5 5.5l2 2M18 3l3 3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconGuest() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8.2" r="3.4" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2.6 2.4" />
      <path
        d="M4.5 20c1.3-3.6 4.3-5.6 7.5-5.6s6.2 2 7.5 5.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeDasharray="2.6 2.4"
      />
    </svg>
  );
}

function IconEye({ off }: { off: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.6" />
      {off && (
        <path
          d="M4 4l16 16"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 12h15M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconTorii() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 7.5h18M4.5 5.2h15M7 7.5v12M17 7.5v12M4 10.5h4M16 10.5h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconCheckCircle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="m8 12.3 2.6 2.6L16.2 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconAlertCircle() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 7.5v6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16.6" r="1" fill="currentColor" />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 11v5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="7.7" r="1" fill="currentColor" />
    </svg>
  );
}

function IconX() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ---------------------------- password strength --------------------------- */

function scorePassword(pw: string): 0 | 1 | 2 | 3 {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 8 && /[A-Z]/.test(pw)) score++;
  if (pw.length >= 8 && /[0-9!@#$%^&*]/.test(pw)) score++;
  return score as 0 | 1 | 2 | 3;
}

export default function LoginScreen() {
  const {
    signInWithGoogle,
    signInWithPassword,
    signUpWithPassword,
    resetPassword,
    resendConfirmation,
    continueAsGuest,
  } = useAuth();
  const { t } = useLang();

  const [mode, setMode] = useState<Mode>("login");
  const [toast, setToast] = useState<ToastState>(null);
  const [toastLeaving, setToastLeaving] = useState(false);
  const [toastDuration, setToastDuration] = useState(4200);
  const toastTimer = useRef<number | null>(null);
  const toastRemaining = useRef(4200);
  const toastStartedAt = useRef(0);
  const [infoOpen, setInfoOpen] = useState(false);

  // login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginCapsLock, setLoginCapsLock] = useState(false);

  // brute-force throttle: after too many bad attempts, lock the login
  // form for a cooldown that doubles each time (client-side UX layer —
  // Supabase enforces its own server-side rate limits regardless).
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [lockRemaining, setLockRemaining] = useState(0);

  // signup fields
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState("");
  const [showSignupPw, setShowSignupPw] = useState(false);
  const [showSignupPwConfirm, setShowSignupPwConfirm] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupCapsLock, setSignupCapsLock] = useState(false);
  const [signupEmailTouched, setSignupEmailTouched] = useState(false);
  const [signupConfirmTouched, setSignupConfirmTouched] = useState(false);

  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!infoOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setInfoOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [infoOpen]);

  // tick the lockout countdown while the form is throttled
  useEffect(() => {
    if (!lockedUntil) {
      setLockRemaining(0);
      return;
    }
    const tick = () => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setLockRemaining(0);
      } else {
        setLockRemaining(remaining);
      }
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [lockedUntil]);

  const closeToast = useCallback(() => {
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
      toastTimer.current = null;
    }
    setToastLeaving(true);
    window.setTimeout(() => {
      setToast(null);
      setToastLeaving(false);
    }, 200);
  }, []);

  const showToast = useCallback(
    (next: NonNullable<ToastState> & { durationMs?: number }) => {
      const { durationMs = 4200, ...toastState } = next;
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      setToastLeaving(false);
      setToast(toastState);
      setToastDuration(durationMs);
      toastRemaining.current = durationMs;
      toastStartedAt.current = Date.now();
      toastTimer.current = window.setTimeout(closeToast, durationMs);
    },
    [closeToast],
  );

  const pauseToast = () => {
    if (!toastTimer.current) return;
    window.clearTimeout(toastTimer.current);
    toastTimer.current = null;
    toastRemaining.current -= Date.now() - toastStartedAt.current;
  };

  const resumeToast = () => {
    if (!toast || toastLeaving) return;
    toastStartedAt.current = Date.now();
    toastTimer.current = window.setTimeout(
      closeToast,
      Math.max(toastRemaining.current, 1200),
    );
  };

  const handleCapsLock = (
    e: React.KeyboardEvent<HTMLInputElement>,
    setter: (v: boolean) => void,
  ) => {
    if (typeof e.getModifierState === "function") {
      setter(e.getModifierState("CapsLock"));
    }
  };

  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCK_DURATION_MS = 30_000;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginLoading) return; // guard against double-submit
    if (lockedUntil && Date.now() < lockedUntil) return; // guard against Enter during lockout

    setLoginError(null);
    const email = normalizeEmail(loginEmail);
    if (!email) return setLoginError(t("auth.emailRequired"));
    if (!isValidEmail(email)) return setLoginError(t("auth.err.invalidEmailFormat"));
    if (!loginPassword) return setLoginError(t("auth.passwordRequired"));

    setLoginLoading(true);
    const { error } = await signInWithPassword(email, loginPassword, remember);
    setLoginLoading(false);

    if (error) {
      const mapped = mapAuthError(error);
      setLoginError(t(mapped.shortMessageKey));

      const nextAttempts = loginAttempts + 1;
      if (nextAttempts >= MAX_LOGIN_ATTEMPTS) {
        setLoginAttempts(0);
        setLockedUntil(Date.now() + LOCK_DURATION_MS);
      } else {
        setLoginAttempts(nextAttempts);
      }

      showToast({
        title: t(mapped.titleKey),
        message: t(mapped.messageKey),
        tone: "error",
        durationMs: 5200,
        action: mapped.canResend
          ? { label: t("auth.err.resendButton"), onClick: () => handleResend(email) }
          : undefined,
      });
      return;
    }

    setLoginAttempts(0);
    setLockedUntil(null);
    showToast({
      title: t("auth.toastLoginTitle"),
      message: t("auth.toastLoginMessage", { name: email.split("@")[0] }),
      tone: "success",
    });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupLoading) return; // guard against double-submit

    setSignupError(null);
    setSignupEmailTouched(true);
    setSignupConfirmTouched(true);
    const email = normalizeEmail(signupEmail);
    if (!email) return setSignupError(t("auth.emailRequired"));
    if (!isValidEmail(email)) return setSignupError(t("auth.err.invalidEmailFormat"));
    if (signupPassword.length < 8) return setSignupError(t("auth.passwordMinLength"));
    if (signupPassword !== signupPasswordConfirm)
      return setSignupError(t("auth.passwordMismatch"));

    setSignupLoading(true);
    const { error } = await signUpWithPassword(email, signupPassword, email.split("@")[0]);
    setSignupLoading(false);

    if (error) {
      const mapped = mapAuthError(error);
      setSignupError(t(mapped.shortMessageKey));
      showToast({
        title: t(mapped.titleKey),
        message: t(mapped.messageKey),
        tone: "error",
        durationMs: 5200,
      });
      return;
    }
    showToast({
      title: t("auth.toastSignupTitle"),
      message: t("auth.toastSignupMessage", { email }),
      tone: "info",
      durationMs: 8000,
    });
  };

  const handleForgotPassword = async () => {
    const email = normalizeEmail(loginEmail);
    if (!email) {
      setLoginError(t("auth.forgotEmailNeeded"));
      return;
    }
    if (!isValidEmail(email)) {
      setLoginError(t("auth.err.invalidEmailFormat"));
      return;
    }
    setLoginError(null);
    const { error } = await resetPassword(email);
    if (error) {
      const mapped = mapAuthError(error);
      showToast({
        title: t(mapped.titleKey),
        message: t(mapped.messageKey),
        tone: "error",
        durationMs: 5200,
      });
      return;
    }
    showToast({
      title: t("auth.toastForgotTitle"),
      message: t("auth.toastForgotMessage"),
      tone: "info",
      durationMs: 6500,
    });
  };

  const handleResend = async (email: string) => {
    const { error } = await resendConfirmation(email);
    if (error) {
      const mapped = mapAuthError(error);
      showToast({
        title: t(mapped.titleKey),
        message: t(mapped.messageKey),
        tone: "error",
        durationMs: 5200,
      });
      return;
    }
    showToast({
      title: t("auth.err.resendSentTitle"),
      message: t("auth.err.resendSentMessage", { email }),
      tone: "info",
      durationMs: 6500,
    });
  };

  const handleGoogle = () => {
    setGoogleLoading(true);
    signInWithGoogle();
  };

  const strength = scorePassword(signupPassword);

  // ---- live signup validation (used for inline field errors + disabling submit) ----
  const signupEmailNormalized = normalizeEmail(signupEmail);
  const signupEmailValid =
    signupEmailNormalized.length > 0 && isValidEmail(signupEmailNormalized);
  const signupEmailInvalid = signupEmailTouched && !signupEmailValid;
  const signupPasswordValid = signupPassword.length >= 8;
  const signupConfirmValid =
    signupPasswordConfirm.length > 0 && signupPasswordConfirm === signupPassword;
  const signupConfirmMismatch =
    signupConfirmTouched && signupPasswordConfirm.length > 0 && !signupConfirmValid;
  const signupFormValid =
    signupEmailValid && signupPasswordValid && signupConfirmValid;

  return (
    <div className="login-shell">
      <SakuraCanvas />

      <div className="login-orb login-orb--primary" aria-hidden="true" />
      <div className="login-orb login-orb--sakura" aria-hidden="true" />
      <div className="login-orb login-orb--indigo" aria-hidden="true" />

      <span className="login-watermark login-watermark--left" aria-hidden="true">
        日本語を極める
      </span>
      <span className="login-watermark login-watermark--right" aria-hidden="true">
        世界を掴む
      </span>

      <div className="login-card">
        <span className="login-badge">{t("auth.welcomeBadge")}</span>

        <div className="login-brand">
          <span className="login-emblem" aria-hidden="true">
            天
          </span>
          <h1 className="login-title">
            下 <span className="login-title-en">(TENKA)</span>
          </h1>
        </div>

        <p className="login-tagline">{t("auth.tagline")}</p>

        <p className="login-mode-switch">
          {mode === "login" ? (
            <>
              {t("auth.noAccountYet")}{" "}
              <button
                type="button"
                className="login-mode-switch-link"
                onClick={() => setMode("signup")}
              >
                {t("auth.tabSignup")}
              </button>
              .
            </>
          ) : (
            <>
              {t("auth.alreadyHaveAccount")}{" "}
              <button
                type="button"
                className="login-mode-switch-link"
                onClick={() => setMode("login")}
              >
                {t("auth.tabLogin")}
              </button>
              .
            </>
          )}
        </p>

        <div className="login-quick-row">
          <button
            type="button"
            className="login-google-btn"
            onClick={handleGoogle}
            disabled={googleLoading}
          >
            <span className="login-google-icon" aria-hidden="true">
              <GoogleLogo />
            </span>
            {t("auth.loginWithGoogle")}
          </button>

          <button
            type="button"
            className="login-guest-btn"
            onClick={continueAsGuest}
          >
            <span className="login-guest-icon" aria-hidden="true">
              <IconGuest />
            </span>
            {t("auth.continueAsGuest")}
          </button>
        </div>

        <div className="login-divider">
          <span>{t("auth.orContinueWith")}</span>
        </div>

        <div className="login-form-area">
          {mode === "login" && (
          <form
            className="login-form"
            onSubmit={handleLogin}
            noValidate
          >
            <div className="login-field">
              <label className="login-field-label" htmlFor="login-email">
                {t("auth.emailLabel")}
              </label>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <IconMail />
                </span>
                <input
                  id="login-email"
                  type="email"
                  className="login-input"
                  placeholder={t("auth.emailPlaceholder")}
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="login-field">
              <div className="login-field-row">
                <label className="login-field-label" htmlFor="login-password">
                  {t("auth.passwordLabel")}
                </label>
                <button
                  type="button"
                  className="login-forgot-link"
                  onClick={handleForgotPassword}
                >
                  {t("auth.forgotPassword")}
                </button>
              </div>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <IconLock />
                </span>
                <input
                  id="login-password"
                  type={showLoginPw ? "text" : "password"}
                  className="login-input"
                  placeholder={t("auth.passwordPlaceholder")}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyUp={(e) => handleCapsLock(e, setLoginCapsLock)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  aria-label={
                    showLoginPw ? t("auth.hidePassword") : t("auth.showPassword")
                  }
                  onClick={() => setShowLoginPw((v) => !v)}
                >
                  <IconEye off={showLoginPw} />
                </button>
              </div>
              {loginCapsLock && (
                <p className="login-capslock-warning">
                  <IconAlertCircle /> {t("auth.capsLockWarning")}
                </p>
              )}
            </div>

            <label className="login-checkbox-row">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>{t("auth.rememberMe")}</span>
            </label>

            {loginError && (
              <p className="login-form-error">
                <IconAlertCircle /> {loginError}
              </p>
            )}

            <button
              type="submit"
              className="login-submit-btn"
              disabled={loginLoading || !!(lockedUntil && lockRemaining > 0)}
            >
              {loginLoading ? (
                <span className="login-btn-spinner" aria-hidden="true" />
              ) : lockedUntil && lockRemaining > 0 ? (
                t("auth.tooManyAttempts", { seconds: lockRemaining })
              ) : (
                <>
                  {t("auth.loginButton")}
                  <IconArrowRight />
                </>
              )}
            </button>
          </form>
          )}

          {mode === "signup" && (
          <form
            className="login-form"
            onSubmit={handleSignup}
            noValidate
          >
            <div className="login-field">
              <label className="login-field-label" htmlFor="signup-email">
                {t("auth.signupEmailLabel")}
              </label>
              <div className={`login-input-wrap${signupEmailInvalid ? " login-input-wrap--error" : ""}`}>
                <span className="login-input-icon">
                  <IconMail />
                </span>
                <input
                  id="signup-email"
                  type="email"
                  className="login-input"
                  placeholder={t("auth.signupEmailPlaceholder")}
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  onBlur={() => setSignupEmailTouched(true)}
                  aria-invalid={signupEmailInvalid}
                  autoComplete="email"
                />
              </div>
              {signupEmailInvalid && (
                <p className="login-field-error">
                  <IconAlertCircle /> {t("auth.emailInvalidInline")}
                </p>
              )}
            </div>

            <div className="login-field">
              <label className="login-field-label" htmlFor="signup-password">
                {t("auth.passwordLabel")}
              </label>
              <div className="login-input-wrap">
                <span className="login-input-icon">
                  <IconKey />
                </span>
                <input
                  id="signup-password"
                  type={showSignupPw ? "text" : "password"}
                  className="login-input"
                  placeholder={t("auth.minChars")}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  onKeyUp={(e) => handleCapsLock(e, setSignupCapsLock)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  aria-label={
                    showSignupPw ? t("auth.hidePassword") : t("auth.showPassword")
                  }
                  onClick={() => setShowSignupPw((v) => !v)}
                >
                  <IconEye off={showSignupPw} />
                </button>
              </div>
              {signupCapsLock && (
                <p className="login-capslock-warning">
                  <IconAlertCircle /> {t("auth.capsLockWarning")}
                </p>
              )}

              <div className="login-strength">
                <span
                  className={`login-strength-bar${strength >= 1 ? ` login-strength-bar--${strength === 1 ? "weak" : strength === 2 ? "medium" : "strong"}` : ""}`}
                />
                <span
                  className={`login-strength-bar${strength >= 2 ? ` login-strength-bar--${strength === 2 ? "medium" : "strong"}` : ""}`}
                />
                <span
                  className={`login-strength-bar${strength >= 3 ? " login-strength-bar--strong" : ""}`}
                />
                <span className="login-strength-text">
                  {strength === 0 && t("auth.strengthDefault")}
                  {strength === 1 && t("auth.strengthWeak")}
                  {strength === 2 && t("auth.strengthMedium")}
                  {strength === 3 && t("auth.strengthStrong")}
                </span>
              </div>
            </div>

            <div className="login-field">
              <label className="login-field-label" htmlFor="signup-password-confirm">
                {t("auth.confirmPasswordLabel")}
              </label>
              <div className={`login-input-wrap${signupConfirmMismatch ? " login-input-wrap--error" : ""}`}>
                <span className="login-input-icon">
                  <IconKey />
                </span>
                <input
                  id="signup-password-confirm"
                  type={showSignupPwConfirm ? "text" : "password"}
                  className="login-input"
                  placeholder={t("auth.confirmPasswordPlaceholder")}
                  value={signupPasswordConfirm}
                  onChange={(e) => setSignupPasswordConfirm(e.target.value)}
                  onBlur={() => setSignupConfirmTouched(true)}
                  onKeyUp={(e) => handleCapsLock(e, setSignupCapsLock)}
                  aria-invalid={signupConfirmMismatch}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  aria-label={
                    showSignupPwConfirm ? t("auth.hidePassword") : t("auth.showPassword")
                  }
                  onClick={() => setShowSignupPwConfirm((v) => !v)}
                >
                  <IconEye off={showSignupPwConfirm} />
                </button>
              </div>
              {signupConfirmMismatch && (
                <p className="login-field-error">
                  <IconAlertCircle /> {t("auth.passwordMismatch")}
                </p>
              )}
              {signupConfirmValid && (
                <p className="login-field-success">
                  <IconCheckCircle /> {t("auth.passwordsMatch")}
                </p>
              )}
            </div>

            {signupError && (
              <p className="login-form-error">
                <IconAlertCircle /> {signupError}
              </p>
            )}

            <button
              type="submit"
              className="login-submit-btn"
              disabled={signupLoading || !signupFormValid}
              title={!signupFormValid ? t("auth.signupFixFields") : undefined}
            >
              {signupLoading ? (
                <span className="login-btn-spinner" aria-hidden="true" />
              ) : (
                <>
                  {t("auth.signupButton")}
                  <IconTorii />
                </>
              )}
            </button>
          </form>
          )}

          {mode === "signup" && (
            <button
              type="button"
              className="login-info-trigger"
              onClick={() => setInfoOpen(true)}
            >
              <IconInfo />
              {t("auth.howSignupWorks")}
            </button>
          )}
        </div>

        <p className="login-legal">
          {t("auth.legalPrefix")} <a href="#terms">{t("auth.termsOfService")}</a> &{" "}
          <a href="#privacy">{t("auth.privacyPolicy")}</a> {t("auth.legalSuffix")}
        </p>
      </div>

      {toast && (
        <div
          className={`login-toast login-toast--${toast.tone}${toastLeaving ? " login-toast--leaving" : ""}`}
          role="status"
          onMouseEnter={pauseToast}
          onMouseLeave={resumeToast}
          style={{ "--toast-duration": `${toastDuration}ms` } as React.CSSProperties}
        >
          <span className="login-toast-icon" aria-hidden="true">
            {toast.tone === "success" && <IconCheckCircle />}
            {toast.tone === "error" && <IconAlertCircle />}
            {toast.tone === "info" && <IconMail />}
          </span>
          <span className="login-toast-body">
            <strong className="login-toast-title">{toast.title}</strong>
            <span className="login-toast-message">{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                className="login-toast-action"
                onClick={() => {
                  toast.action?.onClick();
                }}
              >
                {toast.action.label}
              </button>
            )}
          </span>
          <button
            type="button"
            className="login-toast-close"
            aria-label={t("auth.dismiss")}
            onClick={closeToast}
          >
            <IconX />
          </button>
          <span className="login-toast-progress" aria-hidden="true" />
        </div>
      )}

      <div
        className={`login-info-overlay${infoOpen ? " open" : ""}`}
        aria-hidden={!infoOpen}
        onClick={(e) => {
          if (e.target === e.currentTarget) setInfoOpen(false);
        }}
      >
        <div
          className="login-info-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-info-title"
        >
          <h2 id="login-info-title" className="login-info-title">
            {t("auth.howSignupWorksTitle")}
          </h2>
          <ol className="login-info-list">
            <li>{t("auth.howSignupStep1")}</li>
            <li>{t("auth.howSignupStep2")}</li>
            <li>{t("auth.howSignupStep3")}</li>
            <li>{t("auth.howSignupStep4")}</li>
          </ol>
          <p className="login-info-note">{t("auth.howSignupGoogleNote")}</p>
          <button
            type="button"
            className="login-submit-btn login-info-close-btn"
            onClick={() => setInfoOpen(false)}
          >
            {t("auth.gotIt")}
          </button>
        </div>
      </div>
    </div>
  );
}
