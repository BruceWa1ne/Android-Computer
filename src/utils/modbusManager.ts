/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable no-useless-constructor */
import type { SerialPortConfig } from '@/types/serial'
import SerialManager from './serial'

export enum ModbusFunctionCode {
  READ_HOLDING_REGISTERS = 0x03,
  WRITE_SINGLE_REGISTER = 0x06,
}

/**
 * 数据解析配置接口
 */
export interface DataParseConfig {
  /**
   * 是否将数据解析为有符号整数
   */
  parseAsSigned: boolean

  /**
   * 特定数据索引范围配置
   */
  dataRanges?: {
    start: number
    end: number
    parseAsSigned: boolean
  }[]
}

// 响应回调函数类型
interface ResponseCallback {
  (data: { data: string | number[]; success: boolean }, error?: string): void
}

// 事务信息接口
interface TransactionInfo {
  callback: ResponseCallback
  timeoutId: number
  functionCode: number
  slaveAddress: number
  transactionId: number
  timestamp: number
  dataParseConfig?: Partial<DataParseConfig> // 数据解析配置
}

/**
 * Modbus协议管理器
 * 负责Modbus协议的发送和接收处理
 */
class ModbusManager {
  private static instance: ModbusManager
  private buffer: string = '' // 用于拼接接收到的数据
  private lastReceiveTime: number = 0 // 用于记录上次接收数据的时间
  private transactions: Map<string, TransactionInfo> = new Map() // 存储事务ID对应的回调和超时信息
  private modbusConfig: SerialPortConfig | null = null
  private MAX_BUFFER: number = 2100 // 最大缓冲区长度
  private transactionCounter: number = 0 // 事务ID计数器
  private readonly TRANSACTION_TIMEOUT = 5000 // 事务超时时间，单位毫秒
  private readonly DEBUG = JSON.parse(import.meta.env.VITE_APP_SERIAL_DEBUG) // 是否开启调试日志

  // 默认数据解析配置
  private dataParseConfig: DataParseConfig = {
    parseAsSigned: false,
  }

