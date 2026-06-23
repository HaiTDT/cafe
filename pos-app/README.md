# ☕ Hậu Lê Coffee POS - Mobile Application

Ứng dụng di động và vạn năng (universal app) dành cho nhân viên phục vụ và quản lý tại chuỗi chi nhánh **Hậu Lê Coffee**. Ứng dụng được xây dựng trên nền tảng **Expo** và **React Native**, cho phép chạy mượt mà trên cả Android, iOS và trình duyệt Web.

---

## ✨ Các tính năng chính

1. **Đăng nhập nhân viên:** Xác thực tài khoản nhân viên theo từng chi nhánh.
2. **Sơ đồ bàn thời gian thực (Table Map):**
   - Xem nhanh sơ đồ và vị trí bàn trong quán.
   - Trạng thái bàn trực quan: `EMPTY` (Trắng - Bàn trống), `SERVING` (Nâu - Đang ăn uống), `WAITING_PAYMENT` (Cam - Đang đợi thanh toán).
   - Bộ đếm thời gian (TableTimer) hiển thị thời gian khách đã dùng dịch vụ kể từ khi mở bill.
3. **Màn hình gọi món (Order Screen):**
   - Duyệt thực đơn theo danh mục (cà phê, trà, sinh tố...).
   - Thêm món ăn/uống vào bàn kèm ghi chú tùy chỉnh (ví dụ: *không đường, ít đá, nhiều sữa*).
   - Tăng/giảm số lượng, xóa món linh hoạt trước khi gửi yêu cầu.
4. **Quy trình thanh toán (Checkout):**
   - Lập hóa đơn và tính tổng tiền tự động.
   - Hỗ trợ nhiều phương thức thanh toán: Tiền mặt (`CASH`), Chuyển khoản ngân hàng (`BANK_TRANSFER`), Ví điện tử (`E_WALLET`), Thẻ ATM/Tín dụng (`CARD`).
5. **Báo cáo doanh thu (Dành cho Admin chi nhánh):**
   - Xem tổng doanh thu và số đơn hàng trong kỳ.
   - Biểu đồ cơ cấu phương thức thanh toán.
   - Danh sách các món nước bán chạy nhất và lịch sử hóa đơn gần đây.

---

## 🛠️ Công nghệ sử dụng

- **Framework:** Expo SDK 54 & React Native 0.81
- **Điều hướng:** Expo Router (File-based Routing)
- **Icons:** Lucide React Native
- **Động họa:** React Native Reanimated v4
- **Lưu trữ dữ liệu:** AsyncStorage
- **API Client:** Fetch API tích hợp xác thực JWT và Header Chi nhánh (`x-branch-id`)

---

## 🚀 Hướng dẫn khởi chạy

### Yêu cầu chuẩn bị
- Node.js 18+
- Đã cài đặt dependencies ở thư mục gốc (`npm install`)

### Các bước chạy app

1. **Di chuyển vào thư mục `pos-app`:**
   ```bash
   cd pos-app
   ```

2. **Cài đặt các gói phụ thuộc:**
   ```bash
   npm install
   ```

3. **Cấu hình API Endpoint:**
   Mở file [api.ts](file:///c:/Users/THINKPAD/Documents/cafe%20h%E1%BA%ADu%20l%C3%AA/MIS_HASAKI/pos-app/src/lib/api.ts) và cập nhật đường dẫn API Server:
   - Nếu chạy production/staged: sử dụng link Render mặc định.
   - Nếu test ở local: sửa `DEFAULT_API_URL` thành địa chỉ IP máy tính chạy server của bạn (Ví dụ: `http://192.168.1.15:4000`). *Không dùng `localhost` nếu chạy trên điện thoại thật*.

4. **Chạy Expo server:**
   ```bash
   npm run start
   ```

5. **Chạy ứng dụng:**
   - **Trên điện thoại (Android/iOS):** Tải ứng dụng **Expo Go** từ CH Play hoặc App Store, sau đó quét mã QR hiển thị ở terminal.
   - **Trên giả lập Android:** Nhấn phím `a` trong terminal (cần cài đặt Android Studio & Emulator).
   - **Trên giả lập iOS:** Nhấn phím `i` trong terminal (chỉ dành cho macOS).
   - **Trên trình duyệt Web:** Nhấn phím `w` trong terminal.

---

*Để xem tài liệu chi tiết về toàn bộ hệ thống (bao gồm cả server backend và e-commerce client), vui lòng tham khảo [README.md chính của dự án](file:///c:/Users/THINKPAD/Documents/cafe%20h%E1%BA%ADu%20l%C3%AA/MIS_HASAKI/README.md).*
