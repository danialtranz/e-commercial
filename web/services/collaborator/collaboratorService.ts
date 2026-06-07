import api from "@/apis/endpoint";
import type { ApiEnvelope, PaginationInfo } from "@/interface/shop";
import request from "@/utils/nextRequest";

function isOk(code: number) {
  return code === 0 || code === 200;
}

export interface CollaboratorDeliveryRow {
  assignment: Record<string, unknown>;
  order: Record<string, unknown> | null;
  customerUser: Record<string, unknown> | null;
}

export interface CollaboratorMyDeliveriesListData {
  items: CollaboratorDeliveryRow[];
  pagination: PaginationInfo | null;
}

export interface FetchCollaboratorMyDeliveriesParams {
  page?: number;
  page_size?: number;
}

/**
 * GET /v1/collaborator/my-delivery?page=&page_size=
 */
export async function fetchCollaboratorMyDeliveries(
  params?: FetchCollaboratorMyDeliveriesParams
): Promise<CollaboratorMyDeliveriesListData> {
  const res = await request.get<
    ApiEnvelope<{
      items?: CollaboratorDeliveryRow[];
      pagination?: PaginationInfo;
    }>
  >(api.collaboratorMyDelivery, {
    params: {
      page: params?.page ?? 1,
      page_size: params?.page_size ?? 10,
    },
  });

  const body = res.data;
  if (!body || !isOk(body.code)) {
    return { items: [], pagination: null };
  }

  const data = body.data as
    | {
        items?: CollaboratorDeliveryRow[];
        pagination?: PaginationInfo;
      }
    | undefined;

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    pagination: data?.pagination ?? null,
  };
}

export type CollaboratorDeliverStatus =
  | "assigned"
  | "picked"
  | "delivered_at"
  | "failed";

export interface PatchCollaboratorMyDeliveryParams {
  shipper_assignment_id: string;
  deliver_status: CollaboratorDeliverStatus;
}

/**
 * PATCH /v1/collaborator/my-delivery?shipper_assignment_id=
 */
export async function patchCollaboratorMyDeliveryStatus(
  params: PatchCollaboratorMyDeliveryParams
) {
  return request.patch<
    ApiEnvelope<{ assignment?: Record<string, unknown> } | null>
  >(
    api.collaboratorMyDelivery,
    { deliver_status: params.deliver_status },
    {
      params: {
        shipper_assignment_id: params.shipper_assignment_id.trim(),
      },
    }
  );
}

export type CollaboratorShipperZone = "I1" | "I2" | "I3" | "I4" | "I5";

export interface UpsertCollaboratorShipperInfoParams {
  shipper_zone: CollaboratorShipperZone;
}

/**
 * POST /v1/collaborator/upt-info — body `{ shipper_zone }`
 */
export async function upsertCollaboratorShipperInfo(
  params: UpsertCollaboratorShipperInfoParams
) {
  return request.post<
    ApiEnvelope<{ shipper_infor?: Record<string, unknown> } | null>
  >(api.collaboratorUptInfo, {
    shipper_zone: params.shipper_zone,
  });
}

export interface CollaboratorCollaInfoData {
  user: Record<string, unknown> | null;
  shipper_infor: Record<string, unknown> | null;
}

/**
 * GET /v1/collaborator/colla-info — user + shipper_infor (Bearer JWT)
 */
export async function fetchCollaboratorCollaInfo(): Promise<CollaboratorCollaInfoData | null> {
  const res = await request.get<
    ApiEnvelope<{
      user?: Record<string, unknown>;
      shipper_infor?: Record<string, unknown> | null;
    } | null>
  >(api.collaboratorCollaInfo);

  const body = res.data;
  if (!body || !isOk(body.code)) {
    return null;
  }

  const data = body.data;
  if (!data || typeof data !== "object") {
    return { user: null, shipper_infor: null };
  }

  return {
    user:
      data.user && typeof data.user === "object"
        ? (data.user as Record<string, unknown>)
        : null,
    shipper_infor:
      data.shipper_infor && typeof data.shipper_infor === "object"
        ? (data.shipper_infor as Record<string, unknown>)
        : null,
  };
}
