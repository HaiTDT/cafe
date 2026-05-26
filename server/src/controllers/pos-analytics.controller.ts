import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const posAnalyticsController = {
  async getDashboard(req: Request, res: Response) {
    try {
      const { branchId, startDate, endDate } = req.query;
      const targetBranchId = branchId as string || req.posBranchId;

      if (!targetBranchId) {
        return res.status(400).json({ message: "Vui lòng chỉ định chi nhánh báo cáo" });
      }

      // --- Xác định khoảng thời gian lọc ---
      let start: Date;
      let end: Date;

      if (startDate && endDate) {
        // Client truyền khoảng thời gian tùy chỉnh
        start = new Date(startDate as string);
        start.setHours(0, 0, 0, 0);
        end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
      } else {
        // Mặc định: hôm nay
        start = new Date();
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setHours(23, 59, 59, 999);
      }

      // 1. Doanh thu theo kỳ (chỉ tính hóa đơn PAID)
      const periodOrders = await prisma.cafeOrder.findMany({
        where: {
          status: "PAID",
          branchId: targetBranchId,
          createdAt: {
            gte: start,
            lte: end
          }
        },
        include: {
          payments: true
        }
      });

      const periodRevenue = periodOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
      const periodOrdersCount = periodOrders.length;
      const periodAOV = periodOrdersCount > 0 ? periodRevenue / periodOrdersCount : 0;

      // 2. Doanh thu theo phương thức thanh toán trong kỳ
      const periodPayments = await prisma.payment.findMany({
        where: {
          createdAt: {
            gte: start,
            lte: end
          },
          order: {
            status: "PAID",
            branchId: targetBranchId
          }
        }
      });

      const revenueByMethod = {
        CASH: 0,
        BANK_TRANSFER: 0,
        E_WALLET: 0,
        CARD: 0
      };

      periodPayments.forEach(payment => {
        const method = payment.paymentMethod;
        if (method in revenueByMethod) {
          revenueByMethod[method] += Number(payment.amount);
        }
      });

      // 3. Top món bán chạy nhất trong kỳ
      const paidOrderItems = await prisma.cafeOrderItem.findMany({
        where: {
          order: {
            status: "PAID",
            branchId: targetBranchId,
            createdAt: {
              gte: start,
              lte: end
            }
          }
        },
        select: {
          productId: true,
          productName: true,
          quantity: true,
          unitPrice: true
        }
      });

      const productSalesMap = new Map<string, { name: string, quantity: number, revenue: number }>();
      
      paidOrderItems.forEach(item => {
        const key = item.productId || item.productName;
        const current = productSalesMap.get(key) || { name: item.productName, quantity: 0, revenue: 0 };
        
        current.quantity += item.quantity;
        current.revenue += Number(item.unitPrice) * item.quantity;
        
        productSalesMap.set(key, current);
      });

      const topProducts = Array.from(productSalesMap.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      // 4. Danh sách 5 hóa đơn thanh toán gần đây nhất trong kỳ
      const recentOrders = await prisma.cafeOrder.findMany({
        where: {
          status: "PAID",
          branchId: targetBranchId,
          createdAt: {
            gte: start,
            lte: end
          }
        },
        include: {
          table: true,
          payments: true
        },
        orderBy: {
          updatedAt: "desc"
        },
        take: 5
      });

      // 5. Doanh thu tháng hiện tại (luôn cố định theo tháng thực)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      const monthOrders = await prisma.cafeOrder.findMany({
        where: {
          status: "PAID",
          branchId: targetBranchId,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        select: {
          totalAmount: true
        }
      });
      const monthRevenue = monthOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);

      return res.json({
        periodRevenue,
        periodOrdersCount,
        periodAOV,
        monthRevenue,
        revenueByMethod,
        topProducts,
        recentOrders: recentOrders.map(order => ({
          id: order.id,
          tableName: order.table.name,
          totalAmount: order.totalAmount,
          paymentMethod: order.payments[0]?.paymentMethod || "CASH",
          payTime: order.updatedAt
        })),
        // backward compat
        todayRevenue: periodRevenue,
        todayOrdersCount: periodOrdersCount,
        todayAOV: periodAOV,
      });
    } catch (error) {
      console.error("Get POS dashboard analytics error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi lấy số liệu thống kê" });
    }
  }
};
