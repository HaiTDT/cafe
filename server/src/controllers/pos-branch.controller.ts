import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const posBranchController = {
  async list(req: Request, res: Response) {
    try {
      const { showInactive } = req.query;

      const where: any = {};
      
      // Nếu không phải admin hoặc không yêu cầu xem chi nhánh ẩn, chỉ trả về chi nhánh đang hoạt động
      if (showInactive !== "true" || req.posUser?.role !== "ADMIN") {
        where.isActive = true;
      }

      const branches = await prisma.branch.findMany({
        where,
        orderBy: { name: "asc" }
      });

      return res.json(branches);
    } catch (error) {
      console.error("List branches error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi lấy danh sách chi nhánh" });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { name, address, phone, isActive } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Tên chi nhánh là bắt buộc" });
      }

      const existingBranch = await prisma.branch.findUnique({
        where: { name: name.trim() }
      });

      if (existingBranch) {
        return res.status(400).json({ message: "Tên chi nhánh đã tồn tại" });
      }

      const branch = await prisma.branch.create({
        data: {
          name: name.trim(),
          address: address?.trim() || null,
          phone: phone?.trim() || null,
          isActive: isActive !== false
        }
      });

      return res.status(201).json(branch);
    } catch (error) {
      console.error("Create branch error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi thêm chi nhánh" });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, address, phone, isActive } = req.body;

      const branch = await prisma.branch.findUnique({
        where: { id }
      });

      if (!branch) {
        return res.status(404).json({ message: "Không tìm thấy chi nhánh" });
      }

      const updateData: any = {};

      if (name) {
        const existingBranchName = await prisma.branch.findFirst({
          where: {
            name: name.trim(),
            id: { not: id }
          }
        });
        if (existingBranchName) {
          return res.status(400).json({ message: "Tên chi nhánh đã tồn tại" });
        }
        updateData.name = name.trim();
      }

      if (address !== undefined) {
        updateData.address = address?.trim() || null;
      }

      if (phone !== undefined) {
        updateData.phone = phone?.trim() || null;
      }

      if (isActive !== undefined) {
        updateData.isActive = !!isActive;
      }

      const updatedBranch = await prisma.branch.update({
        where: { id },
        data: updateData
      });

      return res.json(updatedBranch);
    } catch (error) {
      console.error("Update branch error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật chi nhánh" });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const branch = await prisma.branch.findUnique({
        where: { id }
      });

      if (!branch) {
        return res.status(404).json({ message: "Không tìm thấy chi nhánh" });
      }

      // Kiểm tra xem chi nhánh có bàn hoặc hóa đơn nào liên kết không
      const tableCount = await prisma.cafeTable.count({
        where: { branchId: id }
      });

      const orderCount = await prisma.cafeOrder.count({
        where: { branchId: id }
      });

      if (tableCount > 0 || orderCount > 0) {
        // Ẩn chi nhánh thay vì xóa để bảo toàn dữ liệu lịch sử
        const updated = await prisma.branch.update({
          where: { id },
          data: { isActive: false }
        });
        return res.json({
          message: "Chi nhánh đã có dữ liệu bàn ăn hoặc hóa đơn. Hệ thống tự động chuyển trạng thái ẩn hoạt động.",
          branch: updated
        });
      }

      await prisma.branch.delete({
        where: { id }
      });

      return res.json({ message: "Xóa chi nhánh thành công" });
    } catch (error) {
      console.error("Delete branch error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi xóa chi nhánh" });
    }
  }
};
