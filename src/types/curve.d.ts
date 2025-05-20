export type CurveType = 'opening' | 'closing' | 'energy' | 'angle'

export interface CurveData {
  num: number
  stepTime: number[]
  data: number[]
}

export interface CurveInfo {
  coil?: CurveData
  angle?: CurveData
  energy?: CurveData
  travel?: any
  type?: number // 1: closing, 0: opening
  actionTime?: string
  dataType?: number // 0: 正常, 1: 异常
  faultMachineCharacter?: Record<string, any> // 机械特性异常数据
  machineCharacter?: Record<string, any> // 机械特性数据
}
