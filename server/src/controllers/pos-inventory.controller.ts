import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { inventoryService } from "../services/inventory.service";

export const posInventoryController = {
  // --- INGREDIENTS CRUD ---
  async listIngredients(req: Request, res: Response) {
    try {
      const ingredients = await prisma.ingredient.findMany({
        orderBy: { name: "asc" }
      });
      return res.json(ingredients);
    } catch (error) {
      console.error("List ingredients error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi lấy danh sách nguyên liệu" });
    }
  },

  async createIngredient(req: Request, res: Response) {
    try {
      const { name, unit, costPrice } = req.body;
      if (!name || !unit) {
        return res.status(400).json({ message: "Vui lòng nhập tên và đơn vị tính nguyên liệu" });
      }

      // Check duplicate
      const existing = await prisma.ingredient.findUnique({ where: { name } });
      if (existing) {
        return res.status(400).json({ message: "Tên nguyên liệu này đã tồn tại" });
      }

      const ingredient = await prisma.ingredient.create({
        data: {
          name,
          unit,
          costPrice: Number(costPrice || 0)
        }
      });
      return res.status(201).json(ingredient);
    } catch (error) {
      console.error("Create ingredient error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi tạo nguyên liệu" });
    }
  },

  async updateIngredient(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, unit, costPrice } = req.body;

      if (!name || !unit) {
        return res.status(400).json({ message: "Vui lòng nhập tên và đơn vị tính" });
      }

      const updated = await prisma.ingredient.update({
        where: { id },
        data: {
          name,
          unit,
          costPrice: Number(costPrice || 0)
        }
      });
      return res.json(updated);
    } catch (error) {
      console.error("Update ingredient error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật nguyên liệu" });
    }
  },

  async deleteIngredient(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Check recipe usage
      const recipeCount = await prisma.productRecipe.count({ where: { ingredientId: id } });
      if (recipeCount > 0) {
        return res.status(400).json({ message: "Không thể xóa nguyên liệu đã được định lượng cho sản phẩm" });
      }

      await prisma.ingredient.delete({ where: { id } });
      return res.json({ message: "Đã xóa nguyên liệu thành công" });
    } catch (error) {
      console.error("Delete ingredient error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi xóa nguyên liệu" });
    }
  },

  // --- RECIPES ---
  async getRecipe(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const recipes = await prisma.productRecipe.findMany({
        where: { productId },
        include: { ingredient: true }
      });
      return res.json(recipes);
    } catch (error) {
      console.error("Get recipe error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi lấy công thức định lượng" });
    }
  },

  async updateRecipe(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const { items } = req.body; // Array of { ingredientId: string, quantity: number }

      if (!Array.isArray(items)) {
        return res.status(400).json({ message: "Định dạng danh sách định lượng không hợp lệ" });
      }

      await prisma.$transaction(async (tx) => {
        // Xóa định lượng cũ
        await tx.productRecipe.deleteMany({
          where: { productId }
        });

        // Tạo định lượng mới
        if (items.length > 0) {
          await tx.productRecipe.createMany({
            data: items.map(item => ({
              productId,
              ingredientId: item.ingredientId,
              quantity: Number(item.quantity)
            }))
          });
        }
      });

      return res.json({ message: "Đã cập nhật công thức định lượng thành công" });
    } catch (error) {
      console.error("Update recipe error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật công thức định lượng" });
    }
  },

  // --- BRANCH STOCK ---
  async listBranchStock(req: Request, res: Response) {
    try {
      const branchId = req.headers["x-branch-id"] as string;
      if (!branchId) {
        return res.status(400).json({ message: "Vui lòng chỉ định Chi nhánh làm việc (x-branch-id header)" });
      }

      const { search, lowStockOnly } = req.query;

      const stocks = await inventoryService.getBranchStock(branchId, {
        search: search ? String(search) : undefined,
        lowStockOnly: lowStockOnly === "true"
      });

      return res.json(stocks);
    } catch (error) {
      console.error("List branch stock error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi lấy tồn kho chi nhánh" });
    }
  },

  async updateMinStock(req: Request, res: Response) {
    try {
      const branchId = req.headers["x-branch-id"] as string;
      if (!branchId) {
        return res.status(400).json({ message: "Vui lòng chỉ định Chi nhánh làm việc (x-branch-id header)" });
      }

      const { itemId, type, minStock } = req.body;
      if (!itemId || !type || minStock === undefined) {
        return res.status(400).json({ message: "Vui lòng điền đủ thông tin itemId, type và minStock" });
      }

      const result = await inventoryService.updateMinStock(branchId, itemId, type, Number(minStock));
      return res.json(result);
    } catch (error) {
      console.error("Update min stock error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật định mức tồn tối thiểu" });
    }
  },

  // --- STOCK TRANSACTIONS ---
  async listTransactions(req: Request, res: Response) {
    try {
      const branchId = req.headers["x-branch-id"] as string;
      if (!branchId) {
        return res.status(400).json({ message: "Vui lòng chỉ định Chi nhánh làm việc (x-branch-id header)" });
      }

      const transactions = await prisma.inventoryTransaction.findMany({
        where: { branchId },
        include: {
          supplier: true,
          items: {
            include: {
              ingredient: true,
              product: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });

      return res.json(transactions);
    } catch (error) {
      console.error("List transactions error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi lấy lịch sử xuất nhập kho" });
    }
  },

  async createImport(req: Request, res: Response) {
    try {
      const branchId = req.headers["x-branch-id"] as string;
      if (!branchId) {
        return res.status(400).json({ message: "Vui lòng chỉ định Chi nhánh làm việc (x-branch-id header)" });
      }

      const { supplierId, notes, items } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Danh sách hàng nhập không được để trống" });
      }

      const transaction = await inventoryService.createImportTransaction(
        branchId,
        req.posUser?.id || null,
        { supplierId, notes, items }
      );

      return res.status(201).json(transaction);
    } catch (error) {
      console.error("Create import error:", error);
      return res.status(500).json({ message: error instanceof Error ? error.message : "Lỗi hệ thống khi tạo phiếu nhập kho" });
    }
  },

  async createExport(req: Request, res: Response) {
    try {
      const branchId = req.headers["x-branch-id"] as string;
      if (!branchId) {
        return res.status(400).json({ message: "Vui lòng chỉ định Chi nhánh làm việc (x-branch-id header)" });
      }

      const { notes, items } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Danh sách hàng xuất không được để trống" });
      }

      const transaction = await inventoryService.createExportTransaction(
        branchId,
        req.posUser?.id || null,
        { notes, items }
      );

      return res.status(201).json(transaction);
    } catch (error) {
      console.error("Create export error:", error);
      return res.status(500).json({ message: error instanceof Error ? error.message : "Lỗi hệ thống khi tạo phiếu xuất kho" });
    }
  },

  // --- AUDITS ---
  async listAudits(req: Request, res: Response) {
    try {
      const branchId = req.headers["x-branch-id"] as string;
      if (!branchId) {
        return res.status(400).json({ message: "Vui lòng chỉ định Chi nhánh làm việc (x-branch-id header)" });
      }

      const audits = await prisma.inventoryAudit.findMany({
        where: { branchId },
        include: {
          items: {
            include: {
              ingredient: true,
              product: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });

      return res.json(audits);
    } catch (error) {
      console.error("List audits error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi lấy danh sách kiểm kê" });
    }
  },

  async createAudit(req: Request, res: Response) {
    try {
      const branchId = req.headers["x-branch-id"] as string;
      if (!branchId) {
        return res.status(400).json({ message: "Vui lòng chỉ định Chi nhánh làm việc (x-branch-id header)" });
      }

      const { notes } = req.body;
      const audit = await inventoryService.createAudit(branchId, req.posUser?.id || null, notes);
      return res.status(201).json(audit);
    } catch (error) {
      console.error("Create audit error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi tạo phiếu kiểm kê" });
    }
  },

  async submitAudit(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { items } = req.body; // Array of { ingredientId?, productId?, actualQty }

      if (!Array.isArray(items)) {
        return res.status(400).json({ message: "Danh sách số lượng kiểm kê không hợp lệ" });
      }

      const result = await inventoryService.submitAuditCount(id, items);
      return res.json(result);
    } catch (error) {
      console.error("Submit audit error:", error);
      return res.status(500).json({ message: error instanceof Error ? error.message : "Lỗi hệ thống khi ghi nhận số lượng kiểm kê" });
    }
  },

  async adjustAudit(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await inventoryService.adjustAuditStock(id, req.posUser?.id || null);
      return res.json(result);
    } catch (error) {
      console.error("Adjust audit error:", error);
      return res.status(500).json({ message: error instanceof Error ? error.message : "Lỗi hệ thống khi cân bằng kho" });
    }
  },

  // --- SUPPLIERS CRUD ---
  async listSuppliers(req: Request, res: Response) {
    try {
      const suppliers = await prisma.supplier.findMany({
        orderBy: { name: "asc" }
      });
      return res.json(suppliers);
    } catch (error) {
      console.error("List suppliers error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi lấy danh sách nhà cung cấp" });
    }
  },

  async createSupplier(req: Request, res: Response) {
    try {
      const { name, phone, address } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Vui lòng nhập tên nhà cung cấp" });
      }

      const existing = await prisma.supplier.findUnique({ where: { name } });
      if (existing) {
        return res.status(400).json({ message: "Nhà cung cấp này đã tồn tại" });
      }

      const supplier = await prisma.supplier.create({
        data: { name, phone, address }
      });
      return res.status(201).json(supplier);
    } catch (error) {
      console.error("Create supplier error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi tạo nhà cung cấp" });
    }
  },

  async updateSupplier(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, phone, address } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Vui lòng nhập tên nhà cung cấp" });
      }

      const updated = await prisma.supplier.update({
        where: { id },
        data: { name, phone, address }
      });
      return res.json(updated);
    } catch (error) {
      console.error("Update supplier error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật nhà cung cấp" });
    }
  },

  async deleteSupplier(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check transaction usage
      const transactionCount = await prisma.inventoryTransaction.count({ where: { supplierId: id } });
      if (transactionCount > 0) {
        return res.status(400).json({ message: "Không thể xóa nhà cung cấp đã có giao dịch nhập kho" });
      }

      await prisma.supplier.delete({ where: { id } });
      return res.json({ message: "Đã xóa nhà cung cấp thành công" });
    } catch (error) {
      console.error("Delete supplier error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi xóa nhà cung cấp" });
    }
  }
};
