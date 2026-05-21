import { Router } from "express";
import { posTableController } from "../controllers/pos-table.controller";
import { authenticatePosJwt, requirePosAdmin } from "../middlewares/pos-auth.middleware";

export const posTableRouter = Router();

posTableRouter.get("/", authenticatePosJwt, posTableController.list);
posTableRouter.post("/", authenticatePosJwt, requirePosAdmin, posTableController.create);
posTableRouter.put("/:id", authenticatePosJwt, posTableController.update);
posTableRouter.delete("/:id", authenticatePosJwt, requirePosAdmin, posTableController.delete);
