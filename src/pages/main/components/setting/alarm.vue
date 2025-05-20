<template>
  <view class="alarm-container">
    <view class="alarm-container_top">
      <view class="alarm-container_top_left">
        <view class="title detail-title">
          <text>机械特性</text>
        </view>
        <view class="limit-labels">
          <view class="limit-label">上限</view>
          <view class="limit-label">下限</view>
        </view>
        <view class="content-area">
          <view
            class="input-group"
            v-for="(item, index) in formData.mechanical"
            :key="'mechanical-' + index"
          >
            <view class="label">{{ mechanicalLabels[item.name] || item.name }}</view>
            <view class="input-wrapper">
              <template v-if="['总行程', '超程', '开距'].includes(item.name)">
                <view class="input-box" style="visibility: hidden"></view>
                <view class="input-box">
                  <input type="number" class="limit-input" v-model="item.lowerLimit" />
                </view>
              </template>
              <template v-else-if="item.name === '线圈峰值电流'">
                <view class="input-box">
                  <input type="number" class="limit-input" v-model="item.upperLimit" />
                </view>
                <view class="input-box" style="visibility: hidden"></view>
              </template>
              <template v-else>
                <view class="input-box">
                  <input type="number" class="limit-input" v-model="item.upperLimit" />
                </view>
                <view class="input-box">
                  <input type="number" class="limit-input" v-model="item.lowerLimit" />
                </view>
              </template>
            </view>
          </view>
        </view>
      </view>

      <view class="divider"></view>

      <view class="alarm-container_top_middle">
        <view class="title detail-title">
          <text>温度</text>
        </view>
        <view class="limit-labels">
          <view class="limit-label">上限</view>
          <view class="limit-label">上限</view>
        </view>
        <view class="content-area">
          <view class="temperature-group left-side">
            <view
              class="input-group"
              v-for="(item, index) in formData.temperature.slice(0, 6)"
              :key="'temp-left-' + index"
            >
              <view class="label">{{ temperatureLabels[item.name] || item.name }}</view>
              <view class="input-box">
                <input type="text" class="limit-input" v-model="item.upperLimit" />
              </view>
            </view>
          </view>

          <view class="temperature-group right-side">
            <view
              class="input-group"
              v-for="(item, index) in formData.temperature.slice(6)"
              :key="'temp-right-' + index"
            >
              <view class="label">{{ temperatureLabels[item.name] || item.name }}</view>
              <view class="input-box">
                <input type="text" class="limit-input" v-model="item.upperLimit" />
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="divider"></view>

      <view class="alarm-container_top_right">
        <view class="title detail-title">
          <text>局放</text>
        </view>
        <view class="content-area">
          <view class="limit-labels">
            <view class="limit-label">上限</view>
          </view>
          <view
            class="input-group"
            v-for="(item, index) in formData.partialDischarge"
            :key="'discharge-' + index"
          >
            <view class="label">{{ dischargeLabels[item.name] || item.name }}</view>
            <view class="input-box">
              <input type="text" class="limit-input" v-model="item.upperLimit" />
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="bottom-bar">
      <button class="reset-button" @click="resetAlarmConfig">重置</button>
      <button class="save-button" @click="saveAlarmConfig">保存</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useConfigStore } from '@/store/config'
import { updateAlarmConfig, FIXED_ALARM_CONFIG } from '@/config/delayConfig'
import { reactive, onMounted } from 'vue'

const configStore = useConfigStore()

const formData = reactive({
  mechanical: [] as Array<{
    name: string
    upperLimit?: number
    lowerLimit?: number
    decimals: number
  }>,
  temperature: [] as Array<{
    name: string
    upperLimit: number
    decimals: number
  }>,
  partialDischarge: [] as Array<{
    name: string
    upperLimit: number
    decimals: number
  }>,
})

const mechanicalLabels: Record<string, string> = {
  合闸速度: '合闸速度(m/s)',
  合闸时间: '合闸时间(ms)',
  分闸速度: '分闸速度(m/s)',
  分闸时间: '分闸时间(ms)',
  总行程: '总行程(mm)',
  开距: '开距(mm)',
  超程: '超程(mm)',
  线圈峰值电流: '线圈峰值电流(A)',
}

const temperatureLabels: Record<string, string> = {
  断路器上触壁温升A: '断路器上触臂温度A',
  断路器上触壁温升B: '断路器上触臂温度B',
  断路器上触壁温升C: '断路器上触臂温度C',
  断路器下触壁温升A: '断路器下触臂温度A',
  断路器下触壁温升B: '断路器下触臂温度B',
  断路器下触壁温升C: '断路器下触臂温度C',
  主母排温升A: '主母排温度A',
  主母排温升B: '主母排温度B',
  主母排温升C: '主母排温度C',
  出线电缆温升A: '出线电缆温度A',
  出线电缆温升B: '出线电缆温度B',
  出线电缆温升C: '出线电缆温度C',
}

const dischargeLabels: Record<string, string> = {
  断路器室温度: '断路器室温度',
  断路器室湿度: '断路器室湿度',
  超声波局放值: '超声波局放值',
  暂地电波局放值: '暂态地电波局放值',
  电缆器室温度: '电缆室温度',
  电缆器室湿度: '电缆室湿度',
}

