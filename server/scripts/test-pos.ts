import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:4000/api";

async function runTests() {
  console.log("=================================================");
  console.log("   BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG CÁC API POS CAFE     ");
  console.log("=================================================\n");

  const testUser = {
    username: "test_admin_" + Math.floor(Math.random() * 1000) + "@test.com",
    password: "Password123!",
    fullName: "Kiểm Thử Viên Admin"
  };

  let token = "";
  let headers: HeadersInit = {};
  
  // Dynamic test data references
  let testCategoryId = "";
  let testProductId1 = "";
  let testProductId2 = "";
  let testTableId = "";
  let testOrderId1 = "";
  let testOrderId2 = "";

  try {
    // -------------------------------------------------------------
    // TEST 1: SETUP ADMIN USER
    // -------------------------------------------------------------
    console.log("[TEST 1] Thử nghiệm tạo tài khoản Setup Admin ban đầu...");
    // Gọi API setup (chỉ thành công nếu chưa có admin nào trong DB)
    const setupResponse = await fetch(`${BASE_URL}/pos/auth/setup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser)
    });

    const setupData = await setupResponse.json();
    if (setupResponse.status === 201 || setupResponse.status === 200) {
      console.log("-> Setup Admin thành công hoặc đã có sẵn Admin!");
    } else {
      // Nếu db đã có admin, setup sẽ trả về 403. Ta sẽ tạo tài khoản kiểm thử trực tiếp qua Prisma để test các API sau.
      console.log(`-> Setup API trả về ${setupResponse.status}: ${setupData.message || "(Đã có admin trong hệ thống)"}`);
      console.log("-> Đang tạo tài khoản kiểm thử trực tiếp qua Database để tiếp tục test...");
      
      const passwordHash = await bcrypt.hash(testUser.password, 10);
      
      // Upsert tài khoản kiểm thử
      const user = await prisma.user.upsert({
        where: { email: testUser.username },
        update: {},
        create: {
          email: testUser.username,
          passwordHash,
          fullName: testUser.fullName,
          role: "ADMIN"
        }
      });
      console.log(`-> Đã tạo tài khoản test trực tiếp: ${user.email}`);
    }

    // -------------------------------------------------------------
    // TEST 2: ĐĂNG NHẬP (LOGIN)
    // -------------------------------------------------------------
    console.log("\n[TEST 2] Đăng nhập tài khoản Admin...");
    const loginResponse = await fetch(`${BASE_URL}/pos/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: testUser.username,
        password: testUser.password
      })
    });

    const loginData = await loginResponse.json();
    if (loginResponse.ok && loginData.token) {
      token = loginData.token;
      headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      };
      console.log("-> Đăng nhập thành công! Nhận token JWT.");
    } else {
      throw new Error(`Đăng nhập thất bại: ${loginData.message}`);
    }

    // Lấy thông tin bản thân (me)
    const meResponse = await fetch(`${BASE_URL}/pos/auth/me`, { headers });
    const meData = await meResponse.json();
    if (meResponse.ok && meData.user) {
      console.log(`-> API /me trả về đúng thông tin user: ${meData.user.fullName} (${meData.user.role})`);
    } else {
      throw new Error("Lỗi gọi API /me");
    }

    // -------------------------------------------------------------
    // TEST 3: CRUD DANH MỤC (CATEGORIES)
    // -------------------------------------------------------------
    console.log("\n[TEST 3] CRUD Danh mục món ăn/uống...");
    // 3a. Tạo danh mục
    const catCreateResponse = await fetch(`${BASE_URL}/pos/categories`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "Cà phê Pha Máy Test",
        description: "Hạt Robusta phối Arabica chất lượng cao"
      })
    });
    const catCreateData = await catCreateResponse.json();
    if (catCreateResponse.status === 201) {
      testCategoryId = catCreateData.id;
      console.log(`-> Tạo danh mục thành công: ${catCreateData.name} (ID: ${testCategoryId})`);
    } else {
      throw new Error(`Lỗi tạo danh mục: ${catCreateData.message}`);
    }

    // 3b. Sửa danh mục
    const catUpdateResponse = await fetch(`${BASE_URL}/pos/categories/${testCategoryId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        name: "Cà phê Pha Máy Test Sửa",
        description: "Hạt Robusta phối Arabica chất lượng cao nhất"
      })
    });
    const catUpdateData = await catUpdateResponse.json();
    if (catUpdateResponse.ok) {
      console.log(`-> Cập nhật danh mục thành công: ${catUpdateData.name}`);
    } else {
      throw new Error(`Lỗi cập nhật danh mục: ${catUpdateData.message}`);
    }

    // 3c. Lấy danh sách danh mục
    const catListResponse = await fetch(`${BASE_URL}/pos/categories`, { headers });
    const catListData = await catListResponse.json();
    if (catListResponse.ok && Array.isArray(catListData)) {
      const found = catListData.find((c: any) => c.id === testCategoryId);
      if (found) {
        console.log(`-> Lấy danh sách danh mục ok. Tìm thấy danh mục vừa tạo: ${found.name}`);
      } else {
        throw new Error("Không tìm thấy danh mục vừa tạo trong danh sách.");
      }
    } else {
      throw new Error("Lỗi lấy danh sách danh mục.");
    }

    // -------------------------------------------------------------
    // TEST 4: CRUD MÓN ĂN / NƯỚC UỐNG (PRODUCTS)
    // -------------------------------------------------------------
    console.log("\n[TEST 4] CRUD Món ăn / Đồ uống...");
    // 4a. Tạo món 1 (Espresso)
    const prodCreate1 = await fetch(`${BASE_URL}/pos/products`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "Espresso Test",
        price: 25000,
        categoryId: testCategoryId
      })
    });
    const prodCreate1Data = await prodCreate1.json();
    if (prodCreate1.status === 201) {
      testProductId1 = prodCreate1Data.id;
      console.log(`-> Tạo món 1 thành công: ${prodCreate1Data.name} - ${prodCreate1Data.price}đ`);
    } else {
      throw new Error(`Lỗi tạo món 1: ${prodCreate1Data.message}`);
    }

    // 4b. Tạo món 2 (Latte)
    const prodCreate2 = await fetch(`${BASE_URL}/pos/products`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "Latte Macchiato Test",
        price: 45000,
        categoryId: testCategoryId
      })
    });
    const prodCreate2Data = await prodCreate2.json();
    if (prodCreate2.status === 201) {
      testProductId2 = prodCreate2Data.id;
      console.log(`-> Tạo món 2 thành công: ${prodCreate2Data.name} - ${prodCreate2Data.price}đ`);
    } else {
      throw new Error(`Lỗi tạo món 2: ${prodCreate2Data.message}`);
    }

    // 4c. Cập nhật món 1 (Đổi giá và trạng thái)
    const prodUpdate1 = await fetch(`${BASE_URL}/pos/products/${testProductId1}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        price: 27000,
        isAvailable: true
      })
    });
    const prodUpdate1Data = await prodUpdate1.json();
    if (prodUpdate1.ok) {
      console.log(`-> Cập nhật món 1 thành công. Giá mới: ${prodUpdate1Data.price}đ`);
    } else {
      throw new Error("Lỗi cập nhật món 1");
    }

    // 4d. Lọc lấy danh sách món
    const prodListResponse = await fetch(`${BASE_URL}/pos/products?categoryId=${testCategoryId}`, { headers });
    const prodListData = await prodListResponse.json();
    if (prodListResponse.ok && Array.isArray(prodListData)) {
      console.log(`-> Lọc món theo danh mục thành công. Số lượng: ${prodListData.length}`);
    } else {
      throw new Error("Lỗi lấy danh sách món.");
    }

    // -------------------------------------------------------------
    // TEST 5: CRUD SƠ ĐỒ BÀN (TABLES)
    // -------------------------------------------------------------
    console.log("\n[TEST 5] CRUD Sơ đồ Bàn...");
    // 5a. Tạo bàn mới
    const tableCreateResponse = await fetch(`${BASE_URL}/pos/tables`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "Bàn Kiểm Thử " + Math.floor(Math.random() * 100)
      })
    });
    const tableCreateData = await tableCreateResponse.json();
    if (tableCreateResponse.status === 201) {
      testTableId = tableCreateData.id;
      console.log(`-> Tạo bàn thành công: ${tableCreateData.name} - Trạng thái: ${tableCreateData.status}`);
    } else {
      throw new Error(`Lỗi tạo bàn: ${tableCreateData.message}`);
    }

    // 5b. Đổi tên bàn
    const newTableName = tableCreateData.name + " Sửa";
    const tableUpdateResponse = await fetch(`${BASE_URL}/pos/tables/${testTableId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        name: newTableName
      })
    });
    const tableUpdateData = await tableUpdateResponse.json();
    if (tableUpdateResponse.ok) {
      console.log(`-> Đổi tên bàn thành công thành: ${tableUpdateData.name}`);
    } else {
      throw new Error("Lỗi cập nhật bàn");
    }

    // -------------------------------------------------------------
    // TEST 6: NGHIỆP VỤ ORDER & THANH TOÁN (ORDER & PAY)
    // -------------------------------------------------------------
    console.log("\n[TEST 6] Quy trình Order & Thanh toán hoá đơn...");
    // 6a. Mở hóa đơn mới (Espresso x2)
    const orderCreateResponse = await fetch(`${BASE_URL}/pos/orders`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        tableId: testTableId,
        items: [
          { productId: testProductId1, quantity: 2, notes: "Ít đường" }
        ]
      })
    });
    const orderCreateData = await orderCreateResponse.json();
    if (orderCreateResponse.status === 201) {
      testOrderId1 = orderCreateData.id;
      console.log(`-> Tạo hóa đơn thành công! ID: ${testOrderId1}`);
      console.log(`   Tổng tiền: ${orderCreateData.totalAmount}đ - Trạng thái: ${orderCreateData.status}`);
    } else {
      throw new Error(`Lỗi mở hóa đơn: ${orderCreateData.message}`);
    }

    // Kiểm tra trạng thái bàn (phải chuyển sang SERVING)
    const tableCheckResponse1 = await fetch(`${BASE_URL}/pos/tables`, { headers });
    const tablesList1 = await tableCheckResponse1.json();
    const table1 = tablesList1.find((t: any) => t.id === testTableId);
    console.log(`-> Trạng thái bàn kiểm thử sau khi mở hóa đơn: ${table1.status} (Kỳ vọng: SERVING)`);
    if (table1.status !== "SERVING") throw new Error("Sai trạng thái bàn sau khi order.");

    // 6b. Thêm món vào hóa đơn đang mở (Thêm Latte x1)
    const orderUpdateItemsResponse = await fetch(`${BASE_URL}/pos/orders/${testOrderId1}/items`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        items: [
          { productId: testProductId1, quantity: 2, notes: "Ít đường" },
          { productId: testProductId2, quantity: 1, notes: "Nhiều đá" }
        ]
      })
    });
    const orderUpdateItemsData = await orderUpdateItemsResponse.json();
    if (orderUpdateItemsResponse.ok) {
      console.log(`-> Cập nhật thêm món thành công! Tổng tiền mới: ${orderUpdateItemsData.totalAmount}đ`);
      console.log(`   Số lượng món trong bill: ${orderUpdateItemsData.items.length}`);
    } else {
      throw new Error("Lỗi cập nhật món ăn vào hóa đơn.");
    }

    // 6c. Thanh toán chốt hóa đơn (Payment bằng BANK_TRANSFER)
    console.log(`-> Đang tiến hành thanh toán hóa đơn ${testOrderId1} bằng CHUYỂN KHOẢN...`);
    const payResponse = await fetch(`${BASE_URL}/pos/orders/${testOrderId1}/pay`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        paymentMethod: "BANK_TRANSFER"
      })
    });
    const payData = await payResponse.json();
    if (payResponse.ok && payData.order.status === "PAID") {
      console.log(`-> Chốt thanh toán thành công! Trạng thái đơn hàng: ${payData.order.status}`);
      console.log(`   Số tiền đã thanh toán: ${payData.payment.amount}đ - Phương thức: ${payData.payment.paymentMethod}`);
    } else {
      throw new Error(`Lỗi thanh toán hóa đơn: ${payData.message}`);
    }

    // Kiểm tra trạng thái bàn (phải giải phóng về EMPTY)
    const tableCheckResponse2 = await fetch(`${BASE_URL}/pos/tables`, { headers });
    const tablesList2 = await tableCheckResponse2.json();
    const table2 = tablesList2.find((t: any) => t.id === testTableId);
    console.log(`-> Trạng thái bàn kiểm thử sau khi thanh toán: ${table2.status} (Kỳ vọng: EMPTY)`);
    if (table2.status !== "EMPTY") throw new Error("Bàn không được giải phóng về trống.");

    // -------------------------------------------------------------
    // TEST 7: HỦY HÓA ĐƠN ĐANG MỞ (CANCEL ORDER)
    // -------------------------------------------------------------
    console.log("\n[TEST 7] Quy trình hủy hóa đơn chưa thanh toán...");
    // 7a. Mở tiếp bill mới (Latte x2)
    const orderCreateResponse2 = await fetch(`${BASE_URL}/pos/orders`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        tableId: testTableId,
        items: [
          { productId: testProductId2, quantity: 2 }
        ]
      })
    });
    const orderCreateData2 = await orderCreateResponse2.json();
    testOrderId2 = orderCreateData2.id;
    console.log(`-> Đã mở bill thứ hai cho bàn. ID: ${testOrderId2}. Tiến hành hủy bill...`);

    // 7b. Hủy bill
    const cancelResponse = await fetch(`${BASE_URL}/pos/orders/${testOrderId2}/status`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        status: "CANCELLED"
      })
    });
    const cancelData = await cancelResponse.json();
    if (cancelResponse.ok && cancelData.order.status === "CANCELLED") {
      console.log(`-> Hủy hóa đơn thành công! Trạng thái đơn: ${cancelData.order.status}`);
    } else {
      throw new Error(`Lỗi khi hủy hóa đơn: ${cancelData.message}`);
    }

    // Kiểm tra bàn giải phóng về EMPTY
    const tableCheckResponse3 = await fetch(`${BASE_URL}/pos/tables`, { headers });
    const tablesList3 = await tableCheckResponse3.json();
    const table3 = tablesList3.find((t: any) => t.id === testTableId);
    console.log(`-> Trạng thái bàn sau khi hủy hóa đơn: ${table3.status} (Kỳ vọng: EMPTY)`);
    if (table3.status !== "EMPTY") throw new Error("Bàn không được giải phóng sau khi hủy hóa đơn.");

    // -------------------------------------------------------------
    // TEST 8: DASHBOARD BÁO CÁO DOANH THU (ANALYTICS)
    // -------------------------------------------------------------
    console.log("\n[TEST 8] Lấy báo cáo doanh thu từ Dashboard...");
    const analyticsResponse = await fetch(`${BASE_URL}/pos/analytics/dashboard`, { headers });
    const analyticsData = await analyticsResponse.json();
    if (analyticsResponse.ok) {
      console.log(`-> Doanh thu hôm nay (Today Revenue): ${analyticsData.todayRevenue}đ`);
      console.log(`-> Số hóa đơn chốt hôm nay: ${analyticsData.todayOrdersCount}`);
      console.log(`-> Cơ cấu thanh toán:`, analyticsData.revenueByMethod);
      console.log(`-> Top sản phẩm bán chạy:`, analyticsData.topProducts.map((p: any) => `${p.name} (SL: ${p.quantity})`));
    } else {
      throw new Error("Không lấy được dữ liệu thống kê doanh thu.");
    }

    // -------------------------------------------------------------
    // CLEANUP TEST DATA (XÓA DỮ LIỆU ĐÃ TẠO)
    // -------------------------------------------------------------
    console.log("\n[TEST 9] Dọn dẹp dữ liệu kiểm thử...");
    
    // Xóa orderItems và orders
    await prisma.cafeOrderItem.deleteMany({
      where: { orderId: { in: [testOrderId1, testOrderId2] } }
    });
    await prisma.payment.deleteMany({
      where: { orderId: { in: [testOrderId1, testOrderId2] } }
    });
    await prisma.cafeOrder.deleteMany({
      where: { id: { in: [testOrderId1, testOrderId2] } }
    });
    
    // Xóa product, category, table và user
    await prisma.product.deleteMany({
      where: { id: { in: [testProductId1, testProductId2] } }
    });
    await prisma.category.deleteMany({
      where: { id: testCategoryId }
    });
    await prisma.cafeTable.deleteMany({
      where: { id: testTableId }
    });
    await prisma.user.deleteMany({
      where: { email: testUser.username }
    });

    console.log("-> Đã dọn dẹp sạch sẽ dữ liệu kiểm thử khỏi database!");
    console.log("\n=================================================");
    console.log("   KIỂM THỬ HOÀN TẤT: TẤT CẢ API CHẠY THÀNH CÔNG! ");
    console.log("=================================================");

  } catch (error: any) {
    console.error("\n❌ Gặp lỗi trong quá trình kiểm thử:", error.message);
    
    // Dọn dẹp sơ bộ nếu lỗi
    try {
      if (testOrderId1 || testOrderId2) {
        await prisma.cafeOrderItem.deleteMany({ where: { orderId: { in: [testOrderId1, testOrderId2] } } });
        await prisma.payment.deleteMany({ where: { orderId: { in: [testOrderId1, testOrderId2] } } });
        await prisma.cafeOrder.deleteMany({ where: { id: { in: [testOrderId1, testOrderId2] } } });
      }
      if (testProductId1 || testProductId2) {
        await prisma.product.deleteMany({ where: { id: { in: [testProductId1, testProductId2] } } });
      }
      if (testCategoryId) {
        await prisma.category.deleteMany({ where: { id: testCategoryId } });
      }
      if (testTableId) {
        await prisma.cafeTable.deleteMany({ where: { id: testTableId } });
      }
      await prisma.user.deleteMany({ where: { email: testUser.username } });
      console.log("-> Đã dọn dẹp dữ liệu kiểm thử sau lỗi.");
    } catch (cleanErr) {
      // Bỏ qua
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
