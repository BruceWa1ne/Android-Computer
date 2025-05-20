<template>
  <view class="delay-container">
    <view class="delay-container_top">
      <view class="delay-container_top_left">
        <view class="title detail-title">
          <text>动作延时（单位：s）</text>
        </view>
        <view class="list-container">
          <view class="List" v-for="(item, idx) in actionList" :key="idx">
            <view class="item_name">
              {{ item.name }}
            </view>
            <view class="item_value">
              <input
                v-model="item.value"
                style="width: 100%; height: 100%"
                type="number"
                placeholder=""
              />
            </view>
          </view>
        </view>
      </view>

      <view class="delay-container_top_right">
        <view class="title detail-title">
          <text>故障判断延时（单位：s）</text>
        </view>
        <view class="list-container">
          <view class="List" v-for="(item, idx) in faultList" :key="idx">
            <view class="item_name">
              {{ item.name }}
            </view>
            <view class="item_value">
              <input
                v-model="item.value"
                style="width: 100%; height: 100%"
                type="number"
                placeholder=""
              />
            </view>
          </view>
        </view>
      </view>
    </view>
    <view class="delay-container_bottom">
      <button class="save-btn" @click="saveSettings">保存</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { updateDelayConfig } from '@/config/delayConfig'
import { useConfigStore } from '@/store/config'
import { onMounted, ref } from 'vue'

const configStore = useConfigStore()

const actionList = ref([
  { name: '断路器合闸', value: 5 },
  { name: '断路器分闸', value: 5 },
  { name: '接地开关合闸', value: 5 },
  { name: '接地开关分闸', value: 5 },
  { name: '底盘车摇入', value: 5 },
  { name: '底盘车摇出', value: 5 },
])

const faultList = ref([
  { name: '断路器合闸', value: 10 },
  { name: '断路器分闸', value: 10 },
  { name: '接地开关合闸', value: 10 },
  { name: '接地开关分闸', value: 10 },
  { name: '单步底盘车摇入', value: 35 },
  { name: '单步底盘车摇出', value: 35 },
  { name: '送电底盘车摇入', value: 50 },
  { name: '停电底盘车摇出', value: 35 },
  { name: '送电超时', value: 60 },
  { name: '停电超时', value: 60 },
])

onMounted(() => {
  actionList.value.forEach((item) => {
    if (configStore.actionDelay[item.name] !== undefined) {
      item.value = configStore.actionDelay[item.name]
    }
  })

  faultList.value.forEach((item) => {
    if (configStore.faultDelay[item.name] !== undefined) {
      item.value = configStore.faultDelay[item.name]
    }
  })
})

const saveSettings = () => {
  const actionConfig: Record<string, number> = {}
  const faultConfig: Record<string, number> = {}

  actionList.value.forEach((item) => {
    actionConfig[item.name] = Number(item.value)
  })

  faultList.value.forEach((item) => {
    faultConfig[item.name] = Number(item.value)
  })

  updateDelayConfig(actionConfig, faultConfig)

  uni.showToast({
    title: '保存成功',
    icon: 'success',
  })
}
</script>

<style scoped lang="scss">
.delay-container {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;

  &_top {
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    width: 100%;
    height: calc(100% - 60px);

    &_left,
    &_right {
      display: flex;
      flex: 0 0 30%;
      flex-direction: column;
    }

    &_left {
      padding-right: 110px;
    }
  }

  &_bottom {
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
}

.list-container {
  flex: 1;
  max-height: 65vh;
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

.save-btn {
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

.title {
  display: flex;
  align-items: center;
  width: 94%;
  height: 10%;
  padding-left: 10px;
  margin-bottom: 20px;
  font-family: Source Han Sans CN;
  font-size: 18px;
  font-weight: 500;
  color: #f1f2f7;
  border-radius: 4px;
}

.List {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 10px;
  font-family: Source Han Sans CN;
  font-size: 16px;
  font-weight: 400;
  color: #f1f2f7;

  .item_name {
    height: 23px;
    font-family: Source Han Sans CN;
    font-size: 16px;
    font-weight: 400;
    line-height: 23px;
    color: #fff;
    text-align: left;
  }

  .item_value {
    width: 100px;
    height: 34px;
    color: #fff;
    text-align: center;
    background: rgba(0, 50, 78, 0.6);
    border: 1px solid rgba(0, 149, 255, 0.7);
    border-radius: 2px;
    input {
      font-size: 16px;
    }
  }
}
</style>
