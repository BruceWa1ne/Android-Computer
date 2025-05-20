<template>
  <view class="curve-temperature-container">
    <view class="child" v-for="(item, idx) in list" :key="idx">
      <view class="title">
        {{ item.title }}
      </view>
      <view class="temp">
        <view class="cl-1"></view>
        <view class="cl-2">
          <view class="x">
            A相：{{ item.Ax || 0 }}
            <text>℃</text>
          </view>
          <view class="x">
            B相：{{ item.Bx || 0 }}
            <text>℃</text>
          </view>
          <view class="x">
            C相：{{ item.Cx || 0 }}
            <text>℃</text>
          </view>
        </view>
      </view>
      <view class="time">更新时间：{{ item.time || '--' }}</view>
      <view class="btn" @click="handleClick(item)">查看</view>
    </view>
  </view>
  <EchartsResizeModal
    ref="modalRef"
    v-model:visible="visible"
    :use-mask-close="true"
    :title="title"
    :chart-options="options"
    :show-date-select="true"
    @date-change="handleDateSelect"
  />
</template>

<script setup lang="ts">
import type { BaseInfo } from '@/types/base-info'
import { BaseInfoKey } from '@/types/device-data-keys'
import { Ratio } from '@/enum/ratio'
import EchartsResizeModal from '@/components/Echarts-Resize-Modal.vue'
import { CURVE_MAP_OPTIONS } from '@/config/curve'
import { CurveType } from '@/enum/states'
import TablesManager from '@/utils/tables'
import dayjs from 'dayjs'
import { useMenuLifecycle } from '@/utils/menu-lifecycle'

const modalRef = ref<InstanceType<typeof EchartsResizeModal>>()
const visible = ref(false)
const title = ref('')
const options = ref(CURVE_MAP_OPTIONS[CurveType.TEMPERATURE])
const baseInfo = inject(BaseInfoKey) || ref<Partial<BaseInfo>>({})
const dateParams = ref({
  sTime: '',
  eTime: '',
})
const list = ref([
  {
    prop: 'mainBusbar',
    title: '主母排',
    Ax: '',
    Bx: '',
    Cx: '',
    time: '',
  },
  {
    prop: 'breakerUpper',
    title: '断路器上触臂-测温',
    Ax: '',
    Bx: '',
    Cx: '',
    time: '',
  },
  {
    prop: 'breakerLower',
    title: '断路器下触臂-测温',
    Ax: '',
    Bx: '',
    Cx: '',
    time: '',
  },
  {
    prop: 'outletCable',
    title: '出线电缆测温',
    Ax: '',
    Bx: '',
    Cx: '',
    time: '',
  },
])
const curveData = ref({})

const init = () => {
  for (let i = 0; i < list.value.length; i++) {
    const propA = baseInfo.value[list.value[i].prop + 'ATemperature']
    const propB = baseInfo.value[list.value[i].prop + 'BTemperature']
    const propC = baseInfo.value[list.value[i].prop + 'CTemperature']

    list.value[i].Ax =
      propA !== undefined && propA !== null ? (propA * Ratio.ZeroPointOne).toFixed(2) : '0.00'

    list.value[i].Bx =
      propB !== undefined && propB !== null ? (propB * Ratio.ZeroPointOne).toFixed(2) : '0.00'

    list.value[i].Cx =
      propC !== undefined && propC !== null ? (propC * Ratio.ZeroPointOne).toFixed(2) : '0.00'

    list.value[i].time = baseInfo.value.updateTime || '--'
  }
}

const dataFormat = (list) => {
  const initialResult = {
    mainBusbar: [[], [], []],
    breakerUpper: [[], [], []],
    breakerLower: [[], [], []],
    outletCable: [[], [], []],
    addTime: [],
  }

  return list.reduce((result, item) => {
    const props = ['mainBusbar', 'breakerUpper', 'breakerLower', 'outletCable']

    props.forEach((prop) => {
      try {
        const parsedData = JSON.parse(item[prop] || '[0,0,0]')
        for (let i = 0; i < 3; i++) {
          result[prop][i].push(parsedData[i] ?? 0)
        }
      } catch (error) {
        for (let i = 0; i < 3; i++) {
          result[prop][i].push(0)
        }
      }
    })

    result.addTime.push(item.addTime || '')
    return result
  }, initialResult)
}

