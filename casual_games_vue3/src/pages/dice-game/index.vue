<template>
  <view class="dice-game-container">
    <!-- 顶部导航 -->
    <view class="top-nav">
      <text class="back-btn" @tap="goBack">‹ 返回</text>
      <text class="page-title">摇骰子</text>
      <text class="mode-switch" @tap="switchMode">
        {{ isOnlineMode ? '单机模式' : '联机模式' }}
      </text>
    </view>

    <!-- 骰子区域 -->
    <view class="dice-area">
      <view class="dice-container" :class="{ shaking: isShaking }">
        <view class="dice" v-for="(value, index) in diceValues" :key="index">
          <text class="dice-value">{{ value }}</text>
        </view>
      </view>

      <!-- 结果显示 -->
      <view class="result-section" v-if="showResult">
        <text class="result-title">结果</text>
        <view class="result-content">
          <text class="result-text">总点数: {{ totalPoints }}</text>
          <text class="result-desc" v-if="resultDesc">{{ resultDesc }}</text>
        </view>
      </view>
    </view>

    <!-- 摇骰子按钮 -->
    <view class="action-section">
      <button
        class="shake-btn"
        :class="{ shaking: isShaking }"
        @tap="shakeDice"
        :disabled="isShaking"
      >
        {{ isShaking ? '摇骰子中...' : '🎲 摇一摇' }}
      </button>

      <view class="tip-text">
        <text>摇晃手机或点击按钮摇骰子</text>
      </view>
    </view>

    <!-- 规则说明 -->
    <view class="rules-section">
      <view class="rules-header" @tap="toggleRules">
        <text class="rules-title">📖 游戏规则</text>
        <text class="rules-arrow" :class="{ expanded: showRules }">›</text>
      </view>
      <view class="rules-content" v-if="showRules">
        <view class="rule-item">
          <text class="rule-dot">•</text>
          <text class="rule-text">豹子（三个相同）：最大，其他人喝</text>
        </view>
        <view class="rule-item">
          <text class="rule-dot">•</text>
          <text class="rule-text">顺子（连续三个）：第二大</text>
        </view>
        <view class="rule-item">
          <text class="rule-dot">•</text>
          <text class="rule-text">对子（两个相同）：按总点数比</text>
        </view>
        <view class="rule-item">
          <text class="rule-dot">•</text>
          <text class="rule-text">散点：按总点数比，最小喝</text>
        </view>
      </view>
    </view>

    <!-- 历史记录 -->
    <view class="history-section" v-if="history.length > 0">
      <text class="history-title">最近记录</text>
      <view class="history-list">
        <view class="history-item" v-for="(item, index) in history" :key="index">
          <view class="history-dice">
            <text v-for="(val, i) in item.values" :key="i" class="history-value">
              {{ val }}
            </text>
          </view>
          <text class="history-points">{{ item.total }}点</text>
          <text class="history-type">{{ item.type }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useUserStore } from '../../stores/user';
import { randomInt, vibrateShort, vibrateLong } from '../../utils/helpers';
import { getRoom } from '../../api/room';
import { saveGameResult } from '../../api/game';

const userStore = useUserStore();

const isOnlineMode = ref(false);
const roomCode = ref('');
const isShaking = ref(false);
const showResult = ref(false);
const showRules = ref(false);
const diceValues = ref([1, 1, 1]);
const totalPoints = ref(3);
const resultDesc = ref('');
const history = ref<Array<{ values: number[]; total: number; type: string }>>([]);

// 联机模式相关
const roomPlayers = ref<Array<{ user_id: string; nickname: string; diceResult?: number[] }>>([]);
const myRank = ref(0);
let pollTimer: ReturnType<typeof setInterval> | null = null;

let accelerometerListener: any = null;
let lastShakeTime = 0;

onMounted(() => {
  // 从路由参数判断是否联机模式
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = (currentPage as any).options || {};

  if (options.room) {
    isOnlineMode.value = true;
    roomCode.value = options.room;
    loadRoomData();
    startPolling();
  }

  // 监听加速度计（摇一摇）
  startAccelerometer();
});

