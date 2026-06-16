<template>
  <view class="room-container">
    <!-- 顶部导航 -->
    <view class="top-nav">
      <text class="back-btn" @tap="goBack">‹ 返回</text>
      <text class="page-title">游戏房间</text>
      <text class="room-status" :class="roomStatus">{{ roomStatusText }}</text>
    </view>

    <!-- 房间信息卡片 -->
    <view class="room-info-card">
      <view class="room-header">
        <view class="room-icon">{{ gameTypeIcon }}</view>
        <view class="room-details">
          <text class="room-game-type">{{ gameTypeName }}</text>
          <view class="room-code-section">
            <text class="room-code-label">房间码:</text>
            <text class="room-code-value">{{ roomCode }}</text>
            <text class="copy-btn" @tap="copyRoomCode">复制</text>
          </view>
        </view>
      </view>

      <view class="room-stats">
        <view class="stat-item">
          <text class="stat-value">{{ players.length }}/{{ maxPlayers }}</text>
          <text class="stat-label">玩家</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-value">{{ isCreator ? '房主' : '玩家' }}</text>
          <text class="stat-label">身份</text>
        </view>
      </view>
    </view>

    <!-- 玩家列表 -->
    <view class="players-section">
      <text class="section-title">玩家列表 ({{ players.length }})</text>
      <view class="player-list">
        <view class="player-item" v-for="player in players" :key="player.user_id">
          <view class="player-avatar">{{ player.avatar || '😎' }}</view>
          <view class="player-info">
            <text class="player-nickname">{{ player.nickname }}</text>
            <text class="player-tag" v-if="player.user_id === creatorId">房主</text>
          </view>
          <view class="player-status">
            <text class="status-dot ready"></text>
            <text class="status-text">准备</text>
          </view>
        </view>

        <!-- 空位 -->
        <view
          class="player-item empty"
          v-for="n in (maxPlayers - players.length)"
          :key="`empty-${n}`"
        >
          <view class="player-avatar empty">👤</view>
          <view class="player-info">
            <text class="player-nickname">等待加入...</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 游戏设置 (房主可见) -->
    <view class="settings-section" v-if="isCreator && roomStatus === 'waiting'">
      <text class="section-title">游戏设置</text>
      <view class="settings-card">
        <view class="setting-item" v-if="gameType === 'spy'">
          <text class="setting-label">卧底数量</text>
          <view class="setting-control">
            <text class="control-btn" @tap="changeSpyCount(-1)">-</text>
            <text class="control-value">{{ spyCount }}</text>
            <text class="control-btn" @tap="changeSpyCount(1)">+</text>
          </view>
        </view>

        <view class="setting-item" v-if="gameType === 'dice'">
          <text class="setting-label">惩罚规则</text>
          <picker
            class="setting-picker"
            mode="selector"
            :range="punishmentRules"
            :value="punishmentIndex"
            @change="onPunishmentChange"
          >
            <text>{{ punishmentRules[punishmentIndex] }}</text>
          </picker>
        </view>
      </view>
    </view>

    <!-- 底部操作区 -->
    <view class="action-section">
      <button class="btn-action primary" @tap="handleAction" v-if="isCreator && roomStatus === 'waiting'">
        开始游戏
      </button>

      <button class="btn-action secondary" @tap="leaveRoom">
        离开房间
      </button>
    </view>

    <!-- 等待提示 -->
    <view class="waiting-tip" v-if="!isCreator && roomStatus === 'waiting'">
      <text>等待房主开始游戏...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useUserStore } from '../../stores/user';
import { getRoom, startGame } from '../../api/room';
import { copyToClipboard } from '../../utils/helpers';
import type { RoomPlayer } from '../../types';

const userStore = useUserStore();

const roomCode = ref('');
const gameType = ref<'dice' | 'spy'>('dice');
const roomStatus = ref<'waiting' | 'playing' | 'finished'>('waiting');
const creatorId = ref('');
const players = ref<RoomPlayer[]>([]);
const maxPlayers = ref(8);
const spyCount = ref(1);
const punishmentIndex = ref(0);
const punishmentRules = ['最小喝', '最大喝', '豹子喝'];

let pollTimer: ReturnType<typeof setInterval> | null = null;

const isCreator = computed(() => userStore.userId === creatorId.value);

