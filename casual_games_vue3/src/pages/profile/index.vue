<template>
  <view class="profile-container">
    <!-- 顶部个人信息卡片 -->
    <view class="profile-card">
      <view class="profile-header">
        <view class="avatar-section" @tap="showAvatarPicker">
          <text class="avatar">{{ userStore.user?.avatar || '😎' }}</text>
          <view class="edit-badge">
            <text class="edit-icon">✏️</text>
          </view>
        </view>
        <view class="user-info">
          <view class="nickname-row">
            <text class="nickname">{{ userStore.nickname }}</text>
            <text class="edit-btn" @tap="showNicknameDialog">编辑</text>
          </view>
          <text class="user-id">ID: {{ userStore.userId.substring(5, 15) }}</text>
        </view>
      </view>

      <!-- 统计数据 -->
      <view class="stats-section">
        <view class="stat-item">
          <text class="stat-value">{{ userStore.totalGames }}</text>
          <text class="stat-label">游戏总数</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-value">{{ userStore.user?.spy_games || 0 }}</text>
          <text class="stat-label">卧底次数</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-value">{{ userStore.winRate }}%</text>
          <text class="stat-label">胜率</text>
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <view class="menu-item" @tap="goToRecords">
        <view class="menu-left">
          <text class="menu-icon">📊</text>
          <text class="menu-title">游戏记录</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>

      <view class="menu-item" @tap="goToAchievements">
        <view class="menu-left">
          <text class="menu-icon">🏆</text>
          <text class="menu-title">我的成就</text>
        </view>
        <view class="menu-right">
          <text class="coming-soon">即将上线</text>
        </view>
      </view>

      <view class="menu-item" @tap="goToRules">
        <view class="menu-left">
          <text class="menu-icon">📖</text>
          <text class="menu-title">玩法说明</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>

      <view class="menu-item" @tap="goToSettings">
        <view class="menu-left">
          <text class="menu-icon">⚙️</text>
          <text class="menu-title">设置</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <!-- 游戏记录列表 -->
    <view class="records-section" v-if="records.length > 0">
      <view class="section-header">
        <text class="section-title">最近游戏</text>
      </view>
      <view class="record-list">
        <view class="record-item" v-for="record in records" :key="record.id">
          <view class="record-icon">
            {{ record.game_type === 'dice' ? '🎲' : '🕵️' }}
          </view>
          <view class="record-info">
            <text class="record-name">
              {{ record.game_type === 'dice' ? '摇骰子' : '谁是卧底' }}
            </text>
            <text class="record-time">{{ formatTime(record.created_at) }}</text>
          </view>
          <view class="record-result" :class="record.result">
            {{ record.result === 'win' ? '胜利' : record.result === 'lose' ? '失败' : '平局' }}
          </view>
        </view>
      </view>
    </view>

    <!-- 底部导航 -->
    <view class="bottom-nav">
      <view class="nav-item" @tap="goHome">
        <text class="nav-icon">🏠</text>
        <text class="nav-text">首页</text>
      </view>
      <view class="nav-item active">
        <text class="nav-icon">👤</text>
        <text class="nav-text">我的</text>
      </view>
    </view>

    <!-- 编辑昵称弹窗 -->
    <view class="modal" v-if="showNicknameModal" @tap="closeNicknameDialog">
      <view class="modal-content" @tap.stop>
        <view class="modal-title">修改昵称</view>
        <input
          class="modal-input"
          v-model="newNickname"
          maxlength="12"
          placeholder="请输入新昵称"
          :focus="showNicknameModal"
        />
        <view class="modal-buttons">
          <button class="modal-btn cancel" @tap="closeNicknameDialog">取消</button>
          <button class="modal-btn confirm" @tap="handleUpdateNickname">确定</button>
        </view>
      </view>
    </view>

    <!-- 头像选择弹窗 -->
    <view class="modal" v-if="showAvatarModal" @tap="closeAvatarPicker">
      <view class="modal-content avatar-modal" @tap.stop>
        <view class="modal-title">选择头像</view>
        <view class="avatar-grid">
          <view
            class="avatar-option"
            v-for="(avatar, index) in avatarList"
            :key="index"
            :class="{ active: newAvatar === avatar }"
            @tap="selectAvatar(avatar)"
          >
            <text class="avatar-emoji">{{ avatar }}</text>
          </view>
        </view>
        <view class="modal-buttons">
          <button class="modal-btn cancel" @tap="closeAvatarPicker">取消</button>
          <button class="modal-btn confirm" @tap="handleUpdateAvatar">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUserStore } from '../../stores/user';
