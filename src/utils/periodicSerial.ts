/* eslint-disable eqeqeq */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable no-useless-constructor */
import ModbusManager, { DataParseConfig } from '@/utils/modbusManager'
import DataChangeManager from '@/utils/dataChangeManager'
import type { BaseInfo } from '@/types/base-info'
import dayjs from 'dayjs'
import CurveManager from '@/utils/curveManager'

// 命令队列项的类型定义
interface CommandQueueItem {
  command: string
  resolve: Function
  reject: Function
  dataParseConfig?: Partial<DataParseConfig>
}

/**
 * 周期性刷新管理器
 */
class PeriodicSerialManager {
  private static instance: PeriodicSerialManager
  private timer: number | null = null
  private storageTimer: number | null = null // 存储温度和局放数据的定时器
  private lockMonitorTimer: number | null = null // 用于监控锁状态的定时器
  private isRunning: boolean = false
  private isStorageInProgress: boolean = false // 标记是否有存储操作正在进行
  private readonly REFRESH_COMMAND = '010310000054' // 每秒发送的刷新基础数据的帧
  private readonly REFRESH_INTERVAL = 1000 // 刷新间隔，单位毫秒
  private readonly COMMAND_INTERVAL = 200 // 命令之间的最小间隔时间，单位毫秒
  private readonly STORAGE_INTERVAL = 10000 // 存储间隔，单位毫秒
  private readonly LOCK_TIMEOUT = 10000 // 锁超时时间，单位毫秒
  private readonly LOCK_MONITOR_INTERVAL = 2000 // 锁监控间隔，单位毫秒
  private readonly DEBUG = JSON.parse(import.meta.env.VITE_APP_PERIODIC_DEBUG)
  private commandQueue: CommandQueueItem[] = []
  private isProcessingCommand: boolean = false
  private lastCommandTime: number = 0 // 上一次发送命令的时间
  private commandLock: boolean = false // 命令锁，防止并发发送命令
  private commandLockTime: number = 0 // 记录锁定开始时间

  private baseInfo: BaseInfo = this.createEmptyBaseInfo()

  private constructor() {
    uni.$on('periodicDataReceived', this.handlePeriodicDataReceived.bind(this))
    this.startLockMonitor()
  }

  /**
   * 启动锁监控器，定期检查锁状态，防止死锁
   */
  private startLockMonitor(): void {
    if (this.lockMonitorTimer) {
      clearInterval(this.lockMonitorTimer)
    }

    this.lockMonitorTimer = setInterval(() => {
      this.checkAndRecoverLock()
    }, this.LOCK_MONITOR_INTERVAL)

    if (this.DEBUG) {
      console.log('锁监控器已启动')
    }
  }

  /**
   * 检查并恢复锁状态
   */
  private checkAndRecoverLock(): void {
    if (this.commandLock) {
      const lockDuration = Date.now() - this.commandLockTime

      if (!this.isProcessingCommand && lockDuration > this.LOCK_TIMEOUT) {
        if (this.DEBUG) {
          console.warn(
            `检测到锁状态不一致：commandLock=${this.commandLock}, isProcessingCommand=${this.isProcessingCommand}, 持续时间=${lockDuration}ms，执行自动恢复`,
          )
        }

        this.commandLock = false
        this.commandLockTime = 0

        console.warn('系统检测到锁状态异常，已自动恢复')

        if (this.commandQueue.length > 0) {
          setTimeout(() => {
            this.processNextCommand()
          }, this.COMMAND_INTERVAL)
        }
      }
    }
  }

