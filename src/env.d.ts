/// <reference types="vite/client" />
/// <reference types="vite-svg-loader" />

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 屏幕尺寸
type ScreenInches = '10.1' | '13.3'

interface ImportMetaEnv {
  /** 网站应用名称 */
  readonly VITE_APP_TITLE: string
  /** LOGO名称 */
  readonly VITE_LOGO_NAME: string
  /** 服务端口号 */
  readonly VITE_SERVER_PORT: string
  /** 后台接口地址 */
  readonly VITE_SERVER_BASEURL: string
  /** H5是否需要代理 */
  readonly VITE_APP_PROXY: 'true' | 'false'
  /** H5是否需要代理，需要的话有个前缀 */
  readonly VITE_APP_PROXY_PREFIX: string // 一般是/api
  /** 上传图片地址 */
  readonly VITE_UPLOAD_BASEURL: string
  /** 是否清除console */
  readonly VITE_DELETE_CONSOLE: string
  /** 串口调试日志 */
  readonly VITE_APP_SERIAL_DEBUG: 'true' | 'false'
  /** 68串口调试日志 */
  readonly VITE_APP_SERIAL_68_DEBUG: 'true' | 'false'
  /** 周期性刷新数据调试日志 */
  readonly VITE_APP_PERIODIC_DEBUG: 'true' | 'false'
  /** 内存监控 */
  readonly VITE_APP_MEMORY_DEBUG: 'true' | 'false'
  /** 曲线监控 */
  readonly VITE_APP_CURVE_DEBUG: 'true' | 'false'
  /** 设计稿宽度 */
  readonly VITE_DESIGN_WIDTH: number
  /** 设计稿高度 */
  readonly VITE_DESIGN_HEIGHT: number
  /** 屏幕尺寸 */
  readonly VITE_SCREEN_INCHES: ScreenInches
  // 更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
