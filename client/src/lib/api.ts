export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type Role = "CUSTOMER" | "ADMIN" | "STAFF";

export interface Banner {
  id: string;
  title: string | null;
  imageUrl: string;
  link: string | null;
  isActive: boolean;
  order: number;
}

export type User = {
  id: string;
  email: string;
  fullName?: string | null;
  phone?: string | null;
  birthday?: string | null;
  gender?: string | null;
  avatar?: string | null;
  role: Role;
};

export type FavoriteProduct = {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  createdAt: string;
};

export type Address = {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  detail: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  brand?: string | null;
  price: string | number;
  imageUrl?: string | null;
  stock: number;
  isActive: boolean;
  isFlashSale: boolean;
  categoryId: string;
  category?: Category;
  flashSaleItems?: Array<{
    id: string;
    discountPercentage: number;
    campaign: FlashSaleCampaign;
  }>;
};

export type Blog = {
  id: string;
  title: string;
  excerpt?: string | null;
  content: string;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FlashSaleItem = {
  id: string;
  campaignId: string;
  productId: string;
  product: Product;
  discountPercentage: number;
  stockLimit: number;
  soldCount: number;
};

export type FlashSaleCampaign = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  isFeatured: boolean;
  items?: FlashSaleItem[];
  _count?: {
    items: number;
  };
  createdAt: string;
  updatedAt: string;
};

export type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  unitPrice?: string | number;
  lineTotal?: string | number;
  product: Product;
};

export type Cart = {
  id: string;
  userId: string;
  items: CartItem[];
  totalQuantity: number;
  totalAmount: string;
};

export type OrderItem = {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: string | number;
  product: Product;
};

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "COMPLETED"
  | "REFUNDED";

export type Order = {
  id: string;
  userId: string;
  user?: User;
  status: OrderStatus;
  totalAmount: string | number;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
};

