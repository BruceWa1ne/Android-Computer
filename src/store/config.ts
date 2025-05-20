import { defineStore } from 'pinia'
import { dynamicDelayConfig } from '@/config/delayConfig'

export const useConfigStore = defineStore('config', {
  state: () => ({
    // 动作延时配置
    actionDelay: {
      断路器合闸: 5,
      断路器分闸: 5,
      接地开关合闸: 5,
      接地开关分闸: 5,
      底盘车摇入: 5,
      底盘车摇出: 5,
    },

    // 故障判断延时配置
    faultDelay: {
      断路器合闸: 10,
      断路器分闸: 10,
      接地开关合闸: 10,
      接地开关分闸: 10,
      单步底盘车摇入: 35,
      单步底盘车摇出: 35,
      送电底盘车摇入: 50,
      停电底盘车摇出: 50,
      送电超时: 60,
      停电超时: 60,
    },
    // 机械特性告警
    mechanicalAlarm: [
      {
        name: '合闸速度',
        upperLimit: 1.5,
        lowerLimit: 0.7,
        decimals: 1,
      },
      {
        name: '合闸时间',
        upperLimit: 60,
        lowerLimit: 35,
        decimals: 1,
      },
      {
        name: '分闸速度',
        upperLimit: 1.8,
        lowerLimit: 0.7,
        decimals: 1,
      },
      {
        name: '分闸时间',
        upperLimit: 45,
        lowerLimit: 20,
        decimals: 1,
      },
      {
        name: '总行程',
        lowerLimit: 13,
        decimals: 1,
      },
      {
        name: '开距',
        upperLimit: 13,
        lowerLimit: 11,
        decimals: 1,
      },
      {
        name: '超程',
        upperLimit: 3.4,
        lowerLimit: 2.6,
        decimals: 1,
      },
      {
        name: '线圈峰值电流',
        upperLimit: 5,
        decimals: 1,
      },
    ],
    // 温度告警
    temperatureAlarm: [
      {
        name: '断路器上触壁温升A',
        upperLimit: 65,
        decimals: 1,
      },
      {
        name: '断路器上触壁温升B',
        upperLimit: 65,
        decimals: 1,
      },
      {
        name: '断路器上触壁温升C',
        upperLimit: 65,
        decimals: 1,
      },
      {
        name: '断路器下触壁温升A',
        upperLimit: 65,
        decimals: 1,
      },
      {
        name: '断路器下触壁温升B',
        upperLimit: 65,
        decimals: 1,
      },
      {
        name: '断路器下触壁温升C',
        upperLimit: 65,
        decimals: 1,
      },
      {
        name: '主母排温升A',
        upperLimit: 75,
        decimals: 1,
      },
      {
        name: '主母排温升B',
        upperLimit: 75,
        decimals: 1,
      },
      {
        name: '主母排温升C',
        upperLimit: 75,
        decimals: 1,
      },
      {
        name: '出线电缆温升A',
        upperLimit: 75,
        decimals: 1,
      },
      {
        name: '出线电缆温升B',
        upperLimit: 75,
        decimals: 1,
      },
      {
        name: '出线电缆温升C',
        upperLimit: 75,
        decimals: 1,
      },
    ],
    // 局放告警
    partialDischargeAlarm: [
      {
        name: '断路器室温度',
        upperLimit: 45,
        decimals: 1,
      },
      {
        name: '断路器室湿度',
        upperLimit: 85,
        decimals: 1,
      },
      {
        name: '超声波局放值',
        upperLimit: 10,
        decimals: 1,
      },
      {
        name: '暂地电波局放值',
        upperLimit: 10,
        decimals: 1,
      },
      {
        name: '电缆器室温度',
        upperLimit: 85,
        decimals: 1,
      },
      {
        name: '电缆器室湿度',
        upperLimit: 45,
        decimals: 1,
      },
    ],
    // 摄像头配置
    cameraConfig: {
      breaking: {
        ip: '192.168.1.12',
        protocol: 'rtsp',
        port: '554',
        streamLevel: 1,
      },
      cable: {
        ip: '192.168.1.11',
        protocol: 'rtsp',
        port: '554',
        streamLevel: 1,
      },
    },
  }),

  actions: {
    // 更新动作延时配置
    updateActionDelay(config: Record<string, number>) {
      this.actionDelay = { ...this.actionDelay, ...config }
      this.syncToDelayConfig()
    },

    // 更新故障判断延时配置
    updateFaultDelay(config: Record<string, number>) {
      this.faultDelay = { ...this.faultDelay, ...config }
      this.syncToDelayConfig()
    },

    // 更新机械特性告警配置
    updateMechanicalAlarm(
      alarmConfig: Array<{ name: string; upperLimit?: number; lowerLimit?: number }>,
    ) {
      this.mechanicalAlarm = this.mechanicalAlarm.map((item) => {
        const config = alarmConfig.find((config) => config.name === item.name)
        if (config) {
          return {
            ...item,
            ...(config.upperLimit !== undefined ? { upperLimit: config.upperLimit } : {}),
            ...(config.lowerLimit !== undefined ? { lowerLimit: config.lowerLimit } : {}),
          }
        }
        return item
      })
    },

    // 更新温度告警配置
    updateTemperatureAlarm(alarmConfig: Array<{ name: string; upperLimit: number }>) {
      this.temperatureAlarm = this.temperatureAlarm.map((item) => {
        const config = alarmConfig.find((config) => config.name === item.name)
        if (config) {
          return { ...item, upperLimit: config.upperLimit }
        }
        return item
      })
    },

    // 更新局放告警配置
    updatePartialDischargeAlarm(alarmConfig: Array<{ name: string; upperLimit: number }>) {
      this.partialDischargeAlarm = this.partialDischargeAlarm.map((item) => {
        const config = alarmConfig.find((config) => config.name === item.name)
        if (config) {
          return { ...item, upperLimit: config.upperLimit }
        }
        return item
      })
    },

    // 统一更新告警配置
    updateAlarmConfig(config: {
      mechanical?: Array<{ name: string; upperLimit?: number; lowerLimit?: number }>
      temperature?: Array<{ name: string; upperLimit: number }>
      partialDischarge?: Array<{ name: string; upperLimit: number }>
    }) {
      if (config.mechanical) {
        this.updateMechanicalAlarm(config.mechanical)
      }
      if (config.temperature) {
        this.updateTemperatureAlarm(config.temperature)
      }
      if (config.partialDischarge) {
        this.updatePartialDischargeAlarm(config.partialDischarge)
      }
    },

    // 更新摄像头配置
    updateCameraConfig(
      type: 'breaking' | 'cable',
      config: Partial<{
        ip: string
        protocol: string
        port: string
        streamLevel: number
      }>,
    ) {
      this.cameraConfig[type] = { ...this.cameraConfig[type], ...config }
    },

    // 同步动作配置 （秒 -> 毫秒）
    syncToDelayConfig() {
      if (this.actionDelay['断路器合闸'] !== undefined)
        dynamicDelayConfig.DELAY_BREAKER_ON = this.actionDelay['断路器合闸'] * 1000
      if (this.actionDelay['断路器分闸'] !== undefined)
        dynamicDelayConfig.DELAY_BREAKER_OFF = this.actionDelay['断路器分闸'] * 1000
      if (this.actionDelay['断路器储能'] !== undefined)
        dynamicDelayConfig.DELAY_BREAKER_STORE = this.actionDelay['断路器储能'] * 1000
      if (this.actionDelay['接地开关合闸'] !== undefined)
        dynamicDelayConfig.DELAY_GROUND_ON = this.actionDelay['接地开关合闸'] * 1000
      if (this.actionDelay['接地开关分闸'] !== undefined)
        dynamicDelayConfig.DELAY_GROUND_OFF = this.actionDelay['接地开关分闸'] * 1000
      if (this.actionDelay['底盘车摇入'] !== undefined)
        dynamicDelayConfig.DELAY_CHASSIS_IN = this.actionDelay['底盘车摇入'] * 1000
      if (this.actionDelay['底盘车摇出'] !== undefined)
        dynamicDelayConfig.DELAY_CHASSIS_OUT = this.actionDelay['底盘车摇出'] * 1000

      if (this.faultDelay['断路器合闸'] !== undefined)
        dynamicDelayConfig.FAULT_DELAY_BREAKER_ON = this.faultDelay['断路器合闸'] * 1000
      if (this.faultDelay['断路器分闸'] !== undefined)
        dynamicDelayConfig.FAULT_DELAY_BREAKER_OFF = this.faultDelay['断路器分闸'] * 1000
      if (this.faultDelay['断路器储能'] !== undefined)
        dynamicDelayConfig.FAULT_DELAY_BREAKER_STORE = this.faultDelay['断路器储能'] * 1000
      if (this.faultDelay['接地开关合闸'] !== undefined)
        dynamicDelayConfig.FAULT_DELAY_GROUND_ON = this.faultDelay['接地开关合闸'] * 1000
      if (this.faultDelay['接地开关分闸'] !== undefined)
        dynamicDelayConfig.FAULT_DELAY_GROUND_OFF = this.faultDelay['接地开关分闸'] * 1000
      if (this.faultDelay['单步底盘车摇入'] !== undefined)
        dynamicDelayConfig.FAULT_DELAY_CHASSIS_IN = this.faultDelay['单步底盘车摇入'] * 1000
      if (this.faultDelay['单步底盘车摇出'] !== undefined)
        dynamicDelayConfig.FAULT_DELAY_CHASSIS_OUT = this.faultDelay['单步底盘车摇出'] * 1000
      if (this.faultDelay['送电/停电底盘车摇入'] !== undefined)
        dynamicDelayConfig.FAULT_DELAY_POWER_ON_CHASSIS_IN =
          this.faultDelay['送电/停电底盘车摇入'] * 1000
      if (this.faultDelay['送电/停电底盘车摇出'] !== undefined)
        dynamicDelayConfig.FAULT_DELAY_POWER_ON_CHASSIS_OUT =
          this.faultDelay['送电/停电底盘车摇出'] * 1000
      if (this.faultDelay['送电超时'] !== undefined)
        dynamicDelayConfig.FAULT_DELAY_POWER_ON_TIMEOUT = this.faultDelay['送电超时'] * 1000
      if (this.faultDelay['停电超时'] !== undefined)
        dynamicDelayConfig.FAULT_DELAY_POWER_OFF_TIMEOUT = this.faultDelay['停电超时'] * 1000
    },

    // 获取摄像头URL
    getCameraUrl(type: 'breaking' | 'cable'): string {
      const config = this.cameraConfig[type]
      const base = `${config.protocol}://${config.ip}:${config.port}`

      switch (config.protocol) {
        case 'rtsp':
          return `${base}/user=admin&password=&channel=1&stream=${config.streamLevel}.sdp?`
        case 'rtmp':
          return `${base}/live/stream${config.streamLevel}`
        case 'hls':
          return `${base}/hls/stream${config.streamLevel}.m3u8`
        default:
          return `${base}/user=admin&password=&channel=1&stream=${config.streamLevel}.sdp?`
      }
    },
  },

  persist: {
    key: 'delay-config',
    paths: [
      'actionDelay',
      'faultDelay',
      'cameraConfig',
      'mechanicalAlarm',
      'temperatureAlarm',
      'partialDischargeAlarm',
    ],
  },
})
