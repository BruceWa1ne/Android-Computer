/* eslint-disable @typescript-eslint/ban-types */
// #ifdef APP-PLUS
const androidMemoryModules = uni.requireNativePlugin('ZYC-Plugins-Memory')
// #endif

/**
 * 系统状态管理
 * 记录系统内存状态和运行时长
 */
class SystemStatusManager {
  private static instance: SystemStatusManager
  private timer: number | null = null
  private startTime: number = Date.now()
  private currentTime: number = Date.now()
  private readonly UPDATE_INTERVAL = 1000
  private readonly DEBUG = JSON.parse(import.meta.env.VITE_APP_MEMORY_DEBUG)
  private lastGCTime: number = 0
  private readonly GC_INTERVAL = 30000
  private lastMemoryWarningTime: number = 0
  private readonly MEMORY_WARNING_THRESHOLD = 75
  private readonly MEMORY_WARNING_COOLDOWN = 60000

  private memoryInfo = {
    usedMemoryBytes: 0,
    usedMemoryFormatted: '0',
    availableMemoryBytes: 0,
    availableMemoryFormatted: '0',
    totalMemoryBytes: 0,
    totalMemoryFormatted: '0',
    lowMemory: false,
    app: {
      pssTotalBytes: 0,
      pssTotalFormatted: '0',
    },
  }

  private cpuInfo = {
    avgCpuUsageFormatted: '0%',
    avgCpuUsage: 0,
    cpuCores: 0,
    cpuUsage: 0,
    cpuUsageFormatted: '0%',
  }

  private constructor() {
    this.startMonitoring()
  }

  public static getInstance(): SystemStatusManager {
    if (!SystemStatusManager.instance) {
      SystemStatusManager.instance = new SystemStatusManager()
    }
    return SystemStatusManager.instance
  }

  public startMonitoring(): void {
    if (this.timer !== null) {
      return
    }

    this.updateMemoryInfo()
    this.updateCurrentTime()

    this.timer = setInterval(() => {
      this.updateMemoryInfo()
      this.updateCurrentTime()
      this.checkMemoryUsage()
    }, this.UPDATE_INTERVAL)

    if (this.DEBUG) {
      console.log('系统状态监控已启动')
    }
  }

  public stopMonitoring(): void {
    if (this.timer !== null) {
      clearInterval(this.timer)
      this.timer = null

      if (this.DEBUG) {
        console.log('系统状态监控已停止')
      }
    }
  }

  /**
   * 手动触发垃圾回收
   */
  public forceGarbageCollection(): boolean {
    const now = Date.now()
    if (now - this.lastGCTime < 5000) {
      return false
    }

    this.lastGCTime = now
    let didRunGC = false

    // #ifdef APP-PLUS
    try {
      if (typeof plus !== 'undefined' && plus.os.name.toLowerCase() === 'android') {
        try {
          // 通用内存释放策略

          // 1. 设置低内存标志，提示系统进行内存回收
          if (plus.android && plus.android.invoke) {
            const activityInstance = plus.android.runtimeMainActivity()
            if (activityInstance) {
              plus.android.invoke(activityInstance, 'onTrimMemory', 80)
              if (this.DEBUG) {
                console.log('已触发 onTrimMemory 事件')
              }
            }
          }

          // 2. 请求系统GC
          if (plus.android && plus.android.importClass) {
            plus.android.importClass('java.lang.System')
            plus.android.invoke('java.lang.System', 'gc')
            plus.android.invoke('java.lang.System', 'runFinalization')
            didRunGC = true

            if (this.DEBUG) {
              console.log('已请求系统执行GC和Finalization')
            }
          }
        } catch (androidError) {
          console.error('Android内存释放操作失败', androidError)
        }
      }
    } catch (e) {
      console.error('内存释放执行失败', e)
    }
    // #endif

    this.updateMemoryInfo()

    return didRunGC
  }

