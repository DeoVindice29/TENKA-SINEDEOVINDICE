import { useEffect, useRef } from "react";
import { useLang } from "@/i18n/LangContext";
import { SCRIPTS } from "@/data/scripts";
import { useConquest } from "@/state/ConquestContext";
import { supportsSpeedrun } from "@/utils/speedrun";
import {
  isJlptScript,
  JLPT_PASS_PERCENT,
  jlptTierCount,
  jlptQuestionsPerTier,
} from "@/data/jlptConquest";

type ConquestModalProps = {
  open: boolean;
  scriptKey: string;
  onCancel: () => void;
  onConfirmConquest: () => void;
  onConfirmSpeedrun: () => void;
};

export default function ConquestModal({
  open,
  scriptKey,
  onCancel,
  onConfirmConquest,
  onConfirmSpeedrun,
}: ConquestModalProps) {
  const { t } = useLang();
  const { isConquered } = useConquest();

  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef(onCancel);
  useEffect(() => {
    cancelRef.current = onCancel;
  });

  // fokus ke tombol konfirmasi saat modal dibuka, Esc menutup, dan fokus
  // kembali ke kartu Conquest/Speedrun saat ditutup.
  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancelRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.getElementById("btn-conquest")?.focus();
    };
  }, [open]);

  if (!open) return null;

  // klik area gelap di luar panel = batal
  const onBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onCancel();
  };

  const script = SCRIPTS[scriptKey as keyof typeof SCRIPTS];
  if (!script) return null;

  const total = (script.data as Record<string, readonly unknown[]>).all.length;
  // Speedrun cuma untuk Hiragana & Katakana; Kotoba/Bunpō/Kanji tetap di
  // Penaklukan ala JLPT walaupun sudah takluk.
  const conquered = isConquered(scriptKey) && supportsSpeedrun(scriptKey);
  const isThreePhase = scriptKey === "hiragana" || scriptKey === "katakana";
  const isJlpt = isJlptScript(scriptKey);

  // Speedrun mode
  if (conquered) {
    return (
      <div
        className="modal-overlay open"
        aria-hidden="false"
        onClick={onBackdrop}
      >
        <div className="modal-panel" role="alertdialog" aria-modal="true">
          <h2>{t("speedrun.modalTitleWithLabel", { label: script.label })}</h2>
          <p className="modal-text">
            {t("speedrun.intro", { count: total, label: script.label })}
          </p>
          <ul className="modal-rules">
            <li>{t("speedrun.rule.timed")}</li>
            <li>{t("speedrun.rule.mistakesCost")}</li>
            <li>{t("speedrun.rule.autoNext")}</li>
            <li>{t("speedrun.rule.recordSaved")}</li>
          </ul>
          <div className="modal-actions">
            <button className="ghost" type="button" onClick={onCancel}>
              {t("common.cancel")}
            </button>
            <button
              ref={confirmRef}
              className="primary"
              type="button"
              onClick={onConfirmSpeedrun}
            >
              {t("speedrun.confirm")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Conquest mode
  const bothConquered = isConquered("hiragana") && isConquered("katakana");
  const rules: string[] = [];
  if (isJlpt) {
    rules.push(t("conquestModal.rule.jlptChoices", { label: script.label }));
    rules.push(
      t("conquestModal.rule.jlptPassMark", { percent: JLPT_PASS_PERCENT }),
    );
    rules.push(t("conquestModal.rule.jlptFailRestart"));
  } else if (isThreePhase) {
    rules.push(t("conquestModal.rule.typeOnly"));
    rules.push(t("conquestModal.rule.oneWrongFails"));
    rules.push(t("conquestModal.rule.failRestartChapter"));
    rules.push(
      scriptKey === "katakana" && !bothConquered
        ? t("conquestModal.rule.becomeKnightSolo")
        : t("conquestModal.rule.becomeKnightBoth"),
    );
  } else {
    rules.push(t("conquestModal.rule.allAtOnce"));
    rules.push(t("conquestModal.rule.oneWrongFails"));
    rules.push(t("conquestModal.rule.failRestartFirst"));
  }

  return (
    <div
      className="modal-overlay open"
      aria-hidden="false"
      onClick={onBackdrop}
    >
      <div className="modal-panel" role="alertdialog" aria-modal="true">
        <h2>{t("conquest.modalTitleWithLabel", { label: script.label })}</h2>
        <p className="modal-text">
          {isJlpt
            ? t(
                scriptKey === "kotoba"
                  ? "conquestModal.jlptIntroKotoba"
                  : scriptKey === "bunpo"
                    ? "conquestModal.jlptIntroBunpo"
                    : "conquestModal.jlptIntroKanji",
                {
                  label: script.label,
                  count: jlptQuestionsPerTier(scriptKey),
                  total:
                    jlptQuestionsPerTier(scriptKey) * jlptTierCount(scriptKey),
                },
              )
            : isThreePhase
              ? t("conquestModal.threePhaseIntro", {
                  label: script.label,
                  count: total,
                })
              : t("conquestModal.singleIntro", {
                  count: total,
                  label: script.label,
                })}
        </p>
        <ul className="modal-rules">
          {rules.map((r, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: r }} />
          ))}
        </ul>
        <div className="modal-actions">
          <button className="ghost" type="button" onClick={onCancel}>
            {t("common.cancel")}
          </button>
          <button
            ref={confirmRef}
            className="primary danger"
            type="button"
            onClick={onConfirmConquest}
          >
            {t("conquestModal.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
