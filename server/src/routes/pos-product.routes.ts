import { Router } from "express";
import { posProductController } from "../controllers/pos-product.controller";
import { authenticatePosJwt, requirePosAdmin } from "../middlewares/pos-auth.middleware";

export const posProductRouter = Router();

posProductRouter.get("/", authenticatePosJwt, posProductController.list);
posProductRouter.get("/:id", authenticatePosJwt, posProductController.getOne);
posProductRouter.post("/", authenticatePosJwt, requirePosAdmin, posProductController.create);
posProductRouter.put("/:id", authenticatePosJwt, requirePosAdmin, posProductController.update);
posProductRouter.delete("/:id", authenticatePosJwt, requirePosAdmin, posProductController.delete);