  private createEmptyBaseInfo(): BaseInfo {
    return {
      Uab: null,
      Ubc: null,
      Uca: null,
      ia: null,
      ib: null,
      ic: null,
      f: null,
      yggl_high: null,
      yggl_low: null,
      wggl_high: null,
      wggl_low: null,
      glys: null,
      cabinetNumber: null,
      mode: null,
      operationState: null,
      healthState: null,
      breakerState: null,
      chassisPosition: null,
      groundingState: null,
      energyStorageState: null,
      reserve3: null,
      reserve4: null,
      reserve5: null,
      reserve6: null,
      closingOperationsNum: null,
      openingOperationsNum: null,
      groundingSwitchNum: null,
      chassisVehicleNum: null,
      energyStorageTime: null,
      energyStorageMotorMaxElectric: null,
      chassisVehicleActionTime: null,
      chassisVehicleMotorMaxElectric: null,
      groundingSwitchActionTime: null,
      groundingSwitchMotorMaxElectric: null,
      currentOperation: null,
      openingSpeed: null,
      openingTime: null,
      openingTotalTravel: null,
      openingDistance: null,
      openingOverTravel: null,
      openingMaxCurrent: null,
      closingSpeed: null,
      closingTime: null,
      closingTotalTravel: null,
      closingDistance: null,
      closingOverTravel: null,
      closingMaxCurrent: null,
      reserve19: null,
      reserve20: null,
      reserve21: null,
      reserve22: null,
      reserve23: null,
      breakerUpperATemperature: null,
      breakerUpperBTemperature: null,
      breakerUpperCTemperature: null,
      breakerLowerATemperature: null,
      breakerLowerBTemperature: null,
      breakerLowerCTemperature: null,
      mainBusbarATemperature: null,
      mainBusbarBTemperature: null,
      mainBusbarCTemperature: null,
      outletCableATemperature: null,
      outletCableBTemperature: null,
      outletCableCTemperature: null,
      reserve24: null,
      reserve25: null,
      reserve26: null,
      reserve27: null,
      reserve28: null,
      breakerTemperature: null,
      breakerHumidity: null,
      ultrasonicVal: null,
      transientGroundWaveVal: null,
      cableHumidity: null,
      cableTemperature: null,
      airTightTemperature: null,
      airTightPressure: null,
      airtightMeterGasDensity: null,
      reserve29: null,
      reserve30: null,
      reserve31: null,
      reserve32: null,
      reserve33: null,
      reserve34: null,
    }
  }

  // 处理周期性接收的数据
  private handlePeriodicDataReceived(result: { data: string | number[]; success: boolean }) {
    if (result && result.success && Array.isArray(result.data)) {
      this.dataFormat(result.data)
    }
  }

  /**
   * 数据格式化处理
   * @param arr 接收到的数据数组
   */
  private dataFormat(arr: Array<string | number>) {
    if (Array.isArray(arr) && arr.length > 0) {
      const objKeys = Object.keys(this.baseInfo)
      let arrIndex = 0

      for (let i = 0; i < objKeys.length; i++) {
        const key = objKeys[i] as keyof BaseInfo
        if (key === 'updateTime' || this.baseInfo[key] === '') {
          continue
        }

        this.baseInfo[key] = String(arr[arrIndex])
        arrIndex++
      }

      this.baseInfo.updateTime = dayjs().format('YYYY-MM-DD HH:mm:ss')

      if (this.DEBUG) {
        console.log('数据格式化完成:', this.baseInfo)
      }

      uni.$emit('baseInfoUpdated', { ...this.baseInfo })
    } else if (this.DEBUG) {
      console.warn('数据格式化失败: 无效的数据数组', arr)
    }
  }

  /**
   * 启动温度和局放数据存储定时器
   */
  private startDataStorageTimer(): void {
    if (this.storageTimer) {
      return
    }

    this.storageTimer = setInterval(async () => {
      if (!this.isRunning || this.isStorageInProgress) {
        return
      }

      this.isStorageInProgress = true

      try {
        await CurveManager.saveTemperatureAndPartialData()
        if (this.DEBUG) {
          console.log('温度和局放数据已存储')
        }
      } catch (error) {
        if (this.DEBUG) {
          console.error('存储温度和局放数据时出错:', error)
        }
      } finally {
        this.isStorageInProgress = false
      }
    }, this.STORAGE_INTERVAL)

    if (this.DEBUG) {
      console.log('温度和局放数据存储定时器已启动')
    }
  }

  /**
   * 停止温度和局放数据存储定时器
   */
  private stopDataStorageTimer(): void {
    if (this.storageTimer) {
      clearInterval(this.storageTimer)
      this.storageTimer = null

      if (this.DEBUG) {
        console.log('温度和局放数据存储定时器已停止')
      }
    }
  }

  /**
   * 停止锁监控定时器
   */
  private stopLockMonitor(): void {
    if (this.lockMonitorTimer) {
      clearInterval(this.lockMonitorTimer)
      this.lockMonitorTimer = null

      if (this.DEBUG) {
        console.log('锁监控定时器已停止')
      }
    }
  }

  public static getInstance(): PeriodicSerialManager {
    if (!PeriodicSerialManager.instance) {
      PeriodicSerialManager.instance = new PeriodicSerialManager()
    }
    return PeriodicSerialManager.instance
  }

  /**
   * 获取当前基础信息
   * @returns 基础信息对象的副本
   */
  public getBaseInfo(): BaseInfo {
    return { ...this.baseInfo }
  }

