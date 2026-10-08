import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { computeStats, type Range, type SrcFilter } from "@/state/flashStats";
import { useUI, type Screen } from "@/state/UIContext";
import { useLang } from "@/i18n/LangContext";
import { useRankIndex } from "@/hooks/useRankIndex";
import { RANK_LEVELS } from "@/data/ranks";

const RANGES: Range[] = ["today", "7d", "30d", "all"];
const SRCS: SrcFilter[] = ["all", "flash", "quiz", "match"];
const RANGE_KEY: Record<Range, string> = { today: "stat.r.today", "7d": "stat.r.7d", "30d": "stat.r.30d", all: "stat.r.all" };

// tab "Yang sering salah": kunci = kunci jenis soal di flashStats
const WEAK_TABS = [
  { k: "all", label: "" },
  { k: "kotoba", label: "Kotoba" },
  { k: "bunpo", label: "Bunpō" },
  { k: "kanji", label: "Kanji" },
] as const;

// asal kesalahan -> halaman tujuan tombol "Ulangi di …"
const ORIGIN_SCREEN: Record<string, Screen> = { quiz: "start", practice: "practice", flashcard: "flashdeck" };

const GLYPH: Record<string, string> = {
  hiragana: "あ",
  katakana: "ア",
  kotoba: "語",
  bunpo: "文",
  kanji: "漢",
  other: "他",
  custom: "✎",
  db: "DB",
};

const MONTHS = {
  id: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};
