import { useEffect, useRef, useState } from "react";
import { ROLE_LABEL } from "@/lib/appRole";
import { useLang } from "@/i18n/LangContext";
import type { SavedAccount } from "@/lib/accountSwitcher";
import { IconChevronDown, IconClose, IconPlus, IconSwap, IconUsers } from "@/admin/adminIcons";

type Props = {
  accounts: SavedAccount[];
  currentId: string;
  onSwitch: (account: SavedAccount) => Promise<string | null>;
  onAdd: () => void;
  onRemove: (id: string) => void;
};

function Avatar({ account }: { account: SavedAccount }) {
  return account.avatar ? (
    <img className="adm-user-avatar adm-switch-avatar" src={account.avatar} alt="" referrerPolicy="no-referrer" />
  ) : (
    <span className="adm-user-avatar adm-user-avatar-fallback adm-switch-avatar">
      <IconUsers />
    </span>
  );
}

/** Quick switch akun di kiri bawah sidebar Admin Panel (khusus dev). */
export default function AccountSwitcher({ accounts, currentId, onSwitch, onAdd, onRemove }: Props) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number; width: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const current = accounts.find((a) => a.id === currentId);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const r = btnRef.current?.getBoundingClientRect();
    if (r) {
      const width = Math.min(300, window.innerWidth - 16);
      const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8));
      // sidebar desktop ada di bawah layar → buka ke atas; bar mobile di atas → buka ke bawah
      if (r.top > window.innerHeight / 2) setPos({ left, bottom: window.innerHeight - r.top + 6, width });
      else setPos({ left, top: r.bottom + 6, width });
    }
    setError(null);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleSwitch = async (account: SavedAccount) => {
    if (account.id === currentId || busyId) return;
    setBusyId(account.id);
    setError(null);
    const err = await onSwitch(account);
    setBusyId(null);
    if (err) setError(err);
    else setOpen(false);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="adm-nav-item adm-switch-trigger"
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {current ? <Avatar account={current} /> : <IconSwap className="adm-nav-icon" />}
        <span className="adm-switch-text">
          <span className="adm-switch-name">{current?.name ?? t("admin.switch.title")}</span>
          <span className="adm-switch-sub">{current?.email || t("admin.switch.sub")}</span>
        </span>
        <IconChevronDown className={`adm-nav-caret${open ? " open" : ""}`} />
      </button>

      {open && pos && (
        <div
          ref={popRef}
          className="adm-switch-pop"
          role="dialog"
          aria-label={t("admin.switch.title")}
          style={{ left: pos.left, top: pos.top, bottom: pos.bottom, width: pos.width }}
        >
          <div className="adm-switch-head">{t("admin.switch.title")}</div>
          <div className="adm-switch-list">
            {accounts.map((a) => {
              const active = a.id === currentId;
              return (
                <div className={`adm-switch-row${active ? " active" : ""}`} key={a.id}>
                  <button
                    type="button"
                    className="adm-switch-pick"
                    onClick={() => handleSwitch(a)}
                    disabled={!!busyId}
                    aria-current={active}
                  >
                    <Avatar account={a} />
                    <span className="adm-switch-text">
                      <span className="adm-switch-name">{a.name}</span>
                      <span className="adm-switch-sub">{a.email}</span>
                    </span>
                    {a.role && <span className={`adm-role-badge ${a.role}`}>{ROLE_LABEL[a.role]}</span>}
                    {busyId === a.id && <span className="adm-switch-busy">…</span>}
                  </button>
                  {!active && (
                    <button
                      type="button"
                      className="adm-icon-btn"
                      onClick={() => onRemove(a.id)}
                      aria-label={t("admin.switch.remove", { email: a.email })}
                      title={t("admin.switch.removeHint")}
                    >
                      <IconClose />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {error && <p className="adm-status adm-switch-error">{error}</p>}
          <button type="button" className="adm-switch-add" onClick={onAdd}>
            <IconPlus /> {t("admin.switch.add")}
          </button>
        </div>
      )}
    </>
  );
}
