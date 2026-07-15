import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  SafeAreaView,
  useWindowDimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { posApi, BranchStockItem, InventoryAudit, Ingredient, Supplier, formatPrice } from '@/lib/api';
import { storage } from '@/lib/storage';
import { Search, ClipboardList, ShieldAlert, Plus, RefreshCw } from 'lucide-react-native';

type SubTabType = 'stock' | 'audit' | 'import';

export default function InventoryScreen() {
  const { width } = useWindowDimensions();
  const [subTab, setSubTab] = useState<SubTabType>('stock');

  // Core Data States
  const [branchStocks, setBranchStocks] = useState<BranchStockItem[]>([]);
  const [audits, setAudits] = useState<InventoryAudit[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Loading States
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState('STAFF');
  const [branchId, setBranchId] = useState('');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low'>('all');

  // Min Stock Modal
  const [showMinStockModal, setShowMinStockModal] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<BranchStockItem | null>(null);
  const [minStockValue, setMinStockValue] = useState('');

  // Audit Count Modal
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [activeAudit, setActiveAudit] = useState<InventoryAudit | null>(null);
  const [auditCounts, setAuditCounts] = useState<{ [key: string]: string }>({});

  // Import Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [importNotes, setImportNotes] = useState('');
  const [importItems, setImportItems] = useState<Array<{ ingredientId?: string; productId?: string; quantity: string; unitPrice: string }>>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Get branch & user role
      const bId = await storage.getItem('pos_branch_id');
      setBranchId(bId || '');

      const userStr = await storage.getItem('pos_user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        setCurrentUserRole(userObj.role);
      }

      if (subTab === 'stock') {
        const stocks = await posApi.getBranchStock();
        setBranchStocks(stocks);
      } else if (subTab === 'audit') {
        const auds = await posApi.getAudits();
        setAudits(auds);
      } else if (subTab === 'import') {
        const [sups, ings] = await Promise.all([
          posApi.getSuppliers(),
          posApi.getIngredients(),
        ]);
        setSuppliers(sups);
        setIngredients(ings);
      }
    } catch (err: any) {
      console.error('Lỗi tải dữ liệu kho:', err);
      Alert.alert('Lỗi', err.message || 'Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  }, [subTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered Stock list
  const filteredStocks = useMemo(() => {
    return branchStocks.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchFilter = stockFilter === 'all' || item.quantity <= item.minStock;
      return matchSearch && matchFilter;
    });
  }, [branchStocks, searchQuery, stockFilter]);

  // --- MIN STOCK HANDLER ---
  const handleOpenMinStock = (item: BranchStockItem) => {
    if (currentUserRole !== 'ADMIN') {
      Alert.alert('Thông báo', 'Chỉ tài khoản Admin mới được cấu hình tồn tối thiểu.');
      return;
    }
    setSelectedStockItem(item);
    setMinStockValue(String(item.minStock));
    setShowMinStockModal(true);
  };

  const handleSaveMinStock = async () => {
    if (!selectedStockItem) return;
    setActionLoading(true);
    try {
      await posApi.updateMinStock({
        itemId: selectedStockItem.itemId,
        type: selectedStockItem.type,
        minStock: parseFloat(minStockValue || '0'),
      });
      setShowMinStockModal(false);
      loadData();
      Alert.alert('Thành công', 'Đã cập nhật tồn tối thiểu.');
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể cập nhật.');
    } finally {
      setActionLoading(false);
    }
  };

  // --- AUDIT HANDLERS ---
  const handleCreateAudit = async () => {
    if (currentUserRole !== 'ADMIN') {
      Alert.alert('Thông báo', 'Chỉ tài khoản Admin mới được tạo đợt kiểm kê.');
      return;
    }
    Alert.alert(
      'Xác nhận',
      'Hệ thống sẽ ghi nhận số lượng tồn hiện tại của hệ thống để làm đợt kiểm kê mới. Đồng ý?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý',
          onPress: async () => {
            setActionLoading(true);
            try {
              await posApi.createAudit({ notes: 'Đợt kiểm kê trên thiết bị di động' });
              loadData();
              Alert.alert('Thành công', 'Đã tạo đợt kiểm kê nháp.');
            } catch (err: any) {
              Alert.alert('Lỗi', err.message || 'Không thể tạo đợt kiểm.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleOpenAudit = (audit: InventoryAudit) => {
    setActiveAudit(audit);
    // Initialize count inputs
    const counts: { [key: string]: string } = {};
    audit.items?.forEach(item => {
      const key = item.ingredientId ? `ing_${item.ingredientId}` : `prod_${item.productId}`;
      counts[key] = String(item.actualQty);
    });
    setAuditCounts(counts);
    setShowAuditModal(true);
  };

  const handleSaveAuditCounts = async () => {
    if (!activeAudit) return;
    setActionLoading(true);
    try {
      const itemsPayload = activeAudit.items?.map(item => {
        const key = item.ingredientId ? `ing_${item.ingredientId}` : `prod_${item.productId}`;
        const inputVal = auditCounts[key];
        return {
          ingredientId: item.ingredientId || undefined,
          productId: item.productId || undefined,
          actualQty: inputVal !== undefined ? parseFloat(inputVal || '0') : item.systemQty,
        };
      }) || [];

      await posApi.submitAudit(activeAudit.id, { items: itemsPayload });
      setShowAuditModal(false);
      loadData();
      Alert.alert('Thành công', 'Đã lưu số liệu kiểm kê thực tế.');
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể lưu số đếm.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdjustAudit = async (auditId: string) => {
    if (currentUserRole !== 'ADMIN') {
      Alert.alert('Thông báo', 'Chỉ tài khoản Admin mới được thực hiện cân bằng kho.');
      return;
    }
    Alert.alert(
      'Xác nhận cân bằng',
      'Sau khi cân bằng, số dư tồn trên hệ thống sẽ cập nhật đúng số đếm thực tế của bạn. Đồng ý?',
      [
        { text: 'Quay lại', style: 'cancel' },
        {
          text: 'Đồng ý',
          onPress: async () => {
            setActionLoading(true);
            try {
              await posApi.adjustAudit(auditId);
              loadData();
              Alert.alert('Thành công', 'Kho đã được cân bằng và chốt số liệu!');
            } catch (err: any) {
              Alert.alert('Lỗi', err.message || 'Không thể cân bằng.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // --- IMPORT SLIP HANDLERS ---
  const handleOpenImport = () => {
    if (currentUserRole !== 'ADMIN') {
      Alert.alert('Thông báo', 'Chỉ tài khoản Admin mới được nhập hàng.');
      return;
    }
    setSelectedSupplierId(suppliers[0]?.id || '');
    setImportNotes('');
    setImportItems([]);
    setShowImportModal(true);
  };

  const handleAddImportItem = () => {
    if (ingredients.length === 0) return;
    setImportItems([
      ...importItems,
      {
        ingredientId: ingredients[0].id,
        quantity: '1',
        unitPrice: String(ingredients[0].costPrice || '0'),
      },
    ]);
  };

  const handleRemoveImportItem = (index: number) => {
    setImportItems(importItems.filter((_, i) => i !== index));
  };

  const handleImportItemChange = (index: number, field: 'itemId' | 'quantity' | 'unitPrice', value: string) => {
    const updated = [...importItems];
    const item = updated[index];
    if (field === 'itemId') {
      item.ingredientId = value;
      // Sync cost price
      const ing = ingredients.find(i => i.id === value);
      if (ing) {
        item.unitPrice = String(ing.costPrice);
      }
    } else if (field === 'quantity') {
      item.quantity = value;
    } else if (field === 'unitPrice') {
      item.unitPrice = value;
    }
    setImportItems(updated);
  };

  const handleSaveImport = async () => {
    if (importItems.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng thêm ít nhất 1 mặt hàng nhập.');
      return;
    }

    setActionLoading(true);
    try {
      const payloadItems = importItems.map(item => ({
        ingredientId: item.ingredientId,
        quantity: parseFloat(item.quantity || '0'),
        unitPrice: parseFloat(item.unitPrice || '0'),
      }));

      await posApi.createImport({
        supplierId: selectedSupplierId || undefined,
        notes: importNotes.trim() || undefined,
        items: payloadItems,
      });

      setShowImportModal(false);
      setSubTab('stock');
      Alert.alert('Thành công', 'Đã lập phiếu nhập kho thành công!');
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể lập phiếu nhập.');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper render status
  const getStatusColor = (status: string, qty: number) => {
    if (qty <= 0 || status === 'OUT_OF_STOCK') return '#c62828'; // red
    if (status === 'LOW_STOCK') return '#ef6c00'; // orange
    return '#2e7d32'; // green
  };

  const getStatusText = (status: string, qty: number) => {
    if (qty <= 0 || status === 'OUT_OF_STOCK') return 'Hết hàng';
    if (status === 'LOW_STOCK') return 'Thiếu hụt';
    return 'Bình thường';
  };

  return (
    <SafeAreaView style={[styles.container, width >= 768 && { paddingLeft: 240 }]}>
      {/* Sub Tabs Selector */}
      <View style={styles.subTabHeader}>
        {[
          { key: 'stock', label: 'Tồn kho', icon: ClipboardList },
          { key: 'audit', label: 'Kiểm kê', icon: ClipboardList },
          { key: 'import', label: 'Nhập hàng', icon: RefreshCw },
        ].map(item => {
          const Icon = item.icon;
          const isSelected = subTab === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.subTabButton, isSelected && styles.subTabButtonActive]}
              onPress={() => setSubTab(item.key as SubTabType)}
            >
              <Icon color={isSelected ? '#ffffff' : '#8d6e63'} size={16} />
              <Text style={[styles.subTabButtonText, isSelected && styles.subTabButtonTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Main Loader */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3e2723" />
          <Text style={styles.loadingText}>Đang tải dữ liệu kho...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {/* ================= TỒN KHO ================= */}
          {subTab === 'stock' && (
            <View style={styles.tabContent}>
              {/* Search & Quick filters */}
              <View style={styles.searchBarRow}>
                <View style={styles.searchBox}>
                  <Search color="#8d6e63" size={16} style={styles.searchIcon} />
                  <TextInput
                    placeholder="Tìm nguyên liệu, sản phẩm..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={styles.searchInput}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.filterBtn, stockFilter === 'low' && styles.filterBtnActive]}
                  onPress={() => setStockFilter(stockFilter === 'all' ? 'low' : 'all')}
                >
                  <ShieldAlert color={stockFilter === 'low' ? '#ffffff' : '#ef6c00'} size={16} />
                  <Text style={[styles.filterBtnText, stockFilter === 'low' && styles.filterBtnTextActive]}>
                    Thiếu hụt
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Stock List */}
              <FlatList
                data={filteredStocks}
                keyExtractor={item => item.id}
                refreshing={loading}
                onRefresh={loadData}
                renderItem={({ item }) => (
                  <View style={styles.stockCard}>
                    <View style={styles.stockInfo}>
                      <Text style={styles.stockName}>{item.name}</Text>
                      <View style={styles.stockMeta}>
                        <Text style={styles.stockLabel}>
                          {item.type === 'ingredient' ? 'Nguyên liệu' : 'Bán lẻ'}
                        </Text>
                        <Text style={styles.divider}>|</Text>
                        <Text style={styles.stockMin}>Tối thiểu: {item.minStock} {item.unit}</Text>
                      </View>
                    </View>
                    <View style={styles.stockRight}>
                      <Text style={styles.stockQty}>{item.quantity.toFixed(1)} {item.unit}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status, item.quantity) + '15' }]}>
                        <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status, item.quantity) }]}>
                          {getStatusText(item.status, item.quantity)}
                        </Text>
                      </View>
                      {currentUserRole === 'ADMIN' && (
                        <TouchableOpacity
                          style={styles.editMinBtn}
                          onPress={() => handleOpenMinStock(item)}
                        >
                          <Text style={styles.editMinBtnText}>✏️ Sửa định mức</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <ClipboardList color="#b0bec5" size={48} />
                    <Text style={styles.emptyText}>Không tìm thấy mặt hàng nào.</Text>
                  </View>
                }
              />
            </View>
          )}

          {/* ================= KIỂM KHO ================= */}
          {subTab === 'audit' && (
            <View style={styles.tabContent}>
              {currentUserRole === 'ADMIN' && (
                <TouchableOpacity style={styles.mainActionBtn} onPress={handleCreateAudit}>
                  <Plus color="#ffffff" size={16} />
                  <Text style={styles.mainActionBtnText}>Bắt đầu đợt kiểm mới</Text>
                </TouchableOpacity>
              )}

              <FlatList
                data={audits}
                keyExtractor={item => item.id}
                refreshing={loading}
                onRefresh={loadData}
                renderItem={({ item }) => (
                  <View style={styles.auditCard}>
                    <View style={styles.auditHeader}>
                      <Text style={styles.auditCode}>#{item.id.substring(0, 8).toUpperCase()}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: item.status === 'PENDING' ? '#ef6c0015' : '#2e7d3215' }]}>
                        <Text style={[styles.statusBadgeText, { color: item.status === 'PENDING' ? '#ef6c00' : '#2e7d32' }]}>
                          {item.status === 'PENDING' ? 'Đang đếm' : 'Đã chốt'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.auditDate}>
                      Ngày tạo: {new Date(auditCreatedAtString(item)).toLocaleDateString('vi-VN')} {new Date(auditCreatedAtString(item)).toLocaleTimeString('vi-VN')}
                    </Text>
                    {item.notes && <Text style={styles.auditNotes}>Lưu ý: {item.notes}</Text>}
                    
                    <View style={styles.auditActions}>
                      <TouchableOpacity
                        style={[styles.auditBtn, styles.auditBtnSec]}
                        onPress={() => handleOpenAudit(item)}
                      >
                        <Text style={styles.auditBtnTextSec}>📝 Xem số liệu / Đếm</Text>
                      </TouchableOpacity>
                      {item.status === 'PENDING' && currentUserRole === 'ADMIN' && (
                        <TouchableOpacity
                          style={[styles.auditBtn, styles.auditBtnPrim]}
                          onPress={() => handleAdjustAudit(item.id)}
                        >
                          <Text style={styles.auditBtnTextPrim}>✔️ Cân bằng kho</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <ClipboardList color="#b0bec5" size={48} />
                    <Text style={styles.emptyText}>Chưa có đợt kiểm kho nào.</Text>
                  </View>
                }
              />
            </View>
          )}

          {/* ================= NHẬP HÀNG ================= */}
          {subTab === 'import' && (
            <View style={styles.tabContent}>
              <TouchableOpacity style={styles.mainActionBtn} onPress={handleOpenImport}>
                <Plus color="#ffffff" size={16} />
                <Text style={styles.mainActionBtnText}>Tạo phiếu nhập kho</Text>
              </TouchableOpacity>

              <View style={styles.importListWrapper}>
                <RefreshCw color="#8d6e63" size={32} />
                <Text style={styles.importTitle}>Nhập kho nhà cung cấp</Text>
                <Text style={styles.importDesc}>
                  Chức năng cho phép nhân viên/quản lý nhận hàng từ nhà cung cấp ngoài, tăng tồn kho của chi nhánh và tự động cập nhật giá vốn trung bình của các loại nguyên vật liệu.
                </Text>
                <TouchableOpacity style={styles.importDetailsBtn} onPress={handleOpenImport}>
                  <Text style={styles.importDetailsBtnText}>Tạo phiếu ngay</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {/* ─── MODAL 1: SỬA TỒN TỐI THIỂU ──────────────────────────────────────── */}
      <Modal visible={showMinStockModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalWrapperSmall}>
            <Text style={styles.modalTitle}>Cấu hình tồn tối thiểu</Text>
            {selectedStockItem && (
              <View style={styles.modalContentSmall}>
                <Text style={styles.modalItemName}>{selectedStockItem.name}</Text>
                <Text style={styles.modalItemUnit}>Đơn vị: {selectedStockItem.unit}</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Định mức tồn tối thiểu</Text>
                  <TextInput
                    value={minStockValue}
                    onChangeText={setMinStockValue}
                    keyboardType="numeric"
                    style={styles.modalInput}
                  />
                </View>
                <View style={styles.modalActionRow}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnCancel]}
                    onPress={() => setShowMinStockModal(false)}
                  >
                    <Text style={styles.modalBtnCancelText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnConfirm]}
                    onPress={handleSaveMinStock}
                    disabled={actionLoading}
                  >
                    <Text style={styles.modalBtnConfirmText}>Lưu lại</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 2: CHI TIẾT KIỂM / ĐẾM ───────────────────────────────────── */}
      <Modal visible={showAuditModal} transparent animationType="slide">
        <SafeAreaView style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalWrapperLarge}
          >
            <View style={styles.modalHeaderLarge}>
              <View>
                <Text style={styles.modalTitleLarge}>Phiếu kiểm đếm kho</Text>
                {activeAudit && (
                  <Text style={styles.modalSubtitleLarge}>
                    Mã đợt: #{activeAudit.id.substring(0, 8).toUpperCase()}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setShowAuditModal(false)}>
                <Text style={{ fontSize: 22, color: '#3e2723', fontWeight: 'bold', padding: 4 }}>✕</Text>
              </TouchableOpacity>
            </View>

            {activeAudit && (
              <FlatList
                data={activeAudit.items}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
                renderItem={({ item }) => {
                  const name = item.ingredientId ? item.ingredient?.name : item.product?.name;
                  const unit = item.ingredientId ? item.ingredient?.unit : 'Cái';
                  const key = item.ingredientId ? `ing_${item.ingredientId}` : `prod_${item.productId}`;
                  const currentCount = auditCounts[key] !== undefined ? auditCounts[key] : String(item.actualQty);
                  const isReadOnly = activeAudit.status !== 'PENDING';

                  return (
                    <View style={styles.auditItemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.auditItemName}>{name || 'Chưa rõ'}</Text>
                        <Text style={styles.auditItemSystem}>Hệ thống: {item.systemQty.toFixed(1)} {unit}</Text>
                      </View>
                      <View style={styles.auditItemInputRow}>
                        <TextInput
                          value={currentCount}
                          onChangeText={val => setAuditCounts({ ...auditCounts, [key]: val })}
                          keyboardType="numeric"
                          editable={!isReadOnly}
                          style={[styles.auditItemTextInput, isReadOnly && { backgroundColor: '#efebe9', color: '#8d6e63' }]}
                        />
                        <Text style={styles.auditItemUnit}>{unit}</Text>
                      </View>
                    </View>
                  );
                }}
              />
            )}

            {activeAudit && activeAudit.status === 'PENDING' && (
              <View style={styles.modalLargeActionRow}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnCancel]}
                  onPress={() => setShowAuditModal(false)}
                >
                  <Text style={styles.modalBtnCancelText}>Quay lại</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnConfirm]}
                  onPress={handleSaveAuditCounts}
                  disabled={actionLoading}
                >
                  <Text style={styles.modalBtnConfirmText}>Lưu số liệu kiểm</Text>
                </TouchableOpacity>
              </View>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* ─── MODAL 3: NHẬP KHO NCC ────────────────────────────────────────── */}
      <Modal visible={showImportModal} transparent animationType="slide">
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalWrapperLarge}>
            <View style={styles.modalHeaderLarge}>
              <View>
                <Text style={styles.modalTitleLarge}>Lập phiếu nhập kho</Text>
                <Text style={styles.modalSubtitleLarge}>Chọn nhà cung cấp và nhập số lượng hàng hóa</Text>
              </View>
              <TouchableOpacity onPress={() => setShowImportModal(false)}>
                <Text style={{ fontSize: 22, color: '#3e2723', fontWeight: 'bold', padding: 4 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
              {/* Select Supplier */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Nhà cung cấp *</Text>
                <View style={styles.pickerFake}>
                  <TextInput
                    editable={false}
                    value={suppliers.find(s => s.id === selectedSupplierId)?.name || 'Chưa chọn'}
                    style={{ fontWeight: 'bold', color: '#3e2723' }}
                  />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                  {suppliers.map(sup => (
                    <TouchableOpacity
                      key={sup.id}
                      onPress={() => setSelectedSupplierId(sup.id)}
                      style={[styles.supBubble, selectedSupplierId === sup.id && styles.supBubbleActive]}
                    >
                      <Text style={[styles.supBubbleText, selectedSupplierId === sup.id && styles.supBubbleTextActive]}>
                        {sup.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Notes */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Ghi chú phiếu nhập</Text>
                <TextInput
                  placeholder="VD: Nhập nguyên liệu sữa đặc bơ chuẩn bị cuối tuần..."
                  value={importNotes}
                  onChangeText={setImportNotes}
                  style={styles.modalInput}
                />
              </View>

              {/* Import Items */}
              <View style={styles.importItemsWrapper}>
                <View style={styles.importItemsHeader}>
                  <Text style={styles.importItemsTitle}>Chi tiết hàng nhập</Text>
                  <TouchableOpacity style={styles.addItemRowBtn} onPress={handleAddImportItem}>
                    <Plus color="#3e2723" size={14} />
                    <Text style={styles.addItemRowBtnText}>Thêm dòng</Text>
                  </TouchableOpacity>
                </View>

                {importItems.map((item, index) => {
                  const selectedIng = ingredients.find(i => i.id === item.ingredientId);
                  return (
                    <View key={index} style={styles.importItemRow}>
                      <View style={{ flex: 1, gap: 6 }}>
                        {/* Select Ingredient */}
                        <Text style={styles.inputLabel}>Nguyên liệu {index + 1}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          {ingredients.map(ing => (
                            <TouchableOpacity
                              key={ing.id}
                              onPress={() => handleImportItemChange(index, 'itemId', ing.id)}
                              style={[styles.supBubble, item.ingredientId === ing.id && styles.supBubbleActive]}
                            >
                              <Text style={[styles.supBubbleText, item.ingredientId === ing.id && styles.supBubbleTextActive]}>
                                {ing.name} ({ing.unit})
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>

                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                        {/* Quantity */}
                        <View style={{ flex: 1 }}>
                          <Text style={styles.inputLabel}>Số lượng ({selectedIng?.unit || 'g'})</Text>
                          <TextInput
                            keyboardType="numeric"
                            value={item.quantity}
                            onChangeText={val => handleImportItemChange(index, 'quantity', val)}
                            style={styles.smallInput}
                          />
                        </View>
                        {/* Unit Price */}
                        <View style={{ flex: 1.5 }}>
                          <Text style={styles.inputLabel}>Giá nhập (đ)</Text>
                          <TextInput
                            keyboardType="numeric"
                            value={item.unitPrice}
                            onChangeText={val => handleImportItemChange(index, 'unitPrice', val)}
                            style={styles.smallInput}
                          />
                        </View>
                        {/* Remove button */}
                        <TouchableOpacity
                          style={styles.removeRowBtn}
                          onPress={() => handleRemoveImportItem(index)}
                        >
                          <Text style={{ fontSize: 18, color: '#c62828', fontWeight: 'bold' }}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.modalLargeActionRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setShowImportModal(false)}
              >
                <Text style={styles.modalBtnCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={handleSaveImport}
                disabled={actionLoading}
              >
                <Text style={styles.modalBtnConfirmText}>Nhập kho</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// Helpers
function auditCreatedAtString(item: InventoryAudit): string {
  return item.createdAt;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fbf9f6',
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8d6e63',
  },
  subTabHeader: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#efebe9',
    paddingHorizontal: 8,
    paddingVertical: 10,
    gap: 8,
  },
  subTabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    backgroundColor: '#f5f5f5',
  },
  subTabButtonActive: {
    backgroundColor: '#3e2723',
  },
  subTabButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8d6e63',
  },
  subTabButtonTextActive: {
    color: '#ffffff',
  },
  tabContent: {
    flex: 1,
    padding: 12,
  },
  searchBarRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#efebe9',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#3e2723',
    fontWeight: '600',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#efebe9',
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 6,
    height: 42,
  },
  filterBtnActive: {
    backgroundColor: '#ef6c00',
    borderColor: '#ef6c00',
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ef6c00',
  },
  filterBtnTextActive: {
    color: '#ffffff',
  },
  stockCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#efebe9',
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 2 },
  },
  stockInfo: {
    flex: 1.5,
    justifyContent: 'space-between',
  },
  stockName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3e2723',
  },
  stockMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  stockLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8d6e63',
    textTransform: 'uppercase',
  },
  divider: {
    color: '#efebe9',
  },
  stockMin: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8d6e63',
  },
  stockRight: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  stockQty: {
    fontSize: 14,
    fontWeight: 'black',
    color: '#3e2723',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  editMinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 8,
  },
  editMinBtnText: {
    fontSize: 10,
    color: '#8d6e63',
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    color: '#8d6e63',
    fontWeight: '600',
  },
  mainActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3e2723',
    borderRadius: 10,
    height: 42,
    gap: 6,
    marginBottom: 12,
  },
  mainActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  auditCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#efebe9',
    padding: 14,
    marginBottom: 10,
    gap: 8,
  },
  auditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  auditCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3e2723',
  },
  auditDate: {
    fontSize: 11,
    color: '#8d6e63',
    fontWeight: '600',
  },
  auditNotes: {
    fontSize: 11,
    color: '#5d4037',
    fontStyle: 'italic',
    backgroundColor: '#fbe9e7',
    padding: 8,
    borderRadius: 8,
  },
  auditActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  auditBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    borderRadius: 8,
    gap: 6,
  },
  auditBtnSec: {
    backgroundColor: '#efebe9',
  },
  auditBtnPrim: {
    backgroundColor: '#3e2723',
  },
  auditBtnTextSec: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#5d4037',
  },
  auditBtnTextPrim: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  importListWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  importTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3e2723',
  },
  importDesc: {
    fontSize: 12,
    textAlign: 'center',
    color: '#8d6e63',
    lineHeight: 18,
    fontWeight: '500',
  },
  importDetailsBtn: {
    backgroundColor: '#3e2723',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  importDetailsBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  // Modals Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalWrapperSmall: {
    width: '90%',
    maxWidth: 320,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3e2723',
    borderBottomWidth: 1,
    borderBottomColor: '#efebe9',
    paddingBottom: 10,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalContentSmall: {
    gap: 12,
  },
  modalItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3e2723',
  },
  modalItemUnit: {
    fontSize: 12,
    color: '#8d6e63',
    fontWeight: 'bold',
  },
  inputWrapper: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#8d6e63',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#efebe9',
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '600',
    color: '#3e2723',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    backgroundColor: '#efebe9',
  },
  modalBtnConfirm: {
    backgroundColor: '#3e2723',
  },
  modalBtnCancelText: {
    fontSize: 12,
    color: '#5d4037',
    fontWeight: 'bold',
  },
  modalBtnConfirmText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
  },

  // Large Modal
  modalWrapperLarge: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fbf9f6',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeaderLarge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#efebe9',
  },
  modalTitleLarge: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3e2723',
  },
  modalSubtitleLarge: {
    fontSize: 10,
    color: '#8d6e63',
    fontWeight: '600',
    marginTop: 2,
  },
  modalLargeActionRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#efebe9',
    padding: 12,
    gap: 8,
  },

  // Audit Row
  auditItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#efebe9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  auditItemName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#3e2723',
  },
  auditItemSystem: {
    fontSize: 10,
    color: '#8d6e63',
    fontWeight: 'bold',
    marginTop: 4,
  },
  auditItemInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  auditItemTextInput: {
    borderWidth: 1,
    borderColor: '#efebe9',
    borderRadius: 8,
    width: 72,
    height: 36,
    textAlign: 'right',
    paddingHorizontal: 8,
    fontSize: 13,
    fontWeight: 'black',
    color: '#3e2723',
    backgroundColor: '#ffffff',
  },
  auditItemUnit: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#8d6e63',
    width: 24,
  },

  // Import form details
  pickerFake: {
    borderWidth: 1,
    borderColor: '#efebe9',
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  supBubble: {
    backgroundColor: '#efebe9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#efebe9',
  },
  supBubbleActive: {
    backgroundColor: '#3e2723',
    borderColor: '#3e2723',
  },
  supBubbleText: {
    fontSize: 11,
    color: '#5d4037',
    fontWeight: 'bold',
  },
  supBubbleTextActive: {
    color: '#ffffff',
  },
  importItemsWrapper: {
    gap: 10,
  },
  importItemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#efebe9',
    paddingBottom: 6,
  },
  importItemsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3e2723',
  },
  addItemRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  addItemRowBtnText: {
    fontSize: 11,
    color: '#3e2723',
    fontWeight: 'bold',
  },
  importItemRow: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#efebe9',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  smallInput: {
    borderWidth: 1,
    borderColor: '#efebe9',
    borderRadius: 6,
    height: 32,
    paddingHorizontal: 8,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#3e2723',
    backgroundColor: '#ffffff',
    textAlign: 'right',
  },
  removeRowBtn: {
    justifyContent: 'flex-end',
    paddingBottom: 6,
    paddingHorizontal: 6,
  },
});
