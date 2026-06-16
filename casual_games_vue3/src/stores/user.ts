import { defineStore } from 'pinia';
import type { User } from '../types';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as User | null,
    isLoggedIn: false,
  }),

  getters: {
    userId: (state) => state.user?.id || '',
    nickname: (state) => state.user?.nickname || '游客',
    avatar: (state) => state.user?.avatar || '',
    totalGames: (state) => state.user?.total_games || 0,
    winRate: (state) => state.user?.win_rate || 0,
  },

  actions: {
    setUser(user: User) {
      this.user = user;
      this.isLoggedIn = true;
      // 持久化到本地
      uni.setStorageSync('user', user);
    },

    clearUser() {
      this.user = null;
      this.isLoggedIn = false;
      uni.removeStorageSync('user');
    },

    loadUserFromStorage() {
      try {
        const user = uni.getStorageSync('user');
        if (user) {
          this.user = user;
          this.isLoggedIn = true;
        }
      } catch (e) {
        console.error('Load user error:', e);
      }
    },
  },
});
