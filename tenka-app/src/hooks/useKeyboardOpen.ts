import { useEffect, useRef, useState } from "react";

const isEditable = (el: Element | null) =>
  !!el &&
  (el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    (el as HTMLElement).isContentEditable);

/**
 * true selama keyboard virtual HP terbuka (ada kolom ketik yang fokus &
 * tinggi area yang terlihat menyusut). Dipakai layar kuis mode ketik supaya
 * tampilannya bisa dipadatkan dan soalnya tidak terdorong keluar layar.
 */
export function useKeyboardOpen(minDelta = 120): boolean {
  const [open, setOpen] = useState(false);
  const baseRef = useRef(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    baseRef.current = Math.max(window.innerHeight, vv.height);

    const update = () => {
      const typing = isEditable(document.activeElement);
      // tinggi acuan = tinggi layar saat keyboard TIDAK terbuka
      if (!typing) baseRef.current = Math.max(window.innerHeight, vv.height);
      setOpen(typing && baseRef.current - vv.height > minDelta);
    };

    update();
    vv.addEventListener("resize", update);
    window.addEventListener("focusin", update);
    window.addEventListener("focusout", update);
    return () => {
      vv.removeEventListener("resize", update);
      window.removeEventListener("focusin", update);
      window.removeEventListener("focusout", update);
    };
  }, [minDelta]);

  return open;
}
