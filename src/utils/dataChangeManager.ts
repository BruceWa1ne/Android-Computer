/* eslint-disable @typescript-eslint/ban-types */
import type { BaseInfo } from '@/types/base-info'
import PeriodicSerialManager from '@/utils/periodicSerial'

/**
 * 数据变化的观察者接口
 */
export interface DataChangeObserver {
  /**
   * 当被观察的数据项发生变化时调用
   * @param key 发生变化的数据项名称
   */
  onChange: (newValue: string | null, oldValue: string | null, key: keyof BaseInfo) => void
}

/**
 * 数据变化观察配置
 */
export interface WatchConfig {
  /**
   * 是否立即触发回调
   */
  immediate?: boolean
}

/**
 * 数据变化监听管理器
 */
class DataChangeManager {
  private static instance: DataChangeManager
  private readonly DEBUG: boolean = JSON.parse(import.meta.env.VITE_APP_CURVE_DEBUG || 'false')

  private lastBaseInfo: BaseInfo = {} as BaseInfo

  private observers: Map<keyof BaseInfo, DataChangeObserver[]> = new Map()

  private combinedObservers: Map<
    string,
    {
      keys: Array<keyof BaseInfo>
      observer: DataChangeObserver
    }
  > = new Map()

  private isListening: boolean = false

  public static getInstance(): DataChangeManager {
    if (!DataChangeManager.instance) {
      DataChangeManager.instance = new DataChangeManager()
    }
    return DataChangeManager.instance
  }

  /**
   * 开始监听数据变化
   */
  public startListening(): void {
    if (this.isListening) return

    this.lastBaseInfo = PeriodicSerialManager.getBaseInfo()

    uni.$on('baseInfoUpdated', this.handleBaseInfoUpdated.bind(this))

    this.isListening = true

    if (this.DEBUG) {
      console.log('数据变化监听管理器已启动')
    }
  }

  /**
   * 停止监听数据变化
   */
  public stopListening(): void {
    if (!this.isListening) return

    uni.$off('baseInfoUpdated', this.handleBaseInfoUpdated)

    this.isListening = false

    if (this.DEBUG) {
      console.log('数据变化监听管理器已停止')
    }
  }

  /**
   * 判断是否已经开始监听
   * @returns 是否已经开始监听
   */
  public isListeningStarted(): boolean {
    return this.isListening
  }

  /**
   * 处理基础信息更新事件
   * @param newBaseInfo 新的基础信息
   */
  private handleBaseInfoUpdated(newBaseInfo: BaseInfo): void {
    this.detectChanges(newBaseInfo)

    this.lastBaseInfo = { ...newBaseInfo }
  }

  /**
   * 检测数据变化并通知观察者
   * @param newBaseInfo 新的基础信息
   */
  private detectChanges(newBaseInfo: BaseInfo): void {
    this.observers.forEach((observers, key) => {
      const newValue = newBaseInfo[key]
      const oldValue = this.lastBaseInfo[key]

      if (newValue !== oldValue) {
        observers.forEach((observer) => {
          try {
            observer.onChange(newValue, oldValue, key)
          } catch (error) {
            if (this.DEBUG) {
              console.error(`观察者回调执行失败: ${key}`, error)
            }
          }
        })
      }
    })

    this.combinedObservers.forEach((config, id) => {
      const { keys, observer } = config

      const changedKey = keys.find((key) => newBaseInfo[key] !== this.lastBaseInfo[key])

      if (changedKey) {
        try {
          observer.onChange(newBaseInfo[changedKey], this.lastBaseInfo[changedKey], changedKey)
        } catch (error) {
          if (this.DEBUG) {
            console.error(`组合观察者回调执行失败: ${id}`, error)
          }
        }
      }
    })
  }

