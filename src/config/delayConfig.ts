import { reactive } from 'vue'
import { useConfigStore } from '@/store/config'

// 固定配置项（延时配置）
export const FIXED_DELAY_CONFIG = {
  STOP_BEFORE_COMMAND: 500, // 发送命令前停止周期性刷新的等待时间
  START_AFTER_COMMAND: 500, // 发送命令后启动周期性刷新的等待时间
  SCAN_INTERVAL: 1000, // 状态扫描间隔（毫秒）
  NEXT_STEP_DELAY: 3000, // 步骤间的延迟（毫秒）
  OPERATION_TIMEOUT: 60000, // 操作总超时时间（毫秒）
}

// 固定配置项（告警配置）
export const FIXED_ALARM_CONFIG = {
  MECHANICAL_ALARM: [
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
  TEMPERATURE_ALARM: [
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
  PARTIAL_DISCHARGE_ALARM: [
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
}

// 动态延时配置
export const dynamicDelayConfig = reactive({
  // 动作延时（秒 -> 毫秒）
  DELAY_BREAKER_ON: 5000, // 断路器合闸的等待时间
  DELAY_BREAKER_OFF: 5000, // 断路器分闸的等待时间
  DELAY_BREAKER_STORE: 5000, // 断路器储能的等待时间
  DELAY_GROUND_ON: 5000, // 接地刀合闸的等待时间
  DELAY_GROUND_OFF: 5000, // 接地刀分闸的等待时间
  DELAY_CHASSIS_IN: 5000, // 底盘车摇入的等待时间
  DELAY_CHASSIS_OUT: 5000, // 底盘车摇出的等待时间

  // 故障判断延时（秒 -> 毫秒）
  FAULT_DELAY_BREAKER_ON: 10000, // 断路器合闸故障判断时间
  FAULT_DELAY_BREAKER_OFF: 10000, // 断路器分闸故障判断时间
  FAULT_DELAY_BREAKER_STORE: 10000, // 断路器储能故障判断时间
  FAULT_DELAY_GROUND_ON: 10000, // 接地刀合闸故障判断时间
  FAULT_DELAY_GROUND_OFF: 10000, // 接地刀分闸故障判断时间
  FAULT_DELAY_CHASSIS_IN: 35000, // 底盘车摇入故障判断时间
  FAULT_DELAY_CHASSIS_OUT: 35000, // 底盘车摇出故障判断时间
  FAULT_DELAY_POWER_ON_CHASSIS_IN: 50000, // 送电底盘车摇入故障判断时间
  FAULT_DELAY_POWER_ON_CHASSIS_OUT: 50000, // 送电底盘车摇出故障判断时间
  FAULT_DELAY_POWER_ON_TIMEOUT: 60000, // 送电超时故障判断时间
  FAULT_DELAY_POWER_OFF_TIMEOUT: 60000, // 停电超时故障判断时间
})

// 动态告警配置
export const dynamicAlarmConfig = reactive({
  MECHANICAL_ALARM: [
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
  TEMPERATURE_ALARM: [
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
  PARTIAL_DISCHARGE_ALARM: [
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
})

// 获取完整的延时配置
export const getDelayConfig = () => {
  return {
    ...FIXED_DELAY_CONFIG,
    ...dynamicDelayConfig,
  }
}

// 获取完整的告警配置
export const getAlarmConfig = () => {
  return {
    ...dynamicAlarmConfig,
  }
}

// 更新动态延时配置
export const updateDelayConfig = (
  actionConfig: Record<string, number>,
  faultConfig: Record<string, number>,
) => {
  const configStore = useConfigStore()
  if (actionConfig) {
    configStore.updateActionDelay(actionConfig)
  }

  if (faultConfig) {
    configStore.updateFaultDelay(faultConfig)
  }
}

// 更新动态告警配置
export const updateAlarmConfig = (alarmConfig: {
  mechanical?: Array<{ name: string; upperLimit?: number; lowerLimit?: number }>
  temperature?: Array<{ name: string; upperLimit: number }>
  partialDischarge?: Array<{ name: string; upperLimit: number }>
}) => {
  const configStore = useConfigStore()
  configStore.updateAlarmConfig(alarmConfig)
  syncAlarmConfig(configStore)
}

export const syncAlarmConfig = (configStore: any) => {
  if (configStore.mechanicalAlarm) {
    dynamicAlarmConfig.MECHANICAL_ALARM = configStore.mechanicalAlarm.map((item: any) => ({
      ...item,
    }))
  }

  if (configStore.temperatureAlarm) {
    dynamicAlarmConfig.TEMPERATURE_ALARM = configStore.temperatureAlarm.map((item: any) => ({
      ...item,
    }))
  }

  if (configStore.partialDischargeAlarm) {
    dynamicAlarmConfig.PARTIAL_DISCHARGE_ALARM = configStore.partialDischargeAlarm.map(
      (item: any) => ({ ...item }),
    )
  }
}

export default getDelayConfig()
