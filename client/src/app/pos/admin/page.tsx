"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { posApi, posTokenStore, formatPrice } from "../../../lib/pos-api";
import type { CafeCategory, CafeProduct, CafeTable, CafeOrder, CafeOrderItem, PaymentMethod, CafeOrderStatus } from "../../../lib/pos-api";
import { ApiError } from "../../../lib/api";

type TabType = "dashboard" | "menu" | "tables" | "history" | "branches" | "staff";
type MenuSubTabType = "products" | "categories";

export default function PosAdminPage() {
  const router = useRouter();

  // Core App States
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [menuSubTab, setMenuSubTab] = useState<MenuSubTabType>("products");
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Branch States
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");

  // Data States
  const [categories, setCategories] = useState<CafeCategory[]>([]);
  const [products, setProducts] = useState<CafeProduct[]>([]);
  const [tables, setTables] = useState<CafeTable[]>([]);
  const [historyOrders, setHistoryOrders] = useState<CafeOrder[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ type: "", message: "" });

  // Filters for Products
  const [prodSearch, setProdSearch] = useState("");
  const [prodCategoryFilter, setProdCategoryFilter] = useState("all");

  // Filters for History
  const [historyStartDate, setHistoryStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7); // Default to last 7 days
    return d.toISOString().split("T")[0];
  });
  const [historyEndDate, setHistoryEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>("all");

  // Detail & Modals State
  const [selectedOrder, setSelectedOrder] = useState<CafeOrder | null>(null);
  
  // Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CafeCategory | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDesc, setCategoryDesc] = useState("");

  // Product Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CafeProduct | null>(null);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productCategoryId, setProductCategoryId] = useState("");
  const [productIsActive, setProductIsActive] = useState(true);
  const [productIsAvailable, setProductIsAvailable] = useState(true);

  // Table Modal State
  const [showTableModal, setShowTableModal] = useState(false);
  const [editingTable, setEditingTable] = useState<CafeTable | null>(null);
  const [tableName, setTableName] = useState("");
  const [tableIsActive, setTableIsActive] = useState(true);

  // Branch CRUD Modal State
  const [showBranchCrudModal, setShowBranchCrudModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any | null>(null);
  const [branchName, setBranchName] = useState("");
  const [branchAddress, setBranchAddress] = useState("");
  const [branchPhone, setBranchPhone] = useState("");
  const [branchIsActive, setBranchIsActive] = useState(true);

  // Staff States & Modal
  const [staffs, setStaffs] = useState<any[]>([]);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [staffUsername, setStaffUsername] = useState("");
  const [staffFullName, setStaffFullName] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffRole, setStaffRole] = useState<"ADMIN" | "STAFF">("STAFF");
  const [staffBranchId, setStaffBranchId] = useState("");

  // Load list of branches and set active branch
  const loadBranches = async () => {
    try {
      const branchesData = await posApi.getBranches({ showInactive: true });
      setBranches(branchesData);
      
      const savedBranchId = window.localStorage.getItem("pos_branch_id");
      let activeId = "";
      if (savedBranchId) {
        const found = branchesData.find(b => b.id === savedBranchId);
        if (found) {
          activeId = found.id;
        }
      }
      
      if (!activeId && branchesData.length > 0) {
        const activeBranch = branchesData.find(b => b.isActive) || branchesData[0];
        activeId = activeBranch.id;
        window.localStorage.setItem("pos_branch_id", activeId);
      }
      
      setSelectedBranchId(activeId);
      return activeId;
    } catch (err) {
      console.error("Load branches error:", err);
      showToast("error", "Không thể tải danh sách chi nhánh.");
      return "";
    }
  };

  const handleBranchChange = (branchId: string) => {
    window.localStorage.setItem("pos_branch_id", branchId);
    setSelectedBranchId(branchId);
    
    // Refresh active tab data
    if (activeTab === "dashboard") {
      loadDashboardData();
    } else if (activeTab === "menu") {
      loadMenuData();
    } else if (activeTab === "tables") {
      loadTablesData();
    } else if (activeTab === "history") {
      loadHistoryData();
    }
  };

  // Load Admin Profile & Branches
  useEffect(() => {
    const savedUser = window.localStorage.getItem("pos_user");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    
    const init = async () => {
      setLoading(true);
      const activeId = await loadBranches();
      if (activeId) {
        if (activeTab === "dashboard") {
          loadDashboardData();
        } else if (activeTab === "menu") {
          loadMenuData();
        } else if (activeTab === "tables") {
          loadTablesData();
        } else if (activeTab === "history") {
          loadHistoryData();
        }
      } else {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Show Toast Helper
  const showToast = (type: "success" | "error" | "warning", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: "", message: "" }), 3500);
  };

  // Load Dashboard Data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const analytics = await posApi.getDashboardAnalytics();
      setDashboardData(analytics);
    } catch (err) {
      console.error("Load dashboard data error:", err);
      showToast("error", "Không thể tải số liệu thống kê doanh thu.");
    } finally {
      setLoading(false);
    }
  };

  // Load Menu (Categories & Products)
  const loadMenuData = async () => {
    setActionLoading(true);
    try {
      const [cats, prods] = await Promise.all([
        posApi.getCategories(),
        posApi.getProducts({ showInactive: true })
      ]);
      setCategories(cats);
      setProducts(prods);
    } catch (err) {
      console.error("Load menu data error:", err);
      showToast("error", "Không thể tải dữ liệu Thực đơn.");
    } finally {
      setActionLoading(false);
    }
  };

  // Load Tables Data
  const loadTablesData = async () => {
    setActionLoading(true);
    try {
      const data = await posApi.getTables({ showInactive: true });
      setTables(data);
    } catch (err) {
      console.error("Load tables data error:", err);
      showToast("error", "Không thể tải dữ liệu sơ đồ Bàn.");
    } finally {
      setActionLoading(false);
    }
  };

  // Load History Data
  const loadHistoryData = async () => {
    setActionLoading(true);
    try {
      const statusParam = historyStatusFilter === "all" ? undefined : (historyStatusFilter as CafeOrderStatus);
      const data = await posApi.getOrderHistory({
        startDate: historyStartDate,
        endDate: historyEndDate,
        status: statusParam
      });
      setHistoryOrders(data);
    } catch (err) {
      console.error("Load history data error:", err);
      showToast("error", "Không thể tải lịch sử hóa đơn.");
    } finally {
      setActionLoading(false);
    }
  };

  // Switch Main Tabs Handler
  useEffect(() => {
    if (branches.length === 0) return;
    
    if (activeTab === "dashboard") {
      loadDashboardData();
    } else if (activeTab === "menu") {
      loadMenuData();
    } else if (activeTab === "tables") {
      loadTablesData();
    } else if (activeTab === "history") {
      loadHistoryData();
    } else if (activeTab === "staff") {
      loadStaffsData();
    }
  }, [activeTab]);

  // Logout Handler
  const handleLogout = () => {
    posTokenStore.clear();
    window.localStorage.removeItem("pos_user");
    router.push("/login");
  };

  // ==========================================
  // CATEGORIES CRUD OPERATIONS
  // ==========================================
  const handleOpenCategoryModal = (cat: CafeCategory | null = null) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryName(cat.name);
      setCategoryDesc(cat.description || "");
    } else {
      setEditingCategory(null);
      setCategoryName("");
      setCategoryDesc("");
    }
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      showToast("warning", "Vui lòng nhập tên danh mục");
      return;
    }

    setActionLoading(true);
    try {
      if (editingCategory) {
        // Update
        const updated = await posApi.updateCategory(editingCategory.id, {
          name: categoryName.trim(),
          description: categoryDesc.trim() || null
        });
        showToast("success", `Cập nhật danh mục "${updated.name}" thành công!`);
      } else {
        // Create
        const created = await posApi.createCategory({
          name: categoryName.trim(),
          description: categoryDesc.trim() || null
        });
        showToast("success", `Tạo danh mục "${created.name}" thành công!`);
      }
      setShowCategoryModal(false);
      loadMenuData();
    } catch (err: any) {
      showToast("error", err.message || "Không thể lưu danh mục.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa danh mục "${name}"? Thao tác này không thể hoàn tác.`)) {
      return;
    }

    setActionLoading(true);
    try {
      await posApi.deleteCategory(id);
      showToast("success", `Đã xóa danh mục "${name}" thành công.`);
      loadMenuData();
    } catch (err: any) {
      showToast("error", err.message || "Gặp lỗi khi xóa danh mục. Có thể có món ăn đang thuộc danh mục này.");
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // PRODUCTS CRUD OPERATIONS
  // ==========================================
  const handleOpenProductModal = (prod: CafeProduct | null = null) => {
    if (prod) {
      setEditingProduct(prod);
      setProductName(prod.name);
      setProductPrice(String(prod.price));
      setProductCategoryId(prod.categoryId);
      setProductIsActive(prod.isActive);
      setProductIsAvailable(prod.isAvailable);
    } else {
      setEditingProduct(null);
      setProductName("");
      setProductPrice("");
      setProductCategoryId(categories[0]?.id || "");
      setProductIsActive(true);
      setProductIsAvailable(true);
    }
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !productPrice.trim() || !productCategoryId) {
      showToast("warning", "Vui lòng nhập đầy đủ thông tin bắt buộc.");
      return;
    }

    const priceNum = Number(productPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      showToast("warning", "Giá bán phải là số lớn hơn hoặc bằng 0.");
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        name: productName.trim(),
        price: priceNum,
        categoryId: productCategoryId,
        isActive: productIsActive,
        isAvailable: productIsAvailable
      };

      if (editingProduct) {
        const updated = await posApi.updateProduct(editingProduct.id, payload);
        showToast("success", `Cập nhật món "${updated.name}" thành công!`);
      } else {
        const created = await posApi.createProduct(payload);
        showToast("success", `Thêm món "${created.name}" thành công!`);
      }
      setShowProductModal(false);
      loadMenuData();
    } catch (err: any) {
      showToast("error", err.message || "Không thể lưu sản phẩm.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickToggleProduct = async (prod: CafeProduct, field: "isActive" | "isAvailable") => {
    try {
      const updatedValue = !prod[field];
      await posApi.updateProduct(prod.id, { [field]: updatedValue });
      showToast("success", `Đã cập nhật trạng thái món ${prod.name}`);
      
      // Update local state without full reload to preserve search/scroll
      setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, [field]: updatedValue } : p));
    } catch (err: any) {
      showToast("error", err.message || "Không thể cập nhật trạng thái nhanh.");
    }
  };

  const handleDeleteProduct = async (prod: CafeProduct) => {
    if (!confirm(`Bạn có chắc muốn xóa món "${prod.name}"?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await posApi.deleteProduct(prod.id);
      showToast("success", res.message || "Xóa món thành công.");
      loadMenuData();
    } catch (err: any) {
      showToast("error", err.message || "Không thể xóa món.");
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // TABLES CRUD OPERATIONS
  // ==========================================
  const handleOpenTableModal = (table: CafeTable | null = null) => {
    if (table) {
      setEditingTable(table);
      setTableName(table.name);
      setTableIsActive(table.isActive);
    } else {
      setEditingTable(null);
      setTableName("");
      setTableIsActive(true);
    }
    setShowTableModal(true);
  };

  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableName.trim()) {
      showToast("warning", "Tên bàn không được để trống");
      return;
    }

    setActionLoading(true);
    try {
      if (editingTable) {
        const updated = await posApi.updateTable(editingTable.id, {
          name: tableName.trim(),
          isActive: tableIsActive
        });
        showToast("success", `Cập nhật ${updated.name} thành công!`);
      } else {
        const created = await posApi.createTable({
          name: tableName.trim(),
          isActive: tableIsActive,
          branchId: selectedBranchId
        });
        showToast("success", `Đã tạo ${created.name} thành công!`);
      }
      setShowTableModal(false);
      loadTablesData();
    } catch (err: any) {
      showToast("error", err.message || "Không thể lưu bàn.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickToggleTable = async (table: CafeTable) => {
    try {
      const updatedValue = !table.isActive;
      await posApi.updateTable(table.id, { isActive: updatedValue });
      showToast("success", `Đã cập nhật trạng thái ${table.name}`);
      setTables(prev => prev.map(t => t.id === table.id ? { ...t, isActive: updatedValue } : t));
    } catch (err: any) {
      showToast("error", err.message || "Không thể cập nhật trạng thái bàn.");
    }
  };

  const handleResetTableStatus = async (table: CafeTable) => {
    if (!confirm(`Bạn có chắc muốn ép giải phóng trạng thái của ${table.name} về Trống (EMPTY)? Hãy chắc chắn không còn hóa đơn mở nào cho bàn này.`)) {
      return;
    }

    setActionLoading(true);
    try {
      await posApi.updateTable(table.id, { status: "EMPTY" });
      showToast("success", `Đã giải phóng ${table.name} thành công.`);
      loadTablesData();
    } catch (err: any) {
      showToast("error", err.message || "Lỗi khi giải phóng bàn.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTable = async (table: CafeTable) => {
    if (!confirm(`Bạn có muốn xóa ${table.name}?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await posApi.deleteTable(table.id);
      showToast("success", res.message || "Xóa bàn thành công.");
      loadTablesData();
    } catch (err: any) {
      showToast("error", err.message || "Gặp lỗi khi xóa bàn.");
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // BRANCHES CRUD OPERATIONS
  // ==========================================
  const handleOpenBranchModal = (branch: any | null = null) => {
    if (branch) {
      setEditingBranch(branch);
      setBranchName(branch.name);
      setBranchAddress(branch.address || "");
      setBranchPhone(branch.phone || "");
      setBranchIsActive(branch.isActive);
    } else {
      setEditingBranch(null);
      setBranchName("");
      setBranchAddress("");
      setBranchPhone("");
      setBranchIsActive(true);
    }
    setShowBranchCrudModal(true);
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim()) {
      showToast("warning", "Tên chi nhánh không được để trống");
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        name: branchName.trim(),
        address: branchAddress.trim() || undefined,
        phone: branchPhone.trim() || undefined,
        isActive: branchIsActive
      };

      if (editingBranch) {
        const updated = await posApi.updateBranch(editingBranch.id, payload);
        showToast("success", `Cập nhật chi nhánh "${updated.name}" thành công!`);
      } else {
        const created = await posApi.createBranch(payload);
        showToast("success", `Đã tạo chi nhánh "${created.name}" thành công!`);
      }
      setShowBranchCrudModal(false);
      loadBranches();
    } catch (err: any) {
      showToast("error", err.message || "Không thể lưu chi nhánh.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickToggleBranch = async (branch: any) => {
    try {
      const updatedValue = !branch.isActive;
      await posApi.updateBranch(branch.id, { isActive: updatedValue });
      showToast("success", `Đã cập nhật trạng thái chi nhánh "${branch.name}"`);
      setBranches(prev => prev.map(b => b.id === branch.id ? { ...b, isActive: updatedValue } : b));
    } catch (err: any) {
      showToast("error", err.message || "Không thể cập nhật trạng thái chi nhánh.");
    }
  };

  const handleDeleteBranch = async (branch: any) => {
    if (!confirm(`Bạn có chắc muốn xóa chi nhánh "${branch.name}"? Đối với các chi nhánh đã có dữ liệu bàn ăn hoặc hóa đơn, hệ thống sẽ tự động chuyển sang ẩn hoạt động.`)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await posApi.deleteBranch(branch.id);
      showToast("success", res.message || "Xóa chi nhánh thành công.");
      loadBranches();
    } catch (err: any) {
      showToast("error", err.message || "Gặp lỗi khi xóa chi nhánh.");
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // STAFF MANAGEMENT OPERATIONS
  // ==========================================
  const loadStaffsData = async () => {
    setActionLoading(true);
    try {
      const data = await posApi.listStaffs();
      setStaffs(data);
    } catch (err: any) {
      console.error("Load staffs error:", err);
      showToast("error", "Không thể tải danh sách nhân viên.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenStaffModal = (staff: any | null = null) => {
    if (staff) {
      setEditingStaff(staff);
      setStaffUsername(staff.username);
      setStaffFullName(staff.fullName);
      setStaffRole(staff.role);
      setStaffBranchId(staff.branchId || "");
      setStaffPassword("");
    } else {
      setEditingStaff(null);
      setStaffUsername("");
      setStaffFullName("");
      setStaffRole("STAFF");
      setStaffBranchId("");
      setStaffPassword("");
    }
    setShowStaffModal(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffUsername.trim() || !staffFullName.trim()) {
      showToast("warning", "Vui lòng nhập đầy đủ thông tin bắt buộc.");
      return;
    }
    if (!editingStaff && !staffPassword) {
      showToast("warning", "Mật khẩu là bắt buộc khi tạo nhân viên mới.");
      return;
    }

    setActionLoading(true);
    try {
      const payload: any = {
        fullName: staffFullName.trim(),
        role: staffRole,
        branchId: staffBranchId || null
      };
      if (staffPassword) {
        payload.password = staffPassword;
      }

      if (editingStaff) {
        await posApi.updateStaff(editingStaff.id, payload);
        showToast("success", `Cập nhật tài khoản "${staffFullName.trim()}" thành công!`);
      } else {
        await posApi.createStaff({
          username: staffUsername.trim().toLowerCase(),
          password: staffPassword,
          fullName: staffFullName.trim(),
          role: staffRole,
          branchId: staffBranchId || null
        });
        showToast("success", `Tạo tài khoản nhân viên "${staffFullName.trim()}" thành công!`);
      }
      setShowStaffModal(false);
      loadStaffsData();
    } catch (err: any) {
      showToast("error", err.message || "Gặp lỗi khi lưu thông tin nhân viên.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStaff = async (staff: any) => {
    if (staff.id === currentUser?.id) {
      showToast("error", "Bạn không thể tự xóa tài khoản của chính mình.");
      return;
    }
    if (!confirm(`Bạn có chắc chắn muốn gỡ quyền truy cập của nhân viên "${staff.fullName}"?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await posApi.deleteStaff(staff.id);
      showToast("success", res.message || "Gỡ quyền nhân viên thành công.");
      loadStaffsData();
    } catch (err: any) {
      showToast("error", err.message || "Gặp lỗi khi gỡ quyền nhân viên.");
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // BILL HISTORY OPERATIONS (CANCEL & REFUND)
  // ==========================================
  const handleUpdateOrderStatus = async (orderId: string, targetStatus: "CANCELLED" | "REFUNDED") => {
    const textAction = targetStatus === "CANCELLED" ? "Hủy hóa đơn" : "Hoàn tiền";
    const textWarning = targetStatus === "CANCELLED" 
      ? "Thao tác này sẽ HỦY hóa đơn và giải phóng bàn. Bạn chắc chắn chứ?"
      : "Thao tác này sẽ hoàn trả số tiền hóa đơn này. Doanh thu của hôm nay sẽ bị trừ đi tương ứng. Bạn chắc chắn chứ?";

    if (!confirm(`${textAction}?\n${textWarning}`)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await posApi.updateOrderStatus(orderId, { status: targetStatus });
      showToast("success", res.message || `${textAction} thành công.`);
      
      // Close detail modal if open
      setSelectedOrder(null);
      
      // Reload history
      loadHistoryData();
    } catch (err: any) {
      showToast("error", err.message || `Lỗi khi thực hiện ${textAction.toLowerCase()}.`);
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered lists
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = prodCategoryFilter === "all" || p.categoryId === prodCategoryFilter;
      const matchSearch = p.name.toLowerCase().includes(prodSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, prodCategoryFilter, prodSearch]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#fdfbf7] text-stone-800 select-none">
      {/* Toast Notification */}
      {toast.message && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 rounded-xl border px-5 py-3.5 shadow-xl transition-all duration-300 ${
          toast.type === "success" ? "border-emerald-250 bg-emerald-50 text-emerald-800" :
          toast.type === "error" ? "border-red-250 bg-red-50 text-red-805" :
          "border-amber-250 bg-amber-50 text-amber-805"
        }`}>
          <span className="material-symbols-outlined text-lg">
            {toast.type === "success" ? "check_circle" : toast.type === "error" ? "error" : "warning"}
          </span>
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className="hidden md:flex w-64 border-r border-[#3e2723] bg-[#3e2723] flex-col justify-between shrink-0 text-stone-200">
        <div className="flex flex-col overflow-y-auto">
          {/* Logo Brand */}
          <div className="flex h-16 items-center gap-3 border-b border-[#5d4037] px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fdfbf7] shadow-inner text-[#3e2723]">
              <span className="material-symbols-outlined text-xl text-[#3e2723]">storefront</span>
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight text-white uppercase">Hậu Lê Admin</h2>
              <p className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">POS System</p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-1">
            {[
              { id: "dashboard", label: "Dashboard Doanh thu", icon: "dashboard" },
              { id: "menu", label: "Quản lý Thực đơn", icon: "restaurant_menu" },
              { id: "tables", label: "Quản lý Sơ đồ Bàn", icon: "table_restaurant" },
              { id: "history", label: "Lịch sử Hóa đơn", icon: "receipt_long" },
              { id: "branches", label: "Quản lý Chi nhánh", icon: "store" },
              { id: "staff", label: "Quản lý Nhân viên", icon: "badge" }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold transition duration-200 ${
                  activeTab === item.id
                    ? "bg-[#5d4037] text-white border-l-4 border-amber-500"
                    : "text-stone-300 hover:bg-[#5d4037]/50 hover:text-white"
                }`}
              >
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* User Block & Bottom Links */}
        <div className="p-4 border-t border-[#5d4037] bg-[#3e2723]/30">
          {currentUser && (
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#5d4037] text-white font-bold border border-[#8d6e63]">
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-stone-100 truncate leading-none">{currentUser.fullName}</p>
                <p className="text-[9px] uppercase tracking-wider text-amber-400 font-black mt-1">Admin</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <button
              onClick={() => router.push("/")}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5d4037]/45 py-2.5 text-xs font-bold text-stone-200 border border-[#5d4037] transition hover:bg-[#5d4037] hover:text-white active:scale-95"
            >
              <span className="material-symbols-outlined text-base">home</span>
              Về Website
            </button>

            <button
              onClick={() => router.push("/pos")}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5d4037]/45 py-2.5 text-xs font-bold text-stone-200 border border-[#5d4037] transition hover:bg-[#5d4037] hover:text-white active:scale-95"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Quay lại Bán Hàng
            </button>
            
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 py-2.5 text-xs font-bold text-red-300 transition hover:bg-red-550/25 active:scale-95"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-stone-200 bg-white px-4 md:px-8">
          <div>
            <h1 className="text-sm md:text-base font-black text-stone-900 capitalize tracking-wide">
              {activeTab === "dashboard" ? "Dashboard Doanh thu" :
               activeTab === "menu" ? "Quản lý Thực đơn" :
               activeTab === "tables" ? "Quản lý Sơ đồ Bàn" :
               activeTab === "branches" ? "Quản lý Chi nhánh" : "Lịch sử Hóa đơn"}
            </h1>
            <p className="text-[9px] md:text-[10px] text-stone-500">Trang quản trị vận hành dành cho Admin</p>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Bộ chọn chi nhánh */}
            {branches.length > 0 && activeTab !== "branches" && (
              <div className="flex items-center gap-1.5 md:gap-2 mr-2">
                <span className="material-symbols-outlined text-stone-500 text-base hidden sm:inline">storefront</span>
                <select
                  value={selectedBranchId}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  className="rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-bold text-stone-700 outline-none transition focus:border-[#3e2723] focus:ring-1 focus:ring-[#3e2723] cursor-pointer shadow-sm hover:border-stone-300"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id} disabled={!b.isActive}>{b.name}{!b.isActive ? " (Ẩn)" : ""}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Quick Navigation for Mobile */}
            <div className="flex items-center gap-1 md:hidden">
              <button
                onClick={() => router.push("/")}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-50 text-stone-600 border border-stone-200 transition active:scale-95"
                title="Về Website"
              >
                <span className="material-symbols-outlined text-base">home</span>
              </button>
              <button
                onClick={() => router.push("/pos")}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-50 text-stone-600 border border-stone-200 transition active:scale-95"
                title="Ghi Order POS"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-650 border border-red-200 transition active:scale-95"
                title="Đăng xuất"
              >
                <span className="material-symbols-outlined text-base">logout</span>
              </button>
            </div>

            <button
              onClick={
                activeTab === "dashboard" ? loadDashboardData :
                activeTab === "menu" ? loadMenuData :
                activeTab === "tables" ? loadTablesData :
                activeTab === "branches" ? loadBranches :
                activeTab === "staff" ? loadStaffsData : loadHistoryData
              }
              disabled={actionLoading}
              className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-xl bg-white border border-stone-200 text-stone-600 transition hover:text-stone-900 hover:border-stone-350 disabled:opacity-50"
              title="Làm mới dữ liệu"
            >
              <span className={`material-symbols-outlined text-base md:text-lg ${actionLoading ? "animate-spin" : ""}`}>refresh</span>
            </button>
            <span className="hidden sm:inline-block text-[10px] font-bold text-stone-600 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200">
              V2026.05.21
            </span>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
          
          {/* ======================================================== */}
          {/* TAB 1: DASHBOARD */}
          {/* ======================================================== */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {loading ? (
                <div className="flex h-96 items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <span className="h-9 w-9 animate-spin rounded-full border-4 border-[#3e2723] border-t-transparent"></span>
                    <p className="text-xs text-stone-500">Đang tổng hợp báo cáo...</p>
                  </div>
                </div>
              ) : dashboardData ? (
                <>
                  {/* METRIC CARD ROW */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-stone-300 hover:shadow-md group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#3e2723]/10 text-[#3e2723] border border-[#3e2723]/20">
                          <span className="material-symbols-outlined text-2xl">monetization_on</span>
                        </div>
                        <span className="text-[10px] font-black uppercase text-[#3e2723] tracking-widest bg-[#3e2723]/5 px-2.5 py-1 rounded-full border border-[#3e2723]/10">Hôm nay</span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">Doanh thu hôm nay</span>
                      <h3 className="text-2xl font-black text-stone-900 mt-1.5 leading-none">{formatPrice(dashboardData.todayRevenue)}</h3>
                      <p className="text-[10px] text-stone-500 mt-2.5">Chỉ bao gồm các hóa đơn đã chốt tiền mặt/bank</p>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-stone-300 hover:shadow-md group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#5d4037]/10 text-[#5d4037] border border-[#5d4037]/20">
                          <span className="material-symbols-outlined text-2xl">receipt</span>
                        </div>
                        <span className="text-[10px] font-black uppercase text-[#5d4037] tracking-widest bg-[#5d4037]/5 px-2.5 py-1 rounded-full border border-[#5d4037]/10">Tổng bill</span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">Số hóa đơn đã thanh toán</span>
                      <h3 className="text-2xl font-black text-stone-900 mt-1.5 leading-none">{dashboardData.todayOrdersCount} hóa đơn</h3>
                      <p className="text-[10px] text-stone-500 mt-2.5">Tổng số lượt phục vụ bàn chốt bill thành công</p>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-stone-300 hover:shadow-md group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-stone-600 border border-stone-200">
                          <span className="material-symbols-outlined text-2xl">calculate</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">Giá trị hóa đơn trung bình (AOV)</span>
                      <h3 className="text-2xl font-black text-stone-900 mt-1.5 leading-none">{formatPrice(dashboardData.todayAOV)}</h3>
                      <p className="text-[10px] text-stone-500 mt-2.5">Số tiền trung bình chi tiêu trên một hóa đơn</p>
                    </div>
                  </div>

                  {/* CHARTS / VISUALIZATIONS SECTION */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Payment methods breakout */}
                    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm flex flex-col">
                      <h3 className="text-sm font-bold text-stone-900 mb-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3e2723] text-lg">account_balance_wallet</span>
                        <span>Cơ cấu Phương thức Thanh toán</span>
                      </h3>
                      <p className="text-[10px] text-stone-500 mb-6">Thống kê tỷ trọng tiền thu theo phương thức của hôm nay</p>
                      
                      <div className="space-y-5 flex-1 flex flex-col justify-center">
                        {(() => {
                          const total = Object.values(dashboardData.revenueByMethod || {}).reduce((s: number, v: any) => s + Number(v), 0) as number;
                          const methods = [
                            { id: "CASH", label: "Tiền mặt", color: "from-[#5d4037] to-[#8d6e63]" },
                            { id: "BANK_TRANSFER", label: "Chuyển khoản", color: "from-blue-600 to-blue-500" },
                            { id: "E_WALLET", label: "Ví điện tử MoMo/Zalo", color: "from-pink-600 to-pink-500" },
                            { id: "CARD", label: "Thẻ ATM/Visa", color: "from-emerald-600 to-emerald-500" }
                          ];
                          
                          return methods.map(m => {
                            const val = Number((dashboardData.revenueByMethod || {})[m.id] || 0);
                            const percent = total > 0 ? (val / total) * 100 : 0;
                            return (
                              <div key={m.id} className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-semibold text-stone-700">{m.label}</span>
                                  <span className="font-black text-stone-900">{formatPrice(val)} <span className="text-stone-400 font-normal">({percent.toFixed(1)}%)</span></span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full bg-gradient-to-r ${m.color} transition-all duration-500`}
                                    style={{ width: `${percent}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Top products list */}
                    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                      <h3 className="text-sm font-bold text-stone-900 mb-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#3e2723] text-lg">hotel_class</span>
                        <span>Top 5 Món Bán Chạy Nhất</span>
                      </h3>
                      <p className="text-[10px] text-stone-500 mb-4">Danh sách món ăn/đồ uống được order nhiều nhất</p>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-stone-200 text-stone-500">
                              <th className="py-2.5 font-bold uppercase tracking-wider w-12 text-center">Rank</th>
                              <th className="py-2.5 font-bold uppercase tracking-wider pl-2">Tên món</th>
                              <th className="py-2.5 font-bold uppercase tracking-wider text-center">Số lượng</th>
                              <th className="py-2.5 font-bold uppercase tracking-wider text-right">Doanh thu</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100">
                            {dashboardData.topProducts && dashboardData.topProducts.length > 0 ? (
                              dashboardData.topProducts.map((p: any, idx: number) => (
                                <tr key={p.name} className="hover:bg-stone-50/50 transition">
                                  <td className="py-3 text-center">
                                    <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                                      idx === 0 ? "bg-[#3e2723] text-white" :
                                      idx === 1 ? "bg-stone-300 text-stone-900" :
                                      idx === 2 ? "bg-[#5d4037] text-white" :
                                      "bg-stone-200 text-stone-600"
                                    }`}>
                                      {idx + 1}
                                    </span>
                                  </td>
                                  <td className="py-3 pl-2 font-semibold text-stone-800">{p.name}</td>
                                  <td className="py-3 text-center font-bold text-stone-600">{p.quantity} ly/phần</td>
                                  <td className="py-3 text-right font-black text-[#3e2723]">{formatPrice(p.revenue)}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={4} className="py-8 text-center text-stone-400">Chưa có số liệu bán hàng.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* RECENT CLOSED BILLS */}
                  <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-stone-900 mb-1 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#3e2723] text-lg">schedule</span>
                      <span>5 Giao Dịch Gần Nhất</span>
                    </h3>
                    <p className="text-[10px] text-stone-500 mb-4">Các hóa đơn vừa hoàn tất thanh toán gần đây</p>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-stone-200 text-stone-500">
                            <th className="py-2.5 font-bold uppercase tracking-wider pl-4">Bàn</th>
                            <th className="py-2.5 font-bold uppercase tracking-wider">Thời gian</th>
                            <th className="py-2.5 font-bold uppercase tracking-wider text-center">Phương thức</th>
                            <th className="py-2.5 font-bold uppercase tracking-wider text-right pr-4">Tổng tiền</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {dashboardData.recentOrders && dashboardData.recentOrders.length > 0 ? (
                            dashboardData.recentOrders.map((order: any) => (
                              <tr key={order.id} className="hover:bg-stone-50/50 transition">
                                <td className="py-3 pl-4 font-bold text-stone-850">{order.tableName}</td>
                                <td className="py-3 text-stone-550">
                                  {new Date(order.payTime).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}{" - "}
                                  {new Date(order.payTime).toLocaleDateString("vi-VN")}
                                </td>
                                <td className="py-3 text-center">
                                  <span className={`inline-flex rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase ${
                                    order.paymentMethod === "CASH" ? "bg-amber-50 text-amber-800 border border-amber-200" :
                                    order.paymentMethod === "BANK_TRANSFER" ? "bg-blue-50 text-blue-800 border border-blue-200" :
                                    order.paymentMethod === "E_WALLET" ? "bg-pink-50 text-pink-800 border border-pink-200" :
                                    "bg-emerald-50 text-emerald-800 border border-emerald-250"
                                  }`}>
                                    {order.paymentMethod === "CASH" ? "Tiền mặt" :
                                     order.paymentMethod === "BANK_TRANSFER" ? "Chuyển khoản" :
                                     order.paymentMethod === "E_WALLET" ? "Ví điện tử" : "Thẻ ATM"}
                                  </span>
                                </td>
                                <td className="py-3 text-right font-black text-stone-900 pr-4">{formatPrice(order.totalAmount)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="py-8 text-center text-stone-400">Chưa có giao dịch nào được chốt hôm nay.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: MENU MANAGEMENT */}
          {/* ======================================================== */}
          {activeTab === "menu" && (
            <div className="space-y-6">
              {/* Sub tabs Menu */}
              <div className="flex border-b border-stone-200 pb-px gap-6">
                <button
                  onClick={() => setMenuSubTab("products")}
                  className={`relative pb-3 text-xs font-bold transition duration-200 ${
                    menuSubTab === "products" ? "text-[#3e2723]" : "text-stone-500 hover:text-stone-850"
                  }`}
                >
                  Món ăn / Đồ uống
                  {menuSubTab === "products" && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3e2723] rounded-full"></span>
                  )}
                </button>
                <button
                  onClick={() => setMenuSubTab("categories")}
                  className={`relative pb-3 text-xs font-bold transition duration-200 ${
                    menuSubTab === "categories" ? "text-[#3e2723]" : "text-stone-500 hover:text-stone-850"
                  }`}
                >
                  Danh mục món
                  {menuSubTab === "categories" && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3e2723] rounded-full"></span>
                  )}
                </button>
              </div>

              {/* PRODUCTS SUB-TAB */}
              {menuSubTab === "products" && (
                <div className="space-y-4">
                  {/* Filters & Actions Bar */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200">
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                      {/* Search */}
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                          <span className="material-symbols-outlined text-base">search</span>
                        </span>
                        <input
                          type="text"
                          placeholder="Tìm tên món..."
                          value={prodSearch}
                          onChange={(e) => setProdSearch(e.target.value)}
                          className="rounded-lg border border-stone-200 bg-white py-1.5 pl-8 pr-3 text-xs text-stone-800 placeholder-stone-400 outline-none focus:border-[#3e2723]"
                        />
                      </div>
                      
                      {/* Category filter */}
                      <select
                        value={prodCategoryFilter}
                        onChange={(e) => setProdCategoryFilter(e.target.value)}
                        className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-850 outline-none cursor-pointer focus:border-[#3e2723]"
                      >
                        <option value="all">Tất cả danh mục</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={() => handleOpenProductModal(null)}
                      className="w-full md:w-auto flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#3e2723] to-[#5d4037] px-4 py-2 text-xs font-bold text-white shadow hover:from-[#5d4037] hover:to-[#3e2723] transition duration-200"
                    >
                      <span className="material-symbols-outlined text-base">add</span>
                      Thêm món mới
                    </button>
                  </div>

                  {/* Products Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredProducts.map(prod => (
                      <div
                        key={prod.id}
                        className={`rounded-xl border p-4 flex flex-col justify-between transition-all duration-200 bg-white ${
                          prod.isActive ? "border-stone-200 hover:border-stone-300 hover:shadow-sm" : "border-red-200 bg-red-50/5 opacity-80"
                        }`}
                      >
                        <div>
                          {/* Name and Price */}
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h4 className="text-sm font-bold text-stone-850 leading-tight">{prod.name}</h4>
                              <p className="text-[10px] text-stone-500 mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[10px]">sell</span>
                                {prod.category?.name || "Chưa phân loại"}
                              </p>
                            </div>
                            <span className="text-sm font-extrabold text-[#5d4037] whitespace-nowrap">
                              {formatPrice(prod.price)}
                            </span>
                          </div>

                          {/* Quick toggles */}
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              onClick={() => handleQuickToggleProduct(prod, "isAvailable")}
                              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[9px] font-bold border transition ${
                                prod.isAvailable
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                              }`}
                            >
                              <span className="material-symbols-outlined text-[11px]">
                                {prod.isAvailable ? "check_circle" : "cancel"}
                              </span>
                              <span>{prod.isAvailable ? "Còn hàng" : "Hết hàng"}</span>
                            </button>

                            <button
                              onClick={() => handleQuickToggleProduct(prod, "isActive")}
                              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[9px] font-bold border transition ${
                                prod.isActive
                                  ? "bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200"
                                  : "bg-stone-50 text-stone-400 border-stone-200"
                              }`}
                            >
                              <span className="material-symbols-outlined text-[11px]">
                                {prod.isActive ? "visibility" : "visibility_off"}
                              </span>
                              <span>{prod.isActive ? "Đang bán" : "Ẩn món"}</span>
                            </button>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-4 pt-3 border-t border-stone-100 flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenProductModal(prod)}
                            className="flex h-7 items-center gap-1 rounded px-2.5 text-[10px] font-bold bg-stone-100 text-stone-700 hover:bg-stone-200 transition"
                          >
                            <span className="material-symbols-outlined text-xs">edit</span>
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod)}
                            className="flex h-7 items-center gap-1 rounded px-2.5 text-[10px] font-bold bg-red-50 text-red-650 hover:bg-red-100 transition"
                          >
                            <span className="material-symbols-outlined text-xs">delete</span>
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                    {filteredProducts.length === 0 && (
                      <div className="col-span-full py-16 text-center text-stone-400 bg-[#fdfbf7] rounded-2xl border border-stone-200">
                        <span className="material-symbols-outlined text-4xl mb-2 text-stone-400">coffee</span>
                        <p className="text-xs">Không tìm thấy món ăn/uống nào phù hợp.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CATEGORIES SUB-TAB */}
              {menuSubTab === "categories" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200">
                    <p className="text-xs text-stone-500">Quản lý các nhóm danh mục chính của quán (ví dụ: Cà phê, Trà, Bánh, Sinh tố)</p>
                    <button
                      onClick={() => handleOpenCategoryModal(null)}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#3e2723] to-[#5d4037] px-4 py-2 text-xs font-bold text-white hover:from-[#5d4037] hover:to-[#3e2723] transition"
                    >
                      <span className="material-symbols-outlined text-base">add</span>
                      Tạo danh mục mới
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {categories.map(cat => (
                      <div key={cat.id} className="rounded-xl border border-stone-200 bg-white p-4 flex flex-col justify-between hover:border-stone-300 transition">
                        <div>
                          <h4 className="text-sm font-bold text-stone-850">{cat.name}</h4>
                          <p className="text-xs text-stone-500 mt-1.5 leading-relaxed min-h-[36px] line-clamp-2">
                            {cat.description || "Không có mô tả chi tiết."}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-stone-100 flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenCategoryModal(cat)}
                            className="flex h-7 items-center gap-1 rounded px-2.5 text-[10px] font-bold bg-stone-100 text-stone-700 hover:bg-stone-200 transition"
                          >
                            <span className="material-symbols-outlined text-xs">edit</span>
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            className="flex h-7 items-center gap-1 rounded px-2.5 text-[10px] font-bold bg-red-50 text-red-655 hover:bg-red-100 transition"
                          >
                            <span className="material-symbols-outlined text-xs">delete</span>
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                    {categories.length === 0 && (
                      <div className="col-span-full py-16 text-center text-stone-400 bg-white rounded-xl border border-stone-200">
                        Chưa có danh mục nào. Hãy tạo danh mục đầu tiên.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: TABLES MAP MANAGEMENT */}
          {/* ======================================================== */}
          {activeTab === "tables" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                <p className="text-xs text-stone-600 font-medium">Quản lý danh sách bàn và trạng thái bàn phục vụ khách. Bạn có thể ép giải phóng bàn về trống (EMPTY) khi có lỗi.</p>
                <button
                  onClick={() => handleOpenTableModal(null)}
                  className="w-full md:w-auto flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#d97706] to-[#b45309] px-4 py-2 text-xs font-bold text-white hover:from-[#f59e0b] hover:to-[#d97706] transition"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  Thêm bàn mới
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {tables.map(table => (
                  <div
                    key={table.id}
                    className={`rounded-xl border p-4 flex flex-col justify-between bg-white transition ${
                      table.isActive ? "border-stone-200 hover:border-stone-300 shadow-sm" : "border-stone-200/50 opacity-60 bg-stone-50"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="material-symbols-outlined text-2xl text-stone-400">table_restaurant</span>
                        
                        {/* Status Badge */}
                        <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${
                          table.status === "EMPTY" ? "bg-stone-100 text-stone-600 border border-stone-200" :
                          table.status === "SERVING" ? "bg-[#5d4037] text-white" :
                          "bg-amber-600 text-white animate-pulse"
                        }`}>
                          {table.status === "EMPTY" ? "Trống" :
                           table.status === "SERVING" ? "Có Khách" : "Chờ thu"}
                        </span>
                      </div>
                      
                      <h4 className="text-sm font-extrabold text-[#3e2723] mt-2">{table.name}</h4>
                      
                      {/* Active switch */}
                      <button
                        onClick={() => handleQuickToggleTable(table)}
                        className={`mt-3 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[9px] font-bold border transition ${
                          table.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-stone-100 text-stone-550 border-stone-200"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[10px]">
                          {table.isActive ? "toggle_on" : "toggle_off"}
                        </span>
                        <span>{table.isActive ? "Hoạt động" : "Tạm khóa"}</span>
                      </button>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 space-y-1.5">
                      {table.status !== "EMPTY" && (
                        <button
                          onClick={() => handleResetTableStatus(table)}
                          className="flex w-full items-center justify-center gap-1 rounded bg-amber-50 border border-amber-200 py-1 text-[9px] font-bold text-amber-800 hover:bg-amber-100 transition"
                        >
                          <span className="material-symbols-outlined text-xs">restart_alt</span>
                          Ép về bàn trống
                        </button>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenTableModal(table)}
                          className="flex-1 flex h-7 items-center justify-center gap-1 rounded bg-stone-100 text-stone-700 hover:bg-stone-200 transition text-[9px] font-bold"
                        >
                          <span className="material-symbols-outlined text-xs">edit</span>
                          Sửa tên
                        </button>
                        <button
                          onClick={() => handleDeleteTable(table)}
                          className="flex-1 flex h-7 items-center justify-center gap-1 rounded bg-red-50 text-red-650 hover:bg-red-100 hover:text-red-700 transition text-[9px] font-bold"
                        >
                          <span className="material-symbols-outlined text-xs">delete</span>
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: BILL HISTORY & OPERATIONS */}
          {/* ======================================================== */}
          {activeTab === "history" && (
            <div className="space-y-6">
              {/* Date Filters Bar */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                  {/* Start Date */}
                  <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-stone-500">Từ ngày</label>
                    <input
                      type="date"
                      value={historyStartDate}
                      onChange={(e) => setHistoryStartDate(e.target.value)}
                      className="w-full sm:w-auto rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-850 outline-none focus:border-[#3e2723]"
                    />
                  </div>

                  {/* End Date */}
                  <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-stone-500">Đến ngày</label>
                    <input
                      type="date"
                      value={historyEndDate}
                      onChange={(e) => setHistoryEndDate(e.target.value)}
                      className="w-full sm:w-auto rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-850 outline-none focus:border-[#3e2723]"
                    />
                  </div>

                  {/* Status selection */}
                  <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-stone-500">Trạng thái</label>
                    <select
                      value={historyStatusFilter}
                      onChange={(e) => setHistoryStatusFilter(e.target.value)}
                      className="w-full sm:w-auto rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-850 outline-none cursor-pointer focus:border-[#3e2723]"
                    >
                      <option value="all">Tất cả trạng thái</option>
                      <option value="PAID">Đã thanh toán (PAID)</option>
                      <option value="PENDING">Chưa thanh toán (PENDING)</option>
                      <option value="CANCELLED">Đã hủy (CANCELLED)</option>
                      <option value="REFUNDED">Đã hoàn tiền (REFUNDED)</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={loadHistoryData}
                  className="flex items-center gap-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 px-4 py-2.5 text-xs font-bold text-stone-700 border border-stone-200 transition w-full md:w-auto justify-center"
                >
                  <span className="material-symbols-outlined text-base">filter_list</span>
                  Lọc kết quả
                </button>
              </div>

              {/* Main History Table */}
              <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500 bg-stone-50">
                        <th className="py-3 px-6 font-bold uppercase tracking-wider">Hóa đơn</th>
                        <th className="py-3 px-6 font-bold uppercase tracking-wider">Bàn</th>
                        <th className="py-3 px-6 font-bold uppercase tracking-wider">Thời gian tạo</th>
                        <th className="py-3 px-6 font-bold uppercase tracking-wider text-center">Trạng thái</th>
                        <th className="py-3 px-6 font-bold uppercase tracking-wider text-right">Tổng tiền</th>
                        <th className="py-3 px-6 font-bold uppercase tracking-wider text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {historyOrders.length > 0 ? (
                        historyOrders.map(order => (
                          <tr key={order.id} className="hover:bg-stone-50/50 transition">
                            <td className="py-4 px-6 font-mono text-[10px] text-stone-500">
                              #{order.id.substring(0, 8).toUpperCase()}
                            </td>
                            <td className="py-4 px-6 font-bold text-[#3e2723]">{order.table?.name || "Bàn cũ"}</td>
                            <td className="py-4 px-6 text-stone-600">
                              {new Date(order.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}{" - "}
                              {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase border ${
                                order.status === "PAID" ? "bg-emerald-50 text-emerald-700 border-emerald-250" :
                                order.status === "PENDING" ? "bg-amber-50 text-amber-700 border-amber-250" :
                                order.status === "CANCELLED" ? "bg-red-50 text-red-650 border-red-250" :
                                "bg-stone-100 text-stone-600 border-stone-200"
                              }`}>
                                {order.status === "PAID" ? "Đã thanh toán" :
                                 order.status === "PENDING" ? "Chưa thanh toán" :
                                 order.status === "CANCELLED" ? "Đã hủy" : "Hoàn tiền"}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right font-extrabold text-stone-900">{formatPrice(order.totalAmount)}</td>
                            <td className="py-4 px-6 text-center">
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="inline-flex items-center gap-1 rounded bg-stone-100 border border-stone-200 px-3 py-1.5 text-[10px] font-bold text-stone-700 hover:bg-stone-200 hover:text-stone-900 transition"
                              >
                                <span className="material-symbols-outlined text-xs">info</span>
                                Chi tiết
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-16 text-center text-stone-500">
                            Không tìm thấy hóa đơn nào trong khoảng thời gian này.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: BRANCHES MANAGEMENT */}
          {/* ======================================================== */}
          {activeTab === "branches" && (
            <div className="space-y-6">
              {/* Header Bar */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 font-headline">Quản lý các Chi nhánh / Quán</h3>
                  <p className="text-[10px] text-stone-500 mt-1">Quản lý danh sách, thông tin địa chỉ và số điện thoại liên lạc của từng chi nhánh trong chuỗi cửa hàng.</p>
                </div>
                
                <button
                  onClick={() => handleOpenBranchModal(null)}
                  className="w-full md:w-auto flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#3e2723] to-[#5d4037] px-4 py-2.5 text-xs font-bold text-white shadow hover:from-[#5d4037] hover:to-[#3e2723] transition duration-200 active:scale-95"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  Thêm chi nhánh mới
                </button>
              </div>

              {/* Branches Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {branches.map(branch => (
                  <div
                    key={branch.id}
                    className={`rounded-xl border p-5 flex flex-col justify-between transition-all duration-200 bg-white ${
                      branch.isActive ? "border-stone-200 hover:border-stone-300 hover:shadow-sm" : "border-red-200 bg-red-50/5 opacity-85"
                    }`}
                  >
                    <div>
                      {/* Name and status */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            branch.isActive ? "bg-[#3e2723]/10 text-[#3e2723]" : "bg-stone-100 text-stone-400"
                          }`}>
                            <span className="material-symbols-outlined text-lg">storefront</span>
                          </div>
                          <span className="text-xs font-bold text-stone-900 truncate max-w-[150px]">{branch.name}</span>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${
                          branch.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-250" : "bg-red-50 text-red-655 border border-red-200"
                        }`}>
                          {branch.isActive ? "Hoạt động" : "Tạm ẩn"}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="mt-4 space-y-2 text-xs text-stone-600">
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-stone-400 text-base">location_on</span>
                          <span className="leading-tight">{branch.address || <em className="text-stone-400">Chưa cập nhật địa chỉ</em>}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-stone-400 text-base">call</span>
                          <span>{branch.phone || <em className="text-stone-400">Chưa cập nhật SĐT</em>}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex items-center justify-between border-t border-stone-100 pt-4">
                      {/* Switch to toggle active status */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`toggle-branch-${branch.id}`}
                          checked={branch.isActive}
                          onChange={() => handleQuickToggleBranch(branch)}
                          className="h-3.5 w-3.5 cursor-pointer accent-[#3e2723] rounded"
                        />
                        <label htmlFor={`toggle-branch-${branch.id}`} className="text-[10px] font-bold text-stone-500 cursor-pointer">
                          Kích hoạt
                        </label>
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenBranchModal(branch)}
                          className="inline-flex items-center justify-center p-2 rounded-lg bg-stone-100 border border-stone-200 hover:bg-[#3e2723]/5 hover:text-[#3e2723] hover:border-[#3e2723]/30 transition"
                          title="Sửa thông tin"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteBranch(branch)}
                          className="inline-flex items-center justify-center p-2 rounded-lg bg-stone-100 border border-stone-200 text-stone-450 hover:bg-red-50 hover:text-red-650 hover:border-red-200 transition"
                          title="Xóa chi nhánh"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 6: STAFF MANAGEMENT */}
          {/* ======================================================== */}
          {activeTab === "staff" && (
            <div className="space-y-6">
              {/* Header Bar */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 font-headline">Quản lý tài khoản Nhân viên</h3>
                  <p className="text-[10px] text-stone-500 mt-1">Cấp tài khoản bán hàng, thiết lập quyền hạn và chỉ định chi nhánh làm việc cố định cho nhân viên.</p>
                </div>
                
                <button
                  onClick={() => handleOpenStaffModal(null)}
                  className="w-full md:w-auto flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#3e2723] to-[#5d4037] px-4 py-2.5 text-xs font-bold text-white shadow hover:from-[#5d4037] hover:to-[#3e2723] transition duration-200 active:scale-95"
                >
                  <span className="material-symbols-outlined text-base">person_add</span>
                  Thêm nhân viên mới
                </button>
              </div>

              {/* Staff Table */}
              <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500 bg-stone-50">
                        <th className="py-3 px-6 font-bold uppercase tracking-wider">Họ và tên</th>
                        <th className="py-3 px-6 font-bold uppercase tracking-wider">Email đăng nhập</th>
                        <th className="py-3 px-6 font-bold uppercase tracking-wider">Vai trò</th>
                        <th className="py-3 px-6 font-bold uppercase tracking-wider">Chi nhánh chỉ định</th>
                        <th className="py-3 px-6 font-bold uppercase tracking-wider">Ngày tạo</th>
                        <th className="py-3 px-6 font-bold uppercase tracking-wider text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {staffs.length > 0 ? (
                        staffs.map(staff => (
                          <tr key={staff.id} className="hover:bg-stone-50/50 transition">
                            <td className="py-4 px-6 font-bold text-stone-850">{staff.fullName}</td>
                            <td className="py-4 px-6 text-stone-600">{staff.username}</td>
                            <td className="py-4 px-6">
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase border ${
                                staff.role === "ADMIN" ? "bg-amber-50 text-amber-700 border-amber-250" : "bg-blue-50 text-blue-700 border-blue-250"
                              }`}>
                                {staff.role === "ADMIN" ? "Quản trị viên" : "Nhân viên"}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              {staff.branchName ? (
                                <span className="inline-flex items-center gap-1 text-[#3e2723] font-semibold">
                                  <span className="material-symbols-outlined text-sm">storefront</span>
                                  {staff.branchName}
                                </span>
                              ) : (
                                <span className="text-stone-400 italic">Tất cả chi nhánh (ADMIN) hoặc Chưa gán</span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-stone-500">
                              {new Date(staff.createdAt).toLocaleDateString("vi-VN")}
                            </td>
                            <td className="py-4 px-6 text-center space-x-2">
                              <button
                                onClick={() => handleOpenStaffModal(staff)}
                                className="inline-flex items-center gap-1 rounded bg-stone-100 border border-stone-200 px-2.5 py-1.5 text-[10px] font-bold text-stone-750 hover:bg-stone-200 transition"
                              >
                                <span className="material-symbols-outlined text-xs">edit</span>
                                Sửa
                              </button>
                              {staff.id !== currentUser?.id && (
                                <button
                                  onClick={() => handleDeleteStaff(staff)}
                                  className="inline-flex items-center gap-1 rounded bg-red-50 border border-red-200 px-2.5 py-1.5 text-[10px] font-bold text-red-650 hover:bg-red-100 transition"
                                >
                                  <span className="material-symbols-outlined text-xs">delete</span>
                                  Gỡ quyền
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-16 text-center text-stone-500">
                            {actionLoading ? "Đang tải dữ liệu nhân viên..." : "Không tìm thấy nhân viên nào."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation for Mobile Admin */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-stone-200 flex items-center justify-around px-2 z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          {[
            { id: "dashboard", label: "Báo cáo", icon: "dashboard" },
            { id: "menu", label: "Thực đơn", icon: "restaurant_menu" },
            { id: "tables", label: "Sơ đồ bàn", icon: "table_restaurant" },
            { id: "history", label: "Hóa đơn", icon: "receipt_long" },
            { id: "branches", label: "Chi nhánh", icon: "store" },
            { id: "staff", label: "Nhân viên", icon: "badge" }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
                activeTab === item.id ? "text-[#3e2723]" : "text-stone-400"
              }`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span className="text-[10px] font-bold mt-0.5">{item.label}</span>
            </button>
          ))}
        </div>
      </main>

      {/* ======================================================== */}
      {/* MODAL 1: ADD / EDIT CATEGORY */}
      {/* ======================================================== */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
              <h3 className="text-sm font-bold text-[#3e2723]">
                {editingCategory ? `Cập nhật danh mục: ${editingCategory.name}` : "Tạo danh mục mới"}
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-stone-400 hover:text-stone-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">Tên danh mục <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cà phê pha máy, Trà sữa..."
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-xs text-stone-850 placeholder-stone-400 outline-none focus:border-[#3e2723] focus:ring-1 focus:ring-[#3e2723]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">Mô tả chi tiết</label>
                <textarea
                  placeholder="Nhập mô tả cho nhóm thực đơn này..."
                  value={categoryDesc}
                  onChange={(e) => setCategoryDesc(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-850 placeholder-stone-400 outline-none focus:border-[#3e2723] focus:ring-1 focus:ring-[#3e2723] min-h-[80px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="rounded-lg border border-stone-200 bg-stone-100 px-4 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-200 hover:text-stone-850 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#d97706] to-[#b45309] px-5 py-2.5 text-xs font-bold text-white shadow hover:from-[#f59e0b] hover:to-[#d97706] disabled:opacity-50"
                >
                  {actionLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: ADD / EDIT PRODUCT */}
      {/* ======================================================== */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
              <h3 className="text-sm font-bold text-[#3e2723]">
                {editingProduct ? `Cập nhật món: ${editingProduct.name}` : "Thêm món mới vào menu"}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="text-stone-400 hover:text-stone-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">Tên món <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cà phê sữa đá, Bánh Croissant..."
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-xs text-stone-850 placeholder-stone-400 outline-none focus:border-[#3e2723] focus:ring-1 focus:ring-[#3e2723]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">Giá bán (VND) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    placeholder="Ví dụ: 29000"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-xs text-stone-850 placeholder-stone-400 outline-none focus:border-[#3e2723] focus:ring-1 focus:ring-[#3e2723]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">Danh mục món <span className="text-red-500">*</span></label>
                  <select
                    value={productCategoryId}
                    onChange={(e) => setProductCategoryId(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-xs text-stone-800 outline-none cursor-pointer focus:border-[#3e2723] focus:ring-1 focus:ring-[#3e2723]"
                    required
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="prodActive"
                    checked={productIsActive}
                    onChange={(e) => setProductIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-stone-300 bg-white accent-[#3e2723]"
                  />
                  <label htmlFor="prodActive" className="text-xs font-semibold text-stone-700 cursor-pointer">Cho phép bán (Hiển thị)</label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="prodAvailable"
                    checked={productIsAvailable}
                    onChange={(e) => setProductIsAvailable(e.target.checked)}
                    className="h-4 w-4 rounded border-stone-300 bg-white accent-[#3e2723]"
                  />
                  <label htmlFor="prodAvailable" className="text-xs font-semibold text-stone-700 cursor-pointer">Còn hàng (Còn nguyên liệu)</label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="rounded-lg border border-stone-200 bg-stone-100 px-4 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-200 hover:text-stone-850 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#d97706] to-[#b45309] px-5 py-2.5 text-xs font-bold text-white shadow hover:from-[#f59e0b] hover:to-[#d97706] disabled:opacity-50"
                >
                  {actionLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: ADD / EDIT TABLE */}
      {/* ======================================================== */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
              <h3 className="text-sm font-bold text-[#3e2723]">
                {editingTable ? `Cập nhật bàn: ${editingTable.name}` : "Tạo bàn phục vụ mới"}
              </h3>
              <button onClick={() => setShowTableModal(false)} className="text-stone-400 hover:text-stone-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveTable} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-550 mb-1.5">Tên bàn <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bàn 01, Bàn Ngoài Trời A..."
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-xs text-stone-850 placeholder-stone-400 outline-none focus:border-[#3e2723] focus:ring-1 focus:ring-[#3e2723]"
                  required
                />
              </div>

              {editingTable && (
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="tableActive"
                    checked={tableIsActive}
                    onChange={(e) => setTableIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-stone-300 bg-white accent-[#3e2723]"
                  />
                  <label htmlFor="tableActive" className="text-xs font-semibold text-stone-700 cursor-pointer">Bàn đang hoạt động (Hiển thị ở POS)</label>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowTableModal(false)}
                  className="rounded-lg border border-stone-200 bg-stone-100 px-4 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-200 hover:text-stone-850 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#d97706] to-[#b45309] px-5 py-2.5 text-xs font-bold text-white shadow hover:from-[#f59e0b] hover:to-[#d97706] disabled:opacity-50"
                >
                  {actionLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: ORDER DETAILS & CANCEL/REFUND */}
      {/* ======================================================== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600">receipt_long</span>
                <h3 className="text-sm font-bold text-[#3e2723]">Chi Tiết Hóa Đơn: Bàn {selectedOrder.table?.name || "Cũ"}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-stone-400 hover:text-stone-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-4 text-xs bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                <div className="space-y-1">
                  <p className="text-stone-500 font-semibold">Mã hóa đơn:</p>
                  <p className="font-mono text-[10px] text-stone-800">{selectedOrder.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-stone-550 font-semibold">Thời gian tạo:</p>
                  <p className="text-stone-850">{new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-stone-550 font-semibold">Trạng thái:</p>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase border ${
                    selectedOrder.status === "PAID" ? "bg-emerald-50 text-emerald-700 border-emerald-250" :
                    selectedOrder.status === "PENDING" ? "bg-amber-50 text-amber-700 border-amber-250" :
                    selectedOrder.status === "CANCELLED" ? "bg-red-50 text-red-650 border-red-250" :
                    "bg-stone-100 text-stone-600 border-stone-200"
                  }`}>
                    {selectedOrder.status === "PAID" ? "Đã thanh toán" :
                     selectedOrder.status === "PENDING" ? "Chưa thanh toán" :
                     selectedOrder.status === "CANCELLED" ? "Đã hủy" : "Hoàn tiền"}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-stone-500 font-semibold">Thanh toán:</p>
                  <p className="text-stone-800 font-bold uppercase">
                    {selectedOrder.payments && selectedOrder.payments.length > 0
                      ? selectedOrder.payments[0].paymentMethod === "CASH" ? "Tiền mặt"
                        : selectedOrder.payments[0].paymentMethod === "BANK_TRANSFER" ? "Chuyển khoản"
                        : selectedOrder.payments[0].paymentMethod === "E_WALLET" ? "Ví điện tử" : "Thẻ ngân hàng"
                      : "Chưa trả"}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-2">Danh sách món ăn/uống</h4>
                <div className="border border-stone-200 rounded-xl bg-stone-50 overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-600 bg-stone-100">
                        <th className="py-2 px-3 font-bold">Món</th>
                        <th className="py-2 px-3 text-center font-bold">SL</th>
                        <th className="py-2 px-3 text-right font-bold">Đơn giá</th>
                        <th className="py-2 px-3 text-right font-bold">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {selectedOrder.items && selectedOrder.items.map(item => (
                        <tr key={item.id}>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-stone-800">{item.productName}</span>
                            {item.notes && <p className="text-[9px] text-[#b45309] font-semibold mt-0.5">*{item.notes}</p>}
                          </td>
                          <td className="py-2.5 px-3 text-center text-stone-800 font-semibold">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-right text-stone-600">{formatPrice(Number(item.unitPrice))}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-stone-800">
                            {formatPrice(Number(item.unitPrice) * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-center bg-stone-100 p-4 rounded-xl border border-stone-200 text-sm">
                <span className="font-bold text-stone-600">Tổng thanh toán:</span>
                <span className="text-base font-black text-[#d97706]">{formatPrice(Number(selectedOrder.totalAmount))}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 mt-4 border-t border-stone-200">
              <div className="flex gap-2">
                {selectedOrder.status === "PENDING" && (
                  <button
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, "CANCELLED")}
                    disabled={actionLoading}
                    className="flex items-center gap-1 rounded-lg bg-red-50 text-red-700 border border-red-200 px-4 py-2.5 text-xs font-bold hover:bg-red-100 transition"
                  >
                    <span className="material-symbols-outlined text-base">cancel</span>
                    Hủy hóa đơn này
                  </button>
                )}

                {selectedOrder.status === "PAID" && (
                  <button
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, "REFUNDED")}
                    disabled={actionLoading}
                    className="flex items-center gap-1 rounded-lg bg-stone-100 text-stone-700 border border-stone-300 px-4 py-2.5 text-xs font-bold hover:bg-stone-250 transition"
                  >
                    <span className="material-symbols-outlined text-base">assignment_return</span>
                    Hoàn tiền (Trả hàng)
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg border border-stone-200 bg-stone-100 px-5 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-200 hover:text-stone-850 transition"
              >
                Đóng chi tiết
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: ADD / EDIT BRANCH */}
      {/* ======================================================== */}
      {showBranchCrudModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
              <h3 className="text-sm font-bold text-[#3e2723]">
                {editingBranch ? `Cập nhật chi nhánh: ${editingBranch.name}` : "Tạo chi nhánh mới"}
              </h3>
              <button onClick={() => setShowBranchCrudModal(false)} className="text-stone-400 hover:text-stone-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveBranch} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">Tên chi nhánh <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Ví dụ: Hậu Lê Cafe - Quận 1..."
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-xs text-stone-850 placeholder-stone-400 outline-none focus:border-[#3e2723] focus:ring-1 focus:ring-[#3e2723]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">Địa chỉ</label>
                <input
                  type="text"
                  placeholder="Ví dụ: 123 Đường Nguyễn Huệ, Quận 1..."
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-xs text-stone-850 placeholder-stone-400 outline-none focus:border-[#3e2723] focus:ring-1 focus:ring-[#3e2723]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">Số điện thoại liên hệ</label>
                <input
                  type="text"
                  placeholder="Ví dụ: 0901234567..."
                  value={branchPhone}
                  onChange={(e) => setBranchPhone(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-xs text-stone-850 placeholder-stone-400 outline-none focus:border-[#3e2723] focus:ring-1 focus:ring-[#3e2723]"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="branchActive"
                  checked={branchIsActive}
                  onChange={(e) => setBranchIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 bg-white accent-[#3e2723]"
                />
                <label htmlFor="branchActive" className="text-xs font-semibold text-stone-700 cursor-pointer">Chi nhánh đang hoạt động</label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowBranchCrudModal(false)}
                  className="rounded-lg border border-stone-200 bg-stone-100 px-4 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-200 hover:text-stone-850 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#d97706] to-[#b45309] px-5 py-2.5 text-xs font-bold text-white shadow hover:from-[#f59e0b] hover:to-[#d97706] disabled:opacity-50"
                >
                  {actionLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 6: ADD / EDIT STAFF */}
      {/* ======================================================== */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
              <h3 className="text-sm font-bold text-[#3e2723]">
                {editingStaff ? `Cập nhật nhân viên: ${editingStaff.fullName}` : "Thêm nhân viên mới"}
              </h3>
              <button onClick={() => setShowStaffModal(false)} className="text-stone-400 hover:text-stone-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">Email đăng nhập (Username) <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  placeholder="Ví dụ: staff1@domain.com"
                  value={staffUsername}
                  onChange={(e) => setStaffUsername(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-xs text-stone-850 placeholder-stone-400 outline-none focus:border-[#3e2723] focus:ring-1 focus:ring-[#3e2723] disabled:opacity-50"
                  required
                  disabled={!!editingStaff}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">Họ và tên nhân viên <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn A..."
                  value={staffFullName}
                  onChange={(e) => setStaffFullName(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-xs text-stone-850 placeholder-stone-400 outline-none focus:border-[#3e2723] focus:ring-1 focus:ring-[#3e2723]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">Mật khẩu {editingStaff && <span className="text-stone-400 font-normal">(Để trống nếu không muốn đổi)</span>} {!editingStaff && <span className="text-red-500">*</span>}</label>
                <input
                  type="password"
                  placeholder={editingStaff ? "Nhập mật khẩu mới..." : "Nhập mật khẩu..."}
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-xs text-stone-850 placeholder-stone-400 outline-none focus:border-[#3e2723] focus:ring-1 focus:ring-[#3e2723]"
                  required={!editingStaff}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">Vai trò <span className="text-red-500">*</span></label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value as "ADMIN" | "STAFF")}
                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-xs text-stone-850 outline-none cursor-pointer focus:border-[#3e2723] focus:ring-1 focus:ring-[#3e2723]"
                    required
                  >
                    <option value="STAFF">Nhân viên (STAFF)</option>
                    <option value="ADMIN">Quản trị viên (ADMIN)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">Chi nhánh làm việc</label>
                  <select
                    value={staffBranchId}
                    onChange={(e) => setStaffBranchId(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-xs text-stone-850 outline-none cursor-pointer focus:border-[#3e2723] focus:ring-1 focus:ring-[#3e2723]"
                  >
                    <option value="">-- Tất cả chi nhánh / Chưa gán --</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="rounded-lg border border-stone-200 bg-stone-100 px-4 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-200 hover:text-stone-850 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#d97706] to-[#b45309] px-5 py-2.5 text-xs font-bold text-white shadow hover:from-[#f59e0b] hover:to-[#d97706] disabled:opacity-50"
                >
                  {actionLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
