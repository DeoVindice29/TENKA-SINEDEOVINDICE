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
import { useLang } from "@/i18n/LangContext";
import { isJlptScript, practiceTypesFor, type JlptScriptKey, type PracticeTypeKey } from "@/data/jlptConquest";
import ActivityChart, { type ChartSeries } from "@/admin/ActivityChart";
import adminBg from "@/assets/bg-admin-panel-login.webp";
import {
  TABLE_NAME,
  tableFor,
  sectionTitlesTable,
  type ContentKind,
  type KotobaRow,
  type KanjiRow,
  type BunpoRow,
  type SoalRow,
  type TreeKind,
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
import { SIDEBAR_QUOTES } from "@/data/sidebarQuotes";
import { invalidateSidebarQuotes, type SidebarQuoteRow } from "@/lib/sidebarQuotes";
import { ROLE_LABEL, type AppRole } from "@/lib/appRole";
import { activityKindLabel, formatRelativeTime, type ActivityEntry } from "@/admin/adminActivity";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBolt,
  IconCalendar,
  IconChevronRight,
  IconClock,
  IconCode,
  IconBook,
  IconChat,
  IconChevronDown,
  IconClose,
  IconDocument,
  IconEdit,
  IconFilter,
  IconFolder,
  IconKanjiTile,
  IconLayers,
  IconNote,
  IconPlus,
  IconQuote,
  IconSakura,
  IconSave,
  IconSearch,
  IconShield,
  IconStar,
  IconSwap,
  IconTarget,
  IconTrash,
  IconUser,
  IconUsers,
} from "@/admin/adminIcons";

