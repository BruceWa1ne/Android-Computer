/* eslint-disable no-useless-constructor */
import useDeviceControl from '@/hooks/useDeviceControl'
import useSequentialControl from '@/hooks/useSequentialControl'
import { DeviceAction } from '@/enum/states'
import type { BaseInfo } from '@/types/base-info'
import { ref, type Ref } from 'vue'
import PeriodicSerialManager from './periodicSerial'

/**
 * 语音控制管理器
 * 负责接收语音控制指令并进行处理
 */
class VoiceManager {
  private static instance: VoiceManager

  private ActionCodeMap: Record<string, DeviceAction> = {
    '01': DeviceAction.CHASSIS_IN,
    '02': DeviceAction.CHASSIS_OUT,
    '03': DeviceAction.GROUND_ON,
    '04': DeviceAction.GROUND_OFF,
    '05': DeviceAction.BREAKER_ON,
    '06': DeviceAction.BREAKER_OFF,
    '07': DeviceAction.TRANSMISSION,
    '08': DeviceAction.FAILURE,
  }

  // 基础信息引用
  private baseInfo: Ref<Partial<BaseInfo>> = ref({})
  private deviceControl: ReturnType<typeof useDeviceControl> | null = null
  private sequentialControl: ReturnType<typeof useSequentialControl> | null = null
  private updateTimer: ReturnType<typeof setInterval> | null = null
  private readonly UPDATE_INTERVAL = 1000 // 定期更新间隔，单位毫秒
  private isOperationInProgress: boolean = false // 标记是否有操作正在进行中

  private constructor() {
    // 监听68帧接收事件
    uni.$on('frame68Received', this.handleFrame68Received.bind(this))

    // 初始化基础信息
    this.baseInfo.value = PeriodicSerialManager.getBaseInfo()

    // 监听设备控制操作状态变化
    uni.$on('deviceOperation', this.handleDeviceOperationStatus.bind(this))
  }

  /**
   * 启动周期性更新 baseInfo
   */
  private startPeriodicUpdate() {
    this.stopPeriodicUpdate()

    this.isOperationInProgress = true

    this.updateTimer = setInterval(() => {
      this.baseInfo.value = PeriodicSerialManager.getBaseInfo()
    }, this.UPDATE_INTERVAL)
  }

  /**
   * 停止周期性更新
   */
  private stopPeriodicUpdate() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer)
      this.updateTimer = null
      this.isOperationInProgress = false
      console.log('停止周期性更新 baseInfo')
    }
  }

  /**
   * 处理设备操作状态变化事件
   */
  private handleDeviceOperationStatus(data: { isRunning: boolean }) {
    if (data.isRunning && !this.isOperationInProgress) {
      this.startPeriodicUpdate()
    } else if (!data.isRunning && this.isOperationInProgress) {
      this.stopPeriodicUpdate()
    }
  }

  /**
   * 处理接收到的68帧数据
   */
  private handleFrame68Received(eventData: {
    frameData: string
    addrField: string
    ctrlCode: string
    dataField: string
    dataLength: number
  }) {
    try {
      const { dataField } = eventData
      if (!dataField || dataField.length < 2) {
        console.warn('接收到的68帧数据域无效', eventData)
        return
      }

      const actionType = this.ActionCodeMap[dataField]
      if (!actionType) {
        console.warn(`未知的操作码: ${dataField}`, eventData)
        return
      }

      console.log(`收到68帧控制命令: ${actionType}, 数据域: ${dataField}`)

      this.startPeriodicUpdate()
      this.executeAction(actionType)
    } catch (error) {
      console.error('处理68帧数据时出错:', error)
    }
  }

  /**
   * 执行设备控制操作
   */
  private executeAction(actionType: DeviceAction) {
    this.ensureHooksInitialized()

    if (actionType === 'transmission' || actionType === 'failure') {
      if (this.sequentialControl) {
        if (actionType === 'transmission') {
          this.sequentialControl.startTransmission()
        } else if (actionType === 'failure') {
          this.sequentialControl.startFailure()
        }
      } else {
        console.error('顺序控制钩子未初始化')
      }
    } else {
      if (actionType && this.deviceControl) {
        this.deviceControl.controlDevice(actionType)
      } else {
        console.error(`无法执行设备操作: ${actionType}`)
      }
    }
  }

  /**
   * 确保钩子已初始化
   */
  private ensureHooksInitialized() {
    this.baseInfo.value = PeriodicSerialManager.getBaseInfo()

    if (!this.deviceControl || !this.sequentialControl) {
      this.deviceControl = useDeviceControl({
        baseInfo: this.baseInfo,
      })

      this.sequentialControl = useSequentialControl({
        baseInfo: this.baseInfo,
        onProgress: (step, current, total) => {
          console.log(`顺序操作进度: ${step}, ${current}/${total}`)
        },
        onComplete: (success, message) => {
          console.log(`顺序操作完成: ${success ? '成功' : '失败'}, ${message}`)
          this.stopPeriodicUpdate()
        },
        onError: (message) => {
          console.error(`顺序操作错误: ${message}`)
          this.stopPeriodicUpdate()
        },
      })
    }
  }

  public static getInstance(): VoiceManager {
    if (!VoiceManager.instance) {
      VoiceManager.instance = new VoiceManager()
    }
    return VoiceManager.instance
  }

  /**
   * 释放资源
   */
  public destroy() {
    this.stopPeriodicUpdate()
    uni.$off('frame68Received', this.handleFrame68Received)
    uni.$off('deviceOperation', this.handleDeviceOperationStatus)

    if (this.deviceControl) {
      this.deviceControl.cleanup()
    }
    if (this.sequentialControl) {
      this.sequentialControl.cleanup()
    }
  }
}

export default VoiceManager.getInstance()
