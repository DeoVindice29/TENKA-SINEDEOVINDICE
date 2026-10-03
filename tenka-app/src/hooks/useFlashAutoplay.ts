import { useCallback, useEffect, useState } from "react";

const KEY = "tenka:flashAutoplay";
const EVENT = "tenka:flashAutoplay-change";

function read(): boolean {
  try {
    const raw = localStorage.getItem(KEY);
    return raw === null ? true : raw === "1";
  } catch {
    return true;
  }
}

/**
 * Pengaturan "putar audio otomatis" di Flashcard (default: nyala).
 * Disimpan di localStorage dan disinkronkan antar komponen (Pengaturan &
 * layar belajar) lewat custom event, jadi keduanya selalu sama.
 */
export function useFlashAutoplay(): [boolean, (next: boolean) => void] {
  const [on, setOn] = useState<boolean>(read);

  useEffect(() => {
    const sync = () => setOn(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const set = useCallback((next: boolean) => {
    try {
      localStorage.setItem(KEY, next ? "1" : "0");
    } catch {
      // storage diblokir — tetap update state lewat event
    }
    setOn(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return [on, set];
}
