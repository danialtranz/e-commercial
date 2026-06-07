"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchPublicActiveAdvertisement,
  publicActiveAdvertisementQueryKey,
  type ShopownerAdvertisementRow,
} from "@/services/shopowner/shopownerAdvertisementService";
import { resolveAdvertisementMedia } from "@/utils/advertisementMedia";

export type { ShopownerAdvertisementRow };

function ActiveVideoBubble({ src }: { src: string }) {
  return (
    <div
      className="pointer-events-auto fixed bottom-4 left-4 z-[95] w-[min(calc(100vw-2rem),320px)] overflow-hidden rounded-xl border border-slate-200/80 bg-black shadow-2xl shadow-black/40"
      role="region"
      aria-label="Quảng cáo video"
    >
      <video
        src={src}
        className="max-h-[220px] w-full object-contain"
        controls
        playsInline
        muted
        loop
        autoPlay
      />
    </div>
  );
}

function ActiveImageBanner({ src }: { src: string }) {
  return (
    <div
      className="relative z-[90] w-full border-b border-sky-100/80 bg-linear-to-r from-sky-50 via-white to-emerald-50"
      role="region"
      aria-label="Quảng cáo"
    >
      <div className="w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Quảng cáo"
          className="block h-[500px] w-full max-w-none"
        />
      </div>
    </div>
  );
}

/**
 * Hiển thị quảng cáo đang `active` trên mọi trang: ảnh = banner ngay dưới header, video = góc dưới trái.
 * Gắn trong `_app.tsx` (bên trong `MenuCompV2`, trước nội dung trang).
 */
export function ShopActiveAdvertisementHost() {
  const { data: row } = useQuery({
    queryKey: publicActiveAdvertisementQueryKey,
    queryFn: fetchPublicActiveAdvertisement,
    staleTime: 45_000,
    refetchOnWindowFocus: true,
  });

  if (!row?.image) {
    return null;
  }

  const { kind, src } = resolveAdvertisementMedia(row.image);
  if (!src) {
    return null;
  }

  if (kind === "video") {
    return <ActiveVideoBubble src={src} />;
  }

  return <ActiveImageBanner src={src} />;
}

/** Preview lớn (panel quản trị): cùng logic media với banner. */
export function AdvertisementLargePreview({
  row,
  className = "",
}: {
  row: Pick<ShopownerAdvertisementRow, "image"> | null | undefined;
  className?: string;
}) {
  if (!row?.image) {
    return (
      <div
        className={`flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500 ${className}`}
      >
        Chưa có quảng cáo đang kích hoạt.
      </div>
    );
  }

  const { kind, src } = resolveAdvertisementMedia(row.image);
  if (!src) {
    return (
      <div
        className={`flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500 ${className}`}
      >
        Không đọc được nội dung media.
      </div>
    );
  }

  if (kind === "video") {
    return (
      <div
        className={`overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-inner ${className}`}
      >
        <video
          src={src}
          className="max-h-[360px] w-full object-contain"
          controls
          playsInline
        />
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Xem trước quảng cáo"
        className="max-h-[360px] w-full object-contain"
      />
    </div>
  );
}

/** Ô preview nhỏ trong bảng. */
export function AdvertisementThumb({
  image,
  className = "",
}: {
  image: string;
  className?: string;
}) {
  const { kind, src } = resolveAdvertisementMedia(image);
  if (!src) {
    return <span className={`text-xs text-slate-400 ${className}`}>—</span>;
  }
  if (kind === "video") {
    return (
      <div
        className={`relative h-14 w-24 overflow-hidden rounded-lg bg-slate-900 ${className}`}
      >
        <video
          src={src}
          className="h-full w-full object-cover opacity-90"
          muted
          playsInline
        />
        <span className="absolute bottom-0.5 right-0.5 rounded bg-black/60 px-1 text-[9px] font-medium text-white">
          VIDEO
        </span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={`h-14 w-24 rounded-lg object-cover ${className}`}
    />
  );
}
