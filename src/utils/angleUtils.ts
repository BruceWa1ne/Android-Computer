/**
 * 角度工具类
 * 提供与角度计算相关的工具函数
 */
export class AngleUtils {
  /**
   * 将数字格式化为指定小数位数
   * @param num 要格式化的数字
   * @param digits 小数位数，默认为2
   * @returns 格式化后的数字
   */
  public static formatNumber(num: number, digits: number = 2): number {
    return parseFloat(num.toFixed(digits))
  }

  /**
   * 安全解析数字，避免NaN问题
   * @param value 要解析的值
   * @param defaultValue 默认值
   * @returns 解析后的数字
   */
  public static safeParseNumber(value: string | number, defaultValue: number = 0): number {
    if (value === undefined || value === null) {
      return defaultValue
    }

    const parsed = typeof value === 'string' ? parseFloat(value) : value
    return isNaN(parsed) ? defaultValue : parsed
  }

  /**
   * 线性插值计算
   * @param x 当前值
   * @param x1 最小值
   * @param x2 最大值
   * @param y1 最小值对应的结果
   * @param y2 最大值对应的结果
   * @returns 插值结果
   */
  public static linearInterpolation(
    x: number,
    x1: number,
    x2: number,
    y1: number,
    y2: number,
  ): number {
    if (x2 === x1) {
      return y1
    }
    return y1 + ((y2 - y1) * (x - x1)) / (x2 - x1)
  }

  /**
   * 将角度数组转换为度数显示（除以100）
   * @param angleArr 角度数组
   * @returns 转换后的角度数组
   */
  public static convertToDegrees(angleArr: number[]): number[] {
    return angleArr.map((angle) => angle / 100)
  }

  /**
   * 查找指定值最接近的数组元素索引
   * @param arr 数组
   * @param value 目标值
   * @returns 最接近的元素索引
   */
  public static findClosestIndex(arr: number[], value: number): number {
    if (!arr || arr.length === 0) {
      return -1
    }

    return arr.reduce((closestIndex, current, currentIndex, array) => {
      const currentDifference = Math.abs(current - value)
      const closestDifference = Math.abs(array[closestIndex] - value)

      return currentDifference < closestDifference ? currentIndex : closestIndex
    }, 0)
  }
}
