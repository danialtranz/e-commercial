import "../../config/config";
import { randomUUID } from "crypto";
import { Op } from "sequelize";
import sequelize from "../../config/postgres";
import {
  OrderModel,
  PaymentModel,
  ShipperAssignmentModel,
  ShipperInforModel,
  UserCreditModel,
  UserModel,
} from "../../models/modal";

/** Khu vực giao hàng hợp lệ cho shipper_infor.shipper_zone (khớp checkout I1…I5) */
const SHIPPER_ZONES = ["I1", "I2", "I3", "I4", "I5"] as const;
export type ShipperZoneCode = (typeof SHIPPER_ZONES)[number];

export function isAllowedShipperZone(z: string): z is ShipperZoneCode {
  return (SHIPPER_ZONES as readonly string[]).includes(z);
}

const DELIVERY_STATUSES = [
  "assigned",
  "picked",
  "delivered_at",
  "failed",
] as const;
export type CollaboratorDeliverStatus = (typeof DELIVERY_STATUSES)[number];

export function isCollaboratorDeliverStatus(
  v: string,
): v is CollaboratorDeliverStatus {
  return (DELIVERY_STATUSES as readonly string[]).includes(v);
}

type NormalizedStage = "empty" | CollaboratorDeliverStatus;

function normalizeDeliveryStatus(
  raw: string | null,
): NormalizedStage | "unknown" {
  if (raw == null || raw === "") return "empty";
  if (isCollaboratorDeliverStatus(raw)) return raw;
  return "unknown";
}

function isValidDeliveryTransition(
  current: NormalizedStage,
  next: CollaboratorDeliverStatus,
): boolean {
  if (current === "empty") return next === "assigned";
  if (current === "assigned") return next === "picked";
  if (current === "picked") {
    return next === "delivered_at" || next === "failed";
  }
  return false;
}

type UserCreditRank = "normal" | "sliver" | "gold";

function getRankAndMultiplyByCreditBalance(balance: number): {
  rank: UserCreditRank;
  multiply: number;
} {
  if (balance > 300) {
    return { rank: "gold", multiply: 5 };
  }
  if (balance > 100) {
    return { rank: "sliver", multiply: 3 };
  }
  return { rank: "normal", multiply: 1 };
}

export async function listCollaboratorDeliveries(
  collaboratorUserId: string,
  page: number,
  pageSize: number,
) {
  const currentPage = Number.isInteger(page) && page > 0 ? page : 1;
  const currentPageSize =
    Number.isInteger(pageSize) && pageSize > 0 ? pageSize : 10;
  const offset = (currentPage - 1) * currentPageSize;

  const { rows: assignments, count: total } =
    await ShipperAssignmentModel.findAndCountAll({
      where: { userId: collaboratorUserId },
      include: [
        {
          model: OrderModel,
          as: "order",
          required: false,
        },
      ],
      order: [["updatedAt", "DESC"]],
      offset,
      limit: currentPageSize,
    });

  const customerIds = [
    ...new Set(
      assignments
        .map((a) => a.order?.userId)
        .filter((id): id is string => typeof id === "string" && id !== ""),
    ),
  ];

  const customers =
    customerIds.length > 0
      ? await UserModel.findAll({
          where: { id: { [Op.in]: customerIds } },
        })
      : [];

  const customerById = new Map(customers.map((u) => [u.id, u]));

  const items = assignments.map((a) => {
    const order = a.order;
    const customerUserId = order?.userId ?? null;
    const customer =
      customerUserId && customerById.has(customerUserId)
        ? customerById.get(customerUserId)!.get({ plain: true })
        : null;

    const assignmentPlain = a.get({ plain: true }) as unknown as Record<
      string,
      unknown
    >;
    const { order: _nested, ...assignmentFields } = assignmentPlain;

    return {
      assignment: assignmentFields,
      order: order ? order.get({ plain: true }) : null,
      customerUser: customer,
    };
  });

  return {
    code: 200,
    msg: "Get my deliveries successfully",
    data: {
      items,
      pagination: {
        page: currentPage,
        page_size: currentPageSize,
        total,
      },
    },
  };
}