import { getUserRecords } from '../../api/user';
import { formatTime } from '../../utils/helpers';
import type { GameRecord } from '../../types';

const userStore = useUserStore();

const records = ref<GameRecord[]>([]);
const showNicknameModal = ref(false);
const showAvatarModal = ref(false);
const newNickname = ref('');
const newAvatar = ref('');

const avatarList = [
  '😎', '🤠', '🥳', '🤪', '😜',
  '🤩', '😇', '🥰', '😋', '🤓',
  '👻', '🤡', '🦄', '🐶', '🐱',
  '🐼', '🐯', '🦁', '🐸', '🦊',
];

onMounted(async () => {
  await loadRecords();
});

// 加载游戏记录
async function loadRecords() {
  if (!userStore.userId) return;

  try {
    const res = await getUserRecords(userStore.userId, 10);
    if (res.success && res.data) {
      records.value = res.data.records;
    }
  } catch (error) {
    console.error('Load records error:', error);
  }
}

// 显示昵称编辑弹窗
function showNicknameDialog() {
  newNickname.value = userStore.nickname;
  showNicknameModal.value = true;
}

// 关闭昵称编辑弹窗
function closeNicknameDialog() {
  showNicknameModal.value = false;
  newNickname.value = '';
}

// 更新昵称
function handleUpdateNickname() {
  if (!newNickname.value.trim()) {
    uni.showToast({ title: '昵称不能为空', icon: 'none' });
    return;
  }

  // TODO: 调用后端 API 更新昵称
  if (userStore.user) {
    userStore.user.nickname = newNickname.value.trim();
    userStore.setUser(userStore.user);
  }

  uni.showToast({ title: '修改成功', icon: 'success' });
  closeNicknameDialog();
}

// 显示头像选择器
function showAvatarPicker() {
  newAvatar.value = userStore.user?.avatar || '😎';
  showAvatarModal.value = true;
}

// 关闭头像选择器
function closeAvatarPicker() {
  showAvatarModal.value = false;
  newAvatar.value = '';
}

// 选择头像
function selectAvatar(avatar: string) {
  newAvatar.value = avatar;
}

// 更新头像
function handleUpdateAvatar() {
  // TODO: 调用后端 API 更新头像
  if (userStore.user) {
    userStore.user.avatar = newAvatar.value;
    userStore.setUser(userStore.user);
  }

  uni.showToast({ title: '修改成功', icon: 'success' });
  closeAvatarPicker();
}

// 跳转到游戏记录
function goToRecords() {
  // TODO: 完整游戏记录页面
  uni.showToast({ title: '功能开发中', icon: 'none' });
}

// 跳转到成就
function goToAchievements() {
  uni.showToast({ title: '敬请期待', icon: 'none' });
}

// 跳转到玩法说明
function goToRules() {
  uni.showToast({ title: '功能开发中', icon: 'none' });
}

// 跳转到设置
function goToSettings() {
  uni.showToast({ title: '功能开发中', icon: 'none' });
}

// 跳转到首页
function goHome() {
  uni.navigateBack({ delta: 1 });
}
</script>

<style scoped lang="scss">
.profile-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #4A90E2 0%, #7B68EE 50%, #f5f5f5 50%);
  padding-bottom: 160rpx;
}

// 个人信息卡片
.profile-card {
  margin: 40rpx 32rpx;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 32rpx;
  padding: 48rpx 40rpx;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.15);

  .profile-header {
    display: flex;
    align-items: center;
    margin-bottom: 32rpx;

    .avatar-section {
      position: relative;
      margin-right: 24rpx;

      .avatar {
        width: 120rpx;
        height: 120rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 72rpx;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50%;
      }

      .edit-badge {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 40rpx;
        height: 40rpx;
        background: #fff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);

        .edit-icon {
          font-size: 20rpx;
        }
      }
    }

    .user-info {
      flex: 1;

      .nickname-row {
        display: flex;
        align-items: center;
        margin-bottom: 12rpx;

        .nickname {
          font-size: 36rpx;
          font-weight: 700;
          color: #333;
          margin-right: 16rpx;
        }

        .edit-btn {
          font-size: 24rpx;
          color: #667eea;
          padding: 4rpx 16rpx;
          border: 1rpx solid #667eea;
          border-radius: 24rpx;
        }
      }

      .user-id {
        font-size: 24rpx;
        color: #999;
      }
    }
  }

  .stats-section {
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding-top: 32rpx;
    border-top: 1rpx solid #eee;

    .stat-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;

      .stat-value {
        font-size: 40rpx;
        font-weight: 700;
        color: #333;
        margin-bottom: 8rpx;
      }

      .stat-label {
        font-size: 24rpx;
        color: #999;
      }
    }

    .stat-divider {
      width: 1rpx;
      height: 60rpx;
      background: #eee;
    }
  }
}

