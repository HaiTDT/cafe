import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const posAnalyticsController = {
  async getDashboard(req: Request, res: Response) {
    try {
      const now = new Date();
      
      // Tính thời gian bắt đầu và kết thúc của hôm nay (múi giờ local Việt Nam +7)
      // Để đơn giản và chính xác, ta lấy mốc UTC tương ứng với ngày hôm nay ở VN
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0); // Trả về đầu ngày giờ local

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999); // Trả về cuối ngày giờ local

      // 1. Doanh thu hôm nay (chỉ tính hóa đơn PAID)
      const todayOrders = await prisma.cafeOrder.findMany({
        where: {
          status: "PAID",
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
      // Lấy tất cả các Payments được tạo trong hôm nay
      const todayPayments = await prisma.payment.findMany({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          },
          order: {
            status: "PAID"
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

      // 3. Top món bán chạy nhất (mọi thời đại hoặc trong tháng này)
      // Chúng ta sẽ lấy Top 5 món bán chạy nhất từ trước đến nay trong các bill đã thanh toán (PAID)
      const paidOrderItems = await prisma.cafeOrderItem.findMany({
        where: {
          order: {
            status: "PAID"
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
        const key = item.productId || item.productName; // Nếu sản phẩm bị xóa thì dùng tên món làm key
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
          status: "PAID"
        },
        include: {
          table: true,
          payments: true
        },
        orderBy: {
          updatedAt: "desc" // Hóa đơn vừa chốt thanh toán xong
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
