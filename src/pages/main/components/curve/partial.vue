<template>
  <view class="curve-partial-container">
    <view class="filter">
      <view>日期：</view>
      <view class="date-picker">
        <uni-datetime-picker
          type="date"
          :clear-icon="false"
          :start="dayjs().subtract(3, 'year').startOf('year').valueOf()"
          :end="dayjs().valueOf()"
          v-model="selectedDate"
          @change="handleDateChange"
        />
      </view>
      <view class="btn btn-prev" @click="handleDayChange(-1)">前一天</view>
      <view
        class="btn btn-next"
        :class="{ 'btn-disabled': isToday }"
        @click="!isToday && handleDayChange(1)"
      >
        后一天
      </view>
    </view>
    <view class="curve-partial-chart">
      <l-echart ref="partialRef" @finished="partialChartInit"></l-echart>
    </view>
  </view>
</template>

<script setup lang="ts">
import { debounce } from '@/utils/eventTools'
import * as echarts from '@/static/echarts.esm'
import { CurveType } from '@/enum/states'
import { CURVE_MAP_OPTIONS } from '@/config/curve'
import dayjs from 'dayjs'
import TablesManager from '@/utils/tables'
import { useMenuLifecycle } from '@/utils/menu-lifecycle'

const selectedDate = ref(dayjs().valueOf())
const partialRef = ref()
const options = ref(CURVE_MAP_OPTIONS[CurveType.PARTIAL])

const isToday = computed(() => {
  const today = dayjs().startOf('day')
  const selected = dayjs(selectedDate.value).startOf('day')
  return selected.isSame(today)
})

const handleDateChange = (date: number) => {
  selectedDate.value = date
  getCurveData()
}

const handleDayChangeRaw = (days: number) => {
  if (days > 0 && isToday.value) return

  const newDate = dayjs(selectedDate.value).add(days, 'day').valueOf()
  selectedDate.value = newDate
  getCurveData()
}

const handleDayChange = debounce(handleDayChangeRaw, 300, false)

const partialChartInit = async () => {
  const chart = await partialRef.value.init(echarts)
  chart.setOption(options.value)
  handleResize()
}

const dataFormat = (list) => {
  return {
    ultrasonicDischarge: list.map((item) => item.ultrasonicDischarge),
    transientGround: list.map((item) => item.transientGround),
    stepTime: list.map((item) => item.addTime),
  }
}

async function getCurveData() {
  uni.showLoading({
    title: '加载中...',
    mask: true,
  })
  const params = {
    sTime: dayjs(selectedDate.value).format('YYYY-MM-DD') + ' 00:00:00',
    eTime: dayjs(selectedDate.value).format('YYYY-MM-DD') + ' 23:59:59',
  }
  try {
    const res = await TablesManager.queryTableData('partial_curve', params)
    const hasData = Array.isArray(res) && res.length > 0

    const chartData = hasData
      ? dataFormat(res)
      : { stepTime: [], ultrasonicDischarge: [], transientGround: [] }

    options.value.xAxis.data = chartData.stepTime
    options.value.series[0].data = chartData.ultrasonicDischarge
    options.value.series[1].data = chartData.transientGround

    partialRef.value?.setOption(options.value)
    setTimeout(() => {
      uni.hideLoading()
    }, 1000)
  } catch (error) {
    console.error('获取曲线数据失败:', error)
    uni.hideLoading()
  }
}

const handleResize = debounce(() => {
  setTimeout(() => {
    partialRef.value && partialRef.value.resize()
  }, 300)
}, 100)

useMenuLifecycle('curve-partial', () => {
  getCurveData()
})

onMounted(() => {
  getCurveData()
})
</script>

<style scoped lang="scss">
.curve-partial-container {
  width: 100%;
  height: 100%;
}

.filter {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 40px;
  margin-bottom: 15px;
  font-size: 12px;
  color: #fff;

  .date-picker {
    width: 220px;
    margin: 0 15px;
  }

  .btn {
    box-sizing: border-box;
    width: 91px;
    height: 30px;
    padding: 4px 12px;
    margin: 0 8px;
    text-align: center;
    background-image: url('/static/frame/temp-btn-M.png');
    background-size: 100% 100%;
    border-radius: 4px;
    transition: all 0.1s ease-in-out;

    &:active:not(.btn-disabled) {
      box-shadow: 0 0 5px rgba(7, 217, 255, 0.7);
      opacity: 0.9;
      transform: scale(0.95);
    }

    &.btn-disabled {
      cursor: not-allowed;
      filter: grayscale(50%);
      opacity: 0.5;
    }
  }
}

.curve-partial-chart {
  width: 100%;
  height: calc(100% - 55px);
}

.curve-partial-chart :deep(canvas) {
  width: 100% !important;
  height: 100% !important;
}

::v-deep .uni-date-x .icon-calendar {
  font-size: 22px !important;
}

::v-deep .uni-date-x--border {
  border: none;
}

::v-deep .uni-date-x {
  height: 30px;
  color: #fff;
  background: #051635;
  border: 1px solid #07d9ff;
  border-radius: 4px;
}
</style>
