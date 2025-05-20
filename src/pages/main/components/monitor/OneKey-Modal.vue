<template>
  <Modal
    ref="modalRef"
    :visible="visible"
    :title="title"
    :useMaskClose="useMaskClose"
    :showConfirmButton="false"
    @close="handleClose"
  >
    <view class="one-key-modal">
      <view class="operation-container">
        <view class="left">
          <view class="transmission-btn btn-style" @click="handleTransmission">送电</view>
          <view class="failure-btn btn-style" @click="handleFailure">停电</view>
        </view>
        <view class="right">
          <view class="col">
            <view class="col-1">断路器</view>
            <view
              class="col-2"
              :class="baseInfo.breakerState === DeviceState.ON ? 'error-status' : 'success-status'"
            >
              {{ baseInfo.breakerState === DeviceState.OFF ? '分闸' : '合闸' }}
            </view>
          </view>
          <view class="col">
            <view class="col-1">底盘车</view>
            <view
              class="col-2"
              :class="
                baseInfo.chassisPosition === DeviceState.ON ? 'error-status' : 'success-status'
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
          <view class="col">
            <view class="col-1">地刀</view>
            <view
              class="col-2"
              :class="
                baseInfo.groundingState === DeviceState.ON ? 'error-status' : 'success-status'
              "
            >
              {{ baseInfo.groundingState === DeviceState.ON ? '接地合' : '接地分' }}
            </view>
          </view>
        </view>
      </view>
      <view v-if="operationInProgress" class="progress-container">
        <view class="progress-title">
          {{ progressInfo.title }}进行中 ({{ progressInfo.current }}/{{ progressInfo.total }})
        </view>
        <view class="progress-bar">
          <view
            class="progress-fill"
            :style="{ width: (progressInfo.current / progressInfo.total) * 100 + '%' }"
            :class="progressInfo.current > 1 ? 'progress-shine' : ''"
          ></view>
        </view>
      </view>
    </view>
  </Modal>
  <VerifyModal
    v-model:visible="verifyModalVisible"
    :use-mask-close="true"
    @verify="handleVerifyResult"
  />
</template>

<script setup lang="ts">
import Modal from '@/components/Modal.vue'
import VerifyModal from '@/components/Verify-Modal.vue'
import type { BaseInfo } from '@/types/base-info'
import { BaseInfoKey, OperationValKey } from '@/types/device-data-keys'
import useSequentialControl from '@/hooks/useSequentialControl'
import { RunningState, DeviceState } from '@/enum/states'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '一键顺控',
  },
  useMaskClose: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['close', 'update:visible', 'confirm'])

const verifyModalVisible = ref(false)
const baseInfo = inject(BaseInfoKey) || ref<Partial<BaseInfo>>({})
const operationVal = inject(OperationValKey) || ref(0)
const action = ref('')
const operationInProgress = ref(false)
const progressInfo = ref({
  title: '',
  current: 0,
  total: 3,
})

const sequentialControl = useSequentialControl({
  baseInfo,
  onProgress: (step, current, total) => {
    progressInfo.value = {
      title: step,
      current,
      total,
    }
  },
  onComplete: (success, message) => {
    operationInProgress.value = false
    if (success) {
      emit('confirm', { action: action.value, success: true })
    }
  },
  onError: (message) => {
    operationInProgress.value = false
    emit('confirm', { action: action.value, success: false, message })
  },
})

function handleVerifyResult(success: boolean) {
  if (!success) {
    uni.showToast({
      title: '验证失败，无法执行操作',
      icon: 'none',
    })
    return
  }

  const actionConfig = {
    transmission: {
      checkState: RunningState.WORK,
      errorMsg: '已经处于运行状态',
      title: '送电操作',
      startAction: sequentialControl.startTransmission,
    },
    failure: {
      checkState: RunningState.MAINTENANCE,
      errorMsg: '已经处于检修状态',
      title: '停电操作',
      startAction: sequentialControl.startFailure,
    },
  }

  const currentAction = actionConfig[action.value]
  if (!currentAction) return

  if (operationVal.value === currentAction.checkState) {
    uni.showToast({
      title: currentAction.errorMsg,
      icon: 'none',
    })
    return
  }

  operationInProgress.value = true
  progressInfo.value.current = 0
  progressInfo.value.title = currentAction.title
  currentAction.startAction()
}

function handleClose() {
  if (operationInProgress.value) {
    uni.showToast({
      title: '操作正在进行中，请等待完成',
      icon: 'none',
    })
    return
  }
  emit('update:visible', false)
}

function handleTransmission() {
  verifyModalVisible.value = true
  action.value = 'transmission'
}

function handleFailure() {
  verifyModalVisible.value = true
  action.value = 'failure'
}

onBeforeUnmount(() => {
  sequentialControl.cleanup()
})
</script>

<style scoped lang="scss">
.one-key-modal {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.operation-container {
  display: flex;
  align-items: center;
  width: 100%;
}

.left {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
}

.right {
  flex: 1;
}

.btn-style {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 161.7px;
  height: 69.6px;
  font-size: 18px;
  font-weight: 500;
  color: #ffffff;
  cursor: pointer;
  background-size: 100% 100%;
  transition: all 0.2s ease;

  &:active {
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
    opacity: 0.9;
    transform: scale(0.95);
  }
}
.btn-style:not(:last-child) {
  margin-bottom: 24px;
}

.col {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-left: 30px;
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
}

.col:not(:last-child) {
  margin-bottom: 44px;
}

.progress-container {
  width: 100%;
  padding: 15px 10px;
  margin-top: 10px;
}

.progress-title {
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  text-align: center;
}

.progress-bar {
  width: 100%;
  height: 10px;
  overflow: hidden;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 5px;
}

.progress-fill {
  height: 100%;
  background-color: #00a0e9;
  border-radius: 5px;
  transition: width 0.3s ease;
}

.progress-shine {
  position: relative;
  overflow: hidden;

  &:after {
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    content: '';
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.4) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    animation: shine 2s infinite;
  }
}

@keyframes shine {
  0% {
    left: -100%;
  }
  100% {
    left: 200%;
  }
}
</style>
