<template>
  <ContentContainer>
    <view class="monitor-grid">
      <!-- 基本参数 -->
      <view class="basic-parameters common-border">
        <view class="row" v-for="(voltage, vIndex) in voltageList" :key="vIndex + 'voltage'">
          <view class="col-1">
            <span class="special-font-simsun">{{ voltage.normal }}</span>
            <span class="special-scale">{{ voltage.special }}</span>
          </view>
          <view class="col-2">
            {{ formatValue(baseInfo[voltage.key], UNIT_FORMATS.VOLTAGE) }}
          </view>
        </view>
        <view class="line-1"></view>
        <view
          class="row"
          v-for="(current, cIndex) in electricCurrentList"
          :key="cIndex + 'current'"
        >
          <view class="col-1">
            <span class="special-font-simsun">{{ current.special }}</span>
            <span class="special-font-simsun special-scale">{{ current.normal }}</span>
          </view>
          <view class="col-2">
            {{ formatValue(baseInfo[current.key], UNIT_FORMATS.CURRENT) }}
          </view>
        </view>
        <view class="line-1"></view>
        <view class="row-1" v-for="(power, pIndex) in capacityList" :key="pIndex + 'power'">
          <view
            class="col-1"
            v-if="pIndex === 0 || pIndex === 5"
            :class="{ 'special-font-STLiti': power.key === 'f' }"
          >
            {{ power.label }}
          </view>
          <view class="col-2" v-if="pIndex === 0 || pIndex === 5">
            {{ formatValue(baseInfo[power.key], getUnitFormatByKey(power.key)) }}
          </view>
          <view
            class="col-1"
            v-if="pIndex === 1 || pIndex === 3"
            :class="{ 'special-font-STLiti': power.key === 'f' }"
          >
            {{ power.label }}
          </view>
          <view class="col-2" v-if="pIndex === 1 || pIndex === 3">
            {{
              formatCombinedValue(
                baseInfo[capacityList[pIndex].key],
                baseInfo[capacityList[pIndex + 1].key],
                getUnitFormatByKey(power.key),
              )
            }}
          </view>
        </view>
      </view>
      <!-- 线路图 -->
      <view class="status">
        <view class="circuit-diagram">
          <image :src="diagramImg" mode="scaleToFill" />
          <view class="common-control">
            <view
              class="shake-in"
              @click="diagramClick(shakeActionChange(baseInfo.chassisPosition))"
            ></view>
            <view class="breaker" @click="diagramClick('breaker')"></view>
            <view
              class="shake-out"
              @click="diagramClick(shakeActionChange(baseInfo.chassisPosition))"
            ></view>
          </view>
          <view class="grounding-switch" @click="diagramClick('grounding')"></view>
        </view>
        <view class="control-btn common-border">
          <view class="control-info">
            <view class="row-2">
              <view class="column">
                <view class="col-1">断路器状态：</view>
                <view
                  class="col-2"
                  @click="diagramClick('breaker')"
                  :class="
                    baseInfo.breakerState == DeviceState.ON ? 'error-status' : 'success-status'
                  "
                >
                  {{ baseInfo.breakerState == DeviceState.ON ? '合闸' : '分闸' }}
                </view>
              </view>
              <view class="column">
                <view class="col-1">断路器位置：</view>
                <view
                  class="col-2"
                  @click="diagramClick(shakeActionChange(baseInfo.chassisPosition))"
                  :class="
                    baseInfo.chassisPosition == DeviceState.ON ? 'error-status' : 'success-status'
                  "
                >
                  {{
                    baseInfo.chassisPosition == DeviceState.ON
                      ? '工作位'
                      : baseInfo.chassisPosition == DeviceState.OFF
                        ? '试验位'
                        : '中间位'
                  }}
                </view>
              </view>
            </view>
            <view class="row-2 row-bottom">
              <view class="column">
                <view class="col-1">接地刀状态：</view>
                <view
                  class="col-2"
                  @click="diagramClick('grounding')"
                  :class="
                    baseInfo.groundingState == DeviceState.ON ? 'error-status' : 'success-status'
                  "
                >
                  {{ baseInfo.groundingState == DeviceState.ON ? '合闸' : '分闸' }}
                </view>
              </view>
              <view class="column">
                <view class="col-1">储能状态：</view>
                <view
                  class="col-2"
                  :class="
                    baseInfo.energyStorageState == DeviceState.ON
                      ? 'error-status'
                      : 'success-status'
                  "
                >
                  {{ baseInfo.energyStorageState == DeviceState.OFF ? '未储能' : '已储能' }}
                </view>
              </view>
            </view>
          </view>

          <view class="onetouch-btn btn" @click="handleOneTouchControl">一键顺控</view>
        </view>
      </view>
      <!-- 运行信息 -->
      <view class="operation common-border">
        <view class="cabinet-number">
          柜号：AH01
          <!--{{ baseInfo.cabinetNumber }}-->
        </view>
        <view class="operation-item">
          <view class="operation-title">运行状态</view>
          <view class="operation-condition">
            <view class="condition-item" v-for="(item, idx) in operation" :key="idx">
              <view
                class="radio-icon"
                :style="{ borderColor: operationColor }"
                v-if="operationVal === item.value"
              >
                <view class="inner-icon" :style="{ backgroundColor: operationColor }"></view>
              </view>
              <view class="no-raido" v-else></view>
              <view class="condition">{{ item.text }}</view>
            </view>
          </view>
        </view>
      </view>
      <!-- 监控视频 -->
      <view class="video-check common-border">
        <view class="circuit-breaker mb-28px">
          <view class="detail-title video-title">断路器室监控视频</view>
          <view class="videoWide">
            <VideoPlayer
              id="breakingVideo"
              :src="breakingVideo"
              autoplay
              ref="breakingVideoRef"
              @error="(event) => handleVideoError('breaking', event)"
            />
          </view>
        </view>
        <view class="cable-room">
          <view class="detail-title video-title">电缆室监控视频</view>
          <view class="videoWide">
            <VideoPlayer
              id="cableVideo"
              :src="cableVideo"
              autoplay
              ref="cableVideoRef"
              @error="(event) => handleVideoError('cable', event)"
            />
          </view>
        </view>
      </view>
    </view>
  </ContentContainer>
  <!-- 身份验证 -->
  <ValidateModal
    v-model:visible="modalVisible.validate"
    :use-mask-close="true"
    :title="actionTitle"
    @verify="handleVerifyResult"
  />
  <!-- 一键顺控 -->
  <OneKeyModal v-model:visible="modalVisible.oneKey" :use-mask-close="true" />
