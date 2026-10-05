import { useCallback, useEffect, useState } from "react";

/**
 * Tombol "kembali ke atas".
 * `containerSelector` dipakai di layar yang halamannya dikunci (mis. layar
 * kuis: body overflow hidden, yang di-scroll adalah `.stage`). Tanpa itu,
 * yang dipantau adalah scroll halaman (window) seperti biasa.
 */
export function useScrollTop(threshold = 400, containerSelector?: string) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = containerSelector
      ? document.querySelector<HTMLElement>(containerSelector)
      : null;
    const pos = () => (el ? el.scrollTop : window.scrollY);
    const update = () => setVisible(pos() > threshold);
    update();
    const target: HTMLElement | Window = el ?? window;
    target.addEventListener("scroll", update, { passive: true });
    return () => target.removeEventListener("scroll", update);
  }, [threshold, containerSelector]);

  const scrollToTop = useCallback(() => {
    const el = containerSelector
      ? document.querySelector<HTMLElement>(containerSelector)
      : null;
    if (el) el.scrollTo({ top: 0, behavior: "smooth" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  }, [containerSelector]);

  return { visible, scrollToTop };
}
