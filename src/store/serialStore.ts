import { defineStore } from 'pinia'
import PeriodicSerialManager from '@/utils/periodicSerial'
import Frame68Manager from '@/utils/frame68Manager'
import ModbusManager from '@/utils/modbusManager'
import VoiceManager from '@/utils/voiceManager'
import type { MemoryInfo } from '@/types/memory-info'
import type { SerialPortConfig } from '@/types/serial'
export const useSerialStore = defineStore('serial', {
  state: () => ({
    // 串口状态
    isModbusSerialOpen: false,
    is68FrameSerialOpen: false,
    modbusConfig: null as SerialPortConfig | null,
    frameConfig: null as SerialPortConfig | null,

    // 周期性刷新状态
    isPeriodicRefreshRunning: false,

    // 内存占用信息
    memoryInfo: {
      usedMemory: '0',
      availableMemory: '0',
      totalMemory: '0',
      lowMemory: false,
      pssTotalFormatted: '0',
      raw: {
        usedMemoryBytes: 0,
        availableMemoryBytes: 0,
        totalMemoryBytes: 0,
        lowMemory: false,
        pssTotalBytes: 0,
      },
    } as MemoryInfo,

    // CPU使用信息
    cpuInfo: {
      avgCpuUsageFormatted: '0%',
      avgCpuUsage: 0,
      cpuCores: 0,
      cpuUsage: 0,
      cpuUsageFormatted: '0%',
    },

    // 上次更新时间
    lastUpdateTime: 0,
  }),

  getters: {
    /**
     * 获取串口状态
     */
    serialStatus: (state) => {
      return {
        isModbusOpen: state.isModbusSerialOpen,
        is68FrameOpen: state.is68FrameSerialOpen,
        modbusConfig: state.modbusConfig,
        frameConfig: state.frameConfig,
      }
    },

    /**
     * 获取周期性刷新状态
     */
    periodicStatus: (state) => {
      return {
        isRunning: state.isPeriodicRefreshRunning,
      }
    },

    /**
     * 获取内存使用百分比
     */
    memoryUsagePercentage: (state) => {
      if (state.memoryInfo.raw.totalMemoryBytes === 0) return 0
      return Math.round(
        (state.memoryInfo.raw.usedMemoryBytes / state.memoryInfo.raw.totalMemoryBytes) * 100,
      )
    },

    /**
     * 获取应用内存使用百分比
     */
    appMemoryUsagePercentage: (state) => {
      if (state.memoryInfo.raw.totalMemoryBytes === 0) return 0
      // 限制最大值为100%，防止异常数据
      return Math.min(
        100,
        Math.round(
          (state.memoryInfo.raw.pssTotalBytes / state.memoryInfo.raw.totalMemoryBytes) * 100,
        ),
      )
    },
  },

  actions: {
    openModbusSerial(config: SerialPortConfig) {
      try {
        ModbusManager.openModbusSerial(config)
        this.isModbusSerialOpen = true
        this.modbusConfig = config
        return true
      } catch (error) {
        console.error('打开Modbus串口失败:', error)
        return false
      }
    },

    open68FrameSerial(config: SerialPortConfig) {
      try {
        Frame68Manager.open68FrameSerial(config)
        this.is68FrameSerialOpen = true
        this.frameConfig = config

        return true
      } catch (error) {
        console.error('打开68帧串口失败:', error)
        return false
      }
    },

    close68FrameSerial() {
      try {
        Frame68Manager.close68FrameSerial()
        this.is68FrameSerialOpen = false
        this.frameConfig = null

        VoiceManager.destroy()

        return true
      } catch (error) {
        console.error('关闭68帧串口失败:', error)
        return false
      }
    },

    closeModbusSerial() {
      try {
        ModbusManager.closeModbusSerial()
        this.isModbusSerialOpen = false
        this.modbusConfig = null
        return true
      } catch (error) {
        console.error('关闭Modbus串口失败:', error)
        return false
      }
    },

    startPeriodicRefresh() {
      if (!this.isModbusSerialOpen) {
        console.error('Modbus串口未打开，无法启动周期性刷新')
        return false
      }

      const result = PeriodicSerialManager.start()
      this.isPeriodicRefreshRunning = result
      return result
    },

    stopPeriodicRefresh() {
      const result = PeriodicSerialManager.stop()
      this.isPeriodicRefreshRunning = !result
      return result
    },

    updateMemoryInfo(memory: {
      usedMemoryBytes: number
      availableMemoryBytes: number
      totalMemoryBytes: number
      usedMemoryFormatted: string
      availableMemoryFormatted: string
      totalMemoryFormatted: string
      lowMemory: boolean
      app: {
        pssTotalBytes: number
        pssTotalFormatted: string
      }
    }) {
      this.memoryInfo = {
        usedMemory: memory.usedMemoryFormatted,
        availableMemory: memory.availableMemoryFormatted,
        totalMemory: memory.totalMemoryFormatted,
        lowMemory: memory.lowMemory,
        pssTotalFormatted: memory.app.pssTotalFormatted,
        raw: {
          usedMemoryBytes: memory.usedMemoryBytes,
          availableMemoryBytes: memory.availableMemoryBytes,
          totalMemoryBytes: memory.totalMemoryBytes,
          lowMemory: memory.lowMemory,
          pssTotalBytes: memory.app.pssTotalBytes,
        },
      }

      this.lastUpdateTime = Date.now()
    },

    updateCpuInfo(cpu: {
      avgCpuUsageFormatted: string
      avgCpuUsage: number
      cpuCores: number
      cpuUsage: number
      cpuUsageFormatted: string
    }) {
      this.cpuInfo = {
        avgCpuUsageFormatted: cpu.avgCpuUsageFormatted,
        avgCpuUsage: cpu.avgCpuUsage,
        cpuCores: cpu.cpuCores,
        cpuUsage: cpu.cpuUsage,
        cpuUsageFormatted: cpu.cpuUsageFormatted,
      }

      this.lastUpdateTime = Date.now()
    },

    getPeriodicManagerStatus() {
      return PeriodicSerialManager.getStatus()
    },
  },
})