const gameTypeIcon = computed(() => gameType.value === 'dice' ? '🎲' : '🕵️');
const gameTypeName = computed(() => gameType.value === 'dice' ? '摇骰子' : '谁是卧底');

const roomStatusText = computed(() => {
  switch (roomStatus.value) {
    case 'waiting': return '等待中';
    case 'playing': return '游戏中';
    case 'finished': return '已结束';
    default: return '';
  }
});

onMounted(() => {
  // 从路由参数获取房间码
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = (currentPage as any).options || {};
  roomCode.value = options.code || '';

  if (roomCode.value) {
    loadRoomInfo();
    startPolling();
  } else {
    uni.showToast({
      title: '房间码无效',
      icon: 'none',
    });
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  }
});

onUnmounted(() => {
  stopPolling();
});

// 加载房间信息
async function loadRoomInfo() {
  try {
    const res = await getRoom(roomCode.value);
    if (res.success && res.data) {
      gameType.value = res.data.game_type;
      roomStatus.value = res.data.status;
      creatorId.value = res.data.creator_id;
      players.value = res.data.players || [];

      const settings = typeof res.data.settings === 'string'
        ? JSON.parse(res.data.settings)
        : res.data.settings;

      if (settings) {
        maxPlayers.value = settings.max_players || 8;
        spyCount.value = settings.spy_count || 1;
      }

      // 如果游戏已开始，跳转到游戏页面
      if (roomStatus.value === 'playing') {
        jumpToGame();
      }
    }
  } catch (error: any) {
    console.error('Load room error:', error);
    uni.showToast({
      title: error.message || '加载房间失败',
      icon: 'none',
    });
  }
}

// 开始轮询房间状态
function startPolling() {
  pollTimer = setInterval(() => {
    loadRoomInfo();
  }, 3000); // 每3秒轮询一次
}

// 停止轮询
function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

// 复制房间码
function copyRoomCode() {
  copyToClipboard(roomCode.value);
}

// 改变卧底数量
function changeSpyCount(delta: number) {
  const newCount = spyCount.value + delta;
  const maxSpies = Math.floor(players.value.length / 2);
  if (newCount >= 1 && newCount <= maxSpies) {
    spyCount.value = newCount;
  }
}

// 惩罚规则改变
function onPunishmentChange(e: any) {
  punishmentIndex.value = e.detail.value;
}

// 主操作按钮
async function handleAction() {
  if (!isCreator.value) return;

  if (roomStatus.value === 'waiting') {
    // 开始游戏
    if (players.value.length < 3) {
      uni.showToast({
        title: '至少需要3人才能开始',
        icon: 'none',
      });
      return;
    }

    try {
      uni.showLoading({ title: '开始游戏...' });

      const res = await startGame({
        room_code: roomCode.value,
        user_id: userStore.userId,
      });

      uni.hideLoading();

      if (res.success) {
        roomStatus.value = 'playing';
        jumpToGame();
      }
    } catch (error: any) {
      uni.hideLoading();
      uni.showToast({
        title: error.message || '开始游戏失败',
        icon: 'none',
      });
    }
  }
}

// 跳转到游戏页面
function jumpToGame() {
  stopPolling();

  const url = gameType.value === 'dice'
    ? `/pages/dice-game/index?room=${roomCode.value}`
    : `/pages/spy-game/index?room=${roomCode.value}`;

  uni.redirectTo({ url });
}

// 离开房间
function leaveRoom() {
  uni.showModal({
    title: '确认离开',
    content: '确定要离开房间吗？',
    success: (res) => {
      if (res.confirm) {
        stopPolling();
        // TODO: 调用离开房间 API
        uni.navigateBack();
      }
    },
  });
}

// 返回
function goBack() {
  leaveRoom();
}
</script>

<style scoped lang="scss">
.room-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  padding-bottom: 180rpx;
}

// 顶部导航
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 32rpx;
  padding-top: calc(32rpx + env(safe-area-inset-top));

  .back-btn {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.9);
    padding: 12rpx 24rpx;
    border-radius: 24rpx;
    background: rgba(255, 255, 255, 0.2);
  }

  .page-title {
    font-size: 36rpx;
    font-weight: 700;
    color: #fff;
  }

  .room-status {
    font-size: 24rpx;
    color: #fff;
    padding: 8rpx 20rpx;
    border-radius: 24rpx;

    &.waiting {
      background: #ff9800;
    }

    &.playing {
      background: #4caf50;
    }

    &.finished {
      background: #999;
    }
  }
}

