import { useEffect, type RefObject } from "react";

/**
 * Untuk strip horizontal (chip navigasi Learn) di desktop: roda mouse
 * menggeser strip ke samping + bisa di-drag pakai mouse. Di layar sentuh
 * strip sudah bisa di-scroll native, jadi hook ini cuma berpengaruh utk mouse.
 */
export function useDragScroll<T extends HTMLElement>(
  ref: RefObject<T | null>,
  active: boolean,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !active) return;

    let isDown = false;
    let dragged = false;
    let startX = 0;
    let startScroll = 0;

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    };
    const onMouseDown = (e: MouseEvent) => {
      isDown = true;
      dragged = false;
      startX = e.pageX;
      startScroll = el.scrollLeft;
      el.classList.add("dragging");
    };
    const onMouseUp = () => {
      isDown = false;
      el.classList.remove("dragging");
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      const dx = e.pageX - startX;
      if (Math.abs(dx) > 4) dragged = true;
      el.scrollLeft = startScroll - dx;
    };
    // habis drag, klik yang ikut terpicu di chip harus dibatalkan
    const onClickCapture = (e: MouseEvent) => {
      if (dragged) {
        e.stopPropagation();
        e.preventDefault();
        dragged = false;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("mousedown", onMouseDown);
    el.addEventListener("click", onClickCapture, true);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("mousedown", onMouseDown);
      el.removeEventListener("click", onClickCapture, true);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      el.classList.remove("dragging");
    };
  }, [ref, active]);
}
