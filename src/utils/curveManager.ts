/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable no-useless-constructor */
import PeriodicSerialManager from '@/utils/periodicSerial'
import { getTeData } from '@/utils/angleConverter'
import dayjs from 'dayjs'
import TablesManager from '@/utils/tables'
import { useConfigStore } from '@/store/config'
import { CurveDataType, DataType } from '@/enum/states'
import { Ratio } from '@/enum/ratio'
import { checkMachineCharacter, MachineCharacterConfig } from '@/utils/machineCharacterChecker'
import type { CurveInfo, CurveData, CurveType } from '@/types/curve'
import ModbusManager, { DataParseConfig } from '@/utils/modbusManager'

type CurveProgressCallback = (stage: string, isComplete: boolean) => void

/**
 * 曲线管理器
 * 用于获取分闸、合闸和储能曲线数据
 */
class CurveManager {
  private static instance: CurveManager
  private readonly DEBUG: boolean = JSON.parse(import.meta.env.VITE_APP_CURVE_DEBUG || 'false')

  private curveInfo: CurveInfo = {}

  private energyStatusScanTimer: ReturnType<typeof setInterval> | null = null
  private energyStatusScanTimeout: ReturnType<typeof setTimeout> | null = null
  private isScanning: boolean = false
  private readonly ENERGY_STATUS_SCAN_INTERVAL: number = 500 // 扫描间隔(毫秒)
  private readonly ENERGY_STATUS_SCAN_TIMEOUT: number = 12000 // 超时时间(毫秒)
  private readonly PACKET_MAX_SIZE: number = 512 // 分包最大数据长度
  private readonly SEND_ENERGY_DATA_DELAY: number = 5000 // 发送储能数据延迟(毫秒)
  private CurveCommandMap: Record<CurveType, number> = {
    opening: 0x4000,
    closing: 0x5000,
    energy: 0x6000,
    angle: 0x9000,
  }

  private progressCallback: CurveProgressCallback | null = null // 进度回调函数
  private isFetchingCurve: boolean = false // 曲线拉取状态标志

  private constructor() {}

  /**
   * 获取或创建曲线管理器实例
   */
  public static getInstance(): CurveManager {
    if (!CurveManager.instance) {
      CurveManager.instance = new CurveManager()
    }
    return CurveManager.instance
  }

  /**
   * 初始化曲线管理器
   */
  public initialize(): void {
    if (this.DEBUG) {
      console.log('曲线管理器初始化完成')
    }
  }

  /**
   * 设置进度回调函数
   * @param callback 进度回调函数
   */
  public setProgressCallback(callback: CurveProgressCallback): void {
    this.progressCallback = callback
  }

  /**
   * 通知进度
   * @param stage 当前阶段描述
   * @param isComplete 是否完成
   */
  private notifyProgress(stage: string, isComplete: boolean = false): void {
    if (this.progressCallback) {
      this.progressCallback(stage, isComplete)
    }
  }

