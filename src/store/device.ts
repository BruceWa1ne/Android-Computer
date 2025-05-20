import { defineStore } from 'pinia'
import type { SerialStatus, PeriodicSerialStatus } from '@/types/serial'
import type { MemoryStatus } from '@/types/memory-info'

export const useDeviceStore = defineStore('device', {
  state: () => ({
    // 串口状态
    serialStatus: {
      isOpen: false,
      config: null,
      transactionsCount: 0,
      lastActivity: 0,
    } as SerialStatus,

    // 内存状态
    memoryStatus: {
      usedMemoryBytes: 0,
      availableMemoryBytes: 0,
      totalMemoryBytes: 0,
      usedMemoryFormatted: '0KB',
      availableMemoryFormatted: '0KB',
      totalMemoryFormatted: '0KB',
      lowMemory: false,
      app: {
        pssTotalBytes: 0,
        pssTotalFormatted: '0KB',
      },
      timestamp: 0,
    } as MemoryStatus,

    // 周期性串口状态
    periodicSerialStatus: {
      isRunning: false,
      queueLength: 0,
      isProcessingCommand: false,
      commandLock: false,
      timeSinceLastCommand: 0,
    } as PeriodicSerialStatus,
  }),

  getters: {
    // 串口是否打开
    isSerialOpen: (state) => state.serialStatus.isOpen,

    // 周期性串口是否运行中
    isPeriodicSerialRunning: (state) => state.periodicSerialStatus.isRunning,

    // 内存使用率
    memoryUsagePercentage: (state) => {
      if (state.memoryStatus.totalMemoryBytes === 0) return 0
      // 限制最大值为100%，防止异常数据
      return Math.min(
        100,
        Math.round(
          (state.memoryStatus.app.pssTotalBytes / state.memoryStatus.totalMemoryBytes) * 100,
        ),
      )
    },
  },

  actions: {
    // 更新串口状态
    updateSerialStatus(status: SerialStatus) {
      this.serialStatus = status
    },

    // 更新内存状态
    updateMemoryStatus(status: MemoryStatus) {
      this.memoryStatus = status
    },

    // 更新周期性串口状态
    updatePeriodicSerialStatus(status: PeriodicSerialStatus) {
      this.periodicSerialStatus = status
    },
  },

  // 持久化配置
  persist: {
    key: 'device-status',
    paths: ['serialStatus.isOpen', 'serialStatus.config'],
  },
})
