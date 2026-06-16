<template>
  <view class="dice-game-container">
    <!-- 顶部导航 -->
    <view class="top-nav">
      <text class="back-btn" @tap="goBack">‹ 返回</text>
      <text class="page-title">摇骰子</text>
      <view class="placeholder"></view>
    </view>

    <!-- 3D骰盅区域 -->
    <view class="dice-cup-area">
      <!-- 骰盅 -->
      <view class="dice-cup" :class="{ shaking: isShaking, opened: isOpened }">
        <!-- 盖子 -->
        <image
          class="cup-cover"
          :class="{ lifted: isOpened }"
          src="/static/images/gaizi.png"
          mode="aspectFit"
        ></image>

        <!-- 骰底 -->
        <image
          class="cup-bottom"
          src="/static/images/toudi.png"
          mode="aspectFit"
        ></image>

        <!-- 骰子结果 -->
        <view class="dice-result" v-if="isOpened && diceValues.length > 0">
          <image
            v-for="(value, index) in diceValues"
            :key="index"
            class="dice-image"
            :class="`dice-pos-${index}`"
            :src="getDiceImage(value)"
            mode="aspectFit"
          ></image>
        </view>
      </view>

      <!-- 结果提示 -->
      <view class="result-tip" v-if="showResult">
        <text class="result-text">{{ resultDesc }}</text>
        <text class="result-points">总点数: {{ totalPoints }}</text>
      </view>
    </view>

    <!-- 摇骰子按钮 -->
    <view class="action-section">
      <button
        class="shake-btn"
        @tap="handleShake"
        :disabled="isShaking"
      >
        <text class="shake-text">{{ isShaking ? '摇动中...' : '摇' }}</text>
      </button>
    </view>

    <!-- 底部按钮组 -->
    <view class="bottom-buttons">
      <view class="btn-item" @tap="showGameRules">
        <text class="btn-icon">📖</text>
        <text class="btn-label">骰子规则</text>
      </view>
      <view class="btn-item">
        <text class="btn-icon">👥</text>
        <text class="btn-label">挑战好友</text>
      </view>
      <view class="btn-item" @tap="showPlayGuide">
        <text class="btn-icon">❓</text>
        <text class="btn-label">玩法</text>
      </view>
    </view>

    <!-- 规则弹窗 -->
    <view class="modal" v-if="showRules" @tap="showRules = false">
      <view class="modal-content rules-modal" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">游戏规则</text>
          <text class="modal-close" @tap="showRules = false">×</text>
        </view>
        <view class="rules-list">
          <view class="rule-item">
            <text class="rule-label">豹子</text>
            <text class="rule-desc">三个相同点数，最大</text>
          </view>
          <view class="rule-item">
            <text class="rule-label">顺子</text>
            <text class="rule-desc">连续三个数字</text>
          </view>
          <view class="rule-item">
            <text class="rule-label">对子</text>
            <text class="rule-desc">两个相同点数</text>
          </view>
          <view class="rule-item">
            <text class="rule-label">散点</text>
            <text class="rule-desc">比较总点数大小</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const isShaking = ref(false);
const isOpened = ref(false);
const showResult = ref(false);
const showRules = ref(false);
const diceValues = ref<number[]>([]);

// 计算总点数
const totalPoints = computed(() => {
  return diceValues.value.reduce((sum, val) => sum + val, 0);
});

// 计算结果描述
const resultDesc = computed(() => {
  if (diceValues.value.length === 0) return '';

  const values = [...diceValues.value].sort();

  // 豹子
  if (values[0] === values[1] && values[1] === values[2]) {
    return `🎉 豹子 ${values[0]}${values[0]}${values[0]}`;
  }

  // 顺子
  if (values[0] + 1 === values[1] && values[1] + 1 === values[2]) {
    return `✨ 顺子 ${values.join('')}`;
  }

  // 对子
  if (values[0] === values[1] || values[1] === values[2]) {
    return `💫 对子`;
  }

  return `散点`;
});

// 获取骰子图片
function getDiceImage(value: number) {
  // 随机选择1-8个角度的其中一个
  const angle = Math.floor(Math.random() * 8) + 1;
  return `/static/images/touzi/touzi${value}-${angle}.png`;
}

// 摇骰子
function handleShake() {
  if (isShaking.value) return;

  // 重置状态
  isOpened.value = false;
  showResult.value = false;
  isShaking.value = true;

  // 震动反馈
  uni.vibrateShort({});

  // 模拟摇动 2秒
  setTimeout(() => {
    isShaking.value = false;

    // 生成随机骰子结果
    diceValues.value = [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
    ];

    // 打开骰盅
    setTimeout(() => {
      isOpened.value = true;
      showResult.value = true;
      uni.vibrateLong({});
    }, 300);
  }, 2000);
}

