"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  DatePicker,
  InputNumber,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useGetUserProducts } from "@/hooks/user/useUserHook";
import {
  useCreateShopownerFlashSaleCampaign,
  useDeleteShopownerFlashSaleCampaign,
  useListShopownerFlashSaleCampaigns,
  useUpdateShopownerFlashSaleCampaignStatus,
} from "@/hooks/shopowner/useShopOwnerHook";
import type { ShopownerFlashSaleCampaignRow } from "@/services/shopowner/shopownerFlashSaleService";
import { ProductCard } from "@/view/product/ProductCard";

dayjs.extend(utc);
dayjs.extend(timezone);

const PRODUCT_PAGE_SIZE = 2;
const { Title, Text } = Typography;

function readStoredShopId(): string | null {
  if (typeof window === "undefined") return null;
  const id =
    localStorage.getItem("shopId")?.trim() ||
    localStorage.getItem("shop_id")?.trim() ||
    localStorage.getItem("currentShopId")?.trim() ||
    "";
  return id || null;
}

/** Chuỗi datetime gửi API (múi giờ +0700, cùng format backend mẫu). */
function formatFlashSaleDateForApi(d: Dayjs): string {
  return d.tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD HH:mm:ss.SSS") + " +0700";
}

function formatCellDate(iso?: string) {
  if (!iso) return "—";
  const parsed = dayjs(iso);
  return parsed.isValid() ? parsed.format("DD/MM/YYYY HH:mm") : String(iso);
}

function statusTagColor(status: string | undefined) {
  switch (status) {
    case "active":
      return "green";
    case "inactive":
      return "default";
    case "expired":
      return "red";
    default:
      return "blue";
  }
}