async function getCurveData() {
  const params = {
    sTime: dateParams.value.sTime || dayjs().format('YYYY-MM-DD') + ' 00:00:00',
    eTime: dateParams.value.eTime || dayjs().format('YYYY-MM-DD') + ' 23:59:59',
  }
  const res = await TablesManager.queryTableData('temp_curve', params)
  if (Array.isArray(res) && res.length > 0) {
    const data = dataFormat(res)
    curveData.value = data
    if (visible.value && title.value) {
      const currentProp = list.value.find((item) => item.title === title.value).prop
      const propData = curveData.value[currentProp]
      options.value.xAxis.data = propData.addTime
      options.value.yAxis.data = propData
      options.value.series[0].data = propData[0]
      options.value.series[1].data = propData[1]
      options.value.series[2].data = propData[2]
      modalRef.value?.updateChartData(options.value)
    }
  } else {
    curveData.value = {}
    uni.showToast({
      title: '暂无数据',
      icon: 'none',
    })
    if (visible.value && title.value) {
      options.value.xAxis.data = []
      options.value.yAxis.data = []
      options.value.series[0].data = []
      options.value.series[1].data = []
      options.value.series[2].data = []
      modalRef.value?.updateChartData(options.value)
    }
  }
}

const handleDateSelect = (date) => {
  if (!date) return

  let selectedDate
  if (typeof date === 'object' && date.startTime && date.endTime) {
    dateParams.value.sTime = date.startTime
    dateParams.value.eTime = date.endTime
  } else {
    selectedDate = dayjs(date)
    dateParams.value.sTime = selectedDate.startOf('day').format('YYYY-MM-DD HH:mm:ss')
    dateParams.value.eTime = selectedDate.endOf('day').format('YYYY-MM-DD HH:mm:ss')
  }

  getCurveData()
}

const handleClick = (item: any) => {
  title.value = item.title
  visible.value = true
  const data = curveData.value[item.prop] || {}
  options.value.xAxis.data = data.addTime || []
  options.value.yAxis.data = data || []
  options.value.series[0].data = data[0] || []
  options.value.series[1].data = data[1] || []
  options.value.series[2].data = data[2] || []
  modalRef.value?.updateChartData(options.value)
}

useMenuLifecycle('curve-temperature', () => {
  init()
})

onMounted(() => {
  init()
})
</script>

<style scoped lang="scss">
.curve-temperature-container {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  text-align: center;
  .child {
    width: 25%;
    height: 310px;
    margin: 1% 1%;
    background-image: url('/static/frame/temp-bg.png');
    background-size: 100% 100%;

    .title {
      margin-top: 23px;
      margin-left: 32px;
      font-family: Source Han Sans CN;
      font-size: 18px;
      font-weight: 500;
      color: #00deff;
      text-align: left;
    }
    .temp {
      display: flex;
      align-items: center;
      height: 40%;
      .cl-1 {
        width: 106px;
        height: 98px;
        margin-top: 25px;
        margin-right: 17px;
        margin-bottom: 27px;
        margin-left: 31px;
        background-image: url('/static/frame/temp-beacon.png');
        background-size: 100% 100%;
      }
      .cl-2 {
        font-family: Source Han Sans CN;
        font-size: 14px;
        font-weight: 400;
        color: #ffffff;
        .x {
          margin: 5px 0;
        }
      }
    }
    .time {
      margin-bottom: 23px;
      font-family: Source Han Sans CN;
      font-size: 14px;
      font-weight: 400;
      color: #ffffff;
      text-align: center;
    }
    .btn {
      width: 120px;
      height: 47px;
      margin: 8px 30%;
      font-family: Source Han Sans CN;
      font-size: 16px;
      font-weight: 400;
      line-height: 47px;
      color: #ffffff;
      background-image: url('/static/frame/temp-btn-L.png');
      background-size: 100% 100%;
    }
  }
}

.state0 {
  color: #00ffcc;
}
.state1 {
  color: orange;
}
.state2 {
  color: #ff4200;
}
</style>
