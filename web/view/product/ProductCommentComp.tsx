"use client";

import {
  useCreateShopownerProductComment,
  useListShopownerProductComments,
} from "@/hooks/shopowner/useShopOwnerHook";
import type { ShopownerProductCommentRow } from "@/services/shopowner/shopownerCommentService";
import { getToken } from "@/utils/tokenManager";
import { MetaLabel } from "@/view/cart/cartMeta";
import Link from "next/link";
import React, { useCallback, useMemo, useState } from "react";
import {
  ArrowDownUp,
  BadgeCheck,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  LogIn,
  MessageSquare,
  MessageSquarePlus,
  Send,
  Star,
  User,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";

const COMMENTS_PAGE_SIZE = 5;

type StarSortOrder = "default" | "desc" | "asc";

function commentStarValue(row: ShopownerProductCommentRow): number | null {
  const s = row.star;
  if (s == null || !Number.isFinite(s) || s < 1 || s > 5) return null;
  return Math.round(s);
}

function sortCommentsByStar(
  rows: ShopownerProductCommentRow[],
  order: StarSortOrder
): ShopownerProductCommentRow[] {
  if (order === "default" || rows.length <= 1) return rows;

  const indexed = rows.map((row, index) => ({ row, index }));
  indexed.sort((a, b) => {
    const sa = commentStarValue(a.row);
    const sb = commentStarValue(b.row);
    const aMissing = sa == null;
    const bMissing = sb == null;
    if (aMissing && bMissing) return a.index - b.index;
    if (aMissing) return 1;
    if (bMissing) return -1;
    if (sa !== sb) return order === "desc" ? sb - sa : sa - sb;
    return a.index - b.index;
  });
  return indexed.map((x) => x.row);
}

function apiOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_API_SERVER?.trim() || "";
  return raw.replace(/\/$/, "");
}

/** Ảnh: data URL base64; video: đường dẫn tĩnh `/video_comment/...` trên API server */
function resolveCommentFileUrl(file: string | null | undefined): string | null {
  if (!file?.trim()) return null;
  const f = file.trim();
  if (f.startsWith("data:")) return f;
  if (f.startsWith("http://") || f.startsWith("https://")) return f;
  const origin = apiOrigin();
  if (!origin) return f.startsWith("/") ? f : `/${f}`;
  return `${origin}${f.startsWith("/") ? f : `/${f}`}`;
}

function isCommentVideo(
  file: string | null | undefined,
  fileType: string | null | undefined
): boolean {
  if (fileType?.toLowerCase().startsWith("video/")) return true;
  if (file?.includes("/video_comment/")) return true;
  return false;
}

function CommentStars({ value }: { value: number }) {
  const n = Math.min(5, Math.max(1, Math.round(value)));
  return (
    <span className="inline-flex gap-0.5" aria-label={`${n} sao`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "size-4",
            i < n
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-slate-300"
          )}
          aria-hidden
        />
      ))}
    </span>
  );
}

function StarPicker({
  value,
  onChange,
  disabled,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="mt-2 flex flex-wrap items-center gap-1"
      role="group"
      aria-label="Chọn số sao"
    >
      {Array.from({ length: 5 }, (_, i) => {
        const star = i + 1;
        const filled = value != null && star <= value;
        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onChange(value === star ? null : star)}
            className="rounded-lg p-1 transition hover:scale-110 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={`${star} sao`}
            aria-pressed={value === star}
          >
            <Star
              className={cn(
                "size-6",
                filled
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-slate-300"
              )}
              aria-hidden
            />
          </button>
        );
      })}
      {value != null ? (
        <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-amber-700">
          <Star
            className="size-3.5 fill-amber-400 text-amber-400"
            aria-hidden
          />
          {value}/5
        </span>
      ) : (
        <span className="ml-2 text-xs text-slate-400">Chưa chọn</span>
      )}
    </div>
  );
}

function formatCommentDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CommentMedia({
  file,
  fileType,
}: {
  file: string | null | undefined;
  fileType: string | null | undefined;
}) {
  const src = resolveCommentFileUrl(file);
  if (!src) return null;
  const video = isCommentVideo(file, fileType);

  return (
    <div className="mt-3">
      <p className="mb-1.5 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {video ? (
          <Video className="size-3.5 text-emerald-600" aria-hidden />
        ) : (
          <ImagePlus className="size-3.5 text-emerald-600" aria-hidden />
        )}
        {video ? "Video đính kèm" : "Ảnh đính kèm"}
      </p>
      {video ? (
        <video
          src={src}
          controls
          className="max-h-64 w-full rounded-xl border border-slate-200 bg-black object-contain"
          preload="metadata"
        >
          Trình duyệt không hỗ trợ video.
        </video>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="Đính kèm bình luận"
          className="max-h-64 w-full rounded-xl border border-slate-200 object-contain"
        />
      )}
    </div>
  );
}

const CommentItem: React.FC<{ row: ShopownerProductCommentRow }> = ({
  row,
}) => {
  const u = row.user;
  const name = u?.name?.trim() || u?.email?.trim() || "Người dùng";
  const avatar = u?.avatar?.trim();

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex gap-3">
        <div className="size-11 shrink-0 overflow-hidden rounded-full border border-slate-100 bg-slate-100">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-slate-400">
              <User className="size-5" aria-hidden />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900">
              <User className="size-3.5 text-emerald-600" aria-hidden />
              {name}
            </span>
            {row.isBought ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-700">
                <BadgeCheck className="size-3" aria-hidden />
                Đã mua
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
              <CalendarClock className="size-3 shrink-0" aria-hidden />
              {formatCommentDate(row.createdAt)}
            </span>
          </div>
          {row.star != null && row.star >= 1 && row.star <= 5 ? (
            <div className="mt-2 inline-flex items-center gap-1.5">
              <MetaLabel
                icon={Star}
                label="Đánh giá"
                className="normal-case tracking-normal text-slate-500"
              />
              <CommentStars value={row.star} />
            </div>
          ) : null}
          {row.comment ? (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {row.comment}
            </p>
          ) : null}
          {row.file ? (
            <CommentMedia file={row.file} fileType={row.fileType} />
          ) : null}
        </div>
      </div>
    </article>
  );
};

export type ProductCommentCompProps = {
  productId: string;
};