onUnmounted(() => {
  stopAccelerometer();
  stopPolling();
});

// 加载房间数据
async function loadRoomData() {
  try {
    const res = await getRoom(roomCode.value);
    if (res.success && res.data) {
      roomPlayers.value = res.data.players || [];
    }
  } catch (error) {
    console.error('Load room error:', error);
  }
}

// 开始轮询
function startPolling() {
  pollTimer = setInterval(() => {
    loadRoomData();
  }, 3000);
}

// 停止轮询
function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

// 启动加速度计监听
function startAccelerometer() {
  uni.onAccelerometerChange((res) => {
    const now = Date.now();
    if (now - lastShakeTime < 1000) return; // 防抖

    const acceleration = Math.abs(res.x) + Math.abs(res.y) + Math.abs(res.z);
    if (acceleration > 25 && !isShaking.value) {
      lastShakeTime = now;
      shakeDice();
    }
  });

  uni.startAccelerometer({
    interval: 'normal',
  });
}

// 停止加速度计监听
function stopAccelerometer() {
  uni.stopAccelerometer();
}

// 摇骰子
function shakeDice() {
  if (isShaking.value) return;

  isShaking.value = true;
  showResult.value = false;
  vibrateShort();

  // 模拟摇骰子动画
  let count = 0;
  const interval = setInterval(() => {
    diceValues.value = [
      randomInt(1, 6),
      randomInt(1, 6),
      randomInt(1, 6),
    ];
    count++;

    if (count >= 15) {
      clearInterval(interval);
      finishShake();
    }
  }, 100);
}

// 摇骰子完成
async function finishShake() {
  isShaking.value = false;
  showResult.value = true;

  // 计算结果
  const sorted = [...diceValues.value].sort((a, b) => a - b);
  totalPoints.value = sorted.reduce((sum, val) => sum + val, 0);

  // 判断类型
  let type = '';
  if (sorted[0] === sorted[1] && sorted[1] === sorted[2]) {
    type = '豹子';
    resultDesc.value = '🎉 豹子！其他人喝！';
    vibrateLong();
  } else if (sorted[0] + 1 === sorted[1] && sorted[1] + 1 === sorted[2]) {
    type = '顺子';
    resultDesc.value = '✨ 顺子！不错哦！';
    vibrateShort();
  } else if (sorted[0] === sorted[1] || sorted[1] === sorted[2]) {
    type = '对子';
    resultDesc.value = '💪 对子，还可以';
  } else {
    type = '散点';
    resultDesc.value = totalPoints.value <= 6 ? '😅 点数太小了' : '👍 还不错';
  }

  // 添加到历史记录
  history.value.unshift({
    values: [...diceValues.value],
    total: totalPoints.value,
    type,
  });

  if (history.value.length > 10) {
    history.value.pop();
  }

  // 联机模式：保存结果到后端
  if (isOnlineMode.value && roomCode.value) {
    try {
      await saveGameResult({
        room_code: roomCode.value,
        user_id: userStore.userId,
        game_type: 'dice',
        result: 'draw', // 骰子游戏没有明确胜负
        details: {
          values: diceValues.value,
          total: totalPoints.value,
          type,
        },
      });
    } catch (error) {
      console.error('Save result error:', error);
    }
  }
}

// 切换模式
function switchMode() {
  if (!isOnlineMode.value) {
    uni.showModal({
      title: '提示',
      content: '联机模式需要创建或加入房间，是否前往首页？',
      success: (res) => {
        if (res.confirm) {
          uni.navigateBack();
        }
      },
    });
  } else {
    // 退出联机模式
    uni.showModal({
      title: '确认退出',
      content: '确定要退出联机模式吗？',
      success: (res) => {
        if (res.confirm) {
          stopPolling();
          uni.navigateBack();
        }
      },
    });
  }
}

// 展开/收起规则
function toggleRules() {
  showRules.value = !showRules.value;
}

// 返回
function goBack() {
  if (isOnlineMode.value) {
    uni.showModal({
      title: '确认退出',
      content: '确定要退出房间吗？',
      success: (res) => {
        if (res.confirm) {
          stopPolling();
          uni.navigateBack();
        }
      },
    });
  } else {
    uni.navigateBack();
  }
}
</script>

