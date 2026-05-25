import { useRouter, useSegments, Slot } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { posTokenStore, storage } from '@/lib/storage';

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  // Kiểm tra trạng thái đăng nhập (yêu cầu cả token và chi nhánh đã chọn)
  const checkAuth = async () => {
    try {
      const token = await posTokenStore.get();
      const branchId = await storage.getItem('pos_branch_id');
      setIsAuthenticated(!!token && !!branchId);
    } catch (e) {
      console.error('Lỗi check auth:', e);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [segments]);

  useEffect(() => {
    if (isLoading) return;

    // Xem segment hiện tại có thuộc group (auth) hay không
    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Nếu chưa đăng nhập và không ở trang auth -> đẩy ra login
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Nếu đã đăng nhập và đang ở trang auth -> đẩy vào trang chủ (tabs)
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fdfbf7' }}>
        <ActivityIndicator size="large" color="#3e2723" />
      </View>
    );
  }

  // Ngăn chặn mount các component con (các tab bảo mật) nếu chưa được xác thực và chuẩn bị chuyển hướng
  const inAuthGroup = segments[0] === '(auth)';
  if (!isAuthenticated && !inAuthGroup) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fdfbf7' }}>
        <ActivityIndicator size="large" color="#3e2723" />
      </View>
    );
  }

  return <Slot />;
}
