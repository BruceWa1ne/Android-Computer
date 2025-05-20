// 串口配置接口
export interface SerialPortConfig {
  port: string
  baudRate: number
  parity: 'N' | 'O' | 'E'
  dataBits: number
  stopBit: number
  hex: boolean
}

// 串口状态接口
export interface SerialStatus {
  isOpen: boolean
  config: SerialPortConfig | null
  transactionsCount: number
  lastActivity: number
}

// 周期性串口状态接口
export interface PeriodicSerialStatus {
  isRunning: boolean
  queueLength: number
  isProcessingCommand: boolean
  commandLock: boolean
  timeSinceLastCommand: number
}
