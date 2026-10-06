// Penyimpanan audio & gambar milik deck flashcard hasil import .apkg.
//
// Teks kartu tetap di localStorage (kecil), tapi file media (mp3 / jpg / ...)
// bisa puluhan MB — jauh di atas batas localStorage (~5 MB). Jadi file-filenya
// disimpan sebagai Blob di IndexedDB, dengan kunci `${deckId}/${namaFile}`.
// Semuanya tetap di browser ini; tidak ada yang diunggah ke mana pun.
//
// Di teks kartu, media ditandai `[sound:nama.mp3]` dan `[img:nama.jpg]`.

const DB_NAME = "tenka-flash-media";
const STORE = "media";

/** Penanda media di dalam teks kartu: [sound:file.mp3] / [img:file.jpg] */
export const MEDIA_MARKER_RE = /\[(sound|img):([^\]]+)\]/g;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available"));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const keyOf = (deckId: string, name: string) => `${deckId}/${name}`;

/** Simpan semua media satu deck dalam satu transaksi. false = gagal (mis. penuh). */
export async function saveDeckMedia(
  deckId: string,
  files: Map<string, Blob>,
): Promise<boolean> {
  if (files.size === 0) return true;
  try {
    const db = await openDb();
    return await new Promise<boolean>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      files.forEach((blob, name) => store.put(blob, keyOf(deckId, name)));
      tx.oncomplete = () => {
        db.close();
        resolve(true);
      };
      tx.onerror = tx.onabort = () => {
        db.close();
        resolve(false);
      };
    });
  } catch {
    return false;
  }
}

/** Hapus semua media milik satu deck (dipanggil saat deck dihapus). */
export async function deleteDeckMedia(deckId: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, "readwrite");
      const range = IDBKeyRange.bound(`${deckId}/`, `${deckId}/\uffff`);
      tx.objectStore(STORE).delete(range);
      tx.oncomplete = tx.onabort = tx.onerror = () => {
        db.close();
        resolve();
      };
    });
  } catch {
    // ignore
  }
  // lepas URL yang sudah dibuat untuk deck ini
  const prefix = `${deckId}/`;
  urlCache.forEach((url, key) => {
    if (key.startsWith(prefix)) {
      URL.revokeObjectURL(url);
      urlCache.delete(key);
    }
  });
}

/** Total ukuran semua audio & gambar deck impor di browser ini (byte). */
export async function getAllMediaBytes(): Promise<number> {
  try {
    const db = await openDb();
    return await new Promise<number>((resolve) => {
      let total = 0;
      const req = db
        .transaction(STORE, "readonly")
        .objectStore(STORE)
        .openCursor();
      req.onsuccess = () => {
        const cur = req.result;
        if (cur) {
          total += (cur.value as Blob | undefined)?.size ?? 0;
          cur.continue();
        } else {
          db.close();
          resolve(total);
        }
      };
      req.onerror = () => {
        db.close();
        resolve(total);
      };
    });
  } catch {
    return 0;
  }
}

/** Perkiraan pemakaian & kuota penyimpanan browser untuk situs ini. null = browser tidak mendukung. */
export async function getStorageEstimate(): Promise<{
  usage: number;
  quota: number;
} | null> {
  try {
    if (!navigator.storage?.estimate) return null;
    const { usage, quota } = await navigator.storage.estimate();
    if (!quota) return null;
    return { usage: usage ?? 0, quota };
  } catch {
    return null;
  }
}

async function getBlob(deckId: string, name: string): Promise<Blob | null> {
  try {
    const db = await openDb();
    return await new Promise<Blob | null>((resolve) => {
      const req = db
        .transaction(STORE, "readonly")
        .objectStore(STORE)
        .get(keyOf(deckId, name));
      req.onsuccess = () => {
        db.close();
        resolve((req.result as Blob | undefined) ?? null);
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

// blob URL di-cache supaya kartu yang sama tidak membuat URL baru terus-menerus
const urlCache = new Map<string, string>();

export async function getMediaUrl(
  deckId: string,
  name: string,
): Promise<string | null> {
  const key = keyOf(deckId, name);
  const cached = urlCache.get(key);
  if (cached) return cached;
  const blob = await getBlob(deckId, name);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urlCache.set(key, url);
  return url;
}

// ── Pemutar audio (satu suara pada satu waktu) ──────────────────────────────

let currentAudio: HTMLAudioElement | null = null;

/** Nama event window: `detail.name` = file yang sedang diputar, atau null. UI memakainya untuk animasi tombol 🔊. */
export const MEDIA_STATE_EVENT = "tenka-media-state";

function emitPlaying(name: string | null) {
  window.dispatchEvent(new CustomEvent(MEDIA_STATE_EVENT, { detail: { name } }));
}

export function stopMedia(): void {
  if (currentAudio) {
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio.pause();
    currentAudio = null;
    emitPlaying(null);
  }
}

/** Putar satu file audio deck. `onEnd` dipanggil saat selesai / gagal / dihentikan karena error. */
export async function playMedia(
  deckId: string,
  name: string,
  onEnd?: () => void,
): Promise<void> {
  stopMedia();
  const url = await getMediaUrl(deckId, name);
  if (!url) {
    onEnd?.();
    return;
  }
  const audio = new Audio(url);
  currentAudio = audio;
  const finish = () => {
    if (currentAudio === audio) {
      currentAudio = null;
      emitPlaying(null);
    }
    onEnd?.();
  };
  audio.onended = finish;
  audio.onerror = finish;
  try {
    await audio.play();
    if (currentAudio === audio) emitPlaying(name);
  } catch {
    finish();
  }
}

/** Item antrean audio kartu untuk file media: "media:<deckId>:<namaFile>". */
export const mediaQueueItem = (deckId: string, name: string) =>
  `media:${deckId}:${name}`;

export function parseMediaQueueItem(
  item: string,
): { deckId: string; name: string } | null {
  if (!item.startsWith("media:")) return null;
  const rest = item.slice("media:".length);
  const i = rest.indexOf(":");
  if (i <= 0) return null;
  return { deckId: rest.slice(0, i), name: rest.slice(i + 1) };
}
