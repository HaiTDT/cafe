import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { CafeOrderStatus, CafeTableStatus, PaymentMethod } from "@prisma/client";

export const posOrderController = {
  // Lấy các hóa đơn đang mở (PENDING)
  async listActive(req: Request, res: Response) {
    try {
      const orders = await prisma.cafeOrder.findMany({
        where: { status: "PENDING" },
        include: {
          table: true,
          items: {
            include: { product: true }
          }
        },
        orderBy: { createdAt: "desc" }
      });
      return res.json(orders);
    } catch (error) {
      console.error("List active orders error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi lấy danh sách hóa đơn đang hoạt động" });
    }
  },

  // Lấy hóa đơn đang mở của bàn cụ thể
  async getByTable(req: Request, res: Response) {
    try {
      const { tableId } = req.params;

      const order = await prisma.cafeOrder.findFirst({
        where: {
          tableId,
          status: "PENDING"
        },
        include: {
          table: true,
          items: {
            orderBy: { createdAt: "asc" }
          }
        }
      });

      if (!order) {
        return res.status(404).json({ message: "Không tìm thấy hóa đơn đang mở cho bàn này" });
      }

      return res.json(order);
    } catch (error) {
      return res.status(500).json({ message: "Lỗi hệ thống khi lấy hóa đơn của bàn" });
    }
  },

  // Tạo hóa đơn mới cho bàn
  async create(req: Request, res: Response) {
    try {
      const { tableId, items } = req.body; // items: Array<{ productId: string, quantity: number, notes?: string }>

      if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Vui lòng chọn bàn và ít nhất một món ăn/uống" });
      }

      const table = await prisma.cafeTable.findUnique({
        where: { id: tableId }
      });

      if (!table) {
        return res.status(404).json({ message: "Không tìm thấy bàn" });
      }

      if (table.status !== "EMPTY") {
        return res.status(400).json({ message: "Bàn này đang có khách phục vụ hoặc đang chờ thanh toán. Vui lòng cập nhật hóa đơn hiện có." });
      }

      // Lấy thông tin các sản phẩm
      const productIds = items.map(item => item.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } }
      });

      if (products.length === 0) {
        return res.status(400).json({ message: "Danh sách món ăn/uống không hợp lệ" });
      }

      const productMap = new Map(products.map(p => [p.id, p]));

      // Tính tổng tiền và chuẩn bị danh sách item
      let totalAmount = 0;
      const orderItemsData: { productId: string; productName: string; unitPrice: number; quantity: number; notes: string | null }[] = [];

      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) {
          return res.status(400).json({ message: `Món ăn có ID ${item.productId} không tồn tại` });
        }
        if (!product.isAvailable) {
          return res.status(400).json({ message: `Món "${product.name}" hiện tại đã hết hàng, không thể order.` });
        }

        const price = Number(product.price);
        const qty = Number(item.quantity);
        if (isNaN(qty) || qty <= 0) {
          return res.status(400).json({ message: "Số lượng món ăn phải lớn hơn 0" });
        }

        totalAmount += price * qty;

        orderItemsData.push({
          productId: product.id,
          productName: product.name,
          unitPrice: price,
          quantity: qty,
          notes: item.notes || null
        });
      }

      // Thực hiện transaction tạo order và cập nhật status bàn
      const result = await prisma.$transaction(async (tx) => {
        const order = await tx.cafeOrder.create({
          data: {
            tableId,
            status: "PENDING",
            totalAmount,
            createdById: req.posUser?.id || null,
            items: {
              createMany: {
                data: orderItemsData
              }
            }
          },
          include: {
            items: true,
            table: true
          }
        });

        await tx.cafeTable.update({
          where: { id: tableId },
          data: { status: "SERVING" }
        });

        return order;
      });

      return res.status(201).json(result);
    } catch (error) {
      console.error("Create order error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi tạo hóa đơn" });
    }
  },

  // Cập nhật món trong hóa đơn (thêm/sửa/xóa item)
  async updateItems(req: Request, res: Response) {
    try {
      const { id } = req.params; // orderId
      const { items } = req.body; // Danh sách items mới đầy đủ: Array<{ productId: string, quantity: number, notes?: string }>

      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ message: "Danh sách món ăn không hợp lệ" });
      }

      const order = await prisma.cafeOrder.findUnique({
        where: { id },
        include: { table: true }
      });

      if (!order) {
        return res.status(404).json({ message: "Không tìm thấy hóa đơn" });
      }

      if (order.status !== "PENDING") {
        return res.status(400).json({ message: "Chỉ có thể cập nhật món cho hóa đơn đang phục vụ (PENDING)" });
      }

      // Lấy thông tin các sản phẩm
      const productIds = items.map(item => item.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } }
      });

      const productMap = new Map(products.map(p => [p.id, p]));

      // Tính tổng tiền và chuẩn bị danh sách item mới
      let totalAmount = 0;
      const orderItemsData: { productId: string; productName: string; unitPrice: number; quantity: number; notes: string | null }[] = [];

      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) {
          return res.status(400).json({ message: `Món ăn có ID ${item.productId} không tồn tại` });
        }
        
        // Chú ý: Cho phép cập nhật nếu món đã có sẵn trong bill cũ kể cả khi hiện tại nó hết hàng
        const price = Number(product.price);
        const qty = Number(item.quantity);
        if (isNaN(qty) || qty <= 0) {
          return res.status(400).json({ message: "Số lượng món ăn phải lớn hơn 0" });
        }

        totalAmount += price * qty;

        orderItemsData.push({
          productId: product.id,
          productName: product.name,
          unitPrice: price,
          quantity: qty,
          notes: item.notes || null
        });
      }

      // Thực hiện transaction cập nhật hóa đơn
      const result = await prisma.$transaction(async (tx) => {
        // Xóa tất cả các items cũ của order này
        await tx.cafeOrderItem.deleteMany({
          where: { orderId: id }
        });

        // Tạo các items mới
        const updatedOrder = await tx.cafeOrder.update({
          where: { id },
          data: {
            totalAmount,
            items: {
              createMany: {
                data: orderItemsData
              }
            }
          },
          include: {
            items: true,
            table: true
          }
        });

        // Nếu bàn đang ở trạng thái WAITING_PAYMENT mà cập nhật món thêm thì đưa về SERVING
        if (order.table.status === "WAITING_PAYMENT" && items.length > 0) {
          await tx.cafeTable.update({
            where: { id: order.tableId },
            data: { status: "SERVING" }
          });
        } else if (items.length === 0) {
          // Nếu xóa hết món trong bill, đưa bàn về EMPTY và CANCELLED hóa đơn?
          // Ở đây, thông thường POS cho phép xóa món, nhưng nếu trống bill ta có thể giữ nguyên hoặc cảnh báo.
          // Để an toàn, nếu bill rỗng thì giữ nguyên tổng tiền = 0.
        }

        return updatedOrder;
      });

      return res.json(result);
    } catch (error) {
      console.error("Update order items error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật hóa đơn" });
    }
  },

  // Chốt thanh toán hóa đơn
  async pay(req: Request, res: Response) {
    try {
      const { id } = req.params; // orderId
      const { paymentMethod } = req.body; // CASH, BANK_TRANSFER, E_WALLET, CARD

      if (!paymentMethod || !Object.values(PaymentMethod).includes(paymentMethod)) {
        return res.status(400).json({ message: "Phương thức thanh toán không hợp lệ" });
      }

      const order = await prisma.cafeOrder.findUnique({
        where: { id },
        include: { items: true, table: true }
      });

      if (!order) {
        return res.status(404).json({ message: "Không tìm thấy hóa đơn" });
      }

      if (order.status !== "PENDING") {
        return res.status(400).json({ message: "Hóa đơn này đã được thanh toán hoặc đã bị hủy" });
      }

      if (order.items.length === 0) {
        return res.status(400).json({ message: "Không thể thanh toán hóa đơn không có món ăn nào" });
      }

      const totalAmount = Number(order.totalAmount);

      const result = await prisma.$transaction(async (tx) => {
        // 1. Tạo bản ghi thanh toán
        const payment = await tx.payment.create({
          data: {
            orderId: id,
            amount: totalAmount,
            paymentMethod: paymentMethod as PaymentMethod
          }
        });

        // 2. Đổi trạng thái hóa đơn sang PAID
        const updatedOrder = await tx.cafeOrder.update({
          where: { id },
          data: {
            status: "PAID"
          },
          include: {
            items: true,
            table: true,
            payments: true
          }
        });

        // 3. Giải phóng bàn về EMPTY
        await tx.cafeTable.update({
          where: { id: order.tableId },
          data: { status: "EMPTY" }
        });

        return { order: updatedOrder, payment };
      });

      return res.json({
        message: "Thanh toán hóa đơn thành công",
        order: result.order,
        payment: result.payment
      });
    } catch (error) {
      console.error("Pay order error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi thanh toán" });
    }
  },

  // Hủy hoặc Hoàn tiền hóa đơn (Chỉ Admin)
  async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body; // CANCELLED hoặc REFUNDED

      if (status !== "CANCELLED" && status !== "REFUNDED") {
        return res.status(400).json({ message: "Trạng thái cập nhật không hợp lệ. Chỉ chấp nhận CANCELLED hoặc REFUNDED." });
      }

      const order = await prisma.cafeOrder.findUnique({
        where: { id },
        include: { table: true }
      });

      if (!order) {
        return res.status(404).json({ message: "Không tìm thấy hóa đơn" });
      }

      // Quy tắc: Không cho xóa bill đã thanh toán. Để sửa sai thì dùng CANCELLED hoặc REFUNDED.
      // Chỉ cho phép hủy hóa đơn PENDING hoặc hoàn tiền hóa đơn PAID
      if (status === "CANCELLED" && order.status !== "PENDING") {
        return res.status(400).json({ message: "Chỉ có thể hủy hóa đơn chưa thanh toán (PENDING)" });
      }

      if (status === "REFUNDED" && order.status !== "PAID") {
        return res.status(400).json({ message: "Chỉ có thể hoàn tiền hóa đơn đã thanh toán (PAID)" });
      }

      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.cafeOrder.update({
          where: { id },
          data: { status: status as CafeOrderStatus }
        });

        // Nếu hóa đơn bị hủy/hoàn tiền khi bàn vẫn đang SERVING hoặc WAITING_PAYMENT liên quan tới hóa đơn này, giải phóng bàn về EMPTY
        // Để kiểm tra, ta lấy trạng thái bàn hiện tại, nếu bàn vẫn thuộc order này
        const currentActiveOrderForTable = await tx.cafeOrder.findFirst({
          where: { tableId: order.tableId, status: "PENDING" }
        });

        // Nếu không còn hóa đơn PENDING nào khác cho bàn này, giải phóng bàn
        if (!currentActiveOrderForTable) {
          await tx.cafeTable.update({
            where: { id: order.tableId },
            data: { status: "EMPTY" }
          });
        }

        return updated;
      });

      return res.json({
        message: status === "CANCELLED" ? "Hủy hóa đơn thành công" : "Hoàn tiền hóa đơn thành công",
        order: result
      });
    } catch (error) {
      console.error("Update order status error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi cập nhật trạng thái hóa đơn" });
    }
  },

  // Xem lịch sử hóa đơn
  async listHistory(req: Request, res: Response) {
    try {
      const { startDate, endDate, status } = req.query;

      const where: any = {};

      if (status) {
        where.status = status as CafeOrderStatus;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(String(startDate));
        }
        if (endDate) {
          // Thêm 23h59m59s để bao phủ cả ngày kết thúc
          const end = new Date(String(endDate));
          end.setHours(23, 59, 59, 999);
          where.createdAt.lte = end;
        }
      }

      const orders = await prisma.cafeOrder.findMany({
        where,
        include: {
          table: true,
          items: true,
          payments: true
        },
        orderBy: { createdAt: "desc" }
      });

      return res.json(orders);
    } catch (error) {
      console.error("List history error:", error);
      return res.status(500).json({ message: "Lỗi hệ thống khi lấy lịch sử hóa đơn" });
    }
  }
};
