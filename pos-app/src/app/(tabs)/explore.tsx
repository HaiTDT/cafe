import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { posApi, PosDashboardData, formatPrice } from '@/lib/api';
import { storage } from '@/lib/storage';
import { ShieldAlert, BarChart3, TrendingUp, ShoppingCart, Coins, RefreshCw } from 'lucide-react-native';

export default function ExploreScreen() {
  const [data, setData] = useState<PosDashboardData | null>(null);
  const [role, setRole] = useState('STAFF');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Check user role
      const userStr = await storage.getItem('pos_user');
      let userRole = 'STAFF';
      if (userStr) {
        const userObj = JSON.parse(userStr);
        userRole = userObj.role;
        setRole(userRole);
      }

      if (userRole === 'ADMIN') {
        const stats = await posApi.getDashboardAnalytics();
        setData(stats);
      }
    } catch (err: any) {
      console.error('Lỗi tải báo cáo:', err);
      setError(err.message || 'Không thể tải dữ liệu báo cáo từ máy chủ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3e2723" />
        <Text style={styles.loadingText}>Đang tổng hợp báo cáo...</Text>
      </View>
    );
  }

  // 1. Phân quyền: Nếu là nhân viên thường, không cho xem báo cáo
  if (role !== 'ADMIN') {
    return (
      <SafeAreaView style={styles.restrictedContainer}>
        <ShieldAlert color="#d84315" size={64} style={styles.restrictedIcon} />
        <Text style={styles.restrictedTitle}>Quyền Truy Cập Hạn Chế</Text>
        <Text style={styles.restrictedDesc}>
          Chỉ tài khoản Quản trị viên (Admin) mới có quyền truy cập vào các báo cáo doanh thu, AOV và thống kê kinh doanh của chi nhánh.
        </Text>
        <Text style={styles.restrictedNote}>
          Vui lòng đăng nhập bằng tài khoản Admin để xem.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* Header Title */}
        <View style={styles.dashboardHeader}>
          <View style={styles.headerTitleRow}>
            <BarChart3 color="#3e2723" size={24} />
            <Text style={styles.headerTitle}>Báo Cáo Hôm Nay</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={loadData} activeOpacity={0.7}>
            <RefreshCw color="#3e2723" size={16} />
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadData}>
              <Text style={styles.retryButtonText}>THỬ LẠI</Text>
            </TouchableOpacity>
          </View>
        ) : data ? (
          <View style={styles.statsContainer}>
            
            {/* KPI Cards */}
            <View style={styles.kpiRow}>
              {/* Doanh thu */}
              <View style={[styles.kpiCard, styles.kpiRevenue]}>
                <TrendingUp color="#2e7d32" size={22} />
                <Text style={styles.kpiLabel}>DOANH THU</Text>
                <Text style={styles.kpiValue} numberOfLines={1}>{formatPrice(data.todayRevenue)}</Text>
              </View>

              {/* Số đơn */}
              <View style={[styles.kpiCard, styles.kpiOrders]}>
                <ShoppingCart color="#1565c0" size={22} />
                <Text style={styles.kpiLabel}>SỐ ĐƠN HÀNG</Text>
                <Text style={styles.kpiValue}>{data.todayOrdersCount} đơn</Text>
              </View>
            </View>

            {/* AOV */}
            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, styles.kpiAov, { flex: 1 }]}>
                <Coins color="#d84315" size={22} />
                <Text style={styles.kpiLabel}>GIÁ TRỊ ĐƠN TRUNG BÌNH (AOV)</Text>
                <Text style={styles.kpiValue}>{formatPrice(data.todayAOV)} / đơn</Text>
              </View>
            </View>

            {/* Doanh thu theo phương thức thanh toán */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>PHƯƠNG THỨC THANH TOÁN</Text>
              
              <View style={styles.paymentRow}>
                <Text style={styles.paymentName}>Tiền mặt (Cash)</Text>
                <Text style={styles.paymentVal}>{formatPrice(data.revenueByMethod?.CASH || 0)}</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${getPercentage(data.revenueByMethod?.CASH || 0, data.todayRevenue)}%`, backgroundColor: '#4caf50' }]} />
              </View>

              <View style={styles.paymentRow}>
                <Text style={styles.paymentName}>Chuyển khoản (Bank)</Text>
                <Text style={styles.paymentVal}>{formatPrice(data.revenueByMethod?.BANK_TRANSFER || 0)}</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${getPercentage(data.revenueByMethod?.BANK_TRANSFER || 0, data.todayRevenue)}%`, backgroundColor: '#2196f3' }]} />
              </View>

              <View style={styles.paymentRow}>
                <Text style={styles.paymentName}>Ví điện tử (E-Wallet)</Text>
                <Text style={styles.paymentVal}>{formatPrice(data.revenueByMethod?.E_WALLET || 0)}</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${getPercentage(data.revenueByMethod?.E_WALLET || 0, data.todayRevenue)}%`, backgroundColor: '#ff9800' }]} />
              </View>

              <View style={styles.paymentRow}>
                <Text style={styles.paymentName}>Thẻ (Card)</Text>
                <Text style={styles.paymentVal}>{formatPrice(data.revenueByMethod?.CARD || 0)}</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${getPercentage(data.revenueByMethod?.CARD || 0, data.todayRevenue)}%`, backgroundColor: '#9c27b0' }]} />
              </View>
            </View>

            {/* Top bán chạy */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>MÓN BÁN CHẠY NHẤT</Text>
              
              {data.topProducts && data.topProducts.length > 0 ? (
                data.topProducts.slice(0, 5).map((prod, idx) => (
                  <View key={idx} style={styles.productRow}>
                    <View style={styles.productNameCol}>
                      <Text style={styles.productIndex}>#{idx + 1}</Text>
                      <Text style={styles.productName} numberOfLines={1}>{prod.name}</Text>
                    </View>
                    <View style={styles.productQtyCol}>
                      <Text style={styles.productQty}>{prod.quantity} cốc</Text>
                      <Text style={styles.productRev}>{formatPrice(prod.revenue)}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>Hôm nay chưa có dữ liệu món bán chạy.</Text>
              )}
            </View>

          </View>
        ) : null}

      </ScrollView>
    </SafeAreaView>
  );
}

