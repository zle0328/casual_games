<template>
  <view class="spy-game-container">
    <!-- 顶部导航 -->
    <view class="top-nav">
      <text class="back-btn" @tap="goBack">‹ 返回</text>
      <text class="page-title">谁是卧底</text>
      <text class="room-code" v-if="gameState === 'playing'">房间: {{ roomCode }}</text>
    </view>

    <!-- 游戏设置 (初始状态) -->
    <view class="setup-section" v-if="gameState === 'setup' && !isOnlineMode">
      <view class="setup-card">
        <view class="setup-item">
          <text class="setup-label">玩家人数</text>
          <view class="number-picker">
            <text class="picker-btn" @tap="changePlayerCount(-1)">-</text>
            <text class="picker-value">{{ playerCount }}</text>
            <text class="picker-btn" @tap="changePlayerCount(1)">+</text>
          </view>
        </view>

        <view class="setup-item">
          <text class="setup-label">卧底数量</text>
          <view class="number-picker">
            <text class="picker-btn" @tap="changeSpyCount(-1)">-</text>
            <text class="picker-value">{{ spyCount }}</text>
            <text class="picker-btn" @tap="changeSpyCount(1)">+</text>
          </view>
        </view>

        <view class="setup-item">
          <text class="setup-label">白板数量</text>
          <view class="number-picker">
            <text class="picker-btn" @tap="changeBlankCount(-1)">-</text>
            <text class="picker-value">{{ blankCount }}</text>
            <text class="picker-btn" @tap="changeBlankCount(1)">+</text>
          </view>
        </view>

        <view class="setup-tip">
          <text>平民: {{ playerCount - spyCount - blankCount }} 人</text>
        </view>

        <button class="btn-start-game" @tap="startGame">
          开始游戏
        </button>
      </view>
    </view>

    <!-- 查看身份 (游戏中) -->
    <view class="identity-section" v-if="gameState === 'playing' && !identityRevealed">
      <view class="identity-card">
        <text class="identity-tip">🤫 点击查看你的身份</text>
        <text class="identity-warning">注意保密，不要让别人看到</text>
        <button class="btn-reveal" @tap="revealIdentity">
          查看身份
        </button>
      </view>
    </view>

    <!-- 显示身份 -->
    <view class="word-section" v-if="gameState === 'playing' && identityRevealed">
      <view class="word-card" :class="myRole">
        <text class="role-title">
          {{ myRole === 'spy' ? '🕵️ 你是卧底' : myRole === 'blank' ? '⚪ 你是白板' : '😇 你是平民' }}
        </text>

        <view class="word-display" v-if="myRole !== 'blank'">
          <text class="word-label">你的词条</text>
          <text class="word-text">{{ myWord }}</text>
        </view>

        <view class="word-display blank-hint" v-else>
          <text class="word-label">你没有词条</text>
          <text class="word-hint">根据其他人的描述推测词条</text>
        </view>

        <button class="btn-continue" @tap="enterVoting">
          开始游戏
        </button>
      </view>
    </view>

    <!-- 投票环节 -->
    <view class="voting-section" v-if="gameState === 'voting'">
      <view class="voting-card">
        <text class="voting-title">投票环节</text>
        <text class="voting-desc">讨论后选择你认为的卧底</text>

        <view class="player-list">
          <view
            class="player-item"
            v-for="n in playerCount"
            :key="n"
            :class="{ selected: selectedPlayer === n, eliminated: eliminatedPlayers.includes(n) }"
            @tap="selectPlayer(n)"
          >
            <text class="player-number">{{ n }}</text>
            <text class="player-label">{{ eliminatedPlayers.includes(n) ? '已淘汰' : `玩家 ${n}` }}</text>
          </view>
        </view>

        <button class="btn-vote" @tap="confirmVote" :disabled="!selectedPlayer">
          确认投票
        </button>

        <button class="btn-end-game" @tap="endGame">
          结束游戏
        </button>
      </view>
    </view>

    <!-- 游戏结束 -->
    <view class="result-section" v-if="gameState === 'ended'">
      <view class="result-card">
        <text class="result-icon">{{ gameResult === 'spy_win' ? '🕵️' : '😇' }}</text>
        <text class="result-title">
          {{ gameResult === 'spy_win' ? '卧底胜利！' : '平民胜利！' }}
        </text>
        <text class="result-desc">{{ resultMessage }}</text>

        <view class="role-reveal">
          <text class="reveal-title">身份揭晓</text>
          <view class="reveal-list">
            <view class="reveal-item" v-for="(role, index) in assignedRoles" :key="index">
              <text class="reveal-player">玩家 {{ index + 1 }}</text>
              <text class="reveal-role" :class="role">
                {{ role === 'spy' ? '卧底' : role === 'blank' ? '白板' : '平民' }}
              </text>
            </view>
          </view>
        </view>

        <button class="btn-restart" @tap="restartGame" v-if="!isOnlineMode || isHost">
          再来一局
        </button>
        <text class="restart-waiting" v-else-if="isOnlineMode">
          等待房主开始新一局...
        </text>

        <button class="btn-back-home" @tap="goHome">
          返回首页
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useUserStore } from '../../stores/user';
import { shuffle } from '../../utils/helpers';
import { getRoom } from '../../api/room';
import { assignSpyRoles, saveGameResult, getMyIdentity, restartSpyGame } from '../../api/game';