export const ManagerFlashCampView = () => {
  const [shopId, setShopId] = useState<string | null>(null);
  const [productPage, setProductPage] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  );

  const [campaignStartAt, setCampaignStartAt] = useState<Dayjs | null>(null);
  const [expiredIn, setExpiredIn] = useState<Dayjs | null>(null);
  const [totalQuantity, setTotalQuantity] = useState<number | null>(10);
  const [discount, setDiscount] = useState<number | null>(30);

  const [campPage, setCampPage] = useState(1);
  const [campPageSize, setCampPageSize] = useState(5);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setShopId(readStoredShopId());
  }, []);

  const {
    products,
    pagination,
    loading: loadingProducts,
  } = useGetUserProducts(
    shopId
      ? {
          shop_id: shopId,
          page: productPage,
          page_size: PRODUCT_PAGE_SIZE,
        }
      : undefined
  );

  const {
    data: flashListData,
    loading: loadingCampaigns,
    refetch: refetchCampaigns,
  } = useListShopownerFlashSaleCampaigns({
    page: campPage,
    page_size: campPageSize,
  });

  const { createFlashSaleCampaign, loading: creating } =
    useCreateShopownerFlashSaleCampaign();
  const { updateFlashSaleCampaignStatus } =
    useUpdateShopownerFlashSaleCampaignStatus();
  const { deleteFlashSaleCampaign } = useDeleteShopownerFlashSaleCampaign();

  const campaignItems = flashListData?.items ?? [];
  const campaignTotal = flashListData?.pagination?.total ?? 0;

  const productTotalPages = useMemo(() => {
    const total = pagination?.total ?? 0;
    return total > 0 ? Math.ceil(total / PRODUCT_PAGE_SIZE) : 1;
  }, [pagination?.total]);

  const handleSubmit = useCallback(async () => {
    if (!selectedProductId) {
      return;
    }
    if (!campaignStartAt?.isValid() || !expiredIn?.isValid()) {
      return;
    }
    if (
      totalQuantity == null ||
      !Number.isInteger(totalQuantity) ||
      totalQuantity <= 0
    ) {
      return;
    }
    if (
      discount == null ||
      !Number.isInteger(discount) ||
      discount < 0 ||
      discount > 100
    ) {
      return;
    }

    const result = await createFlashSaleCampaign({
      product_target_id: selectedProductId,
      campaign_start_at: formatFlashSaleDateForApi(campaignStartAt),
      expired_in: formatFlashSaleDateForApi(expiredIn),
      total_quantity: totalQuantity,
      discount,
    });

    if (result.ok) {
      void refetchCampaigns();
    }
  }, [
    selectedProductId,
    campaignStartAt,
    expiredIn,
    totalQuantity,
    discount,
    createFlashSaleCampaign,
    refetchCampaigns,
  ]);

  const handleStatus = useCallback(
    async (
      row: ShopownerFlashSaleCampaignRow,
      status: "active" | "inactive"
    ) => {
      if (!row.id) return;
      setStatusUpdatingId(row.id);
      try {
        await updateFlashSaleCampaignStatus({
          flash_sale_campaign_id: row.id,
          status,
        });
      } finally {
        setStatusUpdatingId(null);
      }
    },
    [updateFlashSaleCampaignStatus]
  );

  const handleDelete = useCallback(
    async (row: ShopownerFlashSaleCampaignRow) => {
      if (!row.id) return;
      if (
        !window.confirm("Xóa chiến dịch flash sale này? Không thể hoàn tác.")
      ) {
        return;
      }
      setDeletingId(row.id);
      try {
        await deleteFlashSaleCampaign({
          flash_sale_campaign_id: row.id,
        });
      } finally {
        setDeletingId(null);
      }
    },
    [deleteFlashSaleCampaign]
  );

  const columns: ColumnsType<ShopownerFlashSaleCampaignRow> = useMemo(
    () => [
      {
        title: "Bắt đầu",
        dataIndex: "campaignStartAt",
        key: "campaignStartAt",
        render: (v: string) => formatCellDate(v),
      },
      {
        title: "Kết thúc",
        dataIndex: "expiredIn",
        key: "expiredIn",
        render: (v: string) => formatCellDate(v),
      },
      {
        title: "Tổng SL",
        dataIndex: "totalQuantity",
        key: "totalQuantity",
        width: 88,
      },
      {
        title: "Còn lại",
        dataIndex: "remainQuantity",
        key: "remainQuantity",
        width: 88,
      },
      {
        title: "Giảm giá (%)",
        dataIndex: "discount",
        key: "discount",
        width: 110,
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 110,
        render: (s: string) => <Tag color={statusTagColor(s)}>{s ?? "—"}</Tag>,
      },
      {
        title: "Tạo lúc",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (v: string) => formatCellDate(v),
      },
      {
        title: "Cập nhật",
        dataIndex: "updatedAt",
        key: "updatedAt",
        render: (v: string) => formatCellDate(v),
      },
      {
        title: "Thao tác",
        key: "actions",
        width: 220,
        fixed: "right" as const,
        render: (_: unknown, record) => {
          const id = record.id;
          const statusBusy = statusUpdatingId === id;
          const delBusy = deletingId === id;
          const rowLocked = statusBusy || delBusy;
          const expired = record.status === "expired";
          return (
            <Space size="small" wrap>
              <Button
                type="link"
                size="small"
                disabled={expired || record.status === "active" || rowLocked}
                loading={statusBusy}
                onClick={() => void handleStatus(record, "active")}
              >
                Active
              </Button>
              <Button
                type="link"
                size="small"
                disabled={expired || record.status === "inactive" || rowLocked}
                loading={statusBusy}
                onClick={() => void handleStatus(record, "inactive")}
              >
                Inactive
              </Button>
              <Button
                type="link"
                size="small"
                danger
                disabled={rowLocked}
                loading={delBusy}
                onClick={() => void handleDelete(record)}
              >
                Xóa
              </Button>
            </Space>
          );
        },
      },
    ],
    [deletingId, handleDelete, handleStatus, statusUpdatingId]
  );

  if (!shopId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-center text-amber-900">
          <Title level={4} className="!mb-2 !text-amber-900">
            Chưa có shop
          </Title>
          <Text type="secondary">
            Đăng nhập shop owner và đảm bảo{" "}
            <code className="rounded bg-white/80 px-1">shopId</code> đã lưu
            trong localStorage.
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8">
      <header>
        <Title level={3} className="!mb-1">
          Quản lý flash sale
        </Title>
        <Text type="secondary">
          Chọn sản phẩm, đặt thời gian và tạo chiến dịch; theo dõi danh sách
          phía dưới.
        </Text>
      </header>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
        <div className="space-y-4">
          <Title level={5}>Sản phẩm (2 / hàng)</Title>
          {loadingProducts ? (
            <div className="flex justify-center py-12 text-slate-500">
              <i className="fas fa-spinner fa-spin mr-2" aria-hidden />
              Đang tải sản phẩm…
            </div>
          ) : !products.length ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center text-slate-500">
              Shop chưa có sản phẩm hoặc trang trống.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    canDeleteProduct={false}
                    canManageStock={false}
                    pickerMode
                    selected={selectedProductId === p.id}
                    onPickProduct={(prod) => setSelectedProductId(prod.id)}
                  />
                ))}
              </div>
              {productTotalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2 text-xs text-slate-600">
                  <button
                    type="button"
                    disabled={productPage <= 1}
                    onClick={() => setProductPage((x) => Math.max(1, x - 1))}
                    className="rounded-full border border-slate-200 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Trước
                  </button>
                  <span>
                    Trang {productPage} / {productTotalPages}
                  </span>
                  <button
                    type="button"
                    disabled={productPage >= productTotalPages}
                    onClick={() =>
                      setProductPage((x) => Math.min(productTotalPages, x + 1))
                    }
                    className="rounded-full border border-slate-200 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <Title level={5} className="!mb-4">
            Tạo chiến dịch
          </Title>
          <div className="space-y-4">
            <div>
              <Text className="mb-1 block text-xs font-medium text-slate-600">
                Sản phẩm đã chọn
              </Text>
              <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                {selectedProductId ? (
                  <code className="text-xs">{selectedProductId}</code>
                ) : (
                  <span className="text-slate-400">
                    Chọn một thẻ sản phẩm bên trái
                  </span>
                )}
              </div>
            </div>

            <div>
              <Text className="mb-1 block text-xs font-medium text-slate-600">
                Bắt đầu chiến dịch
              </Text>
              <DatePicker
                showTime
                format="DD/MM/YYYY HH:mm"
                className="w-full"
                value={campaignStartAt}
                onChange={(v) => setCampaignStartAt(v)}
                placeholder="Chọn ngày giờ bắt đầu"
              />
            </div>

            <div>
              <Text className="mb-1 block text-xs font-medium text-slate-600">
                Hết hạn
              </Text>
              <DatePicker
                showTime
                format="DD/MM/YYYY HH:mm"
                className="w-full"
                value={expiredIn}
                onChange={(v) => setExpiredIn(v)}
                placeholder="Chọn ngày giờ kết thúc"
              />
            </div>

            <div>
              <Text className="mb-1 block text-xs font-medium text-slate-600">
                Tổng số lượng flash sale
              </Text>
              <InputNumber
                className="w-full"
                min={1}
                precision={0}
                value={totalQuantity ?? undefined}
                onChange={(v) => setTotalQuantity(v == null ? null : Number(v))}
              />
            </div>

            <div>
              <Text className="mb-1 block text-xs font-medium text-slate-600">
                Giảm giá (%)
              </Text>
              <InputNumber
                className="w-full"
                min={0}
                max={100}
                precision={0}
                value={discount ?? undefined}
                onChange={(v) => setDiscount(v == null ? null : Number(v))}
              />
            </div>

            <Button
              type="primary"
              block
              size="large"
              loading={creating}
              disabled={
                !selectedProductId ||
                !campaignStartAt ||
                !expiredIn ||
                totalQuantity == null ||
                discount == null
              }
              onClick={() => void handleSubmit()}
              className="!bg-emerald-600 hover:!bg-emerald-700"
            >
              Tạo chiến dịch flash sale
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <Title level={5}>Danh sách chiến dịch</Title>
        <Table<ShopownerFlashSaleCampaignRow>
          rowKey={(r) => r.id}
          loading={loadingCampaigns}
          columns={columns}
          dataSource={campaignItems}
          scroll={{ x: "max-content" }}
          pagination={{
            current: campPage,
            pageSize: campPageSize,
            total: campaignTotal,
            showSizeChanger: true,
            pageSizeOptions: [5, 10, 20],
            onChange: (p, ps) => {
              setCampPage(p);
              if (ps != null) setCampPageSize(ps);
            },
          }}
        />
      </section>
    </div>
  );
};
