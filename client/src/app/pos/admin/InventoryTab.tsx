"use client";

import React, { useState, useEffect } from "react";
import { posApi, formatPrice } from "../../../lib/pos-api";
import type { CafeProduct, CafeCategory, Ingredient, Supplier, BranchStockItem, InventoryTransaction, InventoryAudit } from "../../../lib/pos-api";

interface InventoryTabProps {
  selectedBranchId: string;
  currentUser: any;
  products: CafeProduct[];
  categories: CafeCategory[];
  loadMenuData: () => Promise<void>;
  showToast: (type: "success" | "error" | "warning", message: string) => void;
  refreshTrigger?: number;
}

export default function InventoryTab({
  selectedBranchId,
  currentUser,
  products,
  categories,
  loadMenuData,
  showToast,
  refreshTrigger = 0
}: InventoryTabProps) {
  // Sub-tabs: stock (tồn kho), recipe (định lượng), transactions (nhập/xuất), audits (kiểm kê), ingredients (nguyên liệu), suppliers (nhà cung cấp)
  const [subTab, setSubTab] = useState<"stock" | "recipe" | "transactions" | "audits" | "ingredients" | "suppliers">("stock");

  // Core Data States
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [branchStocks, setBranchStocks] = useState<BranchStockItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [audits, setAudits] = useState<InventoryAudit[]>([]);

  // Loading States
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters / Search
  const [stockSearch, setStockSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "low_stock">("all");

  // Recipe sub-states
  const [selectedRecipeProductId, setSelectedRecipeProductId] = useState<string>("");
  const [recipeItems, setRecipeItems] = useState<Array<{ ingredientId: string; quantity: number }>>([]);

  // Ingredient Modal States
  const [showIngredientModal, setShowIngredientModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [ingName, setIngName] = useState("");
  const [ingUnit, setIngUnit] = useState("");
  const [ingCostPrice, setIngCostPrice] = useState("");

  // Supplier Modal States
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supName, setSupName] = useState("");
  const [supPhone, setSupPhone] = useState("");
  const [supAddress, setSupAddress] = useState("");

  // Import Slip Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importSupplierId, setImportSupplierId] = useState("");
  const [importNotes, setImportNotes] = useState("");
  const [importItems, setImportItems] = useState<Array<{ ingredientId?: string; productId?: string; quantity: number; unitPrice: number }>>([]);

  // Export Slip Modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportNotes, setExportNotes] = useState("");
  const [exportItems, setExportItems] = useState<Array<{ ingredientId?: string; productId?: string; quantity: number }>>([]);

  // Audit Modal & Count States
  const [showAuditCountModal, setShowAuditCountModal] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<InventoryAudit | null>(null);
  const [auditCounts, setAuditCounts] = useState<{ [key: string]: number }>({});
  const [auditNotes, setAuditNotes] = useState("");

  // Min Stock Config Modal
  const [showMinStockModal, setShowMinStockModal] = useState(false);
  const [minStockItem, setMinStockItem] = useState<BranchStockItem | null>(null);
  const [minStockValue, setMinStockValue] = useState("");

  // Main Data Loader
  const loadData = async () => {
    if (!selectedBranchId) return;
    setLoading(true);
    try {
      if (subTab === "stock") {
        const stocks = await posApi.getBranchStock({
          search: stockSearch || undefined,
          lowStockOnly: stockFilter === "low_stock"
        });
        setBranchStocks(stocks);
      } else if (subTab === "ingredients") {
        const ings = await posApi.getIngredients();
        setIngredients(ings);
      } else if (subTab === "recipe") {
        if (products.length === 0) {
          await loadMenuData();
        }
        const ings = await posApi.getIngredients();
        setIngredients(ings);

        if (selectedRecipeProductId) {
          const rec = await posApi.getRecipe(selectedRecipeProductId);
          setRecipeItems(rec.map(r => ({ ingredientId: r.ingredientId, quantity: r.quantity })));
        } else if (products.length > 0) {
          setSelectedRecipeProductId(products[0].id);
        }
      } else if (subTab === "transactions") {
        const [txs, sups] = await Promise.all([
          posApi.getTransactions(),
          posApi.getSuppliers()
        ]);
        setTransactions(txs);
        setSuppliers(sups);
      } else if (subTab === "audits") {
        const auds = await posApi.getAudits();
        setAudits(auds);
      } else if (subTab === "suppliers") {
        const sups = await posApi.getSuppliers();
        setSuppliers(sups);
      }
    } catch (err: any) {
      console.error("Load inventory data error:", err);
      showToast("error", err.message || "Không thể tải dữ liệu kho.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [subTab, selectedBranchId, stockSearch, stockFilter, selectedRecipeProductId, refreshTrigger]);

  // --- INGREDIENTS CRUD ---
  const handleOpenIngredientModal = (ing: Ingredient | null = null) => {
    if (ing) {
      setEditingIngredient(ing);
      setIngName(ing.name);
      setIngUnit(ing.unit);
      setIngCostPrice(String(ing.costPrice));
    } else {
      setEditingIngredient(null);
      setIngName("");
      setIngUnit("");
      setIngCostPrice("");
    }
    setShowIngredientModal(true);
  };

  const handleSaveIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingName.trim() || !ingUnit.trim()) {
      showToast("warning", "Vui lòng nhập tên và đơn vị tính.");
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        name: ingName.trim(),
        unit: ingUnit.trim(),
        costPrice: Number(ingCostPrice || 0)
      };

      if (editingIngredient) {
        await posApi.updateIngredient(editingIngredient.id, payload);
        showToast("success", `Cập nhật nguyên liệu "${ingName}" thành công!`);
      } else {
        await posApi.createIngredient(payload);
        showToast("success", `Thêm nguyên liệu "${ingName}" thành công!`);
      }
      setShowIngredientModal(false);
      loadData();
    } catch (err: any) {
      showToast("error", err.message || "Lỗi khi lưu nguyên liệu.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteIngredient = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa nguyên liệu "${name}"?`)) return;
    setActionLoading(true);
    try {
      await posApi.deleteIngredient(id);
      showToast("success", `Xóa nguyên liệu "${name}" thành công.`);
      loadData();
    } catch (err: any) {
      showToast("error", err.message || "Lỗi khi xóa nguyên liệu. Có thể nguyên liệu đang được sử dụng.");
    } finally {
      setActionLoading(false);
    }
  };

  // --- SUPPLIERS CRUD ---
  const handleOpenSupplierModal = (sup: Supplier | null = null) => {
    if (sup) {
      setEditingSupplier(sup);
      setSupName(sup.name);
      setSupPhone(sup.phone || "");
      setSupAddress(sup.address || "");
    } else {
      setEditingSupplier(null);
      setSupName("");
      setSupPhone("");
      setSupAddress("");
    }
    setShowSupplierModal(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) {
      showToast("warning", "Vui lòng nhập tên nhà cung cấp.");
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        name: supName.trim(),
        phone: supPhone.trim() || null,
        address: supAddress.trim() || null
      };

      if (editingSupplier) {
        await posApi.updateSupplier(editingSupplier.id, payload);
        showToast("success", `Cập nhật nhà cung cấp thành công!`);
      } else {
        await posApi.createSupplier(payload);
        showToast("success", `Thêm nhà cung cấp thành công!`);
      }
      setShowSupplierModal(false);
      loadData();
    } catch (err: any) {
      showToast("error", err.message || "Lỗi khi lưu nhà cung cấp.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSupplier = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa nhà cung cấp "${name}"?`)) return;
    setActionLoading(true);
    try {
      await posApi.deleteSupplier(id);
      showToast("success", `Xóa nhà cung cấp thành công.`);
      loadData();
    } catch (err: any) {
      showToast("error", err.message || "Lỗi khi xóa nhà cung cấp.");
    } finally {
      setActionLoading(false);
    }
  };

  // --- RECIPE MANAGEMENT ---
  const handleAddRecipeItem = () => {
    if (ingredients.length === 0) return;
    // Find an ingredient not in recipeItems yet, or fallback to first
    const unusedIng = ingredients.find(ing => !recipeItems.some(item => item.ingredientId === ing.id));
    const targetId = unusedIng ? unusedIng.id : ingredients[0].id;
    setRecipeItems([...recipeItems, { ingredientId: targetId, quantity: 1 }]);
  };

  const handleRemoveRecipeItem = (index: number) => {
    setRecipeItems(recipeItems.filter((_, i) => i !== index));
  };

  const handleRecipeItemChange = (index: number, field: "ingredientId" | "quantity", value: string | number) => {
    const updated = [...recipeItems];
    if (field === "ingredientId") {
      updated[index].ingredientId = String(value);
    } else {
      updated[index].quantity = Number(value);
    }
    setRecipeItems(updated);
  };

  const handleSaveRecipe = async () => {
    if (!selectedRecipeProductId) return;
    setActionLoading(true);
    try {
      // Validate duplicates
      const uniqueIds = new Set(recipeItems.map(i => i.ingredientId));
      if (uniqueIds.size < recipeItems.length) {
        showToast("warning", "Một nguyên liệu không thể khai báo lặp lại nhiều lần.");
        setActionLoading(false);
        return;
      }

      await posApi.updateRecipe(selectedRecipeProductId, { items: recipeItems });
      showToast("success", "Lưu công thức định lượng thành công!");
    } catch (err: any) {
      showToast("error", err.message || "Không thể lưu định lượng.");
    } finally {
      setActionLoading(false);
    }
  };

  // --- MIN STOCK UPDATES ---
  const handleOpenMinStockModal = (stock: BranchStockItem) => {
    setMinStockItem(stock);
    setMinStockValue(String(stock.minStock));
    setShowMinStockModal(true);
  };

  const handleSaveMinStock = async () => {
    if (!minStockItem) return;
    setActionLoading(true);
    try {
      await posApi.updateMinStock({
        itemId: minStockItem.itemId,
        type: minStockItem.type,
        minStock: Number(minStockValue || 0)
      });
      showToast("success", "Đã cập nhật định mức tồn tối thiểu.");
      setShowMinStockModal(false);
      loadData();
    } catch (err: any) {
      showToast("error", err.message || "Lỗi khi cập nhật.");
    } finally {
      setActionLoading(false);
    }
  };

  // --- IMPORT TRANSACTION ---
  const handleOpenImportModal = async () => {
    const sups = await posApi.getSuppliers();
    setSuppliers(sups);
    const ings = await posApi.getIngredients();
    setIngredients(ings);

    setImportSupplierId(sups[0]?.id || "");
    setImportNotes("");
    setImportItems([{ ingredientId: ings[0]?.id || "", quantity: 1, unitPrice: Number(ings[0]?.costPrice || 0) }]);
    setShowImportModal(true);
  };

  const handleAddImportItem = (type: "ingredient" | "product") => {
    if (type === "ingredient") {
      if (ingredients.length === 0) return;
      setImportItems([...importItems, { ingredientId: ingredients[0].id, quantity: 1, unitPrice: Number(ingredients[0].costPrice || 0) }]);
    } else {
      if (products.length === 0) return;
      setImportItems([...importItems, { productId: products[0].id, quantity: 1, unitPrice: Number(products[0].price || 0) * 0.7 }]);
    }
  };

  const handleRemoveImportItem = (index: number) => {
    setImportItems(importItems.filter((_, i) => i !== index));
  };

  const handleImportItemChange = (index: number, field: string, value: string | number) => {
    const updated = [...importItems];
    const item = updated[index];

    if (field === "itemId") {
      const val = String(value);
      if (item.ingredientId !== undefined) {
        item.ingredientId = val;
        // Sync default unit price
        const ing = ingredients.find(i => i.id === val);
        if (ing) item.unitPrice = Number(ing.costPrice);
      } else {
        item.productId = val;
        const prod = products.find(p => p.id === val);
        if (prod) item.unitPrice = Number(prod.price) * 0.7;
      }
    } else if (field === "quantity") {
      item.quantity = Number(value);
    } else if (field === "unitPrice") {
      item.unitPrice = Number(value);
    }
    setImportItems(updated);
  };

  const handleSaveImport = async () => {
    if (importItems.length === 0) {
      showToast("warning", "Phiếu nhập hàng phải có ít nhất 1 mặt hàng.");
      return;
    }

    setActionLoading(true);
    try {
      await posApi.createImport({
        supplierId: importSupplierId || undefined,
        notes: importNotes.trim() || undefined,
        items: importItems
      });
      showToast("success", "Lập phiếu nhập kho thành công!");
      setShowImportModal(false);
      loadData();
    } catch (err: any) {
      showToast("error", err.message || "Lỗi khi lập phiếu nhập.");
    } finally {
      setActionLoading(false);
    }
  };

  // --- EXPORT TRANSACTION ---
  const handleOpenExportModal = async () => {
    const ings = await posApi.getIngredients();
    setIngredients(ings);

    setExportNotes("");
    setExportItems([{ ingredientId: ings[0]?.id || "", quantity: 1 }]);
    setShowExportModal(true);
  };

  const handleAddExportItem = (type: "ingredient" | "product") => {
    if (type === "ingredient") {
      if (ingredients.length === 0) return;
      setExportItems([...exportItems, { ingredientId: ingredients[0].id, quantity: 1 }]);
    } else {
      if (products.length === 0) return;
      setExportItems([...exportItems, { productId: products[0].id, quantity: 1 }]);
    }
  };

  const handleRemoveExportItem = (index: number) => {
    setExportItems(exportItems.filter((_, i) => i !== index));
  };

  const handleExportItemChange = (index: number, field: string, value: string | number) => {
    const updated = [...exportItems];
    const item = updated[index];

    if (field === "itemId") {
      const val = String(value);
      if (item.ingredientId !== undefined) {
        item.ingredientId = val;
      } else {
        item.productId = val;
      }
    } else if (field === "quantity") {
      item.quantity = Number(value);
    }
    setExportItems(updated);
  };

  const handleSaveExport = async () => {
    if (exportItems.length === 0) {
      showToast("warning", "Phiếu xuất kho phải có ít nhất 1 mặt hàng.");
      return;
    }

    setActionLoading(true);
    try {
      await posApi.createExport({
        notes: exportNotes.trim() || undefined,
        items: exportItems
      });
      showToast("success", "Lập phiếu xuất kho thành công!");
      setShowExportModal(false);
      loadData();
    } catch (err: any) {
      showToast("error", err.message || "Lỗi khi lập phiếu xuất.");
    } finally {
      setActionLoading(false);
    }
  };

  // --- AUDITS & PHYSICAL INVENTORY ---
  const handleCreateAudit = async () => {
    if (!confirm("Hệ thống sẽ chụp lại số lượng tồn kho hiện tại để bắt đầu đợt kiểm kê. Bạn có đồng ý tiếp tục?")) return;
    setActionLoading(true);
    try {
      await posApi.createAudit({ notes: auditNotes.trim() || undefined });
      showToast("success", "Tạo đợt kiểm kê kho nháp thành công!");
      setAuditNotes("");
      loadData();
    } catch (err: any) {
      showToast("error", err.message || "Không thể tạo đợt kiểm.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenAuditCountModal = (audit: InventoryAudit) => {
    setSelectedAudit(audit);
    // Initialize counts
    const counts: { [key: string]: number } = {};
    audit.items?.forEach(item => {
      const key = item.ingredientId ? `ing_${item.ingredientId}` : `prod_${item.productId}`;
      counts[key] = item.actualQty;
    });
    setAuditCounts(counts);
    setShowAuditCountModal(true);
  };

  const handleAuditCountChange = (key: string, value: string) => {
    setAuditCounts({
      ...auditCounts,
      [key]: Number(value || 0)
    });
  };

  const handleSaveAuditCounts = async () => {
    if (!selectedAudit) return;
    setActionLoading(true);
    try {
      const itemsPayload = selectedAudit.items?.map(item => {
        const key = item.ingredientId ? `ing_${item.ingredientId}` : `prod_${item.productId}`;
        return {
          ingredientId: item.ingredientId || undefined,
          productId: item.productId || undefined,
          actualQty: auditCounts[key] !== undefined ? auditCounts[key] : item.systemQty
        };
      }) || [];

      await posApi.submitAudit(selectedAudit.id, { items: itemsPayload });
      showToast("success", "Ghi nhận số lượng kiểm kê thực tế thành công!");
      setShowAuditCountModal(false);
      loadData();
    } catch (err: any) {
      showToast("error", err.message || "Lỗi khi cập nhật số đếm.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdjustAudit = async (auditId: string) => {
    if (!confirm("Bằng việc Cân bằng kho, số lượng tồn kho trên hệ thống sẽ cập nhật khớp theo số kiểm đếm thực tế của bạn. Thao tác này không thể thu hồi. Bạn chắc chắn chứ?")) return;
    setActionLoading(true);
    try {
      await posApi.adjustAudit(auditId);
      showToast("success", "Cân bằng kho và chốt số liệu đợt kiểm thành công!");
      loadData();
    } catch (err: any) {
      showToast("error", err.message || "Lỗi khi cân bằng kho.");
    } finally {
      setActionLoading(false);
    }
  };

  // Helper render badges
  const renderStatusBadge = (status: "OUT_OF_STOCK" | "LOW_STOCK" | "NORMAL", qty: number) => {
    if (status === "OUT_OF_STOCK" || qty <= 0) {
      return <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-xs font-bold text-red-700 border border-red-200">🔴 Hết hàng</span>;
    }
    if (status === "LOW_STOCK") {
      return <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800 border border-amber-200">🟡 Dưới định mức</span>;
    }
    return <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">🟢 Đủ hàng</span>;
  };

  const getIngredientName = (id: string) => {
    return ingredients.find(i => i.id === id)?.name || "Không rõ";
  };

  const getProductName = (id: string) => {
    return products.find(p => p.id === id)?.name || "Không rõ";
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs navigation */}
      <div className="flex flex-wrap border-b border-stone-200 pb-px gap-6 mb-6">
        {[
          { id: "stock", label: "Tồn kho Chi nhánh", icon: "widgets" },
          { id: "recipe", label: "Định lượng món nước", icon: "tune" },
          { id: "transactions", label: "Nhập/Xuất kho", icon: "swap_horiz" },
          { id: "audits", label: "Kiểm kê kho", icon: "fact_check" },
          { id: "ingredients", label: "Nguyên vật liệu", icon: "bubble_chart" },
          { id: "suppliers", label: "Nhà cung cấp", icon: "local_shipping" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id as any)}
            className={`flex items-center gap-1.5 border-b-2 py-2 text-xs font-bold transition duration-200 ${
              subTab === tab.id
                ? "border-[#3e2723] text-[#3e2723]"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex h-96 items-center justify-center bg-white rounded-xl border border-stone-200 shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <span className="h-9 w-9 animate-spin rounded-full border-4 border-[#3e2723] border-t-transparent"></span>
            <span className="text-xs font-bold text-stone-500">Đang tải dữ liệu kho...</span>
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* ======================================================== */}
          {/* TAB 1: BRANCH STOCK */}
          {/* ======================================================== */}
          {subTab === "stock" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                {/* Search & Filter */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-stone-400 text-base">search</span>
                    <input
                      type="text"
                      placeholder="Tìm kiếm nguyên liệu, sản phẩm..."
                      value={stockSearch}
                      onChange={e => setStockSearch(e.target.value)}
                      className="w-full rounded-lg border border-stone-200 bg-white py-1.5 pl-9 pr-4 text-xs focus:border-[#3e2723] focus:outline-none"
                    />
                  </div>
                  <div className="flex rounded-lg border border-stone-200 p-0.5 bg-stone-50 text-xs font-bold text-stone-600">
                    <button
                      onClick={() => setStockFilter("all")}
                      className={`px-3 py-1 rounded-md transition ${stockFilter === "all" ? "bg-white text-[#3e2723] shadow-sm" : "hover:text-stone-800"}`}
                    >
                      Tất cả
                    </button>
                    <button
                      onClick={() => setStockFilter("low_stock")}
                      className={`px-3 py-1 rounded-md transition ${stockFilter === "low_stock" ? "bg-white text-[#3e2723] shadow-sm" : "hover:text-stone-800"}`}
                    >
                      Thiếu hàng
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleOpenImportModal}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 rounded-lg bg-[#3e2723] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#5d4037] transition duration-200"
                  >
                    <span className="material-symbols-outlined text-base">add_box</span>
                    Nhập hàng
                  </button>
                  <button
                    onClick={handleOpenExportModal}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 rounded-lg bg-stone-100 border border-stone-200 px-3.5 py-2 text-xs font-bold text-stone-700 hover:bg-stone-200 transition duration-200"
                  >
                    <span className="material-symbols-outlined text-base">outbox</span>
                    Xuất hủy
                  </button>
                </div>
              </div>

              {/* Stock Table */}
              <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
                <table className="w-full border-collapse text-left text-xs text-stone-700">
                  <thead className="bg-stone-50 font-bold text-[#3e2723] border-b border-stone-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-4">Tên mặt hàng</th>
                      <th className="px-6 py-4">Phân loại</th>
                      <th className="px-6 py-4 text-right">Tồn kho hiện tại</th>
                      <th className="px-6 py-4 text-right">Tồn an toàn (Min)</th>
                      <th className="px-6 py-4">Trạng thái</th>
                      <th className="px-6 py-4 text-right">Giá vốn ước tính</th>
                      <th className="px-6 py-4 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium">
                    {branchStocks.length > 0 ? (
                      branchStocks.map(stock => (
                        <tr key={stock.id} className="hover:bg-stone-50/50">
                          <td className="px-6 py-3.5 text-stone-900 font-bold">{stock.name}</td>
                          <td className="px-6 py-3.5">
                            {stock.type === "ingredient" ? (
                              <span className="rounded bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-600 border border-stone-200">Nguyên liệu</span>
                            ) : (
                              <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">Sản phẩm bán lẻ</span>
                            )}
                          </td>
                          <td className="px-6 py-3.5 text-right text-stone-900 font-bold text-sm">
                            {stock.quantity.toFixed(1)} <span className="text-[10px] text-stone-500 font-medium">{stock.unit}</span>
                          </td>
                          <td className="px-6 py-3.5 text-right text-stone-600">
                            {stock.minStock} <span className="text-[10px] text-stone-500 font-medium">{stock.unit}</span>
                          </td>
                          <td className="px-6 py-3.5">{renderStatusBadge(stock.status, stock.quantity)}</td>
                          <td className="px-6 py-3.5 text-right text-stone-900 font-bold">
                            {formatPrice(stock.costPrice)}
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            <button
                              onClick={() => handleOpenMinStockModal(stock)}
                              className="rounded-lg border border-stone-200 p-1.5 text-stone-500 hover:text-[#3e2723] hover:bg-stone-50"
                              title="Thiết lập tồn an toàn"
                            >
                              <span className="material-symbols-outlined text-base block">tune</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-stone-400">
                          Không tìm thấy mặt hàng nào trong kho.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: RECIPE MANAGEMENT */}
          {/* ======================================================== */}
          {subTab === "recipe" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Product list */}
              <div className="lg:col-span-1 bg-white rounded-xl border border-stone-200 shadow-sm p-4 h-[600px] flex flex-col">
                <h3 className="text-xs font-bold text-[#3e2723] uppercase tracking-wider mb-3">Chọn món nước</h3>
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  {categories.map(cat => {
                    const catProds = products.filter(p => p.categoryId === cat.id);
                    if (catProds.length === 0) return null;
                    return (
                      <div key={cat.id} className="space-y-1.5">
                        <h4 className="text-[10px] font-extrabold uppercase text-stone-400 bg-stone-50 px-2 py-1 rounded">{cat.name}</h4>
                        <div className="space-y-0.5">
                          {catProds.map(prod => (
                            <button
                              key={prod.id}
                              onClick={() => setSelectedRecipeProductId(prod.id)}
                              className={`w-full text-left px-3 py-2 text-xs rounded-lg font-bold flex justify-between items-center transition ${
                                selectedRecipeProductId === prod.id
                                  ? "bg-[#3e2723] text-white shadow-sm"
                                  : "text-stone-700 hover:bg-stone-50"
                              }`}
                            >
                              <span>{prod.name}</span>
                              <span className={selectedRecipeProductId === prod.id ? "text-stone-300" : "text-stone-400"}>
                                {formatPrice(prod.price)}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recipe Items Form */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 shadow-sm p-5 h-[600px] flex flex-col">
                {selectedRecipeProductId ? (
                  <>
                    <div className="flex justify-between items-center border-b border-stone-200 pb-3 mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-stone-900 font-headline">
                          Định lượng cho: <span className="text-[#3e2723]">{getProductName(selectedRecipeProductId)}</span>
                        </h3>
                        <p className="text-[10px] text-stone-500 mt-0.5">
                          Khai báo các thành phần nguyên liệu tiêu hao khi pha chế 1 đơn vị đồ uống này.
                        </p>
                      </div>
                      <button
                        onClick={handleAddRecipeItem}
                        disabled={ingredients.length === 0}
                        className="flex items-center gap-1 rounded-lg bg-stone-100 hover:bg-stone-200 px-3 py-1.5 text-xs font-bold text-stone-700 border border-stone-200 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-base">add</span>
                        Thêm thành phần
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                      {recipeItems.length > 0 ? (
                        recipeItems.map((item, index) => {
                          const targetIng = ingredients.find(i => i.id === item.ingredientId);
                          return (
                            <div key={index} className="flex items-center gap-4 bg-stone-50 border border-stone-200 rounded-xl p-3.5 shadow-sm">
                              {/* Index */}
                              <span className="text-xs font-black text-stone-400 w-4">{index + 1}</span>

                              {/* Ingredient select */}
                              <div className="flex-1">
                                <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">Nguyên liệu</label>
                                <select
                                  value={item.ingredientId}
                                  onChange={e => handleRecipeItemChange(index, "ingredientId", e.target.value)}
                                  className="w-full rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-xs font-bold text-stone-800 focus:outline-none"
                                >
                                  {ingredients.map(ing => (
                                    <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                                  ))}
                                </select>
                              </div>

                              {/* Quantity input */}
                              <div className="w-32">
                                <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">Số lượng hao</label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    min="0.01"
                                    step="any"
                                    value={item.quantity}
                                    onChange={e => handleRecipeItemChange(index, "quantity", e.target.value)}
                                    className="w-full rounded-lg border border-stone-200 bg-white py-1.5 pl-3 pr-8 text-xs font-bold text-stone-800 focus:outline-none"
                                  />
                                  <span className="absolute right-3 top-2 text-[10px] text-stone-400 font-bold uppercase">
                                    {targetIng?.unit || ""}
                                  </span>
                                </div>
                              </div>

                              {/* Delete button */}
                              <button
                                onClick={() => handleRemoveRecipeItem(index)}
                                className="mt-4 rounded-lg bg-red-50 p-2 text-red-500 hover:bg-red-100 hover:text-red-700 border border-red-200"
                              >
                                <span className="material-symbols-outlined text-base block">delete</span>
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-stone-400">
                          <span className="material-symbols-outlined text-3xl mb-1">restaurant</span>
                          <span className="text-xs font-medium">Món uống này chưa có định lượng nguyên liệu.</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-stone-200 pt-4 mt-4 flex justify-end gap-3">
                      <button
                        onClick={handleSaveRecipe}
                        disabled={actionLoading}
                        className="flex items-center gap-1.5 rounded-lg bg-[#3e2723] hover:bg-[#5d4037] px-5 py-2.5 text-xs font-bold text-white shadow transition disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-base">save</span>
                        Lưu cấu hình
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-stone-400">
                    <span className="material-symbols-outlined text-4xl mb-2">restaurant_menu</span>
                    <span className="text-xs font-medium">Vui lòng chọn món uống từ danh mục bên trái để định lượng.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: STOCK TRANSACTIONS */}
          {/* ======================================================== */}
          {subTab === "transactions" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 font-headline">Lịch sử xuất nhập kho</h3>
                  <p className="text-[10px] text-stone-400 mt-0.5">Theo dõi lịch sử nhập hàng và xuất hủy hao hụt tại chi nhánh.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleOpenImportModal}
                    className="flex items-center gap-1 rounded-lg bg-[#3e2723] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#5d4037] transition duration-200"
                  >
                    <span className="material-symbols-outlined text-base">add_box</span>
                    Nhập hàng NCC
                  </button>
                  <button
                    onClick={handleOpenExportModal}
                    className="flex items-center gap-1 rounded-lg bg-stone-100 border border-stone-200 px-3.5 py-2 text-xs font-bold text-stone-700 hover:bg-stone-200 transition duration-200"
                  >
                    <span className="material-symbols-outlined text-base">outbox</span>
                    Xuất hủy
                  </button>
                </div>
              </div>

              {/* Transactions List */}
              <div className="space-y-3">
                {transactions.length > 0 ? (
                  transactions.map(tx => (
                    <div key={tx.id} className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm space-y-4">
                      {/* Header block */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-stone-100 pb-3 gap-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-xs font-black text-stone-900 bg-stone-100 px-2 py-1 rounded">
                            #{tx.id.substring(0, 8).toUpperCase()}
                          </span>
                          {tx.type === "IMPORT" && (
                            <span className="rounded bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">📥 Nhập kho</span>
                          )}
                          {tx.type === "EXPORT" && (
                            <span className="rounded bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 border border-red-200">📤 Xuất hủy</span>
                          )}
                          {tx.type === "AUDIT_ADJUST" && (
                            <span className="rounded bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">🔧 Cân bằng kho</span>
                          )}
                          {tx.type === "SALE_DEDUCTION" && (
                            <span className="rounded bg-stone-100 px-2.5 py-0.5 text-xs font-bold text-stone-600 border border-stone-200">🛒 Bán hàng</span>
                          )}
                          <span className="text-[10px] text-stone-400 font-bold">
                            {new Date(tx.createdAt).toLocaleString("vi-VN")}
                          </span>
                        </div>
                        <div className="text-xs text-stone-500 font-medium">
                          {tx.supplier && (
                            <span className="font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded mr-2">
                              NCC: {tx.supplier.name}
                            </span>
                          )}
                          Người tạo: <span className="font-bold text-stone-700">POS Admin</span>
                        </div>
                      </div>

                      {/* Notes */}
                      {tx.notes && (
                        <p className="text-xs italic text-stone-500 bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                          Ghi chú: {tx.notes}
                        </p>
                      )}

                      {/* Items */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[11px] text-stone-600">
                          <thead>
                            <tr className="text-stone-400 font-bold border-b border-stone-100 uppercase tracking-wider text-[9px]">
                              <th className="py-2">Mặt hàng</th>
                              <th className="py-2 text-right">Số lượng</th>
                              <th className="py-2 text-right">Đơn giá / Vốn tạm tính</th>
                              <th className="py-2 text-right">Thành tiền</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100 font-bold">
                            {tx.items?.map((item, idx) => {
                              const name = item.ingredientId ? item.ingredient?.name : item.product?.name;
                              const unit = item.ingredientId ? item.ingredient?.unit : "Cái";
                              const price = Number(item.unitPrice || 0);
                              const qty = item.quantity;
                              return (
                                <tr key={idx} className="hover:bg-stone-50/20">
                                  <td className="py-2 text-stone-900">{name || "Chưa rõ"}</td>
                                  <td className="py-2 text-right text-stone-800">
                                    {qty > 0 ? `+${qty.toFixed(1)}` : qty.toFixed(1)} <span className="text-[9px] text-stone-400 font-medium">{unit}</span>
                                  </td>
                                  <td className="py-2 text-right">{formatPrice(price)}</td>
                                  <td className="py-2 text-right text-stone-900">{formatPrice(Math.abs(qty * price))}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-xl border border-stone-200 p-12 text-center text-stone-400 shadow-sm">
                    Không tìm thấy giao dịch xuất nhập kho nào.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: AUDITS (KIỂM KHO) */}
          {/* ======================================================== */}
          {subTab === "audits" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 font-headline">Kiểm kê hàng tồn kho</h3>
                  <p className="text-[10px] text-stone-400 mt-0.5">Tạo đợt kiểm kho định kỳ, nhập số lượng đếm thực tế và tự động điều chỉnh lệch.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Ghi chú đợt kiểm..."
                    value={auditNotes}
                    onChange={e => setAuditNotes(e.target.value)}
                    className="flex-1 sm:w-64 rounded-lg border border-stone-200 bg-white py-1.5 px-3 text-xs focus:outline-none"
                  />
                  <button
                    onClick={handleCreateAudit}
                    className="flex items-center gap-1 rounded-lg bg-[#3e2723] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#5d4037] transition duration-200"
                  >
                    <span className="material-symbols-outlined text-base">fact_check</span>
                    Bắt đầu đợt kiểm
                  </button>
                </div>
              </div>

              {/* Audits List */}
              <div className="space-y-4">
                {audits.length > 0 ? (
                  audits.map(audit => (
                    <div key={audit.id} className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm space-y-4">
                      {/* Header block */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-stone-100 pb-3 gap-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-xs font-black text-stone-900 bg-stone-100 px-2 py-1 rounded">
                            #{audit.id.substring(0, 8).toUpperCase()}
                          </span>
                          {audit.status === "PENDING" ? (
                            <span className="rounded bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">⏳ Đang đếm</span>
                          ) : (
                            <span className="rounded bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">✅ Đã cân bằng</span>
                          )}
                          <span className="text-[10px] text-stone-400 font-bold">
                            {new Date(audit.createdAt).toLocaleString("vi-VN")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {audit.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleOpenAuditCountModal(audit)}
                                className="rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-200 px-3 py-1.5 text-xs font-bold text-stone-700"
                              >
                                Nhập số đếm thực tế
                              </button>
                              <button
                                onClick={() => handleAdjustAudit(audit.id)}
                                className="rounded-lg bg-[#3e2723] hover:bg-[#5d4037] px-3 py-1.5 text-xs font-bold text-white shadow"
                              >
                                Cân bằng kho
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Notes */}
                      {audit.notes && (
                        <p className="text-xs italic text-stone-500 bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                          Mô tả đợt kiểm: {audit.notes}
                        </p>
                      )}

                      {/* Items */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-[11px] text-stone-600">
                          <thead>
                            <tr className="text-stone-400 font-bold border-b border-stone-100 uppercase tracking-wider text-[9px]">
                              <th className="py-2">Mặt hàng</th>
                              <th className="py-2 text-right">Tồn hệ thống</th>
                              <th className="py-2 text-right">Tồn thực tế</th>
                              <th className="py-2 text-right">Chênh lệch</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100 font-bold">
                            {audit.items?.map((item, idx) => {
                              const name = item.ingredientId ? item.ingredient?.name : item.product?.name;
                              const unit = item.ingredientId ? item.ingredient?.unit : "Cái";
                              const sys = item.systemQty;
                              const act = item.actualQty;
                              const diff = item.discrepancy;
                              return (
                                <tr key={idx} className="hover:bg-stone-50/20">
                                  <td className="py-2 text-stone-900">{name || "Chưa rõ"}</td>
                                  <td className="py-2 text-right text-stone-500">{sys.toFixed(1)} {unit}</td>
                                  <td className="py-2 text-right text-stone-900 font-black">{act.toFixed(1)} {unit}</td>
                                  <td className={`py-2 text-right text-sm ${diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-500" : "text-stone-400"}`}>
                                    {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-xl border border-stone-200 p-12 text-center text-stone-400 shadow-sm">
                    Chưa tạo đợt kiểm kê hàng tồn kho nào.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: INGREDIENTS MANAGEMENT */}
          {/* ======================================================== */}
          {subTab === "ingredients" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 font-headline">Danh mục Nguyên vật liệu</h3>
                  <p className="text-[10px] text-stone-400 mt-0.5">Quản lý nguyên liệu thô dùng cho hoạt động pha chế của chuỗi cửa hàng.</p>
                </div>
                <button
                  onClick={() => handleOpenIngredientModal(null)}
                  className="flex items-center gap-1 rounded-lg bg-[#3e2723] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#5d4037] transition duration-200"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  Thêm nguyên liệu mới
                </button>
              </div>

              {/* Ingredients List */}
              <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
                <table className="w-full border-collapse text-left text-xs text-stone-700">
                  <thead className="bg-stone-50 font-bold text-[#3e2723] border-b border-stone-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-4">Tên nguyên liệu</th>
                      <th className="px-6 py-4">Đơn vị tính</th>
                      <th className="px-6 py-4 text-right">Giá vốn trung bình</th>
                      <th className="px-6 py-4">Ngày tạo</th>
                      <th className="px-6 py-4 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-medium">
                    {ingredients.length > 0 ? (
                      ingredients.map(ing => (
                        <tr key={ing.id} className="hover:bg-stone-50/50">
                          <td className="px-6 py-3.5 text-stone-900 font-bold">{ing.name}</td>
                          <td className="px-6 py-3.5 text-stone-600 font-bold">{ing.unit}</td>
                          <td className="px-6 py-3.5 text-right text-stone-900 font-bold">{formatPrice(ing.costPrice)}</td>
                          <td className="px-6 py-3.5 text-stone-500">
                            {new Date(ing.createdAt).toLocaleDateString("vi-VN")}
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleOpenIngredientModal(ing)}
                                className="rounded-lg border border-stone-200 p-1.5 text-stone-500 hover:text-[#3e2723] hover:bg-stone-50"
                                title="Sửa nguyên liệu"
                              >
                                <span className="material-symbols-outlined text-base block">edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteIngredient(ing.id, ing.name)}
                                className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-500 hover:bg-red-100 hover:text-red-700"
                                title="Xóa"
                              >
                                <span className="material-symbols-outlined text-base block">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-stone-400">
                          Chưa có nguyên vật liệu nào trong danh mục.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 6: SUPPLIERS */}
          {/* ======================================================== */}
          {subTab === "suppliers" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 font-headline">Nhà cung cấp</h3>
                  <p className="text-[10px] text-stone-400 mt-0.5">Quản lý thông tin liên hệ của các đối tác cung cấp nguyên liệu.</p>
                </div>
                <button
                  onClick={() => handleOpenSupplierModal(null)}
                  className="flex items-center gap-1 rounded-lg bg-[#3e2723] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#5d4037] transition duration-200"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  Thêm nhà cung cấp
                </button>
              </div>

              {/* Suppliers List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suppliers.length > 0 ? (
                  suppliers.map(sup => (
                    <div key={sup.id} className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-stone-900 uppercase font-headline">{sup.name}</h4>
                        {sup.phone && (
                          <p className="text-xs text-stone-500 flex items-center gap-1">
                            <span className="material-symbols-outlined text-stone-400 text-sm">phone</span>
                            {sup.phone}
                          </p>
                        )}
                        {sup.address && (
                          <p className="text-xs text-stone-500 flex items-center gap-1">
                            <span className="material-symbols-outlined text-stone-400 text-sm">location_on</span>
                            {sup.address}
                          </p>
                        )}
                      </div>
                      <div className="flex justify-end gap-2 border-t border-stone-100 pt-3 mt-2">
                        <button
                          onClick={() => handleOpenSupplierModal(sup)}
                          className="rounded-lg border border-stone-200 px-2.5 py-1 text-stone-500 hover:text-[#3e2723] hover:bg-stone-50 text-[10px] font-bold flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteSupplier(sup.id, sup.name)}
                          className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-red-500 hover:bg-red-100 hover:text-red-700 text-[10px] font-bold flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full bg-white rounded-xl border border-stone-200 p-12 text-center text-stone-400 shadow-sm">
                    Chưa khai báo nhà cung cấp nào.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ======================================================== */}
      {/* MODAL A: INGREDIENT ADD/EDIT */}
      {/* ======================================================== */}
      {showIngredientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-[#3e2723] font-headline uppercase tracking-wider">
                {editingIngredient ? "Cập nhật nguyên liệu" : "Thêm nguyên liệu mới"}
              </h3>
              <button onClick={() => setShowIngredientModal(false)} className="text-stone-400 hover:text-stone-600">
                <span className="material-symbols-outlined text-lg block">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveIngredient} className="space-y-4 text-xs font-bold text-stone-700">
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-stone-400 mb-1">Tên nguyên liệu *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Cà phê hạt Arabica, Sữa tươi tiệt trùng"
                  value={ingName}
                  onChange={e => setIngName(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-white py-2 px-3 text-xs focus:outline-none focus:border-[#3e2723]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-stone-400 mb-1">Đơn vị tính *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: g, ml, cái, hộp"
                    value={ingUnit}
                    onChange={e => setIngUnit(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 bg-white py-2 px-3 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-stone-400 mb-1">Giá vốn ước tính (đ)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="VD: 150000"
                    value={ingCostPrice}
                    onChange={e => setIngCostPrice(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 bg-white py-2 px-3 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowIngredientModal(false)}
                  className="rounded-lg bg-stone-100 hover:bg-stone-200 px-4 py-2 text-xs font-bold text-stone-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-lg bg-[#3e2723] hover:bg-[#5d4037] px-5 py-2 text-xs font-bold text-white shadow disabled:opacity-50"
                >
                  Lưu lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL B: SUPPLIER ADD/EDIT */}
      {/* ======================================================== */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-[#3e2723] font-headline uppercase tracking-wider">
                {editingSupplier ? "Sửa nhà cung cấp" : "Thêm nhà cung cấp mới"}
              </h3>
              <button onClick={() => setShowSupplierModal(false)} className="text-stone-400 hover:text-stone-600">
                <span className="material-symbols-outlined text-lg block">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveSupplier} className="space-y-4 text-xs font-bold text-stone-700">
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-stone-400 mb-1">Tên nhà cung cấp *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Công ty Cổ phần Sữa Việt Nam"
                  value={supName}
                  onChange={e => setSupName(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-white py-2 px-3 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-stone-400 mb-1">Số điện thoại liên hệ</label>
                <input
                  type="text"
                  placeholder="VD: 0987654321"
                  value={supPhone}
                  onChange={e => setSupPhone(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-white py-2 px-3 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-stone-400 mb-1">Địa chỉ</label>
                <textarea
                  rows={2}
                  placeholder="Địa chỉ trụ sở hoặc kho giao hàng..."
                  value={supAddress}
                  onChange={e => setSupAddress(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-white py-2 px-3 text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="rounded-lg bg-stone-100 hover:bg-stone-200 px-4 py-2 text-xs font-bold text-stone-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-lg bg-[#3e2723] hover:bg-[#5d4037] px-5 py-2 text-xs font-bold text-white shadow disabled:opacity-50"
                >
                  Lưu lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL C: MIN STOCK UPDATE */}
      {/* ======================================================== */}
      {showMinStockModal && minStockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-[#3e2723] uppercase tracking-wider font-headline">Tồn an toàn (Min Stock)</h3>
              <button onClick={() => setShowMinStockModal(false)} className="text-stone-400 hover:text-stone-600">
                <span className="material-symbols-outlined text-lg block">close</span>
              </button>
            </div>
            <div className="space-y-4 text-xs font-bold text-stone-700">
              <p className="text-stone-600 leading-relaxed font-medium">
                Mức tồn tối thiểu cho: <span className="text-[#3e2723] font-bold">{minStockItem.name}</span>.
                Hệ thống sẽ hiện cảnh báo nếu tồn kho thực tế nhỏ hơn mức này.
              </p>
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-stone-400 mb-1">Mức tồn cảnh báo ({minStockItem.unit})</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={minStockValue}
                  onChange={e => setMinStockValue(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-white py-2 px-3 text-xs focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  onClick={() => setShowMinStockModal(false)}
                  className="rounded-lg bg-stone-100 hover:bg-stone-200 px-4 py-2 text-xs font-bold text-stone-600"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveMinStock}
                  disabled={actionLoading}
                  className="rounded-lg bg-[#3e2723] hover:bg-[#5d4037] px-5 py-2 text-xs font-bold text-white shadow disabled:opacity-50"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL D: IMPORT SLIP CREATION */}
      {/* ======================================================== */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl border border-stone-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4 flex-shrink-0">
              <h3 className="text-sm font-bold text-[#3e2723] font-headline uppercase tracking-wider">Phiếu nhập kho hàng hóa</h3>
              <button onClick={() => setShowImportModal(false)} className="text-stone-400 hover:text-stone-600">
                <span className="material-symbols-outlined text-lg block">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs font-bold text-stone-700">
              {/* Supplier & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-stone-400 mb-1">Nhà cung cấp *</label>
                  <select
                    value={importSupplierId}
                    onChange={e => setImportSupplierId(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 bg-white py-2 px-3 text-xs font-bold focus:outline-none"
                  >
                    <option value="">-- Chọn Nhà cung cấp --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest text-stone-400 mb-1">Ghi chú phiếu nhập</label>
                  <input
                    type="text"
                    placeholder="VD: Nhập hàng cà phê sữa đầu tuần..."
                    value={importNotes}
                    onChange={e => setImportNotes(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 bg-white py-2 px-3 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Items Detail */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-stone-150 pb-2">
                  <h4 className="text-[10px] uppercase tracking-wider text-[#3e2723] font-bold">Danh sách mặt hàng nhập</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddImportItem("ingredient")}
                      className="rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-200 px-3 py-1.5 text-[10px] font-bold text-stone-700 flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      Nguyên liệu
                    </button>
                    <button
                      onClick={() => handleAddImportItem("product")}
                      className="rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 text-[10px] font-bold text-amber-800 flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      Sản phẩm đóng lon
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {importItems.map((item, idx) => {
                    const isIng = item.ingredientId !== undefined;
                    return (
                      <div key={idx} className="flex flex-wrap items-center gap-3 bg-stone-50 border border-stone-200 rounded-xl p-3 shadow-sm">
                        <span className="text-[10px] font-black text-stone-400 w-4">{idx + 1}</span>

                        <div className="w-16">
                          <span className={`inline-block w-full text-center py-0.5 rounded text-[8px] font-bold uppercase ${isIng ? "bg-stone-100 text-stone-600 border border-stone-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                            {isIng ? "N.Liệu" : "S.Phẩm"}
                          </span>
                        </div>

                        {/* Select Item */}
                        <div className="flex-1 min-w-[200px]">
                          <select
                            value={isIng ? item.ingredientId : item.productId}
                            onChange={e => handleImportItemChange(idx, "itemId", e.target.value)}
                            className="w-full rounded-lg border border-stone-200 bg-white py-1.5 px-2 text-xs font-bold text-stone-850 focus:outline-none"
                          >
                            {isIng ? (
                              ingredients.map(ing => (
                                <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                              ))
                            ) : (
                              products.map(prod => (
                                <option key={prod.id} value={prod.id}>{prod.name} (Cái)</option>
                              ))
                            )}
                          </select>
                        </div>

                        {/* Qty */}
                        <div className="w-24">
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            placeholder="Số lượng"
                            value={item.quantity}
                            onChange={e => handleImportItemChange(idx, "quantity", e.target.value)}
                            className="w-full rounded-lg border border-stone-200 bg-white py-1.5 px-2.5 text-xs text-right font-bold focus:outline-none"
                          />
                        </div>

                        {/* Price */}
                        <div className="w-32">
                          <input
                            type="number"
                            min="0"
                            placeholder="Đơn giá nhập"
                            value={item.unitPrice}
                            onChange={e => handleImportItemChange(idx, "unitPrice", e.target.value)}
                            className="w-full rounded-lg border border-stone-200 bg-white py-1.5 px-2.5 text-xs text-right font-bold focus:outline-none"
                          />
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => handleRemoveImportItem(idx)}
                          className="rounded-lg bg-red-50 p-2 text-red-500 hover:bg-red-100 hover:text-red-700 border border-red-200"
                        >
                          <span className="material-symbols-outlined text-sm block">delete</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="border-t border-stone-100 pt-4 mt-4 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => setShowImportModal(false)}
                className="rounded-lg bg-stone-100 hover:bg-stone-200 px-4 py-2 text-xs font-bold text-stone-600"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveImport}
                disabled={actionLoading}
                className="rounded-lg bg-[#3e2723] hover:bg-[#5d4037] px-6 py-2.5 text-xs font-bold text-white shadow disabled:opacity-50"
              >
                Xác nhận Nhập kho
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL E: EXPORT SLIP CREATION */}
      {/* ======================================================== */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl border border-stone-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4 flex-shrink-0">
              <h3 className="text-sm font-bold text-[#3e2723] font-headline uppercase tracking-wider">Lập phiếu xuất kho hủy hàng</h3>
              <button onClick={() => setShowExportModal(false)} className="text-stone-400 hover:text-stone-600">
                <span className="material-symbols-outlined text-lg block">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs font-bold text-stone-700">
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-stone-400 mb-1">Lý do xuất hủy *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Hết hạn sử dụng, Nguyên liệu hỏng, Cốc nứt vỡ..."
                  value={exportNotes}
                  onChange={e => setExportNotes(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-white py-2 px-3 text-xs focus:outline-none focus:border-[#3e2723]"
                />
              </div>

              {/* Items Detail */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-stone-150 pb-2">
                  <h4 className="text-[10px] uppercase tracking-wider text-[#3e2723] font-bold">Danh sách hàng xuất</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddExportItem("ingredient")}
                      className="rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-200 px-3 py-1.5 text-[10px] font-bold text-stone-700 flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      Nguyên liệu
                    </button>
                    <button
                      onClick={() => handleAddExportItem("product")}
                      className="rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 text-[10px] font-bold text-amber-800 flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      Sản phẩm đóng lon
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {exportItems.map((item, idx) => {
                    const isIng = item.ingredientId !== undefined;
                    return (
                      <div key={idx} className="flex flex-wrap items-center gap-3 bg-stone-50 border border-stone-200 rounded-xl p-3 shadow-sm">
                        <span className="text-[10px] font-black text-stone-400 w-4">{idx + 1}</span>

                        <div className="w-16">
                          <span className={`inline-block w-full text-center py-0.5 rounded text-[8px] font-bold uppercase ${isIng ? "bg-stone-100 text-stone-600 border border-stone-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                            {isIng ? "N.Liệu" : "S.Phẩm"}
                          </span>
                        </div>

                        {/* Select Item */}
                        <div className="flex-1 min-w-[200px]">
                          <select
                            value={isIng ? item.ingredientId : item.productId}
                            onChange={e => handleExportItemChange(idx, "itemId", e.target.value)}
                            className="w-full rounded-lg border border-stone-200 bg-white py-1.5 px-2 text-xs font-bold text-stone-850 focus:outline-none"
                          >
                            {isIng ? (
                              ingredients.map(ing => (
                                <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                              ))
                            ) : (
                              products.map(prod => (
                                <option key={prod.id} value={prod.id}>{prod.name} (Cái)</option>
                              ))
                            )}
                          </select>
                        </div>

                        {/* Qty */}
                        <div className="w-32">
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            placeholder="Số lượng"
                            value={item.quantity}
                            onChange={e => handleExportItemChange(idx, "quantity", e.target.value)}
                            className="w-full rounded-lg border border-stone-200 bg-white py-1.5 px-2.5 text-xs text-right font-bold focus:outline-none"
                          />
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => handleRemoveExportItem(idx)}
                          className="rounded-lg bg-red-50 p-2 text-red-500 hover:bg-red-100 hover:text-red-700 border border-red-200"
                        >
                          <span className="material-symbols-outlined text-sm block">delete</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="border-t border-stone-100 pt-4 mt-4 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => setShowExportModal(false)}
                className="rounded-lg bg-stone-100 hover:bg-stone-200 px-4 py-2 text-xs font-bold text-stone-600"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveExport}
                disabled={actionLoading}
                className="rounded-lg bg-[#3e2723] hover:bg-[#5d4037] px-6 py-2.5 text-xs font-bold text-white shadow disabled:opacity-50"
              >
                Xác nhận Xuất kho
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL F: AUDIT PHYSICAL COUNT */}
      {/* ======================================================== */}
      {showAuditCountModal && selectedAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-stone-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4 flex-shrink-0">
              <h3 className="text-sm font-bold text-[#3e2723] font-headline uppercase tracking-wider">
                Nhập số đếm kiểm kho #{selectedAudit.id.substring(0, 8).toUpperCase()}
              </h3>
              <button onClick={() => setShowAuditCountModal(false)} className="text-stone-400 hover:text-stone-600">
                <span className="material-symbols-outlined text-lg block">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs font-bold text-stone-700">
              {selectedAudit.items?.map((item, idx) => {
                const name = item.ingredientId ? item.ingredient?.name : item.product?.name;
                const unit = item.ingredientId ? item.ingredient?.unit : "Cái";
                const key = item.ingredientId ? `ing_${item.ingredientId}` : `prod_${item.productId}`;
                const currentVal = auditCounts[key] !== undefined ? auditCounts[key] : item.actualQty;
                return (
                  <div key={idx} className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl p-3 shadow-sm">
                    <div>
                      <span className="text-stone-900 font-bold text-sm block">{name}</span>
                      <span className="text-[10px] text-stone-500 font-medium">Tồn hệ thống: {item.systemQty.toFixed(1)} {unit}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="any"
                        placeholder="Số lượng thực đếm"
                        value={currentVal}
                        onChange={e => handleAuditCountChange(key, e.target.value)}
                        className="w-28 rounded-lg border border-stone-200 bg-white py-1.5 px-2.5 text-xs text-right font-black focus:outline-none"
                      />
                      <span className="text-[10px] text-stone-400 font-bold uppercase w-8">{unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-stone-100 pt-4 mt-4 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => setShowAuditCountModal(false)}
                className="rounded-lg bg-stone-100 hover:bg-stone-200 px-4 py-2 text-xs font-bold text-stone-600"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveAuditCounts}
                disabled={actionLoading}
                className="rounded-lg bg-[#3e2723] hover:bg-[#5d4037] px-5 py-2.5 text-xs font-bold text-white shadow disabled:opacity-50"
              >
                Lưu lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
