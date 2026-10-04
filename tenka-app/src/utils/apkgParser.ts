import JSZip from "jszip";
import initSqlJs, { type Database } from "sql.js";
import { decompress } from "fzstd";

export type ApkgCard = { front: string; back: string };

/** Tahap proses import — dipakai UI untuk menampilkan progres. */
export type ApkgStage = "zip" | "cards" | "media";

export type ApkgStats = {
  /** jumlah file audio / gambar yang ikut terbawa */
  audio: number;
  images: number;
  /** penanda media di kartu yang filenya tidak ada di dalam .apkg */
  missing: number;
  /** true = export Anki format baru (zstd), false = format lama */
  modern: boolean;
};

// Jenis file media yang dipakai kartu → MIME type (dibutuhkan <audio>/<img>)
const MIME_BY_EXT: Record<string, string> = {
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  oga: "audio/ogg",
  opus: "audio/ogg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  aac: "audio/aac",
  flac: "audio/flac",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  avif: "image/avif",
};

const MARKER_RE = /\[(sound|img):([^\]]+)\]/g;

// ── Format baru Anki (.anki21b) ─────────────────────────────────────────────
// Export "latest" Anki memampatkan database, daftar media, dan tiap file media
// dengan zstd; daftar media-nya protobuf (bukan JSON lagi).

const isZstd = (b: Uint8Array) =>
  b.length > 4 && b[0] === 0x28 && b[1] === 0xb5 && b[2] === 0x2f && b[3] === 0xfd;

function unzstd(b: Uint8Array): Uint8Array {
  try {
    return decompress(b);
  } catch {
    throw new Error(
      "Couldn't unpack this deck (compressed data is damaged or unsupported). Try exporting again from Anki.",
    );
  }
}

// Pembaca protobuf minimal: cukup untuk MediaEntries { repeated MediaEntry = 1 }
// dengan MediaEntry { string name = 1; uint32 size = 2; bytes sha1 = 3; }.
function readVarint(b: Uint8Array, pos: number): [number, number] {
  let result = 0;
  let shift = 0;
  while (pos < b.length) {
    const byte = b[pos++];
    result += (byte & 0x7f) * 2 ** shift;
    if (!(byte & 0x80)) return [result, pos];
    shift += 7;
  }
  throw new Error("bad varint");
}

function forEachField(
  b: Uint8Array,
  fn: (field: number, value: number | Uint8Array) => void,
) {
  let pos = 0;
  while (pos < b.length) {
    let tag: number;
    [tag, pos] = readVarint(b, pos);
    const field = Math.floor(tag / 8);
    const wire = tag % 8;
    if (wire === 0) {
      let v: number;
      [v, pos] = readVarint(b, pos);
      fn(field, v);
    } else if (wire === 2) {
      let len: number;
      [len, pos] = readVarint(b, pos);
      fn(field, b.subarray(pos, pos + len));
      pos += len;
    } else if (wire === 1) {
      pos += 8;
    } else if (wire === 5) {
      pos += 4;
    } else {
      throw new Error("bad wire type");
    }
  }
}

/** Daftar media format baru: urutan entri = nomor file di dalam ZIP ("0", "1", …). */
function parseMediaProtobuf(b: Uint8Array): Map<string, string> {
  const out = new Map<string, string>();
  const dec = new TextDecoder();
  let index = 0;
  forEachField(b, (field, value) => {
    if (field !== 1 || typeof value === "number") return;
    let name = "";
    forEachField(value, (f, v) => {
      if (f === 1 && typeof v !== "number") name = dec.decode(v);
    });
    if (name) out.set(name, String(index));
    index++;
  });
  return out;
}

function stripAnkiHTML(html: string): string {
  if (!html) return "";
  let s = String(html);
  s = s.replace(/<style[\s\S]*?<\/style>/gi, "");
  s = s.replace(/<script[\s\S]*?<\/script>/gi, "");
  // audio & gambar dibiarkan sebagai penanda — file aslinya diambil terpisah
  // dari dalam ZIP (lihat bagian media di parseApkgFile)
  s = s.replace(/\[sound:([^\]]*)\]/gi, (_m, f) => ` [sound:${f.trim()}] `);
  s = s.replace(/<img\b[^>]*?\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>/gi, (_m, a, b, c) => ` [img:${(a ?? b ?? c ?? "").trim()}] `);
  s = s.replace(/<img[^>]*>/gi, "");
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

