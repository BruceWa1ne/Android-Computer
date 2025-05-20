/**
 * 防抖函数
 * @param func 需要防抖的函数
 * @param wait 防抖时间间隔（毫秒）
 * @param immediate 是否立即执行
 * @returns 返回一个包装后的防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait = 1000,
  immediate = true,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null
  return function (...args: Parameters<T>) {
    if (timer) {
      clearTimeout(timer)
    }

    if (immediate) {
      const callNow = !timer
      timer = setTimeout(() => {
        timer = null
      }, wait)
      if (callNow) func(...args)
    } else {
      timer = setTimeout(() => {
        func(...args)
        timer = null
      }, wait)
    }
  }
}

/**
 * 节流函数
 * @param fun
 * @param wait
 * @returns
 */
export function throttle(fun: (args?: any) => void, wait = 1000): () => void {
  let timers: ReturnType<typeof setTimeout> | null
  return function (...args: any) {
    if (!timers) {
      timers = setTimeout(() => {
        fun(...args)
        timers = null
      }, wait)
    }
  }
}
