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
      <view class="cup-wrap" :class="{ shaking: isShaking, opened: isOpened }">
        <!-- 地面投影 -->
        <view class="cup-shadow" :class="{ shaking: isShaking }"></view>

        <!-- 骰底（圆盘） -->
        <image
          class="cup-plate"
          src="/static/images/toudi.png"
          mode="widthFix"
        ></image>

        <!-- 骰子结果（落在盘面上） -->
        <view class="dice-layer" v-if="isOpened">
          <view
            v-for="(d, index) in dice"
            :key="index"
            class="dice-slot"
            :style="{ left: d.x + 'rpx', top: d.y + 'rpx', transform: 'rotate(' + d.rot + 'deg)' }"
          >
            <image
              class="dice-image"
              :style="{ animationDelay: index * 0.07 + 's' }"
              :src="getDiceImage(d)"
              mode="widthFix"
            ></image>
          </view>
        </view>

        <!-- 盖子（骰盅，揭开时抬起） -->
        <view class="cup-dome-pos">
          <image
            class="cup-dome"
            src="/static/images/gaizi.png"
            mode="widthFix"
          ></image>
        </view>
      </view>

      <!-- 结果提示 -->
      <view class="result-tip" v-if="showResult">
        <text class="result-text" :class="'tier-' + result.tier">{{ result.emoji }} {{ result.name }}</text>
        <text class="result-points">{{ diceValues.join(' · ') }} ＝ {{ totalPoints }} 点</text>
      </view>
    </view>

    <!-- 摇骰子按钮 -->
    <view class="action-section">
      <button
        class="shake-btn"
        :class="{ active: isShaking }"
        @tap="handleShake"
        :disabled="isShaking"
      >
        <text class="shake-text">{{ isShaking ? '⋯' : '摇' }}</text>
      </button>
    </view>

    <!-- 底部按钮组 -->
    <view class="bottom-buttons">
      <view class="btn-item" @tap="chooseDiceCount">
        <text class="btn-icon">🎲</text>
        <text class="btn-label">骰子数 {{ diceCount }}</text>
      </view>
      <view class="btn-item" @tap="showGameRules">
        <text class="btn-icon">📖</text>
        <text class="btn-label">规则</text>
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
          <text class="modal-title">玩法规则（{{ diceCount }} 颗骰子）</text>
          <text class="modal-close" @tap="showRules = false">×</text>
        </view>
        <view class="rules-list">
          <view class="rule-item" v-for="(r, i) in ruleList" :key="i">
            <text class="rule-label">{{ r.label }}</text>
            <text class="rule-desc">{{ r.desc }}</text>
          </view>
        </view>
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

const isShaking = ref(false);
const isOpened = ref(false);
const showResult = ref(false);
const showRules = ref(false);
const diceCount = ref(5);
const dice = ref<Die[]>([]);

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

// 通用牌型判定，适配 3~6 颗骰子
const result = computed(() => {
  const vals = diceValues.value;
  const n = vals.length;
  if (n === 0) return { name: '', emoji: '', tier: 'low' };

  const counts: Record<number, number> = {};
  vals.forEach((v) => (counts[v] = (counts[v] || 0) + 1));
  const pattern = Object.values(counts).sort((a, b) => b - a); // 降序，如 [3,2]
  const max = pattern[0];
  const uniq = Object.keys(counts).map(Number).sort((a, b) => a - b);
  const isStraight = uniq.length === n && uniq[n - 1] - uniq[0] === n - 1;

  if (max === n) return { name: n >= 4 ? `全色·${n}条` : '豹子', emoji: '🎉', tier: 'max' };
  if (isStraight) return { name: '顺子', emoji: '✨', tier: 'high' };
  if (max === 4) return { name: '四条', emoji: '🔥', tier: 'high' };
  if (max === 3 && pattern[1] === 2) return { name: '葫芦', emoji: '💎', tier: 'high' };
  if (max === 3) return { name: '三条', emoji: '💫', tier: 'mid' };
  if (max === 2 && pattern[1] === 2) return { name: '两对', emoji: '👍', tier: 'mid' };
  if (max === 2) return { name: '对子', emoji: '🙂', tier: 'low' };
  return { name: '散点', emoji: '🎯', tier: 'low' };
});

