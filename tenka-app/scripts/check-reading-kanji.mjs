// Cek: kanji di cerita Reading tidak melewati batas level.
//   N5 : hanya kanji di src/data/kanjiN5.ts
//   N4 : kanji N5 app + daftar JLPT N5/N4 (di bawah)
// Jalankan: node scripts/check-reading-kanji.mjs
import { readFileSync } from "node:fs";

const kanjiN5 = readFileSync("src/data/kanjiN5.ts", "utf8");
const app = new Set([...kanjiN5.matchAll(/\[\s*"([一-鿿])"/g)].map((m) => m[1]));
const jlptN5 = "日一国十二人年大三四五六七八九百千万円本中長出生時行見月後前間上東下今金入学高子外来気小七山話女北午書先名川水半男西電校語土木聞食車何南毎白天母火右読友左休父雨";
const jlptN4 = "会同事自社発者地業方新場員立開手力問代明動京目通言理体田主題意不作用度強公持野以思家世多正安院心界教文元重近考画海売知道集別物使品計死特私始朝運終台広住真有口少町料工建空急止送切転研足究楽起着店病質待試族銀早映親験英医仕去味写字答夜音注帰古歌買悪図週室歩風紙黒花春赤青館屋色走秋夏習駅洋旅服夕借曜飲肉貸堂鳥飯勉冬昼茶弟牛魚兄犬妹姉漢都";
const N5 = app;
const N4 = new Set([...app, ...jlptN5, ...jlptN4]);

const src = readFileSync("src/data/readingStories.ts", "utf8");
const stories = src.split(/\n  \{\n    id: "/).slice(1);
const isKanji = (c) => c >= "一" && c <= "鿿";
let bad = 0;
for (const s of stories) {
  const id = s.split('"')[0];
  const level = s.match(/level: "(N\d)"/)[1];
  const allowed = level === "N5" ? N5 : N4;
  const body = s.split("tr: b(")[0]; // title + text saja
  const outside = body.replace(/\{[^{}]+\}/g, "").replace(/\/\/.*$/gm, "");
  const jpOnly = [...outside.matchAll(/"([^"]*)"/g)].map((m) => m[1]).filter((t) => /[぀-ヿ]/.test(t));
  const loose = jpOnly.join("").split("").filter(isKanji);
  const used = new Set();
  for (const m of body.matchAll(/\{([^{}|"]+)\|([^{}|"]+)\}/g))
    for (const c of m[1]) if (isKanji(c) && !allowed.has(c)) used.add(c);
  const prob = [...used].concat(loose.map((c) => `${c}(di luar {})`));
  if (prob.length) bad++;
  console.log(id.padEnd(14), level, prob.length ? "✗ " + prob.join(" ") : "✓");
}
process.exit(bad ? 1 : 0);
