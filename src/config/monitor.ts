import { VoltageItem, CurrentItem, CapacityItem } from '@/types/units'

// 电压数据配置
export const Voltage: VoltageItem[] = [
  { key: 'Uab', special: 'ab', normal: 'U', value: '0.00' },
  { key: 'Ubc', special: 'bc', normal: 'U', value: '0.00' },
  { key: 'Uca', special: 'ca', normal: 'U', value: '0.00' },
]

// 电流数据配置
export const ElectricCurrent: CurrentItem[] = [
  { key: 'ia', special: 'I', normal: 'a', value: '0.00' },
  { key: 'ib', special: 'I', normal: 'b', value: '0.00' },
  { key: 'ic', special: 'I', normal: 'c', value: '0.00' },
]

// 功率及其他参数配置
export const Capacity: CapacityItem[] = [
  { key: 'f', label: 'f', value: '0.00' },
  { key: 'yggl_high', label: '有功功率', value: '0.00' },
  { key: 'yggl_low', label: '有功功率', value: '0.00' },
  { key: 'wggl_high', label: '无功功率', value: '0.00' },
  { key: 'wggl_low', label: '无功功率', value: '0.00' },
  { key: 'glys', label: '功率因素', value: '0.00' },
]