</template>

<script lang="ts" setup>
import { RunningState, DeviceAction, DeviceState } from '@/enum/states'
import ContentContainer from '@/components/Content-Container.vue'
import { Voltage, ElectricCurrent, Capacity } from '@/config/monitor'
import { DIAGRAM_MAP, OPERATION_STATES } from '@/config/diagram'
import { UNIT_FORMATS, getUnitFormatByKey } from '@/constants/units'
import { formatValue, formatCombinedValue } from '@/utils/formatters'
import type { BaseInfo } from '@/types/base-info'
import { BaseInfoKey, OperationValKey } from '@/types/device-data-keys'
import ValidateModal from '@/components/Verify-Modal.vue'
import OneKeyModal from '../components/monitor/OneKey-Modal.vue'
import useDeviceControl from '@/hooks/useDeviceControl'
import VideoPlayer from '@/components/Video-Player.vue'
import { useConfigStore } from '@/store/config'
import { useMenuLifecycle } from '@/utils/menu-lifecycle'
import { useSerialStore } from '@/store/serialStore'
import { getResolutionScale } from '@/utils'

const { wScale, hScale } = getResolutionScale()

interface ActionHandler {
  (): void
}
const configStore = useConfigStore()
const serialStore = useSerialStore()

const breakingVideo = ref('')
const cableVideo = ref('')
const baseInfo = inject(BaseInfoKey) || ref<Partial<BaseInfo>>({})
const modalVisible = ref({
  validate: false,
  oneKey: false,
})
const diagramImg = ref('')
const operation = ref([
  { text: '运行', value: RunningState.WORK },
  { text: '热备用', value: RunningState.HOT_RESERVE },
  { text: '冷备用', value: RunningState.COLD_RESERVE },
  { text: '检修', value: RunningState.MAINTENANCE },
])
const operationVal = ref(null)
const currentAction = ref('')
const deviceControl = useDeviceControl({
  baseInfo,
})