  // CRC16查找表
  private static readonly CRC16_TABLE: number[] = [
    0x0000, 0xc0c1, 0xc181, 0x0140, 0xc301, 0x03c0, 0x0280, 0xc241, 0xc601, 0x06c0, 0x0780, 0xc741,
    0x0500, 0xc5c1, 0xc481, 0x0440, 0xcc01, 0x0cc0, 0x0d80, 0xcd41, 0x0f00, 0xcfc1, 0xce81, 0x0e40,
    0x0a00, 0xcac1, 0xcb81, 0x0b40, 0xc901, 0x09c0, 0x0880, 0xc841, 0xd801, 0x18c0, 0x1980, 0xd941,
    0x1b00, 0xdbc1, 0xda81, 0x1a40, 0x1e00, 0xdec1, 0xdf81, 0x1f40, 0xdd01, 0x1dc0, 0x1c80, 0xdc41,
    0x1400, 0xd4c1, 0xd581, 0x1540, 0xd701, 0x17c0, 0x1680, 0xd641, 0xd201, 0x12c0, 0x1380, 0xd341,
    0x1100, 0xd1c1, 0xd081, 0x1040, 0xf001, 0x30c0, 0x3180, 0xf141, 0x3300, 0xf3c1, 0xf281, 0x3240,
    0x3600, 0xf6c1, 0xf781, 0x3740, 0xf501, 0x35c0, 0x3480, 0xf441, 0x3c00, 0xfcc1, 0xfd81, 0x3d40,
    0xff01, 0x3fc0, 0x3e80, 0xfe41, 0xfa01, 0x3ac0, 0x3b80, 0xfb41, 0x3900, 0xf9c1, 0xf881, 0x3840,
    0x2800, 0xe8c1, 0xe981, 0x2940, 0xeb01, 0x2bc0, 0x2a80, 0xea41, 0xee01, 0x2ec0, 0x2f80, 0xef41,
    0x2d00, 0xedc1, 0xec81, 0x2c40, 0xe401, 0x24c0, 0x2580, 0xe541, 0x2700, 0xe7c1, 0xe681, 0x2640,
    0x2200, 0xe2c1, 0xe381, 0x2340, 0xe101, 0x21c0, 0x2080, 0xe041, 0xa001, 0x60c0, 0x6180, 0xa141,
    0x6300, 0xa3c1, 0xa281, 0x6240, 0x6600, 0xa6c1, 0xa781, 0x6740, 0xa501, 0x65c0, 0x6480, 0xa441,
    0x6c00, 0xacc1, 0xad81, 0x6d40, 0xaf01, 0x6fc0, 0x6e80, 0xae41, 0xaa01, 0x6ac0, 0x6b80, 0xab41,
    0x6900, 0xa9c1, 0xa881, 0x6840, 0x7800, 0xb8c1, 0xb981, 0x7940, 0xbb01, 0x7bc0, 0x7a80, 0xba41,
    0xbe01, 0x7ec0, 0x7f80, 0xbf41, 0x7d00, 0xbdc1, 0xbc81, 0x7c40, 0xb401, 0x74c0, 0x7580, 0xb541,
    0x7700, 0xb7c1, 0xb681, 0x7640, 0x7200, 0xb2c1, 0xb381, 0x7340, 0xb101, 0x71c0, 0x7080, 0xb041,
    0x5000, 0x90c1, 0x9181, 0x5140, 0x9301, 0x53c0, 0x5280, 0x9241, 0x9601, 0x56c0, 0x5780, 0x9741,
    0x5500, 0x95c1, 0x9481, 0x5440, 0x9c01, 0x5cc0, 0x5d80, 0x9d41, 0x5f00, 0x9fc1, 0x9e81, 0x5e40,
    0x5a00, 0x9ac1, 0x9b81, 0x5b40, 0x9901, 0x59c0, 0x5880, 0x9841, 0x8801, 0x48c0, 0x4980, 0x8941,
    0x4b00, 0x8bc1, 0x8a81, 0x4a40, 0x4e00, 0x8ec1, 0x8f81, 0x4f40, 0x8d01, 0x4dc0, 0x4c80, 0x8c41,
    0x4400, 0x84c1, 0x8581, 0x4540, 0x8701, 0x47c0, 0x4680, 0x8641, 0x8201, 0x42c0, 0x4380, 0x8341,
    0x4100, 0x81c1, 0x8081, 0x4040,
  ]

  private constructor() {}

  public static getInstance(): ModbusManager {
    if (!ModbusManager.instance) {
      ModbusManager.instance = new ModbusManager()
    }
    return ModbusManager.instance
  }

  /**
   * 打开Modbus串口
   * @param config 串口配置
   */
  public openModbusSerial(config: SerialPortConfig) {
    this.modbusConfig = config

    const res = SerialManager.openSerial(config, (result) => {
      const msg = JSON.parse(JSON.stringify(result))
      const data = msg.data
      const currentTime = Date.now()

      if (this.DEBUG) {
        console.log(
          `接收数据: ${data}, 长度: ${data.length}, 是否超时: ${currentTime - this.lastReceiveTime > 200}`,
        )
      }

      // 如果超过200ms没有接收到数据，则认为是新的数据包
      if (currentTime - this.lastReceiveTime > 200) {
        this.buffer = ''
      }

      this.buffer += data
      this.lastReceiveTime = currentTime
      this.processBuffer()
    })

    uni.showToast({
      title: res.errMsg,
      icon: 'none',
    })
  }

  /**
   * 关闭Modbus串口
   */
  public closeModbusSerial() {
    if (!this.modbusConfig) return

    const res = SerialManager.closeSerial(this.modbusConfig.port)
    this.clearAllTransactions()
    this.buffer = ''
    this.lastReceiveTime = 0
    this.transactionCounter = 0
    this.modbusConfig = null

    if (this.DEBUG) {
      console.log('Modbus串口已关闭，所有状态已重置', res)
    }
  }

