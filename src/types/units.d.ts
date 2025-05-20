/**
 * 单位格式化配置接口
 */
export interface UnitFormat {
  multiply: number
  unit: string
  decimals: number
}

/**
 * 设备监控中的电压数据项
 */
export interface VoltageItem {
  key: string
  special: string
  normal: string
  value: string
}

/**
 * 设备监控中的电流数据项
 */
export interface CurrentItem {
  key: string
  special: string
  normal: string
  value: string
}

/**
 * 设备监控中的容量/功率数据项
 */
export interface CapacityItem {
  key: string
  label: string
  value: string
}