const widthScale = computed(() => wScale)
const heightScale = computed(() => hScale)
const isSerialOpen = computed(() => serialStore.serialStatus.isModbusOpen)
const voltageList = computed(() =>
  Voltage.map((item) => ({
    ...item,
    value: baseInfo.value[item.key as keyof BaseInfo] || '0.00',
  })),
)
const electricCurrentList = computed(() =>
  ElectricCurrent.map((item) => ({
    ...item,
    value: baseInfo.value[item.key as keyof BaseInfo] || '0.00',
  })),
)
const capacityList = computed(() =>
  Capacity.map((item) => ({
    ...item,
    value: baseInfo.value[item.key as keyof BaseInfo] || '0.00',
  })),
)
const currentStateKey = computed(() => {
  const { groundingState, breakerState, chassisPosition } = baseInfo.value
  return `${groundingState || '0'}-${breakerState || '0'}-${chassisPosition || '0'}`
})
const computedDiagramImg = computed(() => {
  return DIAGRAM_MAP[currentStateKey.value] || '/static/img/circuit-diagram1.png'
})
const computedOperationVal = computed(() => {
  const matchedState = OPERATION_STATES.find((state) => {
    return Object.entries(state.conditions).every(([key, value]) => {
      const stateValue = baseInfo.value[key as keyof BaseInfo]
      return stateValue === value
    })
  })

  return matchedState?.value ?? 0
})
const operationColor = computed(() => {
  switch (operationVal.value) {
    case RunningState.WORK:
      return '#FF4200'
    case RunningState.HOT_RESERVE:
      return '#F9AE3D'
    case RunningState.COLD_RESERVE:
      return '#00FFCC'
    case RunningState.MAINTENANCE:
      return '#179AFF'
    default:
      return '#58bc58'
  }
})
const actionTitle = computed(() => {
  switch (currentAction.value) {
    case 'breaker':
      if (baseInfo.value.breakerState === DeviceState.OFF) {
        return '断路器合闸'
      } else {
        return '断路器分闸'
      }
    case 'grounding':
      if (baseInfo.value.groundingState === DeviceState.OFF) {
        return '接地开关合闸'
      } else {
        return '接地开关分闸'
      }
    case 'shakein':
      return '底盘车摇进'
    case 'shakeout':
      return '底盘车摇出'
    default:
      return '设备操作'
  }
})

const shakeActionChange = (e: string | undefined): string => {
  return e === DeviceState.ON ? 'shakeout' : 'shakein'
}

function diagramClick(action: string): void {
  if (!isSerialOpen.value) {
    uni.showToast({
      title: '串口未打开，无法执行操作',
      icon: 'none',
    })
    return
  }
  currentAction.value = action
  modalVisible.value.validate = true
}

function handleOneTouchControl(): void {
  if (!isSerialOpen.value) {
    uni.showToast({
      title: '串口未打开，无法执行操作',
      icon: 'none',
    })
    return
  }
  modalVisible.value.oneKey = true
}

const verifyActions: Record<string, ActionHandler> = {
  // 断路器操作
  breaker: () => {
    const action =
      baseInfo.value.breakerState === DeviceState.OFF
        ? DeviceAction.BREAKER_ON
        : DeviceAction.BREAKER_OFF
    deviceControl.controlDevice(action)
  },
  // 接地刀操作
  grounding: () => {
    const action =
      baseInfo.value.groundingState === DeviceState.OFF
        ? DeviceAction.GROUND_ON
        : DeviceAction.GROUND_OFF
    deviceControl.controlDevice(action)
  },
  // 底盘车摇进
  shakein: () => {
    deviceControl.controlDevice(DeviceAction.CHASSIS_IN)
  },
  // 底盘车摇出
  shakeout: () => {
    deviceControl.controlDevice(DeviceAction.CHASSIS_OUT)
  },
}

function handleVerifyResult(success: boolean): void {
  if (!success) {
    uni.showToast({
      title: '验证失败，无法执行操作',
      icon: 'none',
    })
    return
  }

  const action = currentAction.value
  const actionHandler = verifyActions[action]

  if (actionHandler) {
    try {
      actionHandler()
    } catch (error) {
      uni.showToast({
        title: '执行操作失败，请重试',
        icon: 'none',
      })
    }
  } else {
    uni.showToast({
      title: '不支持的操作类型',
      icon: 'none',
    })
  }
}

const breakingVideoRef = ref(null)
const cableVideoRef = ref(null)

// 使用菜单生命周期管理
useMenuLifecycle(
  'deviceMonitor',
  // 激活回调
  () => {
    loadSavedCameraSettings()
    setTimeout(() => {
      handleRestartVideos()
    }, 300)
  },
  // 停用回调
  () => {
    handlePauseVideos()
  },
)

onMounted(() => {
  loadSavedCameraSettings()

  uni.$on('deviceMonitor:pause', handlePauseVideos)
  uni.$on('deviceMonitor:resume', handleResumeVideos)
  uni.$on('deviceMonitor:restart', handleRestartVideos)
  uni.$on('cameraConfig:updated', handleCameraConfigUpdate)
})

onHide(() => {
  handlePauseVideos()
})

