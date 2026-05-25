import { API_BASE_URL, ApiError, formatPrice } from "./api";

// --- POS TYPES ---

export type CafeRole = "ADMIN" | "STAFF";

export interface PosUser {
  id: string;
  username: string;
  fullName: string;
  role: CafeRole;
  branchId?: string | null;
}

export interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CafeCategory {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CafeProduct {
  id: string;
  name: string;
  price: string | number;
  isActive: boolean;
  isAvailable: boolean;
  categoryId: string;
  imageUrl?: string | null;
  category?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type CafeTableStatus = "EMPTY" | "SERVING" | "WAITING_PAYMENT";

export interface CafeTable {
  id: string;
  name: string;
  status: CafeTableStatus;
  isActive: boolean;
  branchId?: string;
  createdAt: string;
  updatedAt: string;
}

export type CafeOrderStatus = "PENDING" | "PAID" | "CANCELLED" | "REFUNDED";

export interface CafeOrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  productName: string;
  unitPrice: string | number;
  quantity: number;
  notes: string | null;
  createdAt: string;
  product?: CafeProduct | null;
}

export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "E_WALLET" | "CARD";

export interface Payment {
  id: string;
  orderId: string;
  amount: string | number;
  paymentMethod: PaymentMethod;
  createdAt: string;
}

export interface CafeOrder {
  id: string;
  tableId: string;
  status: CafeOrderStatus;
  totalAmount: string | number;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  table?: CafeTable;
  items?: CafeOrderItem[];
  payments?: Payment[];
}

export interface PosDashboardData {
  todayRevenue: number;
  todayOrdersCount: number;
  todayAOV: number;
  revenueByMethod: {
    CASH: number;
    BANK_TRANSFER: number;
    E_WALLET: number;
    CARD: number;
  };
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    id: string;
    tableName: string;
    totalAmount: string | number;
    paymentMethod: PaymentMethod;
    payTime: string;
  }>;
}

// --- POS TOKEN STORE ---

export const posTokenStore = {
  get() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("pos_token");
  },
  set(token: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("pos_token", token);
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem("pos_token");
    window.localStorage.removeItem("pos_user");
    window.localStorage.removeItem("auth_token");
    window.localStorage.removeItem("token");
  }
};

// --- POS API REQ HELPER ---

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

async function posApiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = posTokenStore.get();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Tự động đính kèm chi nhánh đang chọn từ localStorage
  if (typeof window !== "undefined") {
    const branchId = window.localStorage.getItem("pos_branch_id");
    if (branchId) {
      headers.set("x-branch-id", branchId);
    }
  }

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      body
    });
  } catch (err) {
    throw new ApiError(`Không thể kết nối đến máy chủ POS tại ${API_BASE_URL}.`, 0);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const data = await response.json().catch(async () => {
    const text = await response.text().catch(() => null);
    return text ? { message: text } : null;
  });

  if (!response.ok) {
    if (response.status === 401) {
      posTokenStore.clear();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("pos-unauthorized"));
      }
    }
    throw new ApiError(data?.message || `Lỗi yêu cầu: ${response.status}`, response.status);
  }

  return data as T;
}

// --- POS API OBJECT ---

