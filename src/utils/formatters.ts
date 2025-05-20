import { UnitFormat } from '@/types/units'

/**
 * 格式化单个数值
 * @param value 要格式化的值
 * @param format 格式化配置
 * @returns 格式化后的字符串
 */
export function formatValue(value: number | undefined | null, format: UnitFormat): string {
  if (value === undefined || value === null) return `0${format.unit}`
  return `${(value * format.multiply).toFixed(format.decimals)}${format.unit}`
}

/**
 * 格式化组合数值 (high和low字节组合)
 * @param highValue 高位字节值
 * @param lowValue 低位字节值
 * @param format 格式化配置
 * @returns 格式化后的字符串
 */
export function formatCombinedValue(
  highValue: number | undefined,
  lowValue: number | undefined,
  format: UnitFormat,
): string {
  if (highValue === undefined || lowValue === undefined) return `0${format.unit}`
  const combinedValue = ((highValue << 8) | lowValue) * format.multiply
  return `${combinedValue.toFixed(format.decimals)}${format.unit}`
}

/**
 * 格式化日期时间
 * @param date 日期对象或时间戳
 * @param withTime 是否包含时间
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTime(date: Date | number, withTime = true): string {
  const d = date instanceof Date ? date : new Date(date)

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  const dateStr = `${year}-${month}-${day}`

  if (!withTime) return dateStr

  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return `${dateStr} ${hours}:${minutes}:${seconds}`
}

/**
 * 字节大小格式化
 * @param bytes 字节数
 * @param decimals 小数位数
 * @returns 格式化后的字节大小字符串
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
}