type GameState = 'setup' | 'playing' | 'voting' | 'ended';
type Role = 'civilian' | 'spy' | 'blank';

const userStore = useUserStore();

const gameState = ref<GameState>('setup');
const playerCount = ref(5);
const spyCount = ref(1);
const blankCount = ref(0);
const roomCode = ref('');
const isOnlineMode = ref(false);

const identityRevealed = ref(false);
const myRole = ref<Role>('civilian');
const myWord = ref('');
const myPlayerNumber = ref(1);

const selectedPlayer = ref<number | null>(null);
const eliminatedPlayers = ref<number[]>([]);
const assignedRoles = ref<Role[]>([]);

const gameResult = ref<'spy_win' | 'civilian_win'>('civilian_win');
const resultMessage = ref('');

// 房主判定与局数版本戳（started_at 变化代表房主开始了新一局）
const creatorId = ref('');
const roundKey = ref('');
const isHost = computed(() => isOnlineMode.value && !!roomCode.value && userStore.userId === creatorId.value);

let pollTimer: ReturnType<typeof setInterval> | null = null;

// 词条库
const wordPairs = [
  { civilian: '包子', spy: '饺子' },
  { civilian: '牛奶', spy: '豆浆' },
  { civilian: '西瓜', spy: '冬瓜' },
  { civilian: '手机', spy: '座机' },
  { civilian: '眉毛', spy: '睫毛' },
  { civilian: '作家', spy: '诗人' },
  { civilian: '玫瑰', spy: '月季' },
  { civilian: '汽车', spy: '火车' },
  { civilian: '状元', spy: '冠军' },
  { civilian: '饼干', spy: '薯片' },
];

onLoad((options: any) => {
  // 通过 onLoad 接收路由参数（H5 下 getCurrentPages().options 不可靠）
  if (options?.room) {
    isOnlineMode.value = true;
    roomCode.value = options.room;
    loadRoomData();
    startPolling();
  }
});

onUnmounted(() => {
  stopPolling();
});