  /**
   * 检查内存使用情况
   */
  private checkMemoryUsage(): void {
    if (!this.memoryInfo.totalMemoryBytes) return

    const now = Date.now()

    if (now - this.lastGCTime > this.GC_INTERVAL) {
      this.forceGarbageCollection()
    }

    const usagePercentage =
      (this.memoryInfo.app.pssTotalBytes / this.memoryInfo.totalMemoryBytes) * 100

    if (
      usagePercentage > this.MEMORY_WARNING_THRESHOLD &&
      now - this.lastMemoryWarningTime > this.MEMORY_WARNING_COOLDOWN
    ) {
      this.lastMemoryWarningTime = now
      this.forceGarbageCollection()

      uni.$emit('systemMemoryWarning', {
        usagePercentage,
        memoryInfo: this.memoryInfo,
      })

      if (this.DEBUG) {
        console.warn(`应用内存使用率过高: ${usagePercentage.toFixed(2)}%，已触发GC`)
      }
    }
  }

  private updateMemoryInfo(): void {
    // #ifdef APP-PLUS
    androidMemoryModules.getMemoryInfo((result) => {
      // 确保appPssTotalKB是数字类型，并转换为字节
      const appPssTotalKB = parseInt(result.appPssTotalKB) || 0
      const appPssTotalBytes = appPssTotalKB * 1024

      this.memoryInfo = {
        usedMemoryBytes: result.usedMemoryBytes,
        usedMemoryFormatted: result.usedMemory,
        availableMemoryBytes: result.availableMemoryBytes || 0,
        availableMemoryFormatted: result.availableMemory,
        totalMemoryBytes: result.totalMemoryBytes || 0,
        totalMemoryFormatted: result.totalMemory,
        lowMemory: result.availableMemoryBytes < result.totalMemoryBytes * 0.2 || false,
        app: {
          pssTotalBytes: appPssTotalBytes,
          pssTotalFormatted: result.appPssTotal,
        },
      }

      uni.$emit('systemMemoryUpdated', this.memoryInfo)

      if (this.DEBUG) {
        console.log('内存信息已更新:', this.memoryInfo)
        console.log('PSS内存:', appPssTotalKB, 'KB =', appPssTotalBytes, 'bytes')
        console.log(
          '内存使用率:',
          ((appPssTotalBytes / result.totalMemoryBytes) * 100).toFixed(2),
          '%',
        )
      }
    })
    androidMemoryModules.getCpuUsage((result) => {
      this.cpuInfo = {
        avgCpuUsageFormatted: result.avgCpuUsageFormatted,
        avgCpuUsage: result.avgCpuUsage,
        cpuCores: result.cpuCores,
        cpuUsage: result.cpuUsage,
        cpuUsageFormatted: result.cpuUsageFormatted,
      }

      uni.$emit('systemCpuUpdated', this.cpuInfo)

      if (this.DEBUG) {
        console.log('CPU信息已更新:', this.cpuInfo)
      }
    })
    // #endif
  }

  private updateCurrentTime(): void {
    this.currentTime = Date.now()

    uni.$emit('systemRuntimeUpdated', {
      startTime: this.startTime,
      currentTime: this.currentTime,
      runtime: this.currentTime - this.startTime,
    })
  }

  public getMemoryInfo() {
    return { ...this.memoryInfo }
  }

  public getCpuInfo() {
    return { ...this.cpuInfo }
  }

  public getRuntimeInfo() {
    return {
      startTime: this.startTime,
      currentTime: this.currentTime,
      runtime: this.currentTime - this.startTime,
    }
  }

  public getFormattedRuntime(): string {
    const totalSeconds = Math.floor((this.currentTime - this.startTime) / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  public resetRuntime(): void {
    this.startTime = Date.now()
    this.currentTime = this.startTime

    if (this.DEBUG) {
      console.log('系统运行时间已重置')
    }
  }

  public cleanup(): void {
    this.stopMonitoring()
    this.forceGarbageCollection()

    if (this.DEBUG) {
      console.log('系统状态管理器已清理')
    }
  }
}

export default SystemStatusManager.getInstance()
