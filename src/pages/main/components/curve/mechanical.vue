<template>
  <view class="curve-mechanical-container">
    <view class="curve-grid">
      <view class="curve-item top-left">
        <view class="curve-header first-header">
          <view class="tabs">
            <image class="arrow-icon" src="/static/frame/arrow-right.png" mode="aspectFit"></image>
            <view
              class="tab-item"
              :class="{ active: activeTab === CurveType.TRAVEL }"
              @click="onTabChange(CurveType.TRAVEL)"
            >
              行程曲线
            </view>
            <view
              class="tab-item"
              :class="{ active: activeTab === CurveType.ANGLE }"
              @click="onTabChange(CurveType.ANGLE)"
            >
              角度曲线
            </view>
          </view>
          <view
            class="i-material-symbols-fullscreen text-20px"
            @click="
              handleFullScreen(
                activeTab === CurveType.TRAVEL ? '行程曲线' : '角度曲线',
                curveOptions.travelAngle,
              )
            "
          ></view>
        </view>
        <view class="curve-content">
          <l-echart ref="travelAngleChart" @finished="travelAngleChartInit"></l-echart>
        </view>
      </view>

      <view class="curve-item top-right">
        <view class="curve-header">
          <view class="header-title header-bg">
            <text>线圈电流</text>
          </view>
          <view
            class="i-material-symbols-fullscreen text-20px"
            @click="handleFullScreen('线圈电流', curveOptions.coil)"
          ></view>
        </view>
        <view class="curve-content">
          <l-echart ref="coilChart" @finished="coilChartInit"></l-echart>
        </view>
      </view>

      <view class="curve-item bottom-left">
        <view class="curve-header">
          <view class="header-title header-bg">
            <text>特性数据</text>
          </view>
        </view>
        <view class="curve-content flex px-20rpx py-4rpx">
          <view class="row">
            <view class="column" v-for="(left, index) in dataLeft" :key="index">
              <view class="col-1">{{ left.name }}：</view>
              <view class="col-2">{{ left.data || '--' }} {{ left.unit }}</view>
            </view>
          </view>
          <view class="row">
            <view class="column" v-for="(right, idx) in dataRight" :key="idx">
              <view class="col-1">{{ right.name }}：</view>
              <view class="col-2">{{ right.data || '--' }} {{ right.unit }}</view>
            </view>
          </view>
        </view>
      </view>

      <view class="curve-item bottom-right">
        <view class="curve-header">
          <view class="header-title header-bg">
            <text>储能电机曲线</text>
          </view>
          <view
            class="i-material-symbols-fullscreen text-20px"
            @click="handleFullScreen('储能电机曲线', curveOptions.energy)"
          ></view>
        </view>
        <view class="curve-content">
          <l-echart ref="energyChart" @finished="energyChartInit"></l-echart>
        </view>
      </view>
    </view>
  </view>
  <EchartsResizeModal
    v-model:visible="modalVisible.fullscreen"
    :use-mask-close="true"
    :title="fullScreenTitle"
    :chart-options="curveOptionsFullScreen"
    :show-date-select="false"
  />
</template>

<script setup lang="ts">
import * as echarts from '@/static/echarts.esm'
import { ref, inject, computed, onMounted, onUnmounted } from 'vue'
import { CurveType, DataType } from '@/enum/states'
import { CURVE_MAP_OPTIONS } from '@/config/curve'
import { debounce } from '@/utils/eventTools'
import EchartsResizeModal from '@/components/Echarts-Resize-Modal.vue'
import TablesManager from '@/utils/tables'
import { useMenuLifecycle } from '@/utils/menu-lifecycle'

const activeTab = ref(CurveType.TRAVEL) // 默认选中行程曲线

