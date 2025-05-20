/**
 * 数值转换工具函数
 */

/**
 * 16位无符号整数范围: 0 to 65535
 * 16位有符号整数范围: -32768 to 32767
 */

/**
 * 将16位无符号整数转换为有符号整数
 * @param value 要转换的值(0-65535范围内)
 * @returns 转换后的有符号整数(-32768到32767范围)
 */
export function convertToSigned16(value: number): number {
  value = value & 0xffff

  if (value > 32767) {
    return value - 65536
  }

  return value
}

/**
 * 将16位有符号整数转换为无符号整数
 * @param value 要转换的值(-32768到32767范围)
 * @returns 转换后的无符号整数(0-65535范围)
 */
export function convertToUnsigned16(value: number): number {
  if (value < 0) {
    return value + 65536
  }

  return value
}
