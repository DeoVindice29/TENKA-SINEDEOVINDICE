import { useEffect, useId, useRef, useState } from "react";

export type ChartSeries = {
  key: string;
  name: string;
  color: string;
  values: number[];
  /** isi area di bawah garis (dipakai untuk seri utama) */
  area?: boolean;
};

const HEIGHT = 264;
const M = { top: 14, right: 18, bottom: 34, left: 38 };

/** Batas atas sumbu Y yang "bulat" + jarak antar garis bantu. */
function niceScale(max: number): { top: number; step: number } {
  if (max <= 4) return { top: 4, step: 1 };
  const rough = max / 4;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const f = rough / pow;
  const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow;
  return { top: Math.ceil(max / step) * step, step };
}

/** Kurva halus yang tidak melewati nilai antar titik (monotone cubic). */
function smoothPath(pts: [number, number][]): string {
  const n = pts.length;
  if (n === 0) return "";
  if (n === 1) return `M${pts[0][0]},${pts[0][1]}`;

  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1][0] - pts[i][0];
    m[i] = (pts[i + 1][1] - pts[i][1]) / dx[i];
  }
  const t: number[] = new Array(n);
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
      continue;
    }
    const a = t[i] / m[i];
    const b = t[i + 1] / m[i];
    const s = a * a + b * b;
    if (s > 9) {
      const tau = 3 / Math.sqrt(s);
      t[i] = tau * a * m[i];
      t[i + 1] = tau * b * m[i];
    }
  }

  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const h = dx[i] / 3;
    d += ` C${x0 + h},${y0 + t[i] * h} ${x1 - h},${y1 - t[i + 1] * h} ${x1},${y1}`;
  }
  return d;
}

export default function ActivityChart({
  labels,
  series,
  tickEvery,
  loading = false,
  emptyText,
}: {
  labels: string[];
  series: ChartSeries[];
  /** tampilkan label sumbu X tiap sekian titik */
  tickEvery: number;
  loading?: boolean;
  emptyText: string;
}) {
  const uid = useId().replace(/:/g, "");
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState<number | null>(null);

  // grafik digambar sebesar wadahnya supaya teks sumbu tetap tajam
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const apply = (w: number) => setWidth(Math.max(280, Math.floor(w)));
    apply(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([entry]) => apply(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = labels.length;
  const plotW = width - M.left - M.right;
  const plotH = HEIGHT - M.top - M.bottom;
  const dataMax = Math.max(0, ...series.flatMap((s) => s.values));
  const { top, step } = niceScale(dataMax);
  const isEmpty = dataMax === 0;

  const xAt = (i: number) => M.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yAt = (v: number) => M.top + plotH - (v / top) * plotH;

  const yTicks: number[] = [];
  for (let v = 0; v <= top; v += step) yTicks.push(v);
  const xTicks = labels.map((_, i) => i).filter((i) => i % tickEvery === 0);
  const showDots = n <= 31;

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    setHover(Math.min(n - 1, Math.max(0, Math.round(ratio * (n - 1)))));
  };

  const tipLeft = hover === null ? 0 : xAt(hover);
  const flip = tipLeft > width * 0.6;

  return (
    <div className={`adm-chart${loading ? " is-loading" : ""}`} ref={wrapRef}>
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={series.map((s) => s.name).join(", ")}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          {series
            .filter((s) => s.area)
            .map((s) => (
              <linearGradient id={`${uid}-${s.key}`} key={s.key} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.22" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            ))}
        </defs>

        {yTicks.map((v) => (
          <g key={v}>
            <line className="adm-chart-grid" x1={M.left} x2={width - M.right} y1={yAt(v)} y2={yAt(v)} />
            <text className="adm-chart-tick" x={M.left - 10} y={yAt(v)} textAnchor="end" dominantBaseline="middle">
              {v}
            </text>
          </g>
        ))}

        {xTicks.map((i) => (
          <g key={i}>
            <line className="adm-chart-grid adm-chart-grid--v" x1={xAt(i)} x2={xAt(i)} y1={M.top} y2={M.top + plotH} />
            <text className="adm-chart-tick" x={xAt(i)} y={HEIGHT - 10} textAnchor="middle">
              {labels[i]}
            </text>
          </g>
        ))}

        {series.map((s) => {
          const pts = s.values.map((v, i) => [xAt(i), yAt(v)] as [number, number]);
          const line = smoothPath(pts);
          return (
            <g key={s.key}>
              {s.area && pts.length > 1 && (
                <path
                  d={`${line} L${pts[pts.length - 1][0]},${M.top + plotH} L${pts[0][0]},${M.top + plotH} Z`}
                  fill={`url(#${uid}-${s.key})`}
                />
              )}
              <path d={line} fill="none" stroke={s.color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
              {showDots &&
                pts.map(([x, y], i) => (
                  <circle key={i} className="adm-chart-dot" cx={x} cy={y} r={hover === i ? 5 : 3.5} fill={s.color} />
                ))}
            </g>
          );
        })}

        {hover !== null && (
          <line className="adm-chart-guide" x1={xAt(hover)} x2={xAt(hover)} y1={M.top} y2={M.top + plotH} />
        )}

        {isEmpty && !loading && (
          <text className="adm-chart-empty" x={M.left + plotW / 2} y={M.top + plotH / 2} textAnchor="middle">
            {emptyText}
          </text>
        )}

        <rect
          x={M.left}
          y={M.top}
          width={plotW}
          height={plotH}
          fill="transparent"
          onPointerMove={onMove}
          onPointerDown={onMove}
        />
      </svg>

      {hover !== null && (
        <div
          className="adm-chart-tip"
          style={{ left: tipLeft, transform: `translateX(${flip ? "calc(-100% - 12px)" : "12px"})` }}
        >
          <strong>{labels[hover]}</strong>
          {series.map((s) => (
            <span key={s.key}>
              <i style={{ background: s.color }} />
              {s.name}: <b>{s.values[hover]}</b>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