  /**
   * 检查Modbus串口是否已打开
   */
  public isModbusOpen(): boolean {
    return this.modbusConfig !== null
  }

  /**
   * 发送Modbus命令
   * @param command 命令数据
   * @param callback 回调函数
   * @param dataParseConfig 数据解析配置(可选)，用于指定如何解析接收到的数据
   * @returns Promise对象
   */
  public send(
    command: string,
    callback?: ResponseCallback,
    dataParseConfig?: Partial<DataParseConfig>,
  ): Promise<{ data: string | number[]; success: boolean }> {
    return new Promise((resolve, reject) => {
      if (!this.isModbusOpen()) {
        if (callback) {
          callback({ data: '', success: false }, 'Modbus串口未打开')
        }
        return reject('Modbus串口未打开')
      }

      // 生成事务ID (1-255)
      const transactionId = (this.transactionCounter + 1) % 256
      this.transactionCounter = transactionId

      const slaveAddress = parseInt(command.substr(0, 2), 16)
      const functionCode = parseInt(command.substr(2, 2), 16)

      const internalTransactionId = this.generateInternalTransactionId(transactionId)

      // 临时保存数据解析配置，与事务关联
      let tempDataParseConfig: Partial<DataParseConfig> | undefined
      if (dataParseConfig) {
        tempDataParseConfig = { ...dataParseConfig }
      }

      const promiseCallback: ResponseCallback = (data, error) => {
        if (error) {
          if (callback) {
            callback({ data: '', success: false }, error)
          }
          reject(error)
        } else {
          if (callback) {
            callback(data, null)
          }
          resolve(data)
        }
      }

      // 设置超时计时器
      const timeoutId = setTimeout(() => {
        this.handleTimeout(internalTransactionId)
      }, this.TRANSACTION_TIMEOUT)

      // 存储事务信息
      this.transactions.set(internalTransactionId, {
        callback: promiseCallback,
        timeoutId,
        functionCode,
        slaveAddress,
        transactionId,
        timestamp: Date.now(),
        dataParseConfig: tempDataParseConfig, // 将解析配置与事务关联
      })

      const crc = this.calculateCRC16(command)
      const dataWithCRC = command + crc.low + crc.high

      if (this.DEBUG) {
        console.log(
          `发送命令: ${dataWithCRC}, 事务ID: ${transactionId}, 从站地址: ${slaveAddress}, 功能码: ${functionCode}`,
        )
      }

      // 使用SerialManager发送数据
      if (this.modbusConfig) {
        SerialManager.sendData(this.modbusConfig.port, dataWithCRC)
      }
    })
  }

  /** 清理所有事务 */
  private clearAllTransactions() {
    this.transactions.forEach((transaction) => {
      clearTimeout(transaction.timeoutId)
    })

    this.transactions.clear()
    this.transactions = new Map()

    if (this.DEBUG) {
      console.log('所有事务已清理')
    }
  }

  /** 生成内部事务 ID */
  private generateInternalTransactionId(transactionId: number): string {
    return `tx_${transactionId}_${Date.now()}`
  }

  /** 处理事务超时 */
  private handleTimeout(internalTransactionId: string) {
    const transaction = this.transactions.get(internalTransactionId)
    if (transaction) {
      if (this.DEBUG) {
        console.log(
          `事务超时: ${internalTransactionId}, 功能码: ${transaction.functionCode}, 从站地址: ${transaction.slaveAddress}`,
        )
      }

      try {
        const slaveAddress = transaction.slaveAddress
        const functionCode = transaction.functionCode

        const hasMatchingBufferData =
          this.buffer.length >= 4 &&
          parseInt(this.buffer.substr(0, 2), 16) === slaveAddress &&
          parseInt(this.buffer.substr(2, 2), 16) === functionCode

        if (hasMatchingBufferData && this.DEBUG) {
          console.log(`事务超时但缓冲区可能有匹配数据: ${this.buffer}`)
        }
      } catch (error) {
        if (this.DEBUG) {
          console.error(`检查超时事务缓冲区时出错:`, error)
        }
      }

      this.processBuffer()

      if (this.transactions.has(internalTransactionId)) {
        transaction.callback({ data: '', success: false }, '事务超时')
        this.transactions.delete(internalTransactionId)

        this.buffer = ''
      }
    }
  }