const modalVisible = ref({
  fullscreen: false,
  filtter: false,
})
const fullScreenTitle = ref('')
const dataLeft = ref([
  { label: 'type', name: '动作类型', data: '', unit: '' },
  { label: 'energyTime', name: '储能时间', data: '', unit: '' },
  { label: 'actionStartTime', name: '动作开始时间', data: '', unit: '' },
  { label: 'actionEndTime', name: '动作结束时间', data: '', unit: '' },
  { label: 'distance', name: '行程', data: '', unit: 'mm' },
  { label: 'time', name: '时间', data: '', unit: 'ms' },
  { label: 'overContactDistance', name: '超程', data: '', unit: 'mm' },
])

const dataRight = ref([
  { label: 'num', name: '动作次数', data: '', unit: '' },
  { label: 'maxCoil', name: '最大动作电流', data: '', unit: 'A' },
  { label: 'actionTime', name: '动作时间', data: '', unit: 'ms' },
  { label: 'speed', name: '速度', data: '', unit: 'm/s' },
  { label: 'overDistance', name: '过冲', data: '', unit: 'mm' },
  { label: 'contactDistance', name: '开距', data: '', unit: 'mm' },
  { label: 'bounceValue', name: '分闸反弹', data: '', unit: 'mm' },
])

const travelAngleChart = ref()
const coilChart = ref()
const energyChart = ref()
const curveOptions = ref<Record<string, any>>({
  travelAngle: CURVE_MAP_OPTIONS[CurveType.TRAVEL],
  coil: CURVE_MAP_OPTIONS[CurveType.COIL],
  energy: CURVE_MAP_OPTIONS[CurveType.ENERGY],
})
const curveOptionsFullScreen = ref({})
const curveDataSource = ref({
  standard: {
    travel: [],
    angle: [],
    coil: [],
    energy: [],
  },
  travel: {
    yData: [],
  },
  angle: {
    yData: [],
  },
  coil: {
    yData: [],
  },
  energy: {
    yData: [],
  },
})

const standardDataOpen = ref({
  angle: [],
  travel: [],
  coil: [],
  energy: [],
})

const standardDataClose = ref({
  angle: [],
  travel: [],
  coil: [],
  energy: [],
})

const standardData = ref({
  angle: [],
  travel: [],
  coil: [],
  energy: [],
})

const isLoading = ref(false)

const dataFormat = (data) => {
  try {
    data.travel = typeof data.travel === 'string' ? JSON.parse(data.travel) : data.travel
    data.coil = typeof data.coil === 'string' ? JSON.parse(data.coil) : data.coil
    data.angle = typeof data.angle === 'string' ? JSON.parse(data.angle) : data.angle
    data.energy = typeof data.energy === 'string' ? JSON.parse(data.energy) : data.energy
  } catch (error) {
    console.error('JSON 解析错误:', error)
    return { angle: [], travel: [], coil: [], energy: [] }
  }

  if (!data.angle?.data || !data.coil?.data || !data.travel?.data || !data.energy?.data) {
    console.warn('数据结构不完整')
    return { angle: [], travel: [], coil: [], energy: [] }
  }

  const dataLength = {
    coil: data.coil.data.length,
    angle: data.angle.data.length,
    energy: data.energy.data.length,
    travel: data.travel.data.length,
  }

  const coil = new Array(dataLength.coil)
  const energy = new Array(dataLength.energy)
  const angle = new Array(dataLength.angle)
  const travel = new Array(dataLength.travel)

  if (Array.isArray(data.angle.data) && data.angle.data.length > 0) {
    const minAngle = Math.min(...data.angle.data)
    data.angle.data = data.angle.data.map((v) => v - minAngle)
  }

  const coilData = data.coil.data
  const coilTime = data.coil.stepTime || []
  for (let i = 0; i < dataLength.coil; i++) {
    coil[i] = [coilTime[i] || 0, ((coilData[i] || 0) * 0.01).toFixed(2)]
  }

  const angleData = data.angle.data
  const angleTime = data.angle.stepTime || []
  for (let i = 0; i < dataLength.angle; i++) {
    angle[i] = [angleTime[i] || 0, ((angleData[i] || 0) * 0.01).toFixed(2)]
  }

  const energyData = data.energy.data
  const energyTime = data.energy.stepTime || []
  for (let i = 0; i < dataLength.energy; i++) {
    energy[i] = [energyTime[i] || 0, ((energyData[i] || 0) * 0.01).toFixed(2)]
  }

  const travelData = data.travel.data
  const travelTime = data.travel.stepTime || []
  for (let i = 0; i < dataLength.travel; i++) {
    travel[i] = [travelTime[i] || 0, travelData[i] || 0]
  }

  return { angle, travel, coil, energy }
}

