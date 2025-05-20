/**
 * 对照表数据项接口
 */
export interface ContrastDataItem {
  angle: string
  trip: string
}

/**
 * 线圈数据接口
 */
export interface CoilData {
  num: number
  data: number[]
  stepTime: number[]
}

/**
 * 角度数据接口
 */
export interface AngleData {
  data: number[]
  stepTime: number[]
}

/**
 * 行程数据接口
 */
export interface TravelData {
  data: number[]
  stepTime: number[]
}

/**
 * 动作数据接口
 */
export interface ActionData {
  type: string | number // 1: 合闸, 0: 分闸
  actionTime: number
  coil: CoilData
  angle: AngleData
}

/**
 * 计时数据接口
 */
export interface TimeData {
  startTime: number
  actDuration: number
  endTime: number
}

/**
 * 计算结果数据接口
 */
export interface TeData {
  num: number
  type: string
  energyTime: string
  actionStartTime: string
  actionEndTime: string
  maxCoil: number
  actionTime: number
  travelData: TravelData
  distance: number
  contactDistance: string | number
  overContactDistance: string | number
  overDistance: number
  speed: number
  time: number
  bounceValue?: string | number // 仅分闸时有此属性
}
