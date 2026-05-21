import { Router } from "express";
import { bannerController } from "../controllers/banner.controller";
import { requireAdmin } from "../middlewares/admin.middleware";
import { authenticateJwt } from "../middlewares/auth.middleware";

export const publicBannerRouter = Router();
publicBannerRouter.get("/", bannerController.getBanners);

export const adminBannerRouter = Router();
adminBannerRouter.use(authenticateJwt, requireAdmin);
adminBannerRouter.get("/", bannerController.getAllBanners);
adminBannerRouter.post("/", bannerController.createBanner);
adminBannerRouter.put("/:id", bannerController.updateBanner);
adminBannerRouter.delete("/:id", bannerController.deleteBanner);
