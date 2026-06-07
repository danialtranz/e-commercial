"use client";

import { useCallback, useMemo, useState } from "react";
import { Button, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useGetVouchers } from "@/hooks/shopowner/useShopOwnerHook";
import {
  useClaimUserVoucher,
  useGetUserCredit,
  useListMyVoucher,
} from "@/hooks/user/useUserHook";
import type { ShopownerVoucherRow } from "@/services/shopowner/shopownerVoucherService";
import type { UserVoucherItem } from "@/services/user/deliveryAndVoucherService";

const { Title, Text } = Typography;

function formatCellDate(iso?: string) {
  if (!iso) return "—";
  const parsed = dayjs(iso);
  return parsed.isValid() ? parsed.format("DD/MM/YYYY HH:mm") : String(iso);
}

function statusTagColor(status: string | null | undefined) {
  switch (status) {
    case "active":
      return "green";
    case "used":
      return "blue";
    case "inactive":
      return "default";
    default:
      return "default";
  }
}

export const ExchangeVoucherView = () => {
  const [leftPage, setLeftPage] = useState(1);
  const [leftPageSize, setLeftPageSize] = useState(5);

  const [rightPage, setRightPage] = useState(1);
  const [rightPageSize, setRightPageSize] = useState(5);
  const [claimingVoucherId, setClaimingVoucherId] = useState<string | null>(
    null
  );

  const {
    credit,
    loading: creditLoading,
    refetch: refetchCredit,
  } = useGetUserCredit();

  const {
    vouchers: platformVouchers,
    loading: platformLoading,
    refetch: refetchPlatformVouchers,
  } = useGetVouchers({
    page: leftPage,
    page_size: leftPageSize,
  });

  const {
    vouchers: myVouchers,
    pagination: myVoucherPagination,
    loading: myVoucherLoading,
    refetch: refetchMyVouchers,
  } = useListMyVoucher({
    page: rightPage,
    page_size: rightPageSize,
  });
  const { claimVoucher, loading: claimingVoucher } = useClaimUserVoucher();

  const platformItems = platformVouchers?.items ?? [];
  const platformTotal = platformVouchers?.pagination?.total ?? 0;

  const handleClaimVoucher = useCallback(
    async (voucherId: string) => {
      setClaimingVoucherId(voucherId);
      try {
        const result = await claimVoucher({ voucherId });
        if (result?.code === 0 || result?.code === 200) {
          await Promise.all([
            refetchCredit(),
            refetchMyVouchers(),
            refetchPlatformVouchers(),
          ]);
        }
      } finally {
        setClaimingVoucherId(null);
      }
    },
    [claimVoucher, refetchCredit, refetchMyVouchers, refetchPlatformVouchers]
  );

  const leftColumns: ColumnsType<ShopownerVoucherRow> = useMemo(
    () => [
      {
        title: "Tên voucher",
        dataIndex: "name",
        key: "name",
        render: (value: string | null | undefined) => value?.trim() || "—",
      },
      {
        title: "Giảm giá",
        dataIndex: "discount",
        key: "discount",
        width: 120,
        render: (value: number | null | undefined) =>
          value != null ? `${value}` : "—",
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 120,
        render: (value: string | null | undefined) => (
          <Tag color={statusTagColor(value)}>{value || "unknown"}</Tag>
        ),
      },
      {
        title: "Ngày tạo",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 170,
        render: (value: string | undefined) => formatCellDate(value),
      },
      {
        title: "Hành động",
        key: "action",
        width: 130,
        render: (_, row) => {
          const canClaim = (row.status ?? "").toLowerCase() === "active";
          const isThisRowClaiming =
            claimingVoucher && claimingVoucherId === row.id;
          return (
            <Button
              type="primary"
              size="small"
              disabled={!canClaim || claimingVoucher}
              loading={isThisRowClaiming}
              onClick={() => void handleClaimVoucher(row.id)}
            >
              Đổi voucher
            </Button>
          );
        },
      },
    ],
    [claimingVoucher, claimingVoucherId, handleClaimVoucher]
  );

  const rightColumns: ColumnsType<UserVoucherItem> = useMemo(
    () => [
      {
        title: "Tên voucher",
        key: "voucherName",
        render: (_, row) => row.voucher?.name?.trim() || "—",
      },
      {
        title: "Giảm giá",
        key: "voucherDiscount",
        width: 120,
        render: (_, row) =>
          row.voucher?.discount != null ? `${row.voucher.discount}` : "—",
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 120,
        render: (value: string | null | undefined) => (
          <Tag color={statusTagColor(value)}>{value || "unknown"}</Tag>
        ),
      },
      {
        title: "Mã user voucher",
        dataIndex: "id",
        key: "id",
        ellipsis: true,
        render: (id: string) => (
          <code className="text-xs text-slate-600">{id}</code>
        ),
      },
    ],
    []
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Title level={4} className="mb-0!">
            Thông tin credit của bạn
          </Title>
          <Button
            size="small"
            loading={creditLoading}
            onClick={() => void refetchCredit()}
          >
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 p-4">
            <Text type="secondary">Tổng điểm</Text>
            <div className="mt-1 text-2xl font-semibold">
              {credit?.totalCredit ?? 0}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <Text type="secondary">Điểm đã dùng</Text>
            <div className="mt-1 text-2xl font-semibold">
              {credit?.usedCredit ?? 0}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <Text type="secondary">Hệ số hiện tại</Text>
            <div className="mt-1 text-2xl font-semibold">
              {credit?.currentMultiply ?? 1}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <Text type="secondary">Hạng hiện tại</Text>
            <div className="mt-1 text-2xl font-semibold capitalize">
              {credit?.currentRank || "normal"}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-2">
            <Title level={5} className="mb-0!">
              Voucher nền tảng
            </Title>
            <Button size="small" onClick={() => void refetchPlatformVouchers()}>
              Refresh
            </Button>
          </div>
          <Table<ShopownerVoucherRow>
            rowKey="id"
            loading={platformLoading}
            columns={leftColumns}
            dataSource={platformItems}
            size="middle"
            scroll={{ x: 680 }}
            pagination={{
              current: leftPage,
              pageSize: leftPageSize,
              total: platformTotal,
              showSizeChanger: true,
              pageSizeOptions: [5, 10, 20],
              onChange: (nextPage, nextPageSize) => {
                setLeftPage(nextPage);
                setLeftPageSize(nextPageSize);
              },
            }}
          />
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-2">
            <Title level={5} className="mb-0!">
              Voucher của tôi
            </Title>
            <Button size="small" onClick={() => void refetchMyVouchers()}>
              Refresh
            </Button>
          </div>
          <Table<UserVoucherItem>
            rowKey="id"
            loading={myVoucherLoading}
            columns={rightColumns}
            dataSource={myVouchers}
            size="middle"
            scroll={{ x: 680 }}
            pagination={{
              current: rightPage,
              pageSize: rightPageSize,
              total: myVoucherPagination?.total ?? 0,
              showSizeChanger: true,
              pageSizeOptions: [5, 10, 20],
              onChange: (nextPage, nextPageSize) => {
                setRightPage(nextPage);
                setRightPageSize(nextPageSize);
              },
            }}
          />
        </div>
      </section>
    </div>
  );
};
