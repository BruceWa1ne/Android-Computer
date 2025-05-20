import { AngleDataService } from '@/services/AngleDataService'
import { TravelData } from '@/types/angle-converter'

/**
 * 角度转换数据访问对象
 * 负责提供角度-行程数据转换的方法
 */
export class AngleConverterDAO {
  private angleDataService: AngleDataService

  constructor() {
    this.angleDataService = AngleDataService.getInstance()
  }

  /**
   * 使用二分查找获取指定角度在数组中的下标
   * @param arr 角度数组
   * @param angle 目标角度
   * @returns 下标值
   */
  public getIndex(arr: number[], angle: number): number {
    let low = 0 // 数组最小索引值
    let high = arr.length - 1 // 数组最大索引值

    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      if (angle === arr[mid]) {
        return mid
      } else if (angle > arr[mid]) {
        low = mid + 1
      } else {
        high = mid - 1
      }
    }
    return high
  }

  /**
   * 将角度数据转换为行程数据
   * @param angleData 角度数组
   * @param actionType 动作类型 (1: 合闸, 0: 分闸)
   * @returns 行程数组
   */
  public async getOffset(angleData: number[], actionType: number): Promise<number[]> {
    const angle0 = this.angleDataService.getAngle0()
    const lastValue = this.angleDataService.getLastValue()
    const lastAngleValue = this.angleDataService.getLastAngleValue()
    const newAngleArr = this.angleDataService.getNewAngleArr()
    const newTripArr = this.angleDataService.getNewTripArr()

    // 获取首个角度值作为基准点
    let firstAngle = 0
    if (actionType === 1) {
      firstAngle = angleData[0]
    } else {
      firstAngle = angleData[angleData.length - 1]
    }

    return angleData.map((angle) => {
      // 计算相对角度值
      let trip = Math.abs(parseFloat(String(angle)) - firstAngle)

      // 根据角度值确定行程
      if (trip <= angle0) {
        trip = 0
      } else if (trip >= lastAngleValue) {
        trip = lastValue
      } else {
        const minIndex = this.getIndex(newAngleArr, trip)
        let maxTripValue, maxAngleValue, minAngleValue, minTripValue

        if (minIndex >= newAngleArr.length - 1) {
          minAngleValue = newAngleArr[minIndex - 1]
          minTripValue = newTripArr[minIndex - 1]
          maxTripValue = newTripArr[newAngleArr.length - 1]
          maxAngleValue = newAngleArr[newAngleArr.length - 1]
        } else {
          minAngleValue = newAngleArr[minIndex]
          minTripValue = newTripArr[minIndex]
          maxTripValue = newTripArr[minIndex + 1]
          maxAngleValue = newAngleArr[minIndex + 1]
        }

        const diffAngle = maxAngleValue - minAngleValue
        const diffTrip = maxTripValue - minTripValue

        // 线性插值计算行程值
        trip = minTripValue + (diffTrip * (trip - minAngleValue)) / diffAngle
      }

      // 取小数点后两位
      return Math.floor(trip * 100) / 100
    })
  }

  /**
   * 获取反弹最大值
   * @param travelArr 行程数组
   * @param minValue 最小值
   * @returns 反弹最大值
   */
  public getBounceMaxValue(travelArr: number[], minValue: number): number {
    const index = travelArr.findIndex((item) => item === minValue)
    let retValue = 0

    for (let i = index + 1; i < travelArr.length; i++) {
      if (i > 0) {
        // 如果偏移量小于前一个点的值，则取前一个点
        if (travelArr[i] < travelArr[i - 1]) {
          retValue = travelArr[i - 1]
          break
        }
      }
    }

    return retValue
  }

  /**
   * 获取数据索引
   * @param travelData 行程数据
   * @param startIndex 起始索引
   * @param offsetValue 偏移值
   * @param isUp 方向（true为上，false为下）
   * @returns 索引值
   */
  public getDataIndex(
    travelData: TravelData,
    startIndex: number,
    offsetValue: number,
    isUp: boolean,
  ): number {
    let retIndex = 0

    for (let i = startIndex; i < travelData.data.length; i++) {
      const dataVo = travelData.data[i]
      // 找到第一个大于等于（方向向下时是小于等于）给定值的点
      const isMeeting = isUp ? dataVo >= offsetValue : dataVo <= offsetValue

      if (isMeeting) {
        retIndex = i
        if (i > 0) {
          const dataBeforeVo = travelData.data[i - 1]
          // 如果前一个点的值更接近给定值，则取前一个点
          if (Math.abs(offsetValue - dataBeforeVo) < Math.abs(dataVo - offsetValue)) {
            retIndex = i - 1
          }
        }
        break
      }
    }

    return retIndex
  }
}