const ruleList = computed(() => {
  const base = [
    { label: '豹子 / 全色', desc: '所有骰子点数相同，最大' },
    { label: '顺子', desc: '点数全部连续' },
    { label: '四条', desc: '四颗相同点数' },
    { label: '葫芦', desc: '三条 + 一对' },
    { label: '三条', desc: '三颗相同点数' },
    { label: '两对', desc: '两组对子' },
    { label: '对子', desc: '一组相同点数' },
    { label: '散点', desc: '比较总点数大小' },
  ];
  // 骰子较少时隐藏不可能出现的牌型
  if (diceCount.value < 5) return base.filter((r) => !['四条', '葫芦', '两对'].includes(r.label));
  return base;
});

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

// 摇骰子主流程
function handleShake() {
  if (isShaking.value) return;

  isOpened.value = false;
  showResult.value = false;
  isShaking.value = true;

  // 摇动过程中的连续震动反馈
  safeVibrate('short');
  const buzz = setInterval(() => safeVibrate('short'), 260);

  setTimeout(() => {
    clearInterval(buzz);
    isShaking.value = false;
    rollDice();

    // 揭盅 → 显示结果
    setTimeout(() => {
      isOpened.value = true;
      safeVibrate('long');
      setTimeout(() => {
        showResult.value = true;
      }, 420);
    }, 220);
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

// 选择骰子数量
function chooseDiceCount() {
  if (isShaking.value) return;
  const options = ['3 颗', '4 颗', '5 颗', '6 颗'];
  uni.showActionSheet({
    itemList: options,
    success: (res) => {
      diceCount.value = [3, 4, 5, 6][res.tapIndex];
      isOpened.value = false;
      showResult.value = false;
      dice.value = [];
    },
  });
}

function showGameRules() {
  showRules.value = true;
}

function showPlayGuide() {
  uni.showToast({ title: '摇动手机或点「摇」即可开局', icon: 'none' });
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
  if (delta > 1.8 && !isShaking.value && now - shakeCooldown > 1200) {
    shakeCooldown = now;
    handleShake();
  }
}

onMounted(() => {
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
  animation: diceDrop 0.5s cubic-bezier(0.2, 0.85, 0.3, 1.25) both;
}

/* 盖子定位与抬升 */
.cup-dome-pos {
  position: absolute;
  left: 50%;
  margin-left: -245rpx;
  bottom: 120rpx;
  width: 490rpx;
  z-index: 3;
}

.cup-dome {
  width: 490rpx;
  filter: drop-shadow(0 20rpx 30rpx rgba(0, 0, 0, 0.5));
  transform-origin: center bottom;
  transition: transform 0.75s cubic-bezier(0.34, 1.45, 0.5, 1), opacity 0.75s ease;
}
.cup-wrap.opened .cup-dome {
  transform: translateY(-420rpx) rotate(-11deg) scale(0.94);
  opacity: 0.92;
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

@keyframes diceDrop {
  0%   { opacity: 0; transform: translateY(-60rpx) scale(0.5); }
  70%  { opacity: 1; transform: translateY(8rpx) scale(1.08); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

/* 结果提示 */
.result-tip {
  margin-top: 24rpx;
  text-align: center;
  animation: fadeUp 0.4s ease-out;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16rpx); }
  to { opacity: 1; transform: translateY(0); }
}

.result-text {
  display: block;
  font-size: 52rpx;
  font-weight: bold;
  margin-bottom: 12rpx;
  text-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.6);
}
.tier-max { color: #ff5e57; }
.tier-high { color: #ffd700; }
.tier-mid { color: #4ecdc4; }
.tier-low { color: rgba(255, 255, 255, 0.92); }

.result-points {
  display: block;
  font-size: 32rpx;
  color: rgba(255, 255, 255, 0.8);
  letter-spacing: 2rpx;
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
  width: 620rpx;
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
  font-size: 34rpx;
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

.rules-list { padding: 24rpx 32rpx 32rpx; }

.rule-item {
  padding: 24rpx;
  margin-bottom: 16rpx;
  background: #f8f9fa;
  border-radius: 16rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rule-label {
  font-size: 30rpx;
  font-weight: bold;
  color: #667eea;
  flex-shrink: 0;
  margin-right: 24rpx;
}

.rule-desc {
  font-size: 27rpx;
  color: #666;
  text-align: right;
}
</style>
