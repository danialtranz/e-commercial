import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/postgres";

/// co khi can them bang tenant vao
// de quan ly cacs shop.

/**
 * User
 */
export interface UserAttributes {
  id: string;
  email: string | null;
  username: string | null;
  password: string | null;
  phoneNumber: string | null;
  name: string | null;
  avatar: string | null;
  provider: string | null; // google | local
  role: string | null; // collaborator | user | shopowner
  status: string | null;
}

export type UserCreationAttributes = Optional<UserAttributes, "id">;

export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: string;
  public email!: string | null;
  public username!: string | null;
  public password!: string | null;
  public phoneNumber!: string | null;
  public name!: string | null;
  public avatar!: string | null;
  public provider!: string | null;
  public role!: string | null;
  public status!: string | null;
}

User.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "phone_number",
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    provider: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "google",
    },
    role: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "collaborator | user | shopowner",
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
  },
);

/**
 * Category
 */
export interface CategoryAttributes {
  id: string;
  /** Chủ sở hữu danh mục trong shop; `null` = danh mục hệ thống / admin */
  shopId: string | null;
  name: string | null;
  description: string | null;
  status: string | null;
}

export type CategoryCreationAttributes = Optional<CategoryAttributes, "id">;

export class Category
  extends Model<CategoryAttributes, CategoryCreationAttributes>
  implements CategoryAttributes
{
  public id!: string;
  public shopId!: string | null;
  public name!: string | null;
  public description!: string | null;
  public status!: string | null;
}

Category.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    shopId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Category",
    tableName: "categories",
  },
);

/**
 * Product
 */
export interface ProductAttributes {
  id: string;
  categoryId: string | null;
  shopId: string | null;
  name: string | null;
  description: string | null;
  price: number | null;
  image: string | null;
  stock: number | null;
  status: string | null;
}

export type ProductCreationAttributes = Optional<ProductAttributes, "id">;

export class Product
  extends Model<ProductAttributes, ProductCreationAttributes>
  implements ProductAttributes
{
  public id!: string;
  public categoryId!: string | null;
  public shopId!: string | null;
  public name!: string | null;
  public description!: string | null;
  public price!: number | null;
  public image!: string | null;
  public stock!: number | null;
  public status!: string | null;
}

Product.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    categoryId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shopId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    image: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Product",
    tableName: "products",
  },
);

Product.belongsTo(Category, { foreignKey: "categoryId", as: "category" });
Category.hasMany(Product, { foreignKey: "categoryId" });

/**
 * StockDetail — chi tiết biến động tồn kho (theo từng sản phẩm)
 */
export interface StockDetailAttributes {
  id: string;
  productId: string;
  quantity: number | null;
  reason: string | null;
  remain: number | null;
}

export type StockDetailCreationAttributes = Optional<
  StockDetailAttributes,
  "id"
>;

export class StockDetail
  extends Model<StockDetailAttributes, StockDetailCreationAttributes>
  implements StockDetailAttributes
{
  public id!: string;
  public productId!: string;
  public quantity!: number | null;
  public reason!: string | null;
  public remain!: number | null;
}

StockDetail.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    remain: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "StockDetail",
    tableName: "stock_detail",
  },
);

StockDetail.belongsTo(Product, { foreignKey: "productId", as: "product" });
Product.hasMany(StockDetail, { foreignKey: "productId", as: "stockDetails" });

/**
 * Cart
 */
export interface CartAttributes {
  id: string;
  userId: string | null;
  status: string | null; // active | ordered
}

export type CartCreationAttributes = Optional<CartAttributes, "id">;

export class Cart
  extends Model<CartAttributes, CartCreationAttributes>
  implements CartAttributes
{
  public id!: string;
  public userId!: string | null;
  public status!: string | null;
}

Cart.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "active | ordered",
    },
  },
  {
    sequelize,
    modelName: "Cart",
    tableName: "carts",
  },
);

/**
 * CartItem
 */
export interface CartItemAttributes {
  id: string;
  cartId: string | null;
  productId: string | null;
  quantity: number | null;
  price: number | null;
  status: string | null;
}

export type CartItemCreationAttributes = Optional<CartItemAttributes, "id">;

export class CartItem
  extends Model<CartItemAttributes, CartItemCreationAttributes>
  implements CartItemAttributes
{
  public id!: string;
  public cartId!: string | null;
  public productId!: string | null;
  public quantity!: number | null;
  public price!: number | null;
  public status!: string | null;
}

CartItem.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    cartId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    productId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "CartItem",
    tableName: "cart_items",
  },
);

/**
 * Order
 */
export interface OrderAttributes {
  id: string;
  userId: string | null;
  totalPrice: number | null;
  address: string | null;
  note: string | null;
  status: string | null; // pending | paid | shipping | done | cancelled
}