  /**
   * 获取曲线原始数据
   * @param address 起始地址
   * @param step 间隔时间（毫秒）
   * @param dataParseConfig 数据解析配置,用于指定如何解析数据
   * @returns 曲线数据对象
   */
  private async getData(
    address: number,
    step: number,
    dataParseConfig?: Partial<DataParseConfig>,
  ): Promise<CurveData | null> {
    const wasRunning = PeriodicSerialManager.getStatus().isRunning

    try {
      PeriodicSerialManager.stop()

      await new Promise((resolve) => setTimeout(resolve, 100))

      if (this.DEBUG) {
        console.log(
          `准备发送曲线头部请求，检查PeriodicSerial状态: ${JSON.stringify(PeriodicSerialManager.getStatus())}`,
        )
      }

      if (
        PeriodicSerialManager.getStatus().commandLock &&
        !PeriodicSerialManager.getStatus().isProcessingCommand
      ) {
        console.warn('检测到PeriodicSerialManager的锁状态异常，尝试重置')
        PeriodicSerialManager.resetLockState()
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      const headCommand = `0103${address.toString(16).padStart(4, '0')}0003`
      if (this.DEBUG) {
        console.log(`发送曲线头部请求: ${headCommand}`)
      }

      const headResult = await PeriodicSerialManager.sendCommand(headCommand)
      if (this.DEBUG) {
        console.log('曲线头部数据结果:', headResult)
      }

      if (
        !headResult ||
        !headResult.success ||
        !Array.isArray(headResult.data) ||
        headResult.data.length < 3
      ) {
        console.error('获取曲线头部数据失败')
        throw new Error('头部数据获取失败或数据无效')
      }

      // 从头部数据中获取操作次数和有效数据长度
      const num = Number(headResult.data[0])
      const startIndex = Number(headResult.data[1])
      const endIndex = Number(headResult.data[2])
      const dataLen = endIndex - startIndex

      // 创建时间序列数组
      const stepTime = Array(dataLen)
        .fill(0)
        .map((_, index) => parseFloat((index * step).toFixed(1)))

      let curveData: number[] = []

      // 分包获取数据（每次最多获取512个数据点）
      const packetsCount = Math.ceil(dataLen / this.PACKET_MAX_SIZE)
      if (this.DEBUG) {
        console.log(`曲线数据总长度: ${dataLen}, 需要分包次数: ${packetsCount}`)
      }

      for (let i = 0; i < packetsCount; i++) {
        try {
          let startAddr: number
          let length: number

          if (i === packetsCount - 1) {
            // 最后一个包，可能不足512个数据点
            startAddr = address + 0x0003 + startIndex + 0x0200 * i
            length = dataLen - this.PACKET_MAX_SIZE * i
          } else {
            // 中间包，固定获取512个数据点
            startAddr = address + 0x0003 + startIndex + 0x0200 * i
            length = this.PACKET_MAX_SIZE
          }

          // 构建指令获取曲线分包数据
          const dataCommand = `0103${startAddr.toString(16).padStart(4, '0')}${length.toString(16).padStart(4, '0')}`
          if (this.DEBUG) {
            console.log(`发送曲线分包请求[${i + 1}/${packetsCount}]: ${dataCommand}`)
            if (dataParseConfig) {
              console.log(`使用自定义数据解析配置:`, dataParseConfig)
            }
          }

          if (
            PeriodicSerialManager.getStatus().commandLock &&
            !PeriodicSerialManager.getStatus().isProcessingCommand
          ) {
            console.warn(
              `分包请求[${i + 1}/${packetsCount}]前检测到PeriodicSerialManager锁状态异常，尝试重置`,
            )
            PeriodicSerialManager.resetLockState()
            await new Promise((resolve) => setTimeout(resolve, 100))
          }

          const dataResult = await PeriodicSerialManager.sendCommand(dataCommand, dataParseConfig)
          if (this.DEBUG) {
            console.log(`曲线分包[${i + 1}/${packetsCount}]数据结果:`, dataResult ? '成功' : '失败')
          }

          if (dataResult && dataResult.success && Array.isArray(dataResult.data)) {
            const packData = dataResult.data.map((item) => Number(item))
            curveData = curveData.concat(packData)
          } else {
            console.error(`获取曲线分包[${i + 1}/${packetsCount}]数据失败`)
            throw new Error(`分包[${i + 1}/${packetsCount}]数据获取失败`)
          }
        } catch (error) {
          console.error(`处理曲线分包[${i + 1}/${packetsCount}]数据出错:`, error)
          throw error
        }
      }

      if (curveData.length > 0) {
        return {
          num,
          stepTime,
          data: curveData,
        }
      }

      throw new Error('未获取到有效的曲线数据')
    } catch (error) {
      console.error('获取曲线数据失败:', error)
      return null
    } finally {
      try {
        if (wasRunning) {
          if (this.DEBUG) {
            console.log('曲线数据获取完成或发生异常，恢复周期性刷新')
          }
          PeriodicSerialManager.resetLockState()
          await new Promise((resolve) => setTimeout(resolve, 200))
          PeriodicSerialManager.start()
        }
      } catch (restoreError) {
        console.error('恢复周期性刷新状态失败:', restoreError)
        PeriodicSerialManager.resetLockState()
        PeriodicSerialManager.start()
      }
    }
  }

  /**
   * 开始扫描储能状态变化
   * 当合闸操作成功后调用，等待储能状态从0变为1
   */
  public startScanningEnergyStatus(): void {
    if (this.isScanning) {
      return
    }

    this.isScanning = true

    this.energyStatusScanTimeout = setTimeout(() => {
      this.stopScanningEnergyStatus()
      this.notifyProgress('储能状态扫描超时', true)
      this.isFetchingCurve = false
    }, this.ENERGY_STATUS_SCAN_TIMEOUT)

    this.energyStatusScanTimer = setInterval(() => {
      const baseInfo = PeriodicSerialManager.getBaseInfo()
      const currentEnergyState = baseInfo.energyStorageState

      if (this.DEBUG) {
        console.log(`扫描到当前储能状态: ${currentEnergyState}`)
      }

      if (currentEnergyState === '1') {
        this.stopScanningEnergyStatus()
        setTimeout(() => {
          this.fetchEnergyData()
        }, this.SEND_ENERGY_DATA_DELAY)
      }
    }, this.ENERGY_STATUS_SCAN_INTERVAL)
  }

  /**
   * 停止扫描储能状态
   */
  private stopScanningEnergyStatus(): void {
    if (this.energyStatusScanTimer) {
      clearInterval(this.energyStatusScanTimer)
      this.energyStatusScanTimer = null
    }

    if (this.energyStatusScanTimeout) {
      clearTimeout(this.energyStatusScanTimeout)
      this.energyStatusScanTimeout = null
    }

    this.isScanning = false
  }

  /**
   * 评估机械特性正常/异常并获取行程曲线数据
   * @param curveObj 曲线数据对象
   * @condition1 前4项需要检查上下限
   * @condition2 中间3项只检查下限
   * @condition3 最后一项只检查上限
   */
  private async faultMachineCharacter(curveObj: CurveInfo): Promise<void> {
    try {
      const result = await getTeData(curveObj as any)
      if (this.DEBUG) {
        console.log('计算机械特性数据:', result)
      }

      if (result) {
        this.curveInfo.travel = result.travelData

        // 设置数据类型（默认为正常）
        this.curveInfo.dataType = CurveDataType.NORMAL

        const configStore = useConfigStore()
        const characterList = configStore.mechanicalAlarm
        if (this.DEBUG) {
          console.log('机械特性报警配置:', characterList)
        }

        // 机械特性数据准备
        const data = { ...result }
        delete data.travelData

        if (this.DEBUG) {
          console.log('机械特性数据:', data)
        }

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

        const { result: machineCharacter, hasException } = checkMachineCharacter(
          data,
          characterList as MachineCharacterConfig[],
          keyMap,
        )

        if (hasException) {
          this.curveInfo.dataType = CurveDataType.EXCEPTION
        }

        if (this.DEBUG) {
          console.log('机械特性评估结果:', machineCharacter)
        }
        this.curveInfo.faultMachineCharacter = machineCharacter
        this.curveInfo.machineCharacter = data
      }
    } catch (err) {
      console.error('机械特性评估失败:', err)
      uni.showToast({
        title: '机械特性评估失败',
        icon: 'none',
        duration: 3000,
      })
    }
  }

  /**
   * 获取合闸或分闸曲线数据
   * @param type 操作类型 ('opening'|'closing')
   */
  public async fetchBreakerCurveData(type: 'opening' | 'closing'): Promise<void> {
    if (this.isFetchingCurve) {
      return
    }

    this.isFetchingCurve = true
    this.curveInfo = {}

    const add = this.CurveCommandMap[type]

    try {
      if (
        PeriodicSerialManager.getStatus().commandLock &&
        !PeriodicSerialManager.getStatus().isProcessingCommand
      ) {
        console.warn('获取曲线数据前检测到PeriodicSerialManager锁状态异常，尝试重置')
        PeriodicSerialManager.resetLockState()
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      // 获取电流曲线 - 使用有符号数解析
      this.notifyProgress('正在拉取电流数据')
      const coil = await this.getCurveDataWithSignedParsing(add, 0.2)

      if (coil) {
        // 设置动作时间
        const formattedDate = dayjs().format('YYYY-MM-DD HH:mm:ss:SSS')

        // 更新曲线信息
        this.curveInfo.coil = coil
        this.curveInfo.type = type === 'closing' ? 1 : 0
        this.curveInfo.actionTime = formattedDate

        this.curveInfo.energy = { num: 21, stepTime: [], data: [] }

        try {
          this.notifyProgress('正在拉取角度数据')
          const angle = await this.getCurveDataWithSignedParsing(this.CurveCommandMap.angle, 0.2)

          if (this.DEBUG) {
            console.log('角度数据 (有符号数解析):', angle?.data)
          }

          if (angle) {
            this.curveInfo.angle = angle
          }
        } catch (angleError) {
          console.error('获取角度数据失败，但继续进行后续步骤:', angleError)
        }

        try {
          // 计算机械特性和行程曲线
          this.notifyProgress('正在计算行程曲线')
          await this.faultMachineCharacter(this.curveInfo)
        } catch (characterError) {
          console.error('计算机械特性失败，但继续后续步骤:', characterError)
        }
        if (this.DEBUG) {
          console.log('曲线数据收集完成:', this.curveInfo)
        }

        // 分闸时，直接保存数据；合闸时，需要等储能完成后再保存
        if (type === 'opening') {
          try {
            this.notifyProgress('正在保存数据')
            await this.saveData(this.curveInfo)
            this.notifyProgress('分闸曲线拉取完成', true)
          } catch (saveError) {
            console.error('保存分闸曲线数据失败:', saveError)
            this.notifyProgress('保存分闸曲线失败', true)
          } finally {
            this.isFetchingCurve = false
          }
        } else if (type === 'closing') {
          this.notifyProgress('等待储能完成')
          this.startScanningEnergyStatus()
        }
      } else {
        this.isFetchingCurve = false
        uni.showToast({
          title: '无法获取到电流数据',
          icon: 'none',
          duration: 3000,
        })
        this.notifyProgress('获取电流数据失败', true)

        this.ensurePeriodicSerialRunning()
      }
    } catch (error) {
      this.isFetchingCurve = false
      console.error(`获取${type}曲线数据失败:`, error)
      uni.showToast({
        title: `获取${type}曲线数据失败`,
        icon: 'none',
        duration: 3000,
      })
      this.notifyProgress(`获取${type}曲线数据失败`, true)

      this.ensurePeriodicSerialRunning()
    }
  }

  /**
   * 获取储能曲线数据
   */
  public async fetchEnergyData(): Promise<void> {
    try {
      if (
        PeriodicSerialManager.getStatus().commandLock &&
        !PeriodicSerialManager.getStatus().isProcessingCommand
      ) {
        PeriodicSerialManager.resetLockState()
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      this.notifyProgress('正在拉取储能数据')

      const energyData = await this.getCurveDataWithSignedParsing(this.CurveCommandMap.energy, 10)

      if (energyData && this.curveInfo && this.curveInfo.type === DataType.CLOSE) {
        this.curveInfo.energy = energyData
      } else {
        uni.showToast({
          title: '储能数据获取失败',
          icon: 'none',
          duration: 3000,
        })
      }

      if (this.curveInfo) {
        try {
          this.notifyProgress('正在保存数据')
          await this.saveData(this.curveInfo)
          this.notifyProgress('合闸曲线拉取完成', true)
        } catch (saveError) {
          console.error('保存合闸曲线数据失败:', saveError)
          this.notifyProgress('保存合闸曲线失败', true)
        }
      }

      this.isFetchingCurve = false
    } catch (error) {
      console.error('获取储能数据失败:', error)
      uni.showToast({
        title: '储能数据获取异常',
        icon: 'none',
        duration: 3000,
      })

      try {
        if (this.curveInfo) {
          this.notifyProgress('正在保存数据')
          await this.saveData(this.curveInfo)
          this.notifyProgress('合闸曲线拉取完成', true)
        }
      } catch (saveError) {
        console.error('保存合闸曲线数据失败:', saveError)
        this.notifyProgress('保存合闸曲线失败', true)
      } finally {
        this.isFetchingCurve = false
      }
    } finally {
      this.ensurePeriodicSerialRunning()
    }
  }

  /**
   * 保存曲线数据到数据库
   * @param data 曲线数据
   */
  private async saveData(data: CurveInfo): Promise<void> {
    try {
      const result = await TablesManager.saveDataToTable(data, 'data_coil', {
        addTimestamp: true,
        timestampField: 'addTime',
      })
    } catch (err) {
      console.error('保存曲线数据失败:', err)
    }
  }

  /**
   * 请求曲线数据
   * @param operationType 操作类型 ('opening'|'closing')
   */
  public requestCurveData(operationType: 'opening' | 'closing'): void {
    this.fetchBreakerCurveData(operationType)
  }

  /**
   * 定时十秒存储一次温度和局放数据
   */
  public async saveTemperatureAndPartialData(): Promise<void> {
    try {
      const baseInfo = PeriodicSerialManager.getBaseInfo()
      const temperature = {
        mainBusbar: [
          (Number(baseInfo.mainBusbarATemperature) * Ratio.ZeroPointOne).toFixed(2),
          (Number(baseInfo.mainBusbarBTemperature) * Ratio.ZeroPointOne).toFixed(2),
          (Number(baseInfo.mainBusbarCTemperature) * Ratio.ZeroPointOne).toFixed(2),
        ], // 主母线温度
        breakerUpper: [
          (Number(baseInfo.breakerUpperATemperature) * Ratio.ZeroPointOne).toFixed(2),
          (Number(baseInfo.breakerUpperBTemperature) * Ratio.ZeroPointOne).toFixed(2),
          (Number(baseInfo.breakerUpperCTemperature) * Ratio.ZeroPointOne).toFixed(2),
        ], // 上触头温度
        breakerLower: [
          (Number(baseInfo.breakerLowerATemperature) * Ratio.ZeroPointOne).toFixed(2),
          (Number(baseInfo.breakerLowerBTemperature) * Ratio.ZeroPointOne).toFixed(2),
          (Number(baseInfo.breakerLowerCTemperature) * Ratio.ZeroPointOne).toFixed(2),
        ], // 下触头温度
        outletCable: [
          (Number(baseInfo.outletCableATemperature) * Ratio.ZeroPointOne).toFixed(2),
          (Number(baseInfo.outletCableBTemperature) * Ratio.ZeroPointOne).toFixed(2),
          (Number(baseInfo.outletCableCTemperature) * Ratio.ZeroPointOne).toFixed(2),
        ], // 出线电缆温度
      }

      const partial = {
        ultrasonicDischarge: baseInfo.ultrasonicVal, // 超声波局放值
        transientGround: baseInfo.transientGroundWaveVal, // 暂态地波局放值
      }

      const [tempResult, partialResult] = await Promise.all([
        TablesManager.saveDataToTable(temperature, 'temp_curve', {
          addTimestamp: true,
          timestampField: 'addTime',
        }),
        TablesManager.saveDataToTable(partial, 'partial_curve', {
          addTimestamp: true,
          timestampField: 'addTime',
        }),
      ])
    } catch (error) {
      console.error('保存温度和局放数据失败:', error)
    }
  }

  /**
   * 清理所有资源
   */
  public cleanup(): void {
    this.stopScanningEnergyStatus()
    this.isFetchingCurve = false
    this.progressCallback = null
    this.ensurePeriodicSerialRunning()
  }

  /**
   * 确保PeriodicSerialManager正在运行
   * 用于在各种错误情况后恢复系统状态
   */
  private ensurePeriodicSerialRunning(): void {
    try {
      if (!PeriodicSerialManager.getStatus().isRunning) {
        PeriodicSerialManager.resetLockState()
        PeriodicSerialManager.start()
      } else if (
        PeriodicSerialManager.getStatus().commandLock &&
        !PeriodicSerialManager.getStatus().isProcessingCommand
      ) {
        PeriodicSerialManager.resetLockState()
      }
    } catch (error) {
      try {
        PeriodicSerialManager.resetLockState()
        PeriodicSerialManager.start()
      } catch (finalError) {
        console.error('最终尝试恢复PeriodicSerialManager失败', finalError)
      }
    }
  }

  /**
   * 使用有符号数解析
   * @param address 数据地址
   * @param step 时间间隔
   * @returns 曲线数据
   */
  private async getCurveDataWithSignedParsing(
    address: number,
    step: number,
  ): Promise<CurveData | null> {
    const ModbusManagerClass = Object.getPrototypeOf(ModbusManager).constructor
    const signedConfig = ModbusManagerClass.createSignedDataParseConfig()

    return this.getData(address, step, signedConfig)
  }
}

export default CurveManager.getInstance()
