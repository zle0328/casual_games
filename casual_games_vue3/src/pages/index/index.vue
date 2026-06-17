<template>
  <view class="container">
    <!-- 顶部装饰 -->
    <view class="header-decoration">
      <image class="float-dice" src="/static/logo.png" mode="aspectFit"></image>
    </view>

    <!-- 标题区域 -->
    <view class="title-section">
      <text class="title">派对游戏 🎲</text>
      <text class="subtitle">让聚会更有趣</text>
    </view>

    <!-- 游戏卡片区域 -->
    <view class="games-section">
      <!-- 摇骰子游戏 -->
      <view class="game-card dice-card" @tap="goDiceGame">
        <view class="card-badge">热门</view>
        <view class="card-icon">🎲</view>
        <view class="card-title">摇骰子</view>
        <view class="card-desc">比大小，谁输谁喝</view>
        <view class="card-arrow">
          <text class="arrow-icon">→</text>
        </view>
      </view>

      <!-- 谁是卧底游戏 -->
      <view class="game-card spy-card" @tap="goSpyGame">
        <view class="card-icon">🕵️</view>
        <view class="card-title">谁是卧底</view>
        <view class="card-desc">找出隐藏的卧底</view>
        <view class="card-arrow">
          <text class="arrow-icon">→</text>
        </view>
      </view>
    </view>

    <!-- 快速入口 -->
    <view class="quick-actions">
      <view class="action-title">快速加入</view>
      <view class="action-buttons">
        <button class="action-btn" @tap="showJoinRoomDialog">
          <text class="btn-icon">🔗</text>
          <text class="btn-text">输入房间码</text>
        </button>
      </view>
    </view>

    <!-- 游戏历史 -->
    <view class="history-section" v-if="recentGames.length > 0">
      <view class="section-header">
        <text class="section-title">最近游戏</text>
        <text class="see-more" @tap="goProfile">查看更多 ></text>
      </view>
      <view class="history-list">
        <view class="history-item" v-for="game in recentGames" :key="game.id">
          <view class="game-icon">{{ game.game_type === 'dice' ? '🎲' : '🕵️' }}</view>
          <view class="game-info">
            <text class="game-name">{{ game.game_type === 'dice' ? '摇骰子' : '谁是卧底' }}</text>
            <text class="game-time">{{ formatTime(game.created_at) }}</text>
          </view>
          <view class="game-result" :class="game.result">
            {{ game.result === 'win' ? '胜利' : game.result === 'lose' ? '失败' : '平局' }}
          </view>
        </view>
      </view>
    </view>

    <!-- 底部导航 -->
    <view class="bottom-nav">
      <view class="nav-item active">
        <text class="nav-icon">🏠</text>
        <text class="nav-text">首页</text>
      </view>
      <view class="nav-item" @tap="goProfile">
        <text class="nav-icon">👤</text>
        <text class="nav-text">我的</text>
      </view>
    </view>

    <!-- 加入房间弹窗 -->
    <view class="modal" v-if="showJoinModal" @tap="closeJoinModal">
      <view class="modal-content" @tap.stop>
        <view class="modal-title">输入房间码</view>
        <input
          class="room-input"
          v-model="roomCode"
          maxlength="6"
          placeholder="请输入6位房间码"
          :focus="showJoinModal"
        />
        <view class="modal-buttons">
          <button class="modal-btn cancel" @tap="closeJoinModal">取消</button>
          <button class="modal-btn confirm" @tap="handleJoinRoom">加入</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUserStore } from '../../stores/user';
import { getUserRecords } from '../../api/user';
import { joinRoom, createRoom } from '../../api/room';
import { formatTime } from '../../utils/helpers';
import type { GameRecord } from '../../types';

const userStore = useUserStore();
const recentGames = ref<GameRecord[]>([]);
const showJoinModal = ref(false);
const roomCode = ref('');

onMounted(async () => {
  // 确保用户已登录
  if (!userStore.isLoggedIn) {
    // TODO: 跳转登录页或创建游客账号
    return;
  }

  // 加载最近游戏记录
  try {
    const res = await getUserRecords(userStore.userId, 5);
    if (res.success && res.data) {
      recentGames.value = res.data.records;
    }
  } catch (error) {
    console.error('Load recent games error:', error);
  }
});

// 跳转摇骰子游戏
function goDiceGame() {
  uni.navigateTo({ url: '/pages/dice-game/index' });
}

// 跳转谁是卧底游戏
async function goSpyGame() {
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }

  try {
    uni.showLoading({ title: '创建房间中...' });

    const res = await createRoom({
      creator_id: userStore.userId,
      game_type: 'spy',
      settings: {
        max_players: 8,
        spy_count: 1,
        blank_count: 0,
      },
    });

    uni.hideLoading();

    if (res.success && res.data) {
      // 跳转到房间页面
      uni.navigateTo({
        url: `/pages/room/index?code=${res.data.room_code}`,
      });
    }
  } catch (error: any) {
    uni.hideLoading();
    uni.showToast({
      title: error.message || '创建房间失败',
      icon: 'none',
    });
  }
}

