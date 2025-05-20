import PeriodicSerialManager from '@/utils/periodicSerial'
import type { BaseInfo } from '@/types/base-info'
import { ref, readonly, onBeforeUnmount, watch } from 'vue'
import type { Ref } from 'vue'
import { DeviceAction, DeviceState } from '@/enum/states'
import { EnalbeCommand } from '@/enum/command'
import { FIXED_DELAY_CONFIG, dynamicDelayConfig } from '@/config/delayConfig'
import TablesManager from '@/utils/tables'

interface SequentialControlOptions {
  baseInfo: Ref<Partial<BaseInfo>>
  onProgress?: (step: string, current: number, total: number) => void
  onComplete?: (success: boolean, message: string) => void
  onError?: (message: string) => void
}

interface OperationStep {
  name: string
  check: () => boolean
  action: DeviceAction
  successState: {
    key: keyof BaseInfo
    value: string
  }
  timeout: number
}

/**
 * 顺序控制钩子
 */
export default function useSequentialControl(options: SequentialControlOptions) {
  const { baseInfo, onProgress, onComplete, onError } = options

  const COMMANDS = {
    [DeviceAction.CHASSIS_IN]: EnalbeCommand.CHASSIS_IN, // 底盘车摇进命令
    [DeviceAction.CHASSIS_OUT]: EnalbeCommand.CHASSIS_OUT, // 底盘车摇出命令
    [DeviceAction.BREAKER_ON]: EnalbeCommand.BREAKER_ON, // 断路器合闸命令
    [DeviceAction.BREAKER_OFF]: EnalbeCommand.BREAKER_OFF, // 断路器分闸命令
    [DeviceAction.GROUND_ON]: EnalbeCommand.GROUND_ON, // 接地刀合闸命令
    [DeviceAction.GROUND_OFF]: EnalbeCommand.GROUND_OFF, // 接地刀分闸命令
  }

  const executionState = ref({
    isRunning: false,
    currentStep: 0,
    totalSteps: 0,
    errorMessage: '',
    scanInterval: null as ReturnType<typeof setInterval> | null,
    lastActionTime: 0,
    isWaitingForState: false,
    targetState: null as { key: keyof BaseInfo; value: string } | null,
    currentOperation: '' as 'transmission' | 'failure' | '',
    isPausedForCommand: false,
    resumeTimeout: null as ReturnType<typeof setTimeout> | null,
  })

  // 命令相关延迟时间配置，从delayConfig中获取
  const DELAY_CONFIG = {
    // 使用固定配置
    STOP_BEFORE_COMMAND: FIXED_DELAY_CONFIG.STOP_BEFORE_COMMAND,
    START_AFTER_COMMAND: FIXED_DELAY_CONFIG.START_AFTER_COMMAND,
    SCAN_INTERVAL: FIXED_DELAY_CONFIG.SCAN_INTERVAL,
    NEXT_STEP_DELAY: FIXED_DELAY_CONFIG.NEXT_STEP_DELAY,

    // 整体操作超时时间
    TRANSMISSION_OPERATION_TIMEOUT: dynamicDelayConfig.FAULT_DELAY_POWER_ON_TIMEOUT,
    FAILURE_OPERATION_TIMEOUT: dynamicDelayConfig.FAULT_DELAY_POWER_OFF_TIMEOUT,

    // 动作超时时间
    DELAY_BREAKER_ON: dynamicDelayConfig.FAULT_DELAY_BREAKER_ON,
    DELAY_BREAKER_OFF: dynamicDelayConfig.FAULT_DELAY_BREAKER_OFF,
    DELAY_GROUND_ON: dynamicDelayConfig.FAULT_DELAY_GROUND_ON,
    DELAY_GROUND_OFF: dynamicDelayConfig.FAULT_DELAY_GROUND_OFF,
    DELAY_CHASSIS_IN: dynamicDelayConfig.FAULT_DELAY_POWER_ON_CHASSIS_IN,
    DELAY_CHASSIS_OUT: dynamicDelayConfig.FAULT_DELAY_POWER_ON_CHASSIS_OUT,
  }

  watch(
    dynamicDelayConfig,
    () => {
      DELAY_CONFIG.TRANSMISSION_OPERATION_TIMEOUT = dynamicDelayConfig.FAULT_DELAY_POWER_ON_TIMEOUT
      DELAY_CONFIG.FAILURE_OPERATION_TIMEOUT = dynamicDelayConfig.FAULT_DELAY_POWER_OFF_TIMEOUT
      DELAY_CONFIG.DELAY_BREAKER_ON = dynamicDelayConfig.FAULT_DELAY_BREAKER_ON
      DELAY_CONFIG.DELAY_BREAKER_OFF = dynamicDelayConfig.FAULT_DELAY_BREAKER_OFF
      DELAY_CONFIG.DELAY_GROUND_ON = dynamicDelayConfig.FAULT_DELAY_GROUND_ON
      DELAY_CONFIG.DELAY_GROUND_OFF = dynamicDelayConfig.FAULT_DELAY_GROUND_OFF
      DELAY_CONFIG.DELAY_CHASSIS_IN = dynamicDelayConfig.FAULT_DELAY_POWER_ON_CHASSIS_IN
      DELAY_CONFIG.DELAY_CHASSIS_OUT = dynamicDelayConfig.FAULT_DELAY_POWER_ON_CHASSIS_OUT
    },
    { deep: true },
  )

  const showToast = (message: string, icon: UniApp.ShowToastOptions['icon'] = 'none') => {
    uni.showToast({
      title: message,
      icon,
      duration: 3000,
    })
  }

  /**
   * 检查操作前提条件
   */
  const checkPrerequisites = (action: DeviceAction): boolean => {
    // 底盘车操作前置检查
    if (action === DeviceAction.CHASSIS_IN || action === DeviceAction.CHASSIS_OUT) {
      // 检查断路器和接地开关状态，必须都是分闸状态
      if (
        baseInfo.value.breakerState !== DeviceState.OFF ||
        baseInfo.value.groundingState !== DeviceState.OFF
      ) {
        showToast('当前断路器或接地开关处于合闸状态')
        return false
      }

      // 根据操作类型检查底盘车位置
      if (action === DeviceAction.CHASSIS_IN) {
        if (baseInfo.value.chassisPosition !== DeviceState.OFF) {
          showToast('底盘车当前不处于试验位')
          return false
        }
      } else if (action === DeviceAction.CHASSIS_OUT) {
        if (baseInfo.value.chassisPosition !== DeviceState.ON) {
          showToast('底盘车当前不处于工作位')
          return false
        }
      }
    }

    // 断路器操作前置检查
    else if (action === DeviceAction.BREAKER_ON || action === DeviceAction.BREAKER_OFF) {
      // 检查接地开关状态，必须是分闸状态
      if (baseInfo.value.groundingState !== DeviceState.OFF) {
        showToast('当前接地开关处于合闸状态')
        return false
      }

      // 检查底盘车位置，必须是工作位
      if (baseInfo.value.chassisPosition !== DeviceState.ON) {
        showToast('底盘车当前不处于工作位')
        return false
      }

      // 根据操作检查当前断路器状态
      if (action === DeviceAction.BREAKER_ON) {
        if (baseInfo.value.breakerState === DeviceState.ON) {
          return true // 已经是合闸状态，不需要操作但不算错误
        }
      } else if (action === DeviceAction.BREAKER_OFF) {
        if (baseInfo.value.breakerState === DeviceState.OFF) {
          return true // 已经是分闸状态，不需要操作但不算错误
        }
      }
    }

    // 接地刀操作前置检查
    else if (action === DeviceAction.GROUND_ON || action === DeviceAction.GROUND_OFF) {
      // 检查断路器状态，必须是分闸状态
      if (baseInfo.value.breakerState !== DeviceState.OFF) {
        showToast('当前断路器处于合闸状态')
        return false
      }

      // 检查底盘车位置，必须是试验位
      if (baseInfo.value.chassisPosition !== DeviceState.OFF) {
        showToast('底盘车当前不处于试验位')
        return false
      }

      // 根据操作检查当前接地刀状态
      if (action === DeviceAction.GROUND_ON) {
        if (baseInfo.value.groundingState === DeviceState.ON) {
          return true // 已经是合闸状态，不需要操作但不算错误
        }
      } else if (action === DeviceAction.GROUND_OFF) {
        if (baseInfo.value.groundingState === DeviceState.OFF) {
          return true // 已经是分闸状态，不需要操作但不算错误
        }
      }
    }

    return true
  }

  /**
   * 获取操作提示信息
   */
  const getAction = (action: DeviceAction): { message: string; timeout: number } => {
    switch (action) {
      case DeviceAction.CHASSIS_IN:
        return {
          message: '底盘车摇进',
          timeout: DELAY_CONFIG.DELAY_CHASSIS_IN,
        }
      case DeviceAction.CHASSIS_OUT:
        return {
          message: '底盘车摇出',
          timeout: DELAY_CONFIG.DELAY_CHASSIS_OUT,
        }
      case DeviceAction.BREAKER_ON:
        return {
          message: '断路器合闸',
          timeout: DELAY_CONFIG.DELAY_BREAKER_ON,
        }
      case DeviceAction.BREAKER_OFF:
        return {
          message: '断路器分闸',
          timeout: DELAY_CONFIG.DELAY_BREAKER_OFF,
        }
      case DeviceAction.GROUND_ON:
        return {
          message: '接地刀合闸',
          timeout: DELAY_CONFIG.DELAY_GROUND_ON,
        }
      case DeviceAction.GROUND_OFF:
        return {
          message: '接地刀分闸',
          timeout: DELAY_CONFIG.DELAY_GROUND_OFF,
        }
      default:
        return {
          message: '设备操作',
          timeout: 0,
        }
    }
  }

  /**
   * 发送控制命令
   */
  const sendControlCommand = async (action: DeviceAction): Promise<boolean> => {
    if (!checkPrerequisites(action)) {
      return false
    }

    const actionMessage = getAction(action).message
    const timeout = getAction(action).timeout
    executionState.value.isPausedForCommand = true

    try {
      if (
        PeriodicSerialManager.getStatus().commandLock &&
        !PeriodicSerialManager.getStatus().isProcessingCommand
      ) {
        console.warn(`发送控制命令前检测到PeriodicSerialManager锁状态异常，尝试重置`)
        PeriodicSerialManager.resetLockState()
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      PeriodicSerialManager.stop()
      await new Promise((resolve) => setTimeout(resolve, DELAY_CONFIG.STOP_BEFORE_COMMAND))
      const result = await PeriodicSerialManager.sendCommand(COMMANDS[action])

      uni.showLoading({
        title: `${actionMessage}中, 最多等待${timeout / 1000}秒...`,
      })
      executionState.value.lastActionTime = Date.now()

      await new Promise((resolve) => setTimeout(resolve, DELAY_CONFIG.START_AFTER_COMMAND))

      PeriodicSerialManager.start()
      executionState.value.isPausedForCommand = false

      return true
    } catch (error) {
      uni.hideLoading()
      showToast(`${actionMessage}指令发送失败`, 'error')

      // 记录单步操作失败
      const operationName =
        executionState.value.currentOperation === 'transmission' ? '送电' : '停电'
      const currentSteps =
        executionState.value.currentOperation === 'transmission' ? transmissionSteps : failureSteps
      const currentStep = currentSteps[executionState.value.currentStep]

      TablesManager.saveLog(
        {
          eventName: `${operationName}单步操作失败`,
          eventDescription: `${actionMessage}指令发送失败，步骤名称: ${currentStep.name}`,
        },
        'record',
      ).catch((err) => {
        console.error('记录操作日志失败:', err)
      })

      // 确保周期性刷新被重新启动
      if (!PeriodicSerialManager.getStatus().isRunning) {
        PeriodicSerialManager.resetLockState() // 重置锁状态
        PeriodicSerialManager.start()
      }

      executionState.value.isPausedForCommand = false
      return false
    }
  }

  /**
   * 检查单步操作是否成功
   */
  const checkOperationSuccess = (targetState: { key: keyof BaseInfo; value: string }): boolean => {
    const { key, value } = targetState
    return baseInfo.value[key] === value
  }

  /**
   * 停止当前操作
   */
  const stopOperation = (success: boolean, message: string) => {
    setTimeout(() => {
      uni.hideLoading()
    }, 1000)

    if (executionState.value.scanInterval) {
      clearInterval(executionState.value.scanInterval)
      executionState.value.scanInterval = null
    }

    if (executionState.value.resumeTimeout) {
      clearTimeout(executionState.value.resumeTimeout)
      executionState.value.resumeTimeout = null
    }

    // 记录操作日志
    const operationName =
      executionState.value.currentOperation === 'transmission' ? '送电操作' : '停电操作'
    const eventName = `一键顺控${operationName}`
    TablesManager.saveLog(
      {
        eventName,
        eventDescription: message,
      },
      'record',
    ).catch((err) => {
      console.error('记录操作日志失败:', err)
    })

    uni.$emit('deviceOperation', {
      isRunning: false,
      action: executionState.value.currentOperation === 'transmission' ? 'transmission' : 'failure',
    })

    executionState.value.isRunning = false
    executionState.value.isWaitingForState = false
    executionState.value.targetState = null
    executionState.value.currentOperation = ''
    executionState.value.isPausedForCommand = false

    try {
      if (!PeriodicSerialManager.getStatus().isRunning) {
        if (PeriodicSerialManager.getStatus().commandLock) {
          console.warn('操作停止时发现PeriodicSerialManager锁状态异常，尝试重置')
          PeriodicSerialManager.resetLockState()
        }

        PeriodicSerialManager.start()
      }
    } catch (error) {
      console.error('恢复周期性刷新状态失败:', error)
      // 强制尝试重置和启动
      PeriodicSerialManager.resetLockState()
      PeriodicSerialManager.start()
    }

    if (onComplete) {
      onComplete(success, message)
    }

    if (success) {
      showToast(message)
    } else {
      showToast(message, 'error')
    }
  }

  /**
   * 扫描检查状态
   */
  const scanState = () => {
    // 如果正在暂停周期性扫描以发送命令，则跳过此次检查
    if (executionState.value.isPausedForCommand) {
      return
    }

    try {
      if (!PeriodicSerialManager.getStatus().isRunning) {
        console.warn('扫描状态时发现PeriodicSerialManager未运行，尝试重启')

        if (PeriodicSerialManager.getStatus().commandLock) {
          PeriodicSerialManager.resetLockState()
        }

        PeriodicSerialManager.start()
      }
    } catch (error) {
      console.error('检查和恢复PeriodicSerialManager状态失败:', error)
    }

    // 检查是否在等待状态变化
    if (executionState.value.isWaitingForState && executionState.value.targetState) {
      const { targetState, lastActionTime } = executionState.value
      const now = Date.now()
      const elapsedTime = now - lastActionTime
      const currentSteps =
        executionState.value.currentOperation === 'transmission' ? transmissionSteps : failureSteps

      const currentStepInfo = currentSteps[executionState.value.currentStep]

      // 检查状态是否已经变化
      if (checkOperationSuccess(targetState)) {
        executionState.value.isWaitingForState = false
        executionState.value.targetState = null

        // 继续下一步
        executionState.value.currentStep++

        // 获取刚完成的步骤
        const steps =
          executionState.value.currentOperation === 'transmission'
            ? transmissionSteps
            : failureSteps
        const completedStepIndex = executionState.value.currentStep - 1
        const completedStep = steps[completedStepIndex]
        const operationName =
          executionState.value.currentOperation === 'transmission' ? '送电' : '停电'

        if (onProgress) {
          onProgress(
            executionState.value.currentOperation === 'transmission' ? '送电操作' : '停电操作',
            executionState.value.currentStep,
            executionState.value.totalSteps,
          )
        }

        // 检查是否完成所有步骤
        if (executionState.value.currentStep >= executionState.value.totalSteps) {
          stopOperation(true, `一键顺控${operationName}操作完成`)
          return
        }

        // 检查底盘车操作类型
        const isChassisInOperation = completedStep.action === DeviceAction.CHASSIS_IN
        const isChassisOutOperation = completedStep.action === DeviceAction.CHASSIS_OUT
        const isChassisOperation = isChassisInOperation || isChassisOutOperation

        // 使用固定步骤间延迟时间
        const delayTime = DELAY_CONFIG.NEXT_STEP_DELAY

        // 底盘车操作完成后，设置时间
        if (isChassisOperation) {
          executionState.value.lastActionTime = Date.now()
        }

        setTimeout(() => {
          executeStep()
        }, delayTime)
      }
      // 检查是否超时
      else if (elapsedTime > currentStepInfo.timeout) {
        // 超时处理
        const operationName =
          executionState.value.currentOperation === 'transmission' ? '送电' : '停电'

        const actionMsg = getAction(currentStepInfo.action).message

        // 记录单步操作超时失败
        TablesManager.saveLog(
          {
            eventName: `${operationName}单步操作超时`,
            eventDescription: `${actionMsg}等待状态更新超过${currentStepInfo.timeout / 1000}秒，步骤名称: ${currentStepInfo.name}`,
          },
          'record',
        ).catch((err) => {
          console.error('记录操作日志失败:', err)
        })

        stopOperation(
          false,
          `${operationName}操作超时: ${actionMsg}等待状态更新超过${currentStepInfo.timeout / 1000}秒，请检查设备状态`,
        )
      }
      // 检查整体操作是否超时
      else if (
        elapsedTime >
        (executionState.value.currentOperation === 'transmission'
          ? DELAY_CONFIG.TRANSMISSION_OPERATION_TIMEOUT
          : DELAY_CONFIG.FAILURE_OPERATION_TIMEOUT)
      ) {
        // 整体操作超时处理
        const operationName =
          executionState.value.currentOperation === 'transmission' ? '送电' : '停电'

        const actionMsg = getAction(currentStepInfo.action).message
        const timeoutVal =
          executionState.value.currentOperation === 'transmission'
            ? DELAY_CONFIG.TRANSMISSION_OPERATION_TIMEOUT
            : DELAY_CONFIG.FAILURE_OPERATION_TIMEOUT

        stopOperation(
          false,
          `${operationName}整体操作超时: 已超过${timeoutVal / 1000}秒，当前执行${actionMsg}，请检查设备状态`,
        )
      }
    }
  }

  /**
   * 送电操作状态重置与检查
   */
  const resetAndCheckOperationState = () => {
    if (!PeriodicSerialManager.getStatus().isRunning) {
      const result = PeriodicSerialManager.start()
    }

    if (executionState.value.scanInterval) {
      clearInterval(executionState.value.scanInterval)
    }

    executionState.value.scanInterval = setInterval(scanState, DELAY_CONFIG.SCAN_INTERVAL)
  }

  /**
   * 执行单步操作
   */
  const executeStep = async () => {
    if (
      !executionState.value.isRunning ||
      executionState.value.currentStep >= executionState.value.totalSteps ||
      executionState.value.isPausedForCommand
    ) {
      return
    }

    const steps =
      executionState.value.currentOperation === 'transmission' ? transmissionSteps : failureSteps

    const currentStep = steps[executionState.value.currentStep]

    const isGroundOnInFailure =
      executionState.value.currentOperation === 'failure' &&
      currentStep.action === DeviceAction.GROUND_ON

    if (isGroundOnInFailure) {
      if (baseInfo.value.chassisPosition !== DeviceState.OFF) {
        setTimeout(() => {
          executeStep()
        }, 3000)
        return
      }

      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    // 检查当前步骤的前提条件
    if (currentStep.check()) {
      const success = await sendControlCommand(currentStep.action)

      if (success) {
        executionState.value.isWaitingForState = true
        executionState.value.targetState = currentStep.successState

        if (
          currentStep.action === DeviceAction.CHASSIS_IN ||
          currentStep.action === DeviceAction.CHASSIS_OUT
        ) {
          const actionName = currentStep.action === DeviceAction.CHASSIS_IN ? '摇进' : '摇出'
        }
      } else {
        const operationName =
          executionState.value.currentOperation === 'transmission' ? '送电' : '停电'

        // 记录指令执行失败
        TablesManager.saveLog(
          {
            eventName: `${operationName}操作失败`,
            eventDescription: `${getAction(currentStep.action).message}指令发送失败，步骤名称: ${currentStep.name}`,
          },
          'record',
        ).catch((err) => {
          console.error('记录操作日志失败:', err)
        })

        stopOperation(
          false,
          `${operationName}操作失败：${getAction(currentStep.action).message}指令发送失败`,
        )
      }
    } else {
      executionState.value.currentStep++

      if (onProgress) {
        onProgress(
          executionState.value.currentOperation === 'transmission' ? '送电操作' : '停电操作',
          executionState.value.currentStep,
          executionState.value.totalSteps,
        )
      }

      if (executionState.value.currentStep >= executionState.value.totalSteps) {
        const operationName =
          executionState.value.currentOperation === 'transmission' ? '送电' : '停电'
        stopOperation(true, `一键顺控${operationName}操作完成`)
        return
      }

      setTimeout(() => {
        executeStep()
      }, DELAY_CONFIG.NEXT_STEP_DELAY)
    }
  }

  // 送电顺控步骤（检修转运行）
  const transmissionSteps: OperationStep[] = [
    // 1. 判断接地开关状态，如果是1需变为0
    {
      name: '接地刀分闸',
      check: () => baseInfo.value.groundingState === DeviceState.ON,
      action: DeviceAction.GROUND_OFF,
      successState: { key: 'groundingState', value: DeviceState.OFF },
      timeout: DELAY_CONFIG.DELAY_GROUND_OFF,
    },
    // 2. 判断底盘车，如果是0需变为1
    {
      name: '底盘车摇入',
      check: () => baseInfo.value.chassisPosition === DeviceState.OFF,
      action: DeviceAction.CHASSIS_IN,
      successState: { key: 'chassisPosition', value: DeviceState.ON },
      timeout: DELAY_CONFIG.DELAY_CHASSIS_IN,
    },
    // 3. 断路器状态需要从0变为1
    {
      name: '断路器合闸',
      check: () => {
        if (baseInfo.value.breakerState === DeviceState.OFF) {
          if (baseInfo.value.chassisPosition !== DeviceState.ON) {
            return false
          }
          return true
        }
        return false
      },
      action: DeviceAction.BREAKER_ON,
      successState: { key: 'breakerState', value: DeviceState.ON },
      timeout: DELAY_CONFIG.DELAY_BREAKER_ON,
    },
  ]

  // 停电顺控步骤（运行转检修）
  const failureSteps: OperationStep[] = [
    // 1. 判断断路器状态，如果是1需变为0
    {
      name: '断路器分闸',
      check: () => baseInfo.value.breakerState === DeviceState.ON,
      action: DeviceAction.BREAKER_OFF,
      successState: { key: 'breakerState', value: DeviceState.OFF },
      timeout: DELAY_CONFIG.DELAY_BREAKER_OFF,
    },
    // 2. 判断底盘车状态，如果是1需变为0
    {
      name: '底盘车摇出',
      check: () => baseInfo.value.chassisPosition === DeviceState.ON,
      action: DeviceAction.CHASSIS_OUT,
      successState: { key: 'chassisPosition', value: DeviceState.OFF },
      timeout: DELAY_CONFIG.DELAY_CHASSIS_OUT,
    },
    // 3. 接地开关由0变1
    {
      name: '接地刀合闸',
      // 增强底盘车位置检查，确保底盘车确实到位
      check: () => {
        if (baseInfo.value.groundingState === DeviceState.OFF) {
          // 再次确认底盘车位置
          if (baseInfo.value.chassisPosition !== DeviceState.OFF) {
            return false
          }
          return true
        }
        return false
      },
      action: DeviceAction.GROUND_ON,
      successState: { key: 'groundingState', value: DeviceState.ON },
      timeout: DELAY_CONFIG.DELAY_GROUND_ON,
    },
  ]

  /**
   * 启动送电操作（检修转运行）
   */
  const startTransmission = () => {
    // 检查是否已经是运行状态
    if (
      baseInfo.value.breakerState === DeviceState.ON &&
      baseInfo.value.chassisPosition === DeviceState.ON &&
      baseInfo.value.groundingState === DeviceState.OFF
    ) {
      showToast('设备已切换至运行状态', 'success')
      return
    }

    if (!PeriodicSerialManager.getStatus().isRunning) {
      PeriodicSerialManager.start()
    }

    uni.$emit('deviceOperation', { isRunning: true, action: 'transmission' })

    // 重置执行状态
    executionState.value = {
      isRunning: true,
      currentStep: 0,
      totalSteps: transmissionSteps.length,
      errorMessage: '',
      scanInterval: null,
      lastActionTime: 0,
      isWaitingForState: false,
      targetState: null,
      currentOperation: 'transmission',
      isPausedForCommand: false,
      resumeTimeout: null,
    }

    resetAndCheckOperationState()

    executeStep()

    if (onProgress) {
      onProgress('送电操作', 0, transmissionSteps.length)
    }
  }

  /**
   * 启动停电操作（运行转检修）
   */
  const startFailure = () => {
    // 检查是否已经是检修状态
    if (
      baseInfo.value.breakerState === DeviceState.OFF &&
      baseInfo.value.chassisPosition === DeviceState.OFF &&
      baseInfo.value.groundingState === DeviceState.ON
    ) {
      showToast('设备已切换至检修状态', 'success')
      return
    }

    if (!PeriodicSerialManager.getStatus().isRunning) {
      PeriodicSerialManager.start()
    }

    uni.$emit('deviceOperation', { isRunning: true, action: 'failure' })

    // 重置执行状态
    executionState.value = {
      isRunning: true,
      currentStep: 0,
      totalSteps: failureSteps.length,
      errorMessage: '',
      scanInterval: null,
      lastActionTime: 0,
      isWaitingForState: false,
      targetState: null,
      currentOperation: 'failure',
      isPausedForCommand: false,
      resumeTimeout: null,
    }

    resetAndCheckOperationState()

    executeStep()

    if (onProgress) {
      onProgress('停电操作', 0, failureSteps.length)
    }
  }

  /**
   * 取消当前操作
   */
  const cancelOperation = () => {
    if (executionState.value.isRunning) {
      uni.$emit('deviceOperation', {
        isRunning: false,
        action:
          executionState.value.currentOperation === 'transmission' ? 'transmission' : 'failure',
      })

      stopOperation(false, '操作已取消')
    }
  }

  /**
   * 清理资源
   */
  const cleanup = () => {
    if (executionState.value.scanInterval) {
      clearInterval(executionState.value.scanInterval)
      executionState.value.scanInterval = null
    }

    if (executionState.value.resumeTimeout) {
      clearTimeout(executionState.value.resumeTimeout)
      executionState.value.resumeTimeout = null
    }

    executionState.value.isRunning = false

    if (!PeriodicSerialManager.getStatus().isRunning) {
      PeriodicSerialManager.start()
    }
  }

  onBeforeUnmount(() => {
    cleanup()
  })

  return {
    startTransmission,
    startFailure,
    cancelOperation,
    executionState: readonly(executionState),
    cleanup,
  }
}
