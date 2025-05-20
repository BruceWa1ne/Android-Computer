import { ActionData, TeData } from '@/types/angle-converter'
import { AngleConverterDAO } from '@/dao/AngleConverterDAO'
import { ActionDataProcessor } from '@/services/ActionDataProcessor'
import { AngleUtils } from './angleUtils'

/**
 * 角度转换器类
 * 提供角度与行程数据转换的主要接口
 */
class AngleConverter {
  private angleConverterDAO: AngleConverterDAO
  private actionDataProcessor: ActionDataProcessor

  constructor() {
    this.angleConverterDAO = new AngleConverterDAO()
    this.actionDataProcessor = new ActionDataProcessor()
  }

  /**
   * 将角度数据转换为行程数据
   * @param angleData 角度数组
   * @param actionType 动作类型 (1: 合闸, 0: 分闸)
   * @returns 行程数组
   */
  public async getOffset(angleData: number[], actionType: number): Promise<number[]> {
    return this.angleConverterDAO.getOffset(angleData, actionType)
  }

  /**
   * 获取Te数据（计算结果数据）
   * @param data 动作数据
   * @returns Te数据对象
   */
  public async getTeData(data: ActionData): Promise<TeData> {
    return this.actionDataProcessor.getTeData(data)
  }
}

const angleConverter = new AngleConverter()

export const getOffset = angleConverter.getOffset.bind(angleConverter)
export const getTeData = angleConverter.getTeData.bind(angleConverter)

export { AngleConverter, AngleUtils }
