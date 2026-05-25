import { Router } from "express";
import { posAuthController } from "../controllers/pos-auth.controller";
import { authenticatePosJwt, requirePosAdmin } from "../middlewares/pos-auth.middleware";

export const posAuthRouter = Router();

posAuthRouter.post("/setup", posAuthController.setup);
posAuthRouter.post("/login", posAuthController.login);
posAuthRouter.get("/me", authenticatePosJwt, posAuthController.me);

// Quản trị nhân viên (chỉ Admin mới được thao tác)
posAuthRouter.post("/staffs", authenticatePosJwt, requirePosAdmin, posAuthController.createStaff);
posAuthRouter.get("/staffs", authenticatePosJwt, requirePosAdmin, posAuthController.listStaffs);
posAuthRouter.put("/staffs/:id", authenticatePosJwt, requirePosAdmin, posAuthController.updateStaff);
posAuthRouter.delete("/staffs/:id", authenticatePosJwt, requirePosAdmin, posAuthController.deleteStaff);
