<template>
  <view class="mechanical-container">
    <view class="mechanical-left">
      <view class="title">操作信息</view>
      <view class="row" v-for="(item, idx) in leftParam" :key="idx">
        <view class="flex items-center justify-between">
          <span>{{ item.title }}:</span>
          <span>
            {{ Math.round(Number(item.value) * item.multiply * 100) / 100 }} {{ item.unit }}
          </span>
        </view>
      </view>
    </view>
    <view class="mechanical-right">
      <view class="title">机械特性数据</view>
      <view class="now-status">
        <span>当前操作</span>
        <span class="status">{{ status === DeviceState.ON ? '合闸' : '分闸' }}</span>
      </view>
      <view class="row" v-for="(item, idx) in rightParam" :key="idx">
        <view class="flex items-center justify-between">
          <span>{{ item.title }}:</span>
          <span class="num">{{ item.value }} {{ item.unit }}</span>
          <span :class="'state-' + rightParam[idx].state">
            {{
              rightParam[idx].state === MachineCharacterType.EXCEPTION
                ? '异常'
                : rightParam[idx].state === MachineCharacterType.ALARM
                  ? '告警'
                  : '正常'
            }}
          </span>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { BaseInfo } from '@/types/base-info'
import { BaseInfoKey } from '@/types/device-data-keys'
import { DeviceState, DataType, MachineCharacterType } from '@/enum/states'
import { analysisConfig } from '@/config/analysis'
import { useConfigStore } from '@/store/config'
import TablesManager from '@/utils/tables'
import { checkMachineCharacter, MachineCharacterConfig } from '@/utils/machineCharacterChecker'
import { useMenuLifecycle } from '@/utils/menu-lifecycle'

const configStore = useConfigStore()

const baseInfo = inject(BaseInfoKey) || ref<Partial<BaseInfo>>({})
const status = ref<string>(baseInfo.value.breakerState)
const leftParam = ref(analysisConfig.mechanical.left)
const rightParam = ref(analysisConfig.mechanical.right)

/**
 * 初始化组件数据
 */
const init = async () => {
  try {
    leftParam.value.forEach((param) => {
      param.value = baseInfo.value[param.label] || ''
    })

    const operationData = await TablesManager.selectData()
    if (!operationData?.length) return

    const operation = operationData[0]
    const machineCharacterData = JSON.parse(operation.machineCharacter || '{}')

    const operationType = operation.type
    const characterList = configStore.mechanicalAlarm
    const isClosing = operationType === DataType.CLOSE

    const operationName = isClosing ? '合闸' : '分闸'

    const keyMap: Record<string, string> = {
      合闸速度: 'speed',
      合闸时间: 'time',
      分闸速度: 'speed',
      分闸时间: 'time',
      总行程: 'distance',
      开距: 'contactDistance',
      超程: 'overContactDistance',
      线圈峰值电流: 'maxCoil',
    }
    const { result: machineCharacter } = checkMachineCharacter(
      machineCharacterData,
      characterList as MachineCharacterConfig[],
      keyMap,
    )

    rightParam.value.forEach((param, index) => {
      const data = machineCharacter[param.label]
      if (data) {
        param.value = data.data as number
        param.state = data.type
      }
    })

    status.value = operationType.toString() as DeviceState
    rightParam.value[0].title = `${operationName}速度`
    rightParam.value[1].title = `${operationName}时间`
  } catch (error) {
    console.error('初始化失败:', error)
  }
}

watch(
  [() => baseInfo.value.closingOperationsNum, () => baseInfo.value.openingOperationsNum],
  ([newClose, newOpen], [oldClose, oldOpen]) => {
    if (newClose !== oldClose || newOpen !== oldOpen) {
      init()
    }
  },
)

useMenuLifecycle('analysis-mechanical', () => {
  init()
})

onMounted(() => {
  init()
})
</script>

<style scoped lang="scss">
.mechanical-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  font-family: Source Han Sans CN;
}

.mechanical-left,
.mechanical-right {
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 30%;
  height: 100%;
  padding: 16px 22px;
  font-size: 16px;
  font-weight: 400;
  background: linear-gradient(to bottom, rgba(6, 72, 162, 0.18), transparent);
  border-radius: 2px;
}

.row {
  flex: 1;
}
.items + .items {
  margin-top: 23px;
}

.title {
  margin-bottom: 25px;
  font-size: 18px;
  font-weight: 500;
  color: #ffffff;
}

.now-status {
  margin-bottom: 23px;
  font-weight: 400;
  color: #00deff;
  .status {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }
}

.state-0 {
  position: absolute;
  right: 50%;
  color: #00ffcc;
  transform: translateX(50%);
}
.state-1 {
  position: absolute;
  right: 50%;
  color: orange;
  transform: translateX(50%);
}
.state-2 {
  position: absolute;
  right: 50%;
  color: #ff4200;
  transform: translateX(50%);
}
</style>
