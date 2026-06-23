# 💄 Hasaki MIS & ☕ Hậu Lê Coffee POS - Hệ thống Quản trị & Bán hàng Tích hợp

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-blue?style=flat-square&logo=express)](https://expressjs.com/)
[![Expo](https://img.shields.io/badge/Expo-54-000000?style=flat-square&logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=flat-square&logo=react)](https://reactnative.dev/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.19-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini%20AI-2.5%20Flash-F15A24?style=flat-square&logo=google-gemini)](https://deepmind.google/technologies/gemini/)

Chào mừng bạn đến với **Hasaki MIS & Hậu Lê Coffee POS**, một hệ sinh thái monorepo tích hợp toàn diện. Dự án kết hợp giữa **Nền tảng Thương mại điện tử Mỹ phẩm & Hệ quản trị thông minh (MIS/BI)** cho Hasaki, và **Hệ thống Quản lý Bán hàng tại quầy (POS)** dành cho chuỗi chi nhánh Hậu Lê Coffee (gồm cả phiên bản Web POS và ứng dụng di động đa nền tảng Expo/React Native).

---

## 📝 Tổng quan dự án

Dự án được xây dựng theo cấu trúc Monorepo hiệu quả, chia sẻ chung cơ sở dữ liệu PostgreSQL nhưng phục vụ hai mảng kinh doanh cốt lõi:

1. **Hasaki E-commerce & MIS (Bán lẻ Mỹ phẩm & Quản trị Thông minh)**:
   - Cung cấp giao diện mua sắm mỹ phẩm hiện đại cho khách hàng.
   - Bảng điều khiển quản trị thông minh (BI) cho phép tính toán tốc độ bán hàng, dự báo tồn kho, tính toán chỉ số quảng cáo và tự động phân khúc khách hàng CRM bằng thuật toán.
   - Trợ lý hỗ trợ khách hàng thông minh tích hợp AI (Gemini 2.5 Flash) có khả năng tra cứu sản phẩm trực tiếp từ cơ sở dữ liệu.
2. **Hậu Lê Coffee POS (Quản lý chuỗi cửa hàng Cafe)**:
   - Hệ thống POS quản lý chi tiết các chi nhánh, sơ đồ bàn ăn/uống thời gian thực.
   - **Web POS**: Tích hợp trực tiếp trên client để thao tác nhanh trên máy tính.
   - **Mobile POS App (pos-app)**: Ứng dụng Expo / React Native chạy mượt mà trên iOS, Android và Web giúp nhân viên order tại bàn, ghi chú món (đá, đường) và thanh toán nhanh chóng.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

### 1. Frontend Web (Client)
- **Framework:** Next.js 15 (App Router, React 19)
- **Styling:** Tailwind CSS, Framer Motion (Hiệu ứng mượt mà)
- **Trực quan hóa dữ liệu:** Chart.js 4 & `react-chartjs-2`
- **Tiện ích:** Google OAuth 2.0 (`@react-oauth/google`), Lucide Icons, React Quill New (soạn thảo Blog)

### 2. POS Mobile App (pos-app)
- **Framework:** Expo 54 (React Native 0.81)
- **Routing:** Expo Router v6 (File-based Routing)
- **Giao diện & Icon:** Lucide React Native, Reanimated v4 (chuyển động), SVG
- **Lưu trữ cục bộ:** AsyncStorage

### 3. Backend (Server)
- **Runtime:** Node.js (TypeScript & `tsx` để chạy trực tiếp)
- **Framework:** Express.js 4.21
- **ORM:** Prisma v6
- **Bảo mật:** JWT Authentication, Bcrypt, CORS, Helmet, Morgan Logging
- **Trí tuệ nhân tạo:** `@google/generative-ai` (Gemini 2.5 Flash với Function Calling)

### 4. Cơ sở dữ liệu & Hạ tầng
- **Database:** PostgreSQL (Hosted trên Neon Serverless hoặc chạy Docker cục bộ)
- **DevOps:** Docker & Docker Compose (Quản lý database PostgreSQL cục bộ)
- **Kiến trúc:** npm Workspaces (monorepo quản lý `client` và `server`)

---

## ✨ Các tính năng cốt lõi

### 1. 🛒 Thương mại điện tử Hasaki (Dành cho Khách hàng)
* **Xác thực:** Đăng nhập, đăng ký truyền thống hoặc đăng ký/đăng nhập nhanh bằng tài khoản Google (OAuth 2.0).
* **Tìm kiếm & Bộ lọc:** Lọc sản phẩm chi tiết theo danh mục, mức giá và tìm kiếm thông minh.
* **Flash Sales:** Chương trình săn sale thời gian thực có đồng hồ đếm ngược sinh động.
* **Giỏ hàng & Đặt hàng:** Quản lý giỏ hàng trực quan, quy trình checkout an toàn, lưu trữ sổ địa chỉ người dùng.
* **Tài khoản cá nhân:** Đánh giá sản phẩm đã mua (Rating & Comment), lịch sử đơn hàng, danh sách sản phẩm yêu thích.
* **Blog & Làm đẹp:** Trang tin tức, cẩm nang chăm sóc da dành riêng cho cộng đồng.

### 2. 🛡️ Dashboard Quản trị & BI (Dành cho Admin Hasaki)
Hệ thống vận hành theo quy trình BI (Business Intelligence) chuẩn 6 thành phần:
* **CRM & Phân khúc Khách hàng RFM:**
  * Tự động thu thập dữ liệu hành vi giao dịch (Recency, Frequency, Monetary).
  * Áp dụng **thuat toan Quintiles** (chia đều khách hàng thành 5 nhóm 20% tương ứng thang điểm 1-5).
  * Phân khúc tự động thành các nhóm khách hàng: *Champions (Tinh hoa), Loyal (Trung thành), At Risk (Nguy cơ rời bỏ), Lost (Đã mất)* nhằm tối ưu hóa các chiến dịch marketing.
* **Quản trị Kho & Dự báo tồn kho:**
  * Tính toán **Sales Velocity (Tốc độ bán hàng)** trung bình trong 30 ngày gần nhất.
  * Thiết lập **Safety Stock (Tồn kho an toàn)** dự phòng tránh đứt gãy nguồn hàng.
  * Tự động đưa ra **Restock Suggestion (Gợi ý nhập hàng)** theo công thức khoa học: `(Sales Velocity * 1.5) - Tồn kho hiện tại`.
* **Marketing Performance Analytics:**
  * Giả lập chi phí quảng cáo (Ad Spend = 15% doanh thu).
  * Tính toán chỉ số **CAC (Cost per Acquisition)** dựa trên lượng khách hàng mới thu được.
  * Đo lường chỉ số **ROAS (Return on Ad Spend)** để đánh giá hiệu quả chiến dịch (ROAS > 3.0 đạt lợi nhuận tốt).

### 3. ☕ Trợ lý AI Khách hàng (Gemini 2.5 Flash Chatbot)
* Tích hợp trực tiếp trên web client để tư vấn sản phẩm cho khách hàng.
* Sử dụng **Gemini Function Calling** liên kết trực tiếp với database.
* Khi người dùng hỏi tư vấn hoặc tìm kiếm, AI sẽ tự động gọi hàm `searchProducts` để lấy dữ liệu thực tế (Tên sản phẩm, thương hiệu, giá, slug) và trả về đường dẫn Markdown động để khách hàng click mua ngay.

### 4. 🍽️ POS Hậu Lê Coffee (Quản lý quán Cafe tại quầy & di động)
Hệ thống POS phục vụ hoạt động bán hàng trực tiếp tại các chi nhánh cafe:
* **Quản lý Chi nhánh (Branches):** Xem thông tin chi nhánh, quản lý nhân sự thuộc chi nhánh.
* **Sơ đồ Bàn ăn (Table Map):** Hiển thị danh sách bàn theo thời gian thực với các trạng thái màu sắc trực quan:
  * ⚪ `EMPTY` (Bàn trống)
  * 🟤 `SERVING` (Đang phục vụ khách)
  * 🟠 `WAITING_PAYMENT` (Đang chờ thanh toán)
* **Bộ đếm thời gian (TableTimer):** Hiển thị chính xác thời gian khách đã ngồi từ lúc mở hóa đơn để nhân viên tiện phục vụ.
* **Gọi món tại bàn (Order Screen):**
  * Duyệt menu đồ uống theo danh mục nhanh chóng.
  * Thêm món vào hóa đơn kèm ghi chú chi tiết (ví dụ: *ít đá, nhiều đường, không sữa...*).
  * Điều chỉnh số lượng, cộng dồn hoặc xóa món tiện lợi.
* **Thanh toán linh hoạt (Checkout & Payments):**
  * Hỗ trợ nhiều phương thức thanh toán: Tiền mặt (`CASH`), Chuyển khoản (`BANK_TRANSFER`), Ví điện tử (`E_WALLET`), Thẻ (`CARD`).
  * Tự động in hóa đơn và cập nhật trạng thái bàn về `EMPTY`.
* **Thống kê POS (Admin chi nhánh):**
  * Báo cáo Doanh thu kỳ (Hôm nay, Tuần, Tháng, Quý, Năm hoặc Khoảng ngày tùy chọn).
  * Thống kê tỷ trọng phương thức thanh toán bằng biểu đồ tiến trình (Progress Bar).
  * Thống kê Top món bán chạy nhất trong kỳ và danh sách hóa đơn gần đây.

---

## 📂 Cấu trúc thư mục dự án

```text
.
├── client/                     # Frontend Next.js 15 (E-commerce & Web POS)
│   ├── src/
│   │   ├── app/                # Next.js App Router (Pages & Layouts)
│   │   │   ├── admin/          # BI Dashboard của Hasaki
│   │   │   ├── pos/            # Giao diện Web POS Hậu Lê Coffee
│   │   │   ├── flash-sale/     # Giao diện săn sale thời gian thực
│   │   │   └── products/       # Trang chi tiết sản phẩm
│   │   ├── components/         # UI Components chung & Biểu đồ BI Chart.js
│   │   ├── hooks/              # Custom React Hooks
│   │   └── lib/                # API Client & Cấu hình constants
│   └── package.json
│
├── server/                     # Backend Express.js & TypeScript API
│   ├── prisma/
│   │   ├── schema.prisma       # Định nghĩa Database Schema & Models
│   │   └── migrations/         # Lịch sử di cư database
│   ├── src/
│   │   ├── controllers/        # Điều hướng API (bao gồm pos-analytics, pos-order, ai...)
│   │   ├── services/           # Xử lý logic nghiệp vụ BI, AI, Auth, CRM
│   │   ├── routes/             # Định nghĩa các endpoint API
│   │   ├── middlewares/        # Xác thực JWT, phân quyền và bắt lỗi
│   │   └── index.ts            # Điểm khởi chạy API Server chính
│   └── package.json
│
├── pos-app/                    # Ứng dụng di động Expo (Hậu Lê Coffee POS App)
│   ├── src/
│   │   ├── app/                # Expo Router (file-based routing)
│   │   │   ├── (auth)/         # Màn hình đăng nhập nhân viên POS
│   │   │   ├── (tabs)/         # Giao diện chính (Sơ đồ bàn, Menu, Báo cáo doanh thu)
│   │   │   └── order/          # Màn hình Gọi món theo tableId ([tableId].tsx)
│   │   ├── components/         # Các component UI di động (TableTimer, Modals...)
│   │   ├── constants/          # Theme màu sắc, kiểu chữ
│   │   └── lib/                # API Client di động & quản lý Storage cục bộ
│   ├── app.json                # Cấu hình Expo Project
│   └── package.json
│
├── data/                       # Dữ liệu sản phẩm mẫu (hasaki_products_merged.csv)
├── ui-templates/               # Bản vẽ mockup HTML ban đầu của giao diện
├── docker-compose.yml          # Cấu hình chạy PostgreSQL local qua Docker
├── package.json                # Cấu hình Monorepo Workspaces & Scripts chạy chung
└── README.md                   # Tài liệu hướng dẫn dự án
```

---

## ⚙️ Hướng dẫn cài đặt & Khởi chạy

### Yêu cầu hệ thống
* Node.js phiên bản 18 trở lên
* npm phiên bản 9 trở lên
* Docker Desktop (nếu muốn khởi chạy database cục bộ)
* Điện thoại cài sẵn **Expo Go** (để test mobile app) hoặc môi trường giả lập Android/iOS.

---

### Bước 1: Clone dự án và cài đặt dependencies

1. Clone mã nguồn từ repository:
   ```bash
   git clone https://github.com/your-username/mis-hasaki.git
   cd mis-hasaki
   ```

2. Cài đặt các gói phụ thuộc cho toàn bộ monorepo (bao gồm client và server):
   ```bash
   npm install
   ```

3. Cài đặt các gói phụ thuộc riêng cho ứng dụng di động POS:
   ```bash
   cd pos-app
   npm install
   cd ..
   ```

---

### Bước 2: Cấu hình biến môi trường (Environment Variables)

Hãy sao chép các file `.env.example` thành `.env` tại các thư mục tương ứng và điền đầy đủ thông tin:

1. **Cấu hình Backend (`server/.env`):**
   ```env
   PORT=4000
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hasaki_db?schema=public"
   JWT_SECRET="ma_bao_mat_jwt_cuc_ky_an_toan_cua_ban"
   CLIENT_URL="http://localhost:3000"
   GEMINI_API_KEY="AIzaSy...your-gemini-key"
   GOOGLE_CLIENT_ID="your-google-oauth-client-id"
   ```

2. **Cấu hình Web Frontend (`client/.env.local`):**
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:4000"
   NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-oauth-client-id"
   ```

3. **Cấu hình Mobile POS App (`pos-app/src/lib/api.ts`):**
   Mặc định ứng dụng sẽ trỏ tới API online. Nếu test dưới local, bạn có thể cấu hình URL của API local của bạn ngay trên màn hình cài đặt trong app, hoặc sửa dòng:
   ```typescript
   export const DEFAULT_API_URL = 'http://<IP_MAY_TINH_CUA_BAN>:4000';
   ```
   *(Lưu ý: Không dùng `localhost` khi chạy trên điện thoại thật qua Expo Go, hãy điền IP nội mạng của máy tính chạy server).*

---

### Bước 3: Thiết lập Cơ sở dữ liệu (Database Setup)

Nếu bạn không sử dụng cơ sở dữ liệu cloud (Neon, Supabase...), bạn có thể khởi tạo nhanh PostgreSQL bằng Docker:

1. Khởi chạy container PostgreSQL:
   ```bash
   npm run db:up
   ```

2. Chạy Migration để tạo cấu trúc bảng trong cơ sở dữ liệu:
   ```bash
   npm run prisma:migrate
   ```

3. Tạo các hàm client Prisma để sẵn sàng truy xuất:
   ```bash
   npm run prisma:generate
   ```

---

### Bước 4: Khởi chạy các ứng dụng

#### 1. Khởi chạy đồng thời Web Client & API Server (Từ thư mục gốc):
```bash
npm run dev
```
* **Hasaki E-commerce Client:** chạy tại [http://localhost:3000](http://localhost:3000)
* **Hasaki Web POS Interface:** truy cập tại [http://localhost:3000/pos](http://localhost:3000/pos)
* **Express.js API Server:** chạy tại [http://localhost:4000](http://localhost:4000)

#### 2. Khởi chạy ứng dụng di động POS (Trong thư mục `pos-app`):
Mở một cửa sổ terminal mới:
```bash
cd pos-app
npm run start
```
* **Expo Developer Tools** sẽ mở ra. Bạn có thể quét mã QR bằng ứng dụng **Expo Go** trên điện thoại (Android/iOS) hoặc nhấn `w` để mở giao diện Web trên trình duyệt.

---

## 📊 Mô hình Logic nghiệp vụ & BI

### 1. Phân khúc Khách hàng CRM (RFM Analysis)
Hệ thống chấm điểm dựa trên 3 tiêu chí cốt lõi của khách hàng:
$$\text{Recency (R)} = \text{Số ngày kể từ lần mua cuối cùng}$$
$$\text{Frequency (F)} = \text{Tổng số đơn hàng thành công}$$
$$\text{Monetary (M)} = \text{Tổng số tiền tích lũy chi tiêu}$$

* Thuật toán phân chia đều khách hàng thành 5 phân nhóm (Quintiles) tương ứng điểm từ 1 đến 5.
* **Quy tắc phân khúc:**
  * **Champions (Tinh hoa):** Khách hàng mua gần đây nhất, mua nhiều nhất và chi tiêu đậm nhất ($R \ge 4$, $F \ge 4$, $M \ge 4$).
  * **Loyal Customers (Trung thành):** Khách hàng tương tác tốt, mua nhiều lần ($R \ge 3$, $F \ge 4$, $M \ge 4$).
  * **At Risk (Nguy cơ rời bỏ):** Đã lâu không mua hàng, tần suất và chi tiêu trung bình ($R \le 2$, $F \le 3$, $M \le 3$).
  * **Lost (Khách hàng đã mất):** Điểm tối thiểu cho cả 3 tiêu chí ($R = 1$, $F = 1$, $M = 1$).

### 2. Công thức Dự báo tồn kho
* **Sales Velocity (Tốc độ bán hàng trung bình ngày):**
  $$\text{Sales Velocity} = \frac{\text{Tổng số lượng sản phẩm bán ra trong 30 ngày}}{30}$$
* **Gợi ý số lượng nhập hàng (Restock Suggestion):**
  $$\text{Restock Qty} = (\text{Sales Velocity} \times 1.5) - \text{Tồn kho hiện tại}$$
  *(Hệ số 1.5 đảm bảo lượng hàng an toàn dự trữ trong thời gian chờ đợi nhà cung cấp giao lô hàng mới).*

---

## 🛡️ Bảo mật & Tối ưu hiệu năng
- **Bảo mật API:** Sử dụng `helmet` để bảo vệ các header HTTP, mã hóa mật khẩu người dùng bằng `bcrypt` trước khi lưu vào DB, cấu hình `CORS` chặn các truy cập không mong muốn.
- **Xác thực phiên:** Cơ chế JWT (JSON Web Token) kết hợp lưu trữ an toàn trong LocalStorage (Web) và AsyncStorage (Mobile).
- **Tối ưu hóa BI:** Sử dụng các Snapshot dữ liệu và tổng hợp gián tiếp giúp giảm tải các câu lệnh SQL phức tạp lên database PostgreSQL trong giờ cao điểm.

---

## 📄 Giấy phép
Dự án được phân phối dưới giấy phép MIT. Xem tệp `LICENSE` để biết thêm thông tin chi tiết.

---
**Hasaki MIS & Hậu Lê Coffee POS** - *Đồng hành cùng sự phát triển dựa trên dữ liệu.*
