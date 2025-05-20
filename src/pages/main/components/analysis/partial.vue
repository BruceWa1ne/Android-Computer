<template>
  <view class="partial-container">
    <view class="partial-left"></view>
    <view class="partial-right">
      <view
        v-for="(line, lIndex) in List"
        :key="lIndex"
        class="connection-wrapper"
        :class="lIndex === 0 ? 'top-connection' : 'bottom-connection'"
      >
        <view class="connection-line" :class="lIndex === 0 ? 'top-line' : 'bottom-line'"></view>
        <!-- <view class="connection-dot" :class="lIndex === 0 ? 'top-dot' : 'bottom-dot'"></view> -->
      </view>

      <view
        v-for="(item, index) in List"
        :key="item.label"
        class="data-box"
        :class="index === 0 ? 'top-box' : 'bottom-box'"
      >
        <view class="data-content">
          <view class="data-title">{{ item.title }}</view>
          <view class="data-value" :class="[{ 'state-1': item.state }, 'state-0']">
            <text>
              {{ item.value || '0' }}
            </text>
            <text class="value-unit">{{ item.unit }}</text>
            <text class="status-text">
              {{ item.state ? '异常' : '正常' }}
            </text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { BaseInfo } from '@/types/base-info'
import { BaseInfoKey } from '@/types/device-data-keys'
import { getResolutionScale } from '@/utils'
import FaultDiagnosisManager from '@/utils/faultDiagnosis'
import { useMenuLifecycle } from '@/utils/menu-lifecycle'

const baseInfo = inject(BaseInfoKey) || ref<Partial<BaseInfo>>({})
const { wScale, hScale } = getResolutionScale()

const List = ref([
  { label: 'ultrasonicVal', title: '超声波局放值', value: '', unit: 'dB', state: 0 },
  { label: 'transientGroundWaveVal', title: '暂态地电波局放值', value: '', unit: 'dB', state: 0 },
])

const widthScale = computed(() => wScale)
const heightScale = computed(() => hScale)

async function init() {
  const alarmInfo = await FaultDiagnosisManager.executeFaultDiagnosis()
  updateListData(alarmInfo)
}

function updateListData(alarmInfo: Array<any> = []) {
  List.value = List.value.map((item, index) => ({
    ...item,
    value: baseInfo.value[item.label] || '',
    state: alarmInfo[1]?.[index] || 0,
  }))
}

watchEffect(() => {
  if (baseInfo.value) {
    updateListData()
  }
})

useMenuLifecycle('analysis-partial', () => {
  init()
})

onMounted(() => {
  init()
})
</script>

<style scoped lang="scss">
.partial-container {
  position: relative;
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: 100%;
}

.partial-left,
.partial-right {
  position: relative;
  width: 30%;
  height: 100%;
}

.connection-wrapper {
  position: relative;
  z-index: 1;
}

.top-connection {
  position: absolute;
  top: 12%;
  left: calc(-270px * #{v-bind(widthScale)});
  width: calc(260px * #{v-bind(widthScale)});
  height: calc(60px * #{v-bind(heightScale)});
}

.bottom-connection {
  position: absolute;
  top: 39%;
  left: calc(-70px * #{v-bind(widthScale)});
  width: calc(60px * #{v-bind(widthScale)});
  height: calc(60px * #{v-bind(heightScale)});
}

.connection-line {
  position: absolute;
  z-index: 1;
  background-color: #00deff;
}

.connection-dot {
  position: absolute;
  z-index: 2;
  width: 12px;
  height: 12px;
  background-color: #00deff;
  border-radius: 50%;
  box-shadow: 0 0 10px 5px rgba(0, 222, 255, 0.5);
  animation: pulse 2s infinite ease-in-out;
}

.top-line {
  position: absolute;
  top: calc(30px * #{v-bind(heightScale)});
  right: calc(-10px * #{v-bind(widthScale)});
  width: calc(290px * #{v-bind(widthScale)});
  height: calc(2px * #{v-bind(heightScale)});
  transform: rotate(-49deg);
  transform-origin: right center;
}

.bottom-line {
  position: absolute;
  top: calc(30px * #{v-bind(heightScale)});
  right: calc(-10px * #{v-bind(widthScale)});
  width: calc(176px * #{v-bind(widthScale)});
  height: calc(2px * #{v-bind(heightScale)});
  transform: rotate(-38deg);
  transform-origin: right center;
}

.data-box {
  position: absolute;
  left: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  width: 340px;
  height: 40px;
  background-color: rgba(38, 101, 243, 0);
  border: 1px solid #07d9ff;
  border-radius: 4px;
}

.top-box {
  position: absolute;
  top: 15%;
}

.bottom-box {
  position: absolute;
  top: 42%;
}

.data-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0 20px;
  font-size: 18px;
}

.data-title {
  font-size: 18px;
  font-weight: 400;
  color: #fff;
}

.data-value {
  display: flex;
  align-items: baseline;
}

.value-number {
  margin-left: 23px;
  font-size: 26px;
  font-weight: 500;
}

.value-unit {
  margin-left: 2px;
  font-size: 16px;
}

.status-text {
  margin-left: 10px;
  font-size: 18px;
}

.state-0 {
  color: #00ffcc;
}
.state-1 {
  color: #ff4200;
}
.state-2 {
  color: orange;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 6px 3px rgba(0, 222, 255, 0.5);
  }
  50% {
    box-shadow: 0 0 10px 5px rgba(0, 222, 255, 0.8);
  }
  100% {
    box-shadow: 0 0 6px 3px rgba(0, 222, 255, 0.5);
  }
}

@media screen and (max-width: 1920px) {
  .top-dot {
    top: 365px;
    left: 112px;
  }

  .bottom-dot {
    top: 195px;
    left: -110px;
  }
}

@media screen and (max-width: 1280px) {
  .top-dot {
    top: 240px;
    left: 77px;
  }

  .bottom-dot {
    top: 135px;
    left: -75px;
  }
}
</style>
