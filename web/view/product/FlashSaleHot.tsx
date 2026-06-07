"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { UserProduct } from "@/interface/shop";

export type FlashSaleCampaign = NonNullable<UserProduct["flash_sale_campaign"]>;

export function formatPrice(v: number | null | undefined) {
  if (v == null) return "—";
  return `${v.toLocaleString("vi-VN")} ₫`;
}

export function computeDiscountedPrice(
  price: number | null | undefined,
  discountPercent: number | null | undefined
): number | null {
  if (price == null || price <= 0) return null;
  const d = discountPercent ?? 0;
  if (d <= 0 || d >= 100) return null;
  return Math.round((price * (100 - d)) / 100);
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
  return `${pad2(m)}:${pad2(s)}`;
}

export function useFlashSaleCountdown(expiredIn: string | null | undefined) {
  const [now, setNow] = useState(() => Date.now());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!expiredIn) return;
    const end = new Date(expiredIn).getTime();
    if (Number.isNaN(end)) return;

    const id = window.setInterval(() => {
      setNow(Date.now());
      setTick((t) => t + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [expiredIn]);

  const endMs = expiredIn ? new Date(expiredIn).getTime() : NaN;
  const remainingMs = Number.isFinite(endMs) ? Math.max(0, endMs - now) : 0;

  return {
    remainingMs,
    expired: remainingMs <= 0,
    label: formatCountdown(remainingMs),
    tick,
  };
}

export function isFlashSaleLive(
  flashSale: FlashSaleCampaign | null | undefined,
  expired: boolean
): flashSale is FlashSaleCampaign {
  return Boolean(flashSale && flashSale.status === "active" && !expired);
}

export function FlashSaleHotBadge({
  flashSale,
  compact = false,
  className = "",
}: {
  flashSale: FlashSaleCampaign;
  compact?: boolean;
  className?: string;
}) {
  const { expired, label, tick, remainingMs } = useFlashSaleCountdown(
    flashSale.expiredIn
  );
  const discount = flashSale.discount ?? 0;
  const remain = flashSale.remainQuantity ?? 0;

  if (expired) return null;

  const urgent = remainingMs > 0 && remainingMs < 5 * 60 * 1000;

  return (
    <motion.div
      animate={
        urgent
          ? {
              scale: [1, 1.02, 1],
              boxShadow: [
                "0 0 0 0 rgba(239,68,68,0.4)",
                "0 0 24px 4px rgba(239,68,68,0.55)",
                "0 0 0 0 rgba(239,68,68,0.4)",
              ],
            }
          : { scale: 1 }
      }
      transition={{ duration: 1.2, repeat: urgent ? Infinity : 0 }}
      className={`relative z-20 w-full overflow-hidden rounded-xl border-2 border-amber-300/90 bg-linear-to-br from-red-800 via-red-600 to-orange-500 text-white ring-2 ring-red-500/50 ring-offset-1 ring-offset-white/30 ${compact ? "px-2.5 py-2 shadow-xl shadow-red-600/50" : "px-3 py-2.5 shadow-2xl shadow-red-600/60"} ${className}`}
      role="status"
      aria-live="polite"
      aria-label={`Flash sale giảm ${discount} phần trăm, còn ${remain} suất, còn ${label}`}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_50%)] ${urgent ? "animate-pulse" : ""}`}
        aria-hidden
      />
      <div className="relative space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1 font-black uppercase tracking-wider text-amber-100 ${compact ? "text-[10px]" : "text-xs"}`}
          >
            <i
              className={`fas fa-fire text-amber-300 ${compact ? "text-xs" : "text-sm"}`}
              aria-hidden
            />
            Flash sale
          </span>
          <span
            className={`rounded-lg bg-white font-black leading-none text-red-700 shadow-md ${compact ? "px-2 py-1 text-xl" : "px-2.5 py-1 text-2xl"}`}
          >
            -{discount}%
          </span>
        </div>
        <div
          className={`flex items-center justify-center gap-1.5 rounded-lg bg-black/30 font-bold text-amber-50 ${compact ? "py-1 text-xs" : "py-1.5 text-sm"}`}
        >
          <i
            className={`fas fa-box-open text-amber-200 ${compact ? "text-sm" : "text-base"}`}
            aria-hidden
          />
          <span>Còn {remain} suất</span>
        </div>
        <motion.div
          key={tick}
          initial={false}
          animate={{
            x: [0, -5, 5, -5, 5, 0],
            scale: [1, 1.08, 1],
          }}
          transition={{ duration: 0.48, ease: "easeInOut" }}
          className={`flex items-center justify-center gap-2 rounded-lg border border-amber-400/50 bg-red-950/50 font-mono font-black tabular-nums tracking-wider text-amber-50 ${compact ? "py-1.5 text-base" : "py-2 text-lg"} ${urgent ? "ring-2 ring-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.6)]" : ""}`}
        >
          <i
            className={`fas fa-hourglass-half text-amber-300 ${compact ? "text-sm" : "text-base"}`}
            aria-hidden
          />
          {label}
        </motion.div>
      </div>
    </motion.div>
  );
}