/**
 * 统一初始化曲线数据
 * 同时获取标准曲线数据和当前曲线数据，完成后进行处理和渲染
 * @returns {Promise<void>}
 */
const initCurveData = async (): Promise<void> => {
  try {
    isLoading.value = true

    const [standardDataResults, curveData] = await Promise.all([
      loadStandardCurveData(),
      loadCurveData(),
    ]).catch((error) => {
      console.error('加载数据失败:', error)
      return [[], []]
    })
    const openData = standardDataResults[0]
    const closeData = standardDataResults[1]
    if (openData && Array.isArray(openData) && openData.length > 0) {
      standardDataOpen.value = dataFormat(openData[0])
    }
    if (closeData && Array.isArray(closeData) && closeData.length > 0) {
      standardDataClose.value = dataFormat(closeData[0])
    }

    if (curveData && Array.isArray(curveData) && curveData.length > 0) {
      await processAndRenderData(curveData[0])
    } else {
      console.warn('未获取到曲线数据，视图可能为空')
      await clearChartData()
    }
  } catch (error) {
    console.error('初始化曲线数据失败:', error)
    await clearChartData()
  } finally {
    isLoading.value = false
  }
}

/**
 * 清空图表数据
 * 当没有数据或发生错误时，清空图表显示
 * @returns {Promise<void>}
 */
const clearChartData = async (): Promise<void> => {
  curveDataSource.value = {
    standard: { travel: [], angle: [], coil: [], energy: [] },
    travel: { yData: [] },
    angle: { yData: [] },
    coil: { yData: [] },
    energy: { yData: [] },
  }

  await Promise.all([travelAngleChartInit(), coilChartInit(), energyChartInit()]).catch((err) =>
    console.error('清空图表失败:', err),
  )
}

/**
 * 加载标准曲线数据
 * 同时获取合闸和分闸的标准曲线数据
 * @returns {Promise<Array>} 标准曲线数据结果
 */
const loadStandardCurveData = async (): Promise<any[]> => {
  try {
    const [closeResult, openResult] = await Promise.all([
      TablesManager.getStandardData('standardDataCoil', { type: 1 }),
      TablesManager.getStandardData('standardDataCoil', { type: 0 }),
    ])

    console.log('合闸标准曲线数据:', closeResult)
    if (closeResult && Array.isArray(closeResult) && closeResult.length > 0) {
      try {
        const data = dataFormat(closeResult[0])
        standardDataClose.value.angle = data.angle
        standardDataClose.value.travel = data.travel
        standardDataClose.value.coil = data.coil
        standardDataClose.value.energy = data.energy
      } catch (err) {
        console.error('处理合闸标准曲线数据失败:', err)
      }
    } else {
      console.warn('未获取到合闸标准曲线数据')
    }

    console.log('分闸标准曲线数据:', openResult)
    if (openResult && Array.isArray(openResult) && openResult.length > 0) {
      try {
        const data = dataFormat(openResult[0])
        standardDataOpen.value.angle = data.angle
        standardDataOpen.value.travel = data.travel
        standardDataOpen.value.coil = data.coil
        standardDataOpen.value.energy = data.energy
      } catch (err) {
        console.error('处理分闸标准曲线数据失败:', err)
      }
    } else {
      console.warn('未获取到分闸标准曲线数据')
    }

    console.log('标准曲线数据加载完成')
    return [closeResult, openResult]
  } catch (error) {
    console.error('获取标准曲线数据失败:', error)
    return [[], []]
  }
}

/**
 * 加载曲线数据
 * 获取最新的曲线记录数据
 * @returns {Promise<Array>} 曲线数据结果
 */