watchEffect(() => {
  diagramImg.value = computedDiagramImg.value
  operationVal.value = computedOperationVal.value
})

provide(OperationValKey, operationVal)

const handlePauseVideos = () => {
  if (breakingVideoRef.value?.videoContext) {
    breakingVideoRef.value.videoContext.pause()
  }

  if (cableVideoRef.value?.videoContext) {
    cableVideoRef.value.videoContext.pause()
  }
}

const handleResumeVideos = () => {
  if (!breakingVideo.value || !cableVideo.value) {
    loadSavedCameraSettings()
  }

  setTimeout(() => {
    if (breakingVideoRef.value?.videoContext) {
      breakingVideoRef.value.videoContext.play()
    }

    if (cableVideoRef.value?.videoContext) {
      cableVideoRef.value.videoContext.play()
    }
  }, 500)
}

const handleRestartVideos = () => {
  handlePauseVideos()

  loadSavedCameraSettings()

  setTimeout(() => {
    try {
      if (breakingVideoRef.value) {
        if (breakingVideoRef.value.videoContext) {
          breakingVideoRef.value.videoContext.stop?.()
        }
        breakingVideoRef.value.play?.()
      }

      if (cableVideoRef.value) {
        if (cableVideoRef.value.videoContext) {
          cableVideoRef.value.videoContext.stop?.()
        }
        cableVideoRef.value.play?.()
      }
    } catch (error) {
      console.error('视频重启失败，将在1秒后重试：', error)
      setTimeout(() => {
        try {
          if (breakingVideoRef.value) breakingVideoRef.value.play?.()
          if (cableVideoRef.value) cableVideoRef.value.play?.()
        } catch (retryError) {
          console.error('视频重启重试失败：', retryError)
        }
      }, 1000)
    }
  }, 500)
}

onUnmounted(() => {
  uni.$off('deviceMonitor:pause', handlePauseVideos)
  uni.$off('deviceMonitor:resume', handleResumeVideos)
  uni.$off('deviceMonitor:restart', handleRestartVideos)
  uni.$off('cameraConfig:updated', handleCameraConfigUpdate)
})

const loadSavedCameraSettings = () => {
  breakingVideo.value = `${configStore.cameraConfig.breaking.protocol}://admin:password@${configStore.cameraConfig.breaking.ip}:${configStore.cameraConfig.breaking.port}/user=admin&password=&channel=1&stream=${configStore.cameraConfig.breaking.streamLevel}.sdp?`
  cableVideo.value = `${configStore.cameraConfig.cable.protocol}://admin:password@${configStore.cameraConfig.cable.ip}:${configStore.cameraConfig.cable.port}/user=admin&password=&channel=1&stream=${configStore.cameraConfig.cable.streamLevel}.sdp?`
}

const handleCameraConfigUpdate = () => {
  console.log('Camera config updated, reloading video streams')

  handlePauseVideos()

  loadSavedCameraSettings()

  setTimeout(() => {
    if (breakingVideoRef.value?.videoContext) {
      breakingVideoRef.value.videoContext.stop?.()
      breakingVideoRef.value.play?.()
    }

    if (cableVideoRef.value?.videoContext) {
      cableVideoRef.value.videoContext.stop?.()
      cableVideoRef.value.play?.()
    }
  }, 500)
}

const handleVideoError = (videoId: string, event?: any) => {
  console.error(`${videoId} video error, reloading video`, event)

  // 检查是否是最终失败状态
  const isFinalFailure = event?.detail?.finalFailure === true

  if (isFinalFailure) {
    console.error(`${videoId} 视频加载最终失败，不再重试`)

    // 在界面上展示错误状态
    if (videoId === 'breaking') {
      breakingVideo.value = ''
    } else if (videoId === 'cable') {
      cableVideo.value = ''
    }

    uni.showToast({
      title: `${videoId === 'breaking' ? '断路器室' : '电缆室'}视频加载失败，请检查摄像头配置`,
      icon: 'none',
      duration: 3000,
    })

    return
  }

  handlePauseVideos()
  loadSavedCameraSettings()
  setTimeout(() => {
    if (videoId === 'breaking') {
      if (breakingVideoRef.value) {
        if (breakingVideoRef.value.videoContext) {
          breakingVideoRef.value.videoContext.stop?.()
        }
        if (typeof breakingVideoRef.value.retryCount !== 'undefined') {
          breakingVideoRef.value.retryCount = 0
        }
        breakingVideoRef.value.play?.()
      }
    } else if (videoId === 'cable') {
      if (cableVideoRef.value) {
        if (cableVideoRef.value.videoContext) {
          cableVideoRef.value.videoContext.stop?.()
        }
        if (typeof cableVideoRef.value.retryCount !== 'undefined') {
          cableVideoRef.value.retryCount = 0
        }
        cableVideoRef.value.play?.()
      }
    }
  }, 500)
}
</script>

