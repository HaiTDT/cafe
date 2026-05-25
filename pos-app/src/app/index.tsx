import { Redirect } from 'expo-router';

export default function Index() {
  // Expo Router sẽ tự động xử lý chuyển hướng tại _layout.tsx
  // Ở đây chúng ta trả về Redirect mặc định để đảm bảo an toàn.
  return <Redirect href="/(tabs)" />;
}
