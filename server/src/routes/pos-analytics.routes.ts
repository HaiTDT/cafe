import { Router } from "express";
import { posAnalyticsController } from "../controllers/pos-analytics.controller";
import { authenticatePosJwt, requirePosAdmin } from "../middlewares/pos-auth.middleware";

export const posAnalyticsRouter = Router();

posAnalyticsRouter.get("/dashboard", authenticatePosJwt, requirePosAdmin, posAnalyticsController.getDashboard);
