"use client";

import { useMemo, useState } from "react";
import {
  useGetCollaboratorMyDeliveries,
  usePatchCollaboratorMyDeliveryStatus,
} from "@/hooks/collaborator/useCollaboratorHook";
import type {
  CollaboratorDeliverStatus,
  CollaboratorDeliveryRow,
} from "@/services/collaborator/collaboratorService";

const PAGE_SIZE = 10;
const DELIVERY_FEE_PER_ORDER = 5000;

type DeliveryFilter = "all" | CollaboratorDeliverStatus;

type DeliveryTableItem = {
  assignmentId: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  deliveryAddress: string;
  codAmount: number;
  totalPrice: number;
  deliveryStatus: CollaboratorDeliverStatus;
  assignedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
};

function readString(
  source: Record<string, unknown> | null | undefined,
  key: string
): string {
  const value = source?.[key];
  return typeof value === "string" ? value : "";
}

function readNullableString(
  source: Record<string, unknown> | null | undefined,
  key: string
): string | null {
  const value = source?.[key];
  return typeof value === "string" ? value : null;
}

function readNumber(
  source: Record<string, unknown> | null | undefined,
  key: string
): number {
  const value = source?.[key];
  return typeof value === "number" ? value : 0;
}

function normalizeStatus(value: string): CollaboratorDeliverStatus {
  if (
    value === "picked" ||
    value === "delivered_at" ||
    value === "failed"
  ) {
    return value;
  }
  return "assigned";
}

function toDeliveryTableItem(row: {
  assignment: Record<string, unknown>;
  order: Record<string, unknown> | null;
  customerUser: Record<string, unknown> | null;
}): DeliveryTableItem {
  const assignment = row.assignment;
  const order = row.order;
  const customerUser = row.customerUser;

  return {
    assignmentId: readString(assignment, "id"),
    orderId:
      readString(assignment, "orderId") ||
      readString(order, "id") ||
      "Không xác định",
    customerName: readString(customerUser, "name") || "Khách hàng",
    customerEmail: readString(customerUser, "email") || "—",
    deliveryAddress:
      readString(assignment, "deliveryAddress") ||
      readString(order, "address") ||
      "Chưa có địa chỉ",
    codAmount: readNumber(assignment, "codAmount"),
    totalPrice: readNumber(order, "totalPrice"),
    deliveryStatus: normalizeStatus(readString(assignment, "deliveryStatus")),
    assignedAt: readNullableString(assignment, "assignedAt"),
    pickedUpAt: readNullableString(assignment, "pickedUpAt"),
    deliveredAt: readNullableString(assignment, "deliveredAt"),
  };
}

function formatCurrency(value: number): string {
  return `${value.toLocaleString("vi-VN")}đ`;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("vi-VN");
}

function statusLabel(status: CollaboratorDeliverStatus): string {
  if (status === "assigned") return "Đã phân công";
  if (status === "picked") return "Đã lấy hàng";
  if (status === "failed") return "Giao thất bại";
  return "Đã giao";
}

function nextStatus(
  status: CollaboratorDeliverStatus
): CollaboratorDeliverStatus | null {
  if (status === "assigned") return "picked";
  return null;
}

function actionLabel(status: CollaboratorDeliverStatus): string {
  if (status === "assigned") return "Xác nhận đã lấy hàng";
  return "Hoàn tất";
}

function badgeClass(status: CollaboratorDeliverStatus): string {
  if (status === "assigned") {
    return "bg-amber-100 text-amber-700";
  }
  if (status === "picked") {
    return "bg-blue-100 text-blue-700";
  }
  if (status === "failed") {
    return "bg-rose-100 text-rose-700";
  }
  return "bg-emerald-100 text-emerald-700";
}

function isTerminalStatus(status: CollaboratorDeliverStatus): boolean {
  return status === "delivered_at" || status === "failed";
}

