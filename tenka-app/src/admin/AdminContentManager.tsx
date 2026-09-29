import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import { supabase } from "@/lib/supabaseClient";
import { InlineLoading } from "@/components/ui/Loader";
import { useAdminTr } from "@/admin/adminTr";
import {
  TABLE_NAME,
  tableFor,
  sectionTitlesTable,
  type ContentKind,
  type KotobaRow,
  type KanjiRow,
  type BunpoRow,
  type SectionTitleRow,
  type OrganizeSourceRow,
} from "@/lib/contentTypes";
import {
  createOrganizeSource,
  deleteOrganizeSource,
  fetchOrganizeSources,
  renameOrganizeSource,
  sourceName,
} from "@/lib/organizeSources";
import { autoSegmentExample, cleanExample, markExample } from "@/lib/segments";
import { CHAPTER_TITLE_SUB_TIER } from "@/lib/sectionTitles";
import { RANK_LEVELS } from "@/data/ranks";
import { ROLE_LABEL, type AppRole } from "@/lib/appRole";
import { activityKindLabel, formatRelativeTime, type ActivityEntry } from "@/admin/adminActivity";
import {
  IconArrowLeft,
  IconBook,
  IconChart,
  IconChat,
  IconChevronDown,
  IconClose,
  IconDocument,
  IconEdit,
  IconFolder,
  IconKanjiTile,
  IconLayers,
  IconNote,
  IconPlus,
  IconSave,
  IconTarget,
  IconTrash,
  IconUsers,
} from "@/admin/adminIcons";

export type AdminSection = "dashboard" | ContentKind | "soal" | "statistik" | "pengguna";

const TIERS = ["N5", "N4", "N3", "N2", "N1"];

// Placeholder berkilau selama data belum datang (gantinya "…" polos).
function Skel({ w = 44, h = 22, circle = false }: { w?: number | string; h?: number; circle?: boolean }) {
  const { tr } = useAdminTr();
  return (
    <span
      className={`adm-skel${circle ? " adm-skel--circle" : ""}`}
      style={{ width: w, height: h }}
      role="status"
      aria-label={tr("Memuat")}
    />
  );
}

function TreeSkeleton() {
  const { tr } = useAdminTr();
  return (
    <div className="adm-tree-skeleton" role="status" aria-label={tr("Memuat struktur materi")}>
      {Array.from({ length: 6 }, (_, i) => (
        <div className="adm-tree-skel-row" key={i} style={{ paddingLeft: (i % 3) * 18 }}>
          <Skel w={18} h={18} />
          <Skel w={20} h={20} />
          <Skel w={`${38 + ((i * 13) % 32)}%`} h={14} />
        </div>
      ))}
    </div>
  );
}

// Data dipisah per level (kotoba_entries_n5, kotoba_entries_n4, dst.), jadi
// total & rincian per level dihitung dengan menghitung tiap tabel level.
async function countKindRows(
  kind: ContentKind,
): Promise<{ total: number; perTier: Record<string, number>; error: string | null }> {
  const perTier: Record<string, number> = {};
  const errors: string[] = [];
  await Promise.all(
    TIERS.map(async (t) => {
      const { count, error } = await supabase.from(tableFor(kind, t)).select("*", { count: "exact", head: true });
      if (error) errors.push(error.message);
      else perTier[t] = count ?? 0;
    }),
  );
  const total = Object.values(perTier).reduce((a, b) => a + b, 0);
  return { total, perTier, error: errors[0] ?? null };
}

// Chapter & Sub Chapter harus bilangan bulat positif (1, 2, 3…) — field-nya
// terpisah justru biar orang gak perlu (dan gak boleh) ngetik "1.1" di
// Chapter; bagian setelah titik itu tugasnya field Sub Chapter. Divalidasi di
// sini karena input type="number" step={1} tetep bisa ditembus browser
// buat nerima angka desimal kalau diketik manual.
function isPositiveInteger(n: number): boolean {
  return Number.isInteger(n) && n > 0;
}

// Cegah ketik "." atau "," di field Chapter/Sub Chapter dari sisi keyboard —
// validasi sungguhannya tetep di isPositiveInteger() pas submit (buat jaga
// dari paste, scroll wheel di input number, dll).
function blockDecimalKey(e: KeyboardEvent<HTMLInputElement>) {
  if (e.key === "." || e.key === ",") e.preventDefault();
}

// Dipanggil abis "Simpan & Tambah Lagi" biar form yang baru kereset keliatan
// dari atas — tanpa ini, kalau form panjang dan user lagi scroll ke bawah
// (deket tombol submit), field paling atas yang udah kosong gak keliatan.
// .adm-main itu container yang scroll-nya (lihat admin.css), bukan body.
function scrollFormToTop() {
  document.querySelector(".adm-main")?.scrollTo({ top: 0, behavior: "smooth" });
}

// dipicu dari tombol Aksi Cepat di Dashboard: { kind, token } dikirim turun
// dari AdminShell (AdminPanel.tsx) yang juga pindah `section`-nya ke `kind`.
// token (timestamp) dipakai biar useEffect di section terkait selalu
// ke-trigger ulang walau kind-nya sama dengan permintaan sebelumnya.
export type QuickAddSignal = { kind: ContentKind; token: number };

export default function AdminContentManager({
  section,
  quickAdd,
  onQuickAdd,
  onQuickAddHandled,
  activity,
  onLogActivity,
  onNavigateToDashboard,
  canDelete,
}: {
  section: AdminSection;
  quickAdd?: QuickAddSignal | null;
  onQuickAdd: (kind: ContentKind) => void;
  onQuickAddHandled: () => void;
  activity: ActivityEntry[];
  onLogActivity: (entry: Omit<ActivityEntry, "id" | "at">) => void;
  onNavigateToDashboard: () => void;
  /** Hapus (entri, Chapter, Sub Chapter, Organize by) khusus role dev. */
  canDelete: boolean;
}) {
  // hanya "milik" section yang lagi aktif — kalau kind-nya beda (misal
  // sinyal lama yang belum ke-clear), jangan dipakai.
  const autoAddToken = quickAdd && quickAdd.kind === section ? quickAdd.token : undefined;

  if (section === "dashboard") return <Dashboard onQuickAdd={onQuickAdd} activity={activity} />;
  if (section === "statistik") return <StatistikSection />;
  if (section === "pengguna") return <PenggunaSection />;
  if (section === "soal") return <SoalPlaceholder />;
  if (section === "kotoba")
    return (
      <KotobaSection
        autoAddToken={autoAddToken}
      canDelete={canDelete}
        onAutoAddHandled={onQuickAddHandled}
        onLogActivity={onLogActivity}
        onNavigateToDashboard={onNavigateToDashboard}
      />
    );
  if (section === "kanji")
    return (
      <KanjiSection
        autoAddToken={autoAddToken}
      canDelete={canDelete}
        onAutoAddHandled={onQuickAddHandled}
        onLogActivity={onLogActivity}
        onNavigateToDashboard={onNavigateToDashboard}
      />
    );
  return (
    <BunpoSection
      autoAddToken={autoAddToken}
      canDelete={canDelete}
      onAutoAddHandled={onQuickAddHandled}
      onLogActivity={onLogActivity}
      onNavigateToDashboard={onNavigateToDashboard}
    />
  );
}

// -------------------------------------------------------------- dashboard

const ACTIVITY_KIND_ICON: Record<ContentKind, ReactNode> = {
  kotoba: <IconBook />,
  kanji: <IconKanjiTile />,
  bunpo: <IconDocument />,
};

