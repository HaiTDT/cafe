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

const generateUniqueSlug = async (name: string): Promise<string> => {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const existing = await prisma.product.findUnique({
      where: { slug }
    });
    if (!existing) {
      return slug;
    }
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

export const posProductController = {
  async list(req: Request, res: Response) {
    try {
      const { categoryId, search, showInactive } = req.query;

      const where: any = {};

      if (categoryId) {
        where.categoryId = String(categoryId);
      }

      if (search) {
        where.name = {
          contains: String(search),
          mode: "insensitive"
        };
      }

      // Nếu không phải admin hoặc không yêu cầu xem cả món ẩn, thì mặc định chỉ lấy món đang hiển thị (isActive = true)
      if (showInactive !== "true" || req.posUser?.role !== "ADMIN") {
        where.isActive = true;
      }

      const products = await prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { name: "asc" }
      });

      return res.json(products);
    } catch (error) {
      console.error("List products error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi lấy danh sách món" });
    }
  },

  async getOne(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const product = await prisma.product.findUnique({
        where: { id },
        include: { category: true }
      });

      if (!product) {
        return res.status(404).json({ message: "Không tìm thấy món ăn/uống" });
      }

      return res.json(product);
    } catch (error) {
      return res.status(500).json({ message: "Lỗi hệ thống khi lấy thông tin món" });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { name, price, categoryId, isActive, isAvailable } = req.body;

      if (!name || price === undefined || !categoryId) {
        return res.status(400).json({ message: "Vui lòng điền đầy đủ: tên món, giá tiền và danh mục" });
      }

      const numericPrice = Number(price);
      if (isNaN(numericPrice) || numericPrice < 0) {
        return res.status(400).json({ message: "Giá tiền phải là số lớn hơn hoặc bằng 0" });
      }

      // Check category exists
      const category = await prisma.category.findUnique({
        where: { id: categoryId }
      });
      if (!category) {
        return res.status(404).json({ message: "Không tìm thấy danh mục" });
      }

      const slug = await generateUniqueSlug(name);

      const product = await prisma.product.create({
        data: {
          name: name.trim(),
          slug,
          price: numericPrice,
          categoryId,
          isActive: isActive !== false,
          isAvailable: isAvailable !== false
        },
        include: { category: true }
      });

      return res.status(201).json(product);
    } catch (error) {
      console.error("Create product error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi thêm món" });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, price, categoryId, isActive, isAvailable } = req.body;

      const product = await prisma.product.findUnique({
        where: { id }
      });

      if (!product) {
        return res.status(404).json({ message: "Không tìm thấy món" });
      }

      const updateData: any = {};

      if (name) {
        const trimmedName = name.trim();
        updateData.name = trimmedName;
        if (trimmedName.toLowerCase() !== product.name.toLowerCase()) {
          updateData.slug = await generateUniqueSlug(trimmedName);
        }
      }
      
      if (price !== undefined) {
        const numericPrice = Number(price);
        if (isNaN(numericPrice) || numericPrice < 0) {
          return res.status(400).json({ message: "Giá tiền không hợp lệ" });
        }
        updateData.price = numericPrice;
      }

      if (categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: categoryId }
        });
        if (!category) {
          return res.status(404).json({ message: "Không tìm thấy danh mục" });
        }
        updateData.categoryId = categoryId;
      }

      if (isActive !== undefined) updateData.isActive = !!isActive;
      if (isAvailable !== undefined) updateData.isAvailable = !!isAvailable;

      const updatedProduct = await prisma.product.update({
        where: { id },
        data: updateData,
        include: { category: true }
      });

      return res.json(updatedProduct);
    } catch (error) {
      console.error("Update product error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật món" });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const product = await prisma.product.findUnique({
        where: { id }
      });

      if (!product) {
        return res.status(404).json({ message: "Không tìm thấy món" });
      }

      // Vì lý do toàn vẹn dữ liệu, nếu món này đã được order trong quá khứ, ta không nên xóa cứng trong DB.
      // Thay vào đó, ta sẽ ẩn món đó (isActive = false).
      const orderCount = await prisma.cafeOrderItem.count({
        where: { productId: id }
      });

      if (orderCount > 0) {
        // Ẩn món thay vì xóa để bảo vệ lịch sử hóa đơn
        const updated = await prisma.product.update({
          where: { id },
          data: { isActive: false }
        });
        return res.json({
          message: "Món này đã có trong lịch sử hóa đơn nên không thể xóa cứng. Hệ thống đã tự động chuyển trạng thái ẩn món khỏi menu.",
          product: updated
        });
      }

      await prisma.product.delete({
        where: { id }
      });

      return res.json({ message: "Xóa món thành công" });
    } catch (error) {
      console.error("Delete product error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi xóa món" });
    }
  }
};
