import { useCallback, useEffect, useState } from "react";

/**
 * Tombol "back to top": muncul setelah halaman di-scroll lebih dari
 * `threshold` px (default 400, sama seperti versi vanilla).
 */
export function useScrollTop(threshold = 400) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(window.scrollY > threshold);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [threshold]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return { visible, scrollToTop };
}