export const posApi = {
  // Setup & Auth
  setup(body: { username: string; passwordHash?: string; password?: string; fullName: string }) {
    // Để tương thích với backend controller
    return posApiRequest<{ message: string; user: PosUser }>("/api/pos/auth/setup", {
      method: "POST",
      body
    });
  },

  login(body: { username: string; password?: string }) {
    return posApiRequest<{ message: string; token: string; user: PosUser }>("/api/pos/auth/login", {
      method: "POST",
      body
    });
  },

  getMe() {
    return posApiRequest<{ user: PosUser }>("/api/pos/auth/me");
  },

  // Staff management (Admin only)
  createStaff(body: { username: string; password?: string; fullName: string; role: CafeRole; branchId?: string | null }) {
    return posApiRequest<{ message: string; user: PosUser }>("/api/pos/auth/staffs", {
      method: "POST",
      body
    });
  },

  listStaffs() {
    return posApiRequest<Array<PosUser & { createdAt: string; branchName?: string | null }>>("/api/pos/auth/staffs");
  },

  updateStaff(id: string, body: { fullName?: string; role?: CafeRole; branchId?: string | null; password?: string }) {
    return posApiRequest<{ message: string; user: PosUser }>(`/api/pos/auth/staffs/${id}`, {
      method: "PUT",
      body
    });
  },

  deleteStaff(id: string) {
    return posApiRequest<{ message: string }>(`/api/pos/auth/staffs/${id}`, {
      method: "DELETE"
    });
  },

  // Categories CRUD
  getCategories() {
    return posApiRequest<CafeCategory[]>("/api/pos/categories");
  },

  createCategory(body: Partial<CafeCategory>) {
    return posApiRequest<CafeCategory>("/api/pos/categories", {
      method: "POST",
      body
    });
  },

  updateCategory(id: string, body: Partial<CafeCategory>) {
    return posApiRequest<CafeCategory>(`/api/pos/categories/${id}`, {
      method: "PUT",
      body
    });
  },

  deleteCategory(id: string) {
    return posApiRequest<{ message: string }>(`/api/pos/categories/${id}`, {
      method: "DELETE"
    });
  },

  // Products CRUD
  getProducts(params: { categoryId?: string; search?: string; showInactive?: boolean } = {}) {
    const query = new URLSearchParams();
    if (params.categoryId) query.set("categoryId", params.categoryId);
    if (params.search) query.set("search", params.search);
    if (params.showInactive) query.set("showInactive", "true");
    
    const queryString = query.toString();
    return posApiRequest<CafeProduct[]>(`/api/pos/products${queryString ? "?" + queryString : ""}`);
  },

  getProduct(id: string) {
    return posApiRequest<CafeProduct>(`/api/pos/products/${id}`);
  },

  createProduct(body: Partial<CafeProduct>) {
    return posApiRequest<CafeProduct>("/api/pos/products", {
      method: "POST",
      body
    });
  },

  updateProduct(id: string, body: Partial<CafeProduct>) {
    return posApiRequest<CafeProduct>(`/api/pos/products/${id}`, {
      method: "PUT",
      body
    });
  },

  deleteProduct(id: string) {
    return posApiRequest<{ message: string }>(`/api/pos/products/${id}`, {
      method: "DELETE"
    });
  },

  // Tables CRUD
  getTables(params: { showInactive?: boolean } = {}) {
    const query = new URLSearchParams();
    if (params.showInactive) query.set("showInactive", "true");
    
    const queryString = query.toString();
    return posApiRequest<CafeTable[]>(`/api/pos/tables${queryString ? "?" + queryString : ""}`);
  },

  createTable(body: Partial<CafeTable>) {
    return posApiRequest<CafeTable>("/api/pos/tables", {
      method: "POST",
      body
    });
  },

  updateTable(id: string, body: Partial<CafeTable>) {
    return posApiRequest<CafeTable>(`/api/pos/tables/${id}`, {
      method: "PUT",
      body
    });
  },

  deleteTable(id: string) {
    return posApiRequest<{ message: string }>(`/api/pos/tables/${id}`, {
      method: "DELETE"
    });
  },

  // Orders
  getActiveOrders() {
    return posApiRequest<CafeOrder[]>("/api/pos/orders/active");
  },

  getOrderByTable(tableId: string) {
    return posApiRequest<CafeOrder>(`/api/pos/orders/table/${tableId}`);
  },

  createOrder(body: { tableId: string; items: Array<{ productId: string; quantity: number; notes?: string }> }) {
    return posApiRequest<CafeOrder>("/api/pos/orders", {
      method: "POST",
      body
    });
  },

  updateOrderItems(orderId: string, body: { items: Array<{ productId: string; quantity: number; notes?: string }> }) {
    return posApiRequest<CafeOrder>(`/api/pos/orders/${orderId}/items`, {
      method: "PUT",
      body
    });
  },

  payOrder(orderId: string, body: { paymentMethod: PaymentMethod }) {
    return posApiRequest<{ message: string; order: CafeOrder; payment: Payment }>(`/api/pos/orders/${orderId}/pay`, {
      method: "POST",
      body
    });
  },

  updateOrderStatus(orderId: string, body: { status: "CANCELLED" | "REFUNDED" }) {
    return posApiRequest<{ message: string; order: CafeOrder }>(`/api/pos/orders/${orderId}/status`, {
      method: "PUT",
      body
    });
  },

  getOrderHistory(params: { startDate?: string; endDate?: string; status?: CafeOrderStatus } = {}) {
    const query = new URLSearchParams();
    if (params.startDate) query.set("startDate", params.startDate);
    if (params.endDate) query.set("endDate", params.endDate);
    if (params.status) query.set("status", params.status);
    
    const queryString = query.toString();
    return posApiRequest<CafeOrder[]>(`/api/pos/orders/history${queryString ? "?" + queryString : ""}`);
  },

  // Analytics (Admin only)
  getDashboardAnalytics() {
    return posApiRequest<PosDashboardData>("/api/pos/analytics/dashboard");
  },

  // Branches CRUD
  getBranches(params: { showInactive?: boolean } = {}) {
    const query = new URLSearchParams();
    if (params.showInactive) query.set("showInactive", "true");
    const queryString = query.toString();
    return posApiRequest<Branch[]>(`/api/pos/branches${queryString ? "?" + queryString : ""}`);
  },

  createBranch(body: Partial<Branch>) {
    return posApiRequest<Branch>("/api/pos/branches", {
      method: "POST",
      body
    });
  },

  updateBranch(id: string, body: Partial<Branch>) {
    return posApiRequest<Branch>(`/api/pos/branches/${id}`, {
      method: "PUT",
      body
    });
  },

  deleteBranch(id: string) {
    return posApiRequest<{ message: string }>(`/api/pos/branches/${id}`, {
      method: "DELETE"
    });
  }
};

export { formatPrice };

