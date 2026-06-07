"use client";

import type { ShopCategory, ShopProduct } from "@/interface/shop";
import {
  adminCreateCategory,
  adminCreateProduct,
  adminDeleteCategory,
  adminDeleteProduct,
  adminListCategories,
  adminListProducts,
  adminUpdateCategory,
  adminUpdateProduct,
} from "@/services/user/shopService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tabs,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

function isAdminRole(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem("userInfo");
    if (!raw) return false;
    const u = JSON.parse(raw) as { role?: string };
    return String(u?.role).toLowerCase() === "admin";
  } catch {
    return false;
  }
}

function formatPrice(v: number | null | undefined) {
  if (v == null) return "—";
  return `${v.toLocaleString("vi-VN")} ₫`;
}

const AdminShopView: React.FC = () => {
  const router = useRouter();
  const qc = useQueryClient();
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [prodModalOpen, setProdModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ShopCategory | null>(
    null
  );
  const [editingProduct, setEditingProduct] = useState<ShopProduct | null>(
    null
  );
  const [catForm] = Form.useForm();
  const [prodForm] = Form.useForm();

  useEffect(() => {
    if (!isAdminRole()) {
      router.replace("/shop-owner-login");
    }
  }, [router]);

  const { data: products = [], isLoading: lp } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: adminListProducts,
    enabled: isAdminRole(),
  });

  const { data: catResponse, isLoading: lc } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const res = await adminListCategories(1, 200);
      return res.data?.data;
    },
    enabled: isAdminRole(),
  });

  const categories = catResponse?.items ?? [];

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["admin", "products"] });
    qc.invalidateQueries({ queryKey: ["admin", "categories"] });
    qc.invalidateQueries({ queryKey: ["shop", "catalog"] });
  };

  const saveCat = useMutation({
    mutationFn: async (v: {
      name?: string;
      description?: string;
      status?: string;
    }) => {
      if (editingCategory) {
        return adminUpdateCategory(editingCategory.id, v);
      }
      return adminCreateCategory(v);
    },
    onSuccess: (res) => {
      const c = res.data?.code;
      if (c === 0 || c === 200) {
        message.success("Đã lưu danh mục");
        setCatModalOpen(false);
        setEditingCategory(null);
        catForm.resetFields();
        invalidateAll();
      } else {
        message.error(res.data?.msg || "Lỗi lưu danh mục");
      }
    },
    onError: () => message.error("Lỗi mạng"),
  });

  const delCat = useMutation({
    mutationFn: (id: string) => adminDeleteCategory(id),
    onSuccess: (res) => {
      const c = res.data?.code;
      if (c === 0 || c === 200) {
        message.success("Đã xóa");
        invalidateAll();
      } else message.error(res.data?.msg || "Lỗi xóa");
    },
  });

  const saveProd = useMutation({
    mutationFn: async (v: Record<string, unknown>) => {
      if (editingProduct) {
        return adminUpdateProduct(editingProduct.id, v);
      }
      return adminCreateProduct(
        v as {
          name: string;
          price: number;
          stock: number;
          categoryId?: string | null;
          description?: string | null;
          image?: string | null;
          status?: string;
        }
      );
    },
    onSuccess: (res) => {
      const c = res.data?.code;
      if (c === 0 || c === 200) {
        message.success("Đã lưu sản phẩm");
        setProdModalOpen(false);
        setEditingProduct(null);
        prodForm.resetFields();
        invalidateAll();
      } else {
        message.error(
          res.data?.msg ||
            (res.data as { data?: { message?: string } })?.data?.message ||
            "Lỗi lưu sản phẩm"
        );
      }
    },
    onError: () => message.error("Lỗi mạng"),
  });

  const delProd = useMutation({
    mutationFn: (id: string) => adminDeleteProduct(id),
    onSuccess: (res) => {
      const c = res.data?.code;
      if (c === 0 || c === 200) {
        message.success("Đã xóa");
        invalidateAll();
      } else message.error(res.data?.msg || "Lỗi xóa");
    },
  });

  const openNewCategory = () => {
    setEditingCategory(null);
    catForm.resetFields();
    catForm.setFieldsValue({ status: "active" });
    setCatModalOpen(true);
  };

  const openEditCategory = (row: ShopCategory) => {
    setEditingCategory(row);
    catForm.setFieldsValue({
      name: row.name,
      description: row.description,
      status: row.status || "active",
    });
    setCatModalOpen(true);
  };

  const openNewProduct = () => {
    setEditingProduct(null);
    prodForm.resetFields();
    prodForm.setFieldsValue({ status: "active", price: 0, stock: 0 });
    setProdModalOpen(true);
  };

  const openEditProduct = (row: ShopProduct) => {
    setEditingProduct(row);
    prodForm.setFieldsValue({
      name: row.name,
      description: row.description,
      price: row.price,
      stock: row.stock,
      categoryId: row.categoryId || undefined,
      image: row.image,
      status: row.status || "active",
    });
    setProdModalOpen(true);
  };

  const catColumns: ColumnsType<ShopCategory> = [
    { title: "Tên", dataIndex: "name", key: "name" },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    { title: "Trạng thái", dataIndex: "status", key: "status", width: 110 },
    {
      title: "",
      key: "actions",
      width: 160,
      render: (_, row) => (
        <Space>
          <Button size="small" onClick={() => openEditCategory(row)}>
            Sửa
          </Button>
          <Popconfirm
            title="Xóa danh mục?"
            onConfirm={() => delCat.mutate(row.id)}
          >
            <Button size="small" danger>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const prodColumns: ColumnsType<ShopProduct> = [
    { title: "Tên", dataIndex: "name", key: "name", width: 200 },
    {
      title: "Giá",
      dataIndex: "price",
      key: "price",
      width: 120,
      render: (v) => formatPrice(v),
    },
    { title: "Tồn", dataIndex: "stock", key: "stock", width: 80 },
    {
      title: "Danh mục",
      dataIndex: "categoryId",
      key: "categoryId",
      width: 200,
      ellipsis: true,
      render: (id: string | null) =>
        categories.find((c) => c.id === id)?.name || id || "—",
    },
    { title: "TT", dataIndex: "status", key: "status", width: 90 },
    {
      title: "",
      key: "a",
      width: 160,
      render: (_, row) => (
        <Space>
          <Button size="small" onClick={() => openEditProduct(row)}>
            Sửa
          </Button>
          <Popconfirm
            title="Xóa sản phẩm?"
            onConfirm={() => delProd.mutate(row.id)}
          >
            <Button size="small" danger>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (!isAdminRole()) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
        Đang kiểm tra quyền…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý cửa hàng</h1>
        <p className="mt-1 text-sm text-slate-600">
          Danh mục và sản phẩm (API admin — JWT).
        </p>

        <Tabs
          className="mt-6"
          items={[
            {
              key: "products",
              label: "Sản phẩm",
              children: (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex justify-end">
                    <Button type="primary" onClick={openNewProduct}>
                      + Thêm sản phẩm
                    </Button>
                  </div>
                  <Table<ShopProduct>
                    rowKey="id"
                    loading={lp}
                    columns={prodColumns}
                    dataSource={products}
                    scroll={{ x: 900 }}
                  />
                </div>
              ),
            },
            {
              key: "categories",
              label: "Danh mục",
              children: (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex justify-end">
                    <Button type="primary" onClick={openNewCategory}>
                      + Thêm danh mục
                    </Button>
                  </div>
                  <Table<ShopCategory>
                    rowKey="id"
                    loading={lc}
                    columns={catColumns}
                    dataSource={categories}
                  />
                </div>
              ),
            },
          ]}
        />
      </div>

      <Modal
        title={editingCategory ? "Sửa danh mục" : "Danh mục mới"}
        open={catModalOpen}
        onCancel={() => {
          setCatModalOpen(false);
          setEditingCategory(null);
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={catForm}
          layout="vertical"
          onFinish={(v) => saveCat.mutate(v)}
          className="mt-2"
        >
          <Form.Item name="name" label="Tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái">
            <Select
              options={[
                { value: "active", label: "active" },
                { value: "inactive", label: "inactive" },
              ]}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saveCat.isPending}>
            Lưu
          </Button>
        </Form>
      </Modal>

      <Modal
        title={editingProduct ? "Sửa sản phẩm" : "Sản phẩm mới"}
        open={prodModalOpen}
        onCancel={() => {
          setProdModalOpen(false);
          setEditingProduct(null);
        }}
        footer={null}
        width={560}
        destroyOnClose
      >
        <Form
          form={prodForm}
          layout="vertical"
          onFinish={(v) => saveProd.mutate(v)}
          className="mt-2"
        >
          <Form.Item name="name" label="Tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="price"
            label="Giá (₫)"
            rules={[{ required: true, type: "number", min: 0 }]}
          >
            <InputNumber className="w-full" min={0} />
          </Form.Item>
          <Form.Item
            name="stock"
            label="Tồn kho"
            rules={[{ required: true, type: "number", min: 0 }]}
          >
            <InputNumber className="w-full" min={0} />
          </Form.Item>
          <Form.Item name="categoryId" label="Danh mục">
            <Select
              allowClear
              placeholder="Chọn danh mục"
              options={categories.map((c) => ({
                value: c.id,
                label: c.name || c.id,
              }))}
            />
          </Form.Item>
          <Form.Item name="image" label="URL ảnh">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái">
            <Select
              options={[
                { value: "active", label: "active" },
                { value: "inactive", label: "inactive" },
              ]}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saveProd.isPending}>
            Lưu
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminShopView;
