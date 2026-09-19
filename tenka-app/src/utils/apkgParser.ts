import JSZip from "jszip";
import initSqlJs, { type Database } from "sql.js";

export type ApkgCard = { front: string; back: string };

function stripAnkiHTML(html: string): string {
  if (!html) return "";
  let s = String(html);
  s = s.replace(/<style[\s\S]*?<\/style>/gi, "");
  s = s.replace(/<script[\s\S]*?<\/script>/gi, "");
  s = s.replace(/\[sound:[^\]]*\]/gi, "");
  s = s.replace(/<img[^>]*>/gi, " 🖼️ ");
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<\/(p|div|li|tr)>/gi, "\n");
  s = s.replace(/<[^>]+>/g, "");
  const ta = document.createElement("textarea");
  ta.innerHTML = s;
  s = ta.value;
  s = s
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return s;
}

function renderClozeFront(text: string): string {
  return text.replace(/\{\{c\d+::(.*?)(::.*?)?\}\}/g, "[...]");
}

function renderClozeBack(text: string): string {
  return text.replace(/\{\{c\d+::(.*?)(::.*?)?\}\}/g, "$1");
}

export async function parseApkgFile(file: File): Promise<{
  name: string;
  cards: ApkgCard[];
}> {
  // 1. Buka ZIP (.apkg)
  const zip = await JSZip.loadAsync(file);

  // 2. Cari database
  const dbEntry =
    zip.file("collection.anki21") ||
    zip.file("collection.anki2") ||
    zip.file("collection.anki21b");
  if (!dbEntry) {
    throw new Error(
      "This doesn't look like a valid .apkg file (no collection database found inside).",
    );
  }
  const dbBuf = await dbEntry.async("uint8array");

  // 3. Buka database pakai sql.js — file .wasm ada di /public/sql-wasm/
  const SQL = await initSqlJs({
    locateFile: () => "/sql-wasm/sql-wasm.wasm",
  });
  const db: Database = new SQL.Database(dbBuf);

  const cards: ApkgCard[] = [];
  try {
    const colRes = db.exec("SELECT models FROM col LIMIT 1");
    if (!colRes.length) {
      throw new Error("This .apkg file has no readable collection data.");
    }
    const models = JSON.parse(colRes[0].values[0][0] as string);

    const notesRes = db.exec("SELECT mid, flds FROM notes");
    const rows = notesRes.length ? notesRes[0].values : [];

    rows.forEach((row: unknown[]) => {
      const mid = row[0] as number;
      const flds = row[1] as string;
      const model = models[String(mid)];
      const fieldValues = String(flds).split("\x1f");
      const isCloze = model && /cloze/i.test(model.name || "");

      let front: string;
      let back: string;

      if (isCloze) {
        const raw = stripAnkiHTML(fieldValues[0] || "");
        front = renderClozeFront(raw);
        back = renderClozeBack(raw);
        const extra = stripAnkiHTML(fieldValues[1] || "");
        if (extra) back += "\n\n" + extra;
      } else {
        front = stripAnkiHTML(fieldValues[0] || "");
        back = fieldValues
          .slice(1)
          .map(stripAnkiHTML)
          .filter(Boolean)
          .join("\n\n");
        if (!back) back = front;
      }
      if (front.trim()) {
        cards.push({ front: front.trim(), back: (back || "").trim() });
      }
    });
  } finally {
    db.close();
  }

  if (!cards.length) {
    throw new Error("No readable cards were found in this deck.");
  }

  return { name: file.name.replace(/\.apkg$/i, ""), cards };
}
