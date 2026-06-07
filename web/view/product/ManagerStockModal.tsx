"use client";

import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  useGetStockRemain,
  useUpdateStock,
} from "@/hooks/shopowner/useShopOwnerHook";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TABLE_PAGE_SIZE = 10;

export type ManagerStockModalProps = {
  open: boolean;
  onClose: () => void;
  shopId: string;
  productId: string;
  productName?: string | null;
};

export function ManagerStockModal({
  open,
  onClose,
  shopId,
  productId,
  productName,
}: ManagerStockModalProps) {
  const [quantityInput, setQuantityInput] = useState("");
  const [reason, setReason] = useState<"rotten" | "import">("rotten");
  const [tablePage, setTablePage] = useState(1);

  const { updateStock, loading: updating } = useUpdateStock();

  const stockParams =
    open && shopId && productId
      ? {
          shopId,
          productId,
          page: tablePage,
          page_size: TABLE_PAGE_SIZE,
        }
      : undefined;

  const {
    stockRemain,
    loading: loadingHistory,
    refetch,
  } = useGetStockRemain(stockParams);

  const totalPages = useMemo(() => {
    const total = stockRemain?.pagination?.total ?? 0;
    const size = stockRemain?.pagination?.page_size ?? TABLE_PAGE_SIZE;
    if (total <= 0) return 1;
    return Math.max(1, Math.ceil(total / size));
  }, [stockRemain?.pagination]);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    const q = Number.parseInt(quantityInput.trim(), 10);
    if (!Number.isFinite(q)) {
      return;
    }
    const result = await updateStock({
      shopId,
      productId,
      quantity: q,
      reason,
    });
    if (result.ok) {
      setQuantityInput("");
      void refetch();
    }
  }

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="manager-stock-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-2 border-b border-slate-100 px-5 py-4">
          <div>
            <h2
              id="manager-stock-title"
              className="text-lg font-semibold text-slate-900"
            >
              Quản lý tồn kho
            </h2>
            {productName ? (
              <p className="mt-0.5 text-sm text-slate-500">{productName}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Đóng"
          >
            <i className="fas fa-times" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Nội dung trên — cập nhật tồn */}
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">
              Cập nhật tồn kho
            </h3>
            <form onSubmit={handleUpdate} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-medium text-slate-600">
                  Số lượng (±)
                  <input
                    type="number"
                    inputMode="numeric"
                    value={quantityInput}
                    onChange={(e) => setQuantityInput(e.target.value)}
                    placeholder="Ví dụ: -2 hoặc 5"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none ring-emerald-500/30 focus:border-emerald-400 focus:ring-2"
                  />
                </label>
                <label className="block text-xs font-medium text-slate-600">
                  Lý do
                  <select
                    value={reason}
                    onChange={(e) =>
                      setReason(e.target.value as "rotten" | "import")
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-emerald-500/30 focus:border-emerald-400 focus:ring-2"
                  >
                    <option value="rotten">rotten (hỏng)</option>
                    <option value="import">import (nhập)</option>
                  </select>
                </label>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={updating || !quantityInput.trim()}
                  className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {updating ? (
                    <>
                      <i
                        className="fas fa-spinner fa-spin mr-1.5"
                        aria-hidden
                      />
                      Đang cập nhật…
                    </>
                  ) : (
                    "Update"
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Nội dung dưới — lịch sử */}
          <div className="px-5 py-4">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-800">
                Lịch sử biến động
              </h3>
              <span className="text-xs font-medium text-emerald-700">
                Tồn hiện tại:{" "}
                {loadingHistory && !stockRemain
                  ? "…"
                  : (stockRemain?.current_remain ?? "—")}
              </span>
            </div>

            <div className="rounded-lg border border-slate-200">
              {loadingHistory && !stockRemain ? (
                <div className="flex items-center justify-center py-10 text-sm text-slate-500">
                  <i className="fas fa-spinner fa-spin mr-2" aria-hidden />
                  Đang tải lịch sử…
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[28%]">quantity</TableHead>
                      <TableHead className="w-[28%]">reason</TableHead>
                      <TableHead className="w-[44%]">remain</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(stockRemain?.items?.length ?? 0) === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="py-8 text-center text-sm text-slate-500"
                        >
                          Chưa có biến động tồn kho.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (stockRemain?.items ?? []).map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-mono text-xs">
                            {row.quantity}
                          </TableCell>
                          <TableCell className="text-xs">
                            {row.reason}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {row.remain}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>

            {totalPages > 1 && (
              <div className="mt-3 flex items-center justify-center gap-3 text-xs text-slate-600">
                <button
                  type="button"
                  disabled={tablePage <= 1 || loadingHistory}
                  onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                  className="rounded-full border border-slate-200 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Trước
                </button>
                <span>
                  Trang {tablePage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={tablePage >= totalPages || loadingHistory}
                  onClick={() =>
                    setTablePage((p) => Math.min(totalPages, p + 1))
                  }
                  className="rounded-full border border-slate-200 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