  /**
   * 重置锁状态
   * 在发生异常或需要强制重置系统状态时使用
   */
  public resetLockState(): void {
    const wasLocked = this.commandLock

    this.commandLock = false
    this.commandLockTime = 0
    this.isProcessingCommand = false

    if (this.DEBUG && wasLocked) {
      console.log('锁状态已手动重置')
    }

    // 如果队列中有待处理的命令，尝试处理
    if (this.commandQueue.length > 0) {
      setTimeout(() => {
        this.processNextCommand()
      }, this.COMMAND_INTERVAL)
    }
  }

  /**
   * 开始周期性发送刷新指令
   * @returns 是否成功启动
   */
  public start(): boolean {
    // 检查串口是否打开
    try {
      // 检查是否已启动串口
      if (!ModbusManager || !ModbusManager.isModbusOpen()) {
        if (this.DEBUG) {
          console.log('串口未打开，无法启动周期性刷新')
        }
        return false
      }

      if (this.isRunning) {
        if (this.DEBUG) {
          console.log('周期性刷新已经在运行中')
        }
        return false
      }

      this.isRunning = true
      this.scheduleNextRefresh()

      // 启动数据存储定时器
      this.startDataStorageTimer()

      if (this.DEBUG) {
        console.log('周期性刷新已启动')
        console.log('资源状态：', this.getResourceStatus())
      }

      // 发布周期性刷新状态变更事件
      uni.$emit('periodicRefreshStatusChanged', { isRunning: true })

      const dataChangeManager = DataChangeManager
      dataChangeManager.startListening()

      return true
    } catch (error) {
      if (this.DEBUG) {
        console.error('启动周期性刷新失败:', error)
      }
      return false
    }
  }

  /**
   * 停止周期性发送刷新指令
   * @returns 是否成功停止
   */
  public stop(): boolean {
    if (!this.isRunning) return false

    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }

    // 停止数据存储定时器
    this.stopDataStorageTimer()

    this.isRunning = false

    if (this.DEBUG) {
      console.log('周期性刷新已停止')
      console.log('资源状态：', this.getResourceStatus())
    }

    // 发布周期性刷新状态变更事件
    uni.$emit('periodicRefreshStatusChanged', { isRunning: false })

    const dataChangeManager = DataChangeManager
    dataChangeManager.stopListening()

