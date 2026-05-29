import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { posApi, getApiBaseUrl, setApiBaseUrl, Branch } from '@/lib/api';
import { posTokenStore, storage } from '@/lib/storage';
import { Coffee, Settings, Mail, Lock, CheckCircle, AlertCircle, Building } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import Svg, { Path } from 'react-native-svg';

WebBrowser.maybeCompleteAuthSession();

const getRedirectUri = () => {
  if (Platform.OS === 'web') {
    return AuthSession.makeRedirectUri({
      preferLocalhost: true,
    });
  }
  // Nếu là môi trường Expo Go (phát triển) thì dùng Proxy, nếu là standalone build thì dùng Deep Link native trực tiếp
  if (Constants.appOwnership === 'expo') {
    const owner = Constants.expoConfig?.owner || 'anonymous';
    const slug = Constants.expoConfig?.slug || 'pos-app';
    return `https://auth.expo.io/@${owner}/${slug}`;
  }
  
  // Dành cho standalone app thực tế
  return AuthSession.makeRedirectUri({
    scheme: 'posapp',
  });
};

function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </Svg>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [serverUrl, setServerUrl] = useState('');

  // States
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // Branch Selection
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [tempToken, setTempToken] = useState('');

  // Google Auth Request
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '592439299653-il1g091v3c1abb8n9jnng0lpojqhd2j3.apps.googleusercontent.com',
    iosClientId: '592439299653-il1g091v3c1abb8n9jnng0lpojqhd2j3.apps.googleusercontent.com',
    androidClientId: '592439299653-il1g091v3c1abb8n9jnng0lpojqhd2j3.apps.googleusercontent.com',
    redirectUri: getRedirectUri(),
  });

  // Load API Server URL
  useEffect(() => {
    async function loadServerUrl() {
      const url = await getApiBaseUrl();
      setServerUrl(url);
    }
    loadServerUrl();
  }, []);

  // Listen to Google Authentication Response
  useEffect(() => {
    if (response?.type === 'success' && response.authentication?.idToken) {
      handleGoogleLoginSuccess(response.authentication.idToken);
    } else if (response?.type === 'error' || response?.type === 'cancel') {
      setGoogleLoading(false);
      if (response?.type === 'error') {
        setError('Đăng nhập Google không thành công. Vui lòng thử lại.');
      }
    }
  }, [response]);

  const handleGoogleLoginPress = async () => {
    const generatedRedirectUri = getRedirectUri();
    console.log('[Google Auth] Redirect URI generated:', generatedRedirectUri);

    setGoogleLoading(true);
    setError('');
    try {
      const result = await promptAsync();
      if (result.type !== 'success') {
        setGoogleLoading(false);
      }
    } catch (err: any) {
      console.error('Lỗi khi mở xác thực Google:', err);
      setError('Không thể khởi động đăng nhập Google.');
      setGoogleLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async (idToken: string) => {
    setGoogleLoading(true);
    setError('');
    try {
      const res = await posApi.loginWithGoogle(idToken);

      if (res.user.role !== 'ADMIN' && res.user.role !== 'STAFF') {
        setError('Tài khoản Google này không có quyền truy cập hệ thống POS.');
        setGoogleLoading(false);
        return;
      }

      setLoggedInUser(res.user);
      setTempToken(res.token);

      // Lưu token tạm thời vào store để gọi được các API sau đó (như getBranches)
      await posTokenStore.set(res.token);

      // Kiểm tra phân quyền chi nhánh tương tự login thường
      if (res.user.role === 'STAFF' && res.user.branchId) {
        await storage.setItem('pos_branch_id', res.user.branchId);
        await storage.setItem('pos_user', JSON.stringify(res.user));
        // RootLayout checkAuth sẽ tự động chuyển hướng sang /(tabs)
      } else {
        const branchesData = await posApi.getBranches({ showInactive: false });
        if (branchesData.length === 0) {
          setError('Không tìm thấy chi nhánh hoạt động nào trên máy chủ.');
          setGoogleLoading(false);
          await posTokenStore.clear();
          return;
        }
        setBranches(branchesData);
        setShowBranchModal(true);
      }
    } catch (err: any) {
      console.error('Lỗi đăng nhập Google từ server:', err);
      setError(err.message || 'Không thể xác thực tài khoản Google với máy chủ.');
      await posTokenStore.clear();
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    await setApiBaseUrl(serverUrl);
    setShowSettings(false);
    setError('');
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng điền đầy đủ email và mật khẩu.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Gọi API login
      const res = await posApi.login({
        username: username.trim(),
        password: password.trim()
      });

      setLoggedInUser(res.user);
      setTempToken(res.token);

      // Lưu token tạm thời vào store để gọi được các API sau đó (như getBranches)
      await posTokenStore.set(res.token);

      // 2. Kiểm tra phân quyền chi nhánh
      if (res.user.role === 'STAFF' && res.user.branchId) {
        // Nếu là STAFF và đã được gán sẵn chi nhánh ở DB, lưu thông tin và vào thẳng app
        await storage.setItem('pos_branch_id', res.user.branchId);
        await storage.setItem('pos_user', JSON.stringify(res.user));
        // RootLayout checkAuth sẽ tự động chuyển hướng sang /(tabs)
      } else {
        // Nếu là ADMIN hoặc STAFF chưa gán chi nhánh, tải danh sách chi nhánh để lựa chọn
        const branchesData = await posApi.getBranches({ showInactive: false });
        if (branchesData.length === 0) {
          setError('Không tìm thấy chi nhánh hoạt động nào trên máy chủ.');
          setLoading(false);
          await posTokenStore.clear();
          return;
        }
        setBranches(branchesData);
        setShowBranchModal(true);
      }
    } catch (err: any) {
      console.error('Lỗi đăng nhập:', err);
      setError(err.message || 'Lỗi hệ thống hoặc không kết nối được máy chủ.');
      await posTokenStore.clear();
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBranch = async (branch: Branch) => {
    try {
      await posTokenStore.set(tempToken);
      await storage.setItem('pos_branch_id', branch.id);
      await storage.setItem('pos_user', JSON.stringify(loggedInUser));
      setShowBranchModal(false);
      router.replace('/(tabs)');
    } catch (err) {
      setError('Lỗi khi thiết lập chi nhánh làm việc.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">

          {/* Settings Button */}
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setShowSettings(true)}
            activeOpacity={0.7}
          >
            <Settings color="#8d6e63" size={24} />
          </TouchableOpacity>

          {/* Logo & Brand Header */}
          <View style={styles.headerContainer}>
            <View style={styles.logoWrapper}>
              <Coffee color="#ffffff" size={38} />
            </View>
            <Text style={styles.brandTitle}>Hậu Lê Coffee</Text>
            <Text style={styles.brandSubtitle}>HỆ THỐNG GHI ORDER DI ĐỘNG (POS)</Text>
          </View>

          {/* Login Form card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>ĐĂNG NHẬP PHỤC VỤ</Text>

            {error ? (
              <View style={styles.errorBanner}>
                <AlertCircle color="#d32f2f" size={18} style={styles.iconMargin} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Email field */}
            <Text style={styles.inputLabel}>EMAIL NHÂN VIÊN</Text>
            <View style={styles.inputWrapper}>
              <Mail color="#8d6e63" size={18} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="example@haulecoffee.com"
                placeholderTextColor="#a1887f"
                keyboardType="email-address"
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
              />
            </View>

            {/* Password field */}
            <Text style={styles.inputLabel}>MẬT KHẨU</Text>
            <View style={styles.inputWrapper}>
              <Lock color="#8d6e63" size={18} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#a1887f"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>BẮT ĐẦU CA LÀM VIỆC</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>HOẶC</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Login Button */}
            <TouchableOpacity
              style={[styles.googleButton, (loading || googleLoading) && styles.disabledButton]}
              onPress={handleGoogleLoginPress}
              disabled={loading || googleLoading || !request}
              activeOpacity={0.8}
            >
              {googleLoading ? (
                <ActivityIndicator color="#3e2723" size="small" />
              ) : (
                <View style={styles.googleButtonContent}>
                  <GoogleIcon size={20} />
                  <Text style={styles.googleButtonText}>Đăng nhập bằng Google</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Settings Modal (Cấu hình IP Server) */}
          <Modal
            visible={showSettings}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowSettings(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>CẤU HÌNH MÁY CHỦ API</Text>

                <Text style={styles.modalDescription}>
                  Nhập URL server (ở local, hãy nhập địa chỉ IP máy tính dạng: http://192.168.1.X:4000)
                </Text>

                <TextInput
                  style={styles.modalInput}
                  placeholder="https://haulecoffee.onrender.com"
                  value={serverUrl}
                  onChangeText={setServerUrl}
                  autoCapitalize="none"
                />

                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowSettings(false)}
                  >
                    <Text style={styles.cancelButtonText}>HỦY BỎ</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={handleSaveSettings}
                  >
                    <Text style={styles.saveButtonText}>LƯU LẠI</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Branch Selection Modal */}
          <Modal
            visible={showBranchModal}
            animationType="fade"
            transparent={true}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, styles.branchModalContent]}>
                <View style={styles.branchHeader}>
                  <Building color="#3e2723" size={24} />
                  <Text style={styles.branchModalTitle}>CHỌN CHI NHÁNH LÀM VIỆC</Text>
                </View>

                <Text style={styles.branchModalDesc}>
                  Chào {loggedInUser?.fullName}! Vui lòng chọn chi nhánh làm việc cho ca trực hôm nay.
                </Text>

                <ScrollView style={styles.branchList}>
                  {branches.map((branch) => (
                    <TouchableOpacity
                      key={branch.id}
                      style={styles.branchItem}
                      onPress={() => handleSelectBranch(branch)}
                      activeOpacity={0.7}
                    >
                      <View>
                        <Text style={styles.branchItemName}>{branch.name}</Text>
                        <Text style={styles.branchItemAddress}>{branch.address || 'Không có địa chỉ'}</Text>
                      </View>
                      <CheckCircle color="#8d6e63" size={20} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfbf7', // Màu kem ấm cúng
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  settingsButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 10 : 20,
    right: 20,
    padding: 10,
    zIndex: 10,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoWrapper: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#3e2723', // Nâu hạt cafe đậm
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3e2723',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#3e2723',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#8d6e63',
    marginTop: 6,
    letterSpacing: 1.5,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#5d4037',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#efebe9',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3e2723',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 1.5,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#ffcdd2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  iconMargin: {
    marginRight: 8,
  },
  errorText: {
    color: '#c62828',
    fontSize: 13,
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#5d4037',
    marginBottom: 6,
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbe9e7', // Màu hồng cam kem siêu nhạt
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffccbc',
    paddingHorizontal: 12,
    marginBottom: 20,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#3e2723',
    fontSize: 14,
  },
  submitButton: {
    height: 50,
    borderRadius: 12,
    backgroundColor: '#3e2723',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3e2723',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(62, 39, 35, 0.4)', // Warm overlay
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#3e2723',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3e2723',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 1,
  },
  modalDescription: {
    fontSize: 13,
    color: '#6d4c41',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#fbe9e7',
    borderWidth: 1,
    borderColor: '#ffccbc',
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 12,
    color: '#3e2723',
    fontSize: 14,
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#d7ccc8',
    backgroundColor: '#ffffff',
  },
  cancelButtonText: {
    color: '#8d6e63',
    fontWeight: 'bold',
    fontSize: 13,
  },
  saveButton: {
    backgroundColor: '#3e2723',
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  // Branch Selection Styles
  branchModalContent: {
    maxHeight: '80%',
  },
  branchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  branchModalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#3e2723',
    letterSpacing: 0.5,
  },
  branchModalDesc: {
    fontSize: 13,
    color: '#6d4c41',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  branchList: {
    maxHeight: 300,
  },
  branchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fbe9e7',
    borderWidth: 1,
    borderColor: '#ffccbc',
    marginBottom: 12,
  },
  branchItemName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3e2723',
    marginBottom: 4,
  },
  branchItemAddress: {
    fontSize: 12,
    color: '#8d6e63',
    maxWidth: 240,
  },
  // Divider Styles
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#efebe9',
  },
  dividerText: {
    fontSize: 11,
    color: '#8d6e63',
    fontWeight: 'bold',
    marginHorizontal: 12,
    letterSpacing: 1,
  },
  // Google Button Styles
  googleButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7ccc8',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5d4037',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  googleButtonText: {
    color: '#3e2723',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