  /**
   * 添加单个数据项的观察者
   * @param key 要观察的数据项
   * @param observer 观察者
   * @param config 配置
   * @returns 是否成功添加
   */
  public watch(
    key: keyof BaseInfo,
    observer: DataChangeObserver,
    config: WatchConfig = {},
  ): boolean {
    if (!key) {
      if (this.DEBUG) {
        console.error('无效的观察键')
      }
      return false
    }

    if (!observer || typeof observer.onChange !== 'function') {
      if (this.DEBUG) {
        console.error('无效的观察者对象')
      }
      return false
    }

    if (!this.observers.has(key)) {
      this.observers.set(key, [])
    }

    const observers = this.observers.get(key)!
    observers.push(observer)

    if (config.immediate) {
      const currentValue = PeriodicSerialManager.getBaseInfo()[key]
      try {
        observer.onChange(currentValue, null, key)
      } catch (error) {
        if (this.DEBUG) {
          console.error(`立即回调执行失败: ${key}`, error)
        }
      }
    }

    if (this.DEBUG) {
      console.log(`已添加对 ${String(key)} 的观察`)
    }

    return true
  }

  /**
   * 添加多个数据项的组合观察者
   * @param keys 要观察的数据项数组
   * @param observer 观察者
   * @param config 配置
   * @returns 唯一标识符，用于后续移除观察
   */
  public watchMultiple(
    keys: Array<keyof BaseInfo>,
    observer: DataChangeObserver,
    config: WatchConfig = {},
  ): string {
    if (!Array.isArray(keys) || keys.length === 0) {
      if (this.DEBUG) {
        console.error('无效的观察键数组')
      }
      return ''
    }

    if (!observer || typeof observer.onChange !== 'function') {
      if (this.DEBUG) {
        console.error('无效的观察者对象')
      }
      return ''
    }

    const id = `combined_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    this.combinedObservers.set(id, { keys, observer })

    if (config.immediate && keys.length > 0) {
      const firstKey = keys[0]
      const currentValue = PeriodicSerialManager.getBaseInfo()[firstKey]
      try {
        observer.onChange(currentValue, null, firstKey)
      } catch (error) {
        if (this.DEBUG) {
          console.error(`立即回调执行失败: ${firstKey}`, error)
        }
      }
    }

    if (this.DEBUG) {
      console.log(`已添加对 ${keys.join(', ')} 的组合观察，ID: ${id}`)
    }

    return id
  }

  /**
   * 移除单个数据项的观察者
   * @param key 观察的数据项
   * @param observer 要移除的观察者，如果不提供则移除该数据项的所有观察者
   * @returns 是否成功移除
   */
  public unwatch(key: keyof BaseInfo, observer?: DataChangeObserver): boolean {
    if (!this.observers.has(key)) {
      return false
    }

    if (!observer) {
      this.observers.delete(key)
      if (this.DEBUG) {
        console.log(`已移除 ${String(key)} 的所有观察者`)
      }
      return true
    }

    const observers = this.observers.get(key)!
    const index = observers.indexOf(observer)

    if (index !== -1) {
      observers.splice(index, 1)

      if (observers.length === 0) {
        this.observers.delete(key)
      }

      if (this.DEBUG) {
        console.log(`已移除 ${String(key)} 的特定观察者`)
      }

      return true
    }

    return false
  }

  /**
   * 移除组合观察者
   * @param id 添加组合观察者时返回的ID
   * @returns 是否成功移除
   */
  public unwatchMultiple(id: string): boolean {
    if (!id || !this.combinedObservers.has(id)) {
      return false
    }

    this.combinedObservers.delete(id)

    if (this.DEBUG) {
      console.log(`已移除ID为 ${id} 的组合观察者`)
    }

    return true
  }

  /**
   * 获取当前观察者数量
   */
  public getObserverCount(): {
    single: number
    combined: number
    total: number
  } {
    let singleCount = 0
    this.observers.forEach((observers) => {
      singleCount += observers.length
    })

    const combinedCount = this.combinedObservers.size

    return {
      single: singleCount,
      combined: combinedCount,
      total: singleCount + combinedCount,
    }
  }

  /**
   * 清理所有资源
   * 在应用退出或页面卸载时调用，防止内存泄漏
   */
  public cleanup(): void {
    this.stopListening()

    this.observers.clear()
    this.combinedObservers.clear()

    if (this.DEBUG) {
      console.log('数据变化监听管理器已清理')
    }
  }
}

export default DataChangeManager.getInstance()
