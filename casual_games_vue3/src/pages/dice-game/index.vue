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
      <view class="cup-wrap" :class="{ shaking: isShaking }">
        <!-- 地面投影 -->
        <view class="cup-shadow" :class="{ shaking: isShaking }"></view>

        <!-- 骰底（圆盘） -->
        <image
          class="cup-plate"
          src="/static/images/toudi.png"
          mode="widthFix"
        ></image>

        <!-- 骰子结果（落在盘面上，随盖子抬升显现） -->
        <view class="dice-layer" v-if="dice.length > 0" :style="diceLayerStyle">
          <view
            v-for="(d, index) in dice"
            :key="index"
            class="dice-slot"
            :style="{ left: d.x + 'rpx', top: d.y + 'rpx', transform: 'rotate(' + d.rot + 'deg)' }"
          >
            <image class="dice-image" :src="getDiceImage(d)" mode="widthFix"></image>
          </view>
        </view>

        <!-- 盖子（骰盅，可手动拖动开合） -->
        <view
          class="cup-dome-pos"
          :class="{ dragging: isDragging }"
          :style="domeStyle"
          @touchstart="onDomeTouchStart"
          @touchmove.stop.prevent="onDomeTouchMove"
          @touchend="onDomeTouchEnd"
          @touchcancel="onDomeTouchEnd"
        >
          <image
            class="cup-dome"
            src="/static/images/gaizi.png"
            mode="widthFix"
          ></image>
        </view>
      </view>

      <!-- 拖拽提示 / 点数 -->
      <view class="result-tip">
        <text class="drag-hint" v-if="showHint">👆 上拉揭盅 · 下拉盖回</text>
        <text class="result-points" v-if="showPoints">{{ diceValues.join(' · ') }} ＝ {{ totalPoints }} 点</text>
      </view>
    </view>

    <!-- 摇骰子按钮 -->
    <view class="action-section">
      <button
        class="shake-btn"
        :class="{ active: isShaking, locked: shakeDisabled }"
        @tap="handleShake"
        :disabled="isShaking"
      >
        <text class="shake-text">{{ isShaking ? '⋯' : (shakeDisabled ? '🔒' : '摇') }}</text>
      </button>
    </view>

    <!-- 底部按钮组 -->
    <view class="bottom-buttons">
      <view class="btn-item" @tap="chooseDiceCount">
        <text class="btn-icon">🎲</text>
        <text class="btn-label">骰子数 {{ diceCount }}</text>
      </view>
      <view class="btn-item" @tap="toggleShakeLock">
        <text class="btn-icon">{{ shakeDisabled ? '🔓' : '🔒' }}</text>
        <text class="btn-label">{{ shakeDisabled ? '允许摇骰' : '禁止摇骰' }}</text>
      </view>
      <view class="btn-item" @tap="showPlayGuide">
        <text class="btn-icon">❓</text>
        <text class="btn-label">玩法</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

interface Die {
  value: number; // 点数 1-6
  angle: number; // 3D 角度图 1-8
  x: number;     // 盘内横向位置 rpx
  y: number;     // 盘内纵向位置 rpx
  rot: number;   // 摆放旋转角度
}

// 盖子最大抬升高度（rpx）
const MAX_LIFT = 440;

const isShaking = ref(false);
const shakeDisabled = ref(false);
const diceCount = ref(5);
const dice = ref<Die[]>([]);

// 盖子抬升状态
const domeLift = ref(0); // 0=盖合，MAX_LIFT=完全揭开
const isDragging = ref(false);

// 各骰子数对应的自然散落锚点（基于 dice-layer 内坐标，单位 rpx）
const DICE_LAYOUTS: Record<number, [number, number][]> = {
  1: [[190, 90]],
  2: [[110, 85], [270, 85]],
  3: [[80, 70], [220, 55], [150, 160]],
  4: [[80, 55], [240, 50], [95, 165], [255, 160]],
  5: [[35, 65], [165, 35], [300, 70], [95, 160], [225, 150]],
  6: [[30, 55], [160, 38], [290, 58], [70, 160], [180, 165], [300, 150]],
};

