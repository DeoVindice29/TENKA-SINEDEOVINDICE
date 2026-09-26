import { useCallback, useEffect, useRef, useState } from "react";
import { useLang } from "@/i18n/LangContext";

const MAX_VIEWPORT = 260;
const OUTPUT = 512;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

type Offset = { x: number; y: number };

interface AvatarCropModalProps {
  /** Object URL (or data URL) of the freshly-picked image file. */
  imageSrc: string;
  onCancel: () => void;
  /** Called with a cropped, square JPEG blob once the user confirms. */
  onConfirm: (blob: Blob) => void;
  saving?: boolean;
}

export default function AvatarCropModal({
  imageSrc,
  onCancel,
  onConfirm,
  saving = false,
}: AvatarCropModalProps) {
  const { t } = useLang();
  const imgRef = useRef<HTMLImageElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    offX: number;
    offY: number;
    pointerId: number;
  } | null>(null);

  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  // Ukuran lingkaran crop yang KETEMPEL beneran di layar (bukan angka
  // tetap) — CSS-nya ngecil sendiri di layar pendek (lihat .crop-stage),
  // dan semua matematika crop di bawah ini ngikutin ukuran nyata itu biar
  // gak pernah butuh scroll tapi hasil crop-nya tetap presisi.
  const [viewport, setViewport] = useState(MAX_VIEWPORT);

  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setViewport(Math.round(w));
    });
    ro.observe(el);
    setViewport(el.offsetWidth || MAX_VIEWPORT);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  // Matikan scroll layar di belakang selagi modal crop ini kebuka.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const baseScale =
    natural.w && natural.h
      ? Math.max(viewport / natural.w, viewport / natural.h)
      : 0;
  const scale = baseScale * zoom;
  const dispW = natural.w * scale;
  const dispH = natural.h * scale;

  const clampOffset = useCallback(
    (ox: number, oy: number, w: number, h: number): Offset => {
      const minX = Math.min(0, viewport - w);
      const minY = Math.min(0, viewport - h);
      return {
        x: Math.max(minX, Math.min(0, ox)),
        y: Math.max(minY, Math.min(0, oy)),
      };
    },
    [viewport],
  );

  const handleImgLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    const w = img.naturalWidth || 1;
    const h = img.naturalHeight || 1;
    const bs = Math.max(viewport / w, viewport / h);
    setNatural({ w, h });
    setZoom(1);
    setOffset({ x: (viewport - w * bs) / 2, y: (viewport - h * bs) / 2 });
    setReady(true);
  };

  // Kalau lingkaran ikut ngecil/gede lagi (ukuran browser berubah selagi
  // modal ini kebuka), re-center biar gambar & offset-nya tetap pas sama
  // ukuran baru itu, gak keluar dari mask lingkarannya.
  useEffect(() => {
    if (!ready || !natural.w || !natural.h) return;
    const bs = Math.max(viewport / natural.w, viewport / natural.h);
    setZoom(1);
    setOffset({
      x: (viewport - natural.w * bs) / 2,
      y: (viewport - natural.h * bs) / 2,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewport]);

  const applyZoom = (nextZoomRaw: number) => {
    const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoomRaw));
    if (!natural.w || !natural.h) {
      setZoom(nextZoom);
      return;
    }
    const oldScale = baseScale * zoom;
    const newScale = baseScale * nextZoom;
    // Keep the point currently at the viewport center fixed while zooming.
    const cx = (viewport / 2 - offset.x) / oldScale;
    const cy = (viewport / 2 - offset.y) / oldScale;
    const newOffsetX = viewport / 2 - cx * newScale;
    const newOffsetY = viewport / 2 - cy * newScale;
    setOffset(
      clampOffset(
        newOffsetX,
        newOffsetY,
        natural.w * newScale,
        natural.h * newScale,
      ),
    );
    setZoom(nextZoom);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      offX: offset.x,
      offY: offset.y,
      pointerId: e.pointerId,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    setOffset(clampOffset(drag.offX + dx, drag.offY + dy, dispW, dispH));
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    applyZoom(zoom - e.deltaY * 0.0015);
  };

  const handleSave = () => {
    const img = imgRef.current;
    if (!img || !ready) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const sSize = viewport / scale;
    const sx = -offset.x / scale;
    const sy = -offset.y / scale;
    ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, OUTPUT, OUTPUT);
    canvas.toBlob(
      (blob) => {
        if (blob) onConfirm(blob);
      },
      "image/jpeg",
      0.92,
    );
  };

  return (
    <div className="modal-overlay open" aria-hidden="false">
      <div
        className="modal-panel crop-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="crop-modal-title"
      >
        <h2 id="crop-modal-title">{t("crop.title")}</h2>
        <p className="modal-text">{t("crop.hint")}</p>

        <div
          ref={stageRef}
          className="crop-stage"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={endDrag}
          onWheel={onWheel}
        >
          <img
            ref={imgRef}
            src={imageSrc}
            alt=""
            draggable={false}
            onLoad={handleImgLoad}
            className="crop-stage-img"
            style={{
              width: natural.w ? `${dispW}px` : undefined,
              height: natural.h ? `${dispH}px` : undefined,
              transform: `translate(${offset.x}px, ${offset.y}px)`,
              visibility: ready ? "visible" : "hidden",
            }}
          />
          <div className="crop-circle-mask" aria-hidden="true" />
        </div>

        <div className="crop-zoom-row">
          <span className="crop-zoom-icon crop-zoom-icon--sm" aria-hidden="true" />
          <input
            type="range"
            className="crop-zoom-slider"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            disabled={!ready}
            onChange={(e) => applyZoom(parseFloat(e.target.value))}
            aria-label={t("crop.zoom")}
          />
          <span className="crop-zoom-icon crop-zoom-icon--lg" aria-hidden="true" />
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="ghost"
            onClick={onCancel}
            disabled={saving}
          >
            {t("crop.cancel")}
          </button>
          <button
            type="button"
            className="primary"
            onClick={handleSave}
            disabled={!ready || saving}
          >
            {saving ? t("auth.saving") : t("crop.apply")}
          </button>
        </div>
      </div>
    </div>
  );
}