export type Paginated<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type Review = {
  id: string;
  rating: number;
  comment?: string | null;
  userName: string;
  user: Pick<User, "id" | "email" | "fullName">;
  createdAt: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

export const tokenStore = {
  get() {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage.getItem("auth_token");
  },

  set(token: string) {
    window.localStorage.setItem("auth_token", token);
  },

  clear() {
    window.localStorage.removeItem("auth_token");
  }
};

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers);
  const token = tokenStore.get();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
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
  } catch {
    throw new ApiError(
      `Cannot connect to API server at ${API_BASE_URL}. Please start the backend.`,
      0
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(async () => {
    const text = await response.text().catch(() => null);
    return text ? { message: text } : null;
  });

  if (!response.ok) {
    if (response.status === 401) {
      tokenStore.clear();
      // If we are in a browser, we can trigger a reload or event to update UI
      if (typeof window !== 'undefined') {
         // Dispatch an event so other components know they should re-check auth
         window.dispatchEvent(new Event('auth-unauthorized'));
      }
    }
    throw new ApiError(data?.message || `Request failed with status ${response.status}`, response.status);
  }

  return data as T;
}

const toQueryString = (params: Record<string, string | number | boolean | undefined>) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

export const api = {
  login(body: { email: string; password: string }) {
    return apiRequest<{ user: User; token: string }>("/auth/login", {
      method: "POST",
      body
    });
  },

  register(body: {
    email: string;
    password: string;
    fullName?: string;
    phone?: string;
  }) {
    return apiRequest<{ user: User; token: string }>("/auth/register", {
      method: "POST",
      body
    });
  },

  registerWithGoogle(body: { googleToken: string }) {
    return apiRequest<{ user: User; token: string }>("/auth/register/google", {
      method: "POST",
      body
    });
  },

  getCategories() {
    return apiRequest<Category[]>("/api/categories");
  },

  createCategory(body: Partial<Category>) {
    return apiRequest<Category>("/api/categories", { method: "POST", body });
  },

  updateCategory(id: string, body: Partial<Category>) {
    return apiRequest<Category>(`/api/categories/${id}`, {
      method: "PUT",
      body
    });
  },

  deleteCategory(id: string) {
    return apiRequest<void>(`/api/categories/${id}`, { method: "DELETE" });
  },

  getProducts(params: Record<string, string | number | boolean | undefined> = {}) {
    return apiRequest<Paginated<Product>>(`/api/products${toQueryString(params)}`);
  },

  getProduct(id: string) {
    return apiRequest<Product>(`/api/products/${id}`);
  },

  createProduct(body: Partial<Product>) {
    return apiRequest<Product>("/api/products", { method: "POST", body });
  },

  updateProduct(id: string, body: Partial<Product>) {
    return apiRequest<Product>(`/api/products/${id}`, { method: "PUT", body });
  },

  deleteProduct(id: string) {
    return apiRequest<void>(`/api/products/${id}`, { method: "DELETE" });
  },

  getProductReviews(productId: string) {
    return apiRequest<{
      data: Review[];
      meta: { averageRating: number; totalReviews: number };
    }>(`/api/products/${productId}/reviews`);
  },

  createProductReview(productId: string, body: { rating: number; comment?: string }) {
    return apiRequest(`/api/products/${productId}/reviews`, {
      method: "POST",
      body
    });
  },

  checkReviewEligibility(productId: string) {
    return apiRequest<{ canReview: boolean; reason?: string }>(`/api/products/${productId}/reviews/eligibility`);
  },

  getCart() {
    return apiRequest<Cart>("/api/cart");
  },

  addCartItem(body: { productId: string; quantity: number }) {
    return apiRequest<Cart>("/api/cart/items", { method: "POST", body });
  },

  updateCartItem(itemId: string, body: { quantity: number }) {
    return apiRequest<Cart>(`/api/cart/items/${itemId}`, {
      method: "PUT",
      body
    });
  },

  deleteCartItem(itemId: string) {
    return apiRequest<Cart>(`/api/cart/items/${itemId}`, { method: "DELETE" });
  },

  checkout(body: {
    shippingName: string;
    shippingPhone: string;
    shippingAddress: string;
  }) {
    return apiRequest("/api/checkout", { method: "POST", body });
  },

  getOrders() {
    return apiRequest<Order[]>("/api/orders");
  },

  getAdminDashboard() {
    return apiRequest<{
      totalRevenue: string;
      totalOrders: number;
      totalProducts: number;
      totalCustomers: number;
      topProducts: Array<{
        product: Product | null;
        totalSold: number;
        orderItemCount: number;
      }>;
      recentOrders: Order[];
      revenueTrend: Array<{ date: string; revenue: number }>;
    }>("/api/admin/dashboard");
  },

  getAdminOrders(params: Record<string, string | number | undefined> = {}) {
    return apiRequest<Paginated<Order>>(
      `/api/admin/orders${toQueryString(params)}`
    );
  },

  updateAdminOrderStatus(id: string, status: OrderStatus) {
    return apiRequest<Order>(`/api/admin/orders/${id}/status`, {
      method: "PUT",
      body: { status }
    });
  },

  getBlogs(params: Record<string, string | number | boolean | undefined> = {}) {
    return apiRequest<Paginated<Blog>>(`/api/blogs${toQueryString(params)}`);
  },

  getBlog(id: string) {
    return apiRequest<Blog>(`/api/blogs/${id}`);
  },

  createBlog(body: Partial<Blog>) {
    return apiRequest<Blog>("/api/blogs", { method: "POST", body });
  },

  updateBlog(id: string, body: Partial<Blog>) {
    return apiRequest<Blog>(`/api/blogs/${id}`, { method: "PUT", body });
  },

  deleteBlog(id: string) {
    return apiRequest<void>(`/api/blogs/${id}`, { method: "DELETE" });
  },

  getFeaturedFlashSale() {
    return apiRequest<FlashSaleCampaign | null>("/api/flash-sales/featured");
  },

  getAdminFlashSales() {
    return apiRequest<FlashSaleCampaign[]>("/api/flash-sales");
  },

  getAdminFlashSale(id: string) {
    return apiRequest<FlashSaleCampaign>(`/api/flash-sales/${id}`);
  },

  createFlashSale(body: Partial<FlashSaleCampaign>) {
    return apiRequest<FlashSaleCampaign>("/api/flash-sales", {
      method: "POST",
      body
    });
  },

  updateFlashSale(id: string, body: Partial<FlashSaleCampaign>) {
    return apiRequest<FlashSaleCampaign>(`/api/flash-sales/${id}`, {
      method: "PUT",
      body
    });
  },

  deleteFlashSale(id: string) {
    return apiRequest<void>(`/api/flash-sales/${id}`, { method: "DELETE" });
  },

  addFlashSaleItem(campaignId: string, body: { productId: string; discountPercentage: number; stockLimit?: number }) {
    return apiRequest<FlashSaleItem>(`/api/flash-sales/${campaignId}/items`, {
      method: "POST",
      body
    });
  },

  removeFlashSaleItem(campaignId: string, productId: string) {
    return apiRequest<void>(`/api/flash-sales/${campaignId}/items/${productId}`, {
      method: "DELETE"
    });
  },

  getRevenueAnalytics(params: Record<string, string | number | undefined> = {}) {
    return apiRequest<RevenueAnalytics>(
      `/api/admin/analytics/revenue${toQueryString(params)}`
    );
  },

  getCustomerSegmentation(params: Record<string, string | number | undefined> = {}) {
    return apiRequest<CustomerSegmentationResponse>(
      `/api/admin/analytics/customers${toQueryString(params)}`
    );
  },

  getMarketingAnalytics() {
    return apiRequest<any>("/api/admin/analytics/marketing");
  },

  getInventoryAnalytics() {
    return apiRequest<any>("/api/admin/analytics/inventory");
  },

  // User Profile & Account
  getProfile() {
    return apiRequest<User>("/api/user/profile");
  },

  updateProfile(body: Partial<User>) {
    return apiRequest<User>("/api/user/profile", { method: "PUT", body });
  },

  changePassword(body: { currentPassword: string; newPassword: string }) {
    return apiRequest<{ message: string }>("/api/user/change-password", {
      method: "PUT",
      body
    });
  },

  // Favorites
  getFavorites() {
    return apiRequest<FavoriteProduct[]>("/api/user/favorites");
  },

  addToFavorites(productId: string) {
    return apiRequest<{ message: string }>(`/api/user/favorites/${productId}`, {
      method: "POST"
    });
  },

  removeFromFavorites(productId: string) {
    return apiRequest<{ message: string }>(`/api/user/favorites/${productId}`, {
      method: "DELETE"
    });
  },

  // Addresses
  getAddresses() {
    return apiRequest<Address[]>("/api/user/addresses");
  },

  addAddress(body: Omit<Address, "id" | "userId" | "createdAt" | "updatedAt">) {
    return apiRequest<Address>("/api/user/addresses", { method: "POST", body });
  },

  updateAddress(id: string, body: Partial<Address>) {
    return apiRequest<Address>(`/api/user/addresses/${id}`, {
      method: "PUT",
      body
    });
  },

  deleteAddress(id: string) {
    return apiRequest<{ message: string }>(`/api/user/addresses/${id}`, {
      method: "DELETE"
    });
  },

  setDefaultAddress(id: string) {
    return apiRequest<Address>(`/api/user/addresses/${id}/default`, {
      method: "PUT"
    });
  },

  // Auth
  forgotPassword(email: string) {
    return apiRequest<{ message: string; token?: string }>("/auth/forgot-password", {
      method: "POST",
      body: { email }
    });
  },

  resetPassword(body: { token: string; newPassword: string }) {
    return apiRequest<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body
    });
  },

  // Banners
  getBanners() {
    return apiRequest<Banner[]>("/api/banners");
  },
  getAdminBanners() {
    return apiRequest<Banner[]>("/api/admin/banners");
  },
  createBanner(body: Partial<Banner>) {
    return apiRequest<Banner>("/api/admin/banners", { method: "POST", body });
  },
  updateBanner(id: string, body: Partial<Banner>) {
    return apiRequest<Banner>(`/api/admin/banners/${id}`, { method: "PUT", body });
  },
  deleteBanner(id: string) {
    return apiRequest<void>(`/api/admin/banners/${id}`, { method: "DELETE" });
  }
};

