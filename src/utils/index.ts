import { pages, subPackages } from '@/pages.json'
import { isMpWeixin } from './platform'
import { SCREEN_ADAPTATION_CONFIG } from '@/config/adaptation'

const getLastPage = () => {
  // getCurrentPages() 至少有1个元素，所以不再额外判断
  // const lastPage = getCurrentPages().at(-1)
  // 上面那个在低版本安卓中打包会报错，所以改用下面这个【虽然我加了 src/interceptions/prototype.ts，但依然报错】
  const pages = getCurrentPages()
  return pages[pages.length - 1]
}

/** 判断当前页面是否是 tabbar 页  */
// export const getIsTabbar = () => {
//   if (!tabBar) {
//     return false
//   }
//   if (!tabBar.list.length) {
//     // 通常有 tabBar 的话，list 不能有空，且至少有2个元素，这里其实不用处理
//     return false
//   }
//   const lastPage = getLastPage()
//   const currPath = lastPage.route
//   return !!tabBar.list.find((e) => e.pagePath === currPath)
// }

/**
 * 获取当前页面路由的 path 路径和 redirectPath 路径
 * path 如 '/pages/login/index'
 * redirectPath 如 '/pages/demo/base/route-interceptor'
 */
export const currRoute = () => {
  const lastPage = getLastPage()
  const currRoute = (lastPage as any).$page
  // console.log('lastPage.$page:', currRoute)
  // console.log('lastPage.$page.fullpath:', currRoute.fullPath)
  // console.log('lastPage.$page.options:', currRoute.options)
  // console.log('lastPage.options:', (lastPage as any).options)
  // 经过多端测试，只有 fullPath 靠谱，其他都不靠谱
  const { fullPath } = currRoute as { fullPath: string }
  // console.log(fullPath)
  // eg: /pages/login/index?redirect=%2Fpages%2Fdemo%2Fbase%2Froute-interceptor (小程序)
  // eg: /pages/login/index?redirect=%2Fpages%2Froute-interceptor%2Findex%3Fname%3Dfeige%26age%3D30(h5)
  return getUrlObj(fullPath)
}

const ensureDecodeURIComponent = (url: string) => {
  if (url.startsWith('%')) {
    return ensureDecodeURIComponent(decodeURIComponent(url))
  }
  return url
}
/**
 * 解析 url 得到 path 和 query
 * 比如输入url: /pages/login/index?redirect=%2Fpages%2Fdemo%2Fbase%2Froute-interceptor
 * 输出: {path: /pages/login/index, query: {redirect: /pages/demo/base/route-interceptor}}
 */
export const getUrlObj = (url: string) => {
  const [path, queryStr] = url.split('?')
  // console.log(path, queryStr)

  if (!queryStr) {
    return {
      path,
      query: {},
    }
  }
  const query: Record<string, string> = {}
  queryStr.split('&').forEach((item) => {
    const [key, value] = item.split('=')
    // console.log(key, value)
    query[key] = ensureDecodeURIComponent(value) // 这里需要统一 decodeURIComponent 一下，可以兼容h5和微信y
  })
  return { path, query }
}
/**
 * 得到所有的需要登录的 pages，包括主包和分包的
 * 这里设计得通用一点，可以传递 key 作为判断依据，默认是 needLogin, 与 route-block 配对使用
 * 如果没有传 key，则表示所有的 pages，如果传递了 key, 则表示通过 key 过滤
 */
export const getAllPages = (key = 'needLogin') => {
  // 这里处理主包
  const mainPages = [
    ...pages
      .filter((page) => !key || page[key])
      .map((page) => ({
        ...page,
        path: `/${page.path}`,
      })),
  ]
  // 这里处理分包
  const subPages: any[] = []
  subPackages.forEach((subPageObj) => {
    // console.log(subPageObj)
    const { root } = subPageObj

    subPageObj.pages
      .filter((page) => !key || page[key])
      .forEach((page: { path: string } & Record<string, any>) => {
        subPages.push({
          ...page,
          path: `/${root}/${page.path}`,
        })
      })
  })
  const result = [...mainPages, ...subPages]
  // console.log(`getAllPages by ${key} result: `, result)
  return result
}

/**
 * 得到所有的需要登录的 pages，包括主包和分包的
 * 只得到 path 数组
 */
export const getNeedLoginPages = (): string[] => getAllPages('needLogin').map((page) => page.path)

/**
 * 得到所有的需要登录的 pages，包括主包和分包的
 * 只得到 path 数组
 */
export const needLoginPages: string[] = getAllPages('needLogin').map((page) => page.path)

/**
 * 根据微信小程序当前环境，判断应该获取的 baseUrl
 */