// Hàm tính phần trăm
function getPercentage(value: number, total: number): number {
  if (!total || total === 0) return 0;
  return Math.min(100, Math.max(0, Math.floor((value / total) * 100)));
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfbf7',
  },
  scrollContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fdfbf7',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#5d4037',
    fontSize: 14,
  },
  restrictedContainer: {
    flex: 1,
    backgroundColor: '#fdfbf7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  restrictedIcon: {
    marginBottom: 20,
  },
  restrictedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3e2723',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  restrictedDesc: {
    fontSize: 14,
    color: '#6d4c41',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  restrictedNote: {
    fontSize: 12,
    color: '#8d6e63',
    fontStyle: 'italic',
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3e2723',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#efebe9',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3e2723',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  statsContainer: {
    gap: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#efebe9',
    gap: 6,
    shadowColor: '#5d4037',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  kpiRevenue: {
    borderLeftWidth: 4,
    borderLeftColor: '#2e7d32',
  },
  kpiOrders: {
    borderLeftWidth: 4,
    borderLeftColor: '#1565c0',
  },
  kpiAov: {
    borderLeftWidth: 4,
    borderLeftColor: '#d84315',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#8d6e63',
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3e2723',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#efebe9',
    padding: 16,
    shadowColor: '#5d4037',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3e2723',
    letterSpacing: 1,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#f5f5f5',
    paddingBottom: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  paymentName: {
    fontSize: 13,
    color: '#5d4037',
  },
  paymentVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#3e2723',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#efebe9',
    marginTop: 6,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#f5f5f5',
  },
  productNameCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  productIndex: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8d6e63',
    width: 24,
  },
  productName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#3e2723',
  },
  productQtyCol: {
    alignItems: 'flex-end',
    width: 100,
  },
  productQty: {
    fontSize: 12,
    fontWeight: '500',
    color: '#5d4037',
  },
  productRev: {
    fontSize: 11,
    color: '#8d6e63',
    marginTop: 2,
  },
  noDataText: {
    fontSize: 13,
    color: '#8d6e63',
    textAlign: 'center',
    paddingVertical: 12,
  },
});