    return true
  }

  /**
   * 获取资源状态
   * @returns 资源状态对象
   */
  private getResourceStatus(): {
    isRunning: boolean
    queueLength: number
    isProcessingCommand: boolean
    commandLock: boolean
    timeSinceLastCommand: number
    isStorageInProgress: boolean
    lockTime: number | null
  } {
    return {
      isRunning: this.isRunning,
      queueLength: this.commandQueue.length,
      isProcessingCommand: this.isProcessingCommand,
      commandLock: this.commandLock,
      timeSinceLastCommand: Date.now() - this.lastCommandTime,
      isStorageInProgress: this.isStorageInProgress,
      lockTime: this.commandLock ? Date.now() - this.commandLockTime : null,
    }
  }

  /**
   * 安排下一次刷新
   */
  private scheduleNextRefresh(): void {
    if (!this.isRunning) return

    this.timer = setTimeout(async () => {
      if (this.isRunning && !this.isProcessingCommand && !this.commandLock) {
        const timeSinceLastCommand = Date.now() - this.lastCommandTime
        if (timeSinceLastCommand < this.COMMAND_INTERVAL) {
          if (this.DEBUG) {
            console.log(`距离上次命令发送时间太短 (${timeSinceLastCommand}ms)，延迟刷新`)
          }
          this.scheduleNextRefresh()
          return
        }

        try {
          this.commandLock = true
          this.commandLockTime = Date.now()
          await this.sendRefreshCommand()
        } catch (error) {
          if (this.DEBUG) {
            console.error('发送刷新指令失败:', error)
          }
        } finally {
          this.commandLock = false
        }
      }

      this.scheduleNextRefresh()
    }, this.REFRESH_INTERVAL)
  }

  /**
   * 发送刷新指令
   * @returns 指令执行结果
   */
  private async sendRefreshCommand() {
    if (this.DEBUG) {
      console.log('发送刷新指令:', this.REFRESH_COMMAND)
    }
    this.lastCommandTime = Date.now()

    try {
      const result = await ModbusManager.send(this.REFRESH_COMMAND)
      if (this.DEBUG) {
        console.log('刷新指令响应:', result)
      }

      if (result && result.success && Array.isArray(result.data)) {
        this.dataFormat(result.data)
      }

      return result
    } catch (error) {
      if (this.DEBUG) {
        console.error('刷新指令发送失败:', error)
      }
      throw error
    }
  }

  /**
   * 获取当前状态
   * @returns 当前状态对象
   */
  public getStatus() {
    return {
      isRunning: this.isRunning,
      commandQueue: this.commandQueue.length,
      isProcessingCommand: this.isProcessingCommand,
      commandLock: this.commandLock,
      isStorageInProgress: this.isStorageInProgress,
    }
  }

  /**
   * 发送命令获取数据
   * @param command 要发送的命令
   * @param dataParseConfig 数据解析配置(可选),用于指定如何解析接收到的数据
   * @returns 返回的数据
   */
  public async sendCommand(
    command: string,
    dataParseConfig?: Partial<DataParseConfig>,
  ): Promise<{ data: string | number[]; success: boolean }> {
    if (this.DEBUG) {
      console.log(
        `[PeriodicSerialManager] 收到命令请求: ${command}, 当前状态: ${JSON.stringify(
          this.getResourceStatus(),
        )}`,
      )
    }

    return new Promise((resolve, reject) => {
      if (this.commandQueue.length > 50) {
        console.error('命令队列已满，无法处理更多命令')
        reject('命令队列已满')
        return
      }

      this.commandQueue.push({
        command,
        resolve,
        reject,
        dataParseConfig,
      })

      if (this.DEBUG) {
        console.log(
          `[PeriodicSerialManager] 命令添加到队列，当前队列长度: ${this.commandQueue.length}`,
        )
      }

      if (!this.commandLock) {
        this.processNextCommand()
      } else if (this.DEBUG) {
        console.log('[PeriodicSerialManager] 命令已入队，等待锁释放后执行')
      }
    })
  }

  /**
   * 处理队列中的下一个命令
   */
  private async processNextCommand(): Promise<void> {
    if (this.commandLock) {
      if (this.DEBUG) {
        console.log('[PeriodicSerialManager] 命令锁已被占用，跳过当前处理')
      }
      return
    }

    const nextCommand = this.commandQueue.shift()
    if (!nextCommand) {
      return
    }

    this.commandLock = true
    this.commandLockTime = Date.now()
    this.isProcessingCommand = true

    const currentTime = Date.now()
    const timeSinceLastCommand = currentTime - this.lastCommandTime

    if (timeSinceLastCommand < this.COMMAND_INTERVAL) {
      const waitTime = this.COMMAND_INTERVAL - timeSinceLastCommand
      if (this.DEBUG) {
        console.log(`[PeriodicSerialManager] 等待 ${waitTime}ms 后发送命令`)
      }
      await new Promise((resolve) => setTimeout(resolve, waitTime))
    }

    const wasRunning = this.isRunning
    try {
      if (this.DEBUG) {
        console.log(`[PeriodicSerialManager] 发送命令: ${nextCommand.command}`)
      }

      if (wasRunning) {
        this.stop()
      }

      const result = await ModbusManager.send(
        nextCommand.command,
        null,
        nextCommand.dataParseConfig,
      )
      this.lastCommandTime = Date.now()

      if (result && result.success) {
        if (this.DEBUG) {
          console.log(`[PeriodicSerialManager] 命令执行成功`)
        }
        nextCommand.resolve(result)
      } else {
        if (this.DEBUG) {
          console.log(`[PeriodicSerialManager] 命令执行失败`)
        }
        nextCommand.reject('命令执行失败')
      }
    } catch (error) {
      console.error(`[PeriodicSerialManager] 命令执行出错: ${error}`)
      nextCommand.reject(error)
    } finally {
      this.isProcessingCommand = false

      if (wasRunning) {
        setTimeout(() => {
          this.start()
        }, 100)
      }

      setTimeout(() => {
        this.commandLock = false
        this.commandLockTime = 0

        if (this.commandQueue.length > 0) {
          this.processNextCommand()
        }
      }, 50)
    }
  }

  /**
   * 清理资源
   */
  public cleanup() {
    this.stop()
    this.stopLockMonitor()
    uni.$off('periodicDataReceived', this.handlePeriodicDataReceived)

    this.stopDataStorageTimer()
    this.isStorageInProgress = false

    this.baseInfo = this.createEmptyBaseInfo()

    this.commandQueue.forEach(({ reject }) => {
      reject('系统已清理，命令被取消')
    })
    this.commandQueue = []

    this.resetLockState()

    if (this.DEBUG) {
      console.log('周期性刷新管理器已清理')
    }
  }
}

export default PeriodicSerialManager.getInstance()
