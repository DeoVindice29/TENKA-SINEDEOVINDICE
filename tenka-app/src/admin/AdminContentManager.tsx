import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import { TABLE_NAME, type ContentKind, type KotobaRow, type KanjiRow, type BunpoRow, type SectionTitleRow } from "@/lib/contentTypes";
import { autoSegmentExample } from "@/lib/segments";
import { fetchSectionTitle, upsertSectionTitle } from "@/lib/sectionTitles";
import { RANK_LEVELS } from "@/data/ranks";
import { activityKindLabel, formatRelativeTime, type ActivityEntry } from "@/admin/adminActivity";
import {
  IconArrowLeft,
  IconBook,
  IconChart,
  IconChat,
  IconDocument,
  IconEdit,
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

// Chapter & Sub-Tier harus bilangan bulat positif (1, 2, 3…) — field-nya
// terpisah justru biar orang gak perlu (dan gak boleh) ngetik "1.1" di
// Chapter; bagian setelah titik itu tugasnya field Sub-Tier. Divalidasi di
// sini karena input type="number" step={1} tetep bisa ditembus browser
// buat nerima angka desimal kalau diketik manual.
function isPositiveInteger(n: number): boolean {
  return Number.isInteger(n) && n > 0;
}

const CHAPTER_SUB_TIER_ERROR =
  'Gagal: Chapter dan Sub-Tier harus angka bulat (1, 2, 3…) — jangan diisi angka desimal kayak "1.1". Bagian setelah titik itu diisi di field Sub-Tier, bukan digabung di Chapter.';

// Cegah ketik "." atau "," di field Chapter/Sub-Tier dari sisi keyboard —
// validasi sungguhannya tetep di isPositiveInteger() pas submit (buat jaga
// dari paste, scroll wheel di input number, dll).
function blockDecimalKey(e: KeyboardEvent<HTMLInputElement>) {
  if (e.key === "." || e.key === ",") e.preventDefault();
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
}: {
  section: AdminSection;
  quickAdd?: QuickAddSignal | null;
  onQuickAdd: (kind: ContentKind) => void;
  onQuickAddHandled: () => void;
  activity: ActivityEntry[];
  onLogActivity: (entry: Omit<ActivityEntry, "id" | "at">) => void;
  onNavigateToDashboard: () => void;
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
        onAutoAddHandled={onQuickAddHandled}
        onLogActivity={onLogActivity}
        onNavigateToDashboard={onNavigateToDashboard}
      />
    );
  if (section === "kanji")
    return (
      <KanjiSection
        autoAddToken={autoAddToken}
        onAutoAddHandled={onQuickAddHandled}
        onLogActivity={onLogActivity}
        onNavigateToDashboard={onNavigateToDashboard}
      />
    );
  return (
    <BunpoSection
      autoAddToken={autoAddToken}
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
  const [counts, setCounts] = useState<Record<ContentKind, number | null>>({
    kotoba: null,
    kanji: null,
    bunpo: null,
  });

  useEffect(() => {
    (Object.keys(TABLE_NAME) as ContentKind[]).forEach(async (kind) => {
      const { count } = await supabase.from(TABLE_NAME[kind]).select("*", { count: "exact", head: true });
      setCounts((prev) => ({ ...prev, [kind]: count ?? 0 }));
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
    { key: "kotoba", label: "Tambah Kotoba", desc: "Kosakata baru ke database.", icon: <IconBook /> },
    { key: "kanji", label: "Tambah Kanji", desc: "Karakter kanji baru.", icon: <IconKanjiTile /> },
    { key: "bunpo", label: "Tambah Bunpō", desc: "Pola tata bahasa baru.", icon: <IconDocument /> },
  ];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Ringkasan konten yang ada di database Tenka." />
      <div className="adm-stat-grid">
        {cards.map((c) => (
          <div className="adm-stat-card" key={c.key}>
            <span className="adm-stat-icon">{c.icon}</span>
            <div>
              <div className="adm-stat-value">{counts[c.key] ?? "…"}</div>
              <div className="adm-stat-label">Entri {c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="adm-section-title">Aksi Cepat</h2>
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

      <h2 className="adm-section-title">Aktivitas Terbaru</h2>
      {activity.length === 0 ? (
        <div className="adm-card adm-empty-card">
          <IconTarget className="adm-empty-icon" />
          <p>Belum ada aktivitas. Tambah atau hapus data akan tercatat di sini.</p>
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
                    {entry.action === "add" ? "Menambahkan" : "Menghapus"} {activityKindLabel(entry.kind)}{" "}
                    <b>{entry.label}</b>
                  </span>
                  {entry.meaning && <span className="adm-activity-meaning">{entry.meaning}</span>}
                </span>
                {entry.tier && <span className="adm-tier-badge">{entry.tier}</span>}
                <span className="adm-activity-time">{formatRelativeTime(entry.at)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="adm-dashboard-hint">
        Pilih menu <b>Materi</b> di sisi kiri, atau pakai Aksi Cepat di atas, untuk menambah maupun menghapus kosakata, kanji, dan pola tata bahasa.
      </p>
    </>
  );
}

function SoalPlaceholder() {
  return (
    <>
      <PageHeader title="Soal" subtitle="Bank soal untuk mode Latihan." />
      <div className="adm-card adm-empty-card">
        <IconTarget className="adm-empty-icon" />
        <p>Pengelolaan bank soal belum tersedia di panel ini.</p>
      </div>
    </>
  );
}

// -------------------------------------------------------------- statistik

function StatistikSection() {
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
      const { count, error } = await supabase.from(TABLE_NAME[kind]).select("*", { count: "exact", head: true });
      if (error) {
        setStatus(error.message);
        return;
      }
      setCounts((prev) => ({ ...prev, [kind]: count ?? 0 }));

      const perTier: Record<string, number> = {};
      await Promise.all(
        TIERS.map(async (t) => {
          const { count: tierCount } = await supabase
            .from(TABLE_NAME[kind])
            .select("*", { count: "exact", head: true })
            .eq("tier", t);
          perTier[t] = tierCount ?? 0;
        }),
      );
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
            <div className="adm-stat-value">{userCount ?? "…"}</div>
            <div className="adm-stat-label">Total Pengguna</div>
          </div>
        </div>
        <div className="adm-stat-card">
          <span className="adm-stat-icon">
            <IconLayers />
          </span>
          <div>
            <div className="adm-stat-value">{totalEntries ?? "…"}</div>
            <div className="adm-stat-label">Total Entri Materi</div>
          </div>
        </div>
        {(Object.keys(TABLE_NAME) as ContentKind[]).map((kind) => (
          <div className="adm-stat-card" key={kind}>
            <span className="adm-stat-icon">{kindIcon[kind]}</span>
            <div>
              <div className="adm-stat-value">{counts[kind] ?? "…"}</div>
              <div className="adm-stat-label">Entri {kindLabel[kind]}</div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="adm-section-title">Rincian Konten per Tier</h2>
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
                    {tierCounts[kind][t] ?? "…"}
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

function PenggunaSection() {
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, rank_index, created_at")
      .order("created_at", { ascending: false });
    if (error) setStatus(error.message);
    else setRows((data ?? []) as ProfileRow[]);
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

  const handleDeleteAccount = async (row: ProfileRow) => {
    const label = row.username || "pengguna ini";
    if (!confirm(`Hapus akun ${label} secara permanen? Tindakan ini tidak bisa dibatalkan.`)) return;
    setStatus("Menghapus akun…");
    const { error } = await supabase.rpc("admin_delete_user", { target_id: row.id });
    if (error) {
      setStatus("Gagal hapus akun: " + error.message);
      return;
    }
    setStatus("Akun dihapus.");
    setRows((prev) => prev.filter((r) => r.id !== row.id));
  };

  return (
    <>
      <PageHeader title="Pengguna" subtitle="Daftar pengguna yang terdaftar di Tenka." />
      <div className="adm-toolbar">
        <input
          type="text"
          className="adm-search-input"
          placeholder="Cari username…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="adm-muted">{loading ? "Memuat…" : `${filtered.length} pengguna`}</span>
      </div>
      <StatusLine status={status} />
      <div className="adm-card adm-table-card">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Pengguna</th>
              <th>Rank</th>
              <th>Bergabung</th>
              <th aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
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
                    <span>{row.username || <span className="adm-muted">(belum diatur)</span>}</span>
                  </span>
                </td>
                <td className="adm-muted">{RANK_LEVELS[row.rank_index ?? 0]?.title ?? "—"}</td>
                <td className="adm-muted">{formatRelativeTime(new Date(row.created_at).getTime())}</td>
                <td className="adm-td-action">
                  <button
                    type="button"
                    className="adm-icon-btn danger"
                    onClick={() => handleDeleteAccount(row)}
                    aria-label="Hapus Akun"
                  >
                    <IconTrash />
                  </button>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="adm-muted adm-empty-row">
                  {rows.length === 0 ? "Belum ada pengguna terdaftar." : "Tidak ada pengguna yang cocok dengan pencarian."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function PageHeader({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle: string;
  onBack?: () => void;
}) {
  return (
    <div className="adm-page-header">
      {onBack && (
        <button type="button" className="adm-back-btn" onClick={onBack} aria-label="Kembali">
          <IconArrowLeft />
        </button>
      )}
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
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
  const [len, setLen] = useState(defaultValue?.length ?? 0);
  return (
    <div className="adm-textarea-wrap">
      <textarea
        name={name}
        placeholder={placeholder}
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
  if (editing) {
    return (
      <div className="adm-form-footer">
        <div className="adm-form-footer-right">
          <button type="submit" name="mode" value="done" className="adm-btn adm-btn-primary">
            <IconSave /> Simpan Perubahan
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="adm-form-footer">
      <div className="adm-form-footer-right">
        <button type="submit" name="mode" value="again" className="adm-btn adm-btn-outline">
          <IconPlus /> Simpan &amp; Tambah Lagi
        </button>
        <button type="submit" name="mode" value="done" className="adm-btn adm-btn-primary">
          <IconSave /> Simpan
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Kotoba

function KotobaSection({
  autoAddToken,
  onAutoAddHandled,
  onLogActivity,
  onNavigateToDashboard,
}: {
  autoAddToken?: number;
  onAutoAddHandled: () => void;
  onLogActivity: (entry: Omit<ActivityEntry, "id" | "at">) => void;
  onNavigateToDashboard: () => void;
}) {
  const [view, setView] = useState<"list" | "add" | "edit">("list");
  const [rows, setRows] = useState<KotobaRow[]>([]);
  const [tier, setTier] = useState("Semua");
  const [status, setStatus] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [editingRow, setEditingRow] = useState<KotobaRow | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState<SectionTitleRow | null>(null);

  const load = async () => {
    let query = supabase.from(TABLE_NAME.kotoba).select("*").order("id", { ascending: false });
    if (tier !== "Semua") query = query.eq("tier", tier);
    const { data, error } = await query;
    if (error) setStatus(error.message);
    else setRows((data ?? []) as KotobaRow[]);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier]);

  // datang dari tombol Aksi Cepat di Dashboard → langsung buka form tambah.
  useEffect(() => {
    if (autoAddToken) {
      setView("add");
      onAutoAddHandled();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAddToken]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>, submitter: HTMLButtonElement | null) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      tier: String(form.get("tier") ?? "N5"),
      chapter: Number(form.get("chapter") ?? 1),
      sub_tier: Number(form.get("sub_tier") ?? 1),
      kana: String(form.get("kana") ?? "").trim(),
      romaji: String(form.get("romaji") ?? "").trim(),
      meaning_en: String(form.get("meaning_en") ?? "").trim(),
      meaning_id: String(form.get("meaning_id") ?? "").trim(),
      example: String(form.get("example") ?? "").trim(),
      example_translation_en: String(form.get("example_translation_en") ?? "").trim(),
      example_translation_id: String(form.get("example_translation_id") ?? "").trim(),
      kanji_word: String(form.get("kanji_word") ?? "").trim(),
      kanji_example: String(form.get("kanji_example") ?? "").trim(),
      usage_en: String(form.get("usage_en") ?? "").trim() || null,
      usage_id: String(form.get("usage_id") ?? "").trim() || null,
    };
    if (!isPositiveInteger(payload.chapter) || !isPositiveInteger(payload.sub_tier)) {
      setStatus(CHAPTER_SUB_TIER_ERROR);
      return;
    }
    const kotobaPayload = {
      ...payload,
      // Segments otomatis dari kalimat contoh, gak diinput manual lagi.
      segments: autoSegmentExample(payload.example, payload.kana, payload.romaji),
    };
    const sectionTitlePayload: SectionTitleRow = {
      tier: payload.tier,
      chapter: payload.chapter,
      sub_tier: payload.sub_tier,
      title_en: String(form.get("sub_tier_title_en") ?? "").trim(),
      title_id: String(form.get("sub_tier_title_id") ?? "").trim(),
    };
    setStatus("Menyimpan…");
    if (view === "edit" && editingRow) {
      const { error } = await supabase.from(TABLE_NAME.kotoba).update(kotobaPayload).eq("id", editingRow.id);
      if (error) {
        setStatus("Gagal: " + error.message);
        return;
      }
      await upsertSectionTitle(sectionTitlePayload);
      setStatus("Perubahan tersimpan.");
      setEditingRow(null);
      setEditingSectionTitle(null);
      setView("list");
      load();
      return;
    }
    const { error } = await supabase.from(TABLE_NAME.kotoba).insert(kotobaPayload);
    if (error) {
      setStatus("Gagal: " + error.message);
      return;
    }
    await upsertSectionTitle(sectionTitlePayload);
    setStatus("Tersimpan.");
    onLogActivity({ action: "add", kind: "kotoba", label: payload.kana, meaning: payload.meaning_id, tier: payload.tier });
    load();
    if (submitter?.value === "done") {
      onNavigateToDashboard();
    } else {
      // "Simpan & Tambah Lagi": bersihkan form sepenuhnya (termasuk counter
      // karakter) dengan remount, lalu tetap di halaman tambah.
      e.currentTarget.reset();
      setFormKey((k) => k + 1);
      setStatus("Tersimpan. Silakan tambah entri berikutnya.");
    }
  };

  const handleDelete = async (row: KotobaRow) => {
    if (!confirm("Hapus entry ini?")) return;
    const { error } = await supabase.from(TABLE_NAME.kotoba).delete().eq("id", row.id);
    if (error) {
      setStatus("Gagal hapus: " + error.message);
      return;
    }
    onLogActivity({ action: "delete", kind: "kotoba", label: row.kana, meaning: row.meaning_id, tier: row.tier });
    load();
  };

  const handleEditClick = async (row: KotobaRow) => {
    setEditingRow(row);
    setEditingSectionTitle(await fetchSectionTitle(row.tier, row.chapter, row.sub_tier));
    setStatus(null);
    setView("edit");
  };

  const handleBack = () => {
    setEditingRow(null);
    setEditingSectionTitle(null);
    setView("list");
  };

  if (view === "add" || view === "edit") {
    const editing = view === "edit";
    const r = editingRow;
    const st = editingSectionTitle;
    return (
      <>
        <PageHeader
          title={editing ? "Edit Kotoba" : "Tambah Kotoba"}
          subtitle={editing ? "Ubah kosakata yang tersimpan di database." : "Masukkan kosakata baru ke dalam database."}
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
                <input name="kana" placeholder="Contoh: わたし" defaultValue={r?.kana} required />
              </Field>
              <Field label="Romaji" required>
                <input name="romaji" placeholder="Contoh: watashi" defaultValue={r?.romaji} required />
              </Field>
            </div>
            <Field label="Kanji" required>
              <input name="kanji_word" placeholder="Contoh: 私" defaultValue={r?.kanji_word} required />
            </Field>
            <div className="adm-grid-2">
              <Field label="Arti Indonesia" required>
                <input name="meaning_id" placeholder="Contoh: saya" defaultValue={r?.meaning_id} required />
              </Field>
              <Field label="Arti English" required>
                <input name="meaning_en" placeholder="Contoh: I / me" defaultValue={r?.meaning_en} required />
              </Field>
            </div>
            <div className="adm-grid-3">
              <Field label="Tier" required>
                <select name="tier" defaultValue={r?.tier ?? "N5"} required>
                  {TIERS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Chapter" required hint="Urutan bab, sama kayak N5 (1, 2, 3…).">
                <input name="chapter" type="number" min={1} step={1} inputMode="numeric" onKeyDown={blockDecimalKey} placeholder="Contoh: 1" defaultValue={r?.chapter} required />
              </Field>
              <Field label="Sub-Tier" required hint="Urutan sub-bab di dalam Chapter (1, 2, 3…).">
                <input name="sub_tier" type="number" min={1} step={1} inputMode="numeric" onKeyDown={blockDecimalKey} placeholder="Contoh: 1" defaultValue={r?.sub_tier} required />
              </Field>
            </div>
            <div className="adm-grid-2">
              <Field
                label="Nama Sub-Tier (Indonesia)"
                optional
                hint="Opsional — diisi sekali per Chapter.Sub-Tier, contoh: 'Tier 1.1 — Kata Ganti Orang & Sapaan'. Entry lain dengan Chapter.Sub-Tier yang sama otomatis ikut nama ini."
              >
                <input
                  key={`stid-${r?.id ?? "new"}`}
                  name="sub_tier_title_id"
                  placeholder="Contoh: Tier 1.1 — Kata Ganti Orang & Sapaan"
                  defaultValue={st?.title_id}
                />
              </Field>
              <Field label="Nama Sub-Tier (English)" optional>
                <input
                  key={`sten-${r?.id ?? "new"}`}
                  name="sub_tier_title_en"
                  placeholder="Contoh: Tier 1.1 — Personal Pronouns & Greetings"
                  defaultValue={st?.title_en}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard icon={<IconChat />} title="Contoh Penggunaan" desc="Tambahkan contoh kalimat untuk memperjelas penggunaan kosakata.">
            <div className="adm-grid-2">
              <Field label="Kalimat Jepang" required>
                <CountedTextarea name="example" placeholder="Contoh: 私は学生です。" maxLength={200} required defaultValue={r?.example} />
              </Field>
              <Field label="Kalimat Jepang (Kanji)" required>
                <CountedTextarea name="kanji_example" placeholder="Contoh: 私は学生です。" maxLength={200} required defaultValue={r?.kanji_example} />
              </Field>
            </div>
            <Field label="Terjemahan Indonesia" required>
              <CountedTextarea
                name="example_translation_id"
                placeholder="Contoh: Saya adalah seorang siswa."
                maxLength={200}
                required
                defaultValue={r?.example_translation_id}
              />
            </Field>
            <Field label="Terjemahan English" required>
              <CountedTextarea
                name="example_translation_en"
                placeholder="Example: I am a student."
                maxLength={200}
                required
                defaultValue={r?.example_translation_en}
              />
            </Field>
            <Field label="Catatan" required icon={<IconNote />} hint="Ditampilkan penuh dalam satu kotak besar biar gampang diedit.">
              <div className="adm-grid-2">
                <textarea name="usage_id" rows={2} placeholder="Catatan (ID)…" defaultValue={r?.usage_id ?? undefined} required />
                <textarea name="usage_en" rows={2} placeholder="Catatan (EN)…" defaultValue={r?.usage_en ?? undefined} required />
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
      <PageHeader title="Kotoba" subtitle="Kelola kosakata yang tersimpan di database." />
      <ListToolbar tier={tier} onTierChange={setTier} onAdd={() => setView("add")} addLabel="Tambah Kotoba" />
      <StatusLine status={status} />
      <div className="adm-card adm-table-card">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Kana</th>
              <th>Romaji</th>
              <th>Arti</th>
              <th>Tier</th>
              <th>Bab</th>
              <th aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="adm-td-jp">{row.kana}</td>
                <td className="adm-muted">{row.romaji}</td>
                <td>
                  {row.meaning_id}
                  {row.meaning_en ? <span className="adm-muted"> / {row.meaning_en}</span> : null}
                </td>
                <td>
                  <span className="adm-tier-badge">{row.tier}</span>
                </td>
                <td className="adm-muted">
                  {row.chapter}.{row.sub_tier}
                </td>
                <td className="adm-td-action">
                  <button type="button" className="adm-icon-btn" onClick={() => handleEditClick(row)} aria-label="Edit">
                    <IconEdit />
                  </button>
                  <button type="button" className="adm-icon-btn danger" onClick={() => handleDelete(row)} aria-label="Hapus">
                    <IconTrash />
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="adm-muted adm-empty-row">
                  Belum ada data kotoba.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ----------------------------------------------------------------- Kanji

function KanjiSection({
  autoAddToken,
  onAutoAddHandled,
  onLogActivity,
  onNavigateToDashboard,
}: {
  autoAddToken?: number;
  onAutoAddHandled: () => void;
  onLogActivity: (entry: Omit<ActivityEntry, "id" | "at">) => void;
  onNavigateToDashboard: () => void;
}) {
  const [view, setView] = useState<"list" | "add" | "edit">("list");
  const [rows, setRows] = useState<KanjiRow[]>([]);
  const [tier, setTier] = useState("Semua");
  const [status, setStatus] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [editingRow, setEditingRow] = useState<KanjiRow | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState<SectionTitleRow | null>(null);

  const load = async () => {
    let query = supabase.from(TABLE_NAME.kanji).select("*").order("id", { ascending: false });
    if (tier !== "Semua") query = query.eq("tier", tier);
    const { data, error } = await query;
    if (error) setStatus(error.message);
    else setRows((data ?? []) as KanjiRow[]);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier]);

  useEffect(() => {
    if (autoAddToken) {
      setView("add");
      onAutoAddHandled();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAddToken]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>, submitter: HTMLButtonElement | null) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      tier: String(form.get("tier") ?? "N5"),
      chapter: Number(form.get("chapter") ?? 1),
      sub_tier: Number(form.get("sub_tier") ?? 1),
      kanji: String(form.get("kanji") ?? "").trim(),
      reading: String(form.get("reading") ?? "").trim(),
      kana: String(form.get("kana") ?? "").trim(),
      meaning_en: String(form.get("meaning_en") ?? "").trim(),
      meaning_id: String(form.get("meaning_id") ?? "").trim(),
    };
    if (!isPositiveInteger(payload.chapter) || !isPositiveInteger(payload.sub_tier)) {
      setStatus(CHAPTER_SUB_TIER_ERROR);
      return;
    }
    const sectionTitlePayload: SectionTitleRow = {
      tier: payload.tier,
      chapter: payload.chapter,
      sub_tier: payload.sub_tier,
      title_en: String(form.get("sub_tier_title_en") ?? "").trim(),
      title_id: String(form.get("sub_tier_title_id") ?? "").trim(),
    };
    setStatus("Menyimpan…");
    if (view === "edit" && editingRow) {
      const { error } = await supabase.from(TABLE_NAME.kanji).update(payload).eq("id", editingRow.id);
      if (error) {
        setStatus("Gagal: " + error.message);
        return;
      }
      await upsertSectionTitle(sectionTitlePayload);
      setStatus("Perubahan tersimpan.");
      setEditingRow(null);
      setEditingSectionTitle(null);
      setView("list");
      load();
      return;
    }
    const { error } = await supabase.from(TABLE_NAME.kanji).insert(payload);
    if (error) {
      setStatus("Gagal: " + error.message);
      return;
    }
    await upsertSectionTitle(sectionTitlePayload);
    setStatus("Tersimpan.");
    onLogActivity({ action: "add", kind: "kanji", label: payload.kanji, meaning: payload.meaning_id, tier: payload.tier });
    load();
    if (submitter?.value === "done") {
      onNavigateToDashboard();
    } else {
      e.currentTarget.reset();
      setFormKey((k) => k + 1);
      setStatus("Tersimpan. Silakan tambah entri berikutnya.");
    }
  };

  const handleDelete = async (row: KanjiRow) => {
    if (!confirm("Hapus entry ini?")) return;
    const { error } = await supabase.from(TABLE_NAME.kanji).delete().eq("id", row.id);
    if (error) {
      setStatus("Gagal hapus: " + error.message);
      return;
    }
    onLogActivity({ action: "delete", kind: "kanji", label: row.kanji, meaning: row.meaning_id, tier: row.tier });
    load();
  };

  const handleEditClick = async (row: KanjiRow) => {
    setEditingRow(row);
    setEditingSectionTitle(await fetchSectionTitle(row.tier, row.chapter, row.sub_tier));
    setStatus(null);
    setView("edit");
  };

  const handleBack = () => {
    setEditingRow(null);
    setEditingSectionTitle(null);
    setView("list");
  };

  if (view === "add" || view === "edit") {
    const editing = view === "edit";
    const r = editingRow;
    const st = editingSectionTitle;
    return (
      <>
        <PageHeader
          title={editing ? "Edit Kanji" : "Tambah Kanji"}
          subtitle={editing ? "Ubah kanji yang tersimpan di database." : "Masukkan kanji baru ke dalam database."}
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
                <input name="kanji" placeholder="Contoh: 私" defaultValue={r?.kanji} required />
              </Field>
              <Field label="Cara Baca" required>
                <input name="reading" placeholder="Contoh: わたし" defaultValue={r?.reading} required />
              </Field>
            </div>
            <div className="adm-grid-2">
              <Field label="Kana (bacaan penuh)" required>
                <input name="kana" placeholder="Contoh: わたし" defaultValue={r?.kana} required />
              </Field>
              <Field label="Tier" required>
                <select name="tier" defaultValue={r?.tier ?? "N5"} required>
                  {TIERS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="adm-grid-2">
              <Field label="Chapter" required hint="Urutan bab, sama kayak N5 (1, 2, 3…).">
                <input name="chapter" type="number" min={1} step={1} inputMode="numeric" onKeyDown={blockDecimalKey} placeholder="Contoh: 1" defaultValue={r?.chapter} required />
              </Field>
              <Field label="Sub-Tier" required hint="Urutan sub-bab di dalam Chapter (1, 2, 3…).">
                <input name="sub_tier" type="number" min={1} step={1} inputMode="numeric" onKeyDown={blockDecimalKey} placeholder="Contoh: 1" defaultValue={r?.sub_tier} required />
              </Field>
            </div>
            <div className="adm-grid-2">
              <Field
                label="Nama Sub-Tier (Indonesia)"
                optional
                hint="Opsional — diisi sekali per Chapter.Sub-Tier, entry lain di Chapter.Sub-Tier yang sama otomatis ikut nama ini."
              >
                <input
                  key={`stid-${r?.id ?? "new"}`}
                  name="sub_tier_title_id"
                  placeholder="Contoh: Tier 1.1 — Kata Ganti Orang & Sapaan"
                  defaultValue={st?.title_id}
                />
              </Field>
              <Field label="Nama Sub-Tier (English)" optional>
                <input
                  key={`sten-${r?.id ?? "new"}`}
                  name="sub_tier_title_en"
                  placeholder="Contoh: Tier 1.1 — Personal Pronouns & Greetings"
                  defaultValue={st?.title_en}
                />
              </Field>
            </div>
            <div className="adm-grid-2">
              <Field label="Arti Indonesia" required>
                <input name="meaning_id" placeholder="Contoh: saya" defaultValue={r?.meaning_id} required />
              </Field>
              <Field label="Arti English" optional>
                <input name="meaning_en" placeholder="Contoh: I / me" defaultValue={r?.meaning_en} />
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
      <PageHeader title="Kanji" subtitle="Kelola kanji yang tersimpan di database." />
      <ListToolbar tier={tier} onTierChange={setTier} onAdd={() => setView("add")} addLabel="Tambah Kanji" />
      <StatusLine status={status} />
      <div className="adm-card adm-table-card">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Kanji</th>
              <th>Cara Baca</th>
              <th>Arti</th>
              <th>Tier</th>
              <th>Bab</th>
              <th aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="adm-td-jp">{row.kanji}</td>
                <td className="adm-muted">{row.reading}</td>
                <td>
                  {row.meaning_id}
                  {row.meaning_en ? <span className="adm-muted"> / {row.meaning_en}</span> : null}
                </td>
                <td>
                  <span className="adm-tier-badge">{row.tier}</span>
                </td>
                <td className="adm-muted">
                  {row.chapter}.{row.sub_tier}
                </td>
                <td className="adm-td-action">
                  <button type="button" className="adm-icon-btn" onClick={() => handleEditClick(row)} aria-label="Edit">
                    <IconEdit />
                  </button>
                  <button type="button" className="adm-icon-btn danger" onClick={() => handleDelete(row)} aria-label="Hapus">
                    <IconTrash />
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="adm-muted adm-empty-row">
                  Belum ada data kanji.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ----------------------------------------------------------------- Bunpo

function BunpoSection({
  autoAddToken,
  onAutoAddHandled,
  onLogActivity,
  onNavigateToDashboard,
}: {
  autoAddToken?: number;
  onAutoAddHandled: () => void;
  onLogActivity: (entry: Omit<ActivityEntry, "id" | "at">) => void;
  onNavigateToDashboard: () => void;
}) {
  const [view, setView] = useState<"list" | "add" | "edit">("list");
  const [rows, setRows] = useState<BunpoRow[]>([]);
  const [tier, setTier] = useState("Semua");
  const [status, setStatus] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [editingRow, setEditingRow] = useState<BunpoRow | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState<SectionTitleRow | null>(null);

  const load = async () => {
    let query = supabase.from(TABLE_NAME.bunpo).select("*").order("id", { ascending: false });
    if (tier !== "Semua") query = query.eq("tier", tier);
    const { data, error } = await query;
    if (error) setStatus(error.message);
    else setRows((data ?? []) as BunpoRow[]);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier]);

  useEffect(() => {
    if (autoAddToken) {
      setView("add");
      onAutoAddHandled();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAddToken]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>, submitter: HTMLButtonElement | null) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      tier: String(form.get("tier") ?? "N5"),
      chapter: Number(form.get("chapter") ?? 1),
      sub_tier: Number(form.get("sub_tier") ?? 1),
      pattern: String(form.get("pattern") ?? "").trim(),
      example: String(form.get("example") ?? "").trim(),
      meaning_en: String(form.get("meaning_en") ?? "").trim(),
      meaning_id: String(form.get("meaning_id") ?? "").trim(),
      blank_version: String(form.get("blank_version") ?? "").trim(),
      example_translation_en: String(form.get("example_translation_en") ?? "").trim(),
      example_translation_id: String(form.get("example_translation_id") ?? "").trim(),
      usage_note_en: String(form.get("usage_note_en") ?? "").trim(),
      usage_note_id: String(form.get("usage_note_id") ?? "").trim(),
    };
    if (!isPositiveInteger(payload.chapter) || !isPositiveInteger(payload.sub_tier)) {
      setStatus(CHAPTER_SUB_TIER_ERROR);
      return;
    }
    const bunpoPayload = {
      ...payload,
      // Segments otomatis dari kalimat contoh, gak diinput manual lagi.
      segments: autoSegmentExample(payload.example, "", ""),
    };
    const sectionTitlePayload: SectionTitleRow = {
      tier: payload.tier,
      chapter: payload.chapter,
      sub_tier: payload.sub_tier,
      title_en: String(form.get("sub_tier_title_en") ?? "").trim(),
      title_id: String(form.get("sub_tier_title_id") ?? "").trim(),
    };
    setStatus("Menyimpan…");
    if (view === "edit" && editingRow) {
      const { error } = await supabase.from(TABLE_NAME.bunpo).update(bunpoPayload).eq("id", editingRow.id);
      if (error) {
        setStatus("Gagal: " + error.message);
        return;
      }
      await upsertSectionTitle(sectionTitlePayload);
      setStatus("Perubahan tersimpan.");
      setEditingRow(null);
      setEditingSectionTitle(null);
      setView("list");
      load();
      return;
    }
    const { error } = await supabase.from(TABLE_NAME.bunpo).insert(bunpoPayload);
    if (error) {
      setStatus("Gagal: " + error.message);
      return;
    }
    await upsertSectionTitle(sectionTitlePayload);
    setStatus("Tersimpan.");
    onLogActivity({ action: "add", kind: "bunpo", label: payload.pattern, meaning: payload.meaning_id, tier: payload.tier });
    load();
    if (submitter?.value === "done") {
      onNavigateToDashboard();
    } else {
      e.currentTarget.reset();
      setFormKey((k) => k + 1);
      setStatus("Tersimpan. Silakan tambah entri berikutnya.");
    }
  };

  const handleDelete = async (row: BunpoRow) => {
    if (!confirm("Hapus entry ini?")) return;
    const { error } = await supabase.from(TABLE_NAME.bunpo).delete().eq("id", row.id);
    if (error) {
      setStatus("Gagal hapus: " + error.message);
      return;
    }
    onLogActivity({ action: "delete", kind: "bunpo", label: row.pattern, meaning: row.meaning_id, tier: row.tier });
    load();
  };

  const handleEditClick = async (row: BunpoRow) => {
    setEditingRow(row);
    setEditingSectionTitle(await fetchSectionTitle(row.tier, row.chapter, row.sub_tier));
    setStatus(null);
    setView("edit");
  };

  const handleBack = () => {
    setEditingRow(null);
    setEditingSectionTitle(null);
    setView("list");
  };

  if (view === "add" || view === "edit") {
    const editing = view === "edit";
    const r = editingRow;
    const st = editingSectionTitle;
    return (
      <>
        <PageHeader
          title={editing ? "Edit Bunpō" : "Tambah Bunpō"}
          subtitle={editing ? "Ubah pola tata bahasa yang tersimpan di database." : "Masukkan pola tata bahasa baru ke dalam database."}
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
                <input name="pattern" placeholder="Contoh: 〜ています" defaultValue={r?.pattern} required />
              </Field>
              <Field label="Versi Rumpang" optional>
                <input name="blank_version" placeholder="Contoh: 〜___います" defaultValue={r?.blank_version} />
              </Field>
            </div>
            <div className="adm-grid-2">
              <Field label="Arti Indonesia" required>
                <input name="meaning_id" placeholder="Contoh: sedang melakukan…" defaultValue={r?.meaning_id} required />
              </Field>
              <Field label="Arti English" required>
                <input name="meaning_en" placeholder="Contoh: is doing…" defaultValue={r?.meaning_en} required />
              </Field>
            </div>
            <Field label="Tier" required>
              <select name="tier" defaultValue={r?.tier ?? "N5"} required>
                {TIERS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <div className="adm-grid-2">
              <Field label="Chapter" required hint="Urutan bab, sama kayak N5 (1, 2, 3…).">
                <input name="chapter" type="number" min={1} step={1} inputMode="numeric" onKeyDown={blockDecimalKey} placeholder="Contoh: 1" defaultValue={r?.chapter} required />
              </Field>
              <Field label="Sub-Tier" required hint="Urutan sub-bab di dalam Chapter (1, 2, 3…).">
                <input name="sub_tier" type="number" min={1} step={1} inputMode="numeric" onKeyDown={blockDecimalKey} placeholder="Contoh: 1" defaultValue={r?.sub_tier} required />
              </Field>
            </div>
            <div className="adm-grid-2">
              <Field
                label="Nama Sub-Tier (Indonesia)"
                optional
                hint="Opsional — diisi sekali per Chapter.Sub-Tier, entry lain di Chapter.Sub-Tier yang sama otomatis ikut nama ini."
              >
                <input
                  key={`stid-${r?.id ?? "new"}`}
                  name="sub_tier_title_id"
                  placeholder="Contoh: Tier 1.1 — Kata Ganti Orang & Sapaan"
                  defaultValue={st?.title_id}
                />
              </Field>
              <Field label="Nama Sub-Tier (English)" optional>
                <input
                  key={`sten-${r?.id ?? "new"}`}
                  name="sub_tier_title_en"
                  placeholder="Contoh: Tier 1.1 — Personal Pronouns & Greetings"
                  defaultValue={st?.title_en}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard icon={<IconChat />} title="Contoh Penggunaan" desc="Tambahkan contoh kalimat untuk memperjelas penggunaan pola.">
            <Field label="Kalimat Jepang" required>
              <CountedTextarea name="example" placeholder="Contoh: 私は学生です。" maxLength={200} required defaultValue={r?.example} />
            </Field>
            <div className="adm-grid-2">
              <Field label="Terjemahan Indonesia" required>
                <CountedTextarea
                  name="example_translation_id"
                  placeholder="Contoh: Saya adalah seorang siswa."
                  maxLength={200}
                  required
                  defaultValue={r?.example_translation_id}
                />
              </Field>
              <Field label="Terjemahan English" required>
                <CountedTextarea
                  name="example_translation_en"
                  placeholder="Example: I am a student."
                  maxLength={200}
                  required
                  defaultValue={r?.example_translation_en}
                />
              </Field>
            </div>
            <Field label="Catatan" required icon={<IconNote />} hint="Ditampilkan penuh dalam satu kotak besar biar gampang diedit.">
              <div className="adm-grid-2">
                <textarea name="usage_note_id" rows={2} placeholder="Catatan (ID)…" defaultValue={r?.usage_note_id ?? undefined} required />
                <textarea name="usage_note_en" rows={2} placeholder="Catatan (EN)…" defaultValue={r?.usage_note_en ?? undefined} required />
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
      <PageHeader title="Bunpō" subtitle="Kelola pola tata bahasa yang tersimpan di database." />
      <ListToolbar tier={tier} onTierChange={setTier} onAdd={() => setView("add")} addLabel="Tambah Bunpō" />
      <StatusLine status={status} />
      <div className="adm-card adm-table-card">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Pola</th>
              <th>Arti</th>
              <th>Tier</th>
              <th>Bab</th>
              <th aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="adm-td-jp">{row.pattern}</td>
                <td>
                  {row.meaning_id}
                  {row.meaning_en ? <span className="adm-muted"> / {row.meaning_en}</span> : null}
                </td>
                <td>
                  <span className="adm-tier-badge">{row.tier}</span>
                </td>
                <td className="adm-muted">
                  {row.chapter}.{row.sub_tier}
                </td>
                <td className="adm-td-action">
                  <button type="button" className="adm-icon-btn" onClick={() => handleEditClick(row)} aria-label="Edit">
                    <IconEdit />
                  </button>
                  <button type="button" className="adm-icon-btn danger" onClick={() => handleDelete(row)} aria-label="Hapus">
                    <IconTrash />
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="adm-muted adm-empty-row">
                  Belum ada data bunpō.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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
  return (
    <div className="adm-card">
      <div className="adm-card-head">
        <span className="adm-card-icon">{icon}</span>
        <div>
          <h2>{title}</h2>
          {desc && <p>{desc}</p>}
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
  return (
    <label className="adm-field">
      <span className="adm-field-label">
        {icon}
        {label}
        {required && <span className="adm-required">*</span>}
        {optional && <span className="adm-optional">(opsional)</span>}
      </span>
      {children}
      {hint && <span className="adm-field-hint">{hint}</span>}
    </label>
  );
}

function ListToolbar({
  tier,
  onTierChange,
  onAdd,
  addLabel,
}: {
  tier: string;
  onTierChange: (v: string) => void;
  onAdd: () => void;
  addLabel: string;
}) {
  const tierOptions = useMemo(() => ["Semua", ...TIERS], []);
  return (
    <div className="adm-toolbar">
      <label className="adm-tier-filter">
        Tier
        <select value={tier} onChange={(e) => onTierChange(e.target.value)}>
          {tierOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <button type="button" className="adm-btn adm-btn-primary" onClick={onAdd}>
        <IconPlus /> {addLabel}
      </button>
    </div>
  );
}

// (dulu ada re-export segmentsToInput di sini buat nampilin ulang segments
// tersimpan; dihapus karena Segments di form Kotoba sekarang dibuat
// otomatis, jadi gak dipakai lagi.)