// Nama tipe catatan (note type) per id. Format lama: ada di kolom col.models
// (JSON). Format baru: kolom itu kosong, namanya ada di tabel notetypes.
// "NOT INDEXED" wajib: indeks nama memakai collation "unicase" milik Anki yang
// tidak dikenal sql.js, jadi query lewat indeks itu akan error.
function readModelNames(db: Database): Map<string, string> {
  const names = new Map<string, string>();
  try {
    const res = db.exec("SELECT models FROM col LIMIT 1");
    const raw = res.length ? String(res[0].values[0][0] ?? "") : "";
    if (raw.trim()) {
      const models = JSON.parse(raw) as Record<string, { name?: string }>;
      Object.entries(models).forEach(([id, m]) => names.set(id, m?.name ?? ""));
    }
  } catch {
    // lanjut ke tabel notetypes
  }
  if (names.size === 0) {
    try {
      const res = db.exec("SELECT id, name FROM notetypes NOT INDEXED");
      (res.length ? res[0].values : []).forEach((r) =>
        names.set(String(r[0]), String(r[1] ?? "")),
      );
    } catch {
      // tidak ada info tipe catatan → kloze tetap dikenali dari isi kartunya
    }
  }
  return names;
}

export async function parseApkgFile(
  file: File,
  onStage?: (stage: ApkgStage) => void,
): Promise<{
  name: string;
  cards: ApkgCard[];
  /** file audio/gambar yang benar-benar dipakai kartu (nama file → isi) */
  media: Map<string, Blob>;
  stats: ApkgStats;
}> {
  // 1. Buka ZIP (.apkg)
  onStage?.("zip");
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch {
    throw new Error("This file isn't a valid .apkg (it can't be opened as a ZIP).");
  }

  // 2. Cari database (format baru .anki21b didahulukan kalau ada)
  const dbEntry =
    zip.file("collection.anki21b") ||
    zip.file("collection.anki21") ||
    zip.file("collection.anki2");
  if (!dbEntry) {
    throw new Error(
      "This doesn't look like a valid .apkg file (no collection database found inside).",
    );
  }
  let dbBuf = await dbEntry.async("uint8array");
  const modern = isZstd(dbBuf);
  if (modern) dbBuf = unzstd(dbBuf);

  // 3. Buka database pakai sql.js — file .wasm ada di /public/sql-wasm/
  onStage?.("cards");
  const SQL = await initSqlJs({
    locateFile: () => `${import.meta.env.BASE_URL}sql-wasm/sql-wasm.wasm`,
  });
  const db: Database = new SQL.Database(dbBuf);

  const cards: ApkgCard[] = [];
  try {
    const modelNames = readModelNames(db);

    const notesRes = db.exec("SELECT mid, flds FROM notes NOT INDEXED ORDER BY id");
    const rows = notesRes.length ? notesRes[0].values : [];

    rows.forEach((row: unknown[]) => {
      const mid = String(row[0]);
      const flds = row[1] as string;
      const fieldValues = String(flds).split("\x1f");
      const isCloze =
        /cloze/i.test(modelNames.get(mid) ?? "") ||
        /\{\{c\d+::/.test(fieldValues[0] || "");

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

  // Export format baru dengan database "pengganti": isinya cuma satu catatan
  // yang minta Anki di-update — artinya data aslinya tidak ada di file ini.
  if (
    cards.length === 1 &&
    /update to the latest anki/i.test(cards[0].front + cards[0].back)
  ) {
    throw new Error(
      "This deck was exported in a format the app can't read. In Anki, export again and tick “Support older Anki versions”.",
    );
  }
  if (!cards.length) {
    throw new Error("No readable cards were found in this deck.");
  }

  onStage?.("media");
  const { media, audio, images, missing } = await extractMedia(zip, cards);

  return {
    name: file.name.replace(/\.apkg$/i, ""),
    cards,
    media,
    stats: { audio, images, missing, modern },
  };
}

// Ambil file media yang dipakai kartu dari dalam ZIP. Format lama: file `media`
// adalah JSON {"0": "suara.mp3", "1": "gambar.jpg"}. Format baru: protobuf yang
// dimampatkan zstd. Di kedua format isi aslinya ada di entri ZIP bernama "0",
// "1", dst (format baru: tiap file juga dimampatkan zstd). Penanda di kartu
// ditulis ulang supaya memakai nama file yang tepat; penanda tanpa file dibuang
// dan dihitung sebagai "missing".
async function extractMedia(
  zip: JSZip,
  cards: ApkgCard[],
): Promise<{
  media: Map<string, Blob>;
  audio: number;
  images: number;
  missing: number;
}> {
  const media = new Map<string, Blob>();
  const kinds = new Map<string, string>();
  const missingNames = new Set<string>();

  let nameToIndex = new Map<string, string>();
  const mapEntry = zip.file("media");
  if (mapEntry) {
    try {
      const bytes = await mapEntry.async("uint8array");
      if (isZstd(bytes)) {
        nameToIndex = parseMediaProtobuf(unzstd(bytes));
      } else {
        const text = new TextDecoder().decode(bytes).trim();
        if (text.startsWith("{")) {
          const json = JSON.parse(text) as Record<string, string>;
          Object.entries(json).forEach(([idx, fname]) => {
            if (typeof fname === "string") nameToIndex.set(fname, idx);
          });
        } else if (bytes.length > 0) {
          nameToIndex = parseMediaProtobuf(bytes);
        }
      }
    } catch {
      // daftar media tidak terbaca → semua penanda dibuang di bawah
      nameToIndex = new Map();
    }
  }

  // cocokkan nama di kartu dengan nama di ZIP (src gambar bisa di-URL-encode)
  const resolve = (raw: string): string | null => {
    if (nameToIndex.has(raw)) return raw;
    try {
      const dec = decodeURIComponent(raw);
      if (nameToIndex.has(dec)) return dec;
    } catch {
      // abaikan
    }
    return null;
  };

  const rewrite = (text: string) =>
    text
      .replace(MARKER_RE, (_m, kind: string, raw: string) => {
        const found = resolve(raw.trim());
        if (!found) {
          missingNames.add(raw.trim());
          return "";
        }
        kinds.set(found, kind);
        return `[${kind}:${found}]`;
      })
      .replace(/[ \t]+\n/g, "\n")
      .trim();

  cards.forEach((c) => {
    c.front = rewrite(c.front);
    c.back = rewrite(c.back);
  });

  for (const fname of kinds.keys()) {
    const idx = nameToIndex.get(fname);
    const entry = idx !== undefined ? zip.file(idx) : null;
    if (!entry) {
      missingNames.add(fname);
      continue;
    }
    let data: Uint8Array = new Uint8Array(await entry.async("arraybuffer"));
    if (isZstd(data)) data = unzstd(data);
    const ext = fname.split(".").pop()?.toLowerCase() ?? "";
    media.set(
      fname,
      new Blob([data as unknown as BlobPart], { type: MIME_BY_EXT[ext] ?? "" }),
    );
  }

  // penanda yang filenya ternyata tidak bisa diambil ikut dibuang
  if (media.size < kinds.size) {
    const keep = (text: string) =>
      text
        .replace(MARKER_RE, (m, _k: string, name: string) =>
          media.has(name) ? m : "",
        )
        .replace(/[ \t]+\n/g, "\n")
        .trim();
    cards.forEach((c) => {
      c.front = keep(c.front);
      c.back = keep(c.back);
    });
  }

  let audio = 0;
  let images = 0;
  media.forEach((_b, name) => {
    if (kinds.get(name) === "sound") audio++;
    else images++;
  });

  return { media, audio, images, missing: missingNames.size };
}
