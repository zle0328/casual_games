<template>
  <view class="login-container">
    <!-- 顶部装饰 -->
    <view class="header-decoration">
      <view class="decoration-circle circle-1"></view>
      <view class="decoration-circle circle-2"></view>
      <view class="decoration-circle circle-3"></view>
    </view>

    <!-- Logo 区域 -->
    <view class="logo-section">
      <text class="logo-icon">🎲</text>
      <text class="app-name">派对游戏</text>
      <text class="app-slogan">让聚会更有趣</text>
    </view>

    <!-- 登录表单 -->
    <view class="login-form">
      <view class="form-item">
        <text class="form-label">你的昵称</text>
        <input
          class="form-input"
          v-model="nickname"
          placeholder="请输入昵称"
          maxlength="12"
          :focus="autoFocus"
        />
      </view>

      <view class="avatar-section">
        <text class="form-label">选择头像</text>
        <view class="avatar-list">
          <view
            class="avatar-item"
            v-for="(avatar, index) in avatarList"
            :key="index"
            :class="{ active: selectedAvatar === avatar }"
            @tap="selectAvatar(avatar)"
          >
            <text class="avatar-emoji">{{ avatar }}</text>
          </view>
        </view>
      </view>

      <button class="btn-start" @tap="handleStart" :disabled="!nickname.trim()">
        开始游戏
      </button>

      <view class="quick-login">
        <text class="quick-text" @tap="quickLogin">随机昵称，快速开始 →</text>
      </view>
    </view>

    <!-- 底部提示 -->
    <view class="footer-tip">
      <text class="tip-text">首次进入自动创建游客账号</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useUserStore } from '../../stores/user';
import { createUser } from '../../api/user';
import { generateId } from '../../utils/helpers';

const userStore = useUserStore();

const nickname = ref('');
const selectedAvatar = ref('😎');
const autoFocus = ref(true);

const avatarList = [
  '😎', '🤠', '🥳', '🤪', '😜',
  '🤩', '😇', '🥰', '😋', '🤓',
  '👻', '🤡', '🦄', '🐶', '🐱',
];

// 随机生成昵称
function generateNickname(): string {
  const adjectives = ['快乐的', '幸运的', '勇敢的', '聪明的', '可爱的', '酷炫的', '神秘的', '欢乐的'];
  const nouns = ['玩家', '骰手', '卧底', '侦探', '大神', '萌新', '高手', '菜鸟'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 999);
  return `${adj}${noun}${num}`;
}

// 选择头像
function selectAvatar(avatar: string) {
  selectedAvatar.value = avatar;
}

// 快速登录
function quickLogin() {
  nickname.value = generateNickname();
  selectedAvatar.value = avatarList[Math.floor(Math.random() * avatarList.length)];
  handleStart();
}

// 开始游戏
async function handleStart() {
  if (!nickname.value.trim()) {
    uni.showToast({ title: '请输入昵称', icon: 'none' });
    return;
  }

  try {
    uni.showLoading({ title: '创建账号中...' });

    const userId = generateId('user');
    const res = await createUser({
      id: userId,
      nickname: nickname.value.trim(),
      avatar: selectedAvatar.value,
    });

    uni.hideLoading();

    if (res.success && res.data) {
      // 保存用户信息
      userStore.setUser(res.data);

      uni.showToast({
        title: '欢迎加入！',
        icon: 'success',
      });

      // 延迟跳转到首页
      setTimeout(() => {
        uni.reLaunch({ url: '/pages/index/index' });
      }, 500);
    }
  } catch (error: any) {
    uni.hideLoading();
    uni.showToast({
      title: error.message || '创建账号失败',
      icon: 'none',
    });
  }
}
</script>

<style scoped lang="scss">
.login-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  padding: 80rpx 48rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow: hidden;
}

// 顶部装饰
.header-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 400rpx;
  overflow: hidden;

  .decoration-circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);

    &.circle-1 {
      width: 300rpx;
      height: 300rpx;
      top: -100rpx;
      right: -50rpx;
      animation: float 6s ease-in-out infinite;
    }

    &.circle-2 {
      width: 200rpx;
      height: 200rpx;
      top: 100rpx;
      left: -80rpx;
      animation: float 8s ease-in-out infinite;
    }

    &.circle-3 {
      width: 150rpx;
      height: 150rpx;
      top: 200rpx;
      right: 100rpx;
      animation: float 7s ease-in-out infinite;
    }
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-30rpx); }
}

// Logo 区域
.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 120rpx;
  margin-bottom: 80rpx;
  z-index: 1;

  .logo-icon {
    font-size: 120rpx;
    margin-bottom: 24rpx;
    animation: rotate 3s ease-in-out infinite;
  }

  .app-name {
    font-size: 52rpx;
    font-weight: 700;
    color: #fff;
    margin-bottom: 16rpx;
  }

  .app-slogan {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.9);
  }
}

@keyframes rotate {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
}

// 登录表单
.login-form {
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 32rpx;
  padding: 48rpx 40rpx;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.2);
  z-index: 1;

  .form-item {
    margin-bottom: 32rpx;
  }

  .form-label {
    display: block;
    font-size: 28rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 16rpx;
  }

  .form-input {
    width: 100%;
    height: 88rpx;
    border: 2rpx solid #eee;
    border-radius: 16rpx;
    padding: 0 24rpx;
    font-size: 32rpx;
    color: #333;
    background: #fff;

    &:focus {
      border-color: #667eea;
    }
  }

  .avatar-section {
    margin-bottom: 48rpx;

    .avatar-list {
      display: flex;
      flex-wrap: wrap;
      gap: 16rpx;
      margin-top: 16rpx;

      .avatar-item {
        width: 80rpx;
        height: 80rpx;
        border-radius: 16rpx;
        background: #f5f5f5;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s;
        border: 3rpx solid transparent;

        .avatar-emoji {
          font-size: 44rpx;
        }

        &.active {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.1);
          transform: scale(1.1);
        }

        &:active {
          transform: scale(0.95);
        }
      }
    }
  }

  .btn-start {
    width: 100%;
    height: 96rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    border: none;
    border-radius: 48rpx;
    font-size: 32rpx;
    font-weight: 600;
    margin-bottom: 24rpx;

    &:disabled {
      opacity: 0.5;
    }

    &:active:not(:disabled) {
      transform: scale(0.98);
    }
  }

  .quick-login {
    text-align: center;

    .quick-text {
      font-size: 26rpx;
      color: #667eea;
      text-decoration: underline;
    }
  }
}

// 底部提示
.footer-tip {
  margin-top: 48rpx;
  z-index: 1;

  .tip-text {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.8);
  }
}
</style>