export const getEnvBaseUrl = () => {
  // 请求基准地址
  let baseUrl = import.meta.env.VITE_SERVER_BASEURL

  // 微信小程序端环境区分
  if (isMpWeixin) {
    const {
      miniProgram: { envVersion },
    } = uni.getAccountInfoSync()

    switch (envVersion) {
      case 'develop':
        baseUrl = import.meta.env.VITE_SERVER_BASEURL__WEIXIN_DEVELOP || baseUrl
        break
      case 'trial':
        baseUrl = import.meta.env.VITE_SERVER_BASEURL__WEIXIN_TRIAL || baseUrl
        break
      case 'release':
        baseUrl = import.meta.env.VITE_SERVER_BASEURL__WEIXIN_RELEASE || baseUrl
        break
    }
  }

  return baseUrl
}

/**
 * 根据微信小程序当前环境，判断应该获取的 UPLOAD_BASEURL
 */
export const getEnvBaseUploadUrl = () => {
  // 请求基准地址
  let baseUploadUrl = import.meta.env.VITE_UPLOAD_BASEURL

  // 微信小程序端环境区分
  if (isMpWeixin) {
    const {
      miniProgram: { envVersion },
    } = uni.getAccountInfoSync()

    switch (envVersion) {
      case 'develop':
        baseUploadUrl = import.meta.env.VITE_UPLOAD_BASEURL__WEIXIN_DEVELOP || baseUploadUrl
        break
      case 'trial':
        baseUploadUrl = import.meta.env.VITE_UPLOAD_BASEURL__WEIXIN_TRIAL || baseUploadUrl
        break
      case 'release':
        baseUploadUrl = import.meta.env.VITE_UPLOAD_BASEURL__WEIXIN_RELEASE || baseUploadUrl
        break
    }
  }

  return baseUploadUrl
}

/**
 * 添加单位
 * @param value 需要添加单位的值
 * @returns 添加单位后的值
 */
export const convertToViewportUnits = (value: string | number): string => {
  const SCREEN_INCHES = import.meta.env.VITE_SCREEN_INCHES
  const SCREEN_CONFIG = SCREEN_ADAPTATION_CONFIG[SCREEN_INCHES]
  if (typeof value === 'string') {
    if (value.includes('%') || value.includes('vw') || value.includes('vh') || value === 'auto') {
      return value
    }

    const pxValue = parseFloat(value.replace('px', ''))
    if (isNaN(pxValue)) {
      return value
    }

    return `${((pxValue / SCREEN_CONFIG.width) * 100).toFixed(4)}vw`
  } else if (typeof value === 'number') {
    return `${((value / SCREEN_CONFIG.width) * 100).toFixed(4)}vw`
  }
  return value as string
}

/**
 * 检查一个值是否为Date类型
 * @param val 要检查的值
 * @returns 如果值是Date类型，则返回true，否则返回false
 */
export const isDate = (val: unknown): val is Date =>
  Object.prototype.toString.call(val) === '[object Date]' && !Number.isNaN((val as Date).getTime())

/**
 * 深拷贝函数，用于将对象进行完整复制。
 * @param obj 要深拷贝的对象
 * @param cache 用于缓存已复制的对象，防止循环引用
 * @returns 深拷贝后的对象副本
 */
export function deepClone<T>(obj: T, cache: Map<any, any> = new Map()): T {
  // 如果对象为 null 或者不是对象类型，则直接返回该对象
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  // 处理特殊对象类型：日期、正则表达式、错误对象
  if (isDate(obj)) {
    return new Date(obj.getTime()) as any
  }
  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags) as any
  }
  if (obj instanceof Error) {
    const errorCopy = new Error(obj.message) as any
    errorCopy.stack = obj.stack
    return errorCopy
  }

  // 检查缓存中是否已存在该对象的复制
  if (cache.has(obj)) {
    return cache.get(obj)
  }

  // 根据原始对象的类型创建对应的空对象或数组
  const copy: any = Array.isArray(obj) ? [] : {}

  // 将当前对象添加到缓存中
  cache.set(obj, copy)

  // 递归地深拷贝对象的每个属性
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      copy[key] = deepClone(obj[key], cache)
    }
  }

  return copy as T
}

/**
 * 获取分辨率缩放比例
 * @returns 分辨率缩放比例对象，包含宽度和高度缩放比例
 */
export const getResolutionScale = () => {
  const DESIGN_WIDTH = import.meta.env.VITE_DESIGN_WIDTH
  const DESIGN_HEIGHT = import.meta.env.VITE_DESIGN_HEIGHT
  const SCREEN_INCHES = import.meta.env.VITE_SCREEN_INCHES
  const SCREEN_CONFIG = SCREEN_ADAPTATION_CONFIG[SCREEN_INCHES]
  const wScale = SCREEN_CONFIG.width / DESIGN_WIDTH
  const hScale = SCREEN_CONFIG.height / DESIGN_HEIGHT
  return {
    wScale,
    hScale,
  }
}
