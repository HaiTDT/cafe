import { prisma } from "../lib/prisma";
import { InventoryTransactionType, AuditStatus } from "@prisma/client";

export const inventoryService = {
  // 1. Tự động trừ kho khi bán hàng
  async deductStockForOrder(branchId: string, orderId: string, txClient?: any) {
    const client = txClient || prisma;

    const order = await client.cafeOrder.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      console.error(`[Inventory Service] Order ${orderId} not found.`);
      return;
    }

    // Tạo Header phiếu trừ kho tự động
    const transaction = await client.inventoryTransaction.create({
      data: {
        branchId,
        type: InventoryTransactionType.SALE_DEDUCTION,
        referenceId: orderId,
        notes: `Hệ thống tự động trừ kho cho Hóa đơn #${orderId.substring(0, 8)}`,
      },
    });

    for (const item of order.items) {
      if (!item.productId) continue;

      // Tìm công thức định lượng (recipe) của sản phẩm
      const recipes = await client.productRecipe.findMany({
        where: { productId: item.productId },
        include: { ingredient: true }
      });

      if (recipes.length > 0) {
        // Trừ theo công thức định lượng nguyên vật liệu
        for (const recipe of recipes) {
          const requiredQty = recipe.quantity * item.quantity;

          // Cập nhật tồn kho chi nhánh cho nguyên liệu
          await client.branchInventory.upsert({
            where: {
              branchId_ingredientId: {
                branchId,
                ingredientId: recipe.ingredientId,
              },
            },
            update: {
              quantity: {
                decrement: requiredQty,
              },
            },
            create: {
              branchId,
              ingredientId: recipe.ingredientId,
              quantity: -requiredQty,
            },
          });

          // Lưu chi tiết giao dịch kho
          await client.inventoryTransactionItem.create({
            data: {
              transactionId: transaction.id,
              ingredientId: recipe.ingredientId,
              quantity: -requiredQty,
              unitPrice: recipe.ingredient.costPrice,
            },
          });
        }
      } else {
        // Trừ sản phẩm trực tiếp (Sản phẩm bán lẻ/đóng gói)
        const requiredQty = item.quantity;

        // Cập nhật tồn kho sản phẩm trực tiếp của chi nhánh
        await client.branchInventory.upsert({
          where: {
            branchId_productId: {
              branchId,
              productId: item.productId,
            },
          },
          update: {
            quantity: {
              decrement: requiredQty,
            },
          },
          create: {
            branchId,
            productId: item.productId,
            quantity: -requiredQty,
          },
        });

        // Lấy thông tin giá bán sản phẩm làm giá vốn tạm tính
        const product = await client.product.findUnique({
          where: { id: item.productId },
        });

        // Lưu chi tiết giao dịch kho
        await client.inventoryTransactionItem.create({
          data: {
            transactionId: transaction.id,
            productId: item.productId,
            quantity: -requiredQty,
            unitPrice: product?.price || 0,
          },
        });
      }
    }
  },

  // 2. Lấy tồn kho chi nhánh (Nguyên liệu + Sản phẩm bán lẻ)
  async getBranchStock(branchId: string, params: { search?: string; lowStockOnly?: boolean } = {}) {
    const { search, lowStockOnly } = params;

    // Lấy tồn kho nguyên liệu
    const ingredientStocks = await prisma.branchInventory.findMany({
      where: {
        branchId,
        ingredientId: { not: null },
        ingredient: search ? {
          name: { contains: search, mode: "insensitive" }
        } : undefined
      },
      include: {
        ingredient: true
      }
    });

    // Lấy tồn kho sản phẩm trực tiếp
    const productStocks = await prisma.branchInventory.findMany({
      where: {
        branchId,
        productId: { not: null },
        product: search ? {
          name: { contains: search, mode: "insensitive" }
        } : undefined
      },
      include: {
        product: {
          include: { category: true }
        }
      }
    });

    // Định dạng lại kết quả
    const stocks = [
      ...ingredientStocks.map(s => ({
        id: s.id,
        itemId: s.ingredientId!,
        name: s.ingredient!.name,
        unit: s.ingredient!.unit,
        type: "ingredient" as const,
        costPrice: Number(s.ingredient!.costPrice),
        quantity: s.quantity,
        minStock: s.minStock,
        status: s.quantity <= 0 ? "OUT_OF_STOCK" : s.quantity <= s.minStock ? "LOW_STOCK" : "NORMAL"
      })),
      ...productStocks.map(s => ({
        id: s.id,
        itemId: s.productId!,
        name: s.product!.name,
        unit: "Cái", // mặc định cho sản phẩm
        type: "product" as const,
        costPrice: Number(s.product!.price) * 0.7, // Giả định giá vốn sản phẩm bán lẻ = 70% giá bán
        quantity: s.quantity,
        minStock: s.minStock,
        status: s.quantity <= 0 ? "OUT_OF_STOCK" : s.quantity <= s.minStock ? "LOW_STOCK" : "NORMAL"
      }))
    ];

    if (lowStockOnly) {
      return stocks.filter(s => s.quantity <= s.minStock);
    }

    return stocks;
  },

  // 3. Cập nhật định mức tồn tối thiểu
  async updateMinStock(branchId: string, itemId: string, type: "ingredient" | "product", minStock: number) {
    if (type === "ingredient") {
      return await prisma.branchInventory.upsert({
        where: { branchId_ingredientId: { branchId, ingredientId: itemId } },
        update: { minStock },
        create: { branchId, ingredientId: itemId, quantity: 0, minStock }
      });
    } else {
      return await prisma.branchInventory.upsert({
        where: { branchId_productId: { branchId, productId: itemId } },
        update: { minStock },
        create: { branchId, productId: itemId, quantity: 0, minStock }
      });
    }
  },

  // 4. Nhập kho từ Nhà cung cấp
  async createImportTransaction(
    branchId: string,
    createdById: string | null,
    data: {
      supplierId?: string;
      notes?: string;
      items: Array<{
        ingredientId?: string;
        productId?: string;
        quantity: number;
        unitPrice: number;
      }>;
    }
  ) {
    return await prisma.$transaction(async (tx) => {
      const transaction = await tx.inventoryTransaction.create({
        data: {
          branchId,
          type: InventoryTransactionType.IMPORT,
          supplierId: data.supplierId || null,
          notes: data.notes || null,
          createdById,
        }
      });

      for (const item of data.items) {
        if (item.ingredientId) {
          // Lấy tồn kho hiện tại và giá vốn hiện tại
          const currentInv = await tx.branchInventory.findUnique({
            where: { branchId_ingredientId: { branchId, ingredientId: item.ingredientId } }
          });
          const ingredient = await tx.ingredient.findUnique({
            where: { id: item.ingredientId }
          });

          const currentQty = currentInv?.quantity || 0;
          const oldCostPrice = Number(ingredient?.costPrice || 0);

          // Cập nhật tồn kho
          await tx.branchInventory.upsert({
            where: { branchId_ingredientId: { branchId, ingredientId: item.ingredientId } },
            update: { quantity: { increment: item.quantity } },
            create: { branchId, ingredientId: item.ingredientId, quantity: item.quantity }
          });

          // Tính giá vốn bình quân gia quyền (Weighted Average Cost Price)
          let newCostPrice = item.unitPrice;
          if (currentQty > 0 && oldCostPrice > 0) {
            newCostPrice = ((currentQty * oldCostPrice) + (item.quantity * item.unitPrice)) / (currentQty + item.quantity);
          }

          await tx.ingredient.update({
            where: { id: item.ingredientId },
            data: { costPrice: newCostPrice }
          });

          // Tạo chi tiết giao dịch
          await tx.inventoryTransactionItem.create({
            data: {
              transactionId: transaction.id,
              ingredientId: item.ingredientId,
              quantity: item.quantity,
              unitPrice: item.unitPrice
            }
          });
        } else if (item.productId) {
          // Sản phẩm bán lẻ
          await tx.branchInventory.upsert({
            where: { branchId_productId: { branchId, productId: item.productId } },
            update: { quantity: { increment: item.quantity } },
            create: { branchId, productId: item.productId, quantity: item.quantity }
          });

          await tx.inventoryTransactionItem.create({
            data: {
              transactionId: transaction.id,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice
            }
          });
        }
      }

      return transaction;
    });
  },

  // 5. Xuất kho (Hao hụt, hỏng hóc)
  async createExportTransaction(
    branchId: string,
    createdById: string | null,
    data: {
      notes?: string;
      items: Array<{
        ingredientId?: string;
        productId?: string;
        quantity: number;
      }>;
    }
  ) {
    return await prisma.$transaction(async (tx) => {
      const transaction = await tx.inventoryTransaction.create({
        data: {
          branchId,
          type: InventoryTransactionType.EXPORT,
          notes: data.notes || null,
          createdById,
        }
      });

      for (const item of data.items) {
        // Số lượng xuất kho phải ghi nhận là Âm trong lịch sử giao dịch
        const exportQty = -Math.abs(item.quantity);

        if (item.ingredientId) {
          const ingredient = await tx.ingredient.findUnique({
            where: { id: item.ingredientId }
          });

          await tx.branchInventory.upsert({
            where: { branchId_ingredientId: { branchId, ingredientId: item.ingredientId } },
            update: { quantity: { decrement: Math.abs(item.quantity) } },
            create: { branchId, ingredientId: item.ingredientId, quantity: exportQty }
          });

          await tx.inventoryTransactionItem.create({
            data: {
              transactionId: transaction.id,
              ingredientId: item.ingredientId,
              quantity: exportQty,
              unitPrice: ingredient?.costPrice || 0
            }
          });
        } else if (item.productId) {
          const product = await tx.product.findUnique({
            where: { id: item.productId }
          });

          await tx.branchInventory.upsert({
            where: { branchId_productId: { branchId, productId: item.productId } },
            update: { quantity: { decrement: Math.abs(item.quantity) } },
            create: { branchId, productId: item.productId, quantity: exportQty }
          });

          await tx.inventoryTransactionItem.create({
            data: {
              transactionId: transaction.id,
              productId: item.productId,
              quantity: exportQty,
              unitPrice: product?.price || 0
            }
          });
        }
      }

      return transaction;
    });
  },

  // 6. Tạo phiếu kiểm kho nháp
  async createAudit(branchId: string, createdById: string | null, notes?: string) {
    return await prisma.$transaction(async (tx) => {
      // Lấy tồn kho hiện tại
      const stocks = await this.getBranchStock(branchId);

      const audit = await tx.inventoryAudit.create({
        data: {
          branchId,
          notes: notes || null,
          status: AuditStatus.PENDING,
          createdById,
        }
      });

      // Tạo chi tiết đợt kiểm kho nháp dựa trên số lượng hệ thống hiện tại
      for (const stock of stocks) {
        await tx.inventoryAuditItem.create({
          data: {
            auditId: audit.id,
            ingredientId: stock.type === "ingredient" ? stock.itemId : null,
            productId: stock.type === "product" ? stock.itemId : null,
            systemQty: stock.quantity,
            actualQty: stock.quantity, // Mặc định để bằng tồn hệ thống trước khi đếm
            discrepancy: 0,
          }
        });
      }

      return audit;
    });
  },

  // 7. Cập nhật số lượng kiểm đếm thực tế
  async submitAuditCount(
    auditId: string,
    items: Array<{
      ingredientId?: string;
      productId?: string;
      actualQty: number;
    }>
  ) {
    return await prisma.$transaction(async (tx) => {
      const audit = await tx.inventoryAudit.findUnique({
        where: { id: auditId },
        include: { items: true }
      });

      if (!audit) throw new Error("Không tìm thấy phiếu kiểm kho");
      if (audit.status === AuditStatus.ADJUSTED) throw new Error("Phiếu kiểm kho này đã được cân bằng và chốt số liệu");

      for (const item of items) {
        const dbItem = audit.items.find(i => 
          (item.ingredientId && i.ingredientId === item.ingredientId) ||
          (item.productId && i.productId === item.productId)
        );

        if (dbItem) {
          const discrepancy = item.actualQty - dbItem.systemQty;
          await tx.inventoryAuditItem.update({
            where: { id: dbItem.id },
            data: {
              actualQty: item.actualQty,
              discrepancy,
            }
          });
        }
      }

      return await tx.inventoryAudit.findUnique({
        where: { id: auditId },
        include: { items: { include: { ingredient: true, product: true } } }
      });
    });
  },

  // 8. Cân bằng kho (Đồng ý điều chỉnh số lượng tồn kho theo số thực tế)
  async adjustAuditStock(auditId: string, createdById: string | null) {
    return await prisma.$transaction(async (tx) => {
      const audit = await tx.inventoryAudit.findUnique({
        where: { id: auditId },
        include: { items: true }
      });

      if (!audit) throw new Error("Không tìm thấy phiếu kiểm kho");
      if (audit.status === AuditStatus.ADJUSTED) throw new Error("Phiếu kiểm kho này đã được điều chỉnh rồi");

      // Tạo giao dịch điều chỉnh kho
      const transaction = await tx.inventoryTransaction.create({
        data: {
          branchId: audit.branchId,
          type: InventoryTransactionType.AUDIT_ADJUST,
          referenceId: audit.id,
          notes: `Điều chỉnh số dư tồn kho tự động theo phiếu kiểm kho #${audit.id.substring(0, 8)}`,
          createdById,
        }
      });

      for (const item of audit.items) {
        if (item.discrepancy === 0) continue; // Không lệch thì không cần điều chỉnh

        if (item.ingredientId) {
          const ingredient = await tx.ingredient.findUnique({
            where: { id: item.ingredientId }
          });

          // Cập nhật Branch Inventory về đúng số lượng thực tế
          await tx.branchInventory.upsert({
            where: { branchId_ingredientId: { branchId: audit.branchId, ingredientId: item.ingredientId } },
            update: { quantity: item.actualQty },
            create: { branchId: audit.branchId, ingredientId: item.ingredientId, quantity: item.actualQty }
          });

          // Ghi nhận chi tiết giao dịch chênh lệch
          await tx.inventoryTransactionItem.create({
            data: {
              transactionId: transaction.id,
              ingredientId: item.ingredientId,
              quantity: item.discrepancy, // Dương nếu thừa, Âm nếu thiếu
              unitPrice: ingredient?.costPrice || 0
            }
          });
        } else if (item.productId) {
          const product = await tx.product.findUnique({
            where: { id: item.productId }
          });

          await tx.branchInventory.upsert({
            where: { branchId_productId: { branchId: audit.branchId, productId: item.productId } },
            update: { quantity: item.actualQty },
            create: { branchId: audit.branchId, productId: item.productId, quantity: item.actualQty }
          });

          await tx.inventoryTransactionItem.create({
            data: {
              transactionId: transaction.id,
              productId: item.productId,
              quantity: item.discrepancy,
              unitPrice: product?.price || 0
            }
          });
        }
      }

      // Đổi trạng thái phiếu kiểm thành ADJUSTED
      return await tx.inventoryAudit.update({
        where: { id: auditId },
        data: { status: AuditStatus.ADJUSTED }
      });
    });
  }
};
