import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { useColorScheme, TouchableOpacity, Text, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { ClipboardList, Coffee, BarChart2, LogOut } from 'lucide-react-native';
import { posTokenStore } from '@/lib/storage';

export default function TabLayout() {
  const scheme = useColorScheme();
  const router = useRouter();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const handleLogout = async () => {
    await posTokenStore.clear();
    router.replace('/(auth)/login');
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3e2723', // Nâu hạt cafe cho tab đang chọn
        tabBarInactiveTintColor: '#8d6e63', // Nâu nhạt cho tab chưa chọn
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#efebe9',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: '#3e2723', // Header nâu cafe đậm
          elevation: 4,
          shadowOpacity: 0.15,
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 16,
          letterSpacing: 0.5,
        },
        headerRight: () => (
          <TouchableOpacity 
            onPress={handleLogout}
            style={{ marginRight: 16, padding: 8, flexDirection: 'row', alignItems: 'center' }}
            activeOpacity={0.7}
          >
            <LogOut color="#ffffff" size={18} />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Sơ Đồ Bàn',
          tabBarLabel: 'Sơ đồ bàn',
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Thực Đơn',
          tabBarLabel: 'Thực đơn',
          tabBarIcon: ({ color, size }) => <Coffee color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Báo Cáo POS',
          tabBarLabel: 'Báo cáo',
          tabBarIcon: ({ color, size }) => <BarChart2 color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
