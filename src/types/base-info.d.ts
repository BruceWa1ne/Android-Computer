export interface BaseInfo {
  Uab: string
  Ubc: string
  Uca: string
  ia: string
  ib: string
  ic: string
  f: string
  yggl_high: string // 有功功率高位
  yggl_low: string // 有功功率低位
  wggl_high: string // 无功功率高位
  wggl_low: string // 无功功率低位
  glys: string // 功率因素
  cabinetNumber: string // 柜号
  mode: string // 模式  1：远方  0：就地
  operationState: string // 运行状态 0：运行  1：热备用  2：冷备用  3：检修
  healthState: string // 健康状态
  breakerState: string // 断路器状态 0：分闸  1：合闸
  chassisPosition: string // 底盘车位置 试验位:0  工作位:1  中间位:2
  groundingState: string // 接地刀状态 1：接地合  0：接地分
  energyStorageState: string // 储能状态 0：未储能  1：已储能
  reserve3: string
  reserve4: string
  reserve5: string
  reserve6: string
  closingOperationsNum: string // 合闸操作次数
  openingOperationsNum: string // 分闸操作次数
  groundingSwitchNum: string // 接地开关操作次数
  chassisVehicleNum: string // 底盘车操作次数
  energyStorageTime: string // 储能时间
  energyStorageMotorMaxElectric: string // 储能电机最大电流
  chassisVehicleActionTime: string // 底盘车动作时间
  chassisVehicleMotorMaxElectric: string // 底盘车电机最大电流
  groundingSwitchActionTime: string // 接地开关动作时间
  groundingSwitchMotorMaxElectric: string // 接地开关电机最大电流
  currentOperation: string // 当前操作
  openingSpeed: string
  openingTime: string
  openingTotalTravel: string
  openingDistance: string
  openingOverTravel: string
  openingMaxCurrent: string
  closingSpeed: string
  closingTime: string
  closingTotalTravel: string
  closingDistance: string
  closingOverTravel: string
  closingMaxCurrent: string
  reserve19: string
  reserve20: string
  reserve21: string
  reserve22: string
  reserve23: string
  breakerUpperATemperature: string // 断路器上触臂温度A
  breakerUpperBTemperature: string // 断路器上触臂温度B
  breakerUpperCTemperature: string // 断路器上触臂温度C
  breakerLowerATemperature: string // 断路器下触臂温度A
  breakerLowerBTemperature: string // 断路器下触臂温度B
  breakerLowerCTemperature: string // 断路器下触臂温度C
  mainBusbarATemperature: string // 主母排温度A
  mainBusbarBTemperature: string // 主母排温度B
  mainBusbarCTemperature: string // 主母排温度C
  outletCableATemperature: string // 出线电缆温度A
  outletCableBTemperature: string // 出线电缆温度B
  outletCableCTemperature: string // 出线电缆温度C
  reserve24: string
  reserve25: string
  reserve26: string
  reserve27: string
  reserve28: string
  breakerTemperature: string // 断路器室温度
  breakerHumidity: string // 断路器室湿度
  ultrasonicVal: string // 超声波局放值
  transientGroundWaveVal: string // 暂态地电波局放值
  cableHumidity: string // 电缆室湿度
  cableTemperature: string // 电缆室温度
  airTightTemperature: string // 气密表温度
  airTightPressure: string // 气密表气压值
  airtightMeterGasDensity: string // 气密表气体密度
  reserve29: string
  reserve30: string
  reserve31: string
  reserve32: string
  reserve33: string
  reserve34: string
  updateTime?: string // 更新时间
}
