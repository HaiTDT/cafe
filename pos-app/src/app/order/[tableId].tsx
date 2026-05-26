import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { posApi, CafeProduct, CafeCategory, CafeOrder, PaymentMethod, formatPrice, ApiError } from '@/lib/api';
import { ChevronLeft, Plus, Minus, Trash2, CreditCard, DollarSign, Wallet, QrCode, CheckCircle2, ShoppingBag } from 'lucide-react-native';
import ScaleButton from '@/components/ScaleButton';

interface CartItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  notes: string;
}

export default function OrderScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { tableId, tableName, tableStatus } = useLocalSearchParams<{
    tableId: string;
    tableName: string;
    tableStatus: string;
  }>();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'bill' | 'menu'>('bill');

  // Menu states
  const [products, setProducts] = useState<CafeProduct[]>([]);
  const [categories, setCategories] = useState<CafeCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart / Order states
  const [activeOrder, setActiveOrder] = useState<CafeOrder | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  // Checkout modal states
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [customerMoney, setCustomerMoney] = useState('');
  const [changeMoney, setChangeMoney] = useState(0);

  // Status
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Load menu items & active order details
  const initData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Tải danh mục & món nước
      const [catsData, prodsData] = await Promise.all([
        posApi.getCategories(),
        posApi.getProducts({ showInactive: false }),
      ]);
      setCategories(catsData);
      setProducts(prodsData);

      // 2. Nếu bàn đang bận, tải hóa đơn hiện tại
      if (tableStatus !== 'EMPTY') {
        const order = await posApi.getOrderByTable(tableId);
        setActiveOrder(order);

        if (order && order.items) {
          const items: CartItem[] = order.items.map(item => ({
            productId: item.productId || '',
            productName: item.productName,
            unitPrice: Number(item.unitPrice),
            quantity: item.quantity,
            notes: item.notes || '',
          }));
          setCartItems(items);
        }
      } else {
        // Bàn trống -> Khởi tạo giỏ hàng rỗng
        setActiveOrder(null);
        setCartItems([]);
        setActiveTab('menu'); // Tự động chuyển qua tab menu để chọn món
      }
    } catch (err: any) {
      console.error('Lỗi load order:', err);
      Alert.alert('Lỗi', 'Không thể kết nối máy chủ để tải thông tin bàn.');
    } finally {
      setLoading(false);
    }
  }, [tableId, tableStatus]);

  useEffect(() => {
    initData();
  }, [initData]);

  // Bộ lọc sản phẩm ở Tab Menu
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategoryId === 'all' || p.categoryId === selectedCategoryId;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategoryId, searchQuery]);

  // Tổng tiền tạm tính
  const totalAmount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cartItems]);

  // Tính tiền thối
  useEffect(() => {
    const money = Number(customerMoney);
    if (!isNaN(money) && money >= totalAmount) {
      setChangeMoney(money - totalAmount);
    } else {
      setChangeMoney(0);
    }
  }, [customerMoney, totalAmount]);

  // Tự động lưu bill (lưu trong nền)
  const performAutoSave = async (items: CartItem[]) => {
    if (items.length === 0 && !activeOrder) return;

    try {
      const payload = items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        notes: item.notes || undefined,
      }));

      if (activeOrder) {
        // Cập nhật bill
        const updated = await posApi.updateOrderItems(activeOrder.id, { items: payload });
        setActiveOrder(updated);
      } else {
        // Tạo bill mới
        const created = await posApi.createOrder({
          tableId,
          items: payload,
        });
        setActiveOrder(created);
      }
      setToastMsg('Đã tự động lưu bill');
      setTimeout(() => setToastMsg(''), 1200);
    } catch (err: any) {
      console.error('Lỗi tự động lưu:', err);
      setToastMsg('Lỗi lưu tự động!');
      setTimeout(() => setToastMsg(''), 1500);
    }
  };

  // Thêm món vào giỏ hàng
  const handleAddProduct = (product: CafeProduct) => {
    if (!product.isAvailable) {
      Alert.alert('Thông báo', 'Món nước này hiện đã hết hàng.');
      return;
    }

    let updatedItems: CartItem[] = [];
    const existing = cartItems.find(item => item.productId === product.id);
    if (existing) {
      updatedItems = cartItems.map(item =>
        item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      updatedItems = [
        ...cartItems,
        {
          productId: product.id,
          productName: product.name,
          unitPrice: Number(product.price),
          quantity: 1,
          notes: '',
        },
      ];
    }

    setCartItems(updatedItems);
    performAutoSave(updatedItems);

    setToastMsg(`Đã thêm ${product.name}`);
    setTimeout(() => setToastMsg(''), 1200);
  };

  // Cập nhật số lượng
  const updateQuantity = (productId: string, delta: number) => {
    const updatedItems = cartItems.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta;
        return { ...item, quantity: newQty > 0 ? newQty : 1 };
      }
      return item;
    });

    setCartItems(updatedItems);
    performAutoSave(updatedItems);
  };

  // Xóa món khỏi giỏ hàng
  const handleRemoveItem = (productId: string) => {
    const updatedItems = cartItems.filter(item => item.productId !== productId);
    setCartItems(updatedItems);
    performAutoSave(updatedItems);
  };

  // Cập nhật ghi chú
  const handleUpdateNotes = (productId: string, text: string) => {
    setCartItems(prev =>
      prev.map(item => (item.productId === productId ? { ...item, notes: text } : item))
    );
  };

  // Lưu bill (Tạo mới hoặc cập nhật lên Server)
  const handleSaveOrder = async (): Promise<string | null> => {
    if (cartItems.length === 0) {
      Alert.alert('Cảnh báo', 'Hóa đơn rỗng. Vui lòng chọn ít nhất 1 món.');
      return null;
    }

    setActionLoading(true);
    try {
      const payload = cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        notes: item.notes || undefined,
      }));

      if (activeOrder) {
        // Cập nhật order có sẵn
        const updated = await posApi.updateOrderItems(activeOrder.id, { items: payload });
        setActiveOrder(updated);
        Alert.alert('Thành công', 'Đã cập nhật hóa đơn.');
        return updated.id;
      } else {
        // Tạo order mới
        const created = await posApi.createOrder({
          tableId,
          items: payload,
        });
        setActiveOrder(created);
        Alert.alert('Thành công', 'Đã lưu hóa đơn mới và đổi trạng thái bàn.');
        return created.id;
      }
    } catch (err: any) {
      console.error('Lưu hóa đơn thất bại:', err);
      Alert.alert('Thất bại', err.message || 'Lỗi hệ thống khi lưu hóa đơn.');
      return null;
    } finally {
      setActionLoading(false);
    }
  };

  // Tiến hành thanh toán
  const handlePayOrder = async () => {
    setActionLoading(true);
    try {
      // 1. Tự động lưu bill trước nếu chưa lưu hoặc có thay đổi
      let orderId = activeOrder?.id;
      if (!orderId) {
        const savedId = await handleSaveOrder();
        if (!savedId) return;
        orderId = savedId;
      } else {
        // Lưu/cập nhật lại món nước trên server trước khi chốt thanh toán
        const payload = cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          notes: item.notes || undefined,
        }));
        await posApi.updateOrderItems(orderId, { items: payload });
      }

      // 2. Chốt thanh toán
      await posApi.payOrder(orderId, { paymentMethod });
      
      setShowPayModal(false);
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error('Lỗi thanh toán:', err);
      Alert.alert('Thất bại', err.message || 'Lỗi khi thực hiện thanh toán.');
    } finally {
      setActionLoading(false);
    }
  };

  const renderBillSection = () => (
    <View style={{ flex: 1 }}>
      {cartItems.length === 0 ? (
        <View style={styles.emptyCartContainer}>
          <ShoppingBag color="#b0bec5" size={48} />
          <Text style={styles.emptyCartText}>
            {width >= 768 
              ? 'Chưa gọi món nào. Vui lòng chọn món ở danh mục bên cạnh.' 
              : 'Chưa gọi món nào. Vui lòng chuyển sang tab "Thêm Món".'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={cartItems}
          keyExtractor={item => item.productId}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <View style={styles.cartItemRow}>
              <View style={styles.cartItemHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cartItemName}>{item.productName}</Text>
                  <Text style={styles.cartItemPrice}>{formatPrice(item.unitPrice)}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.deleteItemBtn}
                  onPress={() => handleRemoveItem(item.productId)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Trash2 color="#c62828" size={20} />
                </TouchableOpacity>
              </View>

              {/* Quantity Selector & Notes Input */}
              <View style={styles.cartItemFooter}>
                <TextInput
                  style={styles.cartItemNotes}
                  placeholder="Ghi chú (ít đá, nhiều đường...)"
                  placeholderTextColor="#a1887f"
                  value={item.notes}
                  onChangeText={(text) => handleUpdateNotes(item.productId, text)}
                  onBlur={() => performAutoSave(cartItems)}
                />

                <View style={styles.qtyContainer}>
                  <TouchableOpacity 
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.productId, -1)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Minus color="#5d4037" size={16} />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity 
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.productId, 1)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Plus color="#5d4037" size={16} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* Total Footer Controls */}
      {cartItems.length > 0 && (
        <View style={styles.footerContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TỔNG TẠM TÍNH:</Text>
            <Text style={styles.totalPriceVal}>{formatPrice(totalAmount)}</Text>
          </View>

          <View style={styles.actionRow}>
            <ScaleButton
              style={[styles.actionBtn, styles.payBtn, { height: 56, flex: 1 }]}
              onPress={() => setShowPayModal(true)}
              disabled={actionLoading}
            >
              <Text style={[styles.actionBtnText, { color: '#ffffff', fontSize: 16, letterSpacing: 1 }]}>
                TIẾN HÀNH THANH TOÁN
              </Text>
            </ScaleButton>
          </View>
        </View>
      )}
    </View>
  );

  const renderMenuSection = () => (
    <View style={{ flex: 1 }}>
      {/* Search Input inside Catalog tab */}
      <View style={styles.menuSearchWrapper}>
        <TextInput
          style={styles.menuSearchInput}
          placeholder="Tìm món gọi nhanh..."
          placeholderTextColor="#a1887f"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category tabs scroll */}
      <View style={styles.menuCatBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 4, gap: 8 }}>
          <TouchableOpacity
            style={[styles.menuCatTab, selectedCategoryId === 'all' && styles.menuCatTabActive]}
            onPress={() => setSelectedCategoryId('all')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.menuCatTabText, selectedCategoryId === 'all' && styles.menuCatTabTextActive]}>Tất cả</Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.menuCatTab, selectedCategoryId === cat.id && styles.menuCatTabActive]}
              onPress={() => setSelectedCategoryId(cat.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.menuCatTabText, selectedCategoryId === cat.id && styles.menuCatTabTextActive]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Products grid */}
      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.catalogItemRow, !item.isAvailable && styles.catalogItemUnavailable]}
            onPress={() => handleAddProduct(item)}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.catalogItemName}>{item.name}</Text>
              <Text style={styles.catalogItemPrice}>{formatPrice(item.price)}</Text>
            </View>
            <View style={styles.catalogItemAction}>
              {item.isAvailable ? (
                <View style={styles.catalogAddBtn}>
                  <Plus color="#ffffff" size={16} />
                </View>
              ) : (
                <Text style={styles.catalogSoldOutText}>HẾT MÓN</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3e2723" />
        <Text style={styles.loadingText}>Đang tải thông tin bàn...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft color="#ffffff" size={24} />
          <Text style={styles.headerTitle}>{tableName}</Text>
        </TouchableOpacity>
        
        {toastMsg ? (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toastMsg}</Text>
          </View>
        ) : null}
      </View>

      {/* Segmented Control Tabs (Only visible on Phones) */}
      {width < 768 && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'bill' && styles.tabActive]}
            onPress={() => setActiveTab('bill')}
          >
            <Text style={[styles.tabText, activeTab === 'bill' && styles.tabTextActive]}>
              Hóa Đơn ({cartItems.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'menu' && styles.tabActive]}
            onPress={() => setActiveTab('menu')}
          >
            <Text style={[styles.tabText, activeTab === 'menu' && styles.tabTextActive]}>
              Thêm Món
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* TAB / Split-Screen Content */}
      <View style={[styles.content, width >= 768 && styles.tabletContentContainer]}>
        {width >= 768 ? (
          <>
            {/* Left Side: BILL DETAIL */}
            <View style={styles.tabletBillSection}>
              <View style={styles.sectionHeaderContainer}>
                <Text style={styles.sectionHeaderText}>CHI TIẾT HÓA ĐƠN</Text>
              </View>
              {renderBillSection()}
            </View>

            {/* Right Side: MENU CATALOG */}
            <View style={styles.tabletMenuSection}>
              <View style={styles.sectionHeaderContainer}>
                <Text style={styles.sectionHeaderText}>THỰC ĐƠN GỌI MÓN</Text>
              </View>
              {renderMenuSection()}
            </View>
          </>
        ) : (
          /* Phone Mode: Single tab rendering */
          activeTab === 'bill' ? renderBillSection() : renderMenuSection()
        )}
      </View>

      {/* Checkout Modal */}
      <Modal
        visible={showPayModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPayModal(false)}
      >
        <View style={[styles.modalOverlay, width >= 768 && styles.tabletModalOverlay]}>
          <View style={[styles.modalContent, width >= 768 && styles.tabletModalContent]}>
            <Text style={styles.modalTitle}>XÁC NHẬN THANH TOÁN</Text>
            
            <View style={styles.modalTotalBox}>
              <Text style={styles.modalTotalLabel}>TỔNG TIỀN PHẢI TRẢ</Text>
              <Text style={styles.modalTotalPrice}>{formatPrice(totalAmount)}</Text>
            </View>

            {/* Payment Method Selectors */}
            <Text style={styles.payLabel}>PHƯƠNG THỨC THANH TOÁN</Text>
            <View style={styles.payMethodGrid}>
              <TouchableOpacity
                style={[styles.payMethodItem, paymentMethod === 'CASH' && styles.payMethodItemActive]}
                onPress={() => setPaymentMethod('CASH')}
              >
                <DollarSign color={paymentMethod === 'CASH' ? '#ffffff' : '#3e2723'} size={20} />
                <Text style={[styles.payMethodText, paymentMethod === 'CASH' && styles.payMethodTextActive]}>Tiền mặt</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.payMethodItem, paymentMethod === 'BANK_TRANSFER' && styles.payMethodItemActive]}
                onPress={() => setPaymentMethod('BANK_TRANSFER')}
              >
                <QrCode color={paymentMethod === 'BANK_TRANSFER' ? '#ffffff' : '#3e2723'} size={20} />
                <Text style={[styles.payMethodText, paymentMethod === 'BANK_TRANSFER' && styles.payMethodTextActive]}>Chuyển khoản</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.payMethodItem, paymentMethod === 'E_WALLET' && styles.payMethodItemActive]}
                onPress={() => setPaymentMethod('E_WALLET')}
              >
                <Wallet color={paymentMethod === 'E_WALLET' ? '#ffffff' : '#3e2723'} size={20} />
                <Text style={[styles.payMethodText, paymentMethod === 'E_WALLET' && styles.payMethodTextActive]}>Ví điện tử</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.payMethodItem, paymentMethod === 'CARD' && styles.payMethodItemActive]}
                onPress={() => setPaymentMethod('CARD')}
              >
                <CreditCard color={paymentMethod === 'CARD' ? '#ffffff' : '#3e2723'} size={20} />
                <Text style={[styles.payMethodText, paymentMethod === 'CARD' && styles.payMethodTextActive]}>Thẻ ATM</Text>
              </TouchableOpacity>
            </View>

            {/* Cash Calculator if Payment Method is CASH */}
            {paymentMethod === 'CASH' ? (
              <View style={styles.cashCalculator}>
                <Text style={styles.payLabel}>TIỀN KHÁCH ĐƯA</Text>
                <TextInput
                  style={styles.cashInput}
                  placeholder="Nhập số tiền..."
                  placeholderTextColor="#a1887f"
                  keyboardType="numeric"
                  value={customerMoney}
                  onChangeText={setCustomerMoney}
                />

                <Text style={styles.payLabel}>TIỀN THỐI LẠI (CHANGE)</Text>
                <Text style={styles.changeMoneyText}>{formatPrice(changeMoney)}</Text>
              </View>
            ) : null}

            {/* Modal Controls */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCloseBtn]}
                onPress={() => setShowPayModal(false)}
              >
                <Text style={styles.modalCloseBtnText}>HỦY BỎ</Text>
              </TouchableOpacity>

              <ScaleButton
                style={[styles.modalBtn, styles.modalConfirmBtn]}
                onPress={handlePayOrder}
                disabled={actionLoading}
              >
                <Text style={styles.modalConfirmBtnText}>HOÀN TẤT</Text>
              </ScaleButton>
            </View>

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfbf7',
  },
  header: {
    height: 56,
    backgroundColor: '#3e2723',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  toast: {
    backgroundColor: '#4caf50',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  toastText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#efebe9',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderColor: 'transparent',
  },
  tabActive: {
    borderColor: '#3e2723',
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8d6e63',
  },
  tabTextActive: {
    color: '#3e2723',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#5d4037',
    fontSize: 14,
  },
  emptyCartContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  emptyCartText: {
    fontSize: 14,
    color: '#8d6e63',
    textAlign: 'center',
    lineHeight: 20,
  },
  cartItemRow: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#efebe9',
    padding: 12,
    marginBottom: 10,
  },
  cartItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3e2723',
  },
  cartItemPrice: {
    fontSize: 12,
    color: '#8d6e63',
    marginTop: 2,
  },
  deleteItemBtn: {
    padding: 8,
  },
  cartItemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  cartItemNotes: {
    flex: 1,
    height: 36,
    backgroundColor: '#fbe9e7',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 12,
    color: '#3e2723',
    borderWidth: 1,
    borderColor: '#ffccbc',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#efebe9',
    borderRadius: 8,
    height: 36,
  },
  qtyBtn: {
    paddingHorizontal: 10,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3e2723',
    minWidth: 24,
    textAlign: 'center',
  },
  footerContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderColor: '#efebe9',
    padding: 16,
    gap: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#5d4037',
  },
  totalPriceVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e65100',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    borderWidth: 1,
    borderColor: '#d7ccc8',
    backgroundColor: '#ffffff',
  },
  payBtn: {
    backgroundColor: '#e65100',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3e2723',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  // Menu tab styles
  menuSearchWrapper: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#efebe9',
  },
  menuSearchInput: {
    height: 38,
    backgroundColor: '#fbe9e7',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#3e2723',
    borderWidth: 1,
    borderColor: '#ffccbc',
    fontSize: 13,
  },
  menuCatBar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#efebe9',
    paddingVertical: 8,
  },
  menuCatTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#efebe9',
  },
  menuCatTabActive: {
    backgroundColor: '#3e2723',
  },
  menuCatTabText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#5d4037',
  },
  menuCatTabTextActive: {
    color: '#ffffff',
  },
  catalogItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#efebe9',
    padding: 12,
    marginBottom: 8,
  },
  catalogItemUnavailable: {
    opacity: 0.5,
  },
  catalogItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3e2723',
  },
  catalogItemPrice: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8d6e63',
    marginTop: 4,
  },
  catalogItemAction: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catalogAddBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3e2723',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catalogSoldOutText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#c62828',
  },
  // Checkout Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(62, 39, 35, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    shadowColor: '#3e2723',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3e2723',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1,
  },
  modalTotalBox: {
    backgroundColor: '#fbe9e7',
    borderWidth: 1,
    borderColor: '#ffccbc',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTotalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#8d6e63',
    letterSpacing: 0.5,
  },
  modalTotalPrice: {
    fontSize: 24,
    fontWeight: 'black',
    color: '#e65100',
    marginTop: 6,
  },
  payLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#5d4037',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  payMethodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  payMethodItem: {
    width: '48%',
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d7ccc8',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  payMethodItemActive: {
    backgroundColor: '#3e2723',
    borderColor: '#3e2723',
  },
  payMethodText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3e2723',
  },
  payMethodTextActive: {
    color: '#ffffff',
  },
  cashCalculator: {
    marginBottom: 20,
  },
  cashInput: {
    height: 48,
    backgroundColor: '#efebe9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d7ccc8',
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#3e2723',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  changeMoneyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtn: {
    borderWidth: 1,
    borderColor: '#efebe9',
    backgroundColor: '#ffffff',
  },
  modalCloseBtnText: {
    color: '#8d6e63',
    fontWeight: 'bold',
    fontSize: 13,
  },
  modalConfirmBtn: {
    backgroundColor: '#3e2723',
  },
  modalConfirmBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  tabletContentContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  tabletBillSection: {
    flex: 4,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#efebe9',
    overflow: 'hidden',
    shadowColor: '#5d4037',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  tabletMenuSection: {
    flex: 6,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#efebe9',
    overflow: 'hidden',
    shadowColor: '#5d4037',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionHeaderContainer: {
    backgroundColor: '#efebe9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#d7ccc8',
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#3e2723',
    letterSpacing: 1,
  },
  tabletModalOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(62, 39, 35, 0.5)',
  },
  tabletModalContent: {
    width: 500,
    borderRadius: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
});
