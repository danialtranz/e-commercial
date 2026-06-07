/** Khớp Sequelize model Product (camelCase JSON) */
export interface ShopProduct {
  id: string;
  categoryId: string | null;
  name: string | null;
  description: string | null;
  price: number | null;
  image: string | null;
  stock: number | null;
  status: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShopCategory {
  id: string;
  name: string | null;
  description: string | null;
  status: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiEnvelope<T> {
  code: number;
  msg: string;
  data: T;
}

export interface PaginationInfo {
  page: number;
  page_size: number;
  total: number;
}

// "Shop" dùng cho endpoint /v1/user/shops (mirror theo backend)
export interface UserShop {
  id: string;
  userId: string | null;
  title: string;
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserShopsData {
  items: UserShop[];
  pagination: PaginationInfo;
}

export interface UserProduct {
  id: string;
  shopId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
  stock: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    shopId: string;
    name: string;
    description: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  flash_sale_campaign?: {
    id: string;
    productTargetId: string | null;
    campaignStartAt: string | null;
    expiredIn: string | null;
    totalQuantity: number | null;
    remainQuantity: number | null;
    discount: number | null;
    status: string | null;
    createdAt?: string;
    updatedAt?: string;
  } | null;
  /** Có khi sort `best-seller` (public/product-sort) */
  sold_quantity?: number | null;
  bestseller_label?: string | null;
  [key: string]: unknown;
}

export interface UserProductsData {
  items: UserProduct[];
  pagination: PaginationInfo;
}