// 跳转我的页面
function goProfile() {
  uni.switchTab({ url: '/pages/profile/index' });
}

// 显示加入房间弹窗
function showJoinRoomDialog() {
  showJoinModal.value = true;
}

// 关闭加入房间弹窗
function closeJoinModal() {
  showJoinModal.value = false;
  roomCode.value = '';
}

// 处理加入房间
async function handleJoinRoom() {
  if (!roomCode.value || roomCode.value.length !== 6) {
    uni.showToast({ title: '请输入6位房间码', icon: 'none' });
    return;
  }

  try {
    uni.showLoading({ title: '加入中...' });
    const res = await joinRoom({
      room_code: roomCode.value.toUpperCase(),
      user_id: userStore.userId,
    });

    uni.hideLoading();

    if (res.success) {
      closeJoinModal();
      // 跳转到房间页面
      uni.navigateTo({
        url: `/pages/room/index?code=${roomCode.value.toUpperCase()}`,
      });
    }
  } catch (error: any) {
    uni.hideLoading();
    uni.showToast({
      title: error.message || '加入失败',
      icon: 'none',
    });
  }
}
</script>

<style scoped lang="scss">
.container {
  min-height: 100vh;
  padding: 40rpx 32rpx;
  padding-bottom: 160rpx;
}

// 顶部装饰
.header-decoration {
  position: absolute;
  top: 40rpx;
  right: 40rpx;
  opacity: 0.2;

  .float-dice {
    width: 120rpx;
    height: 120rpx;
    animation: float 3s ease-in-out infinite;
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20rpx); }
}

// 标题区域
.title-section {
  margin-top: 60rpx;
  margin-bottom: 60rpx;

  .title {
    display: block;
    font-size: 56rpx;
    font-weight: 700;
    color: #fff;
    margin-bottom: 16rpx;
  }

  .subtitle {
    display: block;
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.8);
  }
}

// 游戏卡片区域
.games-section {
  margin-bottom: 48rpx;

  .game-card {
    position: relative;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%);
    border-radius: 32rpx;
    padding: 48rpx 40rpx;
    margin-bottom: 32rpx;
    box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.15);
    overflow: hidden;
    transition: transform 0.3s;

    &:active {
      transform: scale(0.98);
    }

    .card-badge {
      position: absolute;
      top: 24rpx;
      right: 24rpx;
      background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
      color: #fff;
      font-size: 20rpx;
      padding: 8rpx 16rpx;
      border-radius: 24rpx;
    }

    .card-icon {
      font-size: 80rpx;
      margin-bottom: 16rpx;
    }

    .card-title {
      font-size: 40rpx;
      font-weight: 700;
      color: #333;
      margin-bottom: 12rpx;
    }

    .card-desc {
      font-size: 26rpx;
      color: #999;
    }

    .card-arrow {
      position: absolute;
      bottom: 32rpx;
      right: 32rpx;

      .arrow-icon {
        font-size: 48rpx;
        font-weight: 700;
        color: #667eea;
      }
    }
  }

  .dice-card {
    background: linear-gradient(135deg, #A8EDEA 0%, #FED6E3 100%);
  }

  .spy-card {
    background: linear-gradient(135deg, #C9FFBF 0%, #FFAFBD 100%);
  }
}

// 快速入口
.quick-actions {
  margin-bottom: 48rpx;

  .action-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #fff;
    margin-bottom: 24rpx;
  }

  .action-buttons {
    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10rpx);
      border: 2rpx solid rgba(255, 255, 255, 0.3);
      border-radius: 24rpx;
      padding: 32rpx;
      color: #fff;

      .btn-icon {
        font-size: 36rpx;
        margin-right: 16rpx;
      }

      .btn-text {
        font-size: 28rpx;
        font-weight: 600;
      }
    }
  }
}

// 游戏历史
.history-section {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;

    .section-title {
      font-size: 32rpx;
      font-weight: 600;
      color: #fff;
    }

    .see-more {
      font-size: 24rpx;
      color: rgba(255, 255, 255, 0.8);
    }
  }

  .history-list {
    .history-item {
      display: flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10rpx);
      border-radius: 16rpx;
      padding: 24rpx;
      margin-bottom: 16rpx;

      .game-icon {
        font-size: 48rpx;
        margin-right: 24rpx;
      }

      .game-info {
        flex: 1;
        display: flex;
        flex-direction: column;

        .game-name {
          font-size: 28rpx;
          font-weight: 600;
          color: #fff;
          margin-bottom: 8rpx;
        }

        .game-time {
          font-size: 22rpx;
          color: rgba(255, 255, 255, 0.7);
        }
      }

      .game-result {
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

    .modal-title {
      font-size: 36rpx;
      font-weight: 700;
      text-align: center;
      margin-bottom: 32rpx;
      color: #333;
    }

    .room-input {
      width: 100%;
      height: 88rpx;
      border: 2rpx solid #eee;
      border-radius: 16rpx;
      padding: 0 24rpx;
      font-size: 32rpx;
      text-align: center;
      letter-spacing: 8rpx;
      text-transform: uppercase;
      margin-bottom: 32rpx;
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
