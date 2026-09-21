import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLang } from "@/i18n/LangContext";

type Group = {
  id: string;
  chapterNum: number;
  sample?: string;
  title: { en: string; id: string };
  desc: { en: string; id: string };
  /**
   * Render-prop, BUKAN ReactNode. Isi panel Kotoba itu ratusan kartu; kalau
   * dikirim sebagai elemen jadi, JSX-nya tetap dibangun walau Chapter-nya
   * tertutup. Dengan fungsi, biayanya baru dibayar saat Chapter dibuka.
   */
  render: () => ReactNode;
};

type LearnAccordionProps = {
  groups: Group[];
  /**
   * Dari pencarian Learn: id grup yang punya hasil cocok. Tiap kali daftar ini
   * berubah, accordion dibuka persis di grup-grup itu (boleh lebih dari satu);
   * saat pencarian dikosongkan daftarnya [] jadi semua grup menutup lagi.
   */
  syncOpenIds?: string[];
  /** dipanggil tiap ada panel baru yang di-mount (filter DOM perlu diulang) */
  onMountedIdsChange?: (ids: string[]) => void;
};

export default function LearnAccordion({
  groups,
  syncOpenIds,
  onMountedIdsChange,
}: LearnAccordionProps) {
  const { lang, t } = useLang();
  const [openIds, setOpenIds] = useState<string[]>([]);
  // grup yang pernah dibuka tetap ter-mount, biar buka-tutup berikutnya instan
  const [mountedIds, setMountedIds] = useState<string[]>([]);

  const syncKey = syncOpenIds ? syncOpenIds.join("|") : null;
  const lastSyncKey = useRef<string | null>(null);
  useEffect(() => {
    if (syncOpenIds === undefined || syncKey === lastSyncKey.current) return;
    lastSyncKey.current = syncKey;
    setOpenIds(syncOpenIds);
    if (syncOpenIds.length) {
      setMountedIds((prev) => {
        const next = syncOpenIds.filter((id) => !prev.includes(id));
        return next.length ? [...prev, ...next] : prev;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncKey]);

  useEffect(() => {
    onMountedIdsChange?.(mountedIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mountedIds]);

  const tf = (entry: { en: string; id: string }): string =>
    entry[lang] || entry.en || entry.id || "";

  const toggle = (id: string, isOpen: boolean) => {
    // klik manual: cuma satu grup yang terbuka
    setOpenIds(isOpen ? [] : [id]);
    if (!isOpen) {
      setMountedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    }
  };

  return (
    <div className="learn-accordion">
      {groups.map((group) => {
        const isOpen = openIds.includes(group.id);
        const isMounted = mountedIds.includes(group.id);
        return (
          <div key={group.id} className="tier-group" data-group-id={group.id}>
            <button
              type="button"
              className={`tier-group-header ${isOpen ? "open" : ""}`}
              aria-expanded={isOpen}
              onClick={() => toggle(group.id, isOpen)}
            >
              <span className="tier-group-chapter">
                {t("levels.groupChapter", { n: group.chapterNum })}
              </span>
              {group.sample && (
                <span className="tier-group-kana">{group.sample}</span>
              )}
              <span className="tier-group-text">
                <span className="tier-group-title">{tf(group.title)}</span>
                <span className="tier-group-desc">{tf(group.desc)}</span>
              </span>
              <span className="tier-group-caret" aria-hidden="true" />
            </button>
            <div className={`tier-group-panel-wrap ${isOpen ? "open" : ""}`}>
              <div className="tier-group-panel learn-group-content">
                {isMounted ? group.render() : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