const diceValues = computed(() => dice.value.map((d) => d.value));
const totalPoints = computed(() => diceValues.value.reduce((s, v) => s + v, 0));

// 盖子样式：抬升越高，越向上 + 倾斜 + 略缩小淡出
const domeStyle = computed(() => {
  const p = domeLift.value / MAX_LIFT;
  return {
    transform: `translateY(${-domeLift.value}rpx) rotate(${-11 * p}deg) scale(${1 - 0.06 * p})`,
    opacity: String(1 - 0.08 * p),
  };
});

// 骰子层透明度跟随盖子抬升（盖合时隐藏，半开即完全显现）
const diceLayerStyle = computed(() => ({
  opacity: String(domeLift.value <= 0 ? 0 : Math.min(1, domeLift.value / (MAX_LIFT * 0.5))),
}));

const showPoints = computed(() => dice.value.length > 0 && domeLift.value > MAX_LIFT * 0.55);
const showHint = computed(() => dice.value.length > 0 && domeLift.value < 30 && !isShaking.value);

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function jitter(amp: number) {
  return Math.round((Math.random() * 2 - 1) * amp);
}

function getDiceImage(d: Die) {
  return `/static/images/touzi/touzi${d.value}-${d.angle}.png`;
}

// 生成本轮骰子（位置/角度在投掷时确定，避免重渲染闪烁）
function rollDice() {
  const layout = DICE_LAYOUTS[diceCount.value] || DICE_LAYOUTS[5];
  dice.value = layout.map(([x, y]) => ({
    value: randInt(1, 6),
    angle: randInt(1, 8),
    x: x + jitter(12),
    y: y + jitter(8),
    rot: jitter(16),
  }));
}

// 摇骰子：摇动后骰子落定（盖子保持闭合，由玩家手动揭开）
function handleShake() {
  if (isShaking.value) return;
  if (shakeDisabled.value) {
    uni.showToast({ title: '摇骰已被禁止', icon: 'none' });
    return;
  }

  domeLift.value = 0; // 先盖回
  isShaking.value = true;

  safeVibrate('short');
  const buzz = setInterval(() => safeVibrate('short'), 260);

  setTimeout(() => {
    clearInterval(buzz);
    isShaking.value = false;
    rollDice();
    safeVibrate('long');
  }, 1600);
}

function safeVibrate(type: 'short' | 'long') {
  try {
    if (type === 'short') uni.vibrateShort({});
    else uni.vibrateLong({});
  } catch (e) {
    /* 部分平台不支持，忽略 */
  }
}

// ===== 盖子手动拖动 =====
let dragStartY = 0;
let dragStartLift = 0;
let rpxFactor = 2; // px → rpx 换算系数（750 / 屏宽px）

function touchY(e: any): number {
  const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
  return t ? (t.clientY ?? t.pageY ?? 0) : 0;
}

function onDomeTouchStart(e: any) {
  isDragging.value = true;
  dragStartY = touchY(e);
  dragStartLift = domeLift.value;
}

function onDomeTouchMove(e: any) {
  if (!isDragging.value) return;
  const dy = dragStartY - touchY(e); // 向上拖为正
  let lift = dragStartLift + dy * rpxFactor;
  lift = Math.max(0, Math.min(MAX_LIFT, lift));
  domeLift.value = lift;
}

function onDomeTouchEnd() {
  if (!isDragging.value) return;
  isDragging.value = false;
  // 松手吸附：超过 40% 行程则完全揭开，否则盖回
  domeLift.value = domeLift.value > MAX_LIFT * 0.4 ? MAX_LIFT : 0;
}

// 选择骰子数量
function chooseDiceCount() {
  if (isShaking.value) return;
  const counts = [3, 4, 5, 6];
  uni.showActionSheet({
    itemList: counts.map((c) => `${c} 颗`),
    success: (res) => {
      diceCount.value = counts[res.tapIndex];
      domeLift.value = 0;
      dice.value = [];
    },
  });
}

