"use client";

import { useCallback, useMemo, useState } from "react";
import { Button, Input, InputNumber, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  useCreateVoucher,
  useGetVouchers,
} from "@/hooks/shopowner/useShopOwnerHook";
import type { ShopownerVoucherRow } from "@/services/shopowner/shopownerVoucherService";

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
    case "inactive":
      return "default";
    default:
      return "blue";
  }
}

export const ManagerVoucherView = () => {
  const [name, setName] = useState("");
  const [discount, setDiscount] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const { createVoucher, loading: creating } = useCreateVoucher();
  const { vouchers, loading, refetch } = useGetVouchers({
    page,
    page_size: pageSize,
  });

  const items = vouchers?.items ?? [];
  const total = vouchers?.pagination?.total ?? 0;

  const canSubmit =
    name.trim().length > 0 &&
    discount != null &&
    Number.isFinite(discount) &&
    discount > 0;

  const handleCreate = useCallback(async () => {
    if (!canSubmit || discount == null) return;

    const result = await createVoucher({
      name: name.trim(),
      discount: Number(discount),
    });

    if (result.ok) {
      setName("");
      setDiscount(null);
      void refetch();
    }
  }, [canSubmit, createVoucher, discount, name, refetch]);

  const columns: ColumnsType<ShopownerVoucherRow> = useMemo(
    () => [
      {
        title: "Voucher ID",
        dataIndex: "id",
        key: "id",
        ellipsis: true,
        render: (id: string) => (
          <code className="text-xs text-slate-600">{id}</code>
        ),
      },
      {
        title: "Voucher Name",
        dataIndex: "name",
        key: "name",
        render: (value: string | null | undefined) => value?.trim() || "—",
      },
      {
        title: "Discount",
        dataIndex: "discount",
        key: "discount",
        width: 120,
        render: (value: number | null | undefined) =>
          value != null ? `${value}` : "—",
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 120,
        render: (value: string | null | undefined) => (
          <Tag color={statusTagColor(value)}>{value || "unknown"}</Tag>
        ),
      },
      {
        title: "Created At",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 170,
        render: (value: string | undefined) => formatCellDate(value),
      },
      {
        title: "Updated At",
        dataIndex: "updatedAt",
        key: "updatedAt",
        width: 170,
        render: (value: string | undefined) => formatCellDate(value),
      },
    ],
    []
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <header>
        <Title level={3} className="mb-1!">
          Voucher Management
        </Title>
        <Text type="secondary">
          Create vouchers for your shop and manage the existing voucher list.
        </Text>
      </header>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <Title level={5} className="mb-4!">
          Create New Voucher
        </Title>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <Text className="mb-1 block text-xs font-medium text-slate-600">
              Voucher name
            </Text>
            <Input
              size="large"
              value={name}
              placeholder="Example: Save 100000đ for watermelon orders"
              onChange={(event) => setName(event.target.value)}
              maxLength={255}
            />
          </div>
          <div>
            <Text className="mb-1 block text-xs font-medium text-slate-600">
              Discount (VND)
            </Text>
            <InputNumber
              className="w-full"
              size="large"
              min={1}
              precision={0}
              placeholder="e.g. 1"
              value={discount ?? undefined}
              onChange={(value) =>
                setDiscount(value == null ? null : Number(value))
              }
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            type="primary"
            size="large"
            loading={creating}
            disabled={!canSubmit}
            onClick={() => void handleCreate()}
          >
            Create Voucher
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Title level={5} className="mb-0!">
            Existing Vouchers
          </Title>
          <Button size="small" onClick={() => void refetch()}>
            Refresh
          </Button>
        </div>
        <Table<ShopownerVoucherRow>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={items}
          size="middle"
          scroll={{ x: 900 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [5, 10, 20],
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            },
          }}
        />
      </section>
    </div>
  );
};
