import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";

const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

export const posCategoryController = {
  async list(req: Request, res: Response) {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { name: "asc" }
      });
      return res.json(categories);
    } catch (error) {
      console.error("List categories error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi lấy danh sách danh mục" });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Tên danh mục là bắt buộc" });
      }

      const slug = slugify(name);
      const existingCategory = await prisma.category.findUnique({
        where: { slug }
      });

      if (existingCategory) {
        return res.status(400).json({ message: "Danh mục với tên này (hoặc slug tương tự) đã tồn tại" });
      }

      const category = await prisma.category.create({
        data: {
          name: name.trim(),
          slug,
          description: description?.trim()
        }
      });

      return res.status(201).json(category);
    } catch (error) {
      console.error("Create category error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi tạo danh mục" });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Tên danh mục là bắt buộc" });
      }

      const category = await prisma.category.findUnique({
        where: { id }
      });

      if (!category) {
        return res.status(404).json({ message: "Không tìm thấy danh mục" });
      }

      const slug = slugify(name);
      const existingCategoryName = await prisma.category.findFirst({
        where: {
          slug,
          id: { not: id }
        }
      });

      if (existingCategoryName) {
        return res.status(400).json({ message: "Danh mục với tên này (hoặc slug tương tự) đã tồn tại" });
      }

      const updatedCategory = await prisma.category.update({
        where: { id },
        data: {
          name: name.trim(),
          slug,
          description: description?.trim()
        }
      });

      return res.json(updatedCategory);
    } catch (error) {
      console.error("Update category error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật danh mục" });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const category = await prisma.category.findUnique({
        where: { id },
        include: { _count: { select: { products: true } } }
      });

      if (!category) {
        return res.status(404).json({ message: "Không tìm thấy danh mục" });
      }

      if (category._count.products > 0) {
        return res.status(400).json({ message: "Không thể xóa danh mục đã chứa món ăn/đồ uống. Vui lòng xóa món ăn trước." });
      }

      await prisma.category.delete({
        where: { id }
      });

      return res.json({ message: "Xóa danh mục thành công" });
    } catch (error) {
      console.error("Delete category error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi xóa danh mục" });
    }
  }
};
