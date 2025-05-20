import { CurveType } from '@/enum/states'
import { fitPx } from '@/utils/resize'

// 行程曲线
export const CURVE_TRAVEL = {
  color: ['#07D9FF', '#FF5959'],
  grid: {
    top: '26%',
    bottom: '2%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    name: 'ms',
    color: '#fff',
    fontSize: fitPx(12),
    nameTextStyle: {
      color: '#fff',
      fontSize: fitPx(12),
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      show: true,
      color: '#fff',
      fontSize: fitPx(12),
      interval: 20,
      rotate: 35,
    },
    axisLine: {
      lineStyle: {
        color: '#074978',
      },
    },
  },
  yAxis: {
    type: 'value',
    name: 'mm',
    nameTextStyle: {
      color: '#fff',
      fontSize: fitPx(12),
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      show: true,
      color: '#fff',
      fontSize: fitPx(12),
    },
    axisLine: {
      show: false,
    },
    splitLine: {
      show: true,
      interval: 0,
      lineStyle: {
        color: ['#074978'],
        type: [5, 10],
        dashOffset: 5,
      },
    },
  },
  series: [
    {
      data: [],
      type: 'line',
      showSymbol: false,
    },
    {
      data: [],
      type: 'line',
      showSymbol: false,
      lineStyle: {
        type: 'dashed',
        dashOffset: 5,
      },
    },
  ],
}

// 角度曲线
export const CURVE_ANGLE = {
  color: ['#07D9FF', '#FF5959'],
  grid: {
    top: '26%',
    bottom: '2%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    name: 'ms',
    nameTextStyle: {
      color: '#fff',
      fontSize: fitPx(12),
    },
    color: '#fff',
    axisTick: {
      show: false,
    },
    axisLabel: {
      show: true,
      color: '#fff',
      fontSize: fitPx(12),
      interval: 20,
      rotate: 35,
    },
    axisLine: {
      lineStyle: {
        color: '#074978',
      },
    },
  },
  yAxis: {
    type: 'value',
    name: '°',
    nameTextStyle: {
      color: '#fff',
      fontSize: fitPx(12),
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      show: true,
      color: '#fff',
      fontSize: fitPx(12),
    },
    axisLine: {
      show: false,
    },
    splitLine: {
      show: true,
      interval: 0,
      lineStyle: {
        color: ['#074978'],
        type: [5, 10],
        dashOffset: 5,
      },
    },
  },
  series: [
    {
      data: [],
      type: 'line',
      showSymbol: false,
    },
    {
      data: [],
      type: 'line',
      showSymbol: false,
      lineStyle: {
        type: 'dashed',
        dashOffset: 5,
      },
    },
  ],
}

// 线圈电流曲线
export const CURVE_COIL = {
  color: ['#07FF76', '#FF5959'],
  grid: {
    top: '26%',
    bottom: '2%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    name: 'ms',
    nameTextStyle: {
      color: '#fff',
      fontSize: fitPx(12),
    },
    color: '#fff',
    axisTick: {
      show: false,
    },
    axisLabel: {
      show: true,
      color: '#fff',
      fontSize: fitPx(12),
      interval: 20,
      rotate: 35,
    },
    axisLine: {
      lineStyle: {
        color: '#074978',
      },
    },
  },
  yAxis: {
    type: 'value',
    name: 'A',
    nameTextStyle: {
      color: '#fff',
      fontSize: fitPx(12),
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      show: true,
      color: '#fff',
      fontSize: fitPx(12),
    },
    axisLine: {
      show: false,
    },
    splitLine: {
      show: true,
      interval: 0,
      lineStyle: {
        color: ['#074978'],
        type: [5, 10],
        dashOffset: 5,
      },
    },
  },
  series: [
    {
      data: [],
      type: 'line',
      showSymbol: false,
    },
    {
      data: [],
      type: 'line',
      showSymbol: false,
      lineStyle: {
        type: 'dashed',
        dashOffset: 5,
      },
    },
  ],
}

// 储能曲线
export const CURVE_ENERGY = {
  color: ['#FFA359', '#FF5959'],
  grid: {
    top: '26%',
    bottom: '2%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    name: 'ms',
    nameTextStyle: {
      color: '#fff',
      fontSize: fitPx(12),
    },
    color: '#fff',
    axisTick: {
      show: false,
    },
    axisLabel: {
      show: true,
      color: '#fff',
      fontSize: fitPx(12),
      interval: 50,
      rotate: 35,
    },
    axisLine: {
      lineStyle: {
        color: '#074978',
      },
    },
  },
  yAxis: {
    type: 'value',
    name: 'A',
    nameTextStyle: {
      color: '#fff',
      fontSize: fitPx(12),
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      show: true,
      color: '#fff',
      fontSize: fitPx(12),
    },
    axisLine: {
      show: false,
    },
    splitLine: {
      show: true,
      interval: 0,
      lineStyle: {
        color: ['#074978'],
        type: [5, 10],
        dashOffset: 5,
      },
    },
  },
  series: [
    {
      data: [],
      type: 'line',
      showSymbol: false,
    },
    {
      data: [],
      type: 'line',
      showSymbol: false,
      lineStyle: {
        type: 'dashed',
        dashOffset: 5,
      },
    },
  ],
}

