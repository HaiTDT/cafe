import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  useWindowDimensions,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { posApi, PosDashboardData, formatPrice } from '@/lib/api';
import { storage } from '@/lib/storage';
import { ShieldAlert, BarChart3, TrendingUp, ShoppingCart, Coins, RefreshCw } from 'lucide-react-native';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { CalendarRange, ChevronLeft, ChevronRight, X, ListFilter } = require('lucide-react-native');

// ─── Kiểu bộ lọc ───────────────────────────────────────────────────────────
type FilterPreset = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

interface DateRange {
  start: Date;
  end: Date;
}

// ─── Tính khoảng ngày theo preset ───────────────────────────────────────────
function getRangeFromPreset(preset: FilterPreset): DateRange {
  const now = new Date();
  const s = new Date(now);
  const e = new Date(now);

  switch (preset) {
    case 'today':
      s.setHours(0, 0, 0, 0);
      e.setHours(23, 59, 59, 999);
      break;

    case 'week': {
      const day = now.getDay(); // 0=CN, 1=T2...
      const diff = day === 0 ? -6 : 1 - day; // về thứ Hai
      s.setDate(now.getDate() + diff);
      s.setHours(0, 0, 0, 0);
      e.setDate(s.getDate() + 6);
      e.setHours(23, 59, 59, 999);
      break;
    }

    case 'month':
      s.setDate(1);
      s.setHours(0, 0, 0, 0);
      e.setMonth(e.getMonth() + 1, 0);
      e.setHours(23, 59, 59, 999);
      break;

    case 'quarter': {
      const q = Math.floor(now.getMonth() / 3);
      s.setMonth(q * 3, 1);
      s.setHours(0, 0, 0, 0);
      e.setMonth(q * 3 + 3, 0);
      e.setHours(23, 59, 59, 999);
      break;
    }

    case 'year':
      s.setMonth(0, 1);
      s.setHours(0, 0, 0, 0);
      e.setMonth(11, 31);
      e.setHours(23, 59, 59, 999);
      break;

    default:
      s.setHours(0, 0, 0, 0);
      e.setHours(23, 59, 59, 999);
  }
  return { start: s, end: e };
}

function toISO(d: Date) {
  return d.toISOString().split('T')[0]; // yyyy-mm-dd
}

function formatDateVN(d: Date) {
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

// ─── Nhãn preset ────────────────────────────────────────────────────────────
const PRESETS: { key: FilterPreset; label: string }[] = [
  { key: 'today', label: 'Hôm nay' },
  { key: 'week', label: 'Tuần' },
  { key: 'month', label: 'Tháng' },
  { key: 'quarter', label: 'Quý' },
  { key: 'year', label: 'Năm' },
  { key: 'custom', label: 'Tùy chỉnh' },
];

// ─── Mini date picker (không cần thư viện) ──────────────────────────────────
function InlineDatePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Date;
  onChange: (d: Date) => void;
}) {
  const changeDay = (delta: number) => {
    const d = new Date(value);
    d.setDate(d.getDate() + delta);
    onChange(d);
  };
  const changeMonth = (delta: number) => {
    const d = new Date(value);
    d.setMonth(d.getMonth() + delta);
    onChange(d);
  };
  const changeYear = (delta: number) => {
    const d = new Date(value);
    d.setFullYear(d.getFullYear() + delta);
    onChange(d);
  };

  const day = value.getDate().toString().padStart(2, '0');
  const month = (value.getMonth() + 1).toString().padStart(2, '0');
  const year = value.getFullYear().toString();

  return (
    <View style={dp.wrapper}>
      <Text style={dp.label}>{label}</Text>
      <View style={dp.row}>
        {/* Day */}
        <View style={dp.unitBox}>
          <TouchableOpacity onPress={() => changeDay(1)} style={dp.arrow}><ChevronLeft color="#6a1b9a" size={16} style={{ transform: [{ rotate: '90deg' }] }} /></TouchableOpacity>
          <Text style={dp.unitText}>{day}</Text>
          <TouchableOpacity onPress={() => changeDay(-1)} style={dp.arrow}><ChevronRight color="#6a1b9a" size={16} style={{ transform: [{ rotate: '90deg' }] }} /></TouchableOpacity>
        </View>
        <Text style={dp.sep}>/</Text>
        {/* Month */}
        <View style={dp.unitBox}>
          <TouchableOpacity onPress={() => changeMonth(1)} style={dp.arrow}><ChevronLeft color="#6a1b9a" size={16} style={{ transform: [{ rotate: '90deg' }] }} /></TouchableOpacity>
          <Text style={dp.unitText}>{month}</Text>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={dp.arrow}><ChevronRight color="#6a1b9a" size={16} style={{ transform: [{ rotate: '90deg' }] }} /></TouchableOpacity>
        </View>
        <Text style={dp.sep}>/</Text>
        {/* Year */}
        <View style={dp.unitBox}>
          <TouchableOpacity onPress={() => changeYear(1)} style={dp.arrow}><ChevronLeft color="#6a1b9a" size={16} style={{ transform: [{ rotate: '90deg' }] }} /></TouchableOpacity>
          <Text style={dp.unitText}>{year}</Text>
          <TouchableOpacity onPress={() => changeYear(-1)} style={dp.arrow}><ChevronRight color="#6a1b9a" size={16} style={{ transform: [{ rotate: '90deg' }] }} /></TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const dp = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '600', color: '#5d4037', marginBottom: 8, letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sep: { fontSize: 18, color: '#8d6e63', fontWeight: 'bold' },
  unitBox: { alignItems: 'center', backgroundColor: '#f3e5f5', borderRadius: 10, paddingVertical: 6, paddingHorizontal: 12, minWidth: 54 },
  arrow: { padding: 2 },
  unitText: { fontSize: 20, fontWeight: 'bold', color: '#4a148c', paddingVertical: 4 },
});

