"use client";

import { useState } from "react";
import {
  useGetShopownerUsers,
  useUpdateShopownerUserStatus,
} from "@/hooks/shopowner/useShopOwnerHook";
import type { ShopownerUserRow } from "@/services/shopowner/shopownerUserService";

const PAGE_SIZE = 10;

function cell(value: string | null | undefined) {
  const v = value?.trim();
  return v ? v : "—";
}

const UserStatsTable: React.FC = () => {
  const [page, setPage] = useState(1);
  const { users, loading, refetch } = useGetShopownerUsers({
    page,
    page_size: PAGE_SIZE,
  });
  const { updateUserStatus, loading: updating } =
    useUpdateShopownerUserStatus();
  const [updatingEmail, setUpdatingEmail] = useState<string | null>(null);

  const items = users?.items ?? [];
  const pagination = users?.pagination;
  const total = pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const onToggleStatus = async (row: ShopownerUserRow) => {
    const email = row.email?.trim();
    if (!email) return;

    const isActive = (row.status ?? "").toLowerCase() === "active";
    const nextStatus = isActive ? "inactive" : "active";

    setUpdatingEmail(email);
    try {
      await updateUserStatus({ email, status: nextStatus });
      await refetch();
    } finally {
      setUpdatingEmail(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/60 shadow-lg shadow-slate-300/40 backdrop-blur-xl">
      <div className="border-b border-slate-200/80 px-4 py-3 md:px-6">
        <h2 className="text-lg font-semibold text-slate-900">Thống kê user</h2>
        <p className="mt-0.5 text-sm text-slate-600">
          Tổng {total} tài khoản — số liệu đơn theo trạng thái
        </p>
      </div>

      {loading ? (
        <div className="space-y-2 p-4 md:p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-10 animate-pulse rounded-lg bg-slate-200/80"
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50/90">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-3 py-3 whitespace-nowrap">STT</th>
                <th className="px-3 py-3 whitespace-nowrap">Email</th>
                <th className="px-3 py-3 whitespace-nowrap">phoneNumber</th>
                <th className="px-3 py-3 whitespace-nowrap">name</th>
                <th className="px-3 py-3 text-center whitespace-nowrap">
                  total_order
                </th>
                <th className="px-3 py-3 text-center whitespace-nowrap">
                  cart_item
                </th>
                <th className="px-3 py-3 text-center whitespace-nowrap">
                  processing_orders
                </th>
                <th className="px-3 py-3 text-center whitespace-nowrap">
                  paid_order
                </th>
                <th className="px-3 py-3 text-center whitespace-nowrap">
                  order
                </th>
                <th className="px-3 py-3 text-center whitespace-nowrap">
                  cancel_orders
                </th>
                <th className="px-3 py-3 text-center whitespace-nowrap">
                  failed_order
                </th>
                <th className="px-3 py-3 text-right whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white/80 text-slate-700">
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={12}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    Chưa có dữ liệu user.
                  </td>
                </tr>
              ) : (
                items.map((row, index) => {
                  const stats = row.order_stats;
                  const stt = (page - 1) * PAGE_SIZE + index + 1;
                  const isActive =
                    (row.status ?? "").toLowerCase() === "active";
                  const email = row.email?.trim() ?? "";
                  const rowUpdating = updating && updatingEmail === email;

                  return (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-3 py-3 font-medium text-slate-900">
                        {stt}
                      </td>
                      <td className="px-3 py-3 max-w-[200px] truncate">
                        {cell(row.email)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {cell(row.phoneNumber)}
                      </td>
                      <td className="px-3 py-3 max-w-[160px] truncate">
                        {cell(row.name)}
                      </td>
                      <td className="px-3 py-3 text-center tabular-nums">
                        {stats.total}
                      </td>
                      <td className="px-3 py-3 text-center tabular-nums">
                        {stats.cart}
                      </td>
                      <td className="px-3 py-3 text-center tabular-nums">
                        {stats.processing}
                      </td>
                      <td className="px-3 py-3 text-center tabular-nums">
                        {stats.paid}
                      </td>
                      <td className="px-3 py-3 text-center tabular-nums">
                        {stats.order}
                      </td>
                      <td className="px-3 py-3 text-center tabular-nums">
                        {stats.cancel}
                      </td>
                      <td className="px-3 py-3 text-center tabular-nums">
                        {stats.failed}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          disabled={!email || rowUpdating}
                          onClick={() => void onToggleStatus(row)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            isActive
                              ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }`}
                        >
                          {rowUpdating
                            ? "Đang xử lý..."
                            : isActive
                              ? "Khóa"
                              : "Kích hoạt"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 px-4 py-3 md:px-6">
          <p className="text-sm text-slate-600">
            Trang {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Trước
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserStatsTable;