// 温度曲线
export const CURVE_TEMPERATURE = {
  color: ['#07D9FF', '#FFA359', '#07FF76'],
  legend: {
    itemWidth: fitPx(10),
    itemHeight: fitPx(10),
    textStyle: {
      fontSize: fitPx(12),
      color: '#fff',
    },
    icon: 'circle',
    data: ['A相温度', 'B相温度', 'C相温度'],
  },
  xAxis: {
    type: 'category',
    name: 'ms',
    interval: 0,
    nameTextStyle: {
      color: '#fff',
      fontSize: fitPx(12),
    },
    color: '#fff',
    axisTick: {
      show: false,
    },
    axisLabel: {
      show: true,
      color: '#fff',
      fontSize: fitPx(12),
    },
    axisLine: {
      lineStyle: {
        color: '#074978',
      },
    },
    data: [],
  },
  yAxis: {
    type: 'value',
    name: '℃',
    nameTextStyle: {
      color: '#fff',
      fontSize: fitPx(12),
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      show: true,
      color: '#fff',
      fontSize: fitPx(12),
    },
    axisLine: {
      show: false,
    },
    splitLine: {
      show: true,
      interval: 0,
      lineStyle: {
        color: ['#074978'],
        type: [5, 10],
        dashOffset: 5,
      },
    },
    data: [],
  },
  series: [
    {
      type: 'line',
      showSymbol: false,
      name: 'A相温度',
      data: [],
    },
    {
      type: 'line',
      showSymbol: false,
      name: 'B相温度',
      data: [],
    },
    {
      type: 'line',
      showSymbol: false,
      name: 'C相温度',
      data: [],
    },
  ],
}

// 局放曲线
export const CURVE_PARTIAL = {
  color: ['#FF5959', '#FFA359'],
  grid: {
    top: '10%',
    bottom: '12%',
    containLabel: true,
  },
  dataZoom: [
    {
      type: 'inside',
      start: 0,
      end: 100,
    },
    {
      bottom: '4%',
      start: 0,
      end: 100,
      height: fitPx(22),
    },
  ],
  legend: {
    itemWidth: fitPx(10),
    itemHeight: fitPx(10),
    textStyle: {
      color: '#fff',
      fontSize: fitPx(12),
    },
    icon: 'circle',
    data: ['超声波局放值', '暂态地电波局放值'],
  },
  xAxis: {
    type: 'category',
    name: 'ms',
    interval: 0,
    nameTextStyle: {
      color: '#fff',
      fontSize: fitPx(12),
    },
    color: '#fff',
    fontSize: fitPx(12),
    axisTick: {
      show: false,
    },
    axisLabel: {
      show: true,
      color: '#fff',
      fontSize: fitPx(12),
    },
    axisLine: {
      lineStyle: {
        color: '#074978',
      },
    },
    data: [],
  },
  yAxis: {
    type: 'value',
    name: 'dB',
    nameTextStyle: {
      color: '#fff',
      fontSize: fitPx(12),
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      show: true,
      color: '#fff',
      fontSize: fitPx(12),
    },
    axisLine: {
      show: false,
    },
    splitLine: {
      show: true,
      interval: 0,
      lineStyle: {
        color: ['#074978'],
        type: [5, 10],
        dashOffset: 5,
      },
    },
  },
  series: [
    {
      type: 'line',
      showSymbol: false,
      name: '超声波局放值',
      data: [],
    },
    {
      type: 'line',
      showSymbol: false,
      name: '暂态地电波局放值',
      data: [],
    },
  ],
}

// 曲线配置
export const CURVE_MAP_OPTIONS = {
  [CurveType.TRAVEL]: CURVE_TRAVEL,
  [CurveType.ANGLE]: CURVE_ANGLE,
  [CurveType.COIL]: CURVE_COIL,
  [CurveType.ENERGY]: CURVE_ENERGY,
  [CurveType.TEMPERATURE]: CURVE_TEMPERATURE,
  [CurveType.PARTIAL]: CURVE_PARTIAL,
}
