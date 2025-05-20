/* eslint-disable no-useless-constructor */
import contrastData from '@/json/VS1.json'
import { ContrastDataItem } from '@/types/angle-converter'

/**
 * 角度数据服务 - 单例模式
 * 负责管理和提供对照表数据
 */
export class AngleDataService {
  private static instance: AngleDataService
  private compareAngle: number[] = []
  private compareTrip: number[] = []
  private sIndex: number = 0
  private angle0: number = 0
  private lastValue: number = 0
  private lastValueIndex: number = 0
  private lastAngleValue: number = 0
  private newAngleArr: number[] = []
  private newTripArr: number[] = []
  private initialized = false

  /**
   * 私有构造函数，防止外部直接创建实例
   */
  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): AngleDataService {
    if (!AngleDataService.instance) {
      AngleDataService.instance = new AngleDataService()
    }
    return AngleDataService.instance
  }

  /**
   * 初始化对照表数据
   * @private
   */
  private initialize(): void {
    if (this.initialized) return

    // 处理对照表数据
    this.compareAngle = (contrastData as ContrastDataItem[]).map((v) => parseFloat(v.angle) / 100)
    this.compareTrip = (contrastData as ContrastDataItem[]).map((v) => parseFloat(v.trip) / 100)

    // 找到对照表里行程为0的最后一个下标
    this.sIndex = this.compareTrip.lastIndexOf(0)

    // 行程为0的最后一个对应的角度值
    this.angle0 = this.compareAngle[this.sIndex]

    // 对照表里最后一个行程值
    this.lastValue = this.compareTrip[this.compareTrip.length - 1]

    // 跟最后一个行程值相同的第一个下标
    this.lastValueIndex = this.compareTrip.indexOf(this.lastValue)

    // 对应的角度值
    this.lastAngleValue = this.compareAngle[this.lastValueIndex]

    // 处理新的角度和行程数组
    if (this.lastValueIndex < this.compareTrip.length - 1) {
      this.newAngleArr = this.compareAngle.slice(this.sIndex, this.lastValueIndex + 1)
      this.newTripArr = this.compareTrip.slice(this.sIndex, this.lastValueIndex + 1)
    } else {
      this.newAngleArr = this.compareAngle.slice(this.sIndex, this.lastValueIndex)
      this.newTripArr = this.compareTrip.slice(this.sIndex, this.lastValueIndex)
    }

    this.initialized = true
  }

  /**
   * 获取角度临界值
   */
  public getAngle0(): number {
    this.initialize()
    return this.angle0
  }

  /**
   * 获取最后的行程值
   */
  public getLastValue(): number {
    this.initialize()
    return this.lastValue
  }

  /**
   * 获取最后的角度值
   */
  public getLastAngleValue(): number {
    this.initialize()
    return this.lastAngleValue
  }

  /**
   * 获取新的角度数组
   */
  public getNewAngleArr(): number[] {
    this.initialize()
    return this.newAngleArr
  }

  /**
   * 获取新的行程数组
   */
  public getNewTripArr(): number[] {
    this.initialize()
    return this.newTripArr
  }
}
