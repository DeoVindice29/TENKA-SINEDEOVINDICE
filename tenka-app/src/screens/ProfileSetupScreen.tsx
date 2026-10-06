import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/state/AuthContext";
import { useLang } from "@/i18n/LangContext";
import { supabase } from "@/lib/supabaseClient";
import SakuraCanvas from "@/components/SakuraCanvas";
import AvatarCropModal from "@/components/AvatarCropModal";

export default function ProfileSetupScreen() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const { t } = useLang();

  const [username, setUsername] = useState(
    (user?.user_metadata?.full_name as string) || "",
  );
  const [avatarUrl, setAvatarUrl] = useState(
    profile?.avatar_url || (user?.user_metadata?.avatar_url as string) || "",
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
    };
  }, [cropSrc]);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setCropSrc(URL.createObjectURL(file));
  };

  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  const handleCropConfirm = async (blob: Blob) => {
    if (!user) return;
    setUploading(true);
    setError(null);
    const path = `${user.id}/avatar.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(`${data.publicUrl}?t=${Date.now()}`);
    setUploading(false);
  };

  const handleSave = async () => {
    const trimmed = username.trim().slice(0, 18);
    if (!trimmed) {
      setError(t("auth.usernameRequired"));
      return;
    }
    setSaving(true);
    setError(null);
    const { error: saveError } = await updateProfile({
      username: trimmed,
      avatar_url: avatarUrl || null,
    });
    setSaving(false);
    if (saveError) {
      setError(
        saveError.toLowerCase().includes("duplicate") ||
          saveError.toLowerCase().includes("unique")
          ? t("auth.usernameTaken")
          : saveError,
      );
    }
  };

  return (
    <div className="login-shell auth-gate-shell">
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

      <div className="login-card auth-gate-card">
        <span className="login-badge">{t("auth.welcomeBadge")}</span>

        <div className="login-brand">
          <span className="login-emblem" aria-hidden="true">
            天
          </span>
          <h1 className="login-title">
            下 <span className="login-title-en">(TENKA)</span>
          </h1>
        </div>

        <h2 className="auth-gate-title">{t("auth.setupTitle")}</h2>
        <p className="auth-gate-subtitle">{t("auth.setupSubtitle")}</p>

        <button
          type="button"
          className="profile-avatar auth-setup-avatar"
          aria-label={t("aria.changePhoto")}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading && <span className="auth-avatar-spinner" />}
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="profile-avatar-img"
              referrerPolicy="no-referrer"
              onError={() => setAvatarUrl("")}
            />
          ) : (
            <span className="profile-avatar-placeholder" />
          )}
          <span className="profile-avatar-edit" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhoto}
        />
        <p className="auth-setup-hint">{t("auth.tapToChangePhoto")}</p>

        <input
          type="text"
          className="auth-setup-input"
          value={username}
          maxLength={18}
          placeholder={t("profile.nicknamePlaceholder")}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
          }}
        />

        {error && <p className="auth-error">{error}</p>}

        <button
          type="button"
          className="login-submit-btn auth-gate-submit"
          onClick={handleSave}
          disabled={saving || uploading}
        >
          {saving ? t("auth.saving") : t("auth.continue")}
        </button>

        <button type="button" className="auth-signout-link" onClick={signOut}>
          {t("auth.signOut")}
        </button>
      </div>

      {cropSrc && (
        <AvatarCropModal
          imageSrc={cropSrc}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
          saving={uploading}
        />
      )}
    </div>
  );
}