export async function updateCollaboratorDeliveryStatus(
  collaboratorUserId: string,
  shipperAssignmentId: string,
  deliverStatus: CollaboratorDeliverStatus,
) {
  return sequelize.transaction(async (transaction) => {
    const row = await ShipperAssignmentModel.findOne({
      where: { id: shipperAssignmentId, userId: collaboratorUserId },
      transaction,
      lock: true,
    });

    if (!row) {
      return {
        code: 404,
        msg: "Shipper assignment not found",
        data: null,
      };
    }

    const currentNorm = normalizeDeliveryStatus(row.deliveryStatus);
    if (currentNorm === "unknown") {
      return {
        code: 400,
        msg: "Assignment has an unrecognized delivery status; cannot update",
        data: null,
      };
    }

    /**
     * Luồng: (trống) → assigned → picked → delivered_at | failed.
     * `failed` chỉ được chọn khi đang ở `picked`.
     */
    if (!isValidDeliveryTransition(currentNorm, deliverStatus)) {
      return {
        code: 400,
        msg: "Invalid delivery status transition (flow: assigned → picked → delivered_at | failed)",
        data: null,
      };
    }

    const now = new Date();
    const patch: {
      deliveryStatus: string;
      assignedAt?: Date;
      pickedUpAt?: Date;
      deliveredAt?: Date;
    } = { deliveryStatus: deliverStatus };

    if (deliverStatus === "assigned") {
      patch.assignedAt = now;
    } else if (deliverStatus === "picked") {
      patch.pickedUpAt = now;
    } else if (deliverStatus === "delivered_at") {
      patch.deliveredAt = now;

      const order = row.orderId
        ? await OrderModel.findByPk(row.orderId, { transaction, lock: true })
        : null;

      if (order?.id) {
        const codPayment = await PaymentModel.findOne({
          where: {
            orderId: order.id,
            method: "cod",
            status: "waiting",
          },
          order: [["updatedAt", "DESC"]],
          transaction,
          lock: true,
        });

        if (codPayment) {
          await codPayment.update({ status: "success" }, { transaction });
        }
      }

      if (order?.userId) {
        let userCredit = await UserCreditModel.findOne({
          where: { userId: order.userId },
          order: [["updatedAt", "DESC"]],
          transaction,
          lock: true,
        });

        if (!userCredit) {
          userCredit = await UserCreditModel.create(
            {
              id: randomUUID(),
              userId: order.userId,
              totalCredit: 0,
              usedCredit: 0,
              currentRank: "normal",
              currentMultiply: 1,
            },
            { transaction },
          );
        }

        const totalCredit = userCredit.totalCredit ?? 0;
        const usedCredit = userCredit.usedCredit ?? 0;
        const currentMultiply = userCredit.currentMultiply ?? 1;
        const orderValue = order.totalPrice ?? 0;
        const earnedCredit = Math.max(0, Math.floor(orderValue * currentMultiply));
        const nextTotalCredit = totalCredit + earnedCredit;
        const balance = nextTotalCredit + usedCredit;
        const { rank, multiply } = getRankAndMultiplyByCreditBalance(balance);

        await userCredit.update(
          {
            totalCredit: nextTotalCredit,
            currentRank: rank,
            currentMultiply: multiply,
          },
          { transaction },
        );
      }
    } else if (deliverStatus === "failed") {
      const order = row.orderId
        ? await OrderModel.findByPk(row.orderId, { transaction, lock: true })
        : null;

      if (order?.id) {
        await order.update({ status: "failed" }, { transaction });
      }
    }

    await row.update(patch, { transaction });

    return {
      code: 200,
      msg: "Delivery status updated successfully",
      data: { assignment: row.get({ plain: true }) },
    };
  });
}

/**
 * Tạo hoặc cập nhật một dòng shipper_infor theo collaborator (shipperId = user id).
 */
/**
 * Lấy thông tin user (collaborator) và shipper_infor theo JWT id.
 */
export async function getCollaboratorCollaInfo(collaboratorUserId: string) {
  const user = await UserModel.findByPk(collaboratorUserId);
  if (!user) {
    return {
      code: 404,
      msg: "User not found",
      data: null,
    };
  }

  const shipperInfor = await ShipperInforModel.findOne({
    where: { shipperId: collaboratorUserId },
    order: [["updatedAt", "DESC"]],
  });

  return {
    code: 200,
    msg: "Get collaborator info successfully",
    data: {
      user: user.get({ plain: true }),
      shipper_infor: shipperInfor
        ? shipperInfor.get({ plain: true })
        : null,
    },
  };
}

export async function upsertCollaboratorShipperInfor(
  collaboratorUserId: string,
  shipperZone: ShipperZoneCode,
) {
  const existing = await ShipperInforModel.findOne({
    where: { shipperId: collaboratorUserId },
    order: [["updatedAt", "DESC"]],
  });

  if (existing) {
    await existing.update({ shipperZone });
    await existing.reload();
    return {
      code: 200,
      msg: "Shipper info updated successfully",
      data: { shipper_infor: existing.get({ plain: true }) },
    };
  }

  const created = await ShipperInforModel.create({
    id: randomUUID(),
    shipperId: collaboratorUserId,
    shipperZone,
    status: "active",
  });

  return {
    code: 200,
    msg: "Shipper info created successfully",
    data: { shipper_infor: created.get({ plain: true }) },
  };
}
