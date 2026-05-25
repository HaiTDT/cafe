import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const posAnalyticsController = {
  async getDashboard(req: Request, res: Response) {
    try {
      const { branchId } = req.query;
      const targetBranchId = branchId as string || req.posBranchId;

      if (!targetBranchId) {
        return res.status(400).json({ message: "Vui lòng chỉ định chi nhánh báo cáo" });
      }

      const now = new Date();
      
      // Tính thời gian bắt đầu và kết thúc của hôm nay (múi giờ local Việt Nam +7)
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      // 1. Doanh thu hôm nay (chỉ tính hóa đơn PAID)
      const todayOrders = await prisma.cafeOrder.findMany({
        where: {
          status: "PAID",
          branchId: targetBranchId,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        include: {
          payments: true
        }
      });

      const todayRevenue = todayOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
      const todayOrdersCount = todayOrders.length;
      const todayAOV = todayOrdersCount > 0 ? todayRevenue / todayOrdersCount : 0;

      // 2. Doanh thu theo phương thức thanh toán
      const todayPayments = await prisma.payment.findMany({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
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

      todayPayments.forEach(payment => {
        const method = payment.paymentMethod;
        if (method in revenueByMethod) {
          revenueByMethod[method] += Number(payment.amount);
        }
      });

      // 3. Top món bán chạy nhất
      const paidOrderItems = await prisma.cafeOrderItem.findMany({
        where: {
          order: {
            status: "PAID",
            branchId: targetBranchId
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

      // 4. Danh sách 5 hóa đơn thanh toán gần đây nhất
      const recentOrders = await prisma.cafeOrder.findMany({
        where: {
          status: "PAID",
          branchId: targetBranchId
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

      return res.json({
        todayRevenue,
        todayOrdersCount,
        todayAOV,
        revenueByMethod,
        topProducts,
        recentOrders: recentOrders.map(order => ({
          id: order.id,
          tableName: order.table.name,
          totalAmount: order.totalAmount,
          paymentMethod: order.payments[0]?.paymentMethod || "CASH",
          payTime: order.updatedAt
        }))
      });
    } catch (error) {
      console.error("Get POS dashboard analytics error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi lấy số liệu thống kê" });
    }
  }
};