// 禁止 / 允许摇骰
function toggleShakeLock() {
  shakeDisabled.value = !shakeDisabled.value;
  uni.showToast({ title: shakeDisabled.value ? '已禁止摇骰' : '已允许摇骰', icon: 'none' });
}

function showPlayGuide() {
  uni.showToast({ title: '点「摇」掷骰，再上拉盖子揭盅', icon: 'none' });
}

function goBack() {
  uni.navigateBack();
}

// 摇一摇手势触发
let lastAccel = { x: 0, y: 0, z: 0 };
let shakeCooldown = 0;
function onAccel(res: { x: number; y: number; z: number }) {
  const delta =
    Math.abs(res.x - lastAccel.x) +
    Math.abs(res.y - lastAccel.y) +
    Math.abs(res.z - lastAccel.z);
  lastAccel = { x: res.x, y: res.y, z: res.z };
  const now = Date.now();
  if (delta > 1.8 && !isShaking.value && !shakeDisabled.value && now - shakeCooldown > 1200) {
    shakeCooldown = now;
    handleShake();
  }
}

onMounted(() => {
  try {
    const info = uni.getSystemInfoSync();
    if (info && info.windowWidth) rpxFactor = 750 / info.windowWidth;
  } catch (e) {
    /* 取不到屏宽时用默认系数 */
  }
  try {
    uni.startAccelerometer({ interval: 'normal' });
    uni.onAccelerometerChange(onAccel);
  } catch (e) {
    /* 摇一摇不可用时仅保留按钮触发 */
  }
});

onUnmounted(() => {
  try {
    uni.offAccelerometerChange(onAccel);
    uni.stopAccelerometer({});
  } catch (e) {
    /* ignore */
  }
});
</script>

<style lang="scss" scoped>
.dice-game-container {
  min-height: 100vh;
  background: radial-gradient(120% 80% at 50% 18%, #3b4a5e 0%, #2c3e50 45%, #222d3a 100%);
  position: relative;
  overflow: hidden;
}

/* 顶部导航 */
.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx 40rpx;
  padding-top: calc(32rpx + env(safe-area-inset-top));
  position: relative;
  z-index: 20;
}

.back-btn, .placeholder {
  width: 120rpx;
  color: rgba(255, 255, 255, 0.85);
  font-size: 32rpx;
}

.page-title {
  flex: 1;
  text-align: center;
  color: #fff;
  font-size: 36rpx;
  font-weight: bold;
  letter-spacing: 4rpx;
}

/* 骰盅区域 */
.dice-cup-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 40rpx;
  min-height: 900rpx;
}

.cup-wrap {
  position: relative;
  width: 640rpx;
  height: 760rpx;
}

/* 地面投影 */
.cup-shadow {
  position: absolute;
  left: 50%;
  bottom: 40rpx;
  width: 520rpx;
  height: 90rpx;
  margin-left: -260rpx;
  background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0) 70%);
  border-radius: 50%;
  z-index: 0;
  transition: all 0.3s ease;
}
.cup-shadow.shaking {
  animation: shadowPulse 0.42s infinite;
}

/* 骰底圆盘 */
.cup-plate {
  position: absolute;
  left: 50%;
  margin-left: -310rpx;
  bottom: 60rpx;
  width: 620rpx;
  z-index: 1;
  filter: drop-shadow(0 16rpx 24rpx rgba(0, 0, 0, 0.45));
}
.cup-wrap.shaking .cup-plate {
  animation: plateShake 0.42s infinite;
}

/* 骰子落点层 */
.dice-layer {
  position: absolute;
  left: 50%;
  margin-left: -235rpx;
  bottom: 150rpx;
  width: 470rpx;
  height: 280rpx;
  z-index: 2;
}

.dice-slot {
  position: absolute;
  width: 96rpx;
  height: 96rpx;
}