export type AdminSection = "dashboard" | ContentKind | PracticeSectionKey | "kutipan" | "statistik" | "pengguna";

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
  onOpenSection,
  canDelete,
}: {
  section: AdminSection;
  quickAdd?: QuickAddSignal | null;
  onQuickAdd: (kind: ContentKind) => void;
  onQuickAddHandled: () => void;
  activity: ActivityEntry[];
  onLogActivity: (entry: Omit<ActivityEntry, "id" | "at">) => void;
  onNavigateToDashboard: () => void;
  /** Pindah ke section lain (dipakai kartu statistik di Dashboard). */
  onOpenSection: (section: AdminSection) => void;
  /** Hapus (entri, Chapter, Sub Chapter, Organize by) khusus role dev. */
  canDelete: boolean;
}) {
  // hanya "milik" section yang lagi aktif — kalau kind-nya beda (misal
  // sinyal lama yang belum ke-clear), jangan dipakai.
  const autoAddToken = quickAdd && quickAdd.kind === section ? quickAdd.token : undefined;

  if (section === "dashboard") return <Dashboard onQuickAdd={onQuickAdd} onOpenSection={onOpenSection} activity={activity} />;
  if (section === "statistik") return <StatistikSection />;
  if (section === "pengguna") return <PenggunaSection />;
  const practiceScript = practiceScriptOf(section);
  if (practiceScript) return <PracticeSection key={practiceScript} script={practiceScript} canDelete={canDelete} />;
  if (section === "kutipan") return <KutipanSection canDelete={canDelete} />;
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
  onOpenSection,
  activity,
}: {
  onQuickAdd: (kind: ContentKind) => void;
  onOpenSection: (section: AdminSection) => void;
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

  const [showAll, setShowAll] = useState(false);
  const RECENT_LIMIT = 6;

  const cards: { key: ContentKind; label: string; desc: string; icon: ReactNode }[] = [
    { key: "kotoba", label: "Kotoba", desc: tr("Kata kosakata di database"), icon: <IconBook /> },
    { key: "kanji", label: "Kanji", desc: tr("Karakter kanji di database"), icon: <IconKanjiTile /> },
    { key: "bunpo", label: "Bunpō", desc: tr("Pola tata bahasa di database"), icon: <IconDocument /> },
  ];

  const quickActions: { key: ContentKind; label: string; desc: string; icon: ReactNode }[] = [
    { key: "kotoba", label: tr("Tambah Kotoba"), desc: tr("Kosakata baru ke database."), icon: <IconBook /> },
    { key: "kanji", label: tr("Tambah Kanji"), desc: tr("Karakter kanji baru."), icon: <IconKanjiTile /> },
    { key: "bunpo", label: tr("Tambah Bunpō"), desc: tr("Pola tata bahasa baru."), icon: <IconDocument /> },
  ];

  const visibleActivity = activity.slice(0, showAll ? activity.length : RECENT_LIMIT);

  return (
    <>
      <div className="adm-dash-hero">
        <div className="adm-dash-hero-art" aria-hidden="true" style={{ backgroundImage: `url(${adminBg})` }} />
        <h1>Dashboard</h1>
        <p>{tr("Ringkasan konten yang ada di database Tenka.")}</p>
      </div>

      <div className="adm-dstat-grid">
        {cards.map((c) => (
          <button
            key={c.key}
            type="button"
            className={`adm-dstat-card tone-${c.key}`}
            onClick={() => onOpenSection(c.key)}
          >
            <span className="adm-dstat-icon">{c.icon}</span>
            <span className="adm-dstat-body">
              <span className="adm-dstat-value">{counts[c.key] ?? <Skel />}</span>
              <span className="adm-dstat-label">{tr("Entri {label}", { label: c.label })}</span>
              <span className="adm-dstat-desc">{c.desc}</span>
            </span>
            <IconChevronRight className="adm-dstat-go" />
          </button>
        ))}
      </div>

      <div className="adm-dsection-head">
        <IconBolt className="adm-dsection-icon" />
        <div>
          <h2>{tr("Aksi Cepat")}</h2>
          <p>{tr("Kelola konten dengan mudah dan cepat.")}</p>
        </div>
      </div>
      <div className="adm-dquick-grid">
        {quickActions.map((a) => (
          <button
            key={a.key}
            type="button"
            className={`adm-dquick-card tone-${a.key}`}
            onClick={() => onQuickAdd(a.key)}
          >
            <span className="adm-dquick-icon">{a.icon}</span>
            <span className="adm-dquick-text">
              <span className="adm-dquick-label">{a.label}</span>
              <span className="adm-dquick-desc">{a.desc}</span>
            </span>
            <IconArrowRight className="adm-dquick-go" />
          </button>
        ))}
      </div>

      <div className="adm-card adm-dact">
        <div className="adm-dact-head">
          <span className="adm-dact-icon">
            <IconClock />
          </span>
          <div className="adm-dact-title">
            <h2>{tr("Aktivitas Terbaru")}</h2>
            <p>{tr("Perubahan terbaru di database.")}</p>
          </div>
          {activity.length > RECENT_LIMIT && (
            <button type="button" className="adm-dact-viewall" onClick={() => setShowAll((v) => !v)}>
              {showAll ? tr("Lebih Sedikit") : tr("Lihat Semua")}
              <IconArrowRight />
            </button>
          )}
        </div>
        {activity.length === 0 ? (
          <div className="adm-dact-empty">
            <IconTarget className="adm-empty-icon" />
            <p>{tr("Belum ada aktivitas. Tambah atau hapus data akan tercatat di sini.")}</p>
          </div>
        ) : (
          <ul className="adm-activity-list">
            {visibleActivity.map((entry) => (
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
                {entry.by && (
                  <span className="adm-activity-by" title={entry.by}>
                    {tr("oleh {name}", { name: entry.by })}
                  </span>
                )}
                {entry.tier && <span className="adm-tier-badge">{entry.tier}</span>}
                <span className="adm-activity-time">{formatRelativeTime(entry.at, lang)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

// -------------------------------------------------------------- statistik

type DailyRow = {
  day: string;
  active_users: number;
  practice_sessions: number;
  conquests_cleared: number;
};

type PracticedRow = {
  script_key: string;
  item_text: string;
  hint_text: string | null;
  n_attempts: number;
  n_correct: number;
  prev_attempts: number;
  prev_correct: number;
};

type ActivityRange = 7 | 30 | 90;
const ACTIVITY_RANGES: { days: ActivityRange; label: string; tickEvery: number }[] = [
  { days: 7, label: "7 Hari", tickEvery: 1 },
  { days: 30, label: "30 Hari", tickEvery: 5 },
  { days: 90, label: "3 Bulan", tickEvery: 15 },
];

const KINDS = Object.keys(TABLE_NAME) as ContentKind[];
const DAY_MS = 86_400_000;

const SCRIPT_LABEL: Record<string, string> = {
  kotoba: "Kotoba",
  kanji: "Kanji",
  bunpo: "Bunpō",
  hiragana: "Hiragana",
  katakana: "Katakana",
};

const PRACTICE_ICON: Record<string, ReactNode> = {
  kotoba: <IconBook />,
  kanji: <IconKanjiTile />,
  bunpo: <IconDocument />,
};

const localDay = (d: Date) => d.toLocaleDateString("sv-SE"); // YYYY-MM-DD, zona waktu lokal

/** `days` tanggal berurutan yang berakhir `endOffset` hari sebelum hari ini. */
function dayWindow(days: number, endOffset: number): Date[] {
  const out: Date[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - endOffset - i);
    out.push(d);
  }
  return out;
}

const sumBy = <T,>(arr: T[], pick: (x: T) => number) => arr.reduce((s, x) => s + pick(x), 0);

/** Persentase naik/turun; null kalau periode sebelumnya kosong (tidak bisa dibandingkan). */
function pctChange(cur: number, prev: number): number | null {
  return prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null;
}

function Trend({ value }: { value: number | null }) {
  if (value === null) return <span className="adm-trend adm-trend--none">—</span>;
  const dir = value > 0 ? "up" : value < 0 ? "down" : "flat";
  return (
    <span className={`adm-trend adm-trend--${dir}`}>
      {value > 0 ? "↑ " : value < 0 ? "↓ " : ""}
      {Math.abs(value)}%
    </span>
  );
}

/** Jumlah "Lesson" = Chapter unik (Organize by + nomor Chapter) per tier, dari semua jenis konten. */
async function countChapters(): Promise<Record<string, number>> {
  const seen: Record<string, Set<string>> = Object.fromEntries(TIERS.map((t) => [t, new Set<string>()]));
  await Promise.all(
    TIERS.flatMap((tier) =>
      KINDS.map(async (kind) => {
        // PostgREST membatasi 1000 baris per request, jadi dibaca per halaman.
        for (let from = 0; ; from += 1000) {
          const { data, error } = await supabase
            .from(tableFor(kind, tier))
            .select("source_id, chapter")
            .order("id")
            .range(from, from + 999);
          if (error || !data) return;
          for (const r of data as { source_id: number; chapter: number }[]) {
            seen[tier].add(`${r.source_id}:${r.chapter}`);
          }
          if (data.length < 1000) return;
        }
      }),
    ),
  );
  return Object.fromEntries(TIERS.map((t) => [t, seen[t].size]));
}

/** Entri baru sejak `sinceISO` untuk satu jenis konten (semua tier). */
async function countRecent(kind: ContentKind, sinceISO: string): Promise<number> {
  const per = await Promise.all(
    TIERS.map(async (t) => {
      const { count } = await supabase
        .from(tableFor(kind, t))
        .select("*", { count: "exact", head: true })
        .gte("created_at", sinceISO);
      return count ?? 0;
    }),
  );
  return per.reduce((a, b) => a + b, 0);
}

function StatistikSection() {
  const { tr, lang } = useAdminTr();
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
  const [newEntries, setNewEntries] = useState<Record<ContentKind, number | null>>({
    kotoba: null,
    kanji: null,
    bunpo: null,
  });
  const [userCount, setUserCount] = useState<number | null>(null);
  const [newUsers, setNewUsers] = useState<number | null>(null);
  const [chapters, setChapters] = useState<Record<string, number> | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [activityError, setActivityError] = useState<string | null>(null);
  const [range, setRange] = useState<ActivityRange>(7);
  const [daily, setDaily] = useState<DailyRow[] | null>(null);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [activeUsers, setActiveUsers] = useState<{ cur: number; prev: number } | null>(null);
  const [practiced, setPracticed] = useState<PracticedRow[] | null>(null);

  // data konten, pengguna, dan Konten Terpopuler — sekali saat halaman dibuka
  useEffect(() => {
    let cancelled = false;
    const now = Date.now();
    const weekAgo = new Date(now - 7 * DAY_MS).toISOString();

    KINDS.forEach(async (kind) => {
      const { total, perTier, error } = await countKindRows(kind);
      if (cancelled) return;
      if (error) {
        setStatus(error);
        return;
      }
      setCounts((prev) => ({ ...prev, [kind]: total }));
      setTierCounts((prev) => ({ ...prev, [kind]: perTier }));
      const recent = await countRecent(kind, weekAgo);
      if (!cancelled) setNewEntries((prev) => ({ ...prev, [kind]: recent }));
    });

    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .then(({ count, error }) => {
        if (cancelled) return;
        if (error) setStatus(error.message);
        else setUserCount(count ?? 0);
      });
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgo)
      .then(({ count }) => {
        if (!cancelled) setNewUsers(count ?? 0);
      });

    countChapters().then((r) => {
      if (!cancelled) setChapters(r);
    });

    Promise.all([
      supabase.rpc("dev_active_users", {
        p_since: weekAgo,
        p_until: new Date(now).toISOString(),
      }),
      supabase.rpc("dev_active_users", {
        p_since: new Date(now - 14 * DAY_MS).toISOString(),
        p_until: weekAgo,
      }),
    ]).then(([cur, prev]) => {
      if (cancelled) return;
      const err = cur.error ?? prev.error;
      if (err) setActivityError(err.message);
      else setActiveUsers({ cur: Number(cur.data ?? 0), prev: Number(prev.data ?? 0) });
    });

    supabase
      .rpc("dev_most_practiced", {
        p_since: new Date(now - 30 * DAY_MS).toISOString(),
        p_prev_since: new Date(now - 60 * DAY_MS).toISOString(),
        p_limit: 5,
      })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setActivityError(error.message);
          setPracticed([]);
          return;
        }
        setPracticed(
          ((data ?? []) as PracticedRow[]).map((r) => ({
            ...r,
            n_attempts: Number(r.n_attempts),
            n_correct: Number(r.n_correct),
            prev_attempts: Number(r.prev_attempts),
            prev_correct: Number(r.prev_correct),
          })),
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // grafik aktivitas — diambil ulang tiap ganti rentang waktu (butuh 2× rentang buat pembanding)
  useEffect(() => {
    let cancelled = false;
    setDailyLoading(true);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (2 * range - 1));
    supabase
      .rpc("dev_activity_daily", {
        p_since: start.toISOString(),
        p_tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
      .then(({ data, error }) => {
        if (cancelled) return;
        setDailyLoading(false);
        if (error) {
          setActivityError(error.message);
          setDaily([]);
          return;
        }
        setDaily((data ?? []) as DailyRow[]);
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  const { cur, prev } = useMemo(() => {
    const byDay = new Map((daily ?? []).map((r) => [r.day, r]));
    const build = (endOffset: number) =>
      dayWindow(range, endOffset).map((date) => {
        const r = byDay.get(localDay(date));
        return {
          date,
          active: Number(r?.active_users ?? 0),
          sessions: Number(r?.practice_sessions ?? 0),
          cleared: Number(r?.conquests_cleared ?? 0),
        };
      });
    return { cur: build(0), prev: build(range) };
  }, [daily, range]);

  const kindLabel: Record<ContentKind, string> = { kotoba: "Kotoba", kanji: "Kanji", bunpo: "Bunpō" };
  const kindIcon: Record<ContentKind, ReactNode> = {
    kotoba: <IconBook />,
    kanji: <IconKanjiTile />,
    bunpo: <IconDocument />,
  };

  // kalau ada error, jangan skeleton selamanya — tampilkan strip
  const ph = status ? "—" : <Skel />;
  const totalLessons = chapters ? sumBy(TIERS, (t) => chapters[t] ?? 0) : null;
  const newThisWeek = (n: number | null) =>
    n === null ? (
      <Skel w={64} h={12} />
    ) : n > 0 ? (
      <span className="adm-trend adm-trend--up">{tr("+{n} minggu ini", { n })}</span>
    ) : (
      <span className="adm-trend adm-trend--none">—</span>
    );

  const dateFmt = lang === "en" ? "en-US" : "id-ID";
  const labels = cur.map((x) => x.date.toLocaleDateString(dateFmt, { month: "short", day: "numeric" }));
  const chartSeries: ChartSeries[] = [
    { key: "active", name: tr("Pengguna Aktif Harian"), color: "#3b6ee6", values: cur.map((x) => x.active), area: true },
    { key: "sessions", name: tr("Sesi Latihan"), color: "#7c5ce6", values: cur.map((x) => x.sessions) },
    { key: "cleared", name: tr("Penaklukan Selesai"), color: "#12a08c", values: cur.map((x) => x.cleared) },
  ];
  const avgActive = sumBy(cur, (x) => x.active) / range;
  const summary = [
    {
      key: "active",
      label: tr("Pengguna Aktif Harian"),
      color: chartSeries[0].color,
      value: Number.isInteger(avgActive) ? String(avgActive) : avgActive.toFixed(1),
      trend: pctChange(sumBy(cur, (x) => x.active), sumBy(prev, (x) => x.active)),
    },
    {
      key: "sessions",
      label: tr("Sesi Latihan"),
      color: chartSeries[1].color,
      value: sumBy(cur, (x) => x.sessions).toLocaleString(dateFmt),
      trend: pctChange(sumBy(cur, (x) => x.sessions), sumBy(prev, (x) => x.sessions)),
    },
    {
      key: "cleared",
      label: tr("Penaklukan Selesai"),
      color: chartSeries[2].color,
      value: sumBy(cur, (x) => x.cleared).toLocaleString(dateFmt),
      trend: pctChange(sumBy(cur, (x) => x.cleared), sumBy(prev, (x) => x.cleared)),
    },
  ];
  const tickEvery = ACTIVITY_RANGES.find((r) => r.days === range)?.tickEvery ?? 1;

  return (
    <>
      <PageHeader title="Statistik" subtitle="Ringkasan pengguna, aktivitas belajar, dan konten Tenka." />
      <StatusLine status={status} />
      {activityError && (
        <p className="adm-status">
          {tr("Data aktivitas belum tersedia. Jalankan migrasi 2026_add_activity_events.sql di Supabase SQL Editor.")}{" "}
          <span className="adm-muted">({activityError})</span>
        </p>
      )}

      <div className="adm-sstat-grid">
        <div className="adm-sstat tone-users">
          <span className="adm-sstat-icon">
            <IconUsers />
          </span>
          <span className="adm-sstat-body">
            <span className="adm-sstat-value">{userCount ?? ph}</span>
            <span className="adm-sstat-label">{tr("Total Pengguna")}</span>
            <span className="adm-sstat-sub">{newThisWeek(newUsers)}</span>
          </span>
        </div>

        <div className="adm-sstat tone-active">
          <span className="adm-sstat-icon">
            <IconUsers />
          </span>
          <span className="adm-sstat-body">
            <span className="adm-sstat-value">{activeUsers ? activeUsers.cur : activityError ? "—" : <Skel />}</span>
            <span className="adm-sstat-label">{tr("Pengguna Aktif")}</span>
            <span className="adm-sstat-sub">
              <span>{tr("dalam 7 hari terakhir")}</span>
              {activeUsers && <Trend value={pctChange(activeUsers.cur, activeUsers.prev)} />}
            </span>
          </span>
        </div>

        <div className="adm-sstat tone-lessons">
          <span className="adm-sstat-icon">
            <IconLayers />
          </span>
          <span className="adm-sstat-body">
            <span className="adm-sstat-value">{totalLessons ?? ph}</span>
            <span className="adm-sstat-label">{tr("Total Lessons")}</span>
            <span className="adm-sstat-sub">
              <span>{tr("(Chapter)")}</span>
            </span>
          </span>
        </div>

        {KINDS.map((kind) => (
          <div className={`adm-sstat tone-${kind}`} key={kind}>
            <span className="adm-sstat-icon">{kindIcon[kind]}</span>
            <span className="adm-sstat-body">
              <span className="adm-sstat-value">{counts[kind] ?? ph}</span>
              <span className="adm-sstat-label">{tr("Total {label}", { label: kindLabel[kind] })}</span>
              <span className="adm-sstat-sub">{newThisWeek(newEntries[kind])}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="adm-card adm-dact">
        <div className="adm-dact-head">
          <span className="adm-dact-icon">
            <IconUsers />
          </span>
          <div className="adm-dact-title">
            <h2>{tr("Aktivitas Pengguna")}</h2>
            <p>{tr("Aktivitas harian pengguna di Tenka.")}</p>
          </div>
          <div className="adm-seg" role="tablist" aria-label={tr("Rentang waktu")}>
            {ACTIVITY_RANGES.map((r) => (
              <button
                key={r.days}
                type="button"
                role="tab"
                aria-selected={range === r.days}
                className={range === r.days ? "active" : ""}
                onClick={() => setRange(r.days)}
              >
                {tr(r.label)}
              </button>
            ))}
          </div>
        </div>
        <div className="adm-sact-body">
          <ActivityChart
            labels={labels}
            series={chartSeries}
            tickEvery={tickEvery}
            loading={dailyLoading}
            emptyText={tr("Belum ada aktivitas di periode ini.")}
          />
          <div className="adm-sact-side">
            {summary.map((m) => (
              <div className="adm-sact-metric" key={m.key}>
                <span className="adm-sact-metric-label">
                  <i style={{ background: m.color }} />
                  {m.label}
                </span>
                <span className="adm-sact-metric-row">
                  <span className="adm-sact-metric-value">{dailyLoading ? <Skel w={40} h={22} /> : m.value}</span>
                  {!dailyLoading && <Trend value={m.trend} />}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="adm-sbottom">
        <div className="adm-card adm-dact">
          <div className="adm-dact-head">
            <span className="adm-dact-icon">
              <IconLayers />
            </span>
            <div className="adm-dact-title">
              <h2>{tr("Rincian Konten per Tier")}</h2>
              <p>{tr("Total konten yang tersedia di tiap level JLPT.")}</p>
            </div>
          </div>
          <div className="adm-sbox">
            <table className="adm-table adm-stable">
              <thead>
                <tr>
                  <th className="adm-stable-first">Tier</th>
                  <th>
                    Lessons
                    <small>{tr("(Chapter)")}</small>
                  </th>
                  {KINDS.map((kind) => (
                    <th key={kind}>{kindLabel[kind]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIERS.map((t) => (
                  <tr key={t}>
                    <td className="adm-stable-first">
                      <span className="adm-tier-badge">{t}</span>
                    </td>
                    <td className="adm-muted">{chapters?.[t] ?? (status ? "—" : <Skel w={24} h={14} />)}</td>
                    {KINDS.map((kind) => (
                      <td key={kind} className="adm-muted">
                        {tierCounts[kind][t] ?? (status ? "—" : <Skel w={24} h={14} />)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="adm-card adm-dact">
          <div className="adm-dact-head">
            <span className="adm-dact-icon">
              <IconStar />
            </span>
            <div className="adm-dact-title">
              <h2>{tr("Konten Terpopuler")}</h2>
              <p>{tr("Konten yang paling sering dilatih pengguna dalam 30 hari terakhir.")}</p>
            </div>
          </div>
          <div className="adm-sbox">
            <table className="adm-table adm-stable adm-stable--practiced">
              <thead>
                <tr>
                  <th className="adm-stable-first">{tr("Konten")}</th>
                  <th>{tr("Tipe")}</th>
                  <th>{tr("Percobaan")}</th>
                  <th>{tr("Akurasi")}</th>
                </tr>
              </thead>
              <tbody>
                {practiced === null ? (
                  [0, 1, 2].map((i) => (
                    <tr key={i}>
                      <td className="adm-stable-first">
                        <Skel w="70%" h={14} />
                      </td>
                      <td>
                        <Skel w={54} h={14} />
                      </td>
                      <td>
                        <Skel w={28} h={14} />
                      </td>
                      <td>
                        <Skel w={36} h={14} />
                      </td>
                    </tr>
                  ))
                ) : practiced.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="adm-empty-row adm-muted">
                      {tr("Belum ada data latihan. Jawaban soal pengguna akan tercatat di sini.")}
                    </td>
                  </tr>
                ) : (
                  practiced.map((r) => {
                    const acc = Math.round((r.n_correct / r.n_attempts) * 100);
                    const prevAcc =
                      r.prev_attempts > 0 ? Math.round((r.prev_correct / r.prev_attempts) * 100) : null;
                    const tone = r.script_key in PRACTICE_ICON ? `tone-${r.script_key}` : "tone-lessons";
                    return (
                      <tr key={`${r.script_key}-${r.item_text}`} className={tone}>
                        <td className="adm-stable-first">
                          <span className="adm-scontent">
                            <span className="adm-scontent-icon">{PRACTICE_ICON[r.script_key] ?? <IconNote />}</span>
                            <span className="adm-scontent-text">
                              <span className="adm-scontent-main">{r.item_text}</span>
                              {r.hint_text && <span className="adm-scontent-hint">{r.hint_text}</span>}
                            </span>
                          </span>
                        </td>
                        <td>
                          <span className="adm-stype">{SCRIPT_LABEL[r.script_key] ?? r.script_key}</span>
                        </td>
                        <td className="adm-muted">{r.n_attempts}</td>
                        <td>
                          <span className="adm-sacc">
                            <b>{acc}%</b>
                            {prevAcc !== null && <Trend value={acc - prevAcc} />}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
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

type UserSort = "role" | "az" | "time";
type SortDir = "asc" | "desc";
const ROLE_SORT_RANK: Record<RoleChoice, number> = { dev: 0, admin: 1, user: 2 };
const ROLE_ICON: Record<RoleChoice, ReactNode> = {
  user: <IconUser />,
  dev: <IconCode />,
  admin: <IconShield />,
};

// Dropdown berbentuk pill (seperti di mockup). Isinya <select> native yang
// transparan di atas pill, jadi tetap bisa dipakai keyboard/screen reader.
function PillSelect<T extends string>({
  label,
  ariaLabel,
  value,
  options,
  onChange,
  showValue = false,
  active = false,
}: {
  label: string;
  ariaLabel: string;
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
  showValue?: boolean;
  active?: boolean;
}) {
  const selected = options.find(([k]) => k === value)?.[1] ?? "";
  return (
    <label className={`adm-pill${active ? " active" : ""}`}>
      <span className="adm-pill-text">
        {showValue ? selected : label}
      </span>
      <IconChevronDown className="adm-pill-caret" />
      <select
        className="adm-pill-select"
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map(([k, text]) => (
          <option key={k} value={k}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

function PenggunaSection() {
  const { tr, lang } = useAdminTr();
  const [sortBy, setSortBy] = useState<UserSort>("time");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // role tiap akun (dari fungsi SQL admin_list_roles); akun yang gak ada di
  // map ini = pengguna biasa. rolesReady=false → gagal dimuat (mis. migrasi
  // role belum dijalankan), menu ubah role dikunci supaya tidak menyesatkan.
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

    // email (opsional): kalau migrasi 2026_add_admin_list_emails.sql belum
    // dijalankan, baris email cukup tidak ditampilkan.
    const emailRes = await supabase.rpc("admin_list_emails");
    if (!emailRes.error) {
      const map: Record<string, string> = {};
      for (const r of (emailRes.data ?? []) as { user_id: string; email: string | null }[]) {
        if (r.email) map[r.user_id] = r.email;
      }
      setEmails(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const roleOf = (id: string): RoleChoice => roles[id]?.role ?? "user";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = q ? rows.filter((r) => (r.username ?? "").toLowerCase().includes(q)) : [...rows];
    const byName = (a: ProfileRow, b: ProfileRow) =>
      (a.username ?? "").localeCompare(b.username ?? "", undefined, { sensitivity: "base" });
    const byTime = (a: ProfileRow, b: ProfileRow) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    const byRole = (a: ProfileRow, b: ProfileRow) =>
      ROLE_SORT_RANK[roles[a.id]?.role ?? "user"] - ROLE_SORT_RANK[roles[b.id]?.role ?? "user"] || byName(a, b);
    // asc = urutan "utama" tiap jenis: A–Z, terbaru dulu, Dev dulu
    const cmp = sortBy === "az" ? byName : sortBy === "time" ? byTime : byRole;
    list.sort(sortDir === "asc" ? cmp : (a, b) => cmp(b, a));
    return list;
  }, [rows, search, sortBy, sortDir, roles]);

  const isDefaultView = sortBy === "time" && sortDir === "asc" && !search;
  const resetView = () => {
    setSortBy("time");
    setSortDir("asc");
    setSearch("");
  };

  const dirOptions: [SortDir, string][] =
    sortBy === "az"
      ? [["asc", "A–Z"], ["desc", "Z–A"]]
      : sortBy === "time"
        ? [["asc", tr("Terbaru")], ["desc", tr("Terlama")]]
        : [["asc", tr("Dev dulu")], ["desc", tr("User dulu")]];

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

  const dateLocale = lang === "en" ? "en-US" : "id-ID";

  return (
    <div className="adm-users-page">
      <div className="adm-users-art" aria-hidden="true" style={{ backgroundImage: `url(${adminBg})` }} />
      <PageHeader
        title="Pengguna"
        subtitle="Daftar pengguna yang terdaftar di Tenka."
      />
      <StatusLine status={status} />
      <div className="adm-card adm-users-card">
        <div className="adm-users-toolbar">
          <label className="adm-users-search">
            <IconSearch />
            <input
              type="text"
              placeholder={tr("Cari username…")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={tr("Cari username…")}
            />
          </label>
          <div className="adm-users-filters">
            {loading ? (
              <InlineLoading label={tr("Memuat…")} />
            ) : (
              <span className="adm-users-count">{tr("{count} pengguna", { count: filtered.length })}</span>
            )}
            <PillSelect<UserSort>
              label={tr("Urutkan berdasarkan")}
              ariaLabel={tr("Urutkan berdasarkan")}
              value={sortBy}
              options={[
                ["time", tr("Waktu")],
                ["role", "Role"],
                ["az", "A–Z"],
              ]}
              onChange={(v) => {
                setSortBy(v);
                setSortDir("asc");
              }}
              showValue={sortBy !== "time"}
              active={sortBy !== "time"}
            />
            <PillSelect<SortDir>
              label={dirOptions[0][1]}
              ariaLabel={tr("Arah urutan")}
              value={sortDir}
              options={dirOptions}
              onChange={setSortDir}
              showValue
              active={sortDir !== "asc"}
            />
            <button
              type="button"
              className={`adm-pill adm-pill-icon${isDefaultView ? "" : " active"}`}
              onClick={resetView}
              disabled={isDefaultView}
              aria-label={tr("Reset filter")}
              title={tr("Reset filter")}
            >
              <IconFilter />
            </button>
          </div>
        </div>

        <div className="adm-users-table-wrap">
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
                <th>{tr("Akun")}</th>
                <th>Role</th>
                <th>Rank</th>
                <th>{tr("Bergabung")}</th>
                <th aria-hidden="true" />
              </tr>
            </thead>
            <tbody>
              {loading &&
                rows.length === 0 &&
                Array.from({ length: 4 }, (_, i) => (
                  <tr key={`skel-${i}`} aria-hidden="true">
                    <td>
                      <span className="adm-user-cell">
                        <Skel w={44} h={44} circle />
                        <Skel w={110 + ((i * 23) % 60)} h={14} />
                      </span>
                    </td>
                    <td><Skel w={72} h={26} /></td>
                    <td><Skel w={90} h={14} /></td>
                    <td><Skel w={90} h={14} /></td>
                    <td />
                  </tr>
                ))}
              {filtered.map((row) => {
                const current = roleOf(row.id);
                const created = new Date(row.created_at);
                const email = emails[row.id];
                return (
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
                        <span className="adm-user-text">
                          <span className="adm-user-name">
                            {row.username || <span className="adm-muted">{tr("(belum diatur)")}</span>}
                          </span>
                          {email && <span className="adm-user-email">{email}</span>}
                        </span>
                      </span>
                    </td>
                    <td>
                      {(() => {
                        const info = roles[row.id];
                        // dikunci: akun sendiri, dev bawaan (admin_emails), atau role gagal dimuat
                        const locked = row.id === myId || !!info?.locked || !rolesReady;
                        if (locked) {
                          return (
                            <span
                              className={`adm-rbadge ${current}`}
                              title={
                                row.id === myId
                                  ? tr("Role akun sendiri tidak bisa diubah")
                                  : info?.locked
                                    ? tr("Dev bawaan — role dikunci")
                                    : undefined
                              }
                            >
                              {ROLE_ICON[current]}
                              {rolesReady ? ROLE_LABEL[current] : "…"}
                              {(row.id === myId || info?.locked) && " 🔒"}
                            </span>
                          );
                        }
                        return (
                          <label className={`adm-rbadge adm-rbadge-select ${current}${savingRoleId === row.id ? " saving" : ""}`}>
                            {ROLE_ICON[current]}
                            {ROLE_LABEL[current]}
                            <IconChevronDown className="adm-rbadge-caret" />
                            <select
                              value={current}
                              disabled={savingRoleId === row.id}
                              onChange={(e) => handleChangeRole(row, e.target.value as RoleChoice)}
                              aria-label={tr("Role {name}", { name: row.username || tr("pengguna") })}
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                              <option value="dev">Dev</option>
                            </select>
                          </label>
                        );
                      })()}
                    </td>
                    <td>
                      <span className="adm-rank-cell">
                        {RANK_LEVELS[row.rank_index ?? 0]?.logo && (
                          <img className="adm-rank-logo" src={RANK_LEVELS[row.rank_index ?? 0].logo} alt="" />
                        )}
                        <span>{RANK_LEVELS[row.rank_index ?? 0]?.title ?? "—"}</span>
                      </span>
                    </td>
                    <td>
                      <span className="adm-joined-cell">
                        <span className="adm-joined-icon">
                          <IconCalendar />
                        </span>
                        <span className="adm-joined-text">
                          <span>{formatRelativeTime(created.getTime(), lang)}</span>
                          <span className="adm-user-email">
                            {created.toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className="adm-td-action">
                      <button
                        type="button"
                        className="adm-icon-btn danger"
                        onClick={() => handleDeleteAccount(row)}
                        disabled={row.id === myId}
                        aria-label={tr("Hapus Akun")}
                        title={tr("Hapus Akun")}
                      >
                        <IconTrash />
                      </button>
                    </td>
                  </tr>
                );
              })}
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
      </div>

    </div>
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

async function fetchAllSectionTitles(kind: TreeKind): Promise<SectionTitleRow[]> {
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
async function ensureSectionTitleRow(kind: TreeKind, row: SectionTitleRow): Promise<string | null> {
  const { error } = await supabase.from(sectionTitlesTable(kind)).upsert(row, {
    onConflict: "source_id,chapter,sub_tier",
  });
  return error ? error.message : null;
}

type TreeRow = { id: number; tier: string; source_id: number; chapter: number; sub_tier: number; sort_order?: number };
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
  kind: TreeKind,
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
function useContentTree<T extends TreeRow>(kind: TreeKind, noun: string, canDelete: boolean) {
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
          TIERS.map(async (t) => {
            const q = () => supabase.from(tableFor(kind, t)).select("*").order("chapter").order("sub_tier");
            const withOrder = await q().order("sort_order").order("id");
            // kolom sort_order belum ada (migrasi belum dijalankan) → urut seperti dulu
            return withOrder.error ? await q().order("id") : withOrder;
          }),
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

  /** Geser satu entri naik/turun di dalam Sub Chapter-nya, lalu nomori ulang 1..n. */
  const moveEntry = async (row: T, dir: -1 | 1) => {
    const group = entries.filter(
      (e) => e.tier === row.tier && e.source_id === row.source_id && e.chapter === row.chapter && e.sub_tier === row.sub_tier,
    );
    const i = group.findIndex((e) => e.id === row.id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= group.length) return;
    const next = [...group];
    [next[i], next[j]] = [next[j], next[i]];
    const changed = next.map((e, idx) => ({ e, order: idx + 1 })).filter(({ e, order }) => e.sort_order !== order);
    const results = await Promise.all(
      changed.map(({ e, order }) => supabase.from(tableFor(kind, row.tier)).update({ sort_order: order }).eq("id", e.id)),
    );
    const err = results.find((r) => r.error)?.error;
    if (err) {
      setStatus(tr("Gagal simpan:") + " " + err.message);
      return;
    }
    await load();
  };

  return {
    entries,
    moveEntry,
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
    moveEntry,
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
                      <th className="adm-col-bab">{tr("Bab")}</th>
                      <th aria-hidden="true" />
                    </tr>
                  </thead>
                  <tbody>
                    {detailRows.map((row, idx) => (
                      <tr key={row.id}>
                        <td className="adm-td-no">{idx + 1}</td>
                        {config.renderCells(row)}
                        <td className="adm-muted adm-col-bab">
                          {row.chapter}.{row.sub_tier}
                        </td>
                        <td className="adm-td-action">
                          {row.sort_order !== undefined && (
                            <>
                              <button type="button" className="adm-icon-btn" disabled={idx === 0} onClick={() => moveEntry(row, -1)} aria-label={tr("Naik")}>
                                <IconChevronDown style={{ transform: "rotate(180deg)" }} />
                              </button>
                              <button type="button" className="adm-icon-btn" disabled={idx === detailRows.length - 1} onClick={() => moveEntry(row, 1)} aria-label={tr("Turun")}>
                                <IconChevronDown />
                              </button>
                            </>
                          )}
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
  headers: ["Kana", "Arti"],
  renderCells: (row) => (
    <>
      <td className="adm-td-jp">{row.kana}</td>
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
            <div className="adm-grid-3">
              <Field label="Kana" required>
                <input name="kana" placeholder={tr("Contoh: わたし")} defaultValue={r?.kana} required />
              </Field>
              <Field label="Romaji" required>
                <input name="romaji" placeholder={tr("Contoh: watashi")} defaultValue={r?.romaji} required />
              </Field>
              <Field label="Kanji (opsional)" hint="Kosongkan kalau kata ini tidak punya kanji.">
                <input name="kanji_word" placeholder={tr("Contoh: 私")} defaultValue={r?.kanji_word} />
              </Field>
            </div>
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
              <Field label="Kalimat Jepang (Kanji) (opsional)" hint="Kosongkan kalau kalimatnya tidak memakai kanji.">
                <CountedTextarea name="kanji_example" placeholder={tr("Contoh: 私は学生です。")} maxLength={200} defaultValue={r?.kanji_example} />
              </Field>
            </div>
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
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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

// ------------------------------------------------------------ Script Practice
//
// Bank soal mode Latihan (pilihan ganda), ditampilkan per aksara (Kotoba /
// Bunpō / Kanji) lalu per tipe soal — kartu tipe di atas, tabel soal di
// bawahnya. Soal disimpan di soal_entries_<level> dengan kolom `script` &
// `question_type` (lihat migrasi 2026_add_soal_script_and_type.sql). Daftarnya
// datar: semua level N5–N1 digabung, tanpa Organize by / Chapter / Sub Chapter.

const SOAL_MIN_OPTIONS = 2;
const SOAL_MAX_OPTIONS = 6;
const SOAL_DEFAULT_OPTIONS = 4;
const PRACTICE_PAGE_SIZE = 10;

export type PracticeSectionKey = `practice-${JlptScriptKey}`;

export function practiceScriptOf(section: AdminSection): JlptScriptKey | null {
  if (!section.startsWith("practice-")) return null;
  const script = section.slice("practice-".length);
  return isJlptScript(script) ? script : null;
}

const PRACTICE_SCRIPT_META: Record<JlptScriptKey, { label: string; desc: string; icon: ReactNode }> = {
  kotoba: { label: "Kotoba", desc: "Latihan kosakata dengan berbagai tipe soal.", icon: <IconBook /> },
  bunpo: { label: "Bunpō", desc: "Latihan tata bahasa dengan berbagai tipe soal.", icon: <IconDocument /> },
  kanji: { label: "Kanji", desc: "Latihan kanji dengan berbagai tipe soal.", icon: <IconKanjiTile /> },
};

const PRACTICE_TYPE_ICON: Record<PracticeTypeKey, ReactNode> = {
  meaning: <IconBook />,
  reading: <IconDocument />,
  write: <IconEdit />,
  fill: <span className="adm-ptype-glyph">Aa</span>,
  usage: <IconSakura />,
  similar: <IconSwap />,
  particle: <IconTarget />,
  conjugation: <IconSwap />,
  transform: <IconSwap />,
};

// Warna tile tiap kartu tipe (biru, hijau, ungu, oranye, lalu berulang).
const PRACTICE_TONES = ["blue", "green", "purple", "orange"] as const;

type PracticeSelection = `${string}:${number}`;
const selKey = (row: SoalRow): PracticeSelection => `${row.tier}:${row.id}`;

// Daftar nomor halaman: 1 2 3 4 5 … 20 (jendela bergeser mengikuti halaman aktif).
function pageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, 2, total, current - 1, current, current + 1]);
  if (current <= 4) [3, 4, 5].forEach((n) => pages.add(n));
  if (current >= total - 3) [total - 1, total - 2, total - 3, total - 4].forEach((n) => pages.add(n));
  const sorted = [...pages].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}

// Editor pilihan jawaban: 2–6 baris, bulatan di kiri menandai jawaban yang
// benar. Nilainya dibaca lewat FormData (name="option" berulang + name="answer").
function OptionsEditor({ defaultOptions, defaultAnswer }: { defaultOptions?: string[]; defaultAnswer?: number }) {
  const { tr } = useAdminTr();
  const [options, setOptions] = useState<string[]>(() =>
    defaultOptions && defaultOptions.length >= SOAL_MIN_OPTIONS
      ? defaultOptions
      : Array.from({ length: SOAL_DEFAULT_OPTIONS }, () => ""),
  );
  const [answer, setAnswer] = useState(defaultAnswer ?? 0);

  const setOption = (i: number, value: string) => setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)));
  const addOption = () => setOptions((prev) => (prev.length >= SOAL_MAX_OPTIONS ? prev : [...prev, ""]));
  const removeOption = (i: number) => {
    if (options.length <= SOAL_MIN_OPTIONS) return;
    setOptions((prev) => prev.filter((_, idx) => idx !== i));
    // jawaban benar ikut bergeser kalau pilihan di atasnya dihapus
    setAnswer((a) => (a === i ? 0 : a > i ? a - 1 : a));
  };

  return (
    <div className="adm-opt-list">
      {options.map((value, i) => (
        <div className={`adm-opt-row${answer === i ? " correct" : ""}`} key={i}>
          <input
            type="radio"
            name="answer"
            value={i}
            checked={answer === i}
            onChange={() => setAnswer(i)}
            aria-label={tr("Tandai pilihan {n} sebagai jawaban benar", { n: String.fromCharCode(65 + i) })}
          />
          <span className="adm-opt-letter">{String.fromCharCode(65 + i)}</span>
          <input
            type="text"
            name="option"
            className="adm-opt-input"
            value={value}
            maxLength={120}
            required
            placeholder={tr("Pilihan {n}", { n: String.fromCharCode(65 + i) })}
            onChange={(e) => setOption(i, e.currentTarget.value)}
          />
          <button
            type="button"
            className="adm-icon-btn danger"
            disabled={options.length <= SOAL_MIN_OPTIONS}
            onClick={() => removeOption(i)}
            aria-label={tr("Hapus pilihan")}
          >
            <IconClose />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="adm-btn adm-btn-outline adm-opt-add"
        disabled={options.length >= SOAL_MAX_OPTIONS}
        onClick={addOption}
      >
        <IconPlus /> {tr("Tambah Pilihan")}
      </button>
    </div>
  );
}

function PracticeSection({ script, canDelete }: { script: JlptScriptKey; canDelete: boolean }) {
  const { tr, lang } = useAdminTr();
  const { t } = useLang();
  const meta = PRACTICE_SCRIPT_META[script];
  const types = useMemo(() => practiceTypesFor(script), [script]);

  const [rows, setRows] = useState<SoalRow[] | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [type, setType] = useState<PracticeTypeKey>(types[0]);
  const [page, setPage] = useState(1);
  const [picked, setPicked] = useState<Set<PracticeSelection>>(new Set());
  const [view, setView] = useState<"browse" | "add" | "edit">("browse");
  const [formKey, setFormKey] = useState(0);
  const [editingRow, setEditingRow] = useState<SoalRow | null>(null);
  const [busy, setBusy] = useState(false);
  const dateLocale = lang === "en" ? "en-US" : "id-ID";

  const load = async () => {
    const results = await Promise.all(
      TIERS.map(async (tier) => {
        const { data, error } = await supabase
          .from(tableFor("soal", tier))
          .select("*")
          .eq("script", script)
          .not("question_type", "is", null)
          .order("created_at", { ascending: false });
        return { data: (data ?? []) as SoalRow[], error };
      }),
    );
    const failed = results.find((r) => r.error);
    if (failed?.error && results.every((r) => r.error)) {
      setStatus(tr("Gagal memuat:") + " " + failed.error.message);
    }
    const merged = results.flatMap((r) => r.data);
    merged.sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id);
    setRows(merged);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    (rows ?? []).forEach((r) => {
      if (r.question_type) map[r.question_type] = (map[r.question_type] ?? 0) + 1;
    });
    return map;
  }, [rows]);

  const typeRows = useMemo(() => (rows ?? []).filter((r) => r.question_type === type), [rows, type]);
  const totalPages = Math.max(1, Math.ceil(typeRows.length / PRACTICE_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PRACTICE_PAGE_SIZE;
  const pageRows = typeRows.slice(start, start + PRACTICE_PAGE_SIZE);
  const typeName = t(`practice.${script}.${type}`);
  const typeIndex = types.indexOf(type);
  const typeTone = PRACTICE_TONES[typeIndex % PRACTICE_TONES.length];

  const pickType = (k: PracticeTypeKey) => {
    setType(k);
    setPage(1);
    setPicked(new Set());
    setStatus(null);
  };

  const allOnPagePicked = pageRows.length > 0 && pageRows.every((r) => picked.has(selKey(r)));
  const togglePage = () =>
    setPicked((prev) => {
      const next = new Set(prev);
      pageRows.forEach((r) => (allOnPagePicked ? next.delete(selKey(r)) : next.add(selKey(r))));
      return next;
    });
  const toggleOne = (row: SoalRow) =>
    setPicked((prev) => {
      const next = new Set(prev);
      const k = selKey(row);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  const handleDelete = async (row: SoalRow) => {
    if (!canDelete) return; // hapus khusus dev
    if (!confirm(tr("Hapus entry ini?"))) return;
    const { error } = await supabase.from(tableFor("soal", row.tier)).delete().eq("id", row.id);
    if (error) {
      setStatus(tr("Gagal hapus:") + " " + error.message);
      return;
    }
    setPicked((prev) => {
      const next = new Set(prev);
      next.delete(selKey(row));
      return next;
    });
    load();
  };

  const handleBulkDelete = async () => {
    if (!canDelete || picked.size === 0) return;
    if (!confirm(tr("Hapus {n} soal terpilih?", { n: picked.size }))) return;
    setBusy(true);
    const byTier = new Map<string, number[]>();
    picked.forEach((k) => {
      const [tier, id] = k.split(":");
      byTier.set(tier, [...(byTier.get(tier) ?? []), Number(id)]);
    });
    for (const [tier, ids] of byTier) {
      const { error } = await supabase.from(tableFor("soal", tier)).delete().in("id", ids);
      if (error) {
        setStatus(tr("Gagal hapus:") + " " + error.message);
        setBusy(false);
        load();
        return;
      }
    }
    setPicked(new Set());
    setBusy(false);
    setStatus(null);
    load();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>, submitter: HTMLButtonElement | null) => {
    e.preventDefault();
    const formEl = e.currentTarget; // simpan sebelum `await` (lihat KotobaSection)
    const form = new FormData(formEl);
    const options = form.getAll("option").map((o) => String(o).trim());
    const answerIndex = Number(form.get("answer"));
    if (options.length < SOAL_MIN_OPTIONS || options.some((o) => !o)) {
      setStatus(tr("Isi semua pilihan jawaban (minimal {n}).", { n: SOAL_MIN_OPTIONS }));
      return;
    }
    if (new Set(options).size !== options.length) {
      setStatus(tr("Pilihan jawaban tidak boleh ada yang sama."));
      return;
    }
    if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= options.length) {
      setStatus(tr("Tandai satu pilihan sebagai jawaban yang benar."));
      return;
    }
    const opt = (name: string) => String(form.get(name) ?? "").trim() || null;
    const content = {
      question: String(form.get("question") ?? "").trim(),
      question_translation_id: opt("question_translation_id"),
      question_translation_en: opt("question_translation_en"),
      options,
      answer_index: answerIndex,
      explanation_id: opt("explanation_id"),
      explanation_en: opt("explanation_en"),
    };
    setStatus(tr("Menyimpan…"));

    if (view === "edit" && editingRow) {
      const { error } = await supabase.from(tableFor("soal", editingRow.tier)).update(content).eq("id", editingRow.id);
      if (error) {
        setStatus(tr("Gagal:") + " " + error.message);
        return;
      }
      setStatus(tr("Perubahan tersimpan."));
      setEditingRow(null);
      setView("browse");
      load();
      return;
    }

    const tier = String(form.get("tier") ?? "N5");
    const { error } = await supabase.from(tableFor("soal", tier)).insert({
      ...content,
      tier,
      script,
      question_type: type,
      source_id: null,
      chapter: 1,
      sub_tier: 1,
    });
    if (error) {
      setStatus(tr("Gagal:") + " " + error.message);
      return;
    }
    setStatus(tr("Tersimpan."));
    load();
    if (submitter?.value === "done") {
      setPage(1);
      setView("browse");
    } else {
      formEl.reset();
      setFormKey((k) => k + 1);
      scrollFormToTop();
      setStatus(tr("Tersimpan. Silakan tambah entri berikutnya."));
    }
  };

  if (view === "add" || view === "edit") {
    const editing = view === "edit";
    const r = editingRow;
    return (
      <>
        <PageHeader
          title={editing ? "Edit Soal" : "Tambah Soal"}
          subtitle={`${meta.label} · ${typeName}`}
          onBack={() => {
            setEditingRow(null);
            setStatus(null);
            setView("browse");
          }}
        />
        <form
          key={editing ? `edit-${r?.id}` : formKey}
          className="adm-form"
          onSubmit={(e) => handleSubmit(e, (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)}
        >
          <SectionCard icon={<IconDocument />} title="Soal" desc="Pertanyaan yang akan muncul di mode Latihan.">
            <Field label="Level" required>
              <select name="tier" defaultValue={r?.tier ?? "N5"} disabled={editing}>
                {TIERS.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Teks Soal" required>
              <CountedTextarea
                name="question"
                placeholder={tr("Contoh: わたし___がくせいです。")}
                maxLength={300}
                required
                defaultValue={r?.question}
              />
            </Field>
            <div className="adm-grid-2">
              <Field label="Terjemahan Indonesia" optional>
                <CountedTextarea
                  name="question_translation_id"
                  placeholder={tr("Contoh: Saya adalah seorang siswa.")}
                  maxLength={200}
                  defaultValue={r?.question_translation_id ?? undefined}
                />
              </Field>
              <Field label="Terjemahan English" optional>
                <CountedTextarea
                  name="question_translation_en"
                  placeholder={tr("Example: I am a student.")}
                  maxLength={200}
                  defaultValue={r?.question_translation_en ?? undefined}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            icon={<IconTarget />}
            title="Pilihan Jawaban"
            desc="Isi 2–6 pilihan, lalu klik bulatan di kiri untuk menandai jawaban yang benar."
          >
            <OptionsEditor defaultOptions={r?.options} defaultAnswer={r?.answer_index} />
          </SectionCard>

          <SectionCard icon={<IconNote />} title="Pembahasan" desc="Penjelasan yang tampil setelah soal dijawab.">
            <div className="adm-grid-2">
              <Field label="Pembahasan Indonesia" optional>
                <CountedTextarea name="explanation_id" placeholder={tr("Pembahasan (ID)…")} maxLength={400} defaultValue={r?.explanation_id ?? undefined} />
              </Field>
              <Field label="Pembahasan English" optional>
                <CountedTextarea name="explanation_en" placeholder={tr("Explanation (EN)…")} maxLength={400} defaultValue={r?.explanation_en ?? undefined} />
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
    <div className="adm-practice">
      <nav className="adm-crumbs" aria-label="Breadcrumb">
        <IconCode />
        <span>{tr("Script Practice")}</span>
        <span className="adm-crumbs-sep">/</span>
        <span>{meta.label}</span>
        <span className="adm-crumbs-sep">/</span>
        <span className="adm-crumbs-current">{typeName}</span>
      </nav>

      <div className="adm-page-header adm-practice-header">
        <span className="adm-practice-script-icon">{meta.icon}</span>
        <div>
          <h1>{meta.label}</h1>
          <p>{tr(meta.desc)}</p>
        </div>
      </div>

      <div className="adm-ptype-grid" role="tablist" aria-label={tr("Tipe Soal")}>
        {types.map((k, i) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={type === k}
            className={`adm-ptype tone-${PRACTICE_TONES[i % PRACTICE_TONES.length]}${type === k ? " active" : ""}`}
            onClick={() => pickType(k)}
          >
            <span className="adm-ptype-icon">{PRACTICE_TYPE_ICON[k]}</span>
            <span className="adm-ptype-text">
              <span className="adm-ptype-name">{t(`practice.${script}.${k}`)}</span>
              <span className="adm-ptype-count">
                {rows === null ? "…" : counts[k] ?? 0} {tr("soal")}
              </span>
            </span>
            <IconChevronRight className="adm-ptype-caret" />
          </button>
        ))}
      </div>

      <StatusLine status={status} />

      <div className="adm-card adm-practice-card">
        <div className="adm-practice-head">
          <span className={`adm-practice-head-icon tone-${typeTone}`}>{PRACTICE_TYPE_ICON[type]}</span>
          <div className="adm-practice-head-text">
            <h2>{typeName}</h2>
            <p>{t(`practice.${script}.${type}Desc`)}</p>
          </div>
          <span className="adm-practice-count">
            {typeRows.length} {tr("soal")}
          </span>
          <button
            type="button"
            className="adm-btn adm-btn-primary"
            onClick={() => {
              setEditingRow(null);
              setStatus(null);
              setView("add");
            }}
          >
            <IconPlus /> {tr("Tambah Soal")}
          </button>
        </div>

        {canDelete && picked.size > 0 && (
          <div className="adm-bulkbar" role="status">
            <span>{tr("{n} soal dipilih", { n: picked.size })}</span>
            <button type="button" className="adm-btn adm-btn-ghost" onClick={() => setPicked(new Set())} disabled={busy}>
              {tr("Batal")}
            </button>
            <button type="button" className="adm-practice-btn danger" onClick={handleBulkDelete} disabled={busy}>
              <IconTrash /> {tr("Hapus Terpilih")}
            </button>
          </div>
        )}

        <div className="adm-practice-tablewrap">
          <table className="adm-table adm-table--practice">
            <thead>
              <tr>
                <th className="adm-col-check">
                  <input
                    type="checkbox"
                    className="adm-check"
                    checked={allOnPagePicked}
                    disabled={!canDelete || pageRows.length === 0}
                    onChange={togglePage}
                    aria-label={tr("Pilih semua di halaman ini")}
                  />
                </th>
                <th className="adm-col-no">{tr("No")}</th>
                <th>{tr("Pertanyaan")}</th>
                <th>{tr("Pilihan Jawaban")}</th>
                <th>{tr("Jawaban Benar")}</th>
                <th>{tr("Dibuat Pada")}</th>
                <th>{tr("Aksi")}</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, i) => {
                const created = new Date(row.created_at);
                const translation =
                  (lang === "en"
                    ? row.question_translation_en ?? row.question_translation_id
                    : row.question_translation_id ?? row.question_translation_en) ?? "";
                return (
                  <tr key={selKey(row)} className={picked.has(selKey(row)) ? "picked" : undefined}>
                    <td className="adm-col-check">
                      <input
                        type="checkbox"
                        className="adm-check"
                        checked={picked.has(selKey(row))}
                        disabled={!canDelete}
                        onChange={() => toggleOne(row)}
                        aria-label={tr("Pilih soal {n}", { n: start + i + 1 })}
                      />
                    </td>
                    <td className="adm-col-no">{start + i + 1}</td>
                    <td>
                      <span className="adm-pq">
                        <span className="adm-pq-main">{row.question}</span>
                        <span className="adm-pq-sub">
                          <span className="adm-tier-badge">{row.tier}</span>
                          {translation && <span>{translation}</span>}
                        </span>
                      </span>
                    </td>
                    <td>
                      <span className="adm-chips">
                        {row.options.map((o, idx) => (
                          <span className="adm-chip" key={idx}>
                            {o}
                          </span>
                        ))}
                      </span>
                    </td>
                    <td>
                      <span className="adm-chip adm-chip-correct">{row.options[row.answer_index]}</span>
                    </td>
                    <td>
                      <span className="adm-pdate">
                        <span>
                          {created.toLocaleDateString(dateLocale, { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                        <span className="adm-muted">
                          {created.toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit", hour12: false })}
                        </span>
                      </span>
                    </td>
                    <td>
                      <span className="adm-practice-actions">
                        <button
                          type="button"
                          className="adm-practice-btn edit"
                          onClick={() => {
                            setEditingRow(row);
                            setStatus(null);
                            setView("edit");
                          }}
                        >
                          <IconEdit /> {tr("Edit")}
                        </button>
                        {canDelete && (
                          <button type="button" className="adm-practice-btn danger" onClick={() => handleDelete(row)}>
                            <IconTrash /> {tr("Hapus")}
                          </button>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {rows === null && (
                <tr>
                  <td colSpan={7} className="adm-empty-row">
                    <InlineLoading label={tr("Memuat…")} />
                  </td>
                </tr>
              )}
              {rows !== null && typeRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="adm-muted adm-empty-row">
                    {tr("Belum ada soal untuk tipe ini. Klik Tambah Soal untuk membuat yang pertama.")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {typeRows.length > 0 && (
          <div className="adm-practice-foot">
            <span className="adm-muted">
              {tr("Menampilkan {from} - {to} dari {total} data", {
                from: start + 1,
                to: Math.min(start + PRACTICE_PAGE_SIZE, typeRows.length),
                total: typeRows.length,
              })}
            </span>
            <nav className="adm-pager" aria-label={tr("Halaman")}>
              <button
                type="button"
                className="adm-pager-btn"
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
                aria-label={tr("Sebelumnya")}
              >
                <IconChevronRight className="adm-pager-prev" />
              </button>
              {pageList(safePage, totalPages).map((p, i) =>
                p === "…" ? (
                  <span className="adm-pager-gap" key={`gap-${i}`}>
                    ….
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    className={`adm-pager-btn${p === safePage ? " active" : ""}`}
                    aria-current={p === safePage ? "page" : undefined}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ),
              )}
              <button
                type="button"
                className="adm-pager-btn"
                disabled={safePage >= totalPages}
                onClick={() => setPage(safePage + 1)}
                aria-label={tr("Berikutnya")}
              >
                <IconChevronRight />
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}

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

// ---------------------------------------------------------------- Kutipan
//
// Kelola kutipan/tips yang diketik bergantian di kartu sidebar (app utama +
// Admin Panel). Disimpan di tabel sidebar_quotes; kalau tabel kosong, app
// pakai daftar bawaan (src/data/sidebarQuotes.ts) — tombol "Impor Bawaan"
// menyalin daftar itu ke database supaya bisa diedit.

const QUOTE_MAX = 120;

function KutipanSection({ canDelete }: { canDelete: boolean }) {
  const { tr } = useAdminTr();
  const [rows, setRows] = useState<SidebarQuoteRow[] | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "form">("list");
  const [editing, setEditing] = useState<SidebarQuoteRow | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("sidebar_quotes")
      .select("id, text_id, text_en, sort_order, is_active, created_at")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });
    if (error) {
      setStatus(tr("Gagal memuat:") + " " + error.message);
      setRows([]);
      return;
    }
    setRows((data ?? []) as SidebarQuoteRow[]);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const done = async (msg: string | null) => {
    setStatus(msg);
    invalidateSidebarQuotes();
    await load();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>, submitter: HTMLButtonElement | null) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const text_id = String(fd.get("text_id") ?? "").trim();
    const text_en = String(fd.get("text_en") ?? "").trim();
    const author = String(fd.get("author") ?? "").trim() || null;
    if (!text_id && !text_en) {
      setStatus(tr("Isi minimal satu bahasa."));
      return;
    }
    setBusy(true);
    setStatus(null);
    const res = editing
      ? await supabase.from("sidebar_quotes").update({ text_id, text_en, author }).eq("id", editing.id)
      : await supabase.from("sidebar_quotes").insert({
          text_id,
          text_en,
          author,
          sort_order: (rows ?? []).reduce((m, r) => Math.max(m, r.sort_order), 0) + 1,
        });
    setBusy(false);
    if (res.error) {
      setStatus(tr("Gagal simpan:") + " " + res.error.message);
      return;
    }
    await done(editing ? tr("Kutipan diperbarui.") : tr("Kutipan ditambahkan."));
    if (!editing && submitter?.value === "again") {
      form.reset();
      setFormKey((k) => k + 1);
      return;
    }
    setEditing(null);
    setView("list");
  };

  const toggleActive = async (row: SidebarQuoteRow) => {
    const { error } = await supabase.from("sidebar_quotes").update({ is_active: !row.is_active }).eq("id", row.id);
    if (error) return setStatus(tr("Gagal simpan:") + " " + error.message);
    await done(null);
  };

  const move = async (row: SidebarQuoteRow, dir: -1 | 1) => {
    if (!rows) return;
    const i = rows.findIndex((r) => r.id === row.id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= rows.length) return;
    // urutan baru, lalu nomori ulang 1..n (hanya yang berubah yang ditulis)
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    const changed = next.map((r, idx) => ({ r, order: idx + 1 })).filter(({ r, order }) => r.sort_order !== order);
    const results = await Promise.all(
      changed.map(({ r, order }) => supabase.from("sidebar_quotes").update({ sort_order: order }).eq("id", r.id)),
    );
    const err = results.find((x) => x.error)?.error;
    if (err) return setStatus(tr("Gagal simpan:") + " " + err.message);
    await done(null);
  };

  const remove = async (row: SidebarQuoteRow) => {
    const preview = (row.text_id || row.text_en).replace(/\n/g, " ");
    if (!window.confirm(tr("Hapus kutipan ini?") + "\n\n" + preview)) return;
    const { error } = await supabase.from("sidebar_quotes").delete().eq("id", row.id);
    if (error) return setStatus(tr("Gagal hapus:") + " " + error.message);
    await done(null);
  };

  const importDefaults = async () => {
    setBusy(true);
    const payload = SIDEBAR_QUOTES.map((q, i) => ({
      text_id: q.lines.id.join("\n"),
      text_en: q.lines.en.join("\n"),
      sort_order: i + 1,
    }));
    const { error } = await supabase.from("sidebar_quotes").insert(payload);
    setBusy(false);
    if (error) return setStatus(tr("Gagal simpan:") + " " + error.message);
    await done(tr("Kutipan bawaan diimpor."));
  };

  if (view === "form") {
    const r = editing;
    return (
      <>
        <PageHeader
          title={r ? "Edit Kutipan" : "Tambah Kutipan"}
          subtitle="Teks yang diketik di kartu sidebar. Tekan Enter untuk pindah baris."
          onBack={() => {
            setEditing(null);
            setView("list");
          }}
        />
        <form
          key={r ? `edit-${r.id}` : formKey}
          className="adm-form"
          onSubmit={(e) => handleSubmit(e, (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)}
        >
          <SectionCard icon={<IconQuote />} title="Isi Kutipan" desc="Isi salah satu bahasa, yang kosong ikut bahasa lainnya.">
            <Field label="Kutipan (Indonesia)">
              <CountedTextarea name="text_id" placeholder="Contoh: Langkah kecil setiap hari" maxLength={QUOTE_MAX} rows={3} defaultValue={r?.text_id} />
            </Field>
            <Field label="Kutipan (English)">
              <CountedTextarea name="text_en" placeholder="Contoh: Small steps every day" maxLength={QUOTE_MAX} rows={3} defaultValue={r?.text_en} />
            </Field>
            <Field label="Penulis (opsional)">
              <input name="author" placeholder={tr("Contoh: Miyamoto Musashi")} maxLength={40} defaultValue={r?.author ?? ""} />
            </Field>
          </SectionCard>
          <StatusLine status={status} />
          <FormFooter editing={!!r} />
        </form>
      </>
    );
  }

  return (
    <>
      <PageHeader sticky title="Kutipan" subtitle="Kelola kata-kata yang tampil di kartu sidebar." />
      <StatusLine status={status} />
      <div className="adm-card adm-quotes-card">
        <div className="adm-quotes-toolbar">
          <span className="adm-muted">{rows === null ? tr("Memuat…") : tr("{n} kutipan", { n: rows.length })}</span>
          <button
            type="button"
            className="adm-btn adm-btn-primary"
            onClick={() => {
              setEditing(null);
              setStatus(null);
              setView("form");
            }}
          >
            <IconPlus /> {tr("Tambah Kutipan")}
          </button>
        </div>

        {rows === null && <InlineLoading label={tr("Memuat…")} />}

        {rows && rows.length === 0 && (
          <div className="adm-empty-card">
            <IconQuote className="adm-empty-icon" />
            <p>{tr("Belum ada kutipan di database. Sidebar sedang memakai daftar bawaan.")}</p>
            <button type="button" className="adm-btn adm-btn-outline" disabled={busy} onClick={importDefaults}>
              {tr("Impor Bawaan")}
            </button>
          </div>
        )}

        {rows && rows.length > 0 && (
          <ul className="adm-quotes-list">
            {rows.map((row, i) => (
              <li key={row.id} className={`adm-quotes-row${row.is_active ? "" : " off"}`}>
                <div className="adm-quotes-text">
                  <p lang="id">{row.text_id || <em className="adm-muted">—</em>}</p>
                  <p lang="en" className="adm-muted">
                    {row.text_en || <em>—</em>}
                  </p>
                  {row.author && <p className="adm-muted">— {row.author}</p>}
                </div>
                <div className="adm-quotes-actions">
                  <label className="adm-quotes-switch" title={tr("Tampilkan di sidebar")}>
                    <input type="checkbox" checked={row.is_active} onChange={() => toggleActive(row)} />
                    <span>{row.is_active ? tr("Aktif") : tr("Mati")}</span>
                  </label>
                  <button type="button" className="adm-icon-btn" disabled={i === 0} onClick={() => move(row, -1)} aria-label={tr("Naik")}>
                    <IconChevronDown style={{ transform: "rotate(180deg)" }} />
                  </button>
                  <button type="button" className="adm-icon-btn" disabled={i === rows.length - 1} onClick={() => move(row, 1)} aria-label={tr("Turun")}>
                    <IconChevronDown />
                  </button>
                  <button
                    type="button"
                    className="adm-icon-btn"
                    onClick={() => {
                      setEditing(row);
                      setStatus(null);
                      setView("form");
                    }}
                    aria-label={tr("Edit")}
                  >
                    <IconEdit />
                  </button>
                  {canDelete && (
                    <button type="button" className="adm-icon-btn danger" onClick={() => remove(row)} aria-label={tr("Hapus")}>
                      <IconTrash />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
