"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Button, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  useListShopownerAdvertisements,
  useUpdateShopownerAdvertisementStatus,
  useUploadShopownerAdvertisement,
} from "@/hooks/shopowner/useShopOwnerHook";
import type { ShopownerAdvertisementRow } from "@/services/shopowner/shopownerAdvertisementService";
import {
  AdvertisementLargePreview,
  AdvertisementThumb,
} from "@/components/managerAdCamp";

const { Title, Text, Paragraph } = Typography;

export const ManagerAdvCampView = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [file, setFile] = useState<File | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { advertisements, loading, refetch } = useListShopownerAdvertisements({
    page,
    page_size: pageSize,
  });

  const { uploadAdvertisement, loading: uploading } =
    useUploadShopownerAdvertisement();
  const { updateAdvertisementStatus } = useUpdateShopownerAdvertisementStatus();

  const items = advertisements?.items ?? [];
  const total = advertisements?.pagination?.total ?? 0;

  const activeRow = useMemo(
    () =>
      (advertisements?.items ?? []).find((r) => r.status === "active") ?? null,
    [advertisements]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      setFile(f ?? null);
    },
    []
  );

  const handleCreate = useCallback(async () => {
    if (!file) return;
    const result = await uploadAdvertisement({ file });
    if (result.ok) {
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      void refetch();
    }
  }, [file, uploadAdvertisement, refetch]);

  const handleStatus = useCallback(
    async (row: ShopownerAdvertisementRow, status: "active" | "inactive") => {
      setUpdatingId(row.id);
      try {
        const result = await updateAdvertisementStatus({
          advId: row.id,
          status,
        });
        if (result.ok) {
          void refetch();
        }
      } finally {
        setUpdatingId(null);
      }
    },
    [updateAdvertisementStatus, refetch]
  );

  const columns: ColumnsType<ShopownerAdvertisementRow> = useMemo(
    () => [
      {
        title: "Xem nhanh",
        dataIndex: "image",
        key: "preview",
        width: 120,
        render: (image: string) => <AdvertisementThumb image={image} />,
      },
      {
        title: "ID",
        dataIndex: "id",
        key: "id",
        ellipsis: true,
        render: (id: string) => (
          <code className="text-xs text-slate-600">{id}</code>
        ),
      },
      {
        title: "Loại",
        key: "type",
        width: 88,
        render: (_: unknown, record) => {
          const isVid =
            typeof record.image === "string" &&
            record.image.startsWith("/videos/");
          return (
            <Tag color={isVid ? "purple" : "blue"}>
              {isVid ? "Video" : "Ảnh"}
            </Tag>
          );
        },
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 100,
        render: (status: string) => (
          <Tag color={status === "active" ? "green" : "default"}>
            {status === "active" ? "active" : "inactive"}
          </Tag>
        ),
      },
      {
        title: "Tạo lúc",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 160,
        render: (v: string | undefined) =>
          v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "—",
      },
      {
        title: "Thao tác",
        key: "actions",
        width: 200,
        render: (_: unknown, record) => {
          const busy = updatingId === record.id;
          return (
            <div className="flex flex-wrap gap-1">
              <Button
                type="primary"
                size="small"
                disabled={record.status === "active" || busy}
                loading={busy}
                onClick={() => void handleStatus(record, "active")}
              >
                Active
              </Button>
              <Button
                size="small"
                disabled={record.status === "inactive" || busy}
                loading={busy}
                onClick={() => void handleStatus(record, "inactive")}
              >
                Inactive
              </Button>
            </div>
          );
        },
      },
    ],
    [handleStatus, updatingId]
  );

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 via-white to-slate-100 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-[1400px]">
        <header className="mb-6">
          <Title level={3} className="mb-1!">
            Quản lý quảng cáo
          </Title>
          <Paragraph type="secondary" className="mb-0! max-w-2xl">
            Tải lên ảnh hoặc video làm chiến dịch quảng cáo. Chỉ một mục{" "}
            <Tag color="green">active</Tag> tại một thời điểm; nội dung đang
            active hiển thị trên toàn site (banner ảnh hoặc video góc màn hình).
          </Paragraph>
        </header>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Trái 60% */}
          <section className="w-full min-w-0 flex-[0_0_100%] space-y-6 lg:flex-[0_0_60%]">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <Title level={5} className="mt-0!">
                Tạo quảng cáo mới
              </Title>
              <Text type="secondary" className="text-sm">
                Chọn file ảnh (JPEG, PNG, …) hoặc video (MP4, WebM, …). Một bản
                ghi mới sẽ ở trạng thái active và các bản active khác chuyển
                sang inactive.
              </Text>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    File
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                    onChange={handleFileChange}
                    className="block w-full cursor-pointer text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-500 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-sky-600"
                  />
                  {file && (
                    <Text className="mt-2 block truncate text-xs text-slate-500">
                      Đã chọn: {file.name} (
                      {(file.size / (1024 * 1024)).toFixed(2)} MB)
                    </Text>
                  )}
                </div>
                <Button
                  type="primary"
                  size="large"
                  loading={uploading}
                  disabled={!file}
                  onClick={() => void handleCreate()}
                >
                  Tạo quảng cáo
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-2">
                <Title level={5} className="mb-0!">
                  Danh sách quảng cáo
                </Title>
                <Button size="small" onClick={() => void refetch()}>
                  Làm mới
                </Button>
              </div>
              <Table<ShopownerAdvertisementRow>
                rowKey="id"
                loading={loading}
                columns={columns}
                dataSource={items}
                pagination={{
                  current: page,
                  pageSize,
                  total,
                  showSizeChanger: true,
                  pageSizeOptions: [5, 10, 20],
                  onChange: (p, ps) => {
                    setPage(p);
                    setPageSize(ps);
                  },
                }}
                scroll={{ x: 720 }}
                size="middle"
              />
            </div>
          </section>

          {/* Phải 40% */}
          <aside className="w-full min-w-0 flex-[0_0_100%] lg:sticky lg:top-24 lg:flex-[0_0_40%] lg:self-start">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <Title level={5} className="mt-0!">
                Xem trước đang active
              </Title>
              <Text type="secondary" className="text-sm">
                Giống người dùng thấy trên site: ảnh = banner dưới header; video
                = ô góc dưới trái.
              </Text>
              <div className="mt-4">
                <AdvertisementLargePreview row={activeRow} />
              </div>
              {activeRow && (
                <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <div>
                    <span className="font-medium">ID:</span>{" "}
                    <code>{activeRow.id}</code>
                  </div>
                  <div className="mt-1">
                    <span className="font-medium">Cập nhật:</span>{" "}
                    {activeRow.updatedAt
                      ? dayjs(activeRow.updatedAt).format("DD/MM/YYYY HH:mm")
                      : "—"}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
