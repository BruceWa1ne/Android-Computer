export interface MenuItem {
  name: string
  code: string
}

export const MAIN_MENU_ITEMS: MenuItem[] = [
  { name: '设备监控', code: 'deviceMonitor' },
  { name: '监测分析', code: 'monitorAnalysis' },
  { name: '数据曲线', code: 'dataCurve' },
  { name: '记录', code: 'record' },
  { name: '设置', code: 'setting' },
]

export const ANALYSIS_MENU_ITEMS: MenuItem[] = [
  {
    name: '机械特性在线监测',
    code: 'analysis-mechanical',
  },
  {
    name: '温升监测',
    code: 'analysis-temperature',
  },
  {
    name: '局放及温湿度监测',
    code: 'analysis-partial',
  },
]

export const CURVE_MENU_ITEMS: MenuItem[] = [
  {
    name: '机械特性曲线',
    code: 'curve-mechanical',
  },
  {
    name: '温升曲线',
    code: 'curve-temperature',
  },
  {
    name: '局放数据曲线',
    code: 'curve-partial',
  },
]

export const SETTING_MENU_ITEMS: MenuItem[] = [
  { name: '延时设置', code: 'setting-delay' },
  { name: '告警设置', code: 'setting-alarm' },
  { name: '后台管理', code: 'setting-backstage' },
  { name: '数据库管理', code: 'setting-database' },
  { name: '摄像头IP地址设置', code: 'setting-camera' },
]

export default {
  MAIN_MENU_ITEMS,
  ANALYSIS_MENU_ITEMS,
  CURVE_MENU_ITEMS,
  SETTING_MENU_ITEMS,
}