const loadCurveData = async (): Promise<any[]> => {
  try {
    console.log('开始加载曲线数据')
    const data = await TablesManager.selectData()
    console.log('曲线数据:', data)
    return data
  } catch (error) {
    console.error('获取曲线数据失败:', error)
    return []
  }
}

/**
 * 获取能量数据
 * @param {Object} data 数据对象
 * @returns {Promise<string>} 能量数据JSON字符串
 */
const getEnergyData = async (data: any): Promise<string> => {
  const typeObj = { id: data.id, type: '0' }
  return await getPrevEnergy(typeObj)
}

/**
 * 获取历史能量数据
 * @param {Object} typeObj 查询条件
 * @returns {Promise<string>} 能量数据JSON字符串
 */
const getPrevEnergy = async (typeObj: any): Promise<string> => {
  try {
    if (!typeObj || !typeObj.id) {
      console.warn('获取储能数据参数不完整:', typeObj)
      return '{"num":0,"stepTime":[],"data":[]}'
    }

    const prevEnergy = await TablesManager.selectData('data_coil', typeObj)

    if (prevEnergy && Array.isArray(prevEnergy) && prevEnergy.length > 0) {
      if (prevEnergy[0].energy) {
        return prevEnergy[0].energy
      }
    }

    console.warn('未找到储能数据，返回默认空数据')
    return '{"num":0,"stepTime":[],"data":[]}'
  } catch (error) {
    console.error('获取储能数据失败:', error)
    return '{"num":0,"stepTime":[],"data":[]}'
  }
}

/**
 * 处理全屏显示图表
 * @param {string} title 图表标题
 * @param {Object} options 图表配置
 */
const handleFullScreen = (title: string, options: any): void => {
  fullScreenTitle.value = title

  const fullScreenOptions = JSON.parse(JSON.stringify(options))
  if (fullScreenOptions.grid) {
    delete fullScreenOptions.grid
  }

  curveOptionsFullScreen.value = fullScreenOptions
  modalVisible.value.fullscreen = true
}

/**
 * 处理并渲染数据
 * @param {Object} data 曲线数据
 * @returns {Promise<void>}
 */
const processAndRenderData = async (data: any): Promise<void> => {
  try {
    if (!data) {
      console.warn('处理数据为空')
      return
    }

    console.log('处理数据:', data)

    // 处理机器特性数据
    processMachineCharacter(data)

    // 格式化曲线数据
    const formattedData = dataFormat(data)

    // 验证数据有效性
    if (!validateCurveData(formattedData)) {
      console.warn('曲线数据验证失败，数据可能不完整')
    }

    // 更新曲线数据源
    updateCurveDataSource(formattedData, data.type)

    // 更新图表
    await updateAllCharts()
  } catch (error) {
    console.error('处理数据失败:', error)
  }
}

// 验证曲线数据有效性
const validateCurveData = (formattedData) => {
  if (!formattedData) return false

  const hasData = (arr) => Array.isArray(arr) && arr.length > 0

  return (
    hasData(formattedData.travel) &&
    hasData(formattedData.angle) &&
    hasData(formattedData.coil) &&
    hasData(formattedData.energy)
  )
}

// 处理机器特性数据
const processMachineCharacter = (data) => {
  let machineCharacter = {}
  try {
    machineCharacter =
      typeof data.machineCharacter === 'string'
        ? JSON.parse(data.machineCharacter || '{}')
        : data.machineCharacter || {}
  } catch (e) {
    console.error('解析机器特性数据失败:', e)
    machineCharacter = {}
  }

  dataLeft.value.forEach((item) => {
    item.data = machineCharacter[item.label] !== undefined ? machineCharacter[item.label] : ''
  })

  dataRight.value.forEach((item) => {
    item.data = machineCharacter[item.label] !== undefined ? machineCharacter[item.label] : ''
  })
}

