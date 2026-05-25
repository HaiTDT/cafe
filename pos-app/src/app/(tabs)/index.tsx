import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { posApi, CafeTable, CafeOrder } from '@/lib/api';
import { storage } from '@/lib/storage';
import { RefreshCw, MapPin, Inbox, User } from 'lucide-react-native';

// Bộ đếm thời gian phục vụ tại bàn
function TableTimer({ startTime }: { startTime: string }) {
  const [duration, setDuration] = useState('');

  useEffect(() => {
    const calculate = () => {
      const start = new Date(startTime).getTime();
      const diff = Math.floor((Date.now() - start) / 1000);
      if (diff < 0) return '00:00';
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      const pad = (num: number) => num.toString().padStart(2, '0');
      
      return hours > 0 
        ? `${hours}:${pad(minutes)}:${pad(seconds)}`
        : `${pad(minutes)}:${pad(seconds)}`;
    };

    setDuration(calculate());
    const interval = setInterval(() => {
      setDuration(calculate());
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return <Text style={styles.timerText}>{duration}</Text>;
}

export default function TablesScreen() {
  const router = useRouter();
  const [tables, setTables] = useState<CafeTable[]>([]);
  const [activeOrders, setActiveOrders] = useState<CafeOrder[]>([]);
  const [branchName, setBranchName] = useState('Đang tải...');
  const [staffName, setStaffName] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Map lưu trữ thời điểm mở bill theo tableId
  const [tableOrderTimes, setTableOrderTimes] = useState<Record<string, string>>({});

  const loadData = useCallback(async (showIndicator = true) => {
    if (showIndicator) setLoading(true);
    setError('');
    try {
      // Load thông tin nhân viên & chi nhánh từ storage
      const userStr = await storage.getItem('pos_user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        setStaffName(userObj.fullName);
      }

      const branchesData = await posApi.getBranches();
      const savedBranchId = await storage.getItem('pos_branch_id');
      const foundBranch = branchesData.find(b => b.id === savedBranchId);
      if (foundBranch) {
        setBranchName(foundBranch.name);
      } else {
        setBranchName('Chưa chọn chi nhánh');
      }

      // Load danh sách bàn và order hoạt động
      const [tablesData, ordersData] = await Promise.all([
        posApi.getTables(),
        posApi.getActiveOrders().catch(() => [] as CafeOrder[]),
      ]);

      // Sắp xếp bàn theo bảng chữ cái/số
      const sortedTables = tablesData.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      setTables(sortedTables);
      setActiveOrders(ordersData);

      // Tạo map tableId -> order createdAt
      const timesMap: Record<string, string> = {};
      ordersData.forEach(order => {
        if (order.tableId && order.createdAt) {
          timesMap[order.tableId] = order.createdAt;
        }
      });
      setTableOrderTimes(timesMap);
    } catch (err: any) {
      console.error('Lỗi tải sơ đồ bàn:', err);
      setError(err.message || 'Không thể kết nối đến máy chủ POS.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(false);
  };

  const handleTablePress = (table: CafeTable) => {
    router.push({
      pathname: '/order/[tableId]',
      params: { tableId: table.id, tableName: table.name, tableStatus: table.status }
    });
  };

  const getTableStyle = (status: string) => {
    switch (status) {
      case 'EMPTY':
        return styles.tableEmpty;
      case 'SERVING':
        return styles.tableServing;
      case 'WAITING_PAYMENT':
        return styles.tableWaitingPayment;
      default:
        return styles.tableEmpty;
    }
  };

  const getTableTextStyle = (status: string) => {
    switch (status) {
      case 'EMPTY':
        return styles.textEmpty;
      case 'SERVING':
      case 'WAITING_PAYMENT':
        return styles.textActive;
      default:
        return styles.textEmpty;
    }
  };

  const renderTableCard = ({ item }: { item: CafeTable }) => {
    const isOccupied = item.status !== 'EMPTY';
    const orderTime = tableOrderTimes[item.id];

    return (
      <TouchableOpacity
        style={[styles.tableCard, getTableStyle(item.status)]}
        onPress={() => handleTablePress(item)}
        activeOpacity={0.8}
      >
        <Text style={[styles.tableName, getTableTextStyle(item.status)]}>{item.name}</Text>
        
        {isOccupied && orderTime ? (
          <TableTimer startTime={orderTime} />
        ) : (
          <Text style={[styles.tableStatusText, getTableTextStyle(item.status)]}>
            {item.status === 'EMPTY' ? 'Bàn trống' : item.status === 'SERVING' ? 'Đang phục vụ' : 'Đợi thanh toán'}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3e2723" />
        <Text style={styles.loadingText}>Đang tải sơ đồ bàn...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header Info */}
      <View style={styles.branchHeader}>
        <View style={styles.branchRow}>
          <MapPin color="#8d6e63" size={16} />
          <Text style={styles.branchText}>{branchName}</Text>
        </View>
        <View style={styles.branchRow}>
          <User color="#8d6e63" size={16} />
          <Text style={styles.staffText}>{staffName}</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadData()}>
            <RefreshCw color="#ffffff" size={16} style={styles.retryIcon} />
            <Text style={styles.retryButtonText}>TẢI LẠI</Text>
          </TouchableOpacity>
        </View>
      ) : tables.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Inbox color="#8d6e63" size={48} />
          <Text style={styles.emptyText}>Chi nhánh chưa thiết lập bàn ăn.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadData()}>
            <Text style={styles.retryButtonText}>LÀM MỚI</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={tables}
          renderItem={renderTableCard}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={styles.gridRow}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3e2723']}
              tintColor="#3e2723"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfbf7',
  },
  branchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#efebe9',
  },
  branchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  branchText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#3e2723',
  },
  staffText: {
    fontSize: 13,
    color: '#5d4037',
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
  errorContainer: {
    flex: 1,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3e2723',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  emptyText: {
    color: '#8d6e63',
    fontSize: 14,
    textAlign: 'center',
  },
  gridContainer: {
    padding: 12,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  tableCard: {
    flex: 1,
    margin: 6,
    height: 110,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tableEmpty: {
    backgroundColor: '#ffffff',
    borderColor: '#efebe9',
    shadowColor: '#5d4037',
  },
  tableServing: {
    backgroundColor: '#5d4037', // Nâu vừa cho bàn đang ăn
    borderColor: '#3e2723',
    shadowColor: '#3e2723',
  },
  tableWaitingPayment: {
    backgroundColor: '#e65100', // Cam đậm hổ phách nhấp nháy cho bàn đợi thanh toán
    borderColor: '#b23c00',
    shadowColor: '#b23c00',
  },
  tableName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  textEmpty: {
    color: '#3e2723',
  },
  textActive: {
    color: '#ffffff',
  },
  tableStatusText: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.8,
  },
  timerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
    overflow: 'hidden',
  },
});
