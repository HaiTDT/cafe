import { posTokenStore, storage } from './storage';

export const DEFAULT_API_URL = 'https://haulecoffee.onrender.com';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export function formatPrice(price: string | number | undefined | null): string {
  if (price === undefined || price === null) return '0đ';
  const val = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(val)) return '0đ';
  return val.toLocaleString('vi-VN') + 'đ';
}

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
  // Period (filtered)
  periodRevenue: number;
  periodOrdersCount: number;
  periodAOV: number;
  // Always current month
  monthRevenue: number;
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
  // backward compat
  todayRevenue: number;
  todayOrdersCount: number;
  todayAOV: number;
}

// --- API Helper ---

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

export async function getApiBaseUrl(): Promise<string> {
  const customUrl = await storage.getItem('custom_api_url');
  return customUrl || DEFAULT_API_URL;
}

export async function setApiBaseUrl(url: string): Promise<void> {
  if (!url || url.trim() === '') {
    await storage.removeItem('custom_api_url');
  } else {
    // Chuẩn hóa URL, xóa dấu / ở cuối nếu có
    let normalized = url.trim();
    if (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    await storage.setItem('custom_api_url', normalized);
  }
}

async function posApiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  const token = await posTokenStore.get();
  const baseUrl = await getApiBaseUrl();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const branchId = await storage.getItem('pos_branch_id');
  if (branchId) {
    headers.set('x-branch-id', branchId);
  }

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
      body,
    });
  } catch (err: any) {
    throw new ApiError(`Không thể kết nối đến máy chủ POS tại ${baseUrl}.`, 0);
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
      await posTokenStore.clear();
      // Ta có thể broadcast sự kiện bằng cách giải quyết sau trong UI
    }
    throw new ApiError(data?.message || `Lỗi yêu cầu: ${response.status}`, response.status);
  }

  return data as T;
}

// --- POS API OBJECT ---

export const posApi = {
  // Setup & Auth
  setup(body: { username: string; passwordHash?: string; password?: string; fullName: string }) {
    return posApiRequest<{ message: string; user: PosUser }>('/api/pos/auth/setup', {
      method: 'POST',
      body,
    });
  },

  login(body: { username: string; password?: string }) {
    return posApiRequest<{ message: string; token: string; user: PosUser }>('/api/pos/auth/login', {
      method: 'POST',
      body,
    });
  },

  loginWithGoogle(googleToken: string) {
    return posApiRequest<{ token: string; user: any }>('/auth/register/google', {
      method: 'POST',
      body: { googleToken },
    }).then((res) => {
      if (res && res.user && !res.user.username) {
        res.user.username = res.user.email;
      }
      return res as { token: string; user: PosUser };
    });
  },

  getMe() {
    return posApiRequest<{ user: PosUser }>('/api/pos/auth/me');
  },

  // Categories CRUD
  getCategories() {
    return posApiRequest<CafeCategory[]>('/api/pos/categories');
  },

  // Products CRUD
  getProducts(params: { categoryId?: string; search?: string; showInactive?: boolean } = {}) {
    const query = new URLSearchParams();
    if (params.categoryId) query.set('categoryId', params.categoryId);
    if (params.search) query.set('search', params.search);
    if (params.showInactive) query.set('showInactive', 'true');
    
    const queryString = query.toString();
    return posApiRequest<CafeProduct[]>(`/api/pos/products${queryString ? '?' + queryString : ''}`);
  },

  updateProduct(id: string, body: Partial<CafeProduct>) {
    return posApiRequest<CafeProduct>(`/api/pos/products/${id}`, {
      method: 'PUT',
      body,
    });
  },

  // Tables CRUD
  getTables(params: { showInactive?: boolean } = {}) {
    const query = new URLSearchParams();
    if (params.showInactive) query.set('showInactive', 'true');
    
    const queryString = query.toString();
    return posApiRequest<CafeTable[]>(`/api/pos/tables${queryString ? '?' + queryString : ''}`);
  },

  // Orders
  getActiveOrders() {
    return posApiRequest<CafeOrder[]>('/api/pos/orders/active');
  },

  getOrderByTable(tableId: string) {
    return posApiRequest<CafeOrder>(`/api/pos/orders/table/${tableId}`);
  },

  createOrder(body: { tableId: string; items: Array<{ productId: string; quantity: number; notes?: string }> }) {
    return posApiRequest<CafeOrder>('/api/pos/orders', {
      method: 'POST',
      body,
    });
  },

  updateOrderItems(orderId: string, body: { items: Array<{ productId: string; quantity: number; notes?: string }> }) {
    return posApiRequest<CafeOrder>(`/api/pos/orders/${orderId}/items`, {
      method: 'PUT',
      body,
    });
  },

  payOrder(orderId: string, body: { paymentMethod: PaymentMethod }) {
    return posApiRequest<{ message: string; order: CafeOrder; payment: Payment }>(`/api/pos/orders/${orderId}/pay`, {
      method: 'POST',
      body,
    });
  },

  updateOrderStatus(orderId: string, body: { status: "CANCELLED" | "REFUNDED" }) {
    return posApiRequest<{ message: string; order: CafeOrder }>(`/api/pos/orders/${orderId}/status`, {
      method: 'PUT',
      body,
    });
  },

  getOrderHistory(params: { startDate?: string; endDate?: string; status?: CafeOrderStatus } = {}) {
    const query = new URLSearchParams();
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.status) query.set('status', params.status);
    
    const queryString = query.toString();
    return posApiRequest<CafeOrder[]>(`/api/pos/orders/history${queryString ? '?' + queryString : ''}`);
  },

  // Analytics (Admin only)
  getDashboardAnalytics(params: { startDate?: string; endDate?: string } = {}) {
    const query = new URLSearchParams();
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    const queryString = query.toString();
    return posApiRequest<PosDashboardData>(`/api/pos/analytics/dashboard${queryString ? '?' + queryString : ''}`);
  },

  // Branches CRUD
  getBranches(params: { showInactive?: boolean } = {}) {
    const query = new URLSearchParams();
    if (params.showInactive) query.set('showInactive', 'true');
    const queryString = query.toString();
    return posApiRequest<Branch[]>(`/api/pos/branches${queryString ? '?' + queryString : ''}`);
  }
};
