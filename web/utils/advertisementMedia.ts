export type AdvertisementMediaKind = "image" | "video";

/**
 * `image` trong DB: data URL (ảnh) hoặc đường dẫn tĩnh `/videos/...` (video).
 */
export function resolveAdvertisementMedia(imageField: string): {
  kind: AdvertisementMediaKind;
  src: string;
} {
  const raw = (imageField || "").trim();
  if (!raw) {
    return { kind: "image", src: "" };
  }

  if (raw.startsWith("/videos/")) {
    const base = (process.env.NEXT_PUBLIC_API_SERVER || "").replace(/\/$/, "");
    return { kind: "video", src: `${base}${raw}` };
  }

  if (/^https?:\/\//i.test(raw)) {
    const lower = raw.split("?")[0].toLowerCase();
    const isVideo =
      /\.(mp4|webm|mov|m4v)(\s|$)/i.test(lower) || lower.includes("/videos/");
    return { kind: isVideo ? "video" : "image", src: raw };
  }

  if (raw.startsWith("data:image")) {
    return { kind: "image", src: raw };
  }

  if (raw.startsWith("data:video") || raw.startsWith("data:application")) {
    return { kind: "video", src: raw };
  }

  if (raw.startsWith("/")) {
    const base = (process.env.NEXT_PUBLIC_API_SERVER || "").replace(/\/$/, "");
    return { kind: "image", src: `${base}${raw}` };
  }

  return { kind: "image", src: raw };
}