// 功能菜单
.menu-section {
  margin: 0 32rpx 32rpx;
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;

  .menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32rpx 24rpx;
    border-bottom: 1rpx solid #f5f5f5;

    &:last-child {
      border-bottom: none;
    }

    &:active {
      background: #f5f5f5;
    }

    .menu-left {
      display: flex;
      align-items: center;

      .menu-icon {
        font-size: 40rpx;
        margin-right: 16rpx;
      }

      .menu-title {
        font-size: 28rpx;
        color: #333;
      }
    }

    .menu-right {
      .coming-soon {
        font-size: 22rpx;
        color: #999;
        background: #f5f5f5;
        padding: 4rpx 12rpx;
        border-radius: 12rpx;
      }
    }

    .menu-arrow {
      font-size: 48rpx;
      color: #ccc;
      font-weight: 300;
    }
  }
}

// 游戏记录
.records-section {
  margin: 0 32rpx;

  .section-header {
    margin-bottom: 16rpx;

    .section-title {
      font-size: 32rpx;
      font-weight: 600;
      color: #333;
    }
  }

  .record-list {
    background: #fff;
    border-radius: 24rpx;
    overflow: hidden;

    .record-item {
      display: flex;
      align-items: center;
      padding: 24rpx;
      border-bottom: 1rpx solid #f5f5f5;

      &:last-child {
        border-bottom: none;
      }

      .record-icon {
        font-size: 48rpx;
        margin-right: 24rpx;
      }

      .record-info {
        flex: 1;
        display: flex;
        flex-direction: column;

        .record-name {
          font-size: 28rpx;
          font-weight: 600;
          color: #333;
          margin-bottom: 8rpx;
        }

        .record-time {
          font-size: 22rpx;
          color: #999;
        }
      }

      .record-result {
        font-size: 24rpx;
        font-weight: 600;
        padding: 8rpx 16rpx;
        border-radius: 16rpx;

        &.win {
          background: #4caf50;
          color: #fff;
        }

        &.lose {
          background: #f44336;
          color: #fff;
        }

        &.draw {
          background: #ff9800;
          color: #fff;
        }
      }
    }
  }
}

// 底部导航
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: #fff;
  border-top: 1rpx solid #eee;
  padding: 16rpx 0;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));

  .nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;

    .nav-icon {
      font-size: 44rpx;
      margin-bottom: 8rpx;
    }

    .nav-text {
      font-size: 22rpx;
      color: #999;
    }

    &.active .nav-text {
      color: #667eea;
      font-weight: 600;
    }
  }
}

// 弹窗
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .modal-content {
    width: 600rpx;
    background: #fff;
    border-radius: 24rpx;
    padding: 48rpx 40rpx;

    &.avatar-modal {
      width: 660rpx;
    }

    .modal-title {
      font-size: 36rpx;
      font-weight: 700;
      text-align: center;
      margin-bottom: 32rpx;
      color: #333;
    }

    .modal-input {
      width: 100%;
      height: 88rpx;
      border: 2rpx solid #eee;
      border-radius: 16rpx;
      padding: 0 24rpx;
      font-size: 32rpx;
      text-align: center;
      margin-bottom: 32rpx;
    }

    .avatar-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 16rpx;
      margin-bottom: 32rpx;

      .avatar-option {
        width: 88rpx;
        height: 88rpx;
        border-radius: 16rpx;
        background: #f5f5f5;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3rpx solid transparent;
        transition: all 0.3s;

        .avatar-emoji {
          font-size: 48rpx;
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

    .modal-buttons {
      display: flex;
      gap: 24rpx;

      .modal-btn {
        flex: 1;
        height: 80rpx;
        border-radius: 16rpx;
        font-size: 28rpx;
        font-weight: 600;

        &.cancel {
          background: #f5f5f5;
          color: #666;
        }

        &.confirm {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
        }
      }
    }
  }
}
</style>