<style scoped lang="scss">
.dice-game-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  padding-bottom: 40rpx;
}

// 顶部导航
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 32rpx;
  padding-top: calc(32rpx + env(safe-area-inset-top));

  .back-btn,
  .mode-switch {
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
}

// 骰子区域
.dice-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 0;

  .dice-container {
    display: flex;
    gap: 24rpx;
    margin-bottom: 48rpx;

    &.shaking .dice {
      animation: shake 0.1s infinite;
    }

    .dice {
      width: 160rpx;
      height: 160rpx;
      background: #fff;
      border-radius: 24rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.3);

      .dice-value {
        font-size: 88rpx;
        font-weight: 700;
        color: #667eea;
      }
    }
  }

  .result-section {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 24rpx;
    padding: 32rpx 48rpx;
    min-width: 500rpx;
    text-align: center;

    .result-title {
      font-size: 28rpx;
      color: #999;
      margin-bottom: 16rpx;
      display: block;
    }

    .result-content {
      display: flex;
      flex-direction: column;
      gap: 12rpx;

      .result-text {
        font-size: 40rpx;
        font-weight: 700;
        color: #333;
      }

      .result-desc {
        font-size: 28rpx;
        color: #667eea;
      }
    }
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0) rotate(0deg); }
  25% { transform: translateX(-10rpx) rotate(-5deg); }
  75% { transform: translateX(10rpx) rotate(5deg); }
}

// 操作区域
.action-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 48rpx;
  margin-bottom: 48rpx;

  .shake-btn {
    width: 100%;
    height: 120rpx;
    background: rgba(255, 255, 255, 0.95);
    color: #667eea;
    border: none;
    border-radius: 60rpx;
    font-size: 36rpx;
    font-weight: 700;
    box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.2);
    transition: transform 0.3s;

    &:active:not(:disabled) {
      transform: scale(0.95);
    }

    &:disabled {
      opacity: 0.7;
    }

    &.shaking {
      animation: pulse 0.5s infinite;
    }
  }

  .tip-text {
    margin-top: 24rpx;
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.8);
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

// 规则说明
.rules-section {
  margin: 0 32rpx 32rpx;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24rpx;
  overflow: hidden;

  .rules-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32rpx 24rpx;
    cursor: pointer;

    .rules-title {
      font-size: 28rpx;
      font-weight: 600;
      color: #333;
    }

    .rules-arrow {
      font-size: 40rpx;
      color: #999;
      transition: transform 0.3s;

      &.expanded {
        transform: rotate(90deg);
      }
    }
  }

  .rules-content {
    padding: 0 24rpx 32rpx;

    .rule-item {
      display: flex;
      margin-bottom: 16rpx;

      .rule-dot {
        font-size: 28rpx;
        color: #667eea;
        margin-right: 12rpx;
      }

      .rule-text {
        flex: 1;
        font-size: 26rpx;
        color: #666;
        line-height: 1.6;
      }
    }
  }
}

// 历史记录
.history-section {
  margin: 0 32rpx;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24rpx;
  padding: 32rpx 24rpx;

  .history-title {
    font-size: 28rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 24rpx;
    display: block;
  }

  .history-list {
    .history-item {
      display: flex;
      align-items: center;
      padding: 16rpx 0;
      border-bottom: 1rpx solid #f5f5f5;

      &:last-child {
        border-bottom: none;
      }

      .history-dice {
        display: flex;
        gap: 8rpx;
        flex: 1;

        .history-value {
          width: 48rpx;
          height: 48rpx;
          background: #f5f5f5;
          border-radius: 8rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28rpx;
          font-weight: 700;
          color: #667eea;
        }
      }

      .history-points {
        font-size: 24rpx;
        color: #666;
        margin: 0 16rpx;
      }

      .history-type {
        font-size: 22rpx;
        color: #fff;
        background: #667eea;
        padding: 4rpx 12rpx;
        border-radius: 12rpx;
      }
    }
  }
}
</style>
