<!--
 * @Author: Stephen_zhou
 * @Date: 2025-04-08 10:19:14
 * @LastEditors: Stephen_zhou
 * @LastEditTime: 2025-04-08 10:19:14
 * @Description: 图表全屏自适应弹窗组件
-->
<template>
  <Modal
    ref="modalRef"
    :visible="visible"
    :title="title"
    :useMaskClose="useMaskClose"
    :showConfirmButton="false"
    width="70%"
    fullscreen
    @close="handleClose"
    @onFullscreen="handleFullscreen"
  >
    <view class="full-screen-content">
      <view v-if="showDateSelect" class="date-select">
        <view>日期：</view>
        <view class="date-picker">
          <uni-datetime-picker
            type="date"
            :start="dayjs().subtract(3, 'year').startOf('year').valueOf()"
            :end="dayjs().valueOf()"
            :clear-icon="false"
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
      <view class="chart-container" :class="{ 'fullscreen-mode': isFullscreen }">
        <l-echart ref="chartRef" @finished="initChart"></l-echart>
      </view>
    </view>
  </Modal>
</template>

<script lang="ts" setup>
import * as echarts from '@/static/echarts.esm'
import Modal from './Modal.vue'
import { ref, watch, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import dayjs from 'dayjs'
import { fitPx } from '@/utils/resize'
import { debounce } from '@/utils/eventTools'

interface DateRange {
  startTime: string
  endTime: string
}

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  useMaskClose: {
    type: Boolean,
    default: false,
  },
  showDateSelect: {
    type: Boolean,
    default: true,
  },
  chartOptions: {
    type: Object,
    default: () => {},
  },
})
const emit = defineEmits(['close', 'update:visible', 'date-change'])

const isToday = computed(() => {
  const today = dayjs().startOf('day')
  const selected = dayjs(selectedDate.value).startOf('day')
  return selected.isSame(today)
})

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      if (props.showDateSelect) {
        initDate()
      }
    }
  },
)

const defaultChartConfig = {
  grid: {
    top: '10%',
    bottom: '10%',
    right: '6%',
    left: '6%',
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
}

const modalRef = ref(null)
const chartRef = ref(null)
const selectedDate = ref(dayjs().valueOf())
const isFullscreen = ref(false)

const initDate = () => {
  selectedDate.value = dayjs().valueOf()
  emitDateChange(selectedDate.value)
}

const initChart = async () => {
  const chartBox = await chartRef.value.init(echarts)
  const mergedOptions = {
    ...props.chartOptions,
    grid: defaultChartConfig.grid,
    dataZoom: defaultChartConfig.dataZoom,
  }
  chartBox.setOption(mergedOptions)
  resizeChart()
}

const formatDateRange = (timestamp: number): DateRange => {
  const date = dayjs(timestamp)
  const dateStr = date.format('YYYY-MM-DD')
  return {
    startTime: `${dateStr} 00:00:00`,
    endTime: `${dateStr} 23:59:59`,
  }
}

const handleDateChange = (date: number) => {
  selectedDate.value = date
  emit('date-change', date)
  emitDateChange(date)
}

const handleDayChangeRaw = (days: number) => {
  if (days > 0 && isToday.value) return

  const newDate = dayjs(selectedDate.value).add(days, 'day').valueOf()
  selectedDate.value = newDate
  emit('date-change', newDate)
  emitDateChange(newDate)
}

const emitDateChange = (timestamp: number) => {
  const dateRange = formatDateRange(timestamp)
  emit('date-change', dateRange)
}

function handleClose() {
  emit('update:visible', false)
}

function handleFullscreen() {
  isFullscreen.value = !isFullscreen.value
  resizeChart()
}

const resizeChart = debounce(function () {
  if (chartRef.value) {
    setTimeout(() => {
      chartRef.value.resize()
    }, 300)
  }
}, 300)

const updateChartData = async (data) => {
  if (chartRef.value) {
    chartRef.value.setOption(data)
  }
}

const handleDayChange = debounce(handleDayChangeRaw, 300, false)

defineExpose({
  hideAnimation: () => {
    modalRef.value?.hideAnimation()
  },
  updateChartData,
})
</script>

<style lang="scss" scoped>
.full-screen-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 0;

  .date-select {
    display: flex;
    align-items: center;
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

  .chart-container {
    position: relative;
    width: 100%;
    height: calc(100vh - 350px);

    &.fullscreen-mode {
      height: calc(100vh - 150px);
    }
  }

  .chart-container :deep(canvas) {
    width: 100% !important;
    height: 100% !important;
  }
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