export type OrderCreationAttributes = Optional<OrderAttributes, "id">;

export class Order
  extends Model<OrderAttributes, OrderCreationAttributes>
  implements OrderAttributes
{
  public id!: string;
  public userId!: string | null;
  public totalPrice!: number | null;
  public address!: string | null;
  public note!: string | null;
  public status!: string | null;
}

Order.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    totalPrice: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "pending | paid | shipping | done | cancelled",
    },
  },
  {
    sequelize,
    modelName: "Order",
    tableName: "orders",
  },
);

/**
 * OrderItem
 */
export interface OrderItemAttributes {
  id: string;
  orderId: string | null;
  productId: string | null;
  quantity: number | null;
  price: number | null;
  status: string | null;
}

export type OrderItemCreationAttributes = Optional<OrderItemAttributes, "id">;

export class OrderItem
  extends Model<OrderItemAttributes, OrderItemCreationAttributes>
  implements OrderItemAttributes
{
  public id!: string;
  public orderId!: string | null;
  public productId!: string | null;
  public quantity!: number | null;
  public price!: number | null;
  public status!: string | null;
}

OrderItem.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    productId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "OrderItem",
    tableName: "order_items",
  },
);

/**
 * Payment
 */
export interface PaymentAttributes {
  id: string;
  orderId: string | null;
  method: string | null; // cod | momo | vnpay
  amount: number | null;
  status: string | null; // pending | success | failed
}

export type PaymentCreationAttributes = Optional<PaymentAttributes, "id">;

export class Payment
  extends Model<PaymentAttributes, PaymentCreationAttributes>
  implements PaymentAttributes
{
  public id!: string;
  public orderId!: string | null;
  public method!: string | null;
  public amount!: number | null;
  public status!: string | null;
}

Payment.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    method: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "cod | momo | vnpay",
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "pending | success | failed",
    },
  },
  {
    sequelize,
    modelName: "Payment",
    tableName: "payments",
  },
);

/**
 * ShopInfo
 */
export interface ShopInfoAttributes {
  id: string;
  userId: string;
  title: string | null;
  content: string | null;
  status: string | null;
}

export type ShopInfoCreationAttributes = Optional<ShopInfoAttributes, "id">;

export class ShopInfo
  extends Model<ShopInfoAttributes, ShopInfoCreationAttributes>
  implements ShopInfoAttributes
{
  public id!: string;
  public userId!: string;
  public title!: string | null;
  public content!: string | null;
  public status!: string | null;
}

ShopInfo.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "ShopInfo",
    tableName: "shop_infos",
  },
);

/**
 * Policy
 */
export interface PolicyAttributes {
  id: string;
  /** Owning shop for this policy; `null` = system / global policy */
  shopId: string | null;
  title: string | null;
  content: string | null;
  status: string | null;
}

export type PolicyCreationAttributes = Optional<PolicyAttributes, "id">;

export class Policy
  extends Model<PolicyAttributes, PolicyCreationAttributes>
  implements PolicyAttributes
{
  public id!: string;
  public shopId!: string | null;
  public title!: string | null;
  public content!: string | null;
  public status!: string | null;
}

Policy.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    shopId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Policy",
    tableName: "policies",
  },
);

/**
 * Conversation
 */
export interface ConversationAttributes {
  id: string;
  userId: string | null;
  shopId: string | null;
  status: string | null;
}

export type ConversationCreationAttributes = Optional<
  ConversationAttributes,
  "id"
>;

export class Conversation
  extends Model<ConversationAttributes, ConversationCreationAttributes>
  implements ConversationAttributes
{
  public id!: string;
  public userId!: string | null;
  public shopId!: string | null;
  public status!: string | null;
}

Conversation.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shopId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Conversation",
    tableName: "conversations",
  },
);

/**
 * Message
 */
export interface MessageAttributes {
  id: string;
  conversationId: string | null;
  userQuestion: string | null;
  botResponse: string | null;
  status: string | null;
  /** Auto-increment integer; DB column `"order"`. */
  order: number;
}

export type MessageCreationAttributes = Optional<
  MessageAttributes,
  "id" | "order"
>;

export class Message
  extends Model<MessageAttributes, MessageCreationAttributes>
  implements MessageAttributes
{
  public id!: string;
  public conversationId!: string | null;
  public userQuestion!: string | null;
  public botResponse!: string | null;
  public order!: number;
  public status!: string | null;
}

Message.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      field: "order",
    },
    conversationId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userQuestion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    botResponse: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Message",
    tableName: "messages",
  },
);

/**
 * Advertisement — quảng cáo / banner
 */
export interface AdvertisementAttributes {
  id: string;
  image: string | null;
  status: string | null;
}

