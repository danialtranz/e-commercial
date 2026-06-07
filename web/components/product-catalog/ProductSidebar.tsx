"use client";

import React from "react";
import { ChevronRight } from "lucide-react";
import { useGetPublicCategories } from "@/hooks/shopowner/useShopOwnerHook";

export type ProductSidebarProps = {
  selectedCategoryName: string | null;
  onSelectCategory: (name: string | null) => void;
};

export default function ProductSidebar({
  selectedCategoryName,
  onSelectCategory,
}: ProductSidebarProps) {
  const { categories, loading } = useGetPublicCategories();

  return (
    <aside className="hidden w-[260px] shrink-0 lg:block">
      <div className="flex items-center gap-2 rounded-t bg-organic px-5 py-3.5 text-[13px] font-bold uppercase tracking-wider text-white">
        <span>Danh mục sản phẩm</span>
      </div>
      <div className="overflow-hidden rounded-b border-x border-b border-gray-200 bg-white">
        <ul className="divide-y divide-gray-100">
          <li className="group">
            <button
              type="button"
              onClick={() => onSelectCategory(null)}
              className={`flex w-full items-center justify-between px-5 py-3 text-left text-sm transition-all hover:bg-gray-50 hover:text-organic ${
                selectedCategoryName == null
                  ? "bg-emerald-50/80 font-medium text-organic"
                  : "text-gray-600"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    selectedCategoryName == null
                      ? "bg-organic"
                      : "bg-gray-300 group-hover:bg-organic"
                  }`}
                />
                <span>Tất cả danh mục</span>
              </div>
              <ChevronRight
                size={14}
                className="text-gray-300 transition-all group-hover:translate-x-1 group-hover:text-organic"
              />
            </button>
          </li>

          {loading ? (
            <li className="px-5 py-4 text-sm text-slate-400">Đang tải…</li>
          ) : categories.length === 0 ? (
            <li className="px-5 py-4 text-sm text-slate-500">
              Chưa có danh mục.
            </li>
          ) : (
            categories.map((cat) => {
              const label = cat.name?.trim() || "—";
              const isActive = selectedCategoryName === label;
              return (
                <li key={cat.id} className="group">
                  <button
                    type="button"
                    onClick={() => onSelectCategory(label)}
                    className={`flex w-full items-center justify-between px-5 py-3 text-left text-sm transition-all hover:bg-gray-50 hover:text-organic ${
                      isActive
                        ? "bg-emerald-50/80 font-medium text-organic"
                        : "text-gray-600"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${
                          isActive
                            ? "bg-organic"
                            : "bg-gray-300 group-hover:bg-organic"
                        }`}
                      />
                      <span className="truncate">{label}</span>
                    </div>
                    <ChevronRight
                      size={14}
                      className="shrink-0 text-gray-300 transition-all group-hover:translate-x-1 group-hover:text-organic"
                    />
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>

      <div className="group mt-8 overflow-hidden rounded shadow-md">
        <img
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80"
          alt="Ad"
          className="h-80 w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="bg-organic-dark p-4 text-white">
          <p className="text-center text-sm font-bold">ƯU ĐÃI ĐẾN 30%</p>
          <p className="mt-1 text-center text-[10px] uppercase opacity-80">
            Dành cho khách hàng mới
          </p>
        </div>
      </div>
    </aside>
  );
}
