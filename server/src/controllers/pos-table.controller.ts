import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const posTableController = {
  async list(req: Request, res: Response) {
    try {
      const { showInactive } = req.query;
      const branchId = req.posBranchId;

      if (!branchId) {
        return res.status(400).json({ message: "Vui lòng chỉ định chi nhánh hoạt động" });
      }

      const where: any = { branchId };
      
      // Nếu không phải admin hoặc không yêu cầu xem bàn ẩn, chỉ trả về bàn đang hoạt động
      if (showInactive !== "true" || req.posUser?.role !== "ADMIN") {
        where.isActive = true;
      }

      const tables = await prisma.cafeTable.findMany({
        where,
        orderBy: { name: "asc" }
      });

      return res.json(tables);
    } catch (error) {
      console.error("List tables error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi lấy danh sách bàn" });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { name, isActive, branchId } = req.body;
      const targetBranchId = branchId || req.posBranchId;

      if (!name) {
        return res.status(400).json({ message: "Tên bàn là bắt buộc" });
      }

      if (!targetBranchId) {
        return res.status(400).json({ message: "Vui lòng chỉ định chi nhánh cho bàn ăn" });
      }

      const existingTable = await prisma.cafeTable.findFirst({
        where: {
          branchId: targetBranchId,
          name: name.trim()
        }
      });

      if (existingTable) {
        return res.status(400).json({ message: "Tên bàn đã tồn tại trong chi nhánh này" });
      }

      const table = await prisma.cafeTable.create({
        data: {
          name: name.trim(),
          branchId: targetBranchId,
          isActive: isActive !== false
        }
      });

      return res.status(201).json(table);
    } catch (error) {
      console.error("Create table error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi thêm bàn" });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, isActive, status, branchId } = req.body;

      const table = await prisma.cafeTable.findUnique({
        where: { id }
      });

      if (!table) {
        return res.status(404).json({ message: "Không tìm thấy bàn" });
      }

      const updateData: any = {};
      const targetBranchId = branchId || table.branchId;

      if (name) {
        const existingTableName = await prisma.cafeTable.findFirst({
          where: {
            branchId: targetBranchId,
            name: name.trim(),
            id: { not: id }
          }
        });
        if (existingTableName) {
          return res.status(400).json({ message: "Tên bàn đã tồn tại trong chi nhánh này" });
        }
        updateData.name = name.trim();
      }

      if (branchId !== undefined) {
        if (req.posUser?.role !== "ADMIN") {
          return res.status(403).json({ message: "Bạn không có quyền thay đổi chi nhánh của bàn" });
        }
        updateData.branchId = branchId;
      }

      if (isActive !== undefined) {
        // Chỉ admin mới có quyền ẩn/hiện bàn
        if (req.posUser?.role !== "ADMIN") {
          return res.status(403).json({ message: "Bạn không có quyền thay đổi trạng thái hoạt động của bàn" });
        }
        updateData.isActive = !!isActive;
      }

      if (status) {
        // Hỗ trợ cập nhật trạng thái bàn thủ công nếu cần
        updateData.status = status;
      }

      const updatedTable = await prisma.cafeTable.update({
        where: { id },
        data: updateData
      });

      return res.json(updatedTable);
    } catch (error) {
      console.error("Update table error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật thông tin bàn" });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const table = await prisma.cafeTable.findUnique({
        where: { id }
      });

      if (!table) {
        return res.status(404).json({ message: "Không tìm thấy bàn" });
      }

      // Kiểm tra xem bàn có hóa đơn nào liên kết không
      const orderCount = await prisma.cafeOrder.count({
        where: { tableId: id }
      });

      if (orderCount > 0) {
        // Ẩn bàn thay vì xóa để bảo toàn dữ liệu lịch sử hóa đơn
        const updated = await prisma.cafeTable.update({
          where: { id },
          data: { isActive: false }
        });
        return res.json({
          message: "Bàn này đã có lịch sử hóa đơn. Hệ thống tự động chuyển trạng thái ẩn bàn.",
          table: updated
        });
      }

      await prisma.cafeTable.delete({
        where: { id }
      });

      return res.json({ message: "Xóa bàn thành công" });
    } catch (error) {
      console.error("Delete table error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi xóa bàn" });
    }
  }
};