<style lang="scss" scoped>
.monitor-grid {
  display: flex;
  width: 100%;
  height: 100%;
}

.basic-parameters {
  box-sizing: border-box;
  width: 20%;
  height: 100%;
  padding: 18px 23px;
  font-size: 16px;
  font-weight: 400;
  color: #f1f2f7;
}

.status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  width: 40%;
  margin: 0 20px;
}

.circuit-diagram {
  position: relative;
  width: 80%;
  height: 100%;
  & > image {
    width: 100%;
    height: 100%;
  }
}

.common-control {
  position: absolute;
  top: 6vh;
  right: 0;
  left: 0;
  width: 7.8vw;
  height: 17.7vh;
  margin: auto;
}

.shake-in {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  width: 3.9vw;
  height: 5vh;
  margin: auto;
}

.shake-out {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  width: 3.9vw;
  height: 5vh;
  margin: auto;
}

.breaker {
  position: absolute;
  top: 50%;
  right: 0;
  left: 0;
  width: 3.9vw;
  height: 5vh;
  margin: auto;
  transform: translateY(-50%);
}

.grounding-switch {
  position: absolute;
  bottom: 4vh;
  left: -2.3vw;
  width: 7.8vw;
  height: 12.5vh;
}

.control-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 25px 20px;
  margin-top: 25px;
}

.control-info {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}

.btn {
  width: 159px;
  height: 47px;
  font-size: 22px;
  font-weight: 400;
  line-height: 47px;
  color: #179aff;
  text-align: center;
  transform: translateY(22px);
}

.operation {
  width: 10%;
  padding: 20px;
}

.cabinet-number {
  margin-bottom: 32px;
  font-size: 18px;
  font-weight: 500;
  color: #f1f2f7;
}

.operation-title {
  margin-bottom: 24px;
  font-size: 18px;
  font-weight: 500;
  color: #f1f2f7;
}

.condition-item {
  display: flex;
  align-items: center;
  margin-bottom: 39px;
}

.radio-icon {
  position: relative;
  z-index: 1;
  box-sizing: border-box;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 16.3px;
  height: 16.3px;
  border: 1px solid #179aff;
  border-radius: 16.3px;

  .inner-icon {
    position: absolute;
    width: 10px;
    height: 10px;
    background-color: #179aff;
    border-radius: 10px;
  }
}

.no-raido {
  width: 16.3px;
  height: 16.3px;
}

.condition {
  margin-left: 12px;
  font-size: 16px;
  font-weight: 400;
  color: #f1f2f7;
}

.video-check {
  width: 30%;
  padding: 20px 17px;
  margin-left: 38px;
}

.video-title {
  padding: 12px 24px;
  margin-bottom: 28px;
  font-size: 20px;
  font-weight: 500;
  color: #f1f2f7;
}

.videoWide {
  width: 100%;
  height: calc(191px * #{v-bind(heightScale)});
}

.line-1 {
  height: 1px;
  margin: 15px 0 15px 0;
  background-image: linear-gradient(to right, #179aff 50%, #179aff 50%, transparent);
  background-size: 4.1px 0.59px;
}

.column {
  display: flex;
  font-size: 19px;
  font-weight: 400;
  color: #f1f2f7;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  font-size: 16px;
  color: #f1f2f7;
}

.row-1 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  font-size: 16px;
}

.row-1:empty {
  display: none;
}

.row-2 {
  display: flex;
  flex: 0 0 100%;
  flex-direction: row;
  justify-content: space-between;
}

.row-2:not(:last-child) {
  margin-bottom: 17px;
}

.row-2.row-bottom {
  margin-bottom: 0;
}

.col-1 {
  display: flex;
  align-items: flex-end;
}

.special-scale {
  display: inline-block;
  font-size: 16px;
  transform: scale(0.7);
}

.special-font-STLiti {
  font-family: 'STLiti';
  font-weight: bold;
}

.special-font-simsun {
  font-family: 'simsun';
  font-weight: bold;
}

.header-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
  text-align: center;
}

.section-title {
  font-family: 'AlibabaPuHuiTi';
  font-size: 28px;
  font-weight: bold;
  color: #00aaff; // 使用与监测分析不同的颜色
}

.section-subtitle {
  margin-top: 8px;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
}
</style>