  /** 处理缓冲区数据 */
  private processBuffer() {
    if (this.buffer.length < 8) return

    try {
      const slaveAddress = parseInt(this.buffer.substr(0, 2), 16)
      const functionCode = parseInt(this.buffer.substr(2, 2), 16)

      if (functionCode === ModbusFunctionCode.READ_HOLDING_REGISTERS && this.buffer.length >= 6) {
        // 尝试获取数据长度
        const byteCount = parseInt(this.buffer.substr(6, 2), 16)
        const expectedLength = (1 + 1 + 1 + 1 + byteCount + 2) * 2 // 乘以2是因为每个字节在十六进制字符串中占2个字符

        if (this.DEBUG) {
          console.log('字节数:', parseInt(this.buffer.substr(6, 2), 16))
          console.log(`当前长度: ${this.buffer.length}，预期长度: ${expectedLength}`)
        }
        // 如果缓冲区长度小于预期长度，说明数据还未接收完全，继续等待
        if (this.buffer.length < expectedLength) return
      }
    } catch (error) {
      if (this.DEBUG) {
        console.log(`解析数据长度出错: ${error.message}`)
      }
    }

    // 验证 CRC
    if (this.isValidCRC(this.buffer)) {
      const slaveAddress = parseInt(this.buffer.substr(0, 2), 16)
      const functionCode = parseInt(this.buffer.substr(2, 2), 16)

      if (this.DEBUG) {
        console.log(
          `收到有效数据包: ${this.buffer}, 从站地址: ${slaveAddress}, 功能码: ${functionCode}`,
        )
      }

      // 尝试匹配事务
      let matchedTransaction = false

      // 首先尝试通过从站地址和功能码匹配
      for (const [internalTransactionId, transaction] of this.transactions.entries()) {
        if (
          transaction.slaveAddress === slaveAddress &&
          transaction.functionCode === functionCode
        ) {
          if (this.DEBUG) {
            console.log(`匹配到事务: ${internalTransactionId}`)
          }
          const processedResponse = this.processResponse(this.buffer, transaction.dataParseConfig)

          // 调用回调
          transaction.callback(processedResponse)
          clearTimeout(transaction.timeoutId)
          this.transactions.delete(internalTransactionId)
          matchedTransaction = true
          break
        }
      }

      // 如果没有匹配到事务，检查是否有任何事务具有相同的从站地址
      if (!matchedTransaction) {
        for (const [internalTransactionId, transaction] of this.transactions.entries()) {
          if (transaction.slaveAddress === slaveAddress) {
            if (this.DEBUG) {
              console.log(
                `匹配到同样从站地址的事务: ${internalTransactionId}，但功能码不匹配，当前功能码: ${functionCode}, 期望功能码: ${transaction.functionCode}`,
              )
            }
          }
        }

        if (this.DEBUG) {
          console.log(`未找到匹配的事务，从站地址: ${slaveAddress}, 功能码: ${functionCode}`)
        }
      }

      this.buffer = ''
    } else {
      if (this.buffer.length > this.MAX_BUFFER) {
        if (this.DEBUG) {
          console.log(`缓冲区过长且CRC无效，清空缓冲区: ${this.buffer}`)
        }
        this.buffer = ''
      }
    }
  }

