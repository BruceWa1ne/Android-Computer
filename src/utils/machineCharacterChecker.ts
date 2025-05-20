import { MachineCharacterType, CurveDataType } from '@/enum/states'
import { Ratio } from '@/enum/ratio'

/**
 * 机械特性配置项接口
 */
export interface MachineCharacterConfig {
  name: string
  upperLimit?: number
  lowerLimit?: number
  decimals?: number
}

/**
 * 机械特性判断结果接口
 */
export interface MachineCharacterResult {
  data: number | string
  type: MachineCharacterType
}

/**
 * 判断类型枚举
 */
export enum JudgeType {
  UPPER_LOWER_LIMIT = 1, // 上下限判断
  ONLY_LOWER_LIMIT = 2, // 仅下限判断
  ONLY_UPPER_LIMIT = 3, // 仅上限判断带告警
}

/**
 * 判断机械特性数据是否异常
 * @param value 数据值
 * @param config 配置项
 * @param judgeType 判断类型 (1: 上下限判断, 2: 仅下限判断, 3: 仅上限判断带告警)
 * @returns 判断结果，包含数据和状态类型
 */
export function checkMachineCharacterValue(
  value: number | string,
  config: MachineCharacterConfig,
  judgeType: JudgeType,
): MachineCharacterResult {
  const dataValue = typeof value === 'string' ? parseFloat(value) : value

  switch (judgeType) {
    case JudgeType.UPPER_LOWER_LIMIT: {
      // 上下限判断
      const lowerLimit = typeof config.lowerLimit === 'number' ? config.lowerLimit : 0
      const upperLimit =
        typeof config.upperLimit === 'number' ? config.upperLimit : Number.MAX_VALUE

      if (dataValue < lowerLimit || dataValue > upperLimit) {
        return {
          data: value,
          type: MachineCharacterType.EXCEPTION, // 异常
        }
      } else {
        return {
          data: value,
          type: MachineCharacterType.NORMAL, // 正常
        }
      }
    }

    case JudgeType.ONLY_LOWER_LIMIT: {
      // 仅下限判断
      const lowerLimit = typeof config.lowerLimit === 'number' ? config.lowerLimit : 0

      if (dataValue < lowerLimit) {
        return {
          data: value,
          type: MachineCharacterType.EXCEPTION, // 异常
        }
      } else {
        return {
          data: value,
          type: MachineCharacterType.NORMAL, // 正常
        }
      }
    }

    case JudgeType.ONLY_UPPER_LIMIT: {
      // 仅上限判断带告警
      const upperLimit = typeof config.upperLimit === 'number' ? config.upperLimit : 0

      if (upperLimit > 0) {
        if (dataValue > upperLimit && dataValue < upperLimit * Ratio.OnePointTwo) {
          return {
            data: value,
            type: MachineCharacterType.ALARM, // 告警
          }
        } else if (dataValue >= upperLimit * Ratio.OnePointTwo) {
          return {
            data: value,
            type: MachineCharacterType.EXCEPTION, // 异常
          }
        } else {
          return {
            data: value,
            type: MachineCharacterType.NORMAL, // 正常
          }
        }
      } else {
        return {
          data: value,
          type: MachineCharacterType.NORMAL, // 正常
        }
      }
    }

    default:
      return {
        data: value,
        type: MachineCharacterType.NORMAL, // 默认正常
      }
  }
}

/**
 * 批量判断机械特性数据
 * @param data 机械特性数据
 * @param configList 配置列表
 * @param keyMap 键名映射
 * @returns 判断结果和整体状态
 */
export function checkMachineCharacter(
  data: Record<string, any>,
  configList: MachineCharacterConfig[],
  keyMap: Record<string, string>,
): {
  result: Record<string, MachineCharacterResult>
  hasException: boolean
} {
  const result: Record<string, MachineCharacterResult> = {}
  let hasException = false

  if (!data) {
    return { result, hasException }
  }

  for (let i = 0; i < configList.length; i++) {
    const item = configList[i]
    const key = keyMap[item.name]

    if (!key || data[key] === undefined) continue

    let judgeType: JudgeType

    if (i < 4) {
      judgeType = JudgeType.UPPER_LOWER_LIMIT // 前4项需要检查上下限
    } else if (i > 3 && i < 7) {
      judgeType = JudgeType.ONLY_LOWER_LIMIT // 中间3项只检查下限
    } else {
      judgeType = JudgeType.ONLY_UPPER_LIMIT // 最后1项只检查上限，且有告警和异常两种状态
    }

    const checkResult = checkMachineCharacterValue(data[key], item, judgeType)
    result[key] = checkResult

    if (checkResult.type === MachineCharacterType.EXCEPTION) {
      hasException = true
    }
  }

  return { result, hasException }
}
