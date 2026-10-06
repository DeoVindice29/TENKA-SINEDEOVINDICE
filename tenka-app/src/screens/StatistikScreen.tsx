import { useMemo, useState } from "react";
import { computeStats, type Range, type SrcFilter } from "@/state/flashStats";

const RANGES: { k: Range; label: string }[] = [
  { k: "today", label: "Hari ini" },
  { k: "7d", label: "7 hari" },
  { k: "30d", label: "30 hari" },
  { k: "all", label: "Semua" },
];

const SRCS: { k: SrcFilter; label: string }[] = [
  { k: "all", label: "Semua" },
  { k: "flash", label: "Flashcard" },
  { k: "quiz", label: "Latihan Soal" },
  { k: "match", label: "Match" },
];

const fmtTime = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}j ${m % 60}m` : `${m}m`);

function Delta({ now, before, unit = "", show }: { now: number; before: number; unit?: string; show: boolean }) {
  if (!show) return <div className="d">&nbsp;</div>;
  const diff = now - before;
  if (!diff) return <div className="d">Sama seperti periode lalu</div>;
  return (
    <div className={`d ${diff > 0 ? "up" : "dn"}`}>
      {diff > 0 ? "▲" : "▼"} {Math.abs(diff)}
      {unit} dari periode lalu
    </div>
  );
}

export default function StatistikScreen() {
  const [range, setRange] = useState<Range>("7d");
  const [src, setSrc] = useState<SrcFilter>("all");
  const s = useMemo(() => computeStats(range, src), [range, src]);
  const { c, n } = s.cur;
  const pct = (v: number) => (n ? (v / n) * 100 : 0);
  const good = pct(c.good + c.easy);
  const hard = pct(c.hard);
  const maxWeek = Math.max(1, ...s.week.map((w) => w.v));
  const maxHeat = Math.max(1, ...s.heat);

  return (
    <section id="screen-statistik" className="st">
      <h1 className="st-title">Statistik</h1>
      <p className="st-sub">Dihitung dari semua aktivitas belajar: Flashcard, Latihan Soal, dan Match.</p>

      <div className="st-tabs">
        {RANGES.map((r) => (
          <button key={r.k} type="button" className={r.k === range ? "on" : ""} onClick={() => setRange(r.k)}>
            {r.label}
          </button>
        ))}
      </div>

      <div className="st-tabs st-tabs-src">
        {SRCS.map((r) => (
          <button key={r.k} type="button" className={r.k === src ? "on" : ""} onClick={() => setSrc(r.k)}>
            {r.label}
          </button>
        ))}
      </div>

      {s.total === 0 && (
        <div className="st-card st-empty">
          Belum ada riwayat untuk pilihan ini. Belajar dulu (Flashcard, Latihan Soal, atau Match), lalu statistiknya muncul di sini.
        </div>
      )}

      <div className="st-kpis">
        <div className="st-card st-kpi">
          <small>Streak</small>
          <div className="n">🔥 {s.streak} hari</div>
          <div className="d">Rekor: {s.best} hari</div>
        </div>
        <div className="st-card st-kpi">
          <small>Akurasi</small>
          <div className="n">{s.cur.acc}%</div>
          <Delta now={s.cur.acc} before={s.pre.acc} unit="%" show={s.hasPrev && s.pre.n > 0} />
        </div>
        <div className="st-card st-kpi">
          <small>Waktu belajar</small>
          <div className="n">{fmtTime(s.cur.mins)}</div>
          <Delta now={s.cur.mins} before={s.pre.mins} unit="m" show={s.hasPrev && s.pre.n > 0} />
        </div>
        <div className="st-card st-kpi">
          <small>Kartu dikuasai</small>
          <div className="n">{s.mastered}</div>
          <div className={`d ${s.dueNow ? "dn" : ""}`}>{s.dueNow} jatuh tempo</div>
        </div>
      </div>

      <div className="st-grid">
        <div className="st-card">
          <h2>Waktu belajar 7 hari terakhir <span>menit</span></h2>
          <div className="st-bars">
            {s.week.map((w, i) => (
              <div className="st-bar" key={i}>
                <b>{w.v}</b>
                <i className={w.today ? "today" : ""} style={{ height: `${Math.max((w.v / maxWeek) * 90, 2)}%`, opacity: w.v ? 1 : 0.35 }} />
                <em>{w.d}</em>
              </div>
            ))}
          </div>
        </div>
        <div className="st-card">
          <h2>Hasil jawaban <span>{n} jawaban</span></h2>
          <div className="st-ring">
            <div
              style={{
                background: n
                  ? `conic-gradient(var(--moss) 0 ${good}%, var(--gold) ${good}% ${good + hard}%, var(--quiz-wrong) ${good + hard}% 100%)`
                  : "var(--paper)",
              }}
            >
              <span>{s.cur.acc}%<small>INGAT</small></span>
            </div>
          </div>
          <div className="st-leg">
            <span><i style={{ background: "var(--moss)" }} />Benar/Bagus {c.good + c.easy}</span>
            <span><i style={{ background: "var(--gold)" }} />Sulit {c.hard}</span>
            <span><i style={{ background: "var(--quiz-wrong)" }} />Salah/Lagi {c.again}</span>
          </div>
        </div>
      </div>

      <div className="st-two">
        <div className="st-card">
          <h2>Kartu Flashcard yang sudah dipelajari <span>Kotoba</span></h2>
          {s.chapters.slice(0, 6).map((ch) => (
            <div className="st-row" key={ch.n}>
              <div className="h">{ch.n}<span>{ch.p}%</span></div>
              <div className="track"><i style={{ width: `${ch.p}%`, background: ch.p >= 90 ? "var(--moss)" : undefined }} /></div>
            </div>
          ))}
        </div>
        <div className="st-card">
          <h2>Yang sering salah <span>perlu diulang</span></h2>
          {s.weak.length ? (
            <div className="st-weak">
              {s.weak.map(([k, v]) => (
                <span key={k}>{k}<small>{v}×</small></span>
              ))}
            </div>
          ) : (
            <p className="st-sub" style={{ margin: 0 }}>Belum ada jawaban salah pada periode ini.</p>
          )}
        </div>
      </div>

      <div className="st-card">
        <h2>Aktivitas 15 minggu terakhir <span>lebih gelap = lebih banyak jawaban</span></h2>
        <div className="st-heat">
          {s.heat.map((v, i) => (
            <i key={i} className={v ? `l${Math.max(1, Math.ceil((v / maxHeat) * 4))}` : ""} title={`${v} jawaban`} />
          ))}
        </div>
      </div>
    </section>
  );
}