export const MyAssignmentView = () => {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<DeliveryFilter>("all");
  const [updatingId, setUpdatingId] = useState("");

  const { deliveries, pagination, loading } = useGetCollaboratorMyDeliveries({
    page,
    page_size: PAGE_SIZE,
  });
  const { deliveries: statsDeliveries, loading: statsLoading } =
    useGetCollaboratorMyDeliveries({
      page: 1,
      page_size: 1000,
    });
  const { patchDeliveryStatus, loading: patchLoading } =
    usePatchCollaboratorMyDeliveryStatus();

  const tableRows = useMemo(
    () =>
      deliveries.map((row) =>
        toDeliveryTableItem(row as CollaboratorDeliveryRow)
      ),
    [deliveries]
  );

  const filteredRows = useMemo(() => {
    if (filter === "all") return tableRows;
    return tableRows.filter((row) => row.deliveryStatus === filter);
  }, [filter, tableRows]);

  const totalRows = pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));

  const overview = useMemo(() => {
    const statRows = statsDeliveries.map((row) =>
      toDeliveryTableItem(row as CollaboratorDeliveryRow)
    );
    const totalNeedDeliver = statRows.filter(
      (row) => !isTerminalStatus(row.deliveryStatus)
    ).length;
    const totalProcessed = statRows.filter(
      (row) => row.deliveryStatus !== "assigned"
    ).length;
    const totalDelivered = statRows.filter(
      (row) => row.deliveryStatus === "delivered_at"
    ).length;

    return {
      totalNeedDeliver,
      totalProcessed,
      totalReceived: totalDelivered * DELIVERY_FEE_PER_ORDER,
    };
  }, [statsDeliveries]);

  const onUpdateStatus = async (
    row: DeliveryTableItem,
    deliverStatus: CollaboratorDeliverStatus
  ) => {
    if (!row.assignmentId) return;
    setUpdatingId(row.assignmentId);
    try {
      await patchDeliveryStatus({
        shipper_assignment_id: row.assignmentId,
        deliver_status: deliverStatus,
      });
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 via-white to-slate-100 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-slate-900">
              Dashboard giao hàng cộng tác viên
            </h1>
            {(loading || statsLoading) && (
              <span className="text-sm text-slate-500">
                <i className="fas fa-spinner fa-spin mr-2" />
                Đang tải dữ liệu...
              </span>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
                Đơn cần phải giao
              </p>
              <p className="mt-2 text-2xl font-bold text-amber-800">
                {overview.totalNeedDeliver}
              </p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
                Tổng đơn đã xử lý
              </p>
              <p className="mt-2 text-2xl font-bold text-blue-800">
                {overview.totalProcessed}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                Tổng tiền nhận được
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-800">
                {formatCurrency(overview.totalReceived)}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Danh sách đơn hàng của bạn
            </h2>
            <div className="flex items-center gap-2">
              <label
                htmlFor="delivery-filter"
                className="text-sm text-slate-600"
              >
                Lọc trạng thái:
              </label>
              <select
                id="delivery-filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value as DeliveryFilter)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              >
                <option value="all">Tất cả</option>
                <option value="assigned">assigned</option>
                <option value="picked">picked</option>
                <option value="delivered_at">delivered_at</option>
                <option value="failed">failed</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3">Mã đơn</th>
                  <th className="px-3 py-3">Khách hàng</th>
                  <th className="px-3 py-3">Địa chỉ giao</th>
                  <th className="px-3 py-3">COD</th>
                  <th className="px-3 py-3">Tổng tiền đơn</th>
                  <th className="px-3 py-3">Trạng thái</th>
                  <th className="px-3 py-3">Thời gian</th>
                  <th className="px-3 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-sm text-slate-700">
                {filteredRows.map((row) => {
                  const next = nextStatus(row.deliveryStatus);
                  const isPicked = row.deliveryStatus === "picked";
                  const isUpdating = updatingId === row.assignmentId;
                  return (
                    <tr key={row.assignmentId || row.orderId}>
                      <td className="px-3 py-3 font-medium text-slate-900">
                        {row.orderId}
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium">{row.customerName}</p>
                        <p className="text-xs text-slate-500">
                          {row.customerEmail}
                        </p>
                      </td>
                      <td className="px-3 py-3">{row.deliveryAddress}</td>
                      <td className="px-3 py-3">
                        {formatCurrency(row.codAmount)}
                      </td>
                      <td className="px-3 py-3">
                        {formatCurrency(row.totalPrice)}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass(
                            row.deliveryStatus
                          )}`}
                        >
                          {statusLabel(row.deliveryStatus)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-500">
                        <div>Gán: {formatDate(row.assignedAt)}</div>
                        <div>Lấy: {formatDate(row.pickedUpAt)}</div>
                        <div>Giao: {formatDate(row.deliveredAt)}</div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        {isPicked ? (
                          <div className="flex flex-col items-end gap-1.5">
                            <button
                              type="button"
                              disabled={patchLoading || isUpdating}
                              onClick={() =>
                                void onUpdateStatus(row, "delivered_at")
                              }
                              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isUpdating ? (
                                <>
                                  <i className="fas fa-spinner fa-spin mr-1" />
                                  Đang cập nhật
                                </>
                              ) : (
                                "Giao thành công"
                              )}
                            </button>
                            <button
                              type="button"
                              disabled={patchLoading || isUpdating}
                              onClick={() => void onUpdateStatus(row, "failed")}
                              className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-800 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isUpdating ? (
                                <>
                                  <i className="fas fa-spinner fa-spin mr-1" />
                                  Đang cập nhật
                                </>
                              ) : (
                                "Giao thất bại"
                              )}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={
                              !next ||
                              isTerminalStatus(row.deliveryStatus) ||
                              patchLoading ||
                              isUpdating
                            }
                            onClick={() =>
                              next
                                ? void onUpdateStatus(row, next)
                                : undefined
                            }
                            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isUpdating ? (
                              <>
                                <i className="fas fa-spinner fa-spin mr-1" />
                                Đang cập nhật
                              </>
                            ) : (
                              actionLabel(row.deliveryStatus)
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!loading && filteredRows.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-sm text-slate-500">
              Không có đơn hàng phù hợp với bộ lọc đã chọn.
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-600">
            <span>
              Trang {page}/{totalPages} - Tổng đơn: {totalRows}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="rounded-full border border-slate-200 px-4 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
                className="rounded-full border border-slate-200 px-4 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