  /**
   * 处理响应数据
   * @param data 接收到的数据字符串或数组
   * @param dataParseConfig 数据解析配置
   * @returns 处理后的数据对象
   */
  private processResponse(
    data: string | number[],
    dataParseConfig?: Partial<DataParseConfig>,
  ): { data: string | number[]; success: boolean } {
    let originalData: string
    if (Array.isArray(data)) {
      originalData = data.map((byte: number) => byte.toString(16).padStart(2, '0')).join('')
    } else {
      originalData = data
    }
    const dataWithoutCRC = originalData.slice(0, -8)
    const functionCode = parseInt(originalData.substring(2, 4), 16)

    if (functionCode === ModbusFunctionCode.READ_HOLDING_REGISTERS) {
      const originArray = this.stringToByteArray(originalData)

      let dataLen: number, dataArrLen: number, modbusRTUStandard: boolean
      if ((originArray.length & 1) === 0) {
        // 非标准ModbusRTU协议
        dataLen = (originArray[2] << 8) | originArray[3]
        dataArrLen = originArray.slice(4, -2).length
        modbusRTUStandard = false
      } else {
        // 标准ModbusRTU协议
        dataLen = originArray[2]
        dataArrLen = originArray.slice(3, -2).length
        modbusRTUStandard = true
      }

      if (this.DEBUG) {
        console.log(
          `数据长度: ${dataLen}, 数据数组长度: ${dataArrLen}, 是否标准ModbusRTU: ${modbusRTUStandard}`,
        )
      }
      if (dataLen === dataArrLen) {
        if (this.DEBUG) {
          console.log('转换前的数据:', originalData)
        }
        const result = this.stringToIntArray(originalData, 1, modbusRTUStandard, dataParseConfig)

        if (this.DEBUG) {
          console.log('转换后的数据:', result)
        }
        return { data: result, success: true }
      } else {
        return { data: dataWithoutCRC, success: false }
      }
    }

    return { data: dataWithoutCRC, success: true }
  }

  /**
   * 计算CRC16校验码
   * @param data 十六进制字符串
   * @returns 高低位CRC值
   */
  private calculateCRC16(data: string): { low: string; high: string } {
    // 验证输入
    if (!data || typeof data !== 'string') {
      return { low: '00', high: '00' }
    }

    // 将十六进制字符串转换为字节数组
    const bytes: number[] = []
    for (let i = 0; i < data.length; i += 2) {
      if (i + 1 < data.length) {
        const byteValue = parseInt(data.substring(i, i + 2), 16)
        if (!isNaN(byteValue)) {
          bytes.push(byteValue)
        }
      }
    }

    // 计算CRC16
    let crc = 0xffff
    for (let i = 0; i < bytes.length; i++) {
      const tableIndex = (crc ^ bytes[i]) & 0xff
      crc = (crc >> 8) ^ ModbusManager.CRC16_TABLE[tableIndex]
    }

    const low = (crc & 0xff).toString(16).padStart(2, '0')
    const high = ((crc >> 8) & 0xff).toString(16).padStart(2, '0')

    return { high, low }
  }

  /** 验证 CRC */
  private isValidCRC(data: string): boolean {
    if (data.length < 4) return false
    const dataWithoutCRC = data.slice(0, -4)
    const receivedCRC = data.slice(-4)
    const { high, low } = this.calculateCRC16(dataWithoutCRC)
    return receivedCRC.toLowerCase() === (low + high).toLowerCase()
  }

  /** 将十六进制字符串转换为字节数组 */
  private stringToByteArray(str: string): number[] {
    const byteArray = []
    for (let i = 0; i < str.length; i += 2) {
      // 使用位运算确保正确处理有符号字节
      const byte = parseInt(str.substr(i, 2), 16)
      // 确保结果是一个8位有符号整数
      byteArray.push(byte & 0xff)
    }
    return byteArray
  }

  /**
   * 将十六进制字符串转换为整数数组
   * @param s 十六进制字符串
   * @param flag 标志位
   * @param modbusRTUStandard 是否使用标准ModbusRTU协议
   * @param dataParseConfig 数据解析配置
   * @returns 转换后的整数数组
   */
  private stringToIntArray(
    s: string,
    flag: number,
    modbusRTUStandard = false,
    dataParseConfig?: Partial<DataParseConfig>,
  ): number[] {
    const stringArray = this.hexData(s, modbusRTUStandard)
    const intArray: number[] = []

    const finalConfig: DataParseConfig = {
      ...this.dataParseConfig,
      ...(dataParseConfig || {}),
    }

    if (this.DEBUG && dataParseConfig) {
      console.log('使用自定义数据解析配置:', finalConfig)
    }

    return this.hexToInt16(stringArray, finalConfig)
  }

