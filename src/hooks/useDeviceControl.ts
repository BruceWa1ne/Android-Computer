import PeriodicSerialManager from '@/utils/periodicSerial'
import type { BaseInfo } from '@/types/base-info'
import { ref, watch, type Ref } from 'vue'
import { DeviceAction, DeviceState } from '@/enum/states'
import { EnalbeCommand } from '@/enum/command'
import { FIXED_DELAY_CONFIG, dynamicDelayConfig } from '@/config/delayConfig'
import TablesManager from '@/utils/tables'
import CurveManager from '@/utils/curveManager'

const DELAY_CONFIG = {
  ...FIXED_DELAY_CONFIG,
}

interface DeviceControlOptions {
  baseInfo: Ref<Partial<BaseInfo>>
}

/**
 * 设备控制钩子
 */
export default function useDeviceControl(options: DeviceControlOptions) {
  const { baseInfo } = options

  const COMMANDS = {
    [DeviceAction.CHASSIS_IN]: EnalbeCommand.CHASSIS_IN, // 底盘车摇进命令
    [DeviceAction.CHASSIS_OUT]: EnalbeCommand.CHASSIS_OUT, // 底盘车摇出命令
    [DeviceAction.BREAKER_ON]: EnalbeCommand.BREAKER_ON, // 断路器合闸命令
    [DeviceAction.BREAKER_OFF]: EnalbeCommand.BREAKER_OFF, // 断路器分闸命令
    [DeviceAction.GROUND_ON]: EnalbeCommand.GROUND_ON, // 接地刀合闸命令
    [DeviceAction.GROUND_OFF]: EnalbeCommand.GROUND_OFF, // 接地刀分闸命令
  }

  // 操作状态跟踪
  const operationState = ref({
    isRunning: false, // 是否有操作正在运行
    currentAction: '' as DeviceAction | '', // 当前执行的操作
    isWaitingForState: false, // 是否在等待状态变化
    targetState: null as { key: keyof BaseInfo; value: string } | null, // 目标状态
    lastActionTime: 0, // 上一次操作时间
    scanInterval: null as ReturnType<typeof setInterval> | null, // 状态扫描定时器
    videoFullscreenTimer: null as ReturnType<typeof setTimeout> | null, // 视频全屏定时器
    videoContext: null as any, // 当前操作的视频上下文
    curveRequestTimeout: null as ReturnType<typeof setTimeout> | null, // 曲线数据请求超时定时器
  })

  // 曲线拉取状态标志
  const isFetchingCurve = ref(false)

  // 用于记录操作前的状态
  const previousState = ref({
    chassisPosition: baseInfo.value.chassisPosition,
    breakerState: baseInfo.value.breakerState,
    groundingState: baseInfo.value.groundingState,
    closingOperationsNum: baseInfo.value.closingOperationsNum,
    openingOperationsNum: baseInfo.value.openingOperationsNum,
  })

  /**
   * 检查操作前提条件（与底盘车物理位置相关的部分）
   */
  const checkChassisPhysicalPosition = (action: DeviceAction): boolean => {
    // 底盘车摇入检查
    if (action === DeviceAction.CHASSIS_IN) {
      if (
        baseInfo.value.chassisPosition !== DeviceState.ON &&
        (baseInfo.value.breakerState !== DeviceState.OFF ||
          baseInfo.value.groundingState !== DeviceState.OFF)
      ) {
        console.warn('底盘车摇入时，断路器或接地刀状态不正确')
        return false
      }
    }
    // 断路器合闸检查
    else if (action === DeviceAction.BREAKER_ON) {
      if (baseInfo.value.chassisPosition !== DeviceState.ON) {
        console.warn('底盘车尚未完全到达工作位，无法执行断路器合闸')
        return false
      }
    }
    // 接地刀合闸检查
    else if (action === DeviceAction.GROUND_ON) {
      if (baseInfo.value.chassisPosition !== DeviceState.OFF) {
        console.warn('底盘车尚未完全到达试验位，无法执行接地刀合闸')
        return false
      }
    }

    return true
  }

  /**
   * 请求获取曲线数据
   * @param operationType 操作类型 ('opening'|'closing')
   */
  const requestCurveData = (operationType: 'opening' | 'closing') => {
    // 确保之前的请求超时定时器已清除
    if (operationState.value.curveRequestTimeout) {
      clearTimeout(operationState.value.curveRequestTimeout)
      operationState.value.curveRequestTimeout = null
    }

    // 设置标志
    isFetchingCurve.value = true

    // 设置曲线进度回调
    CurveManager.setProgressCallback((stage, isComplete) => {
      if (!isComplete) {
        uni.showLoading({
          title: stage,
          mask: true,
        })
      } else {
        isFetchingCurve.value = false
        setTimeout(() => {
          uni.hideLoading()
        }, 1000)
      }
    })

    operationState.value.curveRequestTimeout = setTimeout(() => {
      if (isFetchingCurve.value) {
        console.warn(`获取${operationType}曲线数据超时，强制结束请求`)
        isFetchingCurve.value = false

        if (!PeriodicSerialManager.getStatus().isRunning) {
          PeriodicSerialManager.resetLockState() // 重置任何可能的锁状态
          PeriodicSerialManager.start()
        }

        uni.hideLoading()
        showToast(
          `获取${operationType === 'opening' ? '分闸' : '合闸'}曲线数据超时，请检查设备状态`,
        )
      }
    }, 30000)

    setTimeout(() => {
      try {
        console.log(`开始获取${operationType}曲线数据`)
        CurveManager.requestCurveData(operationType)
      } catch (error) {
        console.error(`请求${operationType}曲线数据时发生错误:`, error)
        isFetchingCurve.value = false

        if (!PeriodicSerialManager.getStatus().isRunning) {
          PeriodicSerialManager.resetLockState()
          PeriodicSerialManager.start()
        }

        uni.hideLoading()
        showToast(`获取${operationType === 'opening' ? '分闸' : '合闸'}曲线数据失败，请稍后再试`)
      }
    }, 500)
  }

  /**
   * 检查操作是否成功并处理状态变化
   */
  const checkAndHandleStateChange = () => {
    if (!operationState.value.isWaitingForState || !operationState.value.targetState) {
      return
    }

    const { targetState, currentAction } = operationState.value
    const { key, value } = targetState

    if (baseInfo.value[key] === value) {
      // 增加对分合闸次数的检查
      let operationSuccessful = true

      if (currentAction === DeviceAction.BREAKER_ON) {
        // 合闸操作：检查合闸次数是否增加
        const prevCount = previousState.value.closingOperationsNum
          ? parseInt(previousState.value.closingOperationsNum)
          : 0
        const currentCount = baseInfo.value.closingOperationsNum
          ? parseInt(baseInfo.value.closingOperationsNum)
          : 0

        if (currentCount <= prevCount) {
          console.warn('断路器合闸操作未增加合闸次数，操作可能未成功')
          operationSuccessful = false
        } else {
          console.log(`断路器合闸次数已增加：${prevCount} -> ${currentCount}`)
        }
      } else if (currentAction === DeviceAction.BREAKER_OFF) {
        // 分闸操作：检查分闸次数是否增加
        const prevCount = previousState.value.openingOperationsNum
          ? parseInt(previousState.value.openingOperationsNum)
          : 0
        const currentCount = baseInfo.value.openingOperationsNum
          ? parseInt(baseInfo.value.openingOperationsNum)
          : 0

        if (currentCount <= prevCount) {
          console.warn('断路器分闸操作未增加分闸次数，操作可能未成功')
          operationSuccessful = false
        } else {
          console.log(`断路器分闸次数已增加：${prevCount} -> ${currentCount}`)
        }
      }

      if (
        !operationSuccessful &&
        (currentAction === DeviceAction.BREAKER_ON || currentAction === DeviceAction.BREAKER_OFF)
      ) {
        showToast(
          `${getActionMessage(currentAction as DeviceAction)}状态已变更，但操作次数未增加，请检查设备状态`,
        )
        return
      }

      console.log(
        `操作成功：${getActionMessage(currentAction as DeviceAction)}，状态已变更为预期值`,
      )

      const isChassisOperation =
        currentAction === DeviceAction.CHASSIS_IN || currentAction === DeviceAction.CHASSIS_OUT
      const isGroundOnOperation = currentAction === DeviceAction.GROUND_ON

      if (isChassisOperation || isGroundOnOperation) {
        if (!checkChassisPhysicalPosition(currentAction as DeviceAction)) {
          showToast('设备状态已更新，但可能尚未完全就位，请等待完成')
        }
      }

      let successMessage = ''
      let waitTime = 0

      if (currentAction === DeviceAction.CHASSIS_IN) {
        successMessage = '底盘车摇入成功'
        waitTime = dynamicDelayConfig.DELAY_CHASSIS_IN
        showToast(`底盘车摇入状态已更新，等待底盘车完全到位(${waitTime / 1000}秒)...`)
      } else if (currentAction === DeviceAction.CHASSIS_OUT) {
        successMessage = '底盘车摇出成功'
        waitTime = dynamicDelayConfig.DELAY_CHASSIS_OUT
        showToast(`底盘车摇出状态已更新，等待底盘车完全到位(${waitTime / 1000}秒)...`)
      } else if (currentAction === DeviceAction.BREAKER_ON) {
        const prevCount = previousState.value.closingOperationsNum
          ? parseInt(previousState.value.closingOperationsNum)
          : 0
        const currentCount = baseInfo.value.closingOperationsNum
          ? parseInt(baseInfo.value.closingOperationsNum)
          : 0
        successMessage = `断路器合闸成功，合闸次数: ${prevCount} -> ${currentCount}`
        waitTime = dynamicDelayConfig.DELAY_BREAKER_ON

        console.log('合闸成功，开始获取合闸曲线数据，并启动储能状态扫描')
        requestCurveData('closing')
      } else if (currentAction === DeviceAction.BREAKER_OFF) {
        const prevCount = previousState.value.openingOperationsNum
          ? parseInt(previousState.value.openingOperationsNum)
          : 0
        const currentCount = baseInfo.value.openingOperationsNum
          ? parseInt(baseInfo.value.openingOperationsNum)
          : 0
        successMessage = `断路器分闸成功，分闸次数: ${prevCount} -> ${currentCount}`
        waitTime = dynamicDelayConfig.DELAY_BREAKER_OFF

        console.log('分闸成功，开始获取分闸曲线数据')
        requestCurveData('opening')
      } else if (currentAction === DeviceAction.GROUND_ON) {
        successMessage = '接地刀合闸成功'
        waitTime = dynamicDelayConfig.DELAY_GROUND_ON
      } else if (currentAction === DeviceAction.GROUND_OFF) {
        successMessage = '接地刀分闸成功'
        waitTime = dynamicDelayConfig.DELAY_GROUND_OFF
      }

      if (successMessage) {
        showToast(successMessage)
      }

      stopStateScanning()

      // 只有在非曲线拉取状态下才调用 hideLoading
      if (
        !isFetchingCurve.value &&
        currentAction !== DeviceAction.BREAKER_ON &&
        currentAction !== DeviceAction.BREAKER_OFF
      ) {
        setTimeout(() => {
          uni.hideLoading()
        }, 1000)
      }

      // 为日志添加操作次数信息（分合闸操作）
      let logDescription = '操作成功'
      if (currentAction === DeviceAction.BREAKER_ON) {
        const prevCount = previousState.value.closingOperationsNum
          ? parseInt(previousState.value.closingOperationsNum)
          : 0
        const currentCount = baseInfo.value.closingOperationsNum
          ? parseInt(baseInfo.value.closingOperationsNum)
          : 0
        logDescription = `操作成功，合闸次数: ${prevCount} -> ${currentCount}`
      } else if (currentAction === DeviceAction.BREAKER_OFF) {
        const prevCount = previousState.value.openingOperationsNum
          ? parseInt(previousState.value.openingOperationsNum)
          : 0
        const currentCount = baseInfo.value.openingOperationsNum
          ? parseInt(baseInfo.value.openingOperationsNum)
          : 0
        logDescription = `操作成功，分闸次数: ${prevCount} -> ${currentCount}`
      }

      TablesManager.saveLog({
        eventName: `${getActionMessage(currentAction as DeviceAction)}`,
        eventDescription: logDescription,
      })
    }
  }

  /**
   * 启动状态扫描
   */
  const startStateScanning = (
    action: DeviceAction,
    targetState: { key: keyof BaseInfo; value: string },
  ) => {
    stopStateScanning()

    operationState.value.isRunning = true
    operationState.value.currentAction = action
    operationState.value.isWaitingForState = true
    operationState.value.targetState = targetState
    operationState.value.lastActionTime = Date.now()

    uni.$emit('deviceOperation', { isRunning: true, action })

    // 用于记录底盘车是否经过中间位状态
    let hasPassedMiddlePosition = false

    // 根据不同操作类型设置超时时间
    let timeoutDuration = DELAY_CONFIG.OPERATION_TIMEOUT
    if (action === DeviceAction.CHASSIS_IN) {
      timeoutDuration = dynamicDelayConfig.FAULT_DELAY_CHASSIS_IN
    } else if (action === DeviceAction.CHASSIS_OUT) {
      timeoutDuration = dynamicDelayConfig.FAULT_DELAY_CHASSIS_OUT
    } else if (action === DeviceAction.BREAKER_ON) {
      timeoutDuration = dynamicDelayConfig.FAULT_DELAY_BREAKER_ON
    } else if (action === DeviceAction.BREAKER_OFF) {
      timeoutDuration = dynamicDelayConfig.FAULT_DELAY_BREAKER_OFF
    } else if (action === DeviceAction.GROUND_ON) {
      timeoutDuration = dynamicDelayConfig.FAULT_DELAY_GROUND_ON
    } else if (action === DeviceAction.GROUND_OFF) {
      timeoutDuration = dynamicDelayConfig.FAULT_DELAY_GROUND_OFF
    }

    console.log(
      `开始状态扫描: ${getActionMessage(action)}，目标状态: ${targetState.key}=${targetState.value}，超时时间: ${timeoutDuration / 1000}秒`,
    )

    operationState.value.scanInterval = setInterval(() => {
      if (operationState.value.targetState) {
        const { key, value } = operationState.value.targetState

        const isChassisOperation =
          action === DeviceAction.CHASSIS_IN || action === DeviceAction.CHASSIS_OUT

        if (isChassisOperation) {
          const breakerState = baseInfo.value.breakerState
          const groundingState = baseInfo.value.groundingState

          if (breakerState !== DeviceState.OFF || groundingState !== DeviceState.OFF) {
            console.warn('底盘车操作过程中断路器或接地刀状态异常，可能导致底盘车无法正常移动')
          }

          // 获取实际底盘车位置，这里拿到的是原始值，包括中间位"2"
          const actualChassisPosition = baseInfo.value.chassisPosition
          console.log(actualChassisPosition, 'chassisPosition ======')

          if (action === DeviceAction.CHASSIS_OUT) {
            // 检查底盘车是否处于中间位"2"
            if (actualChassisPosition === '2') {
              console.log('检测到底盘车处于中间位，等待底盘车继续完成摇出过程')
              hasPassedMiddlePosition = true
              // 不立即判定为成功，继续等待
              return
            }
            // 检查底盘车是否已到达试验位"0"
            else if (actualChassisPosition === '0') {
              // 如果之前经历过中间位状态，或者从开始就直接到试验位，则认为摇出成功
              console.log('检测到底盘车已到达试验位，摇出操作成功')
              checkAndHandleStateChange()
              return
            }
          }
          // 底盘车摇入操作（从试验位到工作位）
          else if (action === DeviceAction.CHASSIS_IN) {
            // 检查底盘车是否处于中间位"2"
            if (actualChassisPosition === '2') {
              console.log('检测到底盘车处于中间位，等待底盘车继续完成摇入过程')
              hasPassedMiddlePosition = true
              // 不立即判定为成功，继续等待
              return
            }
            // 检查底盘车是否已到达工作位"1"
            else if (actualChassisPosition === '1') {
              console.log('检测到底盘车已到达工作位，摇入操作成功')
              checkAndHandleStateChange()
              return
            }
          }
        } else {
          // 非底盘车操作，直接比较状态
          if (baseInfo.value[key] === value) {
            checkAndHandleStateChange()
            return
          }
        }
      }

      const now = Date.now()
      const elapsed = now - operationState.value.lastActionTime

      if (elapsed > timeoutDuration) {
        console.warn(`操作超时：${getActionMessage(action)}，已超过${timeoutDuration / 1000}秒`)
        showToast(`${getActionMessage(action)}操作超时，请检查设备状态`)

        // 为日志添加操作次数信息（分合闸操作）
        let logDescription = `操作超时，已超过${timeoutDuration / 1000}秒`
        if (action === DeviceAction.BREAKER_ON || action === DeviceAction.BREAKER_OFF) {
          const operationType = action === DeviceAction.BREAKER_ON ? '合闸' : '分闸'
          const countField =
            action === DeviceAction.BREAKER_ON ? 'closingOperationsNum' : 'openingOperationsNum'

          const prevCount = previousState.value[countField]
            ? parseInt(previousState.value[countField])
            : 0
          const currentCount = baseInfo.value[countField] ? parseInt(baseInfo.value[countField]) : 0

          if (currentCount <= prevCount) {
            logDescription += `，${operationType}次数未增加`
          } else {
            logDescription += `，${operationType}次数已增加(${prevCount}->${currentCount})但状态未达到预期`
          }
        }

        TablesManager.saveLog({
          eventName: `${getActionMessage(action)}`,
          eventDescription: logDescription,
        })

        stopStateScanning()
      }
    }, DELAY_CONFIG.SCAN_INTERVAL)
  }

  /**
   * 停止状态扫描
   */
  const stopStateScanning = () => {
    if (operationState.value.scanInterval) {
      clearInterval(operationState.value.scanInterval)
      operationState.value.scanInterval = null
    }

    const wasRunning = operationState.value.isRunning
    const lastAction = operationState.value.currentAction

    operationState.value.isRunning = false
    operationState.value.isWaitingForState = false
    operationState.value.targetState = null

    if (wasRunning) {
      uni.$emit('deviceOperation', { isRunning: false, action: lastAction })
    }
  }

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
          showToast('断路器当前已处于合闸状态')
          return false
        }
      } else if (action === DeviceAction.BREAKER_OFF) {
        if (baseInfo.value.breakerState === DeviceState.OFF) {
          showToast('断路器当前已处于分闸状态')
          return false
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
          showToast('接地刀当前已处于合闸状态')
          return false
        }
      } else if (action === DeviceAction.GROUND_OFF) {
        if (baseInfo.value.groundingState === DeviceState.OFF) {
          showToast('接地刀当前已处于分闸状态')
          return false
        }
      }
    }

    return true
  }

  /**
   * 获取操作提示信息
   */
  const getActionMessage = (action: DeviceAction): string => {
    switch (action) {
      case DeviceAction.CHASSIS_IN:
        return '底盘车摇入'
      case DeviceAction.CHASSIS_OUT:
        return '底盘车摇出'
      case DeviceAction.BREAKER_ON:
        return '断路器合闸'
      case DeviceAction.BREAKER_OFF:
        return '断路器分闸'
      case DeviceAction.GROUND_ON:
        return '接地刀合闸'
      case DeviceAction.GROUND_OFF:
        return '接地刀分闸'
      default:
        return '设备操作'
    }
  }

  /**
   * 获取操作的目标状态
   */
  const getTargetState = (action: DeviceAction): { key: keyof BaseInfo; value: string } => {
    switch (action) {
      case DeviceAction.CHASSIS_IN:
        return { key: 'chassisPosition', value: DeviceState.ON }
      case DeviceAction.CHASSIS_OUT:
        // 底盘车摇出的目标状态可以是试验位"0"或中间位"2"
        return { key: 'chassisPosition', value: DeviceState.OFF }
      case DeviceAction.BREAKER_ON:
        return { key: 'breakerState', value: DeviceState.ON }
      case DeviceAction.BREAKER_OFF:
        return { key: 'breakerState', value: DeviceState.OFF }
      case DeviceAction.GROUND_ON:
        return { key: 'groundingState', value: DeviceState.ON }
      case DeviceAction.GROUND_OFF:
        return { key: 'groundingState', value: DeviceState.OFF }
      default:
        throw new Error(`未知的操作类型: ${action}`)
    }
  }

  /**
   * 发送控制命令
   */
  const sendControlCommand = async (action: DeviceAction): Promise<boolean> => {
    if (operationState.value.isRunning) {
      showToast('有操作正在进行中，请等待完成')
      return false
    }

    if (!checkPrerequisites(action)) {
      return false
    }

    // 更新操作前的状态记录
    previousState.value = {
      chassisPosition: baseInfo.value.chassisPosition,
      breakerState: baseInfo.value.breakerState,
      groundingState: baseInfo.value.groundingState,
      closingOperationsNum: baseInfo.value.closingOperationsNum,
      openingOperationsNum: baseInfo.value.openingOperationsNum,
    }

    const actionMessage = getActionMessage(action)
    const targetState = getTargetState(action)

    // 获取对应操作的超时时间
    let timeoutDuration = DELAY_CONFIG.OPERATION_TIMEOUT
    if (action === DeviceAction.CHASSIS_IN) {
      timeoutDuration = dynamicDelayConfig.FAULT_DELAY_CHASSIS_IN
    } else if (action === DeviceAction.CHASSIS_OUT) {
      timeoutDuration = dynamicDelayConfig.FAULT_DELAY_CHASSIS_OUT
    } else if (action === DeviceAction.BREAKER_ON) {
      timeoutDuration = dynamicDelayConfig.FAULT_DELAY_BREAKER_ON
    } else if (action === DeviceAction.BREAKER_OFF) {
      timeoutDuration = dynamicDelayConfig.FAULT_DELAY_BREAKER_OFF
    } else if (action === DeviceAction.GROUND_ON) {
      timeoutDuration = dynamicDelayConfig.FAULT_DELAY_GROUND_ON
    } else if (action === DeviceAction.GROUND_OFF) {
      timeoutDuration = dynamicDelayConfig.FAULT_DELAY_GROUND_OFF
    }

    try {
      PeriodicSerialManager.stop()
      await new Promise((resolve) => setTimeout(resolve, DELAY_CONFIG.STOP_BEFORE_COMMAND))

      const result = await PeriodicSerialManager.sendCommand(COMMANDS[action])

      uni.showLoading({
        title: `${actionMessage}中, 最多等待${timeoutDuration / 1000}秒...`,
      })

      startStateScanning(action, targetState)

      await new Promise((resolve) => setTimeout(resolve, DELAY_CONFIG.START_AFTER_COMMAND))
      PeriodicSerialManager.start()

      return true
    } catch (error) {
      uni.hideLoading()
      showToast(`${actionMessage}指令发送失败`, 'error')

      TablesManager.saveLog({
        eventName: `${actionMessage}`,
        eventDescription: `指令发送失败`,
      })

      stopStateScanning()

      if (!PeriodicSerialManager.getStatus().isRunning) {
        PeriodicSerialManager.start()
      }

      return false
    }
  }

  const controlDevice = (action: DeviceAction) => {
    return sendControlCommand(action)
  }

  /**
   * 清理资源
   */
  const cleanup = () => {
    if (operationState.value.scanInterval) {
      clearInterval(operationState.value.scanInterval)
      operationState.value.scanInterval = null
    }

    if (operationState.value.curveRequestTimeout) {
      clearTimeout(operationState.value.curveRequestTimeout)
      operationState.value.curveRequestTimeout = null
    }

    stopStateScanning()

    if (!PeriodicSerialManager.getStatus().isRunning) {
      PeriodicSerialManager.resetLockState()
      PeriodicSerialManager.start()
    }
  }

  return {
    controlDevice,
    isRunning: readonly(() => operationState.value.isRunning),
    cleanup,
  }
}
