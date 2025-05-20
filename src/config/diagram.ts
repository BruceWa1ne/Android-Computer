import { RunningState } from '@/enum/states'
export const STATES = {
  // 接地开关状态
  GROUND: {
    DISCONNECTED: '0', // 接地分
    CONNECTED: '1', // 接地合
  },
  // 断路器状态
  BREAKER: {
    OPEN: '0', // 分闸
    CLOSED: '1', // 合闸
  },
  // 底盘车状态
  CHASSIS: {
    TEST: '0', // 试验位
    WORK: '1', // 工作位
    MIDDLE: '2', // 中间位 (已经在解析时强制转为试验位 这里只作为状态值)
  },
}

// 线路图映射表
export const DIAGRAM_MAP = {
  // 接地分-分闸-试验位
  [`${STATES.GROUND.DISCONNECTED}-${STATES.BREAKER.OPEN}-${STATES.CHASSIS.TEST}`]:
    '/static/diagram/circuit-diagram1.png',
  // 接地分-分闸-中间位
  [`${STATES.GROUND.DISCONNECTED}-${STATES.BREAKER.OPEN}-${STATES.CHASSIS.MIDDLE}`]:
    '/static/diagram/circuit-diagram1.png',
  // 接地分-分闸-工作位
  [`${STATES.GROUND.DISCONNECTED}-${STATES.BREAKER.OPEN}-${STATES.CHASSIS.WORK}`]:
    '/static/diagram/circuit-diagram2.png',
  // 接地分-合闸-试验位
  [`${STATES.GROUND.DISCONNECTED}-${STATES.BREAKER.CLOSED}-${STATES.CHASSIS.TEST}`]:
    '/static/diagram/circuit-diagram3.png',
  // 接地分-合闸-中间位
  [`${STATES.GROUND.DISCONNECTED}-${STATES.BREAKER.CLOSED}-${STATES.CHASSIS.MIDDLE}`]:
    '/static/diagram/circuit-diagram3.png',
  // 接地分-合闸-工作位
  [`${STATES.GROUND.DISCONNECTED}-${STATES.BREAKER.CLOSED}-${STATES.CHASSIS.WORK}`]:
    '/static/diagram/circuit-diagram4.png',
  // 接地合-分闸-试验位
  [`${STATES.GROUND.CONNECTED}-${STATES.BREAKER.OPEN}-${STATES.CHASSIS.TEST}`]:
    '/static/diagram/circuit-diagram5.png',
  // 接地合-分闸-中间位
  [`${STATES.GROUND.CONNECTED}-${STATES.BREAKER.OPEN}-${STATES.CHASSIS.MIDDLE}`]:
    '/static/diagram/circuit-diagram5.png',
  // 接地合-分闸-工作位
  [`${STATES.GROUND.CONNECTED}-${STATES.BREAKER.OPEN}-${STATES.CHASSIS.WORK}`]:
    '/static/diagram/circuit-diagram6.png',
  // 接地合-合闸-试验位
  [`${STATES.GROUND.CONNECTED}-${STATES.BREAKER.CLOSED}-${STATES.CHASSIS.TEST}`]:
    '/static/diagram/circuit-diagram7.png',
  // 接地合-合闸-中间位
  [`${STATES.GROUND.CONNECTED}-${STATES.BREAKER.CLOSED}-${STATES.CHASSIS.MIDDLE}`]:
    '/static/diagram/circuit-diagram7.png',
  // 接地合-合闸-工作位
  [`${STATES.GROUND.CONNECTED}-${STATES.BREAKER.CLOSED}-${STATES.CHASSIS.WORK}`]:
    '/static/diagram/circuit-diagram8.png',
}

// 工作状态
export const OPERATION_STATES = [
  // 工作状态: 接地开关分闸 + 断路器合闸 + 底盘车工作位
  {
    conditions: {
      groundingState: STATES.GROUND.DISCONNECTED,
      breakerState: STATES.BREAKER.CLOSED,
      chassisPosition: STATES.CHASSIS.WORK,
    },
    value: RunningState.WORK,
  },
  // 热备用: 接地开关分闸 + 断路器分闸 + 底盘车工作位
  {
    conditions: {
      groundingState: STATES.GROUND.DISCONNECTED,
      breakerState: STATES.BREAKER.OPEN,
      chassisPosition: STATES.CHASSIS.WORK,
    },
    value: RunningState.HOT_RESERVE,
  },
  // 冷备用: 接地开关分闸 + 断路器分闸/合闸 + 底盘车试验位
  {
    conditions: {
      groundingState: STATES.GROUND.DISCONNECTED,
      chassisPosition: STATES.CHASSIS.TEST,
    },
    value: RunningState.COLD_RESERVE,
  },
  // 检修: 接地开关合闸 + 断路器分闸/合闸 + 底盘车试验位
  {
    conditions: {
      groundingState: STATES.GROUND.CONNECTED,
      chassisPosition: STATES.CHASSIS.TEST,
    },
    value: RunningState.MAINTENANCE,
  },
]