// 加载房间数据
async function loadRoomData() {
  try {
    const res = await getRoom(roomCode.value);
    if (res.success && res.data) {
      creatorId.value = res.data.creator_id || '';
      playerCount.value = res.data.players?.length || 5;

      // 从房间设置加载配置
      const settings = typeof res.data.settings === 'string'
        ? JSON.parse(res.data.settings)
        : res.data.settings;
      if (settings) {
        spyCount.value = settings.spy_count || 1;
        blankCount.value = settings.blank_count || 0;
      }

      // 局数版本戳（started_at）变化代表房主开始了新一局（含首次进入游戏）
      const newRoundKey = res.data.started_at || '';
      if (res.data.status === 'playing' && newRoundKey && newRoundKey !== roundKey.value) {
        roundKey.value = newRoundKey;
        await startGame();
      }
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

// 改变玩家人数
function changePlayerCount(delta: number) {
  const newCount = playerCount.value + delta;
  if (newCount >= 3 && newCount <= 10) {
    playerCount.value = newCount;
    // 确保卧底+白板不超过玩家数-1
    if (spyCount.value + blankCount.value >= newCount) {
      spyCount.value = 1;
      blankCount.value = 0;
    }
  }
}

// 改变卧底数量
function changeSpyCount(delta: number) {
  const newCount = spyCount.value + delta;
  if (newCount >= 1 && newCount + blankCount.value < playerCount.value) {
    spyCount.value = newCount;
  }
}

// 改变白板数量
function changeBlankCount(delta: number) {
  const newCount = blankCount.value + delta;
  if (newCount >= 0 && newCount + spyCount.value < playerCount.value) {
    blankCount.value = newCount;
  }
}

// 开始游戏
async function startGame() {
  // 联机模式：从后端获取角色分配
  if (isOnlineMode.value && roomCode.value) {
    try {
      uni.showLoading({ title: '加载身份中...' });

      const res = await getMyIdentity(roomCode.value, userStore.userId);

      uni.hideLoading();

      if (res.success && res.data) {
        myRole.value = res.data.role;
        myWord.value = res.data.word || '';

        // 进入新一局：清空上局的投票/淘汰/身份揭示状态
        identityRevealed.value = false;
        eliminatedPlayers.value = [];
        selectedPlayer.value = null;
        assignedRoles.value = [];
        gameState.value = 'playing';

        uni.showToast({
          title: '游戏开始！',
          icon: 'success',
        });
      }
    } catch (error: any) {
      uni.hideLoading();
      uni.showToast({
        title: error.message || '开始游戏失败',
        icon: 'none',
      });
      return;
    }
  } else {
    startLocalGame();
  }
}

// 单机模式开始游戏
function startLocalGame() {
  // 随机选择词条
  const wordPair = wordPairs[Math.floor(Math.random() * wordPairs.length)];

  // 分配角色
  const roles: Role[] = [
    ...Array(spyCount.value).fill('spy'),
    ...Array(blankCount.value).fill('blank'),
    ...Array(playerCount.value - spyCount.value - blankCount.value).fill('civilian'),
  ];
  assignedRoles.value = shuffle(roles);

  // 随机分配给当前玩家一个身份
  myPlayerNumber.value = Math.floor(Math.random() * playerCount.value) + 1;
  myRole.value = assignedRoles.value[myPlayerNumber.value - 1];
  myWord.value = myRole.value === 'spy' ? wordPair.spy : wordPair.civilian;

  gameState.value = 'playing';
  identityRevealed.value = false;

  uni.showToast({
    title: '游戏开始！',
    icon: 'success',
  });
}

// 揭示身份
function revealIdentity() {
  identityRevealed.value = true;
}

// 进入投票
function enterVoting() {
  gameState.value = 'voting';
}

// 选择玩家
function selectPlayer(playerNum: number) {
  if (eliminatedPlayers.value.includes(playerNum)) return;
  selectedPlayer.value = playerNum;
}

// 确认投票
function confirmVote() {
  if (!selectedPlayer.value) return;

  eliminatedPlayers.value.push(selectedPlayer.value);
  selectedPlayer.value = null;

  // 判断游戏是否结束
  checkGameEnd();
}

// 检查游戏结束条件
function checkGameEnd() {
  const remainingRoles = assignedRoles.value.filter(
    (_, index) => !eliminatedPlayers.value.includes(index + 1)
  );

  const remainingSpies = remainingRoles.filter(r => r === 'spy').length;
  const remainingCivilians = remainingRoles.filter(r => r === 'civilian').length;

  // 卧底全部淘汰，平民胜利
  if (remainingSpies === 0) {
    endGameWithResult('civilian_win', '所有卧底已被找出！');
    return;
  }

  // 卧底数量 >= 平民数量，卧底胜利
  if (remainingSpies >= remainingCivilians) {
    endGameWithResult('spy_win', '卧底成功隐藏！');
    return;
  }

  uni.showToast({
    title: '继续投票',
    icon: 'none',
  });
}

// 结束游戏
function endGame() {
  uni.showModal({
    title: '确认结束',
    content: '游戏还未分出胜负，确定要结束吗？',
    success: (res) => {
      if (res.confirm) {
        endGameWithResult('civilian_win', '游戏提前结束');
      }
    },
  });
}

// 以指定结果结束游戏
async function endGameWithResult(result: 'spy_win' | 'civilian_win', message: string) {
  gameResult.value = result;
  resultMessage.value = message;
  gameState.value = 'ended';

  // 联机模式：保存结果
  if (isOnlineMode.value && roomCode.value) {
    try {
      await saveGameResult({
        room_code: roomCode.value,
        user_id: userStore.userId,
        game_type: 'spy',
        result: myRole.value === 'spy'
          ? (result === 'spy_win' ? 'win' : 'lose')
          : (result === 'civilian_win' ? 'win' : 'lose'),
        details: {
          role: myRole.value,
          word: myWord.value,
          eliminated: eliminatedPlayers.value.includes(myPlayerNumber.value),
        },
      });
    } catch (error) {
      console.error('Save result error:', error);
    }
  }
}

// 重新开始
async function restartGame() {
  // 单机模式：回到设置界面
  if (!isOnlineMode.value) {
    gameState.value = 'setup';
    identityRevealed.value = false;
    eliminatedPlayers.value = [];
    selectedPlayer.value = null;
    assignedRoles.value = [];
    return;
  }

  // 联机模式：仅房主可开始新一局，触发后端重新分配角色与词条
  if (!isHost.value) {
    uni.showToast({ title: '只有房主可以开始新一局', icon: 'none' });
    return;
  }

  try {
    uni.showLoading({ title: '开始新一局...' });

    const res = await restartSpyGame({
      room_code: roomCode.value,
      user_id: userStore.userId,
    });

    uni.hideLoading();

    if (res.success && res.data) {
      // 同步局数版本戳，避免下次轮询重复触发
      roundKey.value = res.data.round_key;
      // 立即拉取新身份进入新一局（成员端由轮询感知 started_at 变化自动刷新）
      await startGame();
    }
  } catch (error: any) {
    uni.hideLoading();
    uni.showToast({
      title: error.message || '开始新一局失败',
      icon: 'none',
    });
  }
}

// 返回首页
function goHome() {
  uni.navigateBack();
}

// 返回
function goBack() {
  if (gameState.value === 'setup') {
    uni.navigateBack();
  } else {
    uni.showModal({
      title: '确认退出',
      content: '游戏进行中，确定要退出吗？',
      success: (res) => {
        if (res.confirm) {
          uni.navigateBack();
        }
      },
    });
  }
}
</script>

<style scoped lang="scss">
.spy-game-container {
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
  .room-code {
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

// 游戏设置
.setup-section {
  padding: 40rpx 32rpx;

  .setup-card {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 32rpx;
    padding: 48rpx 40rpx;

    .setup-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 32rpx;

      .setup-label {
        font-size: 32rpx;
        font-weight: 600;
        color: #333;
      }

      .number-picker {
        display: flex;
        align-items: center;
        gap: 24rpx;
        background: #f5f5f5;
        border-radius: 48rpx;
        padding: 12rpx 24rpx;

        .picker-btn {
          width: 56rpx;
          height: 56rpx;
          background: #667eea;
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32rpx;
          font-weight: 700;

          &:active {
            opacity: 0.7;
          }
        }

        .picker-value {
          font-size: 36rpx;
          font-weight: 700;
          color: #333;
          min-width: 60rpx;
          text-align: center;
        }
      }
    }

    .setup-tip {
      text-align: center;
      padding: 24rpx;
      background: #f5f5f5;
      border-radius: 16rpx;
      margin-bottom: 32rpx;
      font-size: 28rpx;
      color: #666;
    }

    .btn-start-game {
      width: 100%;
      height: 96rpx;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      border: none;
      border-radius: 48rpx;
      font-size: 32rpx;
      font-weight: 600;

      &:active {
        transform: scale(0.98);
      }
    }
  }
}

// 查看身份
.identity-section {
  padding: 80rpx 32rpx;

  .identity-card {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 32rpx;
    padding: 80rpx 40rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;

    .identity-tip {
      font-size: 40rpx;
      font-weight: 700;
      color: #333;
      margin-bottom: 24rpx;
    }

    .identity-warning {
      font-size: 28rpx;
      color: #ff5722;
      margin-bottom: 48rpx;
    }

    .btn-reveal {
      width: 100%;
      height: 96rpx;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      border: none;
      border-radius: 48rpx;
      font-size: 32rpx;
      font-weight: 600;
    }
  }
}

// 显示身份
.word-section {
  padding: 40rpx 32rpx;

  .word-card {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 32rpx;
    padding: 64rpx 40rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 8rpx;
    }

    &.spy::before {
      background: #f44336;
    }

    &.civilian::before {
      background: #4caf50;
    }

    &.blank::before {
      background: #999;
    }

    .role-title {
      font-size: 44rpx;
      font-weight: 700;
      margin-bottom: 48rpx;

      &.spy {
        color: #f44336;
      }
    }

    .word-display {
      width: 100%;
      padding: 48rpx;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 24rpx;
      margin-bottom: 48rpx;

      .word-label {
        display: block;
        font-size: 24rpx;
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 16rpx;
      }

      .word-text {
        display: block;
        font-size: 56rpx;
        font-weight: 700;
        color: #fff;
      }

      &.blank-hint {
        background: #f5f5f5;

        .word-label {
          color: #999;
        }

        .word-hint {
          display: block;
          font-size: 28rpx;
          color: #666;
        }
      }
    }

    .btn-continue {
      width: 100%;
      height: 96rpx;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      border: none;
      border-radius: 48rpx;
      font-size: 32rpx;
      font-weight: 600;
    }
  }
}

// 投票环节
.voting-section {
  padding: 40rpx 32rpx;

  .voting-card {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 32rpx;
    padding: 48rpx 40rpx;

    .voting-title {
      font-size: 40rpx;
      font-weight: 700;
      color: #333;
      text-align: center;
      display: block;
      margin-bottom: 16rpx;
    }

    .voting-desc {
      font-size: 26rpx;
      color: #999;
      text-align: center;
      display: block;
      margin-bottom: 40rpx;
    }

    .player-list {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16rpx;
      margin-bottom: 40rpx;

      .player-item {
        aspect-ratio: 1;
        background: #f5f5f5;
        border-radius: 16rpx;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border: 3rpx solid transparent;
        transition: all 0.3s;

        &.selected {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.1);
          transform: scale(1.05);
        }

        &.eliminated {
          opacity: 0.4;
          pointer-events: none;

          .player-label {
            text-decoration: line-through;
          }
        }

        &:active:not(.eliminated) {
          transform: scale(0.95);
        }

        .player-number {
          font-size: 48rpx;
          font-weight: 700;
          color: #667eea;
          margin-bottom: 8rpx;
        }

        .player-label {
          font-size: 22rpx;
          color: #666;
        }
      }
    }

    .btn-vote,
    .btn-end-game {
      width: 100%;
      height: 88rpx;
      border: none;
      border-radius: 48rpx;
      font-size: 32rpx;
      font-weight: 600;
    }

    .btn-vote {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      margin-bottom: 16rpx;

      &:disabled {
        opacity: 0.5;
      }
    }

    .btn-end-game {
      background: #f5f5f5;
      color: #999;
    }
  }
}

// 游戏结果
.result-section {
  padding: 40rpx 32rpx;

  .result-card {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 32rpx;
    padding: 64rpx 40rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;

    .result-icon {
      font-size: 120rpx;
      margin-bottom: 24rpx;
    }

    .result-title {
      font-size: 48rpx;
      font-weight: 700;
      color: #333;
      margin-bottom: 16rpx;
    }

    .result-desc {
      font-size: 28rpx;
      color: #666;
      margin-bottom: 48rpx;
    }

    .role-reveal {
      width: 100%;
      margin-bottom: 48rpx;

      .reveal-title {
        font-size: 32rpx;
        font-weight: 600;
        color: #333;
        margin-bottom: 24rpx;
        display: block;
      }

      .reveal-list {
        display: flex;
        flex-direction: column;
        gap: 12rpx;

        .reveal-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16rpx 24rpx;
          background: #f5f5f5;
          border-radius: 16rpx;

          .reveal-player {
            font-size: 26rpx;
            color: #666;
          }

          .reveal-role {
            font-size: 26rpx;
            font-weight: 600;
            padding: 4rpx 16rpx;
            border-radius: 12rpx;

            &.spy {
              background: #f44336;
              color: #fff;
            }

            &.civilian {
              background: #4caf50;
              color: #fff;
            }

            &.blank {
              background: #999;
              color: #fff;
            }
          }
        }
      }
    }

    .btn-restart,
    .btn-back-home {
      width: 100%;
      height: 88rpx;
      border: none;
      border-radius: 48rpx;
      font-size: 32rpx;
      font-weight: 600;
    }

    .btn-restart {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      margin-bottom: 16rpx;
    }

    .restart-waiting {
      display: block;
      width: 100%;
      margin-bottom: 16rpx;
      font-size: 28rpx;
      color: #999;
      text-align: center;
    }

    .btn-back-home {
      background: #f5f5f5;
      color: #666;
    }
  }
}
</style>
