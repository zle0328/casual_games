<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';
import { useUserStore } from './stores/user';

const userStore = useUserStore();

onLaunch(() => {
  console.log('App Launch');
  // 从本地存储加载用户信息
  userStore.loadUserFromStorage();
});

onShow(() => {
  console.log('App Show');
});

onHide(() => {
  console.log('App Hide');
});
</script>

<style lang="scss">
/* 全局样式 */
page {
  background: linear-gradient(180deg, #4A90E2 0%, #7B68EE 100%);
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', sans-serif;
}

/* 通用容器 */
.container {
  min-height: 100vh;
  padding: 20rpx;
}

/* 卡片样式 */
.card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
}

/* 按钮样式 */
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 48rpx;
  padding: 24rpx 48rpx;
  font-size: 32rpx;
  font-weight: 600;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: 2rpx solid rgba(255, 255, 255, 0.5);
  border-radius: 48rpx;
  padding: 24rpx 48rpx;
  font-size: 32rpx;
}
</style>
