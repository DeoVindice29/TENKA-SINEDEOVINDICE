import { useState } from "react";
import { useAuth } from "@/state/AuthContext";
import { useLang } from "@/i18n/LangContext";
import type { SavedAccount } from "@/lib/accountSwitcher";

function Avatar({ account }: { account: SavedAccount }) {
  const [broken, setBroken] = useState(false);
  if (account.avatar && !broken) {
    return (
      <img
        className="acct-avatar"
        src={account.avatar}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <span className="acct-avatar acct-avatar--fallback" aria-hidden="true">
      {(account.name || account.email || "?").trim().charAt(0).toUpperCase()}
    </span>
  );
}

const CloseIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

type RowsProps = {
  accounts: SavedAccount[];
  currentId: string | null;
  /** teks tombol di tiap baris (mis. "Lanjut sebagai …" di layar login) */
  pickLabel?: (a: SavedAccount) => string | null;
};

/** Daftar akun tersimpan + logika pindah akun, dipakai Pengaturan & layar Login. */
function AccountRows({ accounts, currentId, pickLabel }: RowsProps) {
  const { t } = useLang();
  const { switchAccount, forgetAccount } = useAuth();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pick = async (a: SavedAccount) => {
    if (a.id === currentId || busyId) return;
    setBusyId(a.id);
    setError(null);
    const { error: err } = await switchAccount(a);
    // sukses → halaman dimuat ulang oleh switchAccount, jadi tidak ada lanjutan
    if (err) {
      setBusyId(null);
      setError(t("acct.switch.expired", { name: a.name }));
    }
  };

  return (
    <>
      <div className="acct-list">
        {accounts.map((a) => {
          const active = a.id === currentId;
          const label = pickLabel?.(a);
          return (
            <div className={`acct-row${active ? " active" : ""}`} key={a.id}>
              <button
                type="button"
                className="acct-pick"
                onClick={() => pick(a)}
                disabled={!!busyId}
                aria-current={active}
              >
                <Avatar account={a} />
                <span className="acct-text">
                  <span className="acct-name">{label ?? a.name}</span>
                  <span className="acct-email">{a.email}</span>
                </span>
                {active && (
                  <span className="acct-badge">{t("acct.switch.active")}</span>
                )}
                {busyId === a.id && <span className="acct-busy">…</span>}
              </button>
              {!active && (
                <button
                  type="button"
                  className="acct-remove"
                  onClick={() => forgetAccount(a.id)}
                  aria-label={t("acct.switch.remove", { name: a.name })}
                  title={t("acct.switch.removeHint")}
                >
                  <CloseIcon />
                </button>
              )}
            </div>
          );
        })}
      </div>
      {error && <p className="acct-error">{error}</p>}
    </>
  );
}

/** Item "Ganti akun" di menu Pengaturan (membuka daftar akun tersimpan). */
export default function AccountSwitch() {
  const { t } = useLang();
  const { session, isGuest, accounts, addAccount } = useAuth();
  const [open, setOpen] = useState(false);

  if (isGuest || !session) return null;

  return (
    <>
      <button
        type="button"
        className="settings-menu-item"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="settings-menu-icon settings-menu-icon--profile">
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" />
          </svg>
        </span>
        <span className="settings-menu-text">
          <span className="settings-menu-title">{t("acct.switch.title")}</span>
          <span className="settings-menu-desc">
            {accounts.length > 1
              ? t("acct.switch.count", { count: accounts.length })
              : t("acct.switch.desc")}
          </span>
        </span>
        <svg
          className={`settings-menu-chevron acct-chevron${open ? " open" : ""}`}
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m9 6 6 6-6 6" />
        </svg>
      </button>

      {open && (
        <div className="acct-panel">
          <AccountRows accounts={accounts} currentId={session.user.id} />
          <button type="button" className="acct-add" onClick={addAccount}>
            <span aria-hidden="true">＋</span> {t("acct.switch.add")}
          </button>
          <p className="acct-hint">{t("acct.switch.addHint")}</p>
        </div>
      )}
    </>
  );
}

/** Akun tersimpan di layar Login — jalan balik setelah "Tambah akun lain". */
export function SavedAccountsList() {
  const { t } = useLang();
  const { accounts } = useAuth();
  if (accounts.length === 0) return null;
  return (
    <div className="acct-login">
      <span className="acct-login-label">{t("acct.switch.saved")}</span>
      <AccountRows
        accounts={accounts}
        currentId={null}
        pickLabel={(a) => t("acct.switch.continueAs", { name: a.name })}
      />
    </div>
  );
}