// 房间信息卡片
.room-info-card {
  margin: 0 32rpx 32rpx;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 32rpx;
  padding: 40rpx;

  .room-header {
    display: flex;
    align-items: center;
    margin-bottom: 32rpx;

    .room-icon {
      font-size: 72rpx;
      margin-right: 24rpx;
    }

    .room-details {
      flex: 1;

      .room-game-type {
        font-size: 32rpx;
        font-weight: 700;
        color: #333;
        display: block;
        margin-bottom: 12rpx;
      }

      .room-code-section {
        display: flex;
        align-items: center;
        gap: 12rpx;

        .room-code-label {
          font-size: 24rpx;
          color: #999;
        }

        .room-code-value {
          font-size: 32rpx;
          font-weight: 700;
          color: #667eea;
          letter-spacing: 4rpx;
        }

        .copy-btn {
          font-size: 22rpx;
          color: #667eea;
          padding: 4rpx 16rpx;
          border: 1rpx solid #667eea;
          border-radius: 16rpx;
        }
      }
    }
  }

  .room-stats {
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
        font-size: 36rpx;
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

// 玩家列表
.players-section {
  margin: 0 32rpx 32rpx;

  .section-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #fff;
    margin-bottom: 16rpx;
    display: block;
  }

  .player-list {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 24rpx;
    overflow: hidden;

    .player-item {
      display: flex;
      align-items: center;
      padding: 24rpx;
      border-bottom: 1rpx solid #f5f5f5;

      &:last-child {
        border-bottom: none;
      }

      &.empty {
        opacity: 0.5;
      }

      .player-avatar {
        width: 88rpx;
        height: 88rpx;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 48rpx;
        margin-right: 24rpx;

        &.empty {
          background: #f5f5f5;
        }
      }

      .player-info {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 12rpx;

        .player-nickname {
          font-size: 28rpx;
          font-weight: 600;
          color: #333;
        }

        .player-tag {
          font-size: 20rpx;
          color: #fff;
          background: #ff9800;
          padding: 4rpx 12rpx;
          border-radius: 12rpx;
        }
      }

      .player-status {
        display: flex;
        align-items: center;
        gap: 8rpx;

        .status-dot {
          width: 12rpx;
          height: 12rpx;
          border-radius: 50%;

          &.ready {
            background: #4caf50;
          }
        }

        .status-text {
          font-size: 22rpx;
          color: #4caf50;
        }
      }
    }
  }
}

// 游戏设置
.settings-section {
  margin: 0 32rpx 32rpx;

  .section-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #fff;
    margin-bottom: 16rpx;
    display: block;
  }

  .settings-card {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 24rpx;
    padding: 32rpx 24rpx;

    .setting-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16rpx 0;

      .setting-label {
        font-size: 28rpx;
        font-weight: 600;
        color: #333;
      }

      .setting-control {
        display: flex;
        align-items: center;
        gap: 24rpx;
        background: #f5f5f5;
        border-radius: 48rpx;
        padding: 8rpx 24rpx;

        .control-btn {
          width: 48rpx;
          height: 48rpx;
          background: #667eea;
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28rpx;
          font-weight: 700;
        }

        .control-value {
          font-size: 32rpx;
          font-weight: 700;
          color: #333;
          min-width: 48rpx;
          text-align: center;
        }
      }

      .setting-picker {
        font-size: 26rpx;
        color: #667eea;
        padding: 8rpx 20rpx;
        background: #f5f5f5;
        border-radius: 24rpx;
      }
    }
  }
}

// 底部操作区
.action-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.95);
  border-top: 1rpx solid #eee;
  display: flex;
  flex-direction: column;
  gap: 16rpx;

  .btn-action {
    width: 100%;
    height: 88rpx;
    border: none;
    border-radius: 48rpx;
    font-size: 32rpx;
    font-weight: 600;

    &.primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
    }

    &.secondary {
      background: #f5f5f5;
      color: #999;
    }
  }
}

// 等待提示
.waiting-tip {
  position: fixed;
  bottom: 140rpx;
  left: 50%;
  transform: translateX(-50%);
  padding: 16rpx 32rpx;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 48rpx;
  font-size: 24rpx;
  color: #999;
  white-space: nowrap;
}
</style>