export type AdvertisementCreationAttributes = Optional<
  AdvertisementAttributes,
  "id"
>;

export class Advertisement
  extends Model<AdvertisementAttributes, AdvertisementCreationAttributes>
  implements AdvertisementAttributes
{
  public id!: string;
  public image!: string | null;
  public status!: string | null;
}

Advertisement.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    image: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Advertisement",
    tableName: "advertisements",
  },
);

/**
 * FlashSaleCampaign — chiến dịch flash sale theo sản phẩm
 */
export interface FlashSaleCampaignAttributes {
  id: string;
  productTargetId: string | null;
  campaignStartAt: Date | null;
  expiredIn: Date | null;
  totalQuantity: number | null;
  remainQuantity: number | null;
  discount: number | null;
  /** active | inactive | expired */
  status: string | null;
}

export type FlashSaleCampaignCreationAttributes = Optional<
  FlashSaleCampaignAttributes,
  "id"
>;

export class FlashSaleCampaign
  extends Model<
    FlashSaleCampaignAttributes,
    FlashSaleCampaignCreationAttributes
  >
  implements FlashSaleCampaignAttributes
{
  public id!: string;
  public productTargetId!: string | null;
  public campaignStartAt!: Date | null;
  public expiredIn!: Date | null;
  public totalQuantity!: number | null;
  public remainQuantity!: number | null;
  public discount!: number | null;
  public status!: string | null;
}

FlashSaleCampaign.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    productTargetId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    campaignStartAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expiredIn: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    totalQuantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    remainQuantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    discount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "active | inactive | expired",
    },
  },
  {
    sequelize,
    modelName: "FlashSaleCampaign",
    tableName: "flash_sale_campaigns",
  },
);

/**
 * ProductComment — bình luận / đánh giá theo sản phẩm
 */
export interface ProductCommentAttributes {
  id: string;
  /** Sản phẩm được bình luận */
  productId: string;
  userId: string | null;
  /** Đã mua hàng hay chưa (cột DB: is_bought) */
  isBought: boolean | null;
  /** Nội dung bình luận */
  comment: string | null;
  /** File đính kèm */
  file: string | null;
  /** video hoac image   */
  fileType: string | null;
  /** Đánh giá sao 1–5 */
  star: number | null;
}

export type ProductCommentCreationAttributes = Optional<
  ProductCommentAttributes,
  "id"
>;

export class ProductComment
  extends Model<ProductCommentAttributes, ProductCommentCreationAttributes>
  implements ProductCommentAttributes
{
  public id!: string;
  public productId!: string;
  public userId!: string | null;
  public isBought!: boolean | null;
  public comment!: string | null;
  public file!: string | null;
  public fileType!: string | null;
  public star!: number | null;
}

ProductComment.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isBought: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    file: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fileType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    star: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "ProductComment",
    tableName: "product_comments",
  },
);

ProductComment.belongsTo(Product, { foreignKey: "productId", as: "product" });
Product.hasMany(ProductComment, {
  foreignKey: "productId",
  as: "productComments",
});
ProductComment.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(ProductComment, {
  foreignKey: "userId",
  as: "productComments",
});

/**
 * ShipperAssignment — gán đơn cho shipper / theo dõi giao hàng
 */
export interface ShipperAssignmentAttributes {
  id: string;
  orderId: string | null;
  deliveryAddress: string | null;
  /** assigned | picked_up | delivered | cancelled */
  deliveryStatus: string | null;
  userId: string | null;
  /** Tiền thu hộ (COD), đơn vị đồng như các bảng khác */
  codAmount: number | null;
  assignedAt: Date | null;
  pickedUpAt: Date | null;
  deliveredAt: Date | null;
}

export type ShipperAssignmentCreationAttributes = Optional<
  ShipperAssignmentAttributes,
  "id"
>;

export class ShipperAssignment
  extends Model<
    ShipperAssignmentAttributes,
    ShipperAssignmentCreationAttributes
  >
  implements ShipperAssignmentAttributes
{
  public id!: string;
  public orderId!: string | null;
  public deliveryAddress!: string | null;
  public deliveryStatus!: string | null;
  public userId!: string | null;
  public codAmount!: number | null;
  public assignedAt!: Date | null;
  public pickedUpAt!: Date | null;
  public deliveredAt!: Date | null;
  /** Có khi query kèm `include: [{ model: Order, as: "order" }]` */
  public order?: Order;
}

ShipperAssignment.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    deliveryAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    deliveryStatus: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "assigned | picked_up | delivered | cancelled",
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    codAmount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    assignedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    pickedUpAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "ShipperAssignment",
    tableName: "shipper_assignments",
  },
);