onMounted(() => {
  formData.mechanical = JSON.parse(JSON.stringify(configStore.mechanicalAlarm))
  formData.temperature = JSON.parse(JSON.stringify(configStore.temperatureAlarm))
  formData.partialDischarge = JSON.parse(JSON.stringify(configStore.partialDischargeAlarm))
})

const saveAlarmConfig = () => {
  const mechanicalData = formData.mechanical.map((item) => ({
    name: item.name,
    ...(item.upperLimit !== undefined ? { upperLimit: Number(item.upperLimit) } : {}),
    ...(item.lowerLimit !== undefined ? { lowerLimit: Number(item.lowerLimit) } : {}),
  }))

  const temperatureData = formData.temperature.map((item) => ({
    name: item.name,
    upperLimit: Number(item.upperLimit),
  }))

  const partialDischargeData = formData.partialDischarge.map((item) => ({
    name: item.name,
    upperLimit: Number(item.upperLimit),
  }))

  updateAlarmConfig({
    mechanical: mechanicalData,
    temperature: temperatureData,
    partialDischarge: partialDischargeData,
  })

  uni.showToast({
    title: '保存成功',
    icon: 'success',
    duration: 2000,
  })
}

const resetAlarmConfig = () => {
  formData.mechanical = JSON.parse(JSON.stringify(FIXED_ALARM_CONFIG.MECHANICAL_ALARM))
  formData.temperature = JSON.parse(JSON.stringify(FIXED_ALARM_CONFIG.TEMPERATURE_ALARM))
  formData.partialDischarge = JSON.parse(JSON.stringify(FIXED_ALARM_CONFIG.PARTIAL_DISCHARGE_ALARM))
  uni.showToast({
    title: '重置成功',
    icon: 'success',
    duration: 2000,
  })
}
</script>

<style scoped lang="scss">
.alarm-container {
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;

  &_top {
    box-sizing: border-box;
    display: flex;
    width: 100%;
    height: calc(100% - 60px);
    overflow: hidden;

    &_left,
    &_right {
      width: 25%;
    }

    &_middle {
      width: 50%;
    }

    &_left,
    &_middle,
    &_right {
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      padding-bottom: 20px;
      overflow-y: auto;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-track {
        background: rgba(0, 50, 78, 0.3);
        border-radius: 3px;
      }

      &::-webkit-scrollbar-thumb {
        background: rgba(0, 149, 255, 0.5);
        border-radius: 3px;
      }

      &::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 149, 255, 0.7);
      }
    }
  }
}

.title {
  position: sticky;
  top: 0;
  z-index: 10;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  width: 100%;
  height: 43px;
  padding: 13px 0 13px 18px;
  margin-bottom: 20px;
  font-family: Source Han Sans CN;
  font-size: 18px;
  font-weight: 500;
  color: #f1f2f7;
  background-color: #001529;
  border-radius: 4px;
}

.divider {
  flex-shrink: 0;
  width: 1px;
  height: 100%;
  margin-right: 24px;
  margin-left: 24px;
  background-color: #00528a;
}

.content-area {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 0 16px;
}

.input-group {
  width: 100%;
  margin-bottom: 18px;
}

.label {
  margin-bottom: 8px;
  font-size: 14px;
  color: #f1f2f7;
}

.input-wrapper {
  position: relative;
  display: flex;
  justify-content: space-between;
}

.limit-labels {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 17px;
}

.limit-label {
  flex: 1;
  font-family: Source Han Sans CN;
  font-size: 16px;
  font-weight: 400;
  color: #00deff;
  text-align: center;
}

.input-box {
  flex: 1;
  margin: 0 4px;

  &.single-input {
    width: 100%;
  }
}

:deep(.limit-input) {
  box-sizing: border-box;
  width: 100%;
  height: 36px;
  padding: 0 12px;
  font-size: 16px;
  color: #f1f2f7;
  background: rgba(0, 50, 78, 0.6);
  border: 2px solid #00528a;
  border-radius: 4px;
}

.temperature-group {
  display: flex;
  flex-direction: column;
  width: 100%;

  &.left-side {
    margin-right: 10px;
  }

  &.right-side {
    margin-left: 10px;
  }
}

.bottom-bar {
  position: relative;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  justify-content: center;
  height: 40px;
  margin-top: 10px;
  margin-bottom: 10px;
  button {
    box-sizing: border-box;
    font-size: 18px;
    font-weight: 500;
    color: #fff;
    text-align: center;
    background-color: #051635;
    border-radius: 4px;
  }
}

.save-button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 150px;
  height: 40px;
  line-height: 40px;
  color: #ffffff;
  background-image: url('/static/frame/confirm-btn.png');
  background-size: 100% 100%;
  &:active {
    transform: scale(0.9);
  }
}

.reset-button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 150px;
  height: 40px;
  line-height: 40px;
  color: #ffffff;
  background-color: #00528a !important;
  border-radius: 4px;
}

.alarm-container_top_middle {
  .content-area {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;

    .temperature-group {
      flex: 0 0 calc(50% - 10px);
    }
  }
}
</style>