const updateCurveDataSource = (formattedData, dataType) => {
  curveDataSource.value.travel.yData = formattedData.travel
  curveDataSource.value.angle.yData = formattedData.angle
  curveDataSource.value.coil.yData = formattedData.coil
  curveDataSource.value.energy.yData = formattedData.energy

  if (dataType === DataType.CLOSE) {
    standardData.value = standardDataClose.value
  } else {
    standardData.value = standardDataOpen.value
  }

  curveDataSource.value.standard.travel = standardData.value.travel || []
  curveDataSource.value.standard.angle = standardData.value.angle || []
  curveDataSource.value.standard.coil = standardData.value.coil || []
  curveDataSource.value.standard.energy = standardData.value.energy || []
}

// 更新所有图表
const updateAllCharts = async () => {
  return Promise.all([travelAngleChartInit(), coilChartInit(), energyChartInit()]).catch((err) =>
    console.error('更新图表失败:', err),
  )
}

/**
 * 更新标准曲线
 * 处理从事件接收的标准曲线数据
 * @param {Object} standard 标准曲线参数
 * @returns {Promise<void>}
 */
const updateStandardCurve = async (standard: any): Promise<void> => {
  try {
    console.log('更新标准曲线:', standard)

    if (!standard || typeof standard !== 'object') {
      console.warn('标准曲线参数无效')
      return
    }

    if (Object.keys(standard).length === 0) {
      console.warn('标准曲线参数为空对象')
      return
    }

    isLoading.value = true

    try {
      const data = standard

      if (
        !data.energy ||
        (typeof data.energy === 'string' && data.energy.trim() === '') ||
        (typeof data.energy === 'object' && Object.keys(data.energy).length === 0)
      ) {
        console.log('能量数据为空，尝试获取历史数据')
        data.energy = await getEnergyData(data)
      }

      const formattedData = dataFormat(data)
      const isClosingType = data.type === DataType.CLOSE || data.type === '合闸'

      if (isClosingType) {
        standardDataClose.value.angle = formattedData.angle
        standardDataClose.value.travel = formattedData.travel
        standardDataClose.value.coil = formattedData.coil
        standardDataClose.value.energy = formattedData.energy

        if (data.type === DataType.CLOSE) {
          standardData.value = standardDataClose.value
        }
      } else {
        standardDataOpen.value.angle = formattedData.angle
        standardDataOpen.value.travel = formattedData.travel
        standardDataOpen.value.coil = formattedData.coil
        standardDataOpen.value.energy = formattedData.energy

        if (data.type === DataType.OPEN) {
          standardData.value = standardDataOpen.value
        }
      }

      curveDataSource.value.standard.travel = standardData.value.travel || []
      curveDataSource.value.standard.angle = standardData.value.angle || []
      curveDataSource.value.standard.coil = standardData.value.coil || []
      curveDataSource.value.standard.energy = standardData.value.energy || []

      await updateAllCharts()

      console.log('标准曲线更新完成')
    } catch (err) {
      console.error('处理标准曲线数据失败:', err)
    } finally {
      isLoading.value = false
    }
  } catch (error) {
    console.error('标准曲线更新失败:', error)
    isLoading.value = false
  }
}

/**
 * 切换行程/角度曲线标签
 * @param {CurveType} tab 标签类型
 */
const onTabChange = (tab: CurveType) => {
  activeTab.value = tab
  curveOptions.value.travelAngle = CURVE_MAP_OPTIONS[tab]
  travelAngleChartInit()
}

/**
 * 初始化行程/角度图表
 * @returns {Promise<void>}
 */
const travelAngleChartInit = async (): Promise<void> => {
  try {
    const chartBox = await travelAngleChart.value.init(echarts)
    if (activeTab.value === CurveType.TRAVEL) {
      curveOptions.value.travelAngle.series[0].data = curveDataSource.value.travel.yData
      curveOptions.value.travelAngle.series[1].data = curveDataSource.value.standard.travel
    } else {
      curveOptions.value.travelAngle.series[0].data = curveDataSource.value.angle.yData
      curveOptions.value.travelAngle.series[1].data = curveDataSource.value.standard.angle
    }
    chartBox.setOption(curveOptions.value.travelAngle)
    setTimeout(() => {
      travelAngleChart.value && travelAngleChart.value.resize()
    }, 300)
  } catch (error) {
    console.error('初始化行程/角度图表失败:', error)
  }
}

