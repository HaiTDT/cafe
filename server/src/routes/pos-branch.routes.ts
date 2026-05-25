import { Router } from "express";
import { posBranchController } from "../controllers/pos-branch.controller";
import { authenticatePosJwt, requirePosAdmin } from "../middlewares/pos-auth.middleware";

export const posBranchRouter = Router();

posBranchRouter.get("/", authenticatePosJwt, posBranchController.list);
posBranchRouter.post("/", authenticatePosJwt, requirePosAdmin, posBranchController.create);
posBranchRouter.put("/:id", authenticatePosJwt, requirePosAdmin, posBranchController.update);
posBranchRouter.delete("/:id", authenticatePosJwt, requirePosAdmin, posBranchController.delete);
