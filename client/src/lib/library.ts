/**
 * 檔案上傳區（素材庫）共用 helper
 * 資料存在 localStorage，key=club-toolkit-library
 */

export type FileCategory = "poster" | "hostess_photo" | "planner" | "copy_sample";

export type LibraryItem = {
  id: string;
  category: FileCategory;
  name: string;
  kind: "image" | "text";
  data: string; // dataURL (image) 或 plain text
  size: number;
  createdAt: number;
};

const LS_KEY = "club-toolkit-library";

export function loadLibrary(): LibraryItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getTextSamples(category: FileCategory, limit = 3): { name: string; content: string }[] {
  return loadLibrary()
    .filter((i) => i.category === category && i.kind === "text")
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit)
    .map((i) => ({ name: i.name, content: i.data }));
}

export function getImageRefs(category: FileCategory, limit = 2): { data: string; mimeType: string; name: string }[] {
  return loadLibrary()
    .filter((i) => i.category === category && i.kind === "image")
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit)
    .map((i) => {
      const m = i.data.match(/^data:([^;]+);base64,(.+)$/);
      if (!m) return null;
      return { mimeType: m[1], data: m[2], name: i.name };
    })
    .filter((x): x is { data: string; mimeType: string; name: string } => x !== null);
}

export function getLibrarySummary(): {
  posters: number;
  hostessPhotos: number;
  planners: number;
  copySamples: number;
  totalBytes: number;
} {
  const items = loadLibrary();
  return {
    posters: items.filter((i) => i.category === "poster").length,
    hostessPhotos: items.filter((i) => i.category === "hostess_photo").length,
    planners: items.filter((i) => i.category === "planner").length,
    copySamples: items.filter((i) => i.category === "copy_sample").length,
    totalBytes: items.reduce((a, b) => a + b.size, 0),
  };
}