  /** 提取十六进制数据 */
  private hexData(s: string, modbusRTUStandard: boolean): string[] {
    if (modbusRTUStandard) {
      s = s.slice(6, -4)
    } else {
      s = s.slice(8, -4)
    }
    const stringArray: string[] = []
    for (let i = 0; i < s.length; i += 4) {
      stringArray.push(s.slice(i, i + 4))
    }
    return stringArray
  }

  /**
   * 将十六进制字符串转换为整数
   * 根据配置决定是否将大于32767的值解析为负数
   * @param stringArray 十六进制字符串数组
   * @param config 数据解析配置
   * @returns 转换后的整数数组
   */
  private hexToInt16(stringArray: string[], config: DataParseConfig): number[] {
    const intArray: number[] = []
    for (let i = 0; i < stringArray.length; i++) {
      const value = parseInt(stringArray[i], 16)

      let shouldParseAsSigned = config.parseAsSigned

      if (config.dataRanges) {
        for (const range of config.dataRanges) {
          if (i >= range.start && i <= range.end) {
            shouldParseAsSigned = range.parseAsSigned
            break
          }
        }
      }

      if (shouldParseAsSigned && value > 32767) {
        const signed = value.toString(2).padStart(16, '0')
        const isNegative = signed[0] === '1'
        if (isNegative) {
          const signed3 = (parseInt(signed, 2) - 1).toString(2)
          let signed2 = ''
          for (const bit of signed3) {
            signed2 += bit === '0' ? '1' : '0'
          }
          intArray[i] = -parseInt(signed2, 2)
        } else {
          intArray[i] = value
        }
      } else {
        intArray[i] = value
      }
    }
    return intArray
  }

  /**
   * 获取当前默认数据解析配置
   * @returns 当前的数据解析配置
   */
  public getDataParseConfig(): DataParseConfig {
    return { ...this.dataParseConfig }
  }

  /**
   * 设置默认数据解析配置
   * @param config 数据解析配置
   */
  public setDataParseConfig(config: Partial<DataParseConfig>): void {
    this.dataParseConfig = {
      ...this.dataParseConfig,
      ...(config || {}),
    }

    if (this.DEBUG) {
      console.log('已更新默认数据解析配置:', this.dataParseConfig)
    }
  }

  /**
   * 创建数据解析配置
   * 用于在发送命令时快速创建配置对象
   * @param isSigned 是否解析为有符号数
   * @param dataRanges 特定数据范围的解析配置
   * @returns 数据解析配置对象
   */
  public static createDataParseConfig(
    isSigned: boolean = true,
    dataRanges?: { start: number; end: number; parseAsSigned: boolean }[],
  ): DataParseConfig {
    return {
      parseAsSigned: isSigned,
      dataRanges,
    }
  }

  /**
   * 创建有符号数解析配置
   * 用于需要将大于32767的值解析为负数的场景
   * @param dataRanges 特定数据范围的解析配置
   * @returns 有符号数解析配置对象
   */
  public static createSignedDataParseConfig(
    dataRanges?: { start: number; end: number; parseAsSigned: boolean }[],
  ): DataParseConfig {
    return this.createDataParseConfig(true, dataRanges)
  }

  /**
   * 创建无符号数解析配置
   * 用于需要保持原始值不变的场景
   * @param dataRanges 特定数据范围的解析配置
   * @returns 无符号数解析配置对象
   */
  public static createUnsignedDataParseConfig(
    dataRanges?: { start: number; end: number; parseAsSigned: boolean }[],
  ): DataParseConfig {
    return this.createDataParseConfig(false, dataRanges)
  }
}

export default ModbusManager.getInstance()