.dice-image {
  width: 96rpx;
  filter: drop-shadow(0 8rpx 10rpx rgba(0, 0, 0, 0.5));
}

/* 盖子定位与抬升（可拖动） */
.cup-dome-pos {
  position: absolute;
  left: 50%;
  margin-left: -245rpx;
  bottom: 120rpx;
  width: 490rpx;
  z-index: 3;
  transform-origin: center bottom;
  transition: transform 0.45s cubic-bezier(0.34, 1.4, 0.5, 1), opacity 0.45s ease;
}
.cup-dome-pos.dragging {
  transition: none; /* 拖动时实时跟手 */
}

.cup-dome {
  width: 490rpx;
  filter: drop-shadow(0 20rpx 30rpx rgba(0, 0, 0, 0.5));
}
.cup-wrap.shaking .cup-dome {
  animation: cupShake 0.42s infinite;
}

/* 摇动动画 */
@keyframes cupShake {
  0%   { transform: translate(0, 0) rotate(0deg); }
  12%  { transform: translate(-14rpx, -28rpx) rotate(-7deg); }
  25%  { transform: translate(13rpx, -12rpx) rotate(6deg); }
  38%  { transform: translate(-12rpx, -32rpx) rotate(-6deg); }
  50%  { transform: translate(11rpx, -10rpx) rotate(5deg); }
  62%  { transform: translate(-10rpx, -26rpx) rotate(-5deg); }
  75%  { transform: translate(9rpx, -9rpx) rotate(4deg); }
  88%  { transform: translate(-6rpx, -18rpx) rotate(-3deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
}

@keyframes plateShake {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(-5rpx, 0) rotate(-1deg); }
  50% { transform: translate(5rpx, 0) rotate(1deg); }
  75% { transform: translate(-4rpx, 0) rotate(-0.8deg); }
}

@keyframes shadowPulse {
  0%, 100% { transform: scaleX(1); opacity: 0.9; }
  50% { transform: scaleX(0.82); opacity: 0.6; }
}

/* 结果提示 */
.result-tip {
  margin-top: 24rpx;
  min-height: 70rpx;
  text-align: center;
}

.drag-hint {
  display: block;
  font-size: 30rpx;
  color: rgba(255, 255, 255, 0.55);
  letter-spacing: 2rpx;
  animation: hintBlink 1.6s ease-in-out infinite;
}

@keyframes hintBlink {
  0%, 100% { opacity: 0.45; }
  50% { opacity: 0.9; }
}

.result-points {
  display: block;
  font-size: 38rpx;
  font-weight: bold;
  color: #ffd700;
  letter-spacing: 2rpx;
  text-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.5);
  animation: fadeUp 0.3s ease-out;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12rpx); }
  to { opacity: 1; transform: translateY(0); }
}

/* 摇骰子按钮 */
.action-section {
  position: fixed;
  bottom: 210rpx;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}

.shake-btn {
  width: 168rpx;
  height: 168rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  border: 6rpx solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 16rpx 36rpx rgba(238, 90, 111, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease;
}
.shake-btn::after { border: none; }
.shake-btn.active {
  animation: btnPulse 0.5s infinite;
}
.shake-btn.locked {
  background: linear-gradient(135deg, #8a939c 0%, #6b747d 100%);
  box-shadow: 0 16rpx 36rpx rgba(0, 0, 0, 0.3);
}
.shake-btn:disabled { opacity: 0.85; }

@keyframes btnPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(0.92); }
}

.shake-text {
  font-size: 56rpx;
  font-weight: bold;
  color: #fff;
}

/* 底部按钮 */
.bottom-buttons {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 28rpx 32rpx;
  padding-bottom: calc(28rpx + env(safe-area-inset-bottom));
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(20rpx);
  display: flex;
  justify-content: space-around;
  z-index: 50;
}

.btn-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.btn-icon { font-size: 46rpx; }

.btn-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.85);
}
</style>
