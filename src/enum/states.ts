export enum RunningState {
  // 工作状态
  WORK = 0,
  // 热备用
  HOT_RESERVE = 1,
  // 冷备用
  COLD_RESERVE = 2,
  // 检修
  MAINTENANCE = 3,
}

export enum DeviceAction {
  CHASSIS_IN = 'shakein', // 底盘车摇进
  CHASSIS_OUT = 'shakeout', // 底盘车摇出
  BREAKER_ON = 'breakeron', // 断路器合闸
  BREAKER_OFF = 'breakeroff', // 断路器分闸
  GROUND_ON = 'groundon', // 接地刀合闸
  GROUND_OFF = 'groundoff', // 接地刀分闸
  TRANSMISSION = 'transmission', // 手车推入
  FAILURE = 'failure', // 手车拉出
}

export enum DeviceState {
  OFF = '0', // 分闸/试验位
  ON = '1', // 合闸/工作位
  TEST = '2', // 中间位
}

export enum CurveType {
  TRAVEL = 'travel', // 行程
  ANGLE = 'angle', // 角度
  COIL = 'coil', // 线圈电流
  ENERGY = 'energy', // 储能
  TEMPERATURE = 'temperature', // 温度
  PARTIAL = 'partial', // 局放
}

export enum MachineCharacterType {
  NORMAL = 0, // 正常
  ALARM = 1, // 告警
  EXCEPTION = 2, // 异常
}

export enum CurveDataType {
  NORMAL = 0, // 正常
  EXCEPTION = 1, // 异常
}

export enum DataType {
  CLOSE = 1, // 合闸
  OPEN = 0, // 分闸
}