const ProductCommentComp: React.FC<ProductCommentCompProps> = ({
  productId,
}) => {
  const trimmedId = productId.trim();
  const [page, setPage] = useState(1);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [star, setStar] = useState<number | null>(null);
  const [starSort, setStarSort] = useState<StarSortOrder>("default");
  const hasToken = Boolean(getToken());

  const { data, loading } = useListShopownerProductComments(
    trimmedId && hasToken
      ? {
          product_id: trimmedId,
          page,
          page_size: COMMENTS_PAGE_SIZE,
        }
      : undefined
  );

  const { createProductComment, loading: submitting } =
    useCreateShopownerProductComment();

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const sortedItems = useMemo(
    () => sortCommentsByStar(items, starSort),
    [items, starSort]
  );
  const pagination = data?.pagination;
  const total = pagination?.total ?? 0;
  const totalPages = useMemo(() => {
    if (total <= 0) return 1;
    return Math.ceil(total / COMMENTS_PAGE_SIZE);
  }, [total]);
  const pageLabel = Math.min(Math.max(1, page), totalPages);

  const resetForm = useCallback(() => {
    setText("");
    setFile(null);
    setStar(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const comment = text.trim();
    if (!comment && !file && star == null) return;

    const result = await createProductComment({
      product_id: trimmedId,
      comment: comment || undefined,
      file: file ?? undefined,
      star: star ?? undefined,
    });

    if (result.ok) {
      resetForm();
      setPage(1);
    }
  };

  if (!trimmedId) return null;

  return (
    <section className="mt-12 border-t border-slate-200 pt-10">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <MessageSquare className="size-5" strokeWidth={2} aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 md:text-xl">
            Bình luận
          </h2>
          <p className="mt-1 flex items-start gap-1.5 text-sm text-slate-600">
            <MessageSquarePlus
              className="mt-0.5 size-4 shrink-0 text-emerald-600"
              aria-hidden
            />
            Mỗi bình luận có thể gồm đánh giá sao, chữ và/hoặc một ảnh hoặc
            video đính kèm.
          </p>
        </div>
      </div>

      {!hasToken ? (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-amber-200 bg-amber-50/70 px-6 py-8 text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <LogIn className="size-6" aria-hidden />
          </div>
          <p className="font-medium text-slate-800">
            Đăng nhập để xem và đăng bình luận
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Danh sách và gửi bình luận cần tài khoản đã xác thực.
          </p>
          <Link
            href="/user-login"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <LogIn className="size-4" aria-hidden />
            Đăng nhập
          </Link>
        </div>
      ) : (
        <>
          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5"
          >
            <p className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-800">
              <MessageSquarePlus
                className="size-4 text-emerald-600"
                aria-hidden
              />
              Viết bình luận mới
            </p>

            <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3">
              <MetaLabel icon={Star} label="Đánh giá sao (tùy chọn, 1–5)" />
              <StarPicker
                value={star}
                onChange={setStar}
                disabled={submitting}
              />
            </div>

            <label className="mt-3 block rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3">
              <MetaLabel icon={MessageSquare} label="Nội dung (tùy chọn)" />
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Chia sẻ trải nghiệm về sản phẩm…"
                disabled={submitting}
              />
            </label>

            <label className="mt-3 block rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3">
              <MetaLabel icon={ImagePlus} label="Ảnh hoặc video (tùy chọn)" />
              <input
                type="file"
                accept="image/*,video/*"
                className="mt-2 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-emerald-800 hover:file:bg-emerald-100"
                disabled={submitting}
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setFile(f);
                }}
              />
            </label>

            {file ? (
              <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                {file.type.startsWith("video/") ? (
                  <Video className="size-3.5 text-emerald-600" aria-hidden />
                ) : (
                  <ImagePlus
                    className="size-3.5 text-emerald-600"
                    aria-hidden
                  />
                )}
                Đã chọn: <span className="font-medium">{file.name}</span>
              </p>
            ) : null}

            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={
                  submitting ||
                  (!text.trim() && !file && star == null) ||
                  !trimmedId
                }
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Đang gửi…
                  </>
                ) : (
                  <>
                    <Send className="size-4" aria-hidden />
                    Gửi bình luận
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
              <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                <MessageSquare
                  className="size-4 text-emerald-600"
                  aria-hidden
                />
                Đã có {total} bình luận
              </h3>
              {items.length > 0 ? (
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1 font-medium whitespace-nowrap">
                    <ArrowDownUp
                      className="size-3.5 text-emerald-600"
                      aria-hidden
                    />
                    <Star
                      className="size-3 fill-amber-400 text-amber-400"
                      aria-hidden
                    />
                    Sắp xếp theo sao
                  </span>
                  <select
                    value={starSort}
                    onChange={(e) =>
                      setStarSort(e.target.value as StarSortOrder)
                    }
                    disabled={loading}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                    aria-label="Sắp xếp bình luận theo sao"
                  >
                    <option value="default">Mặc định (mới nhất)</option>
                    <option value="desc">Sao cao → thấp</option>
                    <option value="asc">Sao thấp → cao</option>
                  </select>
                </label>
              ) : null}
            </div>

            {loading && !items.length ? (
              <div className="flex items-center justify-center gap-2 py-10 text-slate-500">
                <Loader2 className="size-5 animate-spin" aria-hidden />
                Đang tải bình luận…
              </div>
            ) : null}

            {!loading && !items.length ? (
              <p className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 py-10 text-center text-sm text-slate-500">
                <MessageSquare
                  className="size-8 text-slate-300"
                  strokeWidth={1.5}
                  aria-hidden
                />
                Chưa có bình luận nào. Hãy là người đầu tiên!
              </p>
            ) : null}

            {sortedItems.map((row) => (
              <CommentItem key={row.id} row={row} />
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-center gap-3 text-xs text-slate-600">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="size-3.5" aria-hidden />
                Trước
              </button>
              <span className="font-medium tabular-nums">
                Trang {pageLabel} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sau
                <ChevronRight className="size-3.5" aria-hidden />
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
};

export default ProductCommentComp;
