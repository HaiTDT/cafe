import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const bannerController = {
  // Public - get active banners
  getBanners: async (_req: Request, res: Response) => {
    try {
      const banners = await prisma.banner.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" }
      });
      res.json(banners);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Admin CRUD
  getAllBanners: async (_req: Request, res: Response) => {
    try {
      const banners = await prisma.banner.findMany({
        orderBy: { order: "asc" }
      });
      res.json(banners);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  },
  
  createBanner: async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const banner = await prisma.banner.create({ data });
      res.status(201).json(banner);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  },
  
  updateBanner: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const banner = await prisma.banner.update({
        where: { id },
        data
      });
      res.json(banner);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  },
  
  deleteBanner: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await prisma.banner.delete({ where: { id } });
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};
