import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Switch,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import { posApi, CafeProduct, CafeCategory, formatPrice } from '@/lib/api';
import { storage } from '@/lib/storage';
import { Search, Coffee, ClipboardList, AlertCircle, ShoppingBag } from 'lucide-react-native';

export default function MenuScreen() {
  const { width } = useWindowDimensions();
  const [products, setProducts] = useState<CafeProduct[]>([]);
  const [categories, setCategories] = useState<CafeCategory[]>([]);
  
  // State filters
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState('STAFF');

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Lấy vai trò user
      const userStr = await storage.getItem('pos_user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        setCurrentUserRole(userObj.role);
      }

      const [catsData, prodsData] = await Promise.all([
        posApi.getCategories(),
        posApi.getProducts({ showInactive: true }),
      ]);
      setCategories(catsData);
      setProducts(prodsData);
    } catch (err: any) {
      console.error('Lỗi tải thực đơn:', err);
      setError(err.message || 'Không thể tải thực đơn từ máy chủ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Bộ lọc sản phẩm
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategoryId === 'all' || p.categoryId === selectedCategoryId;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategoryId, searchQuery]);

  // Toggle khả dụng (chỉ dành cho ADMIN)
  const handleToggleAvailable = async (product: CafeProduct) => {
    if (currentUserRole !== 'ADMIN') return;
    
    setUpdatingId(product.id);
    try {
      const updated = await posApi.updateProduct(product.id, {
        isAvailable: !product.isAvailable
      });
      // Cập nhật lại state products
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isAvailable: updated.isAvailable } : p));
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái món:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const renderProductItem = ({ item }: { item: CafeProduct }) => {
    const isAdmin = currentUserRole === 'ADMIN';
    const isUpdating = updatingId === item.id;

    return (
      <View style={[styles.productCard, !item.isAvailable && styles.productCardUnavailable]}>
        {/* Hình ảnh */}
        <View style={styles.imageContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Coffee color="#8d6e63" size={32} />
            </View>
          )}
          {!item.isAvailable && (
            <View style={styles.soldOutBadge}>
              <Text style={styles.soldOutText}>HẾT MÓN</Text>
            </View>
          )}
        </View>

        {/* Thông tin món */}
        <View style={styles.infoContainer}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
          
          {/* Action toggle (Admin) */}
          {isAdmin ? (
            <View style={styles.adminActionRow}>
              <Text style={styles.adminLabel}>Còn món:</Text>
              {isUpdating ? (
                <ActivityIndicator size="small" color="#3e2723" />
              ) : (
                <Switch
                  value={item.isAvailable}
                  onValueChange={() => handleToggleAvailable(item)}
                  trackColor={{ false: '#d7ccc8', true: '#ffccbc' }}
                  thumbColor={item.isAvailable ? '#3e2723' : '#b0bec5'}
                />
              )}
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3e2723" />
        <Text style={styles.loadingText}>Đang tải thực đơn...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, width >= 768 && { paddingLeft: 240 }]}>
      {/* Search Bar */}
      <View style={styles.searchHeader}>
        <View style={styles.searchWrapper}>
          <Search color="#8d6e63" size={18} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm tên món nước..."
            placeholderTextColor="#a1887f"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Categories Horizontal Scroll */}
      <View style={styles.categoryBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          <TouchableOpacity
            style={[styles.categoryTab, selectedCategoryId === 'all' && styles.categoryTabActive]}
            onPress={() => setSelectedCategoryId('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.categoryTabText, selectedCategoryId === 'all' && styles.categoryTabTextActive]}>
              Tất cả
            </Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryTab, selectedCategoryId === cat.id && styles.categoryTabActive]}
              onPress={() => setSelectedCategoryId(cat.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.categoryTabText, selectedCategoryId === cat.id && styles.categoryTabTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <AlertCircle color="#c62828" size={32} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryButtonText}>TẢI LẠI</Text>
          </TouchableOpacity>
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ShoppingBag color="#8d6e63" size={48} />
          <Text style={styles.emptyText}>Không tìm thấy đồ uống nào phù hợp.</Text>
        </View>
      ) : (
        <FlatList
          key={`grid-${width < 600 ? 2 : width < 900 ? 3 : 4}`}
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={item => item.id}
          numColumns={width < 600 ? 2 : width < 900 ? 3 : 4}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.listRow}
        />
      )}
    </SafeAreaView>
  );
}

// Thêm ScrollView giả cho React Native
import { ScrollView } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfbf7',
  },
  searchHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#efebe9',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbe9e7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffccbc',
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#3e2723',
    fontSize: 14,
    padding: 0,
  },
  categoryBar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#efebe9',
  },
  categoryScroll: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#efebe9',
  },
  categoryTabActive: {
    backgroundColor: '#3e2723',
  },
  categoryTabText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#5d4037',
  },
  categoryTabTextActive: {
    color: '#ffffff',
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
  listContainer: {
    padding: 12,
  },
  listRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    flex: 1,
    margin: 6,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#efebe9',
    overflow: 'hidden',
    shadowColor: '#5d4037',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productCardUnavailable: {
    borderColor: '#d7ccc8',
  },
  imageContainer: {
    height: 110,
    backgroundColor: '#efebe9',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldOutBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(62, 39, 35, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldOutText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1,
  },
  infoContainer: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#3e2723',
    lineHeight: 18,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8d6e63',
  },
  adminActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: '#efebe9',
    paddingTop: 8,
    marginTop: 8,
  },
  adminLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#795548',
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
    backgroundColor: '#3e2723',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
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
});
