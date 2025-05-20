/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable no-useless-constructor */
import type { SerialPortConfig } from '@/types/serial'
// #ifdef APP-PLUS
const Uart = uni.requireNativePlugin('XM-Serial')
// #endif

/**
 * 串口管理器
 * 负责基本的串口通信，不包含具体协议实现
 */
class SerialManager {
  private static instance: SerialManager
  private readonly DEBUG = JSON.parse(import.meta.env.VITE_APP_SERIAL_DEBUG) // 是否开启调试日志

  private constructor() {}

  public static getInstance(): SerialManager {
    if (!SerialManager.instance) {
      SerialManager.instance = new SerialManager()
    }
    return SerialManager.instance
  }

  /**
   * 打开串口
   * @param config 串口配置
   * @param callback 接收数据的回调函数
   * @returns 打开结果
   */
  public openSerial(config: SerialPortConfig, callback: (result: { data: string }) => void): any {
    // #ifdef APP-PLUS
    try {
      const res = Uart.openSerial(config, (result) => {
        callback(result)
      })

      if (this.DEBUG) {
        console.log(`串口 ${config.port} 已打开，配置:`, config)
      }

      return res
    } catch (error) {
      console.error('打开串口失败:', error)
      return { errMsg: '打开串口失败' }
    }
    // #endif
  }

  /**
   * 关闭串口
   * @param port 串口名
   * @returns 关闭结果
   */
  public closeSerial(port: string): any {
    // #ifdef APP-PLUS
    try {
      const res = Uart.closeSerial(port)

      if (this.DEBUG) {
        console.log(`串口 ${port} 已关闭`)
      }

      return res
    } catch (error) {
      console.error('关闭串口失败:', error)
      return { errMsg: '关闭串口失败' }
    }
    // #endif
  }

  /**
   * 发送数据到串口
   * @param port 串口名
   * @param data 要发送的数据(十六进制字符串)
   * @returns 是否发送成功
   */
  public sendData(port: string, data: string): boolean {
    if (this.DEBUG) {
      console.log(`发送数据到串口 ${port}: ${data}`)
    }

    // #ifdef APP-PLUS
    try {
      Uart.sendSerial(port, data)
      return true
    } catch (error) {
      console.error('发送数据失败:', error)
      return false
    }
    // #endif
  }
}

export default SerialManager.getInstance()
