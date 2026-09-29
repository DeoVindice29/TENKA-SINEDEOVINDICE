import { useEffect, useRef } from "react";
import { useLang } from "@/i18n/LangContext";
import { SCRIPTS } from "@/data/scripts";
import { useConquest } from "@/state/ConquestContext";
import { supportsSpeedrun } from "@/utils/speedrun";
import ConquestGuide, {
  type ConquestGuideStep,
} from "@/components/Conquest/ConquestGuide";
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

  const cancelRef = useRef(onCancel);
  useEffect(() => {
    cancelRef.current = onCancel;
  });

  // Esc menutup, dan fokus kembali ke kartu Conquest/Speedrun saat ditutup.
  useEffect(() => {
    if (!open) return;
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

  const script = SCRIPTS[scriptKey as keyof typeof SCRIPTS];
  if (!script) return null;

  const total = (script.data as Record<string, readonly unknown[]>).all.length;
  // Speedrun cuma untuk Hiragana & Katakana; Kotoba/Bunpō/Kanji tetap di
  // Penaklukan ala JLPT walaupun sudah takluk.
  const conquered = isConquered(scriptKey) && supportsSpeedrun(scriptKey);
  const isThreePhase = scriptKey === "hiragana" || scriptKey === "katakana";
  const isJlpt = isJlptScript(scriptKey);

  // Speedrun mode — sekarang dijelasin si chibi juga (sama kayak Penaklukan):
  // intro + satu bubble per aturan, tombol terakhir = "Siap?" → hitung mundur.
  if (conquered) {
    const SPEEDRUN_EXPRESSIONS = ["its-time", "startled", "nerd", "proud"];
    const speedrunRules = [
      t("speedrun.rule.timed"),
      t("speedrun.rule.mistakesCost"),
      t("speedrun.rule.autoNext"),
      t("speedrun.rule.recordSaved"),
    ];
    const speedrunSteps: ConquestGuideStep[] = [
      {
        expression: "pointing",
        html: t("speedrun.intro", { count: total, label: script.label }),
      },
      ...speedrunRules.map((r, i) => ({
        expression: SPEEDRUN_EXPRESSIONS[i % SPEEDRUN_EXPRESSIONS.length],
        html: r,
      })),
      { expression: "ready", html: t("speedrunGuide.ready") },
    ];

    return (
      <ConquestGuide
        key={`${scriptKey}-speedrun`}
        steps={speedrunSteps}
        confirmLabel={t("speedrun.confirm")}
        onCancel={onCancel}
        onConfirm={onConfirmSpeedrun}
      />
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

  const introText = isJlpt
    ? t(
        scriptKey === "kotoba"
          ? "conquestModal.jlptIntroKotoba"
          : scriptKey === "bunpo"
            ? "conquestModal.jlptIntroBunpo"
            : "conquestModal.jlptIntroKanji",
        {
          label: script.label,
          count: jlptQuestionsPerTier(scriptKey),
          total: jlptQuestionsPerTier(scriptKey) * jlptTierCount(scriptKey),
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
        });

  // Popup sebelum Penaklukan sekarang dijelasin si chibi (kayak intro): satu
  // bubble per aturan, ekspresinya ikut isi omongannya. Urutan aturan dari
  // `rules` di atas tetap sama — cuma ditampilin bertahap.
  const RULE_EXPRESSIONS = ["nerd", "startled", "afraid", "proud"];
  const guideSteps: ConquestGuideStep[] = [
    { expression: "pointing", html: introText },
    ...rules.map((r, i) => ({
      expression: RULE_EXPRESSIONS[i % RULE_EXPRESSIONS.length],
      html: r,
    })),
    { expression: "ready", html: t("conquestGuide.ready") },
  ];

  return (
    <ConquestGuide
      key={scriptKey}
      steps={guideSteps}
      onCancel={onCancel}
      onConfirm={onConfirmConquest}
    />
  );
}