// indeks = Date.getDay() (0 = Minggu)
const DAYS = {
  id: ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // baris heatmap: Senin → Minggu

type TFn = (key: string, vars?: Record<string, string | number>) => string;

function Delta({ now, before, unit = "", show, t }: { now: number; before: number; unit?: string; show: boolean; t: TFn }) {
  if (!show) return <div className="d">&nbsp;</div>;
  const diff = now - before;
  if (!diff) return <div className="d">{t("stat.same")}</div>;
  return (
    <div className={`d ${diff > 0 ? "up" : "dn"}`}>
      {diff > 0 ? "▲" : "▼"} {Math.abs(diff)}
      {unit} {t("stat.fromPrev")}
    </div>
  );
}

function RankJourney() {
  const { t } = useLang();
  const idx = useRankIndex();
  const rank = RANK_LEVELS[idx];
  const next = RANK_LEVELS[idx + 1];
  const pct = Math.round(((idx + 1) / RANK_LEVELS.length) * 100);
  return (
    <div className="st-card sx-journey">
      <h2>
        {t("stat.journey")} <span>{t("stat.currentRank")}</span>
      </h2>
      <div className="sx-rank">
        <img src={rank.logo} alt={rank.title} />
        <div>
          <b>{rank.title}</b>
          <small>{rank.subtitle}</small>
        </div>
      </div>
      <div className="sx-xp">
        <div className="track"><i style={{ width: `${pct}%` }} /></div>
      </div>
      <div className="sx-journey-foot">
        <span>{t("stat.rankOf", { a: idx + 1, b: RANK_LEVELS.length })}</span>
        <span>
          {next ? (
            <>
              {t("stat.next")} <b>{next.title}</b>
            </>
          ) : (
            t("stat.topRank")
          )}
        </span>
      </div>
    </div>
  );
}

export default function StatistikScreen() {
  const { setScreen } = useUI();
  const { t, lang } = useLang();
  const [range, setRange] = useState<Range>("7d");
  const [src, setSrc] = useState<SrcFilter>("all");
  const [lessonTab, setLessonTab] = useState<"all" | "Kotoba" | "Kanji">("all");
  const [weakTab, setWeakTab] = useState<(typeof WEAK_TABS)[number]["k"]>("all");
  // `lang` ikut dependensi: judul sub chapter & label kartu dibangun saat dihitung
  const s = useMemo(() => computeStats(range, src), [range, src, lang]);
  const { c, n } = s.cur;
  const right = n - c.again;
  const pct = (v: number) => (n ? (v / n) * 100 : 0);
  const rightPct = pct(right);
  const maxWeek = Math.max(1, ...s.week.map((w) => w.v));
  const weekTotal = s.week.reduce((sum, w) => sum + w.v, 0);
  const weekAvg = (weekTotal / 7).toFixed(1).replace(".", lang === "id" ? "," : ".");
  const maxHeat = Math.max(1, ...s.heatWeeks.flat().map((cell) => cell.n));
  const weekCols = s.heatWeeks.length;
  const heatRef = useRef<HTMLDivElement>(null);
  // heatmap panjang: mulai dari minggu terbaru (paling kanan)
  useEffect(() => {
    const el = heatRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [weekCols]);
  const [tip, setTip] = useState<(typeof s.heatWeeks)[number][number] | null>(null);

  const months = MONTHS[lang];
  const fmtTime = (m: number) =>
    m >= 60 ? `${Math.floor(m / 60)}${t("stat.hourShort")} ${m % 60}m` : `${m}m`;
  const fmtDate = (ts: number) => {
    const d = new Date(ts);
    return lang === "id"
      ? `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
      : `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };
  const scriptLabel = (k: string, label: string) => (k === "other" || k === "custom" || k === "db" ? t(`stat.${k}`) : label);

  // label bulan di atas kolom minggu pertama tiap bulan
  const monthLabels = s.heatWeeks.map((wk, i) => {
    const m = new Date(wk[0].t).getMonth();
    const prev = i ? new Date(s.heatWeeks[i - 1][0].t).getMonth() : -1;
    return m === prev ? "" : months[m];
  });

  const weakGroups = weakTab === "all" ? s.weakGroups : s.weakGroups.filter((g) => g.k === weakTab);
  // total salah per asal (hanya yang punya halaman tujuan), terbanyak dulu
  const originSum: Record<string, number> = {};
  weakGroups.forEach((g) => Object.entries(g.origins).forEach(([o, v]) => (originSum[o] = (originSum[o] || 0) + v)));
  const originTotals = Object.entries(originSum)
    .filter(([o]) => o in ORIGIN_SCREEN)
    .sort((a, b) => b[1] - a[1]);

  return (
    <section id="screen-statistik" className="st">
      <header className="sx-head">
        <h1 className="st-title">{t("nav.statistik")}</h1>
        <p className="st-sub">{t("stat.sub")}</p>
      </header>

      <div className="sx-filters">
        <div className="sx-filter">
          <label>{t("stat.period")}</label>
          <div className="st-tabs">
            {RANGES.map((k) => (
              <button key={k} type="button" className={k === range ? "on" : ""} onClick={() => setRange(k)}>
                {t(RANGE_KEY[k])}
              </button>
            ))}
          </div>
        </div>
        <div className="sx-filter">
          <label>{t("stat.activity")}</label>
          <div className="st-tabs">
            {SRCS.map((k) => (
              <button key={k} type="button" className={k === src ? "on" : ""} onClick={() => setSrc(k)}>
                {t(`stat.src.${k}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {s.total === 0 && <div className="st-card st-empty">{t("stat.empty")}</div>}

      <div className="st-kpis">
        <div className="st-card st-kpi">
          <span className="sx-ico">🔥</span>
          <div>
            <small>{t("stat.streak")}</small>
            <div className="n">{t("stat.days", { n: s.streak })}</div>
            <div className="d">{t("stat.record", { n: s.best })}</div>
          </div>
        </div>
        <div className="st-card st-kpi">
          <span className="sx-ico">🎯</span>
          <div>
            <small>{t("stat.accuracy")}</small>
            <div className="n">{s.cur.acc}%</div>
            <Delta t={t} now={s.cur.acc} before={s.pre.acc} unit="%" show={s.hasPrev && s.pre.n > 0} />
          </div>
        </div>
        <div className="st-card st-kpi">
          <span className="sx-ico">⏱</span>
          <div>
            <small>{t("stat.studyTime")}</small>
            <div className="n">{fmtTime(s.cur.mins)}</div>
            <Delta t={t} now={s.cur.mins} before={s.pre.mins} unit="m" show={s.hasPrev && s.pre.n > 0} />
          </div>
        </div>
        <div className="st-card st-kpi">
          <span className="sx-ico">📝</span>
          <div>
            <small>{t("stat.answers")}</small>
            <div className="n">{n}</div>
            <div className="d">{t("stat.answersSub", { a: right, b: c.again })}</div>
          </div>
        </div>
      </div>

      <div className="st-grid">
        <div className="st-card">
          <h2>
            {t("stat.weekTitle")}
            <span>{t("stat.weekMeta", { t: fmtTime(weekTotal), a: weekAvg })}</span>
          </h2>
          <div className="st-bars">
            {s.week.map((w, i) => (
              <div className="st-bar" key={i}>
                <b>{w.v}m</b>
                <i className={w.today ? "today" : ""} style={{ height: `${Math.max((w.v / maxWeek) * 90, 2)}%`, opacity: w.v ? 1 : 0.35 }} />
                <em>{DAYS[lang][w.dow]}</em>
              </div>
            ))}
          </div>
        </div>
        <div className="st-card">
          <h2>
            {t("stat.resultTitle")} <span>{t("stat.totalAnswers", { n })}</span>
          </h2>
          <div className="sx-result">
            <div className="st-ring">
              <div
                style={{
                  background: n
                    ? `conic-gradient(var(--moss) 0 ${rightPct}%, var(--quiz-wrong) ${rightPct}% 100%)`
                    : "var(--paper)",
                }}
              >
                <span>
                  {s.cur.acc}%<small>{t("stat.accuracyCaps")}</small>
                </span>
              </div>
            </div>
            <div className="sx-result-rows">
              <div>
                <div className="sx-line">
                  <span><i style={{ background: "var(--moss)" }} />{t("stat.correct")}</span>
                  <b>{right}</b>
                  <em>{Math.round(rightPct)}%</em>
                </div>
                <div className="track"><i style={{ width: `${rightPct}%`, background: "var(--moss)" }} /></div>
              </div>
              <div>
                <div className="sx-line">
                  <span><i style={{ background: "var(--quiz-wrong)" }} />{t("stat.review")}</span>
                  <b>{c.again}</b>
                  <em>{n ? Math.round(pct(c.again)) : 0}%</em>
                </div>
                <div className="track"><i style={{ width: `${pct(c.again)}%`, background: "var(--quiz-wrong)" }} /></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="st-two">
        <div className="st-card">
          <h2>
            {t("stat.lessonProgress")} <span>Kotoba &amp; Kanji</span>
          </h2>
          <div className="st-tabs sx-wtabs">
            {(["all", "Kotoba", "Kanji"] as const).map((k) => (
              <button key={k} type="button" className={k === lessonTab ? "on" : ""} onClick={() => setLessonTab(k)}>
                {k === "all" ? t("stat.tab.all") : k}
              </button>
            ))}
          </div>
          <div className="st-scroll">
            {(["Kotoba", "Kanji"] as const).filter((g) => lessonTab === "all" || lessonTab === g).map((g) => {
              const rows = s.chapters.filter((ch) => ch.g === g);
              if (!rows.length) return null;
              return (
                <div key={g}>
                  <div className="st-group">{g}</div>
                  {rows.map((ch) => {
                    const [head, ...rest] = ch.n.split(" — ");
                    return (
                      <div className="st-row" key={`${g}:${ch.n}`}>
                        <div className="h">
                          <span className="sx-name">
                            <b>{head}</b>
                            {rest.length > 0 && <em> — {rest.join(" — ")}</em>}
                          </span>
                          <span className="sx-pct">{ch.p}%</span>
                        </div>
                        <div className="track"><i style={{ width: `${ch.p}%`, background: ch.p >= 90 ? "var(--moss)" : undefined }} /></div>
                        <div className="sx-meta">
                          {t("stat.cards", { a: ch.done, b: ch.total })}
                          {ch.answers > 0 && ` · ${t("stat.answersMeta", { n: ch.answers, t: fmtTime(ch.mins), acc: ch.acc })}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        <div className="st-card">
          <h2>
            {t("stat.weakTitle")} <span>{t("stat.weakSub")}</span>
          </h2>
          <div className="st-tabs sx-wtabs">
            {WEAK_TABS.map((tab) => (
              <button key={tab.k} type="button" className={tab.k === weakTab ? "on" : ""} onClick={() => setWeakTab(tab.k)}>
                {tab.k === "all" ? t("stat.tab.all") : tab.label}
              </button>
            ))}
          </div>
          {weakGroups.length ? (
            <div className="st-scroll sx-weak">
              {weakGroups.map((g) => (
                <div key={g.k} className="sx-wgroup">
                  <div className="sx-whead">
                    <span className="sx-wglyph">{GLYPH[g.k] ?? "他"}</span>
                    <b>{scriptLabel(g.k, g.label)}</b>
                    <em>{t("stat.wrongCount", { n: g.total })}</em>
                  </div>
                  <ol className="sx-wlist">
                    {g.items.slice(0, weakTab === "all" ? 5 : 8).map(([k, v, o], i) => (
                      <li key={k}>
                        <span className="sx-rk">{i + 1}</span>
                        <span className="sx-wq">{k}</span>
                        {o in ORIGIN_SCREEN && <span className={`sx-src ${o}`}>{t(`stat.o.${o}`)}</span>}
                        <small>{v}×</small>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          ) : (
            <p className="st-sub" style={{ margin: 0 }}>{t("stat.weakEmpty")}</p>
          )}
          {/* tombol per asal kesalahan, menuju halaman tempat soalnya dikerjakan */}
          {weakGroups.length > 0 && (
            <div className="sx-gos">
              {originTotals.length ? (
                originTotals.map(([o, v]) => (
                  <button key={o} type="button" className="sx-link" onClick={() => setScreen(ORIGIN_SCREEN[o])}>
                    {t("stat.goOrigin", { o: t(`stat.o.${o}`), n: v })}
                  </button>
                ))
              ) : (
                <button type="button" className="sx-link" onClick={() => setScreen("practice")}>
                  {t("stat.practiceMistakes")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="st-card" style={{ marginBottom: 16 }}>
        <h2>
          {t("stat.byLesson")} <span>{t("stat.totalAnswers", { n })}</span>
        </h2>
        <div className="sx-scripts">
          {s.byScript.map((r) => (
            <div className="st-row sx-script" key={r.k} style={r.n ? undefined : { opacity: 0.5 }}>
              <span className="sx-glyph">{GLYPH[r.k] ?? "他"}</span>
              <div>
                <div className="h">
                  {scriptLabel(r.k, r.label)}
                  <span>{t("stat.answersMeta", { n: r.n, t: fmtTime(r.mins), acc: r.acc })}</span>
                </div>
                <div className="track"><i style={{ width: `${r.acc}%`, background: r.n && r.acc >= 90 ? "var(--moss)" : undefined }} /></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="st-two sx-bottom">
        <RankJourney />
        <div className="st-card">
          <h2>{t("stat.best")}</h2>
          <div className="sx-best">
            <div><small>{t("stat.bestStreak")}</small><b>{t("stat.days", { n: s.bestPerf.streak })}</b></div>
            <div><small>{t("stat.bestAcc")}</small><b>{s.bestPerf.acc ? `${s.bestPerf.acc}%` : "–"}</b></div>
            <div><small>{t("stat.mostPracticed")}</small><b>{s.bestPerf.practiced ? scriptLabel(s.bestPerf.practicedKey, s.bestPerf.practiced) : "–"}</b></div>
            <div><small>{t("stat.mostAnswers")}</small><b>{s.bestPerf.answers ? t("stat.nAnswers", { n: s.bestPerf.answers }) : "–"}</b></div>
          </div>
        </div>
      </div>

      <div className="st-card sx-activity">
        <h2>
          {t("stat.heatTitle")}
          <span>{t("stat.activeDays", { n: s.activeDays })}</span>
        </h2>
        <div className="sx-heat-scroll" ref={heatRef}>
          <div className="sx-heat" style={{ "--cols": weekCols } as CSSProperties}>
            <div className="sx-heat-months">
              <i />
              {monthLabels.map((m, i) => (
                <span key={i}>{m}</span>
              ))}
            </div>
            <div className="sx-heat-body">
              <div className="sx-heat-days">
                {WEEK_ORDER.map((d) => (
                  <span key={d}>{DAYS[lang][d]}</span>
                ))}
              </div>
              <div className="sx-heat-cols">
                {s.heatWeeks.map((wk, ci) => (
                  <div key={ci}>
                    {wk.map((cell) => (
                      <i
                        key={cell.t}
                        className={cell.future ? "f" : cell.n ? `l${Math.max(1, Math.ceil((cell.n / maxHeat) * 4))}` : ""}
                        title={cell.future ? undefined : `${fmtDate(cell.t)} · ${t("stat.nAnswers", { n: cell.n })}`}
                        onMouseEnter={() => !cell.future && setTip(cell)}
                        onMouseLeave={() => setTip(null)}
                        onClick={() => !cell.future && setTip(cell)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="sx-heat-foot">
          <div className="sx-tip" aria-live="polite">
            {tip && (
              <>
                <b>{fmtDate(tip.t)}</b>
                <span>{t("stat.nAnswers", { n: tip.n })}</span>
                {tip.n > 0 && <span>{t("stat.accTip", { n: tip.acc })}</span>}
                {tip.n > 0 && <span>{t("stat.timeTip", { t: fmtTime(tip.mins) })}</span>}
              </>
            )}
          </div>
          <div className="sx-legend">
            {t("stat.less")}
            <i /><i className="l1" /><i className="l2" /><i className="l3" /><i className="l4" />
            {t("stat.more")}
          </div>
        </div>
      </div>
    </section>
  );
}