ShipperAssignment.belongsTo(Order, { foreignKey: "orderId", as: "order" });
Order.hasMany(ShipperAssignment, {
  foreignKey: "orderId",
  as: "shipperAssignments",
});
ShipperAssignment.belongsTo(User, { foreignKey: "userId", as: "shipper" });
User.hasMany(ShipperAssignment, {
  foreignKey: "userId",
  as: "shipperAssignments",
});

/**
 * ShipperInfor — thông tin / khu vực hoạt động shipper
 */
export interface ShipperInforAttributes {
  id: string;
  shipperId: string | null;
  shipperZone: string | null;
  status: string | null;
}

export type ShipperInforCreationAttributes = Optional<
  ShipperInforAttributes,
  "id"
>;

export class ShipperInfor
  extends Model<ShipperInforAttributes, ShipperInforCreationAttributes>
  implements ShipperInforAttributes
{
  public id!: string;
  public shipperId!: string | null;
  public shipperZone!: string | null;
  public status!: string | null;
}

ShipperInfor.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    shipperId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    shipperZone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "ShipperInfor",
    tableName: "shipper_infor",
  },
);

ShipperInfor.belongsTo(User, { foreignKey: "shipperId", as: "shipper" });
User.hasMany(ShipperInfor, {
  foreignKey: "shipperId",
  as: "shipperInfors",
});

/**
 * UserCredit — tích điểm / hạng / hệ số nhân cho user
 */
export interface UserCreditAttributes {
  id: string;
  userId: string | null;
  totalCredit: number | null;
  usedCredit: number | null;
  currentMultiply: number | null;
  currentRank: string | null;
}

export type UserCreditCreationAttributes = Optional<UserCreditAttributes, "id">;

export class UserCredit
  extends Model<UserCreditAttributes, UserCreditCreationAttributes>
  implements UserCreditAttributes
{
  public id!: string;
  public userId!: string | null;
  public totalCredit!: number | null;
  public usedCredit!: number | null;
  public currentMultiply!: number | null;
  public currentRank!: string | null;
}

UserCredit.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    totalCredit: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    usedCredit: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    currentMultiply: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    currentRank: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "UserCredit",
    tableName: "user_credits",
  },
);

UserCredit.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(UserCredit, {
  foreignKey: "userId",
  as: "userCredits",
});

/**
 * Voucher — mã giảm giá (active | used)
 */
export interface VoucherAttributes {
  id: string;
  name: string | null;
  discount: number | null;
  /** active | used */
  status: string | null;
}

export type VoucherCreationAttributes = Optional<VoucherAttributes, "id">;

export class Voucher
  extends Model<VoucherAttributes, VoucherCreationAttributes>
  implements VoucherAttributes
{
  public id!: string;
  public name!: string | null;
  public discount!: number | null;
  public status!: string | null;
}

Voucher.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    discount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Số tiền giảm (đồng), áp vào total_price đơn",
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "active | used",
    },
  },
  {
    sequelize,
    modelName: "Voucher",
    tableName: "vouchers",
  },
);

/**
 * UserVoucher — voucher gắn user (tham chiếu vouchers.id)
 */
export interface UserVoucherAttributes {
  id: string;
  userId: string | null;
  voucherId: string | null;
  status: string | null;
}

export type UserVoucherCreationAttributes = Optional<
  UserVoucherAttributes,
  "id"
>;

export class UserVoucher
  extends Model<UserVoucherAttributes, UserVoucherCreationAttributes>
  implements UserVoucherAttributes
{
  public id!: string;
  public userId!: string | null;
  public voucherId!: string | null;
  public status!: string | null;
}

UserVoucher.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    voucherId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "UserVoucher",
    tableName: "user_vouchers",
  },
);

UserVoucher.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(UserVoucher, {
  foreignKey: "userId",
  as: "userVouchers",
});
UserVoucher.belongsTo(Voucher, { foreignKey: "voucherId", as: "voucher" });
Voucher.hasMany(UserVoucher, {
  foreignKey: "voucherId",
  as: "userVouchers",
});

export {
  User as UserModel,
  Category as CategoryModel,
  Product as ProductModel,
  StockDetail as StockDetailModel,
  Cart as CartModel,
  CartItem as CartItemModel,
  Order as OrderModel,
  OrderItem as OrderItemModel,
  Payment as PaymentModel,
  ShopInfo as ShopInfoModel,
  Policy as PolicyModel,
  Conversation as ConversationModel,
  Message as MessageModel,
  Advertisement as AdvertisementModel,
  FlashSaleCampaign as FlashSaleCampaignModel,
  ProductComment as ProductCommentModel,
  ShipperAssignment as ShipperAssignmentModel,
  ShipperInfor as ShipperInforModel,
  UserCredit as UserCreditModel,
  UserVoucher as UserVoucherModel,
  Voucher as VoucherModel,
};