/* ─── Analytics Types ────────────────────────── */

export interface RevenueSummary {
  currentRevenue: string;
  previousRevenue: string;
  growthRate: number;
  totalOrders: number;
  previousOrders: number;
  orderGrowthRate: number;
  averageOrderValue: string;
  totalCustomers: number;
  previousCustomers: number;
  customerGrowthRate: number;
};

export type RevenueTrendPoint = {
  date: string;
  revenue: string;
  orders: number;
};

export type CategoryRevenue = {
  categoryId: string;
  categoryName: string;
  revenue: string;
  percentage: number;
};

export type BrandRevenue = {
  brand: string;
  revenue: string;
  orderCount: number;
};

export type OrderStatusCount = {
  status: string;
  count: number;
};

export type RevenueAnalytics = {
  summary: RevenueSummary;
  revenueTrend: RevenueTrendPoint[];
  revenueByCategory: CategoryRevenue[];
  revenueByBrand: BrandRevenue[];
  orderStatusDistribution: OrderStatusCount[];
};

export type SegmentSummary = {
  segment: string;
  label: string;
  count: number;
  percentage: number;
  totalRevenue: string;
  avgOrderValue: string;
};

export type CustomerRFM = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  recencyDays: number;
  frequency: number;
  monetary: string;
  rScore: number;
  fScore: number;
  mScore: number;
  segment: string;
  lastOrderDate: string | null;
};

export type CustomerSegmentationResponse = {
  segmentSummary: SegmentSummary[];
  customers: Paginated<CustomerRFM>;
};

export const formatPrice = (value: string | number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(Number(value));
