import { useState, useRef, useEffect } from "react";
import { useLang } from "@/i18n/LangContext";
import { useAuth } from "@/state/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import AvatarCropModal from "@/components/AvatarCropModal";
import AvatarZoomModal from "@/components/AvatarZoomModal";

type ProfileCardProps = {
  /** "hero" = kartu besar dengan bg sakura & avatar di tengah (dipakai di
   * subview Settings > Profile). Default = baris kompak lama. */
  variant?: "default" | "hero";
};

export default function ProfileCard({ variant = "default" }: ProfileCardProps) {
  const { t } = useLang();
  const { user, profile, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [tempNick, setTempNick] = useState(profile?.username || "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
    };
  }, [cropSrc]);

  const hasAvatar = Boolean(profile?.avatar_url && !avatarBroken);

  const openFilePicker = () => fileInputRef.current?.click();

  const handleAvatarClick = () => {
    // Di kartu hero (Settings > Profile), klik foto langsung buka file
    // picker buat ganti — gak ada mode zoom/lightbox di layar ini.
    if (variant === "hero") {
      openFilePicker();
      return;
    }
    if (hasAvatar) {
      setZoomOpen(true);
    } else {
      openFilePicker();
    }
  };

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
    const { error: saveError } = await updateProfile({
      avatar_url: `${data.publicUrl}?t=${Date.now()}`,
    });
    if (saveError) setError(saveError);
    else setAvatarBroken(false);
    setUploading(false);
  };

  const saveNickname = async () => {
    const trimmed = tempNick.trim().slice(0, 18);
    setEditing(false);
    if (trimmed && trimmed !== profile?.username) {
      const { error: saveError } = await updateProfile({ username: trimmed });
      if (saveError) {
        setError(
          saveError.toLowerCase().includes("duplicate") ||
            saveError.toLowerCase().includes("unique")
            ? t("auth.usernameTaken")
            : saveError,
        );
      }
    }
  };

  const avatarButton = (
    <button
      type="button"
      className={variant === "hero" ? "profile-avatar profile-avatar--hero" : "profile-avatar"}
      aria-label={
        variant === "hero"
          ? t("aria.changePhoto")
          : hasAvatar
          ? t("aria.viewPhoto")
          : t("aria.changePhoto")
      }
      onClick={handleAvatarClick}
      disabled={uploading}
    >
      {hasAvatar ? (
        <img
          src={profile!.avatar_url as string}
          alt=""
          className="profile-avatar-img"
          referrerPolicy="no-referrer"
          onError={() => setAvatarBroken(true)}
        />
      ) : (
        <span className="profile-avatar-placeholder" />
      )}
      {variant === "hero" ? (
        <span className="profile-avatar-edit-hint" aria-hidden="true" />
      ) : (
        hasAvatar && <span className="profile-avatar-zoom-hint" aria-hidden="true" />
      )}
    </button>
  );

  const nicknameField = editing ? (
    <input
      type="text"
      className={
        variant === "hero" ? "profile-nickname-input profile-nickname-input--hero" : "profile-nickname-input"
      }
      value={tempNick}
      maxLength={18}
      autoFocus
      placeholder={t("profile.nicknamePlaceholder")}
      onChange={(e) => setTempNick(e.target.value)}
      onBlur={saveNickname}
      onKeyDown={(e) => {
        if (e.key === "Enter") saveNickname();
        if (e.key === "Escape") {
          e.stopPropagation();
          setTempNick(profile?.username || "");
          setEditing(false);
        }
      }}
    />
  ) : (
    <button
      type="button"
      className={`profile-nickname-btn ${variant === "hero" ? "profile-nickname-btn--hero" : ""} ${
        profile?.username ? "has-name" : ""
      }`}
      onClick={() => {
        setTempNick(profile?.username || "");
        setEditing(true);
      }}
    >
      <span>{profile?.username || t("profile.addNickname")}</span>
      <span className="profile-nickname-edit-icon" />
    </button>
  );

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={handlePhoto}
    />
  );

  if (variant === "hero") {
    return (
      <div className="profile-card profile-card--hero">
        {avatarButton}
        {fileInput}
        <div className="profile-nickname-wrap profile-nickname-wrap--hero">{nicknameField}</div>

        {error && <p className="auth-error profile-error profile-error--hero">{error}</p>}

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

  return (
    <div className="profile-card">
      <div className="profile-top">
        <div className="profile-header">
          {avatarButton}
          {fileInput}

          <div className="profile-name-row">
            <div className="profile-nickname-wrap">{nicknameField}</div>
          </div>
        </div>
      </div>

      {error && <p className="auth-error profile-error">{error}</p>}

      {cropSrc && (
        <AvatarCropModal
          imageSrc={cropSrc}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
          saving={uploading}
        />
      )}

      {zoomOpen && hasAvatar && (
        <AvatarZoomModal
          src={profile!.avatar_url as string}
          onClose={() => setZoomOpen(false)}
          onChangePhoto={() => {
            setZoomOpen(false);
            openFilePicker();
          }}
        />
      )}
    </div>
  );
}
