import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { useColorScheme, TouchableOpacity, Text, View, StyleSheet, useWindowDimensions } from 'react-native';
import { Colors } from '@/constants/theme';
import { ClipboardList, Coffee, BarChart2, LogOut } from 'lucide-react-native';
import { posTokenStore } from '@/lib/storage';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

function MyTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { width } = useWindowDimensions();
  const router = useRouter();

  const handleLogout = async () => {
    await posTokenStore.clear();
    router.replace('/(auth)/login');
  };

  if (width < 768) {
    // Bottom Tab Bar for Mobile Devices
    return (
      <View style={styles.phoneTabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel !== undefined 
            ? options.tabBarLabel 
            : options.title !== undefined 
              ? options.title 
              : route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const Icon = options.tabBarIcon;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.phoneTabItem}
              activeOpacity={0.7}
            >
              {Icon && Icon({ 
                color: isFocused ? '#3e2723' : '#8d6e63', 
                size: 20,
                focused: isFocused 
              })}
              <Text style={[
                styles.phoneTabText, 
                { color: isFocused ? '#3e2723' : '#8d6e63', fontWeight: isFocused ? 'bold' : 'normal' }
              ]}>
                {typeof label === 'string' ? label : route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  // Vertical Left Sidebar for Tablets
  return (
    <View style={styles.tabletSidebar}>
      {/* Brand Header */}
      <View style={styles.sidebarBrand}>
        <View style={styles.brandIconWrapper}>
          <Coffee color="#ffffff" size={24} />
        </View>
        <View>
          <Text style={styles.brandName}>Hậu Lê Cafe</Text>
          <Text style={styles.brandTagline}>HỆ THỐNG POS</Text>
        </View>
      </View>

      {/* Navigation Links */}
      <View style={styles.sidebarNav}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel !== undefined 
            ? options.tabBarLabel 
            : options.title !== undefined 
              ? options.title 
              : route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const Icon = options.tabBarIcon;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={[styles.sidebarNavItem, isFocused && styles.sidebarNavItemActive]}
              activeOpacity={0.7}
            >
              {Icon && Icon({ 
                color: isFocused ? '#ffffff' : '#8d6e63', 
                size: 20,
                focused: isFocused 
              })}
              <Text style={[
                styles.sidebarNavText, 
                { color: isFocused ? '#ffffff' : '#5d4037', fontWeight: isFocused ? 'bold' : '600' }
              ]}>
                {typeof label === 'string' ? label : route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer (Logout) */}
      <View style={styles.sidebarFooter}>
        <TouchableOpacity 
          onPress={handleLogout}
          style={styles.logoutButton}
          activeOpacity={0.7}
        >
          <LogOut color="#c62828" size={18} />
          <Text style={styles.logoutButtonText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const scheme = useColorScheme();
  const router = useRouter();

  const handleLogout = async () => {
    await posTokenStore.clear();
    router.replace('/(auth)/login');
  };

  return (
    <Tabs
      tabBar={props => <MyTabBar {...props} />}
      screenOptions={{
        headerShown: width < 768, // Ẩn header mặc định trên Tablet vì đã có Brand Sidebar
        headerStyle: {
          backgroundColor: '#3e2723',
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

const styles = StyleSheet.create({
  // Phone Tab Bar Styles
  phoneTabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#efebe9',
    height: 62,
    paddingBottom: 8,
    paddingTop: 8,
  },
  phoneTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  phoneTabText: {
    fontSize: 11,
  },
  
  // Tablet Left Sidebar Styles
  tabletSidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 240,
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#efebe9',
    paddingVertical: 24,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  sidebarBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  brandIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#3e2723',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3e2723',
  },
  brandTagline: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#8d6e63',
    letterSpacing: 1,
    marginTop: 2,
  },
  sidebarNav: {
    flex: 1,
    gap: 8,
  },
  sidebarNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 12,
    backgroundColor: 'transparent',
  },
  sidebarNavItemActive: {
    backgroundColor: '#3e2723',
  },
  sidebarNavText: {
    fontSize: 14,
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: '#efebe9',
    paddingTop: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  logoutButtonText: {
    fontSize: 14,
    color: '#c62828',
    fontWeight: 'bold',
  },
});