// 显示规则
function showGameRules() {
  showRules.value = true;
}

// 显示玩法
function showPlayGuide() {
  uni.showToast({
    title: '摇一摇或点击按钮开始游戏',
    icon: 'none'
  });
}

// 返回
function goBack() {
  uni.navigateBack();
}
</script>

<style lang="scss" scoped>
.dice-game-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #2c3e50 0%, #34495e 100%);
  padding: 0;
  position: relative;
}

/* 顶部导航 */
.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx 40rpx;
  padding-top: calc(32rpx + env(safe-area-inset-top));
}

.back-btn, .placeholder {
  width: 120rpx;
  color: rgba(255, 255, 255, 0.8);
  font-size: 32rpx;
}

.page-title {
  flex: 1;
  text-align: center;
  color: #fff;
  font-size: 36rpx;
  font-weight: bold;
}

/* 骰盅区域 */
.dice-cup-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
  min-height: 800rpx;
}

.dice-cup {
  position: relative;
  width: 600rpx;
  height: 600rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 1000px;
}

/* 盖子 */
.cup-cover {
  position: absolute;
  width: 500rpx;
  height: 500rpx;
  z-index: 10;
  transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: center bottom;
}

.cup-cover.lifted {
  transform: translateY(-200rpx) translateZ(100rpx) rotateX(-15deg) scale(0.9);
  opacity: 0.7;
}

/* 骰底 */
.cup-bottom {
  position: absolute;
  width: 600rpx;
  height: 600rpx;
  z-index: 1;
}

/* 摇动动画 */
.dice-cup.shaking .cup-cover {
  animation: shake 0.5s infinite;
}

.dice-cup.shaking .cup-bottom {
  animation: shake 0.5s infinite 0.1s;
}

@keyframes shake {
  0%, 100% { transform: rotate(0deg) translateX(0); }
  10% { transform: rotate(-5deg) translateX(-10rpx); }
  20% { transform: rotate(5deg) translateX(10rpx); }
  30% { transform: rotate(-5deg) translateX(-10rpx); }
  40% { transform: rotate(5deg) translateX(10rpx); }
  50% { transform: rotate(-5deg) translateX(-10rpx); }
  60% { transform: rotate(5deg) translateX(10rpx); }
  70% { transform: rotate(-5deg) translateX(-10rpx); }
  80% { transform: rotate(5deg) translateX(10rpx); }
  90% { transform: rotate(-5deg) translateX(-10rpx); }
}

/* 骰子结果 */
.dice-result {
  position: absolute;
  width: 400rpx;
  height: 400rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  animation: diceAppear 0.5s ease-out;
}

@keyframes diceAppear {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.dice-image {
  position: absolute;
  width: 120rpx;
  height: 120rpx;
  filter: drop-shadow(0 8rpx 16rpx rgba(0, 0, 0, 0.3));
}

.dice-pos-0 {
  left: 50rpx;
  top: 100rpx;
  transform: rotate(-15deg);
}

.dice-pos-1 {
  left: 140rpx;
  top: 150rpx;
  transform: rotate(8deg);
}

.dice-pos-2 {
  left: 90rpx;
  top: 220rpx;
  transform: rotate(-8deg);
}

/* 结果提示 */
.result-tip {
  margin-top: 60rpx;
  text-align: center;
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.result-text {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #ffd700;
  margin-bottom: 16rpx;
  text-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.5);
}

.result-points {
  display: block;
  font-size: 32rpx;
  color: rgba(255, 255, 255, 0.9);
}

/* 摇骰子按钮 */
.action-section {
  position: fixed;
  bottom: 200rpx;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.shake-btn {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  border: none;
  box-shadow: 0 16rpx 32rpx rgba(255, 107, 107, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.shake-btn:disabled {
  opacity: 0.6;
}

.shake-text {
  font-size: 48rpx;
  font-weight: bold;
  color: #fff;
}

/* 底部按钮 */
.bottom-buttons {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 32rpx;
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(20rpx);
  display: flex;
  justify-content: space-around;
}

.btn-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.btn-icon {
  font-size: 48rpx;
}

.btn-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

/* 弹窗 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  border-radius: 32rpx;
  width: 600rpx;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  padding: 40rpx 32rpx;
  border-bottom: 1rpx solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.modal-close {
  font-size: 48rpx;
  color: #999;
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rules-list {
  padding: 32rpx;
}

.rule-item {
  padding: 24rpx;
  margin-bottom: 16rpx;
  background: #f8f9fa;
  border-radius: 16rpx;
  display: flex;
  justify-content: space-between;
}

.rule-label {
  font-size: 32rpx;
  font-weight: bold;
  color: #667eea;
}

.rule-desc {
  font-size: 28rpx;
  color: #666;
}
</style>
