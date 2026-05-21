import { Router } from "express";
import { posCategoryController } from "../controllers/pos-category.controller";
import { authenticatePosJwt, requirePosAdmin } from "../middlewares/pos-auth.middleware";

export const posCategoryRouter = Router();

posCategoryRouter.get("/", authenticatePosJwt, posCategoryController.list);
posCategoryRouter.post("/", authenticatePosJwt, requirePosAdmin, posCategoryController.create);
posCategoryRouter.put("/:id", authenticatePosJwt, requirePosAdmin, posCategoryController.update);
posCategoryRouter.delete("/:id", authenticatePosJwt, requirePosAdmin, posCategoryController.delete);