// ─── Component chính ─────────────────────────────────────────────────────────
export default function ExploreScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [data, setData] = useState<PosDashboardData | null>(null);
  const [role, setRole] = useState('STAFF');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter state
  const [activePreset, setActivePreset] = useState<FilterPreset>('today');
  const [customStart, setCustomStart] = useState<Date>(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  });
  const [customEnd, setCustomEnd] = useState<Date>(() => {
    const d = new Date(); d.setHours(23, 59, 59, 999); return d;
  });
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [pendingStart, setPendingStart] = useState(customStart);
  const [pendingEnd, setPendingEnd] = useState(customEnd);

  // Nhãn kỳ hiển thị
  const periodLabel = (() => {
    if (activePreset === 'custom') {
      return `${formatDateVN(customStart)} – ${formatDateVN(customEnd)}`;
    }
    const r = getRangeFromPreset(activePreset);
    if (activePreset === 'today') return `Hôm nay – ${formatDateVN(r.start)}`;
    return `${formatDateVN(r.start)} – ${formatDateVN(r.end)}`;
  })();

  const loadData = useCallback(async (preset?: FilterPreset, cStart?: Date, cEnd?: Date) => {
    setLoading(true);
    setError('');
    try {
      const userStr = await storage.getItem('pos_user');
      let userRole = 'STAFF';
      if (userStr) {
        const userObj = JSON.parse(userStr);
        userRole = userObj.role;
        setRole(userRole);
      }

      if (userRole === 'ADMIN') {
        const usedPreset = preset ?? activePreset;
        let startDate: string;
        let endDate: string;

        if (usedPreset === 'custom') {
          const s = cStart ?? customStart;
          const e = cEnd ?? customEnd;
          startDate = toISO(s);
          endDate = toISO(e);
        } else {
          const range = getRangeFromPreset(usedPreset);
          startDate = toISO(range.start);
          endDate = toISO(range.end);
        }

        const stats = await posApi.getDashboardAnalytics({ startDate, endDate });
        setData(stats);
      }
    } catch (err: any) {
      console.error('Lỗi tải báo cáo:', err);
      setError(err.message || 'Không thể tải dữ liệu báo cáo từ máy chủ.');
    } finally {
      setLoading(false);
    }
  }, [activePreset, customStart, customEnd]);

  useEffect(() => {
    loadData();
  }, []);

  const handlePresetChange = (preset: FilterPreset) => {
    if (preset === 'custom') {
      setPendingStart(customStart);
      setPendingEnd(customEnd);
      setShowCustomModal(true);
      return;
    }
    setActivePreset(preset);
    loadData(preset);
  };

  const applyCustom = () => {
    setCustomStart(pendingStart);
    setCustomEnd(pendingEnd);
    setActivePreset('custom');
    setShowCustomModal(false);
    loadData('custom', pendingStart, pendingEnd);
  };

  // ─── Access denied ──────────────────────────────────────────────────────
  if (!loading && role !== 'ADMIN') {
    return (
      <SafeAreaView style={[styles.restrictedContainer, isTablet && { paddingLeft: 240 }]}>
        <ShieldAlert color="#d84315" size={64} style={styles.restrictedIcon} />
        <Text style={styles.restrictedTitle}>Quyền Truy Cập Hạn Chế</Text>
        <Text style={styles.restrictedDesc}>
          Chỉ tài khoản Quản trị viên (Admin) mới có quyền truy cập vào các báo cáo doanh thu, AOV và thống kê kinh doanh của chi nhánh.
        </Text>
        <Text style={styles.restrictedNote}>Vui lòng đăng nhập bằng tài khoản Admin để xem.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isTablet && { paddingLeft: 240 }]}>
      {/* ─── Custom Date Modal ───────────────────────────────────────────── */}
      <Modal visible={showCustomModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowCustomModal(false)}>
          <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <ListFilter color="#6a1b9a" size={18} />
                <Text style={styles.modalTitle}>Chọn khoảng thời gian</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCustomModal(false)}>
                <X color="#8d6e63" size={20} />
              </TouchableOpacity>
            </View>

            <InlineDatePicker label="TỪ NGÀY" value={pendingStart} onChange={setPendingStart} />
            <InlineDatePicker label="ĐẾN NGÀY" value={pendingEnd} onChange={setPendingEnd} />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCustomModal(false)}>
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={applyCustom}>
                <Text style={styles.applyBtnText}>Áp dụng</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

        {/* ─── Header ───────────────────────────────────────────────────── */}
        <View style={styles.dashboardHeader}>
          <View style={styles.headerTitleRow}>
            <BarChart3 color="#3e2723" size={22} />
            <Text style={styles.headerTitle}>Báo Cáo Doanh Thu</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={() => loadData()} activeOpacity={0.7}>
            <RefreshCw color="#3e2723" size={16} />
          </TouchableOpacity>
        </View>

        {/* ─── Filter Preset Pills ────────────────────────────────────── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
          {PRESETS.map(p => {
            const isActive = activePreset === p.key;
            return (
              <TouchableOpacity
                key={p.key}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => handlePresetChange(p.key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ─── Period Label ──────────────────────────────────────────── */}
        <View style={styles.periodLabelRow}>
          <CalendarRange color="#8d6e63" size={13} />
          <Text style={styles.periodLabelText}>{periodLabel}</Text>
        </View>

        {/* ─── Loading ───────────────────────────────────────────────── */}
        {loading ? (
          <View style={styles.loadingInner}>
            <ActivityIndicator size="large" color="#6a1b9a" />
            <Text style={styles.loadingText}>Đang tổng hợp...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadData()}>
              <Text style={styles.retryButtonText}>THỬ LẠI</Text>
            </TouchableOpacity>
          </View>
        ) : data ? (
          <View style={styles.statsContainer}>

            {/* KPI row 1: Revenue + Orders */}
            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, styles.kpiRevenue]}>
                <TrendingUp color="#2e7d32" size={20} />
                <Text style={styles.kpiLabel}>DOANH THU KỲ</Text>
                <Text style={styles.kpiValue} numberOfLines={1}>{formatPrice(data.periodRevenue ?? data.todayRevenue)}</Text>
              </View>
              <View style={[styles.kpiCard, styles.kpiOrders]}>
                <ShoppingCart color="#1565c0" size={20} />
                <Text style={styles.kpiLabel}>SỐ ĐƠN</Text>
                <Text style={styles.kpiValue}>{data.periodOrdersCount ?? data.todayOrdersCount}</Text>
                <Text style={styles.kpiSub}>đơn hàng</Text>
              </View>
            </View>

            {/* KPI row 2: AOV */}
            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, styles.kpiAov, { flex: 1 }]}>
                <Coins color="#d84315" size={20} />
                <Text style={styles.kpiLabel}>GIÁ TRỊ ĐƠN TRUNG BÌNH (AOV)</Text>
                <Text style={styles.kpiValue}>{formatPrice(data.periodAOV ?? data.todayAOV)} / đơn</Text>
              </View>
            </View>

            {/* KPI row 3: Month Revenue (luôn là tháng hiện tại) */}
            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, styles.kpiMonth, { flex: 1 }]}>
                <CalendarRange color="#6a1b9a" size={20} />
                <Text style={styles.kpiLabel}>DOANH THU THÁNG NÀY</Text>
                <Text style={[styles.kpiValue, { color: '#6a1b9a' }]} numberOfLines={1}>
                  {formatPrice(data.monthRevenue ?? 0)}
                </Text>
                <Text style={styles.kpiSub}>Từ đầu tháng đến hôm nay</Text>
              </View>
            </View>

            {/* Phương thức thanh toán */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>PHƯƠNG THỨC THANH TOÁN</Text>
              {[
                { key: 'CASH', label: 'Tiền mặt', color: '#4caf50' },
                { key: 'BANK_TRANSFER', label: 'Chuyển khoản', color: '#2196f3' },
                { key: 'E_WALLET', label: 'Ví điện tử', color: '#ff9800' },
                { key: 'CARD', label: 'Thẻ', color: '#9c27b0' },
              ].map(m => {
                const val = data.revenueByMethod?.[m.key as keyof typeof data.revenueByMethod] || 0;
                const pct = getPercentage(val, data.periodRevenue ?? data.todayRevenue);
                return (
                  <View key={m.key}>
                    <View style={styles.paymentRow}>
                      <View style={[styles.methodDot, { backgroundColor: m.color }]} />
                      <Text style={styles.paymentName}>{m.label}</Text>
                      <Text style={styles.paymentPct}>{pct}%</Text>
                      <Text style={styles.paymentVal}>{formatPrice(val)}</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: m.color }]} />
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Top món bán chạy */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>
                MÓN BÁN CHẠY NHẤT {activePreset === 'today' ? '(HÔM NAY)' : '(TRONG KỲ)'}
              </Text>
              {data.topProducts && data.topProducts.length > 0 ? (
                data.topProducts.slice(0, 5).map((prod, idx) => (
                  <View key={idx} style={styles.productRow}>
                    <View style={[styles.rankBadge, idx === 0 && styles.rankGold, idx === 1 && styles.rankSilver, idx === 2 && styles.rankBronze]}>
                      <Text style={styles.rankText}>#{idx + 1}</Text>
                    </View>
                    <View style={{ flex: 1, marginHorizontal: 10 }}>
                      <Text style={styles.productName} numberOfLines={1}>{prod.name}</Text>
                      <Text style={styles.productRev}>{formatPrice(prod.revenue)}</Text>
                    </View>
                    <View style={styles.productQtyBadge}>
                      <Text style={styles.productQty}>{prod.quantity}</Text>
                      <Text style={styles.productQtyUnit}>cốc</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>Chưa có dữ liệu bán hàng trong kỳ này.</Text>
              )}
            </View>

            {/* Hóa đơn gần nhất */}
            {data.recentOrders && data.recentOrders.length > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>HÓA ĐƠN GẦN NHẤT</Text>
                {data.recentOrders.map((order, idx) => {
                  const methodLabels: Record<string, string> = {
                    CASH: 'Tiền mặt', BANK_TRANSFER: 'Chuyển khoản',
                    E_WALLET: 'Ví điện tử', CARD: 'Thẻ',
                  };
                  const payTime = new Date(order.payTime);
                  return (
                    <View key={order.id} style={[styles.recentRow, idx === data.recentOrders.length - 1 && { borderBottomWidth: 0 }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.recentTable}>{order.tableName}</Text>
                        <Text style={styles.recentMethod}>{methodLabels[order.paymentMethod] || order.paymentMethod}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.recentAmount}>{formatPrice(order.totalAmount)}</Text>
                        <Text style={styles.recentTime}>
                          {payTime.getHours().toString().padStart(2, '0')}:{payTime.getMinutes().toString().padStart(2, '0')} · {formatDateVN(payTime)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

          </View>
        ) : null}

      </ScrollView>
    </SafeAreaView>
  );
}

function getPercentage(value: number, total: number): number {
  if (!total || total === 0) return 0;
  return Math.min(100, Math.max(0, Math.round((value / total) * 100)));
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfbf7' },
  scrollContainer: { padding: 16, paddingBottom: 32 },

  // Loading / Error
  loadingInner: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 12 },
  loadingText: { color: '#5d4037', fontSize: 14 },
  errorContainer: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  errorText: { color: '#c62828', fontSize: 14, textAlign: 'center' },
  retryButton: { backgroundColor: '#3e2723', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontWeight: 'bold' },

  // Restricted
  restrictedContainer: { flex: 1, backgroundColor: '#fdfbf7', alignItems: 'center', justifyContent: 'center', padding: 32 },
  restrictedIcon: { marginBottom: 20 },
  restrictedTitle: { fontSize: 18, fontWeight: 'bold', color: '#3e2723', marginBottom: 12, letterSpacing: 0.5 },
  restrictedDesc: { fontSize: 14, color: '#6d4c41', textAlign: 'center', lineHeight: 20, marginBottom: 12 },
  restrictedNote: { fontSize: 12, color: '#8d6e63', fontStyle: 'italic' },

  // Header
  dashboardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#3e2723' },
  refreshButton: { padding: 8, borderRadius: 8, backgroundColor: '#efebe9' },

  // Filter
  filterScroll: { marginBottom: 10 },
  filterRow: { flexDirection: 'row', gap: 8, paddingRight: 8 },
  filterPill: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#efebe9', borderWidth: 1, borderColor: '#d7ccc8',
  },
  filterPillActive: { backgroundColor: '#4a148c', borderColor: '#4a148c' },
  filterPillText: { fontSize: 13, fontWeight: '600', color: '#5d4037' },
  filterPillTextActive: { color: '#fff' },

  // Period label
  periodLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 14 },
  periodLabelText: { fontSize: 12, color: '#8d6e63', fontStyle: 'italic' },

  // KPI
  statsContainer: { gap: 14 },
  kpiRow: { flexDirection: 'row', gap: 12 },
  kpiCard: {
    flex: 1, padding: 14, borderRadius: 16, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#efebe9', gap: 4,
    shadowColor: '#5d4037', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  kpiRevenue: { borderLeftWidth: 4, borderLeftColor: '#2e7d32' },
  kpiOrders: { borderLeftWidth: 4, borderLeftColor: '#1565c0' },
  kpiAov: { borderLeftWidth: 4, borderLeftColor: '#d84315' },
  kpiMonth: { borderLeftWidth: 4, borderLeftColor: '#6a1b9a', backgroundColor: '#fdf6ff' },
  kpiLabel: { fontSize: 10, fontWeight: 'bold', color: '#8d6e63', letterSpacing: 0.5 },
  kpiValue: { fontSize: 16, fontWeight: 'bold', color: '#3e2723' },
  kpiSub: { fontSize: 11, color: '#8d6e63', marginTop: 2 },

  // Section card
  sectionCard: {
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#efebe9',
    padding: 16, shadowColor: '#5d4037', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: 'bold', color: '#3e2723', letterSpacing: 1,
    marginBottom: 14, borderBottomWidth: 1, borderColor: '#f5f5f5', paddingBottom: 8,
  },

  // Payment methods
  paymentRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  methodDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  paymentName: { fontSize: 13, color: '#5d4037', flex: 1 },
  paymentPct: { fontSize: 12, color: '#8d6e63', marginRight: 8 },
  paymentVal: { fontSize: 13, fontWeight: 'bold', color: '#3e2723', minWidth: 80, textAlign: 'right' },
  progressBarBg: { height: 6, borderRadius: 3, backgroundColor: '#efebe9', marginTop: 5, marginBottom: 10, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  // Products
  productRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f5f5f5' },
  rankBadge: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#efebe9', alignItems: 'center', justifyContent: 'center' },
  rankGold: { backgroundColor: '#fff8e1' },
  rankSilver: { backgroundColor: '#f5f5f5' },
  rankBronze: { backgroundColor: '#fbe9e7' },
  rankText: { fontSize: 11, fontWeight: 'bold', color: '#5d4037' },
  productName: { fontSize: 13, fontWeight: 'bold', color: '#3e2723' },
  productRev: { fontSize: 11, color: '#8d6e63', marginTop: 2 },
  productQtyBadge: { alignItems: 'center', backgroundColor: '#e8f5e9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  productQty: { fontSize: 16, fontWeight: 'bold', color: '#2e7d32' },
  productQtyUnit: { fontSize: 10, color: '#388e3c' },
  noDataText: { fontSize: 13, color: '#8d6e63', textAlign: 'center', paddingVertical: 16 },

  // Recent orders
  recentRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f5f5f5' },
  recentTable: { fontSize: 13, fontWeight: 'bold', color: '#3e2723' },
  recentMethod: { fontSize: 11, color: '#8d6e63', marginTop: 2 },
  recentAmount: { fontSize: 13, fontWeight: 'bold', color: '#2e7d32' },
  recentTime: { fontSize: 11, color: '#8d6e63', marginTop: 2 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  modalCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '88%', maxWidth: 380,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#3e2723' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#d7ccc8', alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#5d4037' },
  applyBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#4a148c', alignItems: 'center' },
  applyBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
