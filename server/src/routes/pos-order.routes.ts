import { Router } from "express";
import { posOrderController } from "../controllers/pos-order.controller";
import { authenticatePosJwt, requirePosAdmin } from "../middlewares/pos-auth.middleware";

export const posOrderRouter = Router();

posOrderRouter.get("/active", authenticatePosJwt, posOrderController.listActive);
posOrderRouter.get("/table/:tableId", authenticatePosJwt, posOrderController.getByTable);
posOrderRouter.post("/", authenticatePosJwt, posOrderController.create);
posOrderRouter.put("/:id/items", authenticatePosJwt, posOrderController.updateItems);
posOrderRouter.post("/:id/pay", authenticatePosJwt, posOrderController.pay);
posOrderRouter.get("/history", authenticatePosJwt, posOrderController.listHistory);

// Chỉ Admin mới được hủy/hoàn tiền hóa đơn
posOrderRouter.put("/:id/status", authenticatePosJwt, requirePosAdmin, posOrderController.updateStatus);
