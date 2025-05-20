<template>
  <view class="temperature-container">
    <view class="temperature-left">
      <view class="row" v-for="(item, idx) in leftParams" :key="idx">
        <view class="flex items-center justify-between">
          <span class="title">{{ item.title }}</span>
          <view class="cl">
            <span :class="'state-' + alarmInfoLeft[idx]">
              {{ item.value || 0 }} {{ item.unit }}
            </span>
          </view>
          <view class="cl">
            <span v-if="idx < 6" :class="'state-' + alarmInfoLeft[idx]">
              {{
                alarmInfoLeft[idx] === MachineCharacterType.EXCEPTION
                  ? '异常'
                  : alarmInfoLeft[idx] === MachineCharacterType.ALARM
                    ? '告警'
                    : '正常'
              }}
            </span>
          </view>
        </view>
      </view>
    </view>
    <view class="temperature-right">
      <view class="row" v-for="(item, idx) in rightParam" :key="idx">
        <view class="flex items-center justify-between">
          <span class="title">{{ item.title }}</span>
          <view class="cl">
            <span :class="'state-' + alarmInfoRight[idx]">
              {{ item.value || 0 }} {{ item.unit }}
            </span>
          </view>
          <view class="cl">
            <span v-if="idx !== 6 && idx !== 7" :class="'state-' + alarmInfoRight[idx]">
              {{
                alarmInfoRight[idx] === MachineCharacterType.EXCEPTION
                  ? '异常'
                  : alarmInfoRight[idx] === MachineCharacterType.ALARM
                    ? '告警'
                    : '正常'
              }}
            </span>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { MachineCharacterType } from '@/enum/states'
import { Ratio } from '@/enum/ratio'
import type { BaseInfo } from '@/types/base-info'
import { BaseInfoKey } from '@/types/device-data-keys'
import { analysisConfig } from '@/config/analysis'
import FaultDiagnosisManager from '@/utils/faultDiagnosis'
import { useMenuLifecycle } from '@/utils/menu-lifecycle'

const baseInfo = inject(BaseInfoKey) || ref<Partial<BaseInfo>>({})
const leftParams = ref(analysisConfig.temperature.left)
const rightParam = ref(analysisConfig.temperature.right)
const alarmInfoLeft = ref([])
const alarmInfoRight = ref([])

// 参数索引常量
const PARAM_INDICES = {
  STANDARD_PARAMS: 6,
  SPECIAL_PARAM: 6,
  LEFT_ALARM_INDICES: [12, 14],
  RIGHT_ALARM_INDICES: [13, 17],
  ALARM_SLICE: {
    LEFT: { start: 0, end: 6 },
    RIGHT: { start: 6, end: 12 },
  },
} as const

/**
 * 计算参数值
 * @param value 原始值
 * @param multiply 乘数
 * @param baseTemp 基准温度
 * @param isStandard 是否为标准参数
 * @returns 计算后的值
 */
const calculateParamValue = (
  value: number,
  multiply: number,
  baseTemp: number,
  isStandard: boolean,
): string => {
  if (isStandard) {
    return Math.abs(value * multiply - baseTemp * Ratio.ZeroPointOne).toFixed(1)
  }
  return (value * multiply).toFixed(1)
}

/**
 * 处理参数列表
 * @param params 参数列表
 * @param baseTemp 基准温度
 */
const processParams = (params: Array<any>, baseTemp: number): void => {
  params.forEach((param, index) => {
    const value = Number(baseInfo.value[param.label])
    const multiply = Number(param.multiply)
    if (isNaN(value) || isNaN(multiply)) return

    if (index < PARAM_INDICES.STANDARD_PARAMS) {
      param.value = calculateParamValue(value, multiply, Number(baseTemp), true)
    } else if (index === PARAM_INDICES.SPECIAL_PARAM) {
      param.value = calculateParamValue(value, multiply, 0, false)
    } else {
      param.value = calculateParamValue(value, Number(Ratio.ZeroPointOne), 0, false)
    }
  })
}

/**
 * 处理告警信息
 * @param alarmData 告警数据
 */
const processAlarmInfo = (alarmData: Array<any>): void => {
  if (!alarmData?.length) return

  const [firstAlarm] = alarmData

  alarmInfoLeft.value = [
    ...firstAlarm.slice(PARAM_INDICES.ALARM_SLICE.LEFT.start, PARAM_INDICES.ALARM_SLICE.LEFT.end),
    ...PARAM_INDICES.LEFT_ALARM_INDICES.map((index) => firstAlarm[index]),
  ]

  alarmInfoRight.value = [
    ...firstAlarm.slice(PARAM_INDICES.ALARM_SLICE.RIGHT.start, PARAM_INDICES.ALARM_SLICE.RIGHT.end),
    ...PARAM_INDICES.RIGHT_ALARM_INDICES.map((index) => firstAlarm[index]),
  ]
}

const init = async () => {
  try {
    processParams(leftParams.value, Number(baseInfo.value.breakerTemperature))
    processParams(rightParam.value, Number(baseInfo.value.cableTemperature))

    const alarmInfo = await FaultDiagnosisManager.executeFaultDiagnosis()
    processAlarmInfo(alarmInfo)
  } catch (error) {
    console.error('初始化失败:', error)
  }
}

watchEffect(() => {
  if (baseInfo.value) {
    init()
  }
})

useMenuLifecycle('analysis-temperature', () => {
  init()
})

onMounted(() => {
  init()
})
</script>

<style scoped lang="scss">
.temperature-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  font-family: Source Han Sans CN;
}

.temperature-left,
.temperature-right {
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 30%;
  height: 100%;
  padding: 16px 22px;
  font-size: 18px;
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
  width: 50%;
}

.cl {
  width: 25%;
}

.state-0 {
  color: #00ffcc;
}

.state-1 {
  color: orange;
}

.state-2 {
  color: #ff4200;
}
</style>
