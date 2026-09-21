import { useState, useRef } from "react";
import { useLang } from "@/i18n/LangContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  RANK_LEVELS,
  RANK_REQ_ID,
  NICKNAME_KEY,
  PHOTO_KEY,
} from "@/data/ranks";

export default function ProfileCard() {
  const { lang, t } = useLang();
  const [nickname, setNickname] = useLocalStorage<string>(NICKNAME_KEY, "");
  const [photo, setPhoto] = useLocalStorage<string>(PHOTO_KEY, "");
  const [editing, setEditing] = useState(false);
  const [tempNick, setTempNick] = useState(nickname);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const rankIndex =
    parseInt(localStorage.getItem("tebakAksara_rank_v1") || "0", 10) || 0;
  const rank = RANK_LEVELS[rankIndex] || RANK_LEVELS[0];
  const next = RANK_LEVELS[rankIndex + 1];

  const loc = (str: string) =>
    lang === "id" ? (RANK_REQ_ID as Record<string, string>)[str] || str : str;

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const saveNickname = () => {
    setNickname(tempNick.trim().slice(0, 18));
    setEditing(false);
  };

  return (
    <div className="profile-card">
      <button
        type="button"
        className="profile-avatar"
        aria-label={t("aria.changePhoto")}
        onClick={() => fileInputRef.current?.click()}
      >
        {photo ? (
          <img src={photo} alt="" className="profile-avatar-img" />
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

      <div className="profile-info">
        <div className="profile-nickname-wrap">
          {editing ? (
            <input
              type="text"
              className="profile-nickname-input"
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
                  setTempNick(nickname);
                  setEditing(false);
                }
              }}
            />
          ) : (
            <button
              type="button"
              className={`profile-nickname-btn ${nickname ? "has-name" : ""}`}
              onClick={() => {
                setTempNick(nickname);
                setEditing(true);
              }}
            >
              <span>{nickname || t("profile.addNickname")}</span>
              <span className="profile-nickname-edit-icon" />
            </button>
          )}
        </div>

        <div className="profile-title-row">
          <span className="profile-emoji">{rank.emoji}</span>
          <span className="profile-title">{rank.title}</span>
          <span className="profile-subtitle">{rank.subtitle}</span>
        </div>

        <div className="profile-dots">
          {RANK_LEVELS.map((_, i) => (
            <span key={i} className={i <= rankIndex ? "filled" : ""} />
          ))}
        </div>

        <div className="profile-next">
          {next && next.locked
            ? t("profile.highestN5", {
                emoji: next.emoji,
                title: next.title,
              })
            : next
              ? t("profile.nextRank", {
                  req: loc(next.req),
                  emoji: next.emoji,
                  title: next.title,
                })
              : t("profile.highestReached")}
        </div>
      </div>
    </div>
  );
}