/**
 * 初始化线圈电流图表
 * @returns {Promise<void>}
 */
const coilChartInit = async (): Promise<void> => {
  try {
    const chartBox = await coilChart.value.init(echarts)
    curveOptions.value.coil.series[0].data = curveDataSource.value.coil.yData
    curveOptions.value.coil.series[1].data = curveDataSource.value.standard.coil
    chartBox.setOption(curveOptions.value.coil)
    setTimeout(() => {
      coilChart.value && coilChart.value.resize()
    }, 300)
  } catch (error) {
    console.error('初始化线圈电流图表失败:', error)
  }
}

/**
 * 初始化储能电机图表
 * @returns {Promise<void>}
 */
const energyChartInit = async (): Promise<void> => {
  try {
    const chartBox = await energyChart.value.init(echarts)
    curveOptions.value.energy.series[0].data = curveDataSource.value.energy.yData
    curveOptions.value.energy.series[1].data = curveDataSource.value.standard.energy
    chartBox.setOption(curveOptions.value.energy)
    setTimeout(() => {
      energyChart.value && energyChart.value.resize()
    }, 300)
  } catch (error) {
    console.error('初始化储能电机图表失败:', error)
  }
}

useMenuLifecycle('curve-mechanical', () => {
  initCurveData()
})

onMounted(() => {
  uni.$on('updateStandardCurve', (data) => {
    updateStandardCurve(data)
  })

  initCurveData()
})

onUnmounted(() => {
  uni.$off('updateStandardCurve')
})
</script>

<style lang="scss" scoped>
.curve-mechanical-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.curve-grid {
  box-sizing: border-box;
  display: grid;
  grid-template-rows: repeat(2, 1fr);
  grid-template-columns: repeat(2, 1fr);
  gap: 14px 18px;
  width: 100%;
  height: 100%;
}

.curve-item {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.curve-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 40px;
}

.header-bg {
  width: 319px;
  height: 24px;
  background-image: url('/static/frame/curve-heading.png');
  background-repeat: no-repeat;
  background-size: 100% 100%;
}

.header-title {
  z-index: 1;
  display: flex;
  align-items: center;
  & > text {
    margin-left: 33px;
  }
}

.arrow-icon {
  width: 18px;
  height: 18px;
  margin-right: 5px;
}

.header-title text {
  font-family: Source Han Sans CN;
  font-size: 18px;
  font-weight: 500;
  color: #00deff;
}

.fullscreen-icon {
  z-index: 1;
  width: 20px;
  height: 20px;
}

.first-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tabs {
  display: flex;
  align-items: center;
}

.tab-item {
  padding: 0 10px;
  font-family: Source Han Sans CN;
  font-size: 18px;
  color: #ffffff;
  cursor: pointer;
  opacity: 0.7;
}

.tab-item.active {
  position: relative;
  font-weight: bold;
  color: #00deff;
  opacity: 1;
}

.tab-item.active::after {
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 100%;
  height: 2px;
  content: '';
  background: linear-gradient(270deg, #0590df 0%, #0590df 100%);
}

.curve-content {
  box-sizing: border-box;
  width: 100%;
  height: calc(100% - 40px);
}

.curve-content :deep(canvas) {
  width: 100% !important;
  height: 100% !important;
}

.row {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.row:not(:first-child) {
  margin-left: 48px;
}
.column {
  display: flex;
  align-items: center;
  font-family: Source Han Sans CN;
  font-size: 14px;
  font-weight: 400;
  color: #ffffff;
}

.record-selector {
  display: flex;
  align-items: center;
  margin-right: 10px;
  font-size: 14px;
  color: #ffffff;
}

.record-links {
  display: flex;
  margin-left: 5px;

  text {
    margin: 0 5px;
    cursor: pointer;
    opacity: 0.7;

    &.active {
      color: #00deff;
      opacity: 1;
    }
  }
}
</style>
