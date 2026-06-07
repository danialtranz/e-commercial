import express, { RequestHandler } from "express";
import * as collaboratorController from "../../controllers/collaboratorController/collaboratorController";
import {
  isAuthJwtMiddleware,
  requireCollaboratorMiddleware,
} from "../../middlewares/auth/jwt.auth";

const router = express.Router();

// PUBLIC API — collaborator: Google OAuth2
router.post(
  "/collaborator/oAuth-login",
  collaboratorController.loginCollaboratorWithGoogle as unknown as RequestHandler,
);

/**
 * Collaborator (shipper) — đơn được gán.
 * GET /collaborator/my-delivery?page=1&page_size=5
 */
router.get(
  "/collaborator/my-delivery",
  isAuthJwtMiddleware,
  requireCollaboratorMiddleware,
  collaboratorController.getCollaboratorMyDeliveriesHandler,
);

/**
 * PATCH /collaborator/my-delivery?shipper_assignment_id=...
 * Body: { deliver_status: "assigned" | "picked" | "delivered_at" | "failed" }
 */
router.patch(
  "/collaborator/my-delivery",
  isAuthJwtMiddleware,
  requireCollaboratorMiddleware,
  collaboratorController.patchCollaboratorMyDeliveryStatusHandler,
);

/**
 * POST | PATCH /collaborator/upt-info
 * Body: { "shipper_zone": "I1" | "I2" | "I3" }
 */
router.post(
  "/collaborator/upt-info",
  isAuthJwtMiddleware,
  requireCollaboratorMiddleware,
  collaboratorController.upsertCollaboratorShipperInforHandler,
);
router.patch(
  "/collaborator/upt-info",
  isAuthJwtMiddleware,
  requireCollaboratorMiddleware,
  collaboratorController.upsertCollaboratorShipperInforHandler,
);

/**
 * GET | POST /collaborator/colla-info — thông tin user + shipper_infor
 */
router.get(
  "/collaborator/colla-info",
  isAuthJwtMiddleware,
  requireCollaboratorMiddleware,
  collaboratorController.getCollaboratorCollaInfoHandler,
);
router.post(
  "/collaborator/colla-info",
  isAuthJwtMiddleware,
  requireCollaboratorMiddleware,
  collaboratorController.getCollaboratorCollaInfoHandler,
);

export default router;