function Dashboard({
  onQuickAdd,
  activity,
}: {
  onQuickAdd: (kind: ContentKind) => void;
  activity: ActivityEntry[];
}) {
  const { tr, lang } = useAdminTr();
  const [counts, setCounts] = useState<Record<ContentKind, number | null>>({
    kotoba: null,
    kanji: null,
    bunpo: null,
  });

  useEffect(() => {
    (Object.keys(TABLE_NAME) as ContentKind[]).forEach(async (kind) => {
      const { total } = await countKindRows(kind);
      setCounts((prev) => ({ ...prev, [kind]: total }));
    });
  }, []);

  // biar label "X menit lalu" ikut nge-update selama Dashboard tetap dibuka.
  const [, setClockTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setClockTick((n) => n + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

  const cards: { key: ContentKind; label: string; icon: ReactNode }[] = [
    { key: "kotoba", label: "Kotoba", icon: <IconBook /> },
    { key: "kanji", label: "Kanji", icon: <IconKanjiTile /> },
    { key: "bunpo", label: "Bunpō", icon: <IconDocument /> },
  ];

  const quickActions: { key: ContentKind; label: string; desc: string; icon: ReactNode }[] = [
    { key: "kotoba", label: tr("Tambah Kotoba"), desc: tr("Kosakata baru ke database."), icon: <IconBook /> },
    { key: "kanji", label: tr("Tambah Kanji"), desc: tr("Karakter kanji baru."), icon: <IconKanjiTile /> },
    { key: "bunpo", label: tr("Tambah Bunpō"), desc: tr("Pola tata bahasa baru."), icon: <IconDocument /> },
  ];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Ringkasan konten yang ada di database Tenka." />
      <div className="adm-stat-grid">
        {cards.map((c) => (
          <div className="adm-stat-card" key={c.key}>
            <span className="adm-stat-icon">{c.icon}</span>
            <div>
              <div className="adm-stat-value">{counts[c.key] ?? <Skel />}</div>
              <div className="adm-stat-label">{tr("Entri {label}", { label: c.label })}</div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="adm-section-title">{tr("Aksi Cepat")}</h2>
      <div className="adm-quick-grid">
        {quickActions.map((a) => (
          <button
            key={a.key}
            type="button"
            className="adm-quick-card"
            onClick={() => onQuickAdd(a.key)}
          >
            <span className="adm-quick-icon">{a.icon}</span>
            <span className="adm-quick-text">
              <span className="adm-quick-label">{a.label}</span>
              <span className="adm-quick-desc">{a.desc}</span>
            </span>
            <IconPlus className="adm-quick-plus" />
          </button>
        ))}
      </div>

      <h2 className="adm-section-title">{tr("Aktivitas Terbaru")}</h2>
      {activity.length === 0 ? (
        <div className="adm-card adm-empty-card">
          <IconTarget className="adm-empty-icon" />
          <p>{tr("Belum ada aktivitas. Tambah atau hapus data akan tercatat di sini.")}</p>
        </div>
      ) : (
        <div className="adm-card adm-activity-card">
          <ul className="adm-activity-list">
            {activity.slice(0, 8).map((entry) => (
              <li className="adm-activity-item" key={entry.id}>
                <span className={`adm-activity-icon${entry.action === "delete" ? " danger" : ""}`}>
                  {ACTIVITY_KIND_ICON[entry.kind]}
                </span>
                <span className="adm-activity-text">
                  <span className="adm-activity-label">
                    {entry.action === "add" ? tr("Menambahkan") : tr("Menghapus")} {activityKindLabel(entry.kind)}{" "}
                    <b>{entry.label}</b>
                  </span>
                  {entry.meaning && <span className="adm-activity-meaning">{entry.meaning}</span>}
                </span>
                {entry.tier && <span className="adm-tier-badge">{entry.tier}</span>}
                <span className="adm-activity-time">{formatRelativeTime(entry.at, lang)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="adm-dashboard-hint">
        {tr("Pilih menu")} <b>Lessons</b> {tr("di sisi kiri, atau pakai Aksi Cepat di atas, untuk menambah maupun menghapus kosakata, kanji, dan pola tata bahasa.")}
      </p>
    </>
  );
}

function SoalPlaceholder() {
  const { tr } = useAdminTr();
  return (
    <>
      <PageHeader title="Soal" subtitle="Bank soal untuk mode Latihan." />
      <div className="adm-card adm-empty-card">
        <IconTarget className="adm-empty-icon" />
        <p>{tr("Pengelolaan bank soal belum tersedia di panel ini.")}</p>
      </div>
    </>
  );
}

// -------------------------------------------------------------- statistik

function StatistikSection() {
  const { tr } = useAdminTr();
  const [counts, setCounts] = useState<Record<ContentKind, number | null>>({
    kotoba: null,
    kanji: null,
    bunpo: null,
  });
  const [tierCounts, setTierCounts] = useState<Record<ContentKind, Record<string, number>>>({
    kotoba: {},
    kanji: {},
    bunpo: {},
  });
  const [userCount, setUserCount] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    (Object.keys(TABLE_NAME) as ContentKind[]).forEach(async (kind) => {
      const { total, perTier, error } = await countKindRows(kind);
      if (error) {
        setStatus(error);
        return;
      }
      setCounts((prev) => ({ ...prev, [kind]: total }));
      setTierCounts((prev) => ({ ...prev, [kind]: perTier }));
    });

    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .then(({ count, error }) => {
        if (error) setStatus(error.message);
        else setUserCount(count ?? 0);
      });
  }, []);

  const kindLabel: Record<ContentKind, string> = { kotoba: "Kotoba", kanji: "Kanji", bunpo: "Bunpō" };
  const kindIcon: Record<ContentKind, ReactNode> = {
    kotoba: <IconBook />,
    kanji: <IconKanjiTile />,
    bunpo: <IconDocument />,
  };
  // kalau ada error, jangan skeleton selamanya — tampilkan strip
  const ph = status ? "—" : <Skel />;
  const allLoaded = counts.kotoba !== null && counts.kanji !== null && counts.bunpo !== null;
  const totalEntries = allLoaded ? (counts.kotoba ?? 0) + (counts.kanji ?? 0) + (counts.bunpo ?? 0) : null;

  return (
    <>
      <PageHeader title="Statistik" subtitle="Ringkasan jumlah pengguna dan konten Tenka." />
      <StatusLine status={status} />
      <div className="adm-stat-grid">
        <div className="adm-stat-card">
          <span className="adm-stat-icon">
            <IconUsers />
          </span>
          <div>
            <div className="adm-stat-value">{userCount ?? ph}</div>
            <div className="adm-stat-label">{tr("Total Pengguna")}</div>
          </div>
        </div>
        <div className="adm-stat-card">
          <span className="adm-stat-icon">
            <IconLayers />
          </span>
          <div>
            <div className="adm-stat-value">{totalEntries ?? ph}</div>
            <div className="adm-stat-label">{tr("Total Entri Lessons")}</div>
          </div>
        </div>
        {(Object.keys(TABLE_NAME) as ContentKind[]).map((kind) => (
          <div className="adm-stat-card" key={kind}>
            <span className="adm-stat-icon">{kindIcon[kind]}</span>
            <div>
              <div className="adm-stat-value">{counts[kind] ?? ph}</div>
              <div className="adm-stat-label">{tr("Entri {label}", { label: kindLabel[kind] })}</div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="adm-section-title">{tr("Rincian Konten per Tier")}</h2>
      <div className="adm-card adm-table-card">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Tier</th>
              {(Object.keys(TABLE_NAME) as ContentKind[]).map((kind) => (
                <th key={kind}>{kindLabel[kind]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIERS.map((t) => (
              <tr key={t}>
                <td>
                  <span className="adm-tier-badge">{t}</span>
                </td>
                {(Object.keys(TABLE_NAME) as ContentKind[]).map((kind) => (
                  <td key={kind} className="adm-muted">
                    {tierCounts[kind][t] ?? (status ? "—" : <Skel w={28} h={14} />)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// --------------------------------------------------------------- pengguna

type ProfileRow = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  rank_index: number | null;
  created_at: string;
};

type RoleInfo = { role: AppRole; locked: boolean };
type RoleChoice = AppRole | "user";

function PenggunaSection() {
  const { tr } = useAdminTr();
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // role tiap akun (dari fungsi SQL admin_list_roles); akun yang gak ada di
  // map ini = pengguna biasa. rolesReady=false → gagal dimuat (mis. migrasi
  // role belum dijalankan), dropdown dikunci supaya tidak menyesatkan.
  const [roles, setRoles] = useState<Record<string, RoleInfo>>({});
  const [rolesReady, setRolesReady] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, rank_index, created_at")
      .order("created_at", { ascending: false });
    if (error) setStatus(error.message);
    else setRows((data ?? []) as ProfileRow[]);

    const { data: sess } = await supabase.auth.getSession();
    setMyId(sess.session?.user.id ?? null);

    const rolesRes = await supabase.rpc("admin_list_roles");
    if (rolesRes.error) {
      setRolesReady(false);
      setStatus(
        tr("Role belum bisa dimuat:") + " " +
          rolesRes.error.message +
          tr(" — pastikan migrasi 2026_add_user_roles_dev_admin.sql sudah dijalankan."),
      );
    } else {
      const map: Record<string, RoleInfo> = {};
      for (const r of (rolesRes.data ?? []) as { user_id: string; role: AppRole; locked: boolean }[]) {
        map[r.user_id] = { role: r.role, locked: r.locked };
      }
      setRoles(map);
      setRolesReady(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => (r.username ?? "").toLowerCase().includes(q));
  }, [rows, search]);

  const handleChangeRole = async (row: ProfileRow, next: RoleChoice) => {
    const current: RoleChoice = roles[row.id]?.role ?? "user";
    if (next === current) return;
    const label = row.username || tr("pengguna ini");
    const warning =
      next === "dev"
        ? tr(" Dev punya akses penuh: semua menu Admin Panel, alat dev di app, ubah role, dan hapus akun.")
        : next === "admin"
          ? tr(" Admin hanya bisa menambah/mengubah lessons dan latihan.")
          : tr(" Akun ini akan kembali jadi pengguna biasa.");
    if (!confirm(tr("Ubah {label} menjadi {role}?{warning}", { label, role: ROLE_LABEL[next], warning }))) return;
    setSavingRoleId(row.id);
    setStatus(tr("Menyimpan role…"));
    const { error } = await supabase.rpc("set_user_role", { target_id: row.id, new_role: next });
    setSavingRoleId(null);
    if (error) {
      setStatus(tr("Gagal ubah role:") + " " + error.message);
      return;
    }
    setRoles((prev) => {
      const copy = { ...prev };
      if (next === "user") delete copy[row.id];
      else copy[row.id] = { role: next, locked: false };
      return copy;
    });
    setStatus(tr("Role {label} sekarang {role}.", { label, role: ROLE_LABEL[next] }));
  };

  const handleDeleteAccount = async (row: ProfileRow) => {
    const label = row.username || tr("pengguna ini");
    if (!confirm(tr("Hapus akun {label} secara permanen? Tindakan ini tidak bisa dibatalkan.", { label }))) return;
    setStatus(tr("Menghapus akun…"));
    const { error } = await supabase.rpc("admin_delete_user", { target_id: row.id });
    if (error) {
      setStatus(tr("Gagal hapus akun:") + " " + error.message);
      return;
    }
    setStatus(tr("Akun dihapus."));
    setRows((prev) => prev.filter((r) => r.id !== row.id));
  };

  return (
    <>
      <PageHeader title="Pengguna" subtitle="Daftar pengguna yang terdaftar di Tenka." />
      <div className="adm-toolbar">
        <input
          type="text"
          className="adm-search-input"
          placeholder={tr("Cari username…")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {loading ? <InlineLoading label={tr("Memuat…")} /> : <span className="adm-muted">{tr("{count} pengguna", { count: filtered.length })}</span>}
      </div>
      <StatusLine status={status} />
      <div className="adm-card adm-table-card">
        <table className="adm-table adm-table--users">
          <colgroup>
            <col className="adm-col-name" />
            <col className="adm-col-role" />
            <col className="adm-col-rank" />
            <col className="adm-col-joined" />
            <col className="adm-col-action" />
          </colgroup>
          <thead>
            <tr>
              <th>{tr("Nama")}</th>
              <th>Role</th>
              <th>Rank</th>
              <th>{tr("Bergabung")}</th>
              <th aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            {loading &&
              rows.length === 0 &&
              Array.from({ length: 5 }, (_, i) => (
                <tr key={`skel-${i}`} aria-hidden="true">
                  <td>
                    <span className="adm-user-cell">
                      <Skel w={32} h={32} circle />
                      <Skel w={90 + ((i * 23) % 60)} h={14} />
                    </span>
                  </td>
                  <td><Skel w={64} h={22} /></td>
                  <td><Skel w={48} h={14} /></td>
                  <td><Skel w={90} h={14} /></td>
                  <td />
                </tr>
              ))}
            {filtered.map((row) => (
              <tr key={row.id}>
                <td>
                  <span className="adm-user-cell">
                    {row.avatar_url ? (
                      <img className="adm-user-avatar" src={row.avatar_url} alt="" />
                    ) : (
                      <span className="adm-user-avatar adm-user-avatar-fallback">
                        <IconUsers />
                      </span>
                    )}
                    <span>{row.username || <span className="adm-muted">{tr("(belum diatur)")}</span>}</span>
                  </span>
                </td>
                <td>
                  {(() => {
                    const info = roles[row.id];
                    const current: RoleChoice = info?.role ?? "user";
                    // dikunci: akun sendiri, dev bawaan (admin_emails), atau role gagal dimuat
                    const locked = row.id === myId || !!info?.locked || !rolesReady;
                    if (locked) {
                      return (
                        <span
                          className={`adm-role-badge ${current}`}
                          title={
                            row.id === myId
                              ? tr("Role akun sendiri tidak bisa diubah")
                              : info?.locked
                                ? tr("Dev bawaan — role dikunci")
                                : undefined
                          }
                        >
                          {rolesReady ? ROLE_LABEL[current] : "…"}
                          {(row.id === myId || info?.locked) && " 🔒"}
                        </span>
                      );
                    }
                    return (
                      <select
                        className={`adm-role-select ${current}`}
                        value={current}
                        disabled={savingRoleId === row.id}
                        onChange={(e) => handleChangeRole(row, e.target.value as RoleChoice)}
                        aria-label={tr("Role {name}", { name: row.username || tr("pengguna") })}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="dev">Dev</option>
                      </select>
                    );
                  })()}
                </td>
                <td className="adm-muted">{RANK_LEVELS[row.rank_index ?? 0]?.title ?? "—"}</td>
                <td className="adm-muted">{formatRelativeTime(new Date(row.created_at).getTime())}</td>
                <td className="adm-td-action">
                  <button
                    type="button"
                    className="adm-icon-btn danger"
                    onClick={() => handleDeleteAccount(row)}
                    aria-label={tr("Hapus Akun")}
                  >
                    <IconTrash />
                  </button>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="adm-muted adm-empty-row">
                  {rows.length === 0 ? tr("Belum ada pengguna terdaftar.") : tr("Tidak ada pengguna yang cocok dengan pencarian.")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// Label node: kalau admin sudah ngasih nama, nama itu jadi label utama
// (bebas, nggak harus "Chapter N"); nomornya tetap ada sebagai keterangan
// kecil karena dipakai buat urutan. Kalau belum ada nama, tampil "Chapter N".
function NodeLabel({ fallback, name }: { fallback: string; name?: string | null }) {
  const clean = name?.trim();
  if (!clean) return <>{fallback}</>;
  return (
    <>
      {clean} <span className="adm-muted adm-node-number">· {fallback}</span>
    </>
  );
}

function PageHeader({
  title,
  subtitle,
  onBack,
  sticky,
}: {
  title: string;
  subtitle: string;
  onBack?: () => void;
  sticky?: boolean;
}) {
  const { tr } = useAdminTr();
  return (
    <div className={`adm-page-header${sticky ? " adm-page-header--sticky" : ""}`}>
      {onBack && (
        <button type="button" className="adm-back-btn" onClick={onBack} aria-label={tr("Kembali")}>
          <IconArrowLeft />
        </button>
      )}
      <div>
        <h1>{tr(title)}</h1>
        <p>{tr(subtitle)}</p>
      </div>
    </div>
  );
}

function StatusLine({ status }: { status: string | null }) {
  if (!status) return null;
  return <p className="adm-status">{status}</p>;
}

// ------------------------------------------------------------ shared bits

function CountedTextarea({
  name,
  placeholder,
  maxLength,
  rows = 3,
  required,
  defaultValue,
}: {
  name: string;
  placeholder: string;
  maxLength: number;
  rows?: number;
  required?: boolean;
  defaultValue?: string;
}) {
  const { tr } = useAdminTr();
  const [len, setLen] = useState(defaultValue?.length ?? 0);
  return (
    <div className="adm-textarea-wrap">
      <textarea
        name={name}
        placeholder={tr(placeholder)}
        maxLength={maxLength}
        rows={rows}
        required={required}
        defaultValue={defaultValue}
        onChange={(e) => setLen(e.currentTarget.value.length)}
      />
      <span className="adm-textarea-count">
        {len}/{maxLength}
      </span>
    </div>
  );
}

function FormFooter({ editing }: { editing?: boolean }) {
  const { tr } = useAdminTr();
  if (editing) {
    return (
      <div className="adm-form-footer">
        <div className="adm-form-footer-right">
          <button type="submit" name="mode" value="done" className="adm-btn adm-btn-primary">
            <IconSave /> {tr("Simpan Perubahan")}
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="adm-form-footer">
      <div className="adm-form-footer-right">
        <button type="submit" name="mode" value="again" className="adm-btn adm-btn-outline">
          <IconPlus /> {tr("Simpan & Tambah Lagi")}
        </button>
        <button type="submit" name="mode" value="done" className="adm-btn adm-btn-primary">
          <IconSave /> {tr("Simpan")}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Kotoba
//
// UI-nya dibikin kayak file explorer: Tier (N5..N1) -> Chapter -> Sub Chapter
// -> Kotoba, biar strukturnya keliatan langsung tanpa harus gonta-ganti
// dropdown filter kayak Kanji/Bunpo. Chapter & Sub Chapter gak punya tabel
// sendiri di Supabase — keberadaan mereka disimpen di section_titles (tabel
// yang sama dipakai buat nama Chapter/Sub Chapter), ditambah baris kotoba yang
// nunjuk ke situ. Row section_titles dengan chapter=0 & sub_tier=0 dipakai
// sebagai penanda "Tier ini ada" (chapter asli gak pernah 0, jadi aman gak
// bentrok sama makna sub_tier=0 = nama Chapter di CHAPTER_TITLE_SUB_TIER).

const TIER_MARKER_CHAPTER = 0;
const TIER_MARKER_SUB_TIER = 0;

async function fetchAllSectionTitles(kind: ContentKind): Promise<SectionTitleRow[]> {
  const { data, error } = await supabase
    .from(sectionTitlesTable(kind))
    .select("*")
    .order("tier")
    .order("chapter")
    .order("sub_tier");
  if (error || !data) return [];
  return data as SectionTitleRow[];
}

// Beda dari upsertSectionTitle di lib/sectionTitles.ts: yang ini SELALU
// nulis walau title_id/title_en kosong — dipakai pas bikin folder Tier /
// Chapter / Sub Chapter kosong (belum ada kotoba di dalamnya), jadi foldernya
// tetap "ada" & muncul di tree biar bisa diisi belakangan.
async function ensureSectionTitleRow(kind: ContentKind, row: SectionTitleRow): Promise<string | null> {
  const { error } = await supabase.from(sectionTitlesTable(kind)).upsert(row, {
    onConflict: "source_id,chapter,sub_tier",
  });
  return error ? error.message : null;
}

type TreeRow = { id: number; tier: string; source_id: number; chapter: number; sub_tier: number };
type SubTierNode<T extends TreeRow> = { subTier: number; title: SectionTitleRow | null; entries: T[] };
type ChapterNode<T extends TreeRow> = { chapter: number; title: SectionTitleRow | null; subTiers: Map<number, SubTierNode<T>> };
// Organize by = lapisan di antara Tier dan Chapter (mis. "Minna no Nihongo").
type SourceNode<T extends TreeRow> = { source: OrganizeSourceRow; chapters: Map<number, ChapterNode<T>> };
type TierNode<T extends TreeRow> = { tier: string; sources: SourceNode<T>[] };

function buildContentTree<T extends TreeRow>(
  sources: OrganizeSourceRow[],
  titles: SectionTitleRow[],
  entries: T[],
): Map<string, TierNode<T>> {
  const tree = new Map<string, TierNode<T>>();
  const sourceById = new Map<number, SourceNode<T>>();
  const ensureTier = (tierName: string): TierNode<T> => {
    let node = tree.get(tierName);
    if (!node) {
      node = { tier: tierName, sources: [] };
      tree.set(tierName, node);
    }
    return node;
  };
  TIERS.forEach(ensureTier);
  for (const source of sources) {
    const node: SourceNode<T> = { source, chapters: new Map() };
    ensureTier(source.tier).sources.push(node);
    sourceById.set(source.id, node);
  }
  const ensureChapter = (sourceNode: SourceNode<T>, chapter: number): ChapterNode<T> => {
    let node = sourceNode.chapters.get(chapter);
    if (!node) {
      node = { chapter, title: null, subTiers: new Map() };
      sourceNode.chapters.set(chapter, node);
    }
    return node;
  };
  const ensureSubTier = (chapterNode: ChapterNode<T>, subTier: number): SubTierNode<T> => {
    let node = chapterNode.subTiers.get(subTier);
    if (!node) {
      node = { subTier, title: null, entries: [] };
      chapterNode.subTiers.set(subTier, node);
    }
    return node;
  };
  for (const row of titles) {
    // baris penanda lama (chapter 0, sub_tier 0) sudah digantikan organize_sources
    if (row.chapter === TIER_MARKER_CHAPTER && row.sub_tier === TIER_MARKER_SUB_TIER) continue;
    const sourceNode = sourceById.get(row.source_id);
    if (!sourceNode) continue;
    const chapterNode = ensureChapter(sourceNode, row.chapter);
    if (row.sub_tier === CHAPTER_TITLE_SUB_TIER) {
      chapterNode.title = row;
    } else {
      ensureSubTier(chapterNode, row.sub_tier).title = row;
    }
  }
  for (const row of entries) {
    const sourceNode = sourceById.get(row.source_id);
    if (!sourceNode) continue;
    ensureSubTier(ensureChapter(sourceNode, row.chapter), row.sub_tier).entries.push(row);
  }
  return tree;
}

type SelectedSubTier = { tier: string; sourceId: number; chapter: number; subTier: number };

// Teks singkat "N5 · Minna no Nihongo · Chapter 1 · Sub Chapter 1" buat subjudul form tambah/edit.
function locationText(tier: string, sourceName: string, chapter: number, subTier: number): string {
  return `${tier} · ${sourceName} · Chapter ${chapter} · Sub Chapter ${subTier}`;
}

// Dialog kecil buat Tambah/Edit Organize by, Chapter & Sub Chapter (Tier N5–N1
// tetap, gak bisa ditambah/diubah/dihapus dari sini) — beda dari form
// Tambah/Edit entri (kotoba/kanji/bunpo) yang tetap punya formnya sendiri.
type NodeDialog =
  | { kind: "source-add"; tier: string }
  | { kind: "source-edit"; tier: string; source: OrganizeSourceRow }
  | { kind: "chapter-add"; tier: string; sourceId: number; sourceName: string; suggestedChapter: number }
  | { kind: "chapter-edit"; tier: string; sourceId: number; sourceName: string; chapter: number; title: SectionTitleRow | null }
  | { kind: "subtier-add"; tier: string; sourceId: number; sourceName: string; chapter: number; suggestedSubTier: number }
  | {
      kind: "subtier-edit";
      tier: string;
      sourceId: number;
      sourceName: string;
      chapter: number;
      subTier: number;
      title: SectionTitleRow | null;
    };

// Hapus Chapter/Sub Chapter (di dalam satu Organize by) untuk SATU jenis konten
// (kotoba/kanji/bunpo). Nama Chapter/Sub Chapter disimpan per jenis konten
// (section_titles_<jenis>), jadi menghapus di Kotoba tidak menyentuh Kanji
// maupun Bunpō, dan sebaliknya.
async function deleteTreeNode(
  kind: ContentKind,
  tier: string,
  sourceId: number,
  chapter: number,
  subTier?: number,
): Promise<string | null> {
  let del = supabase.from(tableFor(kind, tier)).delete().eq("source_id", sourceId).eq("chapter", chapter);
  if (subTier !== undefined) del = del.eq("sub_tier", subTier);
  const { error } = await del;
  if (error) return error.message;

  let delTitles = supabase.from(sectionTitlesTable(kind)).delete().eq("source_id", sourceId).eq("chapter", chapter);
  if (subTier !== undefined) delTitles = delTitles.eq("sub_tier", subTier);
  const { error: titleErr } = await delTitles;
  return titleErr ? titleErr.message : null;
}

// State + handler pohon Tier -> Organize by -> Chapter -> Sub Chapter yang
// dipakai bareng oleh Kotoba, Kanji, dan Bunpō. Tiap section cuma nambahin
// form entri dan kolom tabelnya sendiri.
function useContentTree<T extends TreeRow>(kind: ContentKind, noun: string, canDelete: boolean) {
  const { tr } = useAdminTr();
  const [entries, setEntries] = useState<T[]>([]);
  const [titles, setTitles] = useState<SectionTitleRow[]>([]);
  const [sources, setSources] = useState<OrganizeSourceRow[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  // true cuma sampai muat pertama selesai — reload setelah simpan/hapus tidak
  // memunculkan skeleton lagi (biar pohonnya gak berkedip).
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SelectedSubTier | null>(null);
  const [expandedTiers, setExpandedTiers] = useState<Set<string>>(() => new Set(["N5"]));
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [expandedSubTiers, setExpandedSubTiers] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<NodeDialog | null>(null);
  const [dialogStatus, setDialogStatus] = useState<string | null>(null);

  const tree = useMemo(() => buildContentTree<T>(sources, titles, entries), [sources, titles, entries]);
  const tierOrder = TIERS;

  const sourceLabel = (sourceId: number): string => {
    const row = sources.find((s) => s.id === sourceId);
    return row ? sourceName(row, "id") : "—";
  };

  const load = async () => {
    try {
      const [tierResults, titlesRes, sourcesRes] = await Promise.all([
        Promise.all(
          TIERS.map((t) =>
            supabase.from(tableFor(kind, t)).select("*").order("chapter").order("sub_tier").order("id"),
          ),
        ),
        fetchAllSectionTitles(kind),
        fetchOrganizeSources(kind),
      ]);
      const failed = tierResults.find((r) => r.error);
      if (failed?.error) setStatus(failed.error.message);
      else setEntries(tierResults.flatMap((r) => (r.data ?? []) as T[]));
      setTitles(titlesRes);
      setSources(sourcesRes);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleInSet = (setter: Dispatch<SetStateAction<Set<string>>>, key: string) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const addToSet = (setter: Dispatch<SetStateAction<Set<string>>>, key: string) => {
    setter((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  };

  const handleToggleTier = (tierName: string) => toggleInSet(setExpandedTiers, tierName);
  const handleToggleSource = (sourceId: number) => toggleInSet(setExpandedSources, String(sourceId));
  const handleToggleChapter = (sourceId: number, chapter: number) =>
    toggleInSet(setExpandedChapters, `${sourceId}::${chapter}`);
  const handleToggleSubTier = (sourceId: number, chapter: number, subTier: number) =>
    toggleInSet(setExpandedSubTiers, `${sourceId}::${chapter}::${subTier}`);
  const handleSelectSubTier = (tierName: string, sourceId: number, chapter: number, subTier: number) => {
    setSelected({ tier: tierName, sourceId, chapter, subTier });
    setStatus(null);
  };
  // dipakai abis simpan entri: buka pohonnya sampai Sub Chapter yang baru diisi.
  const landOn = (tierName: string, sourceId: number, chapter: number, subTier: number) => {
    setSelected({ tier: tierName, sourceId, chapter, subTier });
    addToSet(setExpandedTiers, tierName);
    addToSet(setExpandedSources, String(sourceId));
    addToSet(setExpandedChapters, `${sourceId}::${chapter}`);
  };

  const findSource = (sourceId: number): SourceNode<T> | undefined => {
    for (const tierNode of tree.values()) {
      const hit = tierNode.sources.find((s) => s.source.id === sourceId);
      if (hit) return hit;
    }
    return undefined;
  };

  const closeDialog = () => {
    setDialog(null);
    setDialogStatus(null);
  };
  const openSourceAdd = (tierName: string) => {
    setDialogStatus(null);
    setDialog({ kind: "source-add", tier: tierName });
  };
  const openSourceEdit = (tierName: string, source: OrganizeSourceRow) => {
    setDialogStatus(null);
    setDialog({ kind: "source-edit", tier: tierName, source });
  };
  const openChapterAdd = (tierName: string, sourceId: number) => {
    const node = findSource(sourceId);
    const maxChapter = node && node.chapters.size > 0 ? Math.max(...node.chapters.keys()) : 0;
    setDialogStatus(null);
    setDialog({
      kind: "chapter-add",
      tier: tierName,
      sourceId,
      sourceName: sourceLabel(sourceId),
      suggestedChapter: maxChapter + 1,
    });
  };
  const openChapterEdit = (tierName: string, sourceId: number, chapter: number, title: SectionTitleRow | null) => {
    setDialogStatus(null);
    setDialog({ kind: "chapter-edit", tier: tierName, sourceId, sourceName: sourceLabel(sourceId), chapter, title });
  };
  const openSubTierAdd = (tierName: string, sourceId: number, chapter: number) => {
    const chapterNode = findSource(sourceId)?.chapters.get(chapter);
    const maxSub = chapterNode && chapterNode.subTiers.size > 0 ? Math.max(...chapterNode.subTiers.keys()) : 0;
    setDialogStatus(null);
    setDialog({
      kind: "subtier-add",
      tier: tierName,
      sourceId,
      sourceName: sourceLabel(sourceId),
      chapter,
      suggestedSubTier: maxSub + 1,
    });
  };
  const openSubTierEdit = (
    tierName: string,
    sourceId: number,
    chapter: number,
    subTier: number,
    title: SectionTitleRow | null,
  ) => {
    setDialogStatus(null);
    setDialog({ kind: "subtier-edit", tier: tierName, sourceId, sourceName: sourceLabel(sourceId), chapter, subTier, title });
  };

  const handleDialogSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!dialog) return;
    const form = new FormData(e.currentTarget);
    const titleId = String(form.get("title_id") ?? "").trim();
    const titleEn = String(form.get("title_en") ?? "").trim();

    if (dialog.kind === "source-add") {
      if (!titleId && !titleEn) {
        setDialogStatus(tr("Isi nama Organize by (Indonesia atau English)."));
        return;
      }
      const tierSources = tree.get(dialog.tier)?.sources ?? [];
      const nextOrder = tierSources.length > 0 ? Math.max(...tierSources.map((s) => s.source.sort_order)) + 1 : 0;
      setDialogStatus(tr("Menyimpan…"));
      const res = await createOrganizeSource(kind, dialog.tier, titleId || titleEn, titleEn || titleId, nextOrder);
      if (res.error || !res.row) {
        setDialogStatus(tr("Gagal:") + " " + (res.error ?? tr("tidak diketahui")));
        return;
      }
      addToSet(setExpandedTiers, dialog.tier);
      addToSet(setExpandedSources, String(res.row.id));
      closeDialog();
      load();
      return;
    }

    if (dialog.kind === "source-edit") {
      if (!titleId && !titleEn) {
        setDialogStatus(tr("Nama Organize by tidak boleh kosong."));
        return;
      }
      setDialogStatus(tr("Menyimpan…"));
      const err = await renameOrganizeSource(dialog.source.id, titleId || titleEn, titleEn || titleId);
      if (err) {
        setDialogStatus(tr("Gagal:") + " " + err);
        return;
      }
      closeDialog();
      load();
      return;
    }

    if (dialog.kind === "chapter-add") {
      const chapterNum = Number(form.get("chapter"));
      if (!isPositiveInteger(chapterNum)) {
        setDialogStatus(tr("Nomor Chapter harus bilangan bulat positif (1, 2, 3…)."));
        return;
      }
      if (findSource(dialog.sourceId)?.chapters.has(chapterNum)) {
        setDialogStatus(tr("Chapter {n} sudah ada di {source}.", { n: chapterNum, source: dialog.sourceName }));
        return;
      }
      setDialogStatus(tr("Menyimpan…"));
      const err = await ensureSectionTitleRow(kind, {
        tier: dialog.tier,
        source_id: dialog.sourceId,
        chapter: chapterNum,
        sub_tier: CHAPTER_TITLE_SUB_TIER,
        title_id: titleId,
        title_en: titleEn,
      });
      if (err) {
        setDialogStatus(tr("Gagal:") + " " + err);
        return;
      }
      addToSet(setExpandedTiers, dialog.tier);
      addToSet(setExpandedSources, String(dialog.sourceId));
      addToSet(setExpandedChapters, `${dialog.sourceId}::${chapterNum}`);
      closeDialog();
      load();
      return;
    }

    if (dialog.kind === "chapter-edit") {
      setDialogStatus(tr("Menyimpan…"));
      const err = await ensureSectionTitleRow(kind, {
        tier: dialog.tier,
        source_id: dialog.sourceId,
        chapter: dialog.chapter,
        sub_tier: CHAPTER_TITLE_SUB_TIER,
        title_id: titleId,
        title_en: titleEn,
      });
      if (err) {
        setDialogStatus(tr("Gagal:") + " " + err);
        return;
      }
      closeDialog();
      load();
      return;
    }

    if (dialog.kind === "subtier-add") {
      const subNum = Number(form.get("sub_tier"));
      if (!isPositiveInteger(subNum)) {
        setDialogStatus(tr("Nomor Sub Chapter harus bilangan bulat positif (1, 2, 3…)."));
        return;
      }
      if (findSource(dialog.sourceId)?.chapters.get(dialog.chapter)?.subTiers.has(subNum)) {
        setDialogStatus(tr("Sub Chapter {sc} sudah ada.", { sc: `${dialog.chapter}.${subNum}` }));
        return;
      }
      setDialogStatus(tr("Menyimpan…"));
      const err = await ensureSectionTitleRow(kind, {
        tier: dialog.tier,
        source_id: dialog.sourceId,
        chapter: dialog.chapter,
        sub_tier: subNum,
        title_id: titleId,
        title_en: titleEn,
      });
      if (err) {
        setDialogStatus(tr("Gagal:") + " " + err);
        return;
      }
      addToSet(setExpandedChapters, `${dialog.sourceId}::${dialog.chapter}`);
      closeDialog();
      load();
      return;
    }

    if (dialog.kind === "subtier-edit") {
      setDialogStatus(tr("Menyimpan…"));
      const err = await ensureSectionTitleRow(kind, {
        tier: dialog.tier,
        source_id: dialog.sourceId,
        chapter: dialog.chapter,
        sub_tier: dialog.subTier,
        title_id: titleId,
        title_en: titleEn,
      });
      if (err) {
        setDialogStatus(tr("Gagal:") + " " + err);
        return;
      }
      closeDialog();
      load();
      return;
    }
  };

  const handleDeleteSource = async (tierName: string, source: OrganizeSourceRow) => {
    if (!canDelete) return; // hapus khusus dev
    const node = findSource(source.id);
    const chapterCount = node?.chapters.size ?? 0;
    let entryCount = 0;
    node?.chapters.forEach((c) => c.subTiers.forEach((s) => (entryCount += s.entries.length)));
    const name = sourceName(source, "id");
    if (
      !confirm(
        tr("Hapus Organize by \"{name}\" di {tier}? {chapters} Chapter dan {entries} {noun} di dalamnya akan terhapus permanen.", { name, tier: tierName, chapters: chapterCount, entries: entryCount, noun }),
      )
    )
      return;
    setStatus(tr("Menghapus…"));
    const err = await deleteOrganizeSource(source.id);
    if (err) {
      setStatus(tr("Gagal hapus:") + " " + err);
      return;
    }
    if (selected?.sourceId === source.id) setSelected(null);
    setStatus(tr("Organize by \"{name}\" di {tier} dihapus.", { name, tier: tierName }));
    load();
  };

  const handleDeleteChapter = async (tierName: string, sourceId: number, chapter: number) => {
    if (!canDelete) return; // hapus khusus dev
    if (!confirm(tr("Hapus Chapter {chapter} di {tier} · {source}? Semua Sub Chapter dan {noun} di dalamnya akan terhapus permanen.", { chapter, tier: tierName, source: sourceLabel(sourceId), noun }))) return;
    setStatus(tr("Menghapus…"));
    const err = await deleteTreeNode(kind, tierName, sourceId, chapter);
    if (err) {
      setStatus(tr("Gagal hapus:") + " " + err);
      return;
    }
    if (selected?.sourceId === sourceId && selected.chapter === chapter) setSelected(null);
    setStatus(tr("Chapter {chapter} di {tier} dihapus.", { chapter, tier: tierName }));
    load();
  };

  const handleDeleteSubTier = async (tierName: string, sourceId: number, chapter: number, subTier: number) => {
    if (!canDelete) return; // hapus khusus dev
    if (!confirm(tr("Hapus Sub Chapter {sc} di {tier} · {source}? Semua {noun} di dalamnya akan terhapus permanen.", { sc: `${chapter}.${subTier}`, tier: tierName, source: sourceLabel(sourceId), noun }))) return;
    setStatus(tr("Menghapus…"));
    const err = await deleteTreeNode(kind, tierName, sourceId, chapter, subTier);
    if (err) {
      setStatus(tr("Gagal hapus:") + " " + err);
      return;
    }
    if (selected?.sourceId === sourceId && selected.chapter === chapter && selected.subTier === subTier) setSelected(null);
    setStatus(tr("Sub Chapter {sc} di {tier} dihapus.", { sc: `${chapter}.${subTier}`, tier: tierName }));
    load();
  };

  return {
    entries,
    loading,
    status,
    setStatus,
    tree,
    tierOrder,
    selected,
    setSelected,
    expandedTiers,
    expandedSources,
    expandedChapters,
    expandedSubTiers,
    dialog,
    dialogStatus,
    sourceLabel,
    canDelete,
    load,
    landOn,
    closeDialog,
    handleToggleTier,
    handleToggleSource,
    handleToggleChapter,
    handleToggleSubTier,
    handleSelectSubTier,
    openSourceAdd,
    openSourceEdit,
    openChapterAdd,
    openChapterEdit,
    openSubTierAdd,
    openSubTierEdit,
    handleDialogSubmit,
    handleDeleteSource,
    handleDeleteChapter,
    handleDeleteSubTier,
  };
}

type ContentTreeState<T extends TreeRow> = ReturnType<typeof useContentTree<T>>;

type TreeViewConfig<T> = {
  /** Kata benda buat teks UI, mis. "kotoba", "kanji", "bunpō". */
  noun: string;
  addLabel: string;
  /** Header kolom sebelum kolom "Bab" & aksi. */
  headers: string[];
  /** Sel <td> sebelum kolom "Bab" & aksi (jumlahnya = headers.length). */
  renderCells: (row: T) => ReactNode;
  leafPrimary: (row: T) => string;
  leafSecondary: (row: T) => string;
};

function ContentTreeView<T extends TreeRow>({
  t,
  config,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
}: {
  t: ContentTreeState<T>;
  config: TreeViewConfig<T>;
  onAddEntry: () => void;
  onEditEntry: (row: T) => void;
  onDeleteEntry: (row: T) => void;
}) {
  const { tr } = useAdminTr();
  const {
    loading,
    tree,
    tierOrder,
    selected,
    status,
    expandedTiers,
    expandedSources,
    expandedChapters,
    expandedSubTiers,
    dialog,
    dialogStatus,
    sourceLabel,
    canDelete,
    closeDialog,
    handleToggleTier,
    handleToggleSource,
    handleToggleChapter,
    handleToggleSubTier,
    handleSelectSubTier,
    openSourceAdd,
    openSourceEdit,
    openChapterAdd,
    openChapterEdit,
    openSubTierAdd,
    openSubTierEdit,
    handleDialogSubmit,
    handleDeleteSource,
    handleDeleteChapter,
    handleDeleteSubTier,
  } = t;

  const selectedSourceNode = selected
    ? tree.get(selected.tier)?.sources.find((s) => s.source.id === selected.sourceId)
    : undefined;
  const selectedChapterNode = selected ? selectedSourceNode?.chapters.get(selected.chapter) : undefined;
  const selectedSubNode = selected ? selectedChapterNode?.subTiers.get(selected.subTier) : undefined;
  const detailRows = selectedSubNode?.entries ?? [];

  const renderSubTiers = (tierName: string, sourceId: number, chapterNode: ChapterNode<T>) => {
    const chapterKey = `${sourceId}::${chapterNode.chapter}`;
    const subTiers = [...chapterNode.subTiers.values()].sort((a, b) => a.subTier - b.subTier);
    return (
      <div className="adm-tree-children">
        {subTiers.map((subNode) => {
          const subKey = `${chapterKey}::${subNode.subTier}`;
          const subOpen = expandedSubTiers.has(subKey);
          const isActive =
            !!selected &&
            selected.sourceId === sourceId &&
            selected.chapter === chapterNode.chapter &&
            selected.subTier === subNode.subTier;
          return (
            <div className="adm-tree-node" key={subKey}>
              <div className={`adm-tree-row adm-tree-row--subtier${isActive ? " active" : ""}`}>
                <button
                  type="button"
                  className="adm-tree-toggle"
                  onClick={() => handleToggleSubTier(sourceId, chapterNode.chapter, subNode.subTier)}
                  disabled={subNode.entries.length === 0}
                  aria-label={subOpen ? tr("Tutup") : tr("Buka")}
                >
                  <IconChevronDown className={`adm-tree-caret${subOpen && subNode.entries.length > 0 ? " open" : ""}`} />
                </button>
                <span className="adm-tree-icon">
                  <IconFolder />
                </span>
                <button
                  type="button"
                  className="adm-tree-label-btn"
                  onClick={() => handleSelectSubTier(tierName, sourceId, chapterNode.chapter, subNode.subTier)}
                >
                  <NodeLabel fallback={`Sub Chapter ${subNode.subTier}`} name={subNode.title?.title_id} />
                </button>
                <span className="adm-tree-badge">
                  {subNode.entries.length} {config.noun}
                </span>
                <span className="adm-tree-row-actions">
                  <button
                    type="button"
                    className="adm-icon-btn"
                    onClick={() => openSubTierEdit(tierName, sourceId, chapterNode.chapter, subNode.subTier, subNode.title)}
                    aria-label={`Edit Sub Chapter ${chapterNode.chapter}.${subNode.subTier}`}
                  >
                    <IconEdit />
                  </button>
                  {canDelete && (
                    <button
                      type="button"
                      className="adm-icon-btn danger"
                      onClick={() => handleDeleteSubTier(tierName, sourceId, chapterNode.chapter, subNode.subTier)}
                      aria-label={tr("Hapus Sub Chapter {label}", { label: `${chapterNode.chapter}.${subNode.subTier}` })}
                    >
                      <IconTrash />
                    </button>
                  )}
                </span>
              </div>

              {subOpen && subNode.entries.length > 0 && (
                <div className="adm-tree-children adm-tree-leaves">
                  {subNode.entries.map((entry) => (
                    <button
                      type="button"
                      key={entry.id}
                      className="adm-tree-row adm-tree-row--leaf"
                      onClick={() => handleSelectSubTier(tierName, sourceId, chapterNode.chapter, subNode.subTier)}
                    >
                      <span className="adm-tree-icon adm-tree-leaf-icon">
                        <IconDocument />
                      </span>
                      <span className="adm-tree-label">{config.leafPrimary(entry)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <button type="button" className="adm-tree-add-link" onClick={() => openSubTierAdd(tierName, sourceId, chapterNode.chapter)}>
          <IconPlus /> {tr("Tambah Sub Chapter")}
        </button>
      </div>
    );
  };

  const renderChapters = (tierName: string, sourceNode: SourceNode<T>) => {
    const sourceId = sourceNode.source.id;
    const chapters = [...sourceNode.chapters.values()].sort((a, b) => a.chapter - b.chapter);
    return (
      <div className="adm-tree-children">
        {chapters.map((chapterNode) => {
          const chapterKey = `${sourceId}::${chapterNode.chapter}`;
          const subCount = chapterNode.subTiers.size;
          const chapterOpen = expandedChapters.has(chapterKey);
          return (
            <div className="adm-tree-node" key={chapterKey}>
              <div className="adm-tree-row adm-tree-row--chapter">
                <button
                  type="button"
                  className="adm-tree-toggle"
                  onClick={() => handleToggleChapter(sourceId, chapterNode.chapter)}
                  disabled={subCount === 0}
                  aria-label={chapterOpen ? tr("Tutup") : tr("Buka")}
                >
                  <IconChevronDown className={`adm-tree-caret${chapterOpen && subCount > 0 ? " open" : ""}`} />
                </button>
                <span className="adm-tree-icon">
                  <IconFolder />
                </span>
                <button
                  type="button"
                  className="adm-tree-label-btn"
                  onClick={() => handleToggleChapter(sourceId, chapterNode.chapter)}
                >
                  <NodeLabel fallback={`Chapter ${chapterNode.chapter}`} name={chapterNode.title?.title_id} />
                </button>
                <span className="adm-tree-badge">{subCount} sub chapter</span>
                <span className="adm-tree-row-actions">
                  <button
                    type="button"
                    className="adm-icon-btn"
                    onClick={() => openChapterEdit(tierName, sourceId, chapterNode.chapter, chapterNode.title)}
                    aria-label={`Edit Chapter ${chapterNode.chapter}`}
                  >
                    <IconEdit />
                  </button>
                  {canDelete && (
                    <button
                      type="button"
                      className="adm-icon-btn danger"
                      onClick={() => handleDeleteChapter(tierName, sourceId, chapterNode.chapter)}
                      aria-label={tr("Hapus Chapter {n}", { n: chapterNode.chapter })}
                    >
                      <IconTrash />
                    </button>
                  )}
                </span>
              </div>
              {chapterOpen && renderSubTiers(tierName, sourceId, chapterNode)}
            </div>
          );
        })}
        <button type="button" className="adm-tree-add-link" onClick={() => openChapterAdd(tierName, sourceId)}>
          <IconPlus /> {tr("Tambah Chapter")}
        </button>
      </div>
    );
  };

  const renderSources = (tierName: string, sources: SourceNode<T>[]) => (
    <div className="adm-tree-children">
      {sources.map((sourceNode) => {
        const source = sourceNode.source;
        const sourceOpen = expandedSources.has(String(source.id));
        return (
          <div className="adm-tree-node" key={source.id}>
            <div className="adm-tree-row adm-tree-row--source">
              <button
                type="button"
                className="adm-tree-toggle"
                onClick={() => handleToggleSource(source.id)}
                aria-label={sourceOpen ? tr("Tutup") : tr("Buka")}
              >
                <IconChevronDown className={`adm-tree-caret${sourceOpen ? " open" : ""}`} />
              </button>
              <span className="adm-tree-icon">
                <IconLayers />
              </span>
              <button type="button" className="adm-tree-label-btn" onClick={() => handleToggleSource(source.id)}>
                <span className="adm-tree-tag">Organize by</span> {sourceName(source, "id")}
              </button>
              <span className="adm-tree-badge">{sourceNode.chapters.size} chapter</span>
              <span className="adm-tree-row-actions">
                <button
                  type="button"
                  className="adm-icon-btn"
                  onClick={() => openSourceEdit(tierName, source)}
                  aria-label={tr("Ubah nama Organize by {name}", { name: sourceName(source, "id") })}
                >
                  <IconEdit />
                </button>
                {canDelete && (
                  <button
                    type="button"
                    className="adm-icon-btn danger"
                    onClick={() => handleDeleteSource(tierName, source)}
                    aria-label={tr("Hapus Organize by {name}", { name: sourceName(source, "id") })}
                  >
                    <IconTrash />
                  </button>
                )}
              </span>
            </div>
            {sourceOpen && renderChapters(tierName, sourceNode)}
          </div>
        );
      })}
      <button type="button" className="adm-tree-add-link" onClick={() => openSourceAdd(tierName)}>
        <IconPlus /> {tr("Tambah Organize by")}
      </button>
    </div>
  );

  return (
    <>
      <div className="adm-kotoba-layout">
        <div className="adm-card adm-tree-panel">
          <div className="adm-tree-scroll">
            {loading ? (
              <TreeSkeleton />
            ) : (
              tierOrder.map((tierName) => {
                const sources = tree.get(tierName)?.sources ?? [];
                const tierOpen = expandedTiers.has(tierName);
                return (
                  <div className="adm-tree-node" key={tierName}>
                    <div className="adm-tree-row adm-tree-row--tier">
                      <button
                        type="button"
                        className="adm-tree-toggle"
                        onClick={() => handleToggleTier(tierName)}
                        aria-label={tierOpen ? tr("Tutup") : tr("Buka")}
                      >
                        <IconChevronDown className={`adm-tree-caret${tierOpen ? " open" : ""}`} />
                      </button>
                      <span className="adm-tree-icon">
                        <IconFolder />
                      </span>
                      <button type="button" className="adm-tree-label-btn" onClick={() => handleToggleTier(tierName)}>
                        {tierName}
                      </button>
                      <span className="adm-tree-badge">{sources.length} organize by</span>
                    </div>
                    {tierOpen && renderSources(tierName, sources)}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="adm-tree-detail">
          {!selected ? (
            <div className="adm-card adm-tree-detail-empty">
              <IconBook className="adm-empty-icon" />
              <p>{tr("Pilih Sub Chapter di sebelah kiri untuk melihat & mengelola {noun} di dalamnya.", { noun: config.noun })}</p>
            </div>
          ) : (
            <>
              <div className="adm-tree-breadcrumb">
                <span>{selected.tier}</span>
                <span className="sep">›</span>
                <span>{sourceLabel(selected.sourceId)}</span>
                <span className="sep">›</span>
                <span>
                  <NodeLabel fallback={`Chapter ${selected.chapter}`} name={selectedChapterNode?.title?.title_id} />
                </span>
                <span className="sep">›</span>
                <span>
                  <NodeLabel fallback={`Sub Chapter ${selected.subTier}`} name={selectedSubNode?.title?.title_id} />
                </span>
              </div>
              <div className="adm-tree-detail-head">
                <div>
                  <h2>
                    <NodeLabel fallback={`Sub Chapter ${selected.subTier}`} name={selectedSubNode?.title?.title_id} />
                  </h2>
                  <span className="adm-tree-badge">
                    {detailRows.length} {config.noun}
                  </span>
                </div>
                <div className="adm-tree-detail-actions">
                  <button type="button" className="adm-btn adm-btn-primary" onClick={onAddEntry}>
                    <IconPlus /> {tr(config.addLabel)}
                  </button>
                  <button
                    type="button"
                    className="adm-icon-btn"
                    onClick={() =>
                      openSubTierEdit(selected.tier, selected.sourceId, selected.chapter, selected.subTier, selectedSubNode?.title ?? null)
                    }
                    aria-label="Edit Sub Chapter"
                  >
                    <IconEdit />
                  </button>
                  {canDelete && (
                    <button
                      type="button"
                      className="adm-icon-btn danger"
                      onClick={() => handleDeleteSubTier(selected.tier, selected.sourceId, selected.chapter, selected.subTier)}
                      aria-label={tr("Hapus Sub Chapter")}
                    >
                      <IconTrash />
                    </button>
                  )}
                </div>
              </div>

              <StatusLine status={status} />
              <div className="adm-card adm-table-card">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th className="adm-th-no">No</th>
                      {config.headers.map((h) => (
                        <th key={h}>{tr(h)}</th>
                      ))}
                      <th>{tr("Bab")}</th>
                      <th aria-hidden="true" />
                    </tr>
                  </thead>
                  <tbody>
                    {detailRows.map((row, idx) => (
                      <tr key={row.id}>
                        <td className="adm-td-no">{idx + 1}</td>
                        {config.renderCells(row)}
                        <td className="adm-muted">
                          {row.chapter}.{row.sub_tier}
                        </td>
                        <td className="adm-td-action">
                          <button type="button" className="adm-icon-btn" onClick={() => onEditEntry(row)} aria-label="Edit">
                            <IconEdit />
                          </button>
                          {canDelete && (
                            <button type="button" className="adm-icon-btn danger" onClick={() => onDeleteEntry(row)} aria-label={tr("Hapus")}>
                              <IconTrash />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {detailRows.length === 0 && (
                      <tr>
                        <td colSpan={config.headers.length + 3} className="adm-muted adm-empty-row">
                          {tr("Belum ada {noun} di Sub Chapter ini.", { noun: config.noun })}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {dialog && <NodeFormDialog dialog={dialog} status={dialogStatus} onSubmit={handleDialogSubmit} onClose={closeDialog} />}
    </>
  );
}

const KOTOBA_TREE_CONFIG: TreeViewConfig<KotobaRow> = {
  noun: "kotoba",
  addLabel: "Tambah Kotoba",
  headers: ["Kana", "Romaji", "Arti"],
  renderCells: (row) => (
    <>
      <td className="adm-td-jp">{row.kana}</td>
      <td className="adm-muted">{row.romaji}</td>
      <td>
        {row.meaning_id}
        {row.meaning_en ? <span className="adm-muted"> / {row.meaning_en}</span> : null}
      </td>
    </>
  ),
  leafPrimary: (row) => row.kana,
  leafSecondary: (row) => row.meaning_id,
};

function KotobaSection({
  autoAddToken,
  canDelete,
  onAutoAddHandled,
  onLogActivity,
  onNavigateToDashboard,
}: {
  autoAddToken?: number;
  canDelete: boolean;
  onAutoAddHandled: () => void;
  onLogActivity: (entry: Omit<ActivityEntry, "id" | "at">) => void;
  onNavigateToDashboard: () => void;
}) {
  const { tr } = useAdminTr();
  const t = useContentTree<KotobaRow>("kotoba", "kotoba", canDelete);
  const { status, setStatus, selected, load } = t;
  const [view, setView] = useState<"browse" | "add" | "edit">("browse");
  const [formKey, setFormKey] = useState(0);
  const [editingRow, setEditingRow] = useState<KotobaRow | null>(null);
  useEffect(() => {
    if (autoAddToken) {
      // Dashboard "Aksi Cepat": Sub Chapter tujuan belum diketahui, jadi arahkan
      // ke tree dulu — form tambah dibuka dari Sub Chapter yang dipilih.
      setEditingRow(null);
      setView("browse");
      setStatus(tr("Pilih Sub Chapter dulu, lalu klik \"{label}\".", { label: tr(KOTOBA_TREE_CONFIG.addLabel) }));
      onAutoAddHandled();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAddToken]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>, submitter: HTMLButtonElement | null) => {
    e.preventDefault();
    // Simpen referensi form-nya duluan, sebelum ada `await` — React nge-null-in
    // e.currentTarget begitu event handler-nya lewatin await pertama, jadi
    // e.currentTarget.reset() di bawah (abis beberapa await) bakal throw diem-diem
    // kalau gak ditangkep dari awal begini.
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    // Lokasi entri tidak diisi lewat form: entri baru masuk ke Sub Chapter yang
    // lagi dipilih di tree, entri yang diedit tetap di tempatnya.
    const loc: SelectedSubTier | null =
      view === "edit" && editingRow
        ? { tier: editingRow.tier, sourceId: editingRow.source_id, chapter: editingRow.chapter, subTier: editingRow.sub_tier }
        : selected;
    if (!loc) {
      setStatus(tr("Pilih Sub Chapter dulu di daftar sebelum menambah entri."));
      return;
    }
    // kalimat mentah (masih ada penanda "/") — dipakai buat bikin segments
    const rawExample = String(form.get("example") ?? "");
    const payload = {
      tier: loc.tier,
      source_id: loc.sourceId,
      chapter: loc.chapter,
      sub_tier: loc.subTier,
      kana: String(form.get("kana") ?? "").trim(),
      romaji: String(form.get("romaji") ?? "").trim(),
      meaning_en: String(form.get("meaning_en") ?? "").trim(),
      meaning_id: String(form.get("meaning_id") ?? "").trim(),
      example: cleanExample(String(form.get("example") ?? "")),
      example_translation_en: String(form.get("example_translation_en") ?? "").trim(),
      example_translation_id: String(form.get("example_translation_id") ?? "").trim(),
      kanji_word: String(form.get("kanji_word") ?? "").trim(),
      kanji_example: String(form.get("kanji_example") ?? "").trim(),
      usage_en: String(form.get("usage_en") ?? "").trim() || null,
      usage_id: String(form.get("usage_id") ?? "").trim() || null,
    };
    const kotobaPayload = {
      ...payload,
      // Segments otomatis dari kalimat contoh, gak diinput manual lagi.
      segments: autoSegmentExample(rawExample, payload.kana, payload.romaji),
    };
    const landOn = () => t.landOn(payload.tier, payload.source_id, payload.chapter, payload.sub_tier);
    setStatus(tr("Menyimpan…"));
    if (view === "edit" && editingRow) {
      const { error } = await supabase.from(tableFor("kotoba", editingRow.tier)).update(kotobaPayload).eq("id", editingRow.id);
      if (error) {
        setStatus(tr("Gagal:") + " " + error.message);
        return;
      }
      setStatus(tr("Perubahan tersimpan."));
      setEditingRow(null);
      landOn();
      setView("browse");
      load();
      return;
    }
    const { error } = await supabase.from(tableFor("kotoba", kotobaPayload.tier)).insert(kotobaPayload);
    if (error) {
      setStatus(tr("Gagal:") + " " + error.message);
      return;
    }
    setStatus(tr("Tersimpan."));
    onLogActivity({ action: "add", kind: "kotoba", label: payload.kana, meaning: payload.meaning_id, tier: payload.tier });
    load();
    if (submitter?.value === "done") {
      // "Simpan": balik ke tree, langsung nunjuk ke Sub Chapter yang baru
      // ditambahin (bukan Dashboard — akun admin gak punya akses ke
      // Dashboard, cuma dev yang punya).
      landOn();
      setView("browse");
    } else {
      // "Simpan & Tambah Lagi": bersihkan form sepenuhnya (termasuk counter
      // karakter) dengan remount, lalu tetap di halaman tambah dan scroll
      // balik ke field paling atas.
      formEl.reset();
      setFormKey((k) => k + 1);
      scrollFormToTop();
      setStatus(tr("Tersimpan. Silakan tambah entri berikutnya."));
    }
  };

  const handleDelete = async (row: KotobaRow) => {
    if (!canDelete) return; // hapus khusus dev
    if (!confirm(tr("Hapus entry ini?"))) return;
    const { error } = await supabase.from(tableFor("kotoba", row.tier)).delete().eq("id", row.id);
    if (error) {
      setStatus(tr("Gagal hapus:") + " " + error.message);
      return;
    }
    onLogActivity({ action: "delete", kind: "kotoba", label: row.kana, meaning: row.meaning_id, tier: row.tier });
    load();
  };

  const handleEditClick = async (row: KotobaRow) => {
    setEditingRow(row);
    setStatus(null);
    setView("edit");
  };

  const handleAddKotobaClick = () => {
    if (!selected) return;
    setEditingRow(null);
    setStatus(null);
    setView("add");
  };

  const handleBack = () => {
    setEditingRow(null);
    setView("browse");
  };

  if (view === "add" || view === "edit") {
    const editing = view === "edit";
    const r = editingRow;
    const loc = r ? { tier: r.tier, sourceId: r.source_id, chapter: r.chapter, subTier: r.sub_tier } : selected;
    return (
      <>
        <PageHeader
          title={editing ? "Edit Kotoba" : "Tambah Kotoba"}
          subtitle={loc ? locationText(loc.tier, t.sourceLabel(loc.sourceId), loc.chapter, loc.subTier) : ""}
          onBack={handleBack}
        />
        <form
          key={editing ? `edit-${r?.id}` : formKey}
          className="adm-form"
          onSubmit={(e) => handleSubmit(e, (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)}
        >
          <SectionCard icon={<IconLayers />} title="Informasi Utama">
            <div className="adm-grid-2">
              <Field label="Kana" required>
                <input name="kana" placeholder={tr("Contoh: わたし")} defaultValue={r?.kana} required />
              </Field>
              <Field label="Romaji" required>
                <input name="romaji" placeholder={tr("Contoh: watashi")} defaultValue={r?.romaji} required />
              </Field>
            </div>
            <Field label="Kanji" required>
              <input name="kanji_word" placeholder={tr("Contoh: 私")} defaultValue={r?.kanji_word} required />
            </Field>
            <div className="adm-grid-2">
              <Field label="Arti Indonesia" required>
                <input name="meaning_id" placeholder={tr("Contoh: saya")} defaultValue={r?.meaning_id} required />
              </Field>
              <Field label="Arti English" required>
                <input name="meaning_en" placeholder={tr("Contoh: I / me")} defaultValue={r?.meaning_en} required />
              </Field>
            </div>
          </SectionCard>

          <SectionCard icon={<IconChat />} title="Contoh Penggunaan" desc="Contoh kalimat beserta terjemahannya.">
            <div className="adm-grid-2">
              <Field
                label="Kalimat Jepang"
                required
                hint="Pisahkan tiap kata dengan / (mis. わたし/は/がくせい/です。). Tanda / cuma buat memisah, tidak ikut tampil di kalimat."
              >
                <CountedTextarea name="example" placeholder={tr("Contoh: わたし/は/がくせい/です。")} maxLength={260} required defaultValue={r ? markExample(r.example, r.segments) : undefined} />
              </Field>
              <Field label="Kalimat Jepang (Kanji)" required>
                <CountedTextarea name="kanji_example" placeholder={tr("Contoh: 私は学生です。")} maxLength={200} required defaultValue={r?.kanji_example} />
              </Field>
            </div>
            <Field label="Terjemahan Indonesia" required>
              <CountedTextarea
                name="example_translation_id"
                placeholder={tr("Contoh: Saya adalah seorang siswa.")}
                maxLength={200}
                required
                defaultValue={r?.example_translation_id}
              />
            </Field>
            <Field label="Terjemahan English" required>
              <CountedTextarea
                name="example_translation_en"
                placeholder={tr("Example: I am a student.")}
                maxLength={200}
                required
                defaultValue={r?.example_translation_en}
              />
            </Field>
            <Field label="Catatan" required icon={<IconNote />}>
              <div className="adm-grid-2">
                <textarea name="usage_id" rows={2} placeholder={tr("Catatan (ID)…")} defaultValue={r?.usage_id ?? undefined} required />
                <textarea name="usage_en" rows={2} placeholder={tr("Catatan (EN)…")} defaultValue={r?.usage_en ?? undefined} required />
              </div>
            </Field>
          </SectionCard>

          <StatusLine status={status} />
          <FormFooter editing={editing} />
        </form>
      </>
    );
  }

  return (
    <>
      <PageHeader sticky title="Kotoba" subtitle="Kelola kosakata yang tersimpan di database Supabase." />
      <StatusLine status={view === "browse" && !selected ? status : null} />
      <ContentTreeView
        t={t}
        config={KOTOBA_TREE_CONFIG}
        onAddEntry={handleAddKotobaClick}
        onEditEntry={handleEditClick}
        onDeleteEntry={handleDelete}
      />
    </>
  );
}

// Dialog kecil buat Tambah/Edit Organize by, Chapter & Sub Chapter — cuma
// ngurusin nomor + nama (ID/EN), gak nyentuh form entri yang lebih detail.
function NodeFormDialog({
  dialog,
  status,
  onSubmit,
  onClose,
}: {
  dialog: NodeDialog;
  status: string | null;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  const { tr } = useAdminTr();
  const isSource = dialog.kind === "source-add" || dialog.kind === "source-edit";
  const titleText =
    dialog.kind === "source-add"
      ? tr("Tambah Organize by — {tier}", { tier: dialog.tier })
      : dialog.kind === "source-edit"
        ? tr("Ubah Nama Organize by — {tier}", { tier: dialog.tier })
        : dialog.kind === "chapter-add"
          ? tr("Tambah Chapter")
          : dialog.kind === "chapter-edit"
            ? `Edit Chapter ${dialog.chapter} — ${dialog.tier}`
            : dialog.kind === "subtier-add"
              ? tr("Tambah Sub Chapter — {tier} Chapter {chapter}", { tier: dialog.tier, chapter: dialog.chapter })
              : `Edit Sub Chapter ${dialog.chapter}.${dialog.subTier} — ${dialog.tier}`;

  const existingTitle =
    dialog.kind === "chapter-edit" || dialog.kind === "subtier-edit"
      ? dialog.title
      : dialog.kind === "source-edit"
        ? { title_id: dialog.source.name_id, title_en: dialog.source.name_en }
        : null;
  const autoFocusNames = dialog.kind === "source-add" || dialog.kind === "source-edit" || dialog.kind === "chapter-edit" || dialog.kind === "subtier-edit";

  return (
    <div
      className="adm-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="adm-modal-panel" role="dialog" aria-modal="true" aria-label={titleText}>
        <div className="adm-modal-head">
          <h2>{titleText}</h2>
          <button type="button" className="adm-icon-btn" onClick={onClose} aria-label={tr("Tutup")}>
            <IconClose />
          </button>
        </div>
        <form className="adm-modal-form" onSubmit={onSubmit}>
          {dialog.kind === "source-add" && (
            <p className="adm-muted adm-modal-note">
              {tr("Organize by menandai materi di {tier} ini disusun berdasarkan apa — mis. Minna no Nihongo, Genki, atau Tema Harian. Setelah dibuat, isi dengan Chapter dan Sub Chapter.", { tier: dialog.tier })}
            </p>
          )}

          {dialog.kind === "chapter-add" && (
            <>
              <Field label="Lokasi">
                <input value={`${dialog.tier} — ${dialog.sourceName}`} disabled />
              </Field>
              <Field label="Nomor Chapter" required hint="Angka bulat, mis. 1, 2, 3.">
                <input
                  name="chapter"
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  onKeyDown={blockDecimalKey}
                  defaultValue={dialog.suggestedChapter}
                  required
                  autoFocus
                />
              </Field>
            </>
          )}

          {dialog.kind === "chapter-edit" && (
            <Field label="Chapter">
              <input value={`${dialog.tier} — ${dialog.sourceName} — Chapter ${dialog.chapter}`} disabled />
            </Field>
          )}

          {dialog.kind === "subtier-add" && (
            <>
              <Field label="Lokasi">
                <input value={`${dialog.tier} — ${dialog.sourceName} — Chapter ${dialog.chapter}`} disabled />
              </Field>
              <Field label="Nomor Sub Chapter" required hint="Angka bulat, mis. 1, 2, 3.">
                <input
                  name="sub_tier"
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  onKeyDown={blockDecimalKey}
                  defaultValue={dialog.suggestedSubTier}
                  required
                  autoFocus
                />
              </Field>
            </>
          )}

          {dialog.kind === "subtier-edit" && (
            <Field label="Sub Chapter">
              <input value={`${dialog.tier} — ${dialog.sourceName} — Chapter ${dialog.chapter}.${dialog.subTier}`} disabled />
            </Field>
          )}

          <div className="adm-grid-2">
            <Field
              label="Nama (Indonesia)"
              optional={!isSource}
              required={isSource}
              hint={isSource ? "Isi salah satu bahasa, yang kosong ikut bahasa lainnya." : "Bebas diisi. Kosongkan untuk pakai nama default."}
            >
              <input
                name="title_id"
                placeholder={tr(isSource ? "Contoh: Genki" : "Contoh: Manusia & Hubungan")}
                defaultValue={existingTitle?.title_id ?? undefined}
                autoFocus={autoFocusNames}
              />
            </Field>
            <Field label="Nama (English)" optional>
              <input
                name="title_en"
                placeholder={tr(isSource ? "Example: Genki" : "Contoh: People & Relationships")}
                defaultValue={existingTitle?.title_en ?? undefined}
              />
            </Field>
          </div>

          <StatusLine status={status} />
          <div className="adm-form-footer">
            <div className="adm-form-footer-right">
              <button type="button" className="adm-btn adm-btn-ghost" onClick={onClose}>
                {tr("Batal")}
              </button>
              <button type="submit" className="adm-btn adm-btn-primary">
                <IconSave /> {tr("Simpan")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------- Kanji

const KANJI_TREE_CONFIG: TreeViewConfig<KanjiRow> = {
  noun: "kanji",
  addLabel: "Tambah Kanji",
  headers: ["Kanji", "Cara Baca", "Arti"],
  renderCells: (row) => (
    <>
      <td className="adm-td-jp">{row.kanji}</td>
      <td className="adm-muted">{row.reading}</td>
      <td>
        {row.meaning_id}
        {row.meaning_en ? <span className="adm-muted"> / {row.meaning_en}</span> : null}
      </td>
    </>
  ),
  leafPrimary: (row) => row.kanji,
  leafSecondary: (row) => row.meaning_id,
};

function KanjiSection({
  autoAddToken,
  canDelete,
  onAutoAddHandled,
  onLogActivity,
  onNavigateToDashboard,
}: {
  autoAddToken?: number;
  canDelete: boolean;
  onAutoAddHandled: () => void;
  onLogActivity: (entry: Omit<ActivityEntry, "id" | "at">) => void;
  onNavigateToDashboard: () => void;
}) {
  const { tr } = useAdminTr();
  const t = useContentTree<KanjiRow>("kanji", "kanji", canDelete);
  const { status, setStatus, selected, load } = t;
  const [view, setView] = useState<"browse" | "add" | "edit">("browse");
  const [formKey, setFormKey] = useState(0);
  const [editingRow, setEditingRow] = useState<KanjiRow | null>(null);
  useEffect(() => {
    if (autoAddToken) {
      // Dashboard "Aksi Cepat": Sub Chapter tujuan belum diketahui, jadi arahkan
      // ke tree dulu — form tambah dibuka dari Sub Chapter yang dipilih.
      setEditingRow(null);
      setView("browse");
      setStatus(tr("Pilih Sub Chapter dulu, lalu klik \"{label}\".", { label: tr(KANJI_TREE_CONFIG.addLabel) }));
      onAutoAddHandled();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAddToken]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>, submitter: HTMLButtonElement | null) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    // Lokasi entri tidak diisi lewat form: entri baru masuk ke Sub Chapter yang
    // lagi dipilih di tree, entri yang diedit tetap di tempatnya.
    const loc: SelectedSubTier | null =
      view === "edit" && editingRow
        ? { tier: editingRow.tier, sourceId: editingRow.source_id, chapter: editingRow.chapter, subTier: editingRow.sub_tier }
        : selected;
    if (!loc) {
      setStatus(tr("Pilih Sub Chapter dulu di daftar sebelum menambah entri."));
      return;
    }
    const payload = {
      tier: loc.tier,
      source_id: loc.sourceId,
      chapter: loc.chapter,
      sub_tier: loc.subTier,
      kanji: String(form.get("kanji") ?? "").trim(),
      reading: String(form.get("reading") ?? "").trim(),
      kana: String(form.get("kana") ?? "").trim(),
      meaning_en: String(form.get("meaning_en") ?? "").trim(),
      meaning_id: String(form.get("meaning_id") ?? "").trim(),
    };
    const landOn = () => t.landOn(payload.tier, payload.source_id, payload.chapter, payload.sub_tier);
    setStatus(tr("Menyimpan…"));
    if (view === "edit" && editingRow) {
      const { error } = await supabase.from(tableFor("kanji", editingRow.tier)).update(payload).eq("id", editingRow.id);
      if (error) {
        setStatus(tr("Gagal:") + " " + error.message);
        return;
      }
      setStatus(tr("Perubahan tersimpan."));
      setEditingRow(null);
      landOn();
      setView("browse");
      load();
      return;
    }
    const { error } = await supabase.from(tableFor("kanji", payload.tier)).insert(payload);
    if (error) {
      setStatus(tr("Gagal:") + " " + error.message);
      return;
    }
    setStatus(tr("Tersimpan."));
    onLogActivity({ action: "add", kind: "kanji", label: payload.kanji, meaning: payload.meaning_id, tier: payload.tier });
    load();
    if (submitter?.value === "done") {
      // "Simpan": balik ke daftar Kanji (bukan Dashboard — akun admin gak
      // punya akses ke Dashboard, cuma dev yang punya).
      landOn();
      setView("browse");
    } else {
      formEl.reset();
      setFormKey((k) => k + 1);
      scrollFormToTop();
      setStatus(tr("Tersimpan. Silakan tambah entri berikutnya."));
    }
  };

  const handleDelete = async (row: KanjiRow) => {
    if (!canDelete) return; // hapus khusus dev
    if (!confirm(tr("Hapus entry ini?"))) return;
    const { error } = await supabase.from(tableFor("kanji", row.tier)).delete().eq("id", row.id);
    if (error) {
      setStatus(tr("Gagal hapus:") + " " + error.message);
      return;
    }
    onLogActivity({ action: "delete", kind: "kanji", label: row.kanji, meaning: row.meaning_id, tier: row.tier });
    load();
  };

  const handleEditClick = async (row: KanjiRow) => {
    setEditingRow(row);
    setStatus(null);
    setView("edit");
  };

  const handleAddClick = () => {
    if (!selected) return;
    setEditingRow(null);
    setStatus(null);
    setView("add");
  };

  const handleBack = () => {
    setEditingRow(null);
    setView("browse");
  };

  if (view === "add" || view === "edit") {
    const editing = view === "edit";
    const r = editingRow;
    const loc = r ? { tier: r.tier, sourceId: r.source_id, chapter: r.chapter, subTier: r.sub_tier } : selected;
    return (
      <>
        <PageHeader
          title={editing ? "Edit Kanji" : "Tambah Kanji"}
          subtitle={loc ? locationText(loc.tier, t.sourceLabel(loc.sourceId), loc.chapter, loc.subTier) : ""}
          onBack={handleBack}
        />
        <form
          key={editing ? `edit-${r?.id}` : formKey}
          className="adm-form"
          onSubmit={(e) => handleSubmit(e, (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)}
        >
          <SectionCard icon={<IconLayers />} title="Informasi Utama">
            <div className="adm-grid-2">
              <Field label="Kanji" required>
                <input name="kanji" placeholder={tr("Contoh: 私")} defaultValue={r?.kanji} required />
              </Field>
              <Field label="Cara Baca" required>
                <input name="reading" placeholder={tr("Contoh: わたし")} defaultValue={r?.reading} required />
              </Field>
            </div>
            <Field label="Kana (bacaan penuh)" required>
              <input name="kana" placeholder={tr("Contoh: わたし")} defaultValue={r?.kana} required />
            </Field>
            <div className="adm-grid-2">
              <Field label="Arti Indonesia" required>
                <input name="meaning_id" placeholder={tr("Contoh: saya")} defaultValue={r?.meaning_id} required />
              </Field>
              <Field label="Arti English" optional>
                <input name="meaning_en" placeholder={tr("Contoh: I / me")} defaultValue={r?.meaning_en} />
              </Field>
            </div>
          </SectionCard>

          <StatusLine status={status} />
          <FormFooter editing={editing} />
        </form>
      </>
    );
  }

  return (
    <>
      <PageHeader sticky title="Kanji" subtitle="Kelola kanji yang tersimpan di database." />
      <StatusLine status={!selected ? status : null} />
      <ContentTreeView
        t={t}
        config={KANJI_TREE_CONFIG}
        onAddEntry={handleAddClick}
        onEditEntry={handleEditClick}
        onDeleteEntry={handleDelete}
      />
    </>
  );
}

// ----------------------------------------------------------------- Bunpo

const BUNPO_TREE_CONFIG: TreeViewConfig<BunpoRow> = {
  noun: "bunpō",
  addLabel: "Tambah Bunpō",
  headers: ["Pola", "Arti"],
  renderCells: (row) => (
    <>
      <td className="adm-td-jp">{row.pattern}</td>
      <td>
        {row.meaning_id}
        {row.meaning_en ? <span className="adm-muted"> / {row.meaning_en}</span> : null}
      </td>
    </>
  ),
  leafPrimary: (row) => row.pattern,
  leafSecondary: (row) => row.meaning_id,
};

function BunpoSection({
  autoAddToken,
  canDelete,
  onAutoAddHandled,
  onLogActivity,
  onNavigateToDashboard,
}: {
  autoAddToken?: number;
  canDelete: boolean;
  onAutoAddHandled: () => void;
  onLogActivity: (entry: Omit<ActivityEntry, "id" | "at">) => void;
  onNavigateToDashboard: () => void;
}) {
  const { tr } = useAdminTr();
  const t = useContentTree<BunpoRow>("bunpo", "bunpō", canDelete);
  const { status, setStatus, selected, load } = t;
  const [view, setView] = useState<"browse" | "add" | "edit">("browse");
  const [formKey, setFormKey] = useState(0);
  const [editingRow, setEditingRow] = useState<BunpoRow | null>(null);
  useEffect(() => {
    if (autoAddToken) {
      // Dashboard "Aksi Cepat": Sub Chapter tujuan belum diketahui, jadi arahkan
      // ke tree dulu — form tambah dibuka dari Sub Chapter yang dipilih.
      setEditingRow(null);
      setView("browse");
      setStatus(tr("Pilih Sub Chapter dulu, lalu klik \"{label}\".", { label: tr(BUNPO_TREE_CONFIG.addLabel) }));
      onAutoAddHandled();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAddToken]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>, submitter: HTMLButtonElement | null) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    // Lokasi entri tidak diisi lewat form: entri baru masuk ke Sub Chapter yang
    // lagi dipilih di tree, entri yang diedit tetap di tempatnya.
    const loc: SelectedSubTier | null =
      view === "edit" && editingRow
        ? { tier: editingRow.tier, sourceId: editingRow.source_id, chapter: editingRow.chapter, subTier: editingRow.sub_tier }
        : selected;
    if (!loc) {
      setStatus(tr("Pilih Sub Chapter dulu di daftar sebelum menambah entri."));
      return;
    }
    // kalimat mentah (masih ada penanda "/") — dipakai buat bikin segments
    const rawExample = String(form.get("example") ?? "");
    const payload = {
      tier: loc.tier,
      source_id: loc.sourceId,
      chapter: loc.chapter,
      sub_tier: loc.subTier,
      pattern: String(form.get("pattern") ?? "").trim(),
      example: cleanExample(String(form.get("example") ?? "")),
      meaning_en: String(form.get("meaning_en") ?? "").trim(),
      meaning_id: String(form.get("meaning_id") ?? "").trim(),
      blank_version: String(form.get("blank_version") ?? "").trim(),
      example_translation_en: String(form.get("example_translation_en") ?? "").trim(),
      example_translation_id: String(form.get("example_translation_id") ?? "").trim(),
      usage_note_en: String(form.get("usage_note_en") ?? "").trim(),
      usage_note_id: String(form.get("usage_note_id") ?? "").trim(),
    };
    const bunpoPayload = {
      ...payload,
      // Segments otomatis dari kalimat contoh, gak diinput manual lagi.
      segments: autoSegmentExample(rawExample, "", ""),
    };
    const landOn = () => t.landOn(payload.tier, payload.source_id, payload.chapter, payload.sub_tier);
    setStatus(tr("Menyimpan…"));
    if (view === "edit" && editingRow) {
      const { error } = await supabase.from(tableFor("bunpo", editingRow.tier)).update(bunpoPayload).eq("id", editingRow.id);
      if (error) {
        setStatus(tr("Gagal:") + " " + error.message);
        return;
      }
      setStatus(tr("Perubahan tersimpan."));
      setEditingRow(null);
      landOn();
      setView("browse");
      load();
      return;
    }
    const { error } = await supabase.from(tableFor("bunpo", bunpoPayload.tier)).insert(bunpoPayload);
    if (error) {
      setStatus(tr("Gagal:") + " " + error.message);
      return;
    }
    setStatus(tr("Tersimpan."));
    onLogActivity({ action: "add", kind: "bunpo", label: payload.pattern, meaning: payload.meaning_id, tier: payload.tier });
    load();
    if (submitter?.value === "done") {
      // "Simpan": balik ke daftar Bunpō (bukan Dashboard — akun admin gak
      // punya akses ke Dashboard, cuma dev yang punya).
      landOn();
      setView("browse");
    } else {
      formEl.reset();
      setFormKey((k) => k + 1);
      scrollFormToTop();
      setStatus(tr("Tersimpan. Silakan tambah entri berikutnya."));
    }
  };

  const handleDelete = async (row: BunpoRow) => {
    if (!canDelete) return; // hapus khusus dev
    if (!confirm(tr("Hapus entry ini?"))) return;
    const { error } = await supabase.from(tableFor("bunpo", row.tier)).delete().eq("id", row.id);
    if (error) {
      setStatus(tr("Gagal hapus:") + " " + error.message);
      return;
    }
    onLogActivity({ action: "delete", kind: "bunpo", label: row.pattern, meaning: row.meaning_id, tier: row.tier });
    load();
  };

  const handleEditClick = async (row: BunpoRow) => {
    setEditingRow(row);
    setStatus(null);
    setView("edit");
  };

  const handleAddClick = () => {
    if (!selected) return;
    setEditingRow(null);
    setStatus(null);
    setView("add");
  };

  const handleBack = () => {
    setEditingRow(null);
    setView("browse");
  };

  if (view === "add" || view === "edit") {
    const editing = view === "edit";
    const r = editingRow;
    const loc = r ? { tier: r.tier, sourceId: r.source_id, chapter: r.chapter, subTier: r.sub_tier } : selected;
    return (
      <>
        <PageHeader
          title={editing ? "Edit Bunpō" : "Tambah Bunpō"}
          subtitle={loc ? locationText(loc.tier, t.sourceLabel(loc.sourceId), loc.chapter, loc.subTier) : ""}
          onBack={handleBack}
        />
        <form
          key={editing ? `edit-${r?.id}` : formKey}
          className="adm-form"
          onSubmit={(e) => handleSubmit(e, (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)}
        >
          <SectionCard icon={<IconLayers />} title="Informasi Utama">
            <div className="adm-grid-2">
              <Field label="Pola (Pattern)" required>
                <input name="pattern" placeholder={tr("Contoh: 〜ています")} defaultValue={r?.pattern} required />
              </Field>
              <Field label="Versi Rumpang" optional>
                <input name="blank_version" placeholder={tr("Contoh: 〜___います")} defaultValue={r?.blank_version} />
              </Field>
            </div>
            <div className="adm-grid-2">
              <Field label="Arti Indonesia" required>
                <input name="meaning_id" placeholder={tr("Contoh: sedang melakukan…")} defaultValue={r?.meaning_id} required />
              </Field>
              <Field label="Arti English" required>
                <input name="meaning_en" placeholder={tr("Contoh: is doing…")} defaultValue={r?.meaning_en} required />
              </Field>
            </div>
          </SectionCard>

          <SectionCard icon={<IconChat />} title="Contoh Penggunaan" desc="Contoh kalimat beserta terjemahannya.">
            <Field
              label="Kalimat Jepang"
              required
              hint="Pisahkan tiap kata dengan / (mis. わたし/は/がくせい/です。). Tanda / cuma buat memisah, tidak ikut tampil di kalimat."
            >
              <CountedTextarea name="example" placeholder={tr("Contoh: わたし/は/がくせい/です。")} maxLength={260} required defaultValue={r ? markExample(r.example, r.segments) : undefined} />
            </Field>
            <div className="adm-grid-2">
              <Field label="Terjemahan Indonesia" required>
                <CountedTextarea
                  name="example_translation_id"
                  placeholder={tr("Contoh: Saya adalah seorang siswa.")}
                  maxLength={200}
                  required
                  defaultValue={r?.example_translation_id}
                />
              </Field>
              <Field label="Terjemahan English" required>
                <CountedTextarea
                  name="example_translation_en"
                  placeholder={tr("Example: I am a student.")}
                  maxLength={200}
                  required
                  defaultValue={r?.example_translation_en}
                />
              </Field>
            </div>
            <Field label="Catatan" required icon={<IconNote />}>
              <div className="adm-grid-2">
                <textarea name="usage_note_id" rows={2} placeholder={tr("Catatan (ID)…")} defaultValue={r?.usage_note_id ?? undefined} required />
                <textarea name="usage_note_en" rows={2} placeholder={tr("Catatan (EN)…")} defaultValue={r?.usage_note_en ?? undefined} required />
              </div>
            </Field>
          </SectionCard>

          <StatusLine status={status} />
          <FormFooter editing={editing} />
        </form>
      </>
    );
  }

  return (
    <>
      <PageHeader sticky title="Bunpō" subtitle="Kelola pola tata bahasa yang tersimpan di database." />
      <StatusLine status={!selected ? status : null} />
      <ContentTreeView
        t={t}
        config={BUNPO_TREE_CONFIG}
        onAddEntry={handleAddClick}
        onEditEntry={handleEditClick}
        onDeleteEntry={handleDelete}
      />
    </>
  );
}

// ------------------------------------------------------------ layout bits

function SectionCard({
  icon,
  title,
  desc,
  children,
}: {
  icon: ReactNode;
  title: string;
  desc?: string;
  children: ReactNode;
}) {
  const { tr } = useAdminTr();
  return (
    <div className="adm-card">
      <div className="adm-card-head">
        <span className="adm-card-icon">{icon}</span>
        <div>
          <h2>{tr(title)}</h2>
          {desc && <p>{tr(desc)}</p>}
        </div>
      </div>
      <div className="adm-card-body">{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  optional,
  icon,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  icon?: ReactNode;
  hint?: string;
  children: ReactNode;
}) {
  const { tr } = useAdminTr();
  return (
    <label className="adm-field">
      <span className="adm-field-label">
        {icon}
        {tr(label)}
        {required && <span className="adm-required">*</span>}
        {optional && <span className="adm-optional">{tr("(opsional)")}</span>}
      </span>
      {children}
      {hint && <span className="adm-field-hint">{tr(hint)}</span>}
    </label>
  );
}

// (dulu ada re-export segmentsToInput di sini buat nampilin ulang segments
// tersimpan; dihapus karena Segments di form Kotoba sekarang dibuat
// otomatis, jadi gak dipakai lagi.)
