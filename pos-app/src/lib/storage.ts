import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.error('Error reading storage key', key, e);
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.error('Error writing storage key', key, e);
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error('Error removing storage key', key, e);
    }
  },
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.error('Error clearing storage', e);
    }
  }
};

export const posTokenStore = {
  async get() {
    return await storage.getItem('pos_token');
  },
  async set(token: string) {
    await storage.setItem('pos_token', token);
  },
  async clear() {
    await storage.removeItem('pos_token');
    await storage.removeItem('pos_user');
    await storage.removeItem('pos_branch_id');
  }
};