export function FlashSaleHotPanel({
  flashSale,
}: {
  flashSale: FlashSaleCampaign;
}) {
  const { expired, label, tick, remainingMs } = useFlashSaleCountdown(
    flashSale.expiredIn
  );
  const discount = flashSale.discount ?? 0;
  const remain = flashSale.remainQuantity ?? 0;

  if (expired) return null;

  const urgent = remainingMs > 0 && remainingMs < 5 * 60 * 1000;

  return (
    <motion.div
      animate={urgent ? { scale: [1, 1.015, 1] } : undefined}
      transition={{ duration: 1.5, repeat: urgent ? Infinity : 0 }}
      className={`relative overflow-hidden rounded-2xl border-[3px] border-amber-400/80 bg-linear-to-r from-red-950 via-red-700 to-orange-500 p-4 text-white shadow-xl shadow-red-600/40 ring-2 ring-red-500/40 ${urgent ? "animate-pulse" : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-amber-100">
          <i className="fas fa-fire text-lg text-amber-300" aria-hidden />
          Đang flash sale
        </span>
        <span className="rounded-xl bg-white px-4 py-1.5 text-3xl font-black leading-none text-red-700 shadow-lg">
          -{discount}%
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-xl bg-black/35 px-3 py-2 text-base font-bold text-amber-50">
          <i className="fas fa-box-open text-lg text-amber-200" aria-hidden />
          Còn {remain} suất
        </span>
        <motion.span
          key={tick}
          initial={false}
          animate={{
            x: [0, -6, 6, -6, 6, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className={`inline-flex items-center gap-2 rounded-xl border-2 border-amber-400/60 bg-red-950/60 px-4 py-2 font-mono text-xl font-black tabular-nums tracking-wider text-amber-50 ${urgent ? "shadow-[0_0_16px_rgba(251,191,36,0.65)]" : ""}`}
        >
          <i className="fas fa-clock text-lg text-amber-300" aria-hidden />
          {label}
        </motion.span>
      </div>
      <p className="mt-2.5 text-center text-sm font-bold uppercase tracking-wide text-amber-100">
        <i
          className="fas fa-exclamation-triangle mr-1.5 text-amber-300"
          aria-hidden
        />
        Nhanh tay — ưu đãi sắp hết!
      </p>
    </motion.div>
  );
}

export function FlashSalePriceDisplay({
  originalPrice,
  flashSale,
}: {
  originalPrice: number | null | undefined;
  flashSale: FlashSaleCampaign | null | undefined;
}) {
  const { expired } = useFlashSaleCountdown(flashSale?.expiredIn);
  const discount = flashSale?.discount ?? 0;
  const live = isFlashSaleLive(flashSale, expired);
  const salePrice = live
    ? computeDiscountedPrice(originalPrice, discount)
    : null;

  if (salePrice != null && originalPrice != null) {
    const saved = originalPrice - salePrice;
    return (
      <div className="mt-4">
        <div className="flex flex-wrap items-end gap-3">
          <span className="text-2xl font-semibold text-slate-400 line-through decoration-red-500 decoration-2">
            {formatPrice(originalPrice)}
          </span>
          <motion.span
            className="text-4xl font-black tracking-tight text-red-600 drop-shadow-[0_2px_8px_rgba(220,38,38,0.35)] md:text-5xl"
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            {formatPrice(salePrice)}
          </motion.span>
          <span className="mb-1 rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white">
            -{discount}%
          </span>
        </div>
        <p className="mt-1.5 text-sm font-semibold text-orange-600">
          Giá flash sale · tiết kiệm {formatPrice(saved)}
        </p>
      </div>
    );
  }

  return (
    <p className="mt-4 text-3xl font-bold text-emerald-600 md:text-4xl">
      {formatPrice(originalPrice)}
    </p>
  );
}
