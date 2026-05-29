"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { posApi, posTokenStore, formatPrice } from "../../lib/pos-api";
import type { CafeTable, CafeCategory, CafeProduct, CafeOrder, CafeOrderItem, PaymentMethod, CafeTableStatus, Branch } from "../../lib/pos-api";
import { ApiError } from "../../lib/api";

export default function PosPage() {
  const router = useRouter();

  // State quản lý chi nhánh
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [showBranchModal, setShowBranchModal] = useState(false);

  // State quản lý dữ liệu từ API
  const [tables, setTables] = useState<CafeTable[]>([]);
  const [categories, setCategories] = useState<CafeCategory[]>([]);
  const [products, setProducts] = useState<CafeProduct[]>([]);
  
  // State quản lý thao tác người dùng
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedTable, setSelectedTable] = useState<CafeTable | null>(null);
  const [activeMobileTab, setActiveMobileTab] = useState<"tables" | "menu" | "bill">("tables");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeOrder, setActiveOrder] = useState<CafeOrder | null>(null); // Order đang mở của bàn đang chọn
  const [currentCartItems, setCurrentCartItems] = useState<Array<{
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    notes: string;
    product?: CafeProduct;
  }>>([]); // Giỏ hàng tạm thời đang chỉnh sửa ở Client cho bàn đang chọn
  
  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState({ type: "", message: "" });
  const [lastAddedProductId, setLastAddedProductId] = useState<string | null>(null);
  // Map tableId -> order createdAt (ISO string) để tính đồng hồ phục vụ
  const [tableOrderTimes, setTableOrderTimes] = useState<Record<string, string>>({});

  // Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [customerMoney, setCustomerMoney] = useState("");
  const [changeMoney, setChangeMoney] = useState(0);

  // Xác thực đăng nhập POS
  useEffect(() => {
    let token = posTokenStore.get();
    if (!token) {
      const storefrontToken = window.localStorage.getItem("auth_token") || window.localStorage.getItem("token");
      if (storefrontToken) {
        try {
          const payload = JSON.parse(window.atob(storefrontToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
          const isExpired = payload && payload.exp && payload.exp < Math.floor(Date.now() / 1000);
          if (payload && !isExpired && (payload.role === "ADMIN" || payload.role === "STAFF")) {
            posTokenStore.set(storefrontToken);
            token = storefrontToken;
          }
        } catch (e) {
          console.error("SSO Token Sync Error:", e);
        }
      }
    }

    if (!token) {
      router.push("/pos/login");
      return;
    }

    const savedUser = window.localStorage.getItem("pos_user");
    let loadedUser = null;
    if (savedUser) {
      loadedUser = JSON.parse(savedUser);
      setCurrentUser(loadedUser);
    }

    const initData = async () => {
      let user = loadedUser;
      if (!user) {
        try {
          const res = await posApi.getMe();
          user = res.user;
          setCurrentUser(user);
          window.localStorage.setItem("pos_user", JSON.stringify(user));
        } catch (e) {
          posTokenStore.clear();
          router.push("/pos/login");
          return;
        }
      }
      await loadBranchesAndCheck(user);
    };

    initData();

    // Lắng nghe sự kiện mất auth
    const handleUnauthorized = () => {
      router.push("/pos/login");
    };
    window.addEventListener("pos-unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("pos-unauthorized", handleUnauthorized);
    };
  }, [router]);

  // Load chi nhánh từ API và kiểm tra chi nhánh đã lưu
  const loadBranchesAndCheck = async (userObj?: any) => {
    try {
      const branchesData = await posApi.getBranches();
      const currentUserObj = userObj || currentUser;

      // Nếu là STAFF và được chỉ định chi nhánh, ép chọn chi nhánh đó
      if (currentUserObj && currentUserObj.role === "STAFF" && currentUserObj.branchId) {
        const staffBranch = branchesData.find(b => b.id === currentUserObj.branchId);
        if (staffBranch) {
          setBranches([staffBranch]);
          setSelectedBranch(staffBranch);
          window.localStorage.setItem("pos_branch_id", staffBranch.id);
          setShowBranchModal(false);
          return;
        }
      }

      setBranches(branchesData);
      
      const savedBranchId = window.localStorage.getItem("pos_branch_id");
      if (savedBranchId) {
        const found = branchesData.find(b => b.id === savedBranchId);
        if (found) {
          setSelectedBranch(found);
          return;
        }
      }
      
      // Nếu chưa chọn chi nhánh hoặc chi nhánh không tồn tại, mở modal chọn chi nhánh
      setShowBranchModal(true);
    } catch (err) {
      console.error("Load branches error:", err);
      setError("Không thể tải danh sách chi nhánh từ máy chủ.");
      setLoading(false);
    }
  };

  const handleSelectBranch = (branch: Branch) => {
    window.localStorage.setItem("pos_branch_id", branch.id);
    setSelectedBranch(branch);
    setShowBranchModal(false);
    
    // Reset trạng thái bán hàng khi chuyển đổi chi nhánh
    setSelectedTable(null);
    setActiveOrder(null);
    setCurrentCartItems([]);
  };

  // Tự động load dữ liệu khi chi nhánh được chọn hoặc thay đổi
  useEffect(() => {
    if (selectedBranch) {
      loadAllData();
    }
  }, [selectedBranch]);

  // Load danh sách Bàn, Danh mục, Sản phẩm
  const loadAllData = async () => {
    setLoading(true);
    setError("");
    try {
      const [tablesData, catsData, prodsData, activeOrders] = await Promise.all([
        posApi.getTables(),
        posApi.getCategories(),
        posApi.getProducts(),
        posApi.getActiveOrders().catch(() => [] as CafeOrder[])
      ]);
      setTables(tablesData);
      setCategories(catsData);
      setProducts(prodsData);

      // Xây dựng map tableId -> order createdAt
      const timesMap: Record<string, string> = {};
      activeOrders.forEach(order => {
        if (order.tableId && order.createdAt) {
          timesMap[order.tableId] = order.createdAt;
        }
      });
      setTableOrderTimes(timesMap);
      
      // Chọn bàn đầu tiên nếu có bàn
      if (tablesData.length > 0) {
        handleSelectTable(tablesData[0]);
      }
    } catch (err) {
      console.error("Load pos data error:", err);
      setError("Không thể tải dữ liệu thực đơn/bàn từ máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật lại chỉ riêng danh sách bàn (sau khi lưu bill, thanh toán)
  const refreshTables = async (newSelectedTableId?: string) => {
    try {
      const [tablesData, activeOrders] = await Promise.all([
        posApi.getTables(),
        posApi.getActiveOrders().catch(() => [] as CafeOrder[])
      ]);
      setTables(tablesData);

      // Cập nhật lại map thời gian phục vụ
      const timesMap: Record<string, string> = {};
      activeOrders.forEach(order => {
        if (order.tableId && order.createdAt) {
          timesMap[order.tableId] = order.createdAt;
        }
      });
      setTableOrderTimes(timesMap);
      
      if (newSelectedTableId) {
        const found = tablesData.find(t => t.id === newSelectedTableId);
        if (found) {
          setSelectedTable(found);
        }
      }
    } catch (err) {
      console.error("Refresh tables error:", err);
    }
  };

  // Xử lý chọn bàn
  const handleSelectTable = async (table: CafeTable) => {
    setSelectedTable(table);
    setCurrentCartItems([]);
    setActiveOrder(null);
    setError("");
    setActiveMobileTab("menu");

    if (table.status !== "EMPTY") {
      setActionLoading(true);
      try {
        // Gọi API lấy order đang PENDING của bàn này
        const order = await posApi.getOrderByTable(table.id);
        setActiveOrder(order);
        
        // Chuyển đổi orderItems từ server sang định dạng cart của client
        if (order && order.items) {
          const cartItems = order.items.map(item => {
            const prod = products.find(p => p.id === item.productId);
            return {
              productId: item.productId || "",
              productName: item.productName,
              unitPrice: Number(item.unitPrice),
              quantity: item.quantity,
              notes: item.notes || "",
              product: prod
            };
          });
          setCurrentCartItems(cartItems);
        }
      } catch (err) {
        console.error("Get table order error:", err);
        // Nếu không tìm thấy order dù bàn báo đang bận (có thể do sai lệch DB)
        setActiveOrder(null);
        setCurrentCartItems([]);
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Hiển thị thông báo toast tạm thời
  const showToast = (type: string, message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification({ type: "", message: "" });
    }, 3000);
  };

  // Đăng xuất POS
  const handleLogout = () => {
    posTokenStore.clear();
    window.localStorage.removeItem("pos_user");
    router.push("/login");
  };

  // Thêm món vào bill của bàn đang chọn
  const handleAddProductToCart = (product: CafeProduct) => {
    if (!selectedTable) {
      showToast("warning", "Vui lòng chọn bàn trước khi order");
      return;
    }
    if (!product.isAvailable) {
      showToast("error", "Món này hiện đang hết hàng!");
      return;
    }

    setCurrentCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.productId === product.id);
      
      if (existingIndex > -1) {
        // Đã có trong bill, tăng số lượng — dùng spread để tránh mutate object gốc
        return prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Chưa có, thêm mới
        return [
          ...prev,
          {
            productId: product.id,
            productName: product.name,
            unitPrice: Number(product.price),
            quantity: 1,
            notes: "",
            product
          }
        ];
      }
    });

    // Trigger bounce animation
    setLastAddedProductId(product.id);
    setTimeout(() => setLastAddedProductId(null), 400);
  };

  // Tăng/giảm số lượng món
  const handleUpdateItemQuantity = (productId: string, amount: number) => {
    setCurrentCartItems(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          const newQty = item.quantity + amount;
          return { ...item, quantity: newQty > 0 ? newQty : 1 };
        }
        return item;
      });
    });
  };

  // Xóa món khỏi bill tạm
  const handleRemoveItemFromCart = (productId: string) => {
    setCurrentCartItems(prev => prev.filter(item => item.productId !== productId));
  };

  // Cập nhật ghi chú của món ăn
  const handleUpdateItemNotes = (productId: string, notes: string) => {
    setCurrentCartItems(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          return { ...item, notes };
        }
        return item;
      });
    });
  };

  // Tính tổng số tiền tạm tính của giỏ hàng hiện tại
  const cartTotal = useMemo(() => {
    return currentCartItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  }, [currentCartItems]);

  // Lọc sản phẩm theo danh mục và tìm kiếm
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategoryId === "all" || p.categoryId === selectedCategoryId;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategoryId, searchQuery]);

  // Lưu hóa đơn: Tạo mới hoặc cập nhật bill hiện có
  const handleSaveOrder = async () => {
    if (!selectedTable) return;
    if (currentCartItems.length === 0) {
      showToast("warning", "Hóa đơn rỗng. Vui lòng chọn ít nhất 1 món.");
      return;
    }

    setActionLoading(true);
    try {
      const itemsPayload = currentCartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        notes: item.notes || undefined
      }));

      if (activeOrder) {
        // Cập nhật hóa đơn cũ
        const updated = await posApi.updateOrderItems(activeOrder.id, { items: itemsPayload });
        setActiveOrder(updated);
        showToast("success", `Cập nhật bill thành công cho ${selectedTable.name}`);
      } else {
        // Tạo hóa đơn mới
        const created = await posApi.createOrder({
          tableId: selectedTable.id,
          items: itemsPayload
        });
        setActiveOrder(created);
        // Lưu thời điểm bắt đầu phục vụ
        setTableOrderTimes(prev => ({ ...prev, [selectedTable.id]: created.createdAt }));
        showToast("success", `Đã mở bill mới cho ${selectedTable.name}`);
      }
      
      // Refresh dữ liệu bàn để cập nhật màu sắc trạng thái
      await refreshTables(selectedTable.id);
    } catch (err) {
      if (err instanceof ApiError) {
        showToast("error", err.message);
      } else {
        showToast("error", "Lỗi hệ thống khi lưu hóa đơn.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Mở Modal Thanh Toán
  const handleOpenPayModal = () => {
    if (currentCartItems.length === 0) {
      showToast("warning", "Không có món nào để thanh toán");
      return;
    }
    setCustomerMoney("");
    setChangeMoney(0);
    setPaymentMethod("CASH");
    setShowPayModal(true);
  };

  // Tính tiền thừa khi khách trả tiền mặt
  useEffect(() => {
    const money = Number(customerMoney);
    if (!isNaN(money) && money >= cartTotal) {
      setChangeMoney(money - cartTotal);
    } else {
      setChangeMoney(0);
    }
  }, [customerMoney, cartTotal]);

  // Xác nhận Thanh toán và đóng bill
  const handleConfirmPayment = async () => {
    if (!selectedTable) return;
    
    // Nếu chưa lưu hóa đơn lên server (tức là activeOrder = null),
    // ta cần tự động lưu hóa đơn đó lên server trước khi chốt thanh toán.
    setActionLoading(true);
    try {
      let orderId = activeOrder?.id;

      // 1. Tự động lưu bill nếu là order mới hoàn toàn
      if (!orderId) {
        const itemsPayload = currentCartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          notes: item.notes || undefined
        }));
        const created = await posApi.createOrder({
          tableId: selectedTable.id,
          items: itemsPayload
        });
        orderId = created.id;
      } else {
        // Cập nhật lại các món trong bill lên server trước khi trả tiền
        const itemsPayload = currentCartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          notes: item.notes || undefined
        }));
        await posApi.updateOrderItems(orderId, { items: itemsPayload });
      }

      // 2. Gọi API thanh toán chốt bill
      await posApi.payOrder(orderId, { paymentMethod });
      
      showToast("success", `Thanh toán thành công ${selectedTable.name}!`);
      setShowPayModal(false);
    } catch (err) {
      if (err instanceof ApiError) {
        showToast("error", err.message);
      } else {
        showToast("error", "Lỗi khi thực hiện thanh toán hóa đơn.");
      }
    } finally {
      setActionLoading(false);
      // Xóa giỏ hàng và reset trạng thái bàn
      const paidTableId = selectedTable?.id;
      setSelectedTable(null);
      setCurrentCartItems([]);
      setActiveOrder(null);
      // Xóa đồng hồ của bàn đã thanh toán xong
      if (paidTableId) {
        setTableOrderTimes(prev => {
          const next = { ...prev };
          delete next[paidTableId];
          return next;
        });
      }
      refreshTables();
      setActiveMobileTab("tables");
    }
  };

  // Trả về class màu sắc cho trạng thái bàn
  const getTableStatusClass = (status: CafeTableStatus) => {
    switch (status) {
      case "EMPTY":
        return "bg-white text-stone-750 border-stone-200 hover:border-[#3e2723] hover:bg-stone-50/50";
      case "SERVING":
        return "bg-[#5d4037] text-white border-[#5d4037] shadow-sm hover:opacity-95";
      case "WAITING_PAYMENT":
        return "bg-amber-600 text-white border-amber-600 shadow-sm hover:opacity-95 animate-pulse";
      default:
        return "";
    }
  };

  return (
    <div className="flex h-screen flex-col bg-[#fdfbf7] text-stone-800 font-body select-none">
      {/* Toast Notification */}
      {notification.message && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 rounded-lg border px-4 py-3 shadow-2xl transition-all duration-300 ${
          notification.type === "success" ? "border-emerald-250 bg-emerald-50 text-emerald-800" :
          notification.type === "error" ? "border-red-250 bg-red-50 text-red-800" :
          "border-amber-250 bg-amber-50 text-amber-800"
        }`}>
          <span className="material-symbols-outlined">
            {notification.type === "success" ? "check_circle" : notification.type === "error" ? "error" : "warning"}
          </span>
          <span className="text-sm font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <header className="flex h-14 items-center justify-between bg-[#3e2723] text-white px-4 md:px-6 shadow-md z-10">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-[#fdfbf7] to-[#efebe9] shadow-sm shrink-0">
              <span className="material-symbols-outlined text-xl text-[#3e2723] font-bold">local_cafe</span>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white font-headline">Hậu Lê Coffee - POS</h1>
              <p className="text-[10px] text-stone-300 hidden sm:block">Hệ thống ghi order & thanh toán nội bộ</p>
            </div>
          </div>

          {/* Chi nhánh đang chọn */}
          {selectedBranch && (
            <button
              onClick={() => setShowBranchModal(true)}
              disabled={currentUser?.role === "STAFF" && !!currentUser?.branchId}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs font-bold text-amber-400 transition hover:bg-amber-500/20 active:scale-95 shadow-sm disabled:opacity-90 disabled:cursor-not-allowed"
              title={currentUser?.role === "STAFF" && !!currentUser?.branchId ? "Chi nhánh làm việc cố định" : "Nhấp để đổi chi nhánh làm việc"}
            >
              <span className="material-symbols-outlined text-base">storefront</span>
              <span className="max-w-[120px] sm:max-w-[200px] truncate">{selectedBranch.name}</span>
              {!(currentUser?.role === "STAFF" && !!currentUser?.branchId) && (
                <span className="material-symbols-outlined text-xs opacity-70">swap_horiz</span>
              )}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          {currentUser && (
            <div className="flex items-center gap-2 md:gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-white">{currentUser.fullName}</p>
                <p className="text-[9px] uppercase tracking-wider text-amber-400 font-bold">{currentUser.role}</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5d4037] text-white font-bold border border-[#5d4037] shrink-0 text-sm" title={currentUser.fullName}>
                {currentUser.fullName.charAt(0)}
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 md:gap-2">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-500/30 bg-[#5d4037]/40 text-xs font-semibold text-stone-200 transition hover:bg-[#5d4037]/60 hover:text-white"
              title="Về trang chủ Website"
            >
              <span className="material-symbols-outlined text-base">home</span>
              <span className="hidden sm:inline">Về Website</span>
            </button>

            {currentUser?.role === "ADMIN" && (
              <button
                onClick={() => router.push("/pos/admin")}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 text-xs font-semibold text-amber-400 transition hover:bg-amber-500/25"
              >
                <span className="material-symbols-outlined text-base">dashboard</span>
                <span className="hidden sm:inline">Quản Trị POS</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center justify-center rounded-lg p-2 text-stone-300 transition hover:bg-[#5d4037] hover:text-white"
              title="Đăng xuất"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center bg-stone-100/50">
          <div className="flex flex-col items-center gap-3">
            <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#3e2723] border-t-transparent"></span>
            <p className="text-sm text-stone-550">Đang tải dữ liệu POS...</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden pb-14 lg:pb-0 relative">
          
          {/* COLUMN 1: TABLES GRID (LEFT - 25% width) */}
          <section className={`w-full lg:w-1/4 flex-col border-r border-stone-200 bg-stone-50/50 p-4 ${activeMobileTab === "tables" ? "flex" : "hidden lg:flex"}`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 font-headline">Khu vực bàn</h2>
              <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] text-stone-600 font-bold">
                {tables.length} bàn
              </span>
            </div>
            
            {/* Sơ đồ bàn */}
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {tables.map(table => (
                  <button
                    key={table.id}
                    onClick={() => handleSelectTable(table)}
                    className={`flex h-24 flex-col items-center justify-center rounded-xl border p-2 text-center transition duration-200 active:scale-95 ${
                      selectedTable?.id === table.id
                        ? "ring-2 ring-[#3e2723] ring-offset-2 ring-offset-[#fdfbf7]"
                        : ""
                    } ${getTableStatusClass(table.status)}`}
                  >
                    <span className="material-symbols-outlined text-xl mb-0.5">
                      {table.status === "EMPTY" ? "table_restaurant" : "table_bar"}
                    </span>
                    <span className="text-xs font-bold truncate max-w-full">{table.name}</span>
                    {table.status !== "EMPTY" && tableOrderTimes[table.id] ? (
                      <TableTimer startTime={tableOrderTimes[table.id]} />
                    ) : (
                      <span className="text-[8px] uppercase mt-1 opacity-70">
                        {table.status === "EMPTY" ? "Trống" : table.status === "SERVING" ? "Phục vụ" : "Chờ thanh toán"}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* COLUMN 2: PRODUCTS CATALOG (MIDDLE - 45% width) */}
          <section className={`w-full lg:w-[45%] flex-col border-r border-stone-200 p-4 ${activeMobileTab === "menu" ? "flex" : "hidden lg:flex"}`}>
            {/* Search and category filter */}
            <div className="space-y-3">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                  <span className="material-symbols-outlined text-lg">search</span>
                </span>
                <input
                  type="text"
                  placeholder="Tìm món nhanh theo tên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-9 pr-3 text-xs text-stone-850 placeholder-stone-400 outline-none transition focus:border-[#3e2723] focus:ring-1 focus:ring-[#3e2723]"
                />
              </div>

              {/* Category tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                <button
                  onClick={() => setSelectedCategoryId("all")}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    selectedCategoryId === "all"
                      ? "bg-[#3e2723] text-white"
                      : "bg-stone-200/60 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  Tất cả
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      selectedCategoryId === cat.id
                        ? "bg-[#3e2723] text-white"
                        : "bg-stone-200/60 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Products grid */}
            <div className="mt-4 flex-1 overflow-y-auto pr-1">
              {filteredProducts.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-stone-400">
                  <span className="material-symbols-outlined text-4xl mb-2">fastfood</span>
                  <p className="text-xs">Không tìm thấy món ăn/đồ uống phù hợp.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                  {filteredProducts.map(prod => {
                    const cartItem = currentCartItems.find(i => i.productId === prod.id);
                    const qtyInCart = cartItem?.quantity ?? 0;
                    const isInCart = qtyInCart > 0;
                    const isAnimating = lastAddedProductId === prod.id;

                    return (
                    <button
                      key={prod.id}
                      onClick={() => handleAddProductToCart(prod)}
                      disabled={!prod.isAvailable}
                      className={`group relative flex flex-col overflow-hidden rounded-xl border-2 p-2 text-left transition-all duration-200 ${
                        !prod.isAvailable
                          ? "opacity-40 cursor-not-allowed border-stone-200 bg-white"
                          : isInCart
                          ? "border-[#3e2723] bg-[#fdf8f5] shadow-md hover:shadow-lg"
                          : "border-stone-200 bg-white hover:border-[#3e2723] hover:shadow-md hover:bg-stone-50/30"
                      } ${
                        isAnimating ? "scale-[0.93]" : isInCart ? "active:scale-[0.96]" : "active:scale-[0.97]"
                      }`}
                    >
                      {/* Badge: Hết hàng hoặc Số lượng trong cart */}
                      {!prod.isAvailable ? (
                        <div className="absolute top-1.5 right-1.5 z-10 rounded bg-red-600 px-1.5 py-0.5 text-[8px] font-bold uppercase text-white shadow">
                          Hết hàng
                        </div>
                      ) : isInCart ? (
                        <div
                          className={`absolute top-1.5 right-1.5 z-10 min-w-[22px] h-[22px] flex items-center justify-center rounded-full bg-[#3e2723] text-white text-[11px] font-black shadow-md ring-2 ring-white transition-transform duration-200 ${
                            isAnimating ? "scale-125" : "scale-100"
                          }`}
                        >
                          {qtyInCart}
                        </div>
                      ) : null}

                      {/* Cover/Card Image or Icon */}
                      <div className={`relative flex h-20 w-full items-center justify-center overflow-hidden rounded-lg bg-stone-100 text-stone-400 transition group-hover:bg-stone-200/70 ${
                        isInCart ? "ring-1 ring-[#3e2723]/20" : ""
                      }`}>
                        {prod.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="h-full w-full object-cover transition duration-350 group-hover:scale-105"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-3xl text-stone-500 group-hover:scale-110 transition duration-300">
                            {prod.category?.name?.includes("Cà phê") || prod.category?.name?.includes("Coffee") ? "local_cafe" :
                             prod.category?.name?.includes("Trà") ? "emoji_food_beverage" :
                             prod.category?.name?.includes("Bánh") ? "bakery_dining" : "restaurant"}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-col">
                        <span className={`text-xs font-bold line-clamp-1 transition-colors ${
                          isInCart ? "text-[#3e2723]" : "text-stone-800 group-hover:text-[#3e2723]"
                        }`}>
                          {prod.name}
                        </span>
                        <span className="text-[10px] font-bold text-[#5d4037] mt-0.5">
                          {formatPrice(prod.price)}
                        </span>
                      </div>
                    </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* COLUMN 3: CURRENT BILL (RIGHT - 30% width) */}
          <section className={`w-full lg:w-[30%] flex-col bg-stone-50/50 border-l border-stone-200 p-4 ${activeMobileTab === "bill" ? "flex" : "hidden lg:flex"}`}>
            {selectedTable ? (
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* Header Bill */}
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#3e2723] font-bold">table_bar</span>
                    <span className="text-sm font-bold text-stone-850 font-headline">{selectedTable.name}</span>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                    selectedTable.status === "EMPTY" ? "bg-stone-200 text-stone-600" : "bg-amber-600/10 text-amber-600"
                  }`}>
                    {selectedTable.status === "EMPTY" ? "Mới" : "Đang phục vụ"}
                  </span>
                </div>

                {/* Items in Cart */}
                <div className="flex-1 overflow-y-auto py-2 pr-1 space-y-3">
                  {currentCartItems.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center text-stone-400">
                      <span className="material-symbols-outlined text-4xl mb-2">shopping_cart</span>
                      <p className="text-xs">Chưa có món nào được chọn.</p>
                      <p className="text-[10px] text-stone-500 mt-1">Chọn món ở cột giữa để thêm vào hóa đơn.</p>
                    </div>
                  ) : (
                    currentCartItems.map(item => (
                      <div key={item.productId} className="rounded-lg border border-stone-200 bg-white p-2.5 transition hover:border-stone-300">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-stone-800 line-clamp-1">{item.productName}</span>
                            <span className="text-[10px] text-[#5d4037] font-semibold mt-0.5">{formatPrice(item.unitPrice)}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleUpdateItemQuantity(item.productId, -1)}
                              className="flex h-5 w-5 items-center justify-center rounded bg-stone-100 text-stone-600 hover:bg-stone-200 active:scale-95"
                            >
                              <span className="material-symbols-outlined text-xs">remove</span>
                            </button>
                            <span className="text-xs font-bold text-stone-800 w-6 text-center">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateItemQuantity(item.productId, 1)}
                              className="flex h-5 w-5 items-center justify-center rounded bg-stone-100 text-stone-600 hover:bg-stone-200 active:scale-95"
                            >
                              <span className="material-symbols-outlined text-xs">add</span>
                            </button>

                            <button
                              onClick={() => handleRemoveItemFromCart(item.productId)}
                              className="ml-2 flex h-5 w-5 items-center justify-center rounded text-stone-400 hover:bg-red-50 hover:text-red-650 transition"
                            >
                              <span className="material-symbols-outlined text-xs">delete</span>
                            </button>
                          </div>
                        </div>

                        {/* Input notes */}
                        <div className="relative mt-2">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-stone-400">
                            <span className="material-symbols-outlined text-xs">notes</span>
                          </span>
                          <input
                            type="text"
                            placeholder="Ghi chú (đá, đường...)"
                            value={item.notes}
                            onChange={(e) => handleUpdateItemNotes(item.productId, e.target.value)}
                            className="w-full rounded bg-stone-50 border border-stone-200 py-1 pl-6 pr-2 text-[10px] text-stone-800 placeholder-stone-400 outline-none focus:bg-white focus:ring-1 focus:ring-[#3e2723]"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer Bill (Calculation) */}
                <div className="border-t border-stone-200 pt-3 mt-auto bg-stone-100/30 px-2">
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span>Tạm tính</span>
                    <span className="font-semibold text-stone-700">{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-stone-500 mt-1">
                    <span>Thuế GTGT (0%)</span>
                    <span>{formatPrice(0)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-bold text-stone-800 border-t border-stone-150 mt-2 pt-2">
                    <span>Tổng cộng</span>
                    <span className="text-[#3e2723] text-base font-extrabold">{formatPrice(cartTotal)}</span>
                  </div>

                  {/* Actions buttons */}
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button
                      onClick={handleSaveOrder}
                      disabled={actionLoading}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white py-2.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 active:scale-[0.98] disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-stone-400 border-t-transparent"></span>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-base">save</span>
                          <span>Lưu Bill</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={handleOpenPayModal}
                      disabled={actionLoading || currentCartItems.length === 0}
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#3e2723] to-[#5d4037] py-2.5 text-xs font-semibold text-white shadow-md shadow-stone-850/10 transition hover:from-[#5d4037] hover:to-[#3e2723] active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-base">receipt_long</span>
                      <span>Thanh Toán</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center text-center text-stone-400 p-4">
                <span className="material-symbols-outlined text-5xl mb-3">touch_app</span>
                <h3 className="text-sm font-bold text-stone-600 font-headline">Chọn bàn phục vụ</h3>
                <p className="text-xs text-stone-500 max-w-[200px] mt-1 mb-4">
                  Vui lòng chọn một bàn ở cột bên trái để bắt đầu tạo order hoặc thanh toán hóa đơn.
                </p>
                <button
                  onClick={() => setActiveMobileTab("tables")}
                  className="lg:hidden flex items-center gap-1.5 rounded-lg bg-[#3e2723] px-4 py-2 text-xs font-semibold text-white shadow-md active:scale-95 transition"
                >
                  <span className="material-symbols-outlined text-sm">table_restaurant</span>
                  <span>Chọn bàn ngay</span>
                </button>
              </div>
            )}
          </section>

          {/* Bottom Navigation for Mobile */}
          <div className="lg:hidden absolute bottom-0 left-0 right-0 h-14 bg-white border-t border-stone-200 flex items-center justify-around px-2 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
            <button
              onClick={() => setActiveMobileTab("tables")}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                activeMobileTab === "tables" ? "text-[#3e2723]" : "text-stone-400"
              }`}
            >
              <span className="material-symbols-outlined text-xl">table_restaurant</span>
              <span className="text-[10px] font-bold mt-0.5">Bàn</span>
            </button>

            <button
              onClick={() => setActiveMobileTab("menu")}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition relative ${
                activeMobileTab === "menu" ? "text-[#3e2723]" : "text-stone-400"
              }`}
            >
              <span className="material-symbols-outlined text-xl">restaurant_menu</span>
              <span className="text-[10px] font-bold mt-0.5">Thực đơn</span>
              {selectedTable && (
                <span className="absolute top-1 right-1/2 translate-x-5 bg-amber-600 text-white text-[8px] font-black rounded-full h-2 w-2 ring-1 ring-white"></span>
              )}
            </button>

            <button
              onClick={() => setActiveMobileTab("bill")}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition relative ${
                activeMobileTab === "bill" ? "text-[#3e2723]" : "text-stone-400"
              }`}
            >
              <span className="material-symbols-outlined text-xl">receipt_long</span>
              <span className="text-[10px] font-bold mt-0.5">
                {selectedTable ? selectedTable.name : "Hóa đơn"}
              </span>
              {currentCartItems.length > 0 && (
                <span className="absolute -top-0.5 right-1/2 translate-x-5 bg-amber-600 text-white text-[9px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 ring-2 ring-white">
                  {currentCartItems.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* --- PAYMENT MODAL --- */}
      {showPayModal && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl transition-all">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3e2723] font-bold">payments</span>
                <h3 className="text-sm font-bold text-stone-850 font-headline">Thanh toán hóa đơn: {selectedTable.name}</h3>
              </div>
              <button
                onClick={() => setShowPayModal(false)}
                className="text-stone-400 transition hover:text-stone-700"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Tổng tiền cần trả */}
              <div className="flex justify-between items-center rounded-xl bg-stone-50 p-4 border border-stone-200">
                <span className="text-xs text-stone-500 font-semibold">Tổng tiền thanh toán</span>
                <span className="text-lg font-black text-[#3e2723] font-headline">{formatPrice(cartTotal)}</span>
              </div>

              {/* Lựa chọn phương thức thanh toán */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Phương thức thanh toán
                </label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { id: "CASH", name: "Tiền mặt", icon: "payments" },
                    { id: "BANK_TRANSFER", name: "Chuyển khoản", icon: "account_balance" },
                    { id: "E_WALLET", name: "Ví điện tử", icon: "wallet" },
                    { id: "CARD", name: "Quẹt thẻ", icon: "credit_card" }
                  ].map(method => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                      className={`flex items-center gap-2.5 rounded-lg border p-3 text-left transition ${
                        paymentMethod === method.id
                          ? "border-[#3e2723] bg-[#3e2723]/5 text-[#3e2723]"
                          : "border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300"
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">{method.icon}</span>
                      <span className="text-xs font-semibold">{method.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Nếu chọn TIỀN MẶT, hiện tính tiền thừa */}
              {paymentMethod === "CASH" && (
                <div className="space-y-3 border-t border-stone-200 pt-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      Tiền mặt khách đưa
                    </label>
                    <div className="relative mt-2">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400 text-xs font-bold">
                        VND
                      </span>
                      <input
                        type="number"
                        placeholder="Ví dụ: 100000"
                        value={customerMoney}
                        onChange={(e) => setCustomerMoney(e.target.value)}
                        className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2.5 pl-12 pr-3 text-sm font-bold text-stone-900 placeholder-stone-400 outline-none transition focus:border-[#3e2723] focus:bg-white"
                      />
                    </div>
                  </div>

                  {Number(customerMoney) > 0 && (
                    <div className="flex justify-between items-center rounded-lg bg-stone-50 p-3 text-xs border border-stone-150">
                      <span className="text-stone-500">Tiền thừa trả khách</span>
                      <span className="font-bold text-emerald-600 text-sm">{formatPrice(changeMoney)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Modal Actions */}
            <div className="flex gap-3 mt-6 border-t border-stone-200 pt-4">
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="flex-1 rounded-lg border border-stone-200 bg-stone-100 py-2.5 text-xs font-semibold text-stone-600 transition hover:bg-stone-200"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={actionLoading || (paymentMethod === "CASH" && Number(customerMoney) < cartTotal && customerMoney !== "")}
                className="flex-1 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-500/10 transition hover:from-emerald-500 hover:to-emerald-600 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {actionLoading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                ) : (
                  "Xác nhận Chốt Bill"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- BRANCH SELECTION MODAL --- */}
      {showBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-stone-250 bg-white p-6 shadow-2xl transition-all duration-300 transform scale-100">
            <div className="flex items-center justify-between border-b border-stone-250 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3e2723] text-white">
                  <span className="material-symbols-outlined text-lg">storefront</span>
                </div>
                <div>
                  <h3 className="text-sm font-black text-stone-900 font-headline uppercase tracking-wide">Chọn chi nhánh làm việc</h3>
                  <p className="text-[10px] text-stone-500 mt-0.5">Vui lòng chọn cửa hàng để tải sơ đồ bàn và thực đơn</p>
                </div>
              </div>
              {selectedBranch && (
                <button
                  onClick={() => setShowBranchModal(false)}
                  className="text-stone-400 transition hover:text-stone-750 p-1.5 rounded-full hover:bg-stone-100"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              )}
            </div>

            <div className="mt-4 max-h-[350px] overflow-y-auto pr-1 space-y-3">
              {branches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-stone-400">
                  <span className="material-symbols-outlined text-4xl mb-2 animate-bounce">store_slash</span>
                  <p className="text-xs">Không tìm thấy chi nhánh nào đang hoạt động.</p>
                </div>
              ) : (
                branches.map(branch => {
                  const isSelected = selectedBranch?.id === branch.id;
                  return (
                    <button
                      key={branch.id}
                      type="button"
                      onClick={() => handleSelectBranch(branch)}
                      className={`w-full flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                        isSelected
                          ? "border-[#3e2723] bg-[#3e2723]/5 shadow-md"
                          : "border-stone-200 bg-stone-50/50 hover:bg-white hover:border-[#3e2723] hover:shadow-md active:scale-[0.99]"
                      }`}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                        isSelected ? "bg-[#3e2723] text-white" : "bg-stone-200 text-stone-600"
                      }`}>
                        <span className="material-symbols-outlined text-xl">store</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-900">{branch.name}</span>
                          {isSelected && (
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#3e2723] text-white text-[10px] font-bold">
                              <span className="material-symbols-outlined text-xs">check</span>
                            </span>
                          )}
                        </div>
                        {branch.address && (
                          <div className="flex items-center gap-1 text-[10px] text-stone-500 mt-1">
                            <span className="material-symbols-outlined text-xs">location_on</span>
                            <span className="truncate">{branch.address}</span>
                          </div>
                        )}
                        {branch.phone && (
                          <div className="flex items-center gap-1 text-[10px] text-stone-500 mt-0.5">
                            <span className="material-symbols-outlined text-xs">call</span>
                            <span>{branch.phone}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {selectedBranch && (
              <div className="flex justify-end mt-6 border-t border-stone-200 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBranchModal(false)}
                  className="rounded-lg border border-stone-200 bg-stone-100 px-5 py-2.5 text-xs font-semibold text-stone-650 transition hover:bg-stone-200 active:scale-95"
                >
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
// Component đồng hồ đếm thời gian phục vụ tính từ khi tạo order
function TableTimer({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = React.useState(0);

  React.useEffect(() => {
    const start = new Date(startTime).getTime();
    const tick = () => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;

  const isLong = elapsed >= 3600; // >= 1 tiếng
  const isWarning = elapsed >= 1800; // >= 30 phút

  const display = h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

  return (
    <span
      className={`mt-1 flex items-center gap-0.5 text-[9px] font-mono font-black tabular-nums ${
        isLong ? "text-red-300 animate-pulse" :
        isWarning ? "text-orange-200" :
        "text-white/80"
      }`}
    >
      <span className="material-symbols-outlined" style={{ fontSize: "9px" }}>schedule</span>
      {display}
    </span>
  );
}
