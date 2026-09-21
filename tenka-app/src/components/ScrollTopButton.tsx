import { useLang } from "@/i18n/LangContext";
import { useScrollTop } from "@/hooks/useScrollTop";

type ScrollTopButtonProps = {
  id?: string;
  /** false = tombol disembunyikan walau halaman sudah di-scroll */
  enabled?: boolean;
};

export default function ScrollTopButton({
  id,
  enabled = true,
}: ScrollTopButtonProps) {
  const { t } = useLang();
  const { visible, scrollToTop } = useScrollTop(400);

  return (
    <button
      type="button"
      id={id}
      className={`learn-scrolltop ${enabled && visible ? "" : "hidden"}`}
      aria-label={t("aria.backToTop")}
      onClick={scrollToTop}
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 4h14" />
        <path d="M12 20V9" />
        <path d="M6 15l6-6 6 6" />
      </svg>
    </button>
  );
}
