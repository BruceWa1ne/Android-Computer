<route lang="json5" type="home">
{
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '开关设备一体化智能测试终端',
  },
}
</route>
<template>
  <view class="main-container">
    <Header v-model="selectedIndex" @change="handleMenuChange" />
    <template v-for="(item, index) in MAIN_MENU_ITEMS" :key="item.code">
      <view
        class="content-container"
        v-if="shouldRenderComponent(index)"
        v-show="selectedIndex === index"
      >
        <component :is="componentsMap[item.code]"></component>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import type { BaseInfo } from '@/types/base-info'
import Header from '@/components/Header.vue'
import { useSerialStore } from '@/store'
import { MAIN_MENU_ITEMS } from '@/utils/menu'
import DeviceMonitor from './menu/deviceMonitor.vue'
import MonitorAnalysis from './menu/monitorAnalysis.vue'
import DataCurve from './menu/dataCurve.vue'
import Record from './menu/record.vue'
import Setting from './menu/setting.vue'
import { BaseInfoKey } from '@/types/device-data-keys'

const selectedIndex = ref(0)

const baseInfo = ref<Partial<BaseInfo>>({})

provide(BaseInfoKey, baseInfo)

const componentsMap = {
  deviceMonitor: markRaw(DeviceMonitor),
  monitorAnalysis: markRaw(MonitorAnalysis),
  dataCurve: markRaw(DataCurve),
  record: markRaw(Record),
  setting: markRaw(Setting),
}

const renderedComponents = ref<Set<number>>(new Set([selectedIndex.value]))

const shouldRenderComponent = (index: number) => {
  if (renderedComponents.value.has(index) || Math.abs(index - selectedIndex.value) <= 1) {
    renderedComponents.value.add(index)
    return true
  }
  return false
}

const handleMenuChange = async (index) => {
  if (selectedIndex.value === 0) {
    uni.$emit('deviceMonitor:pause')
  }

  // 发送离开事件给当前菜单组件
  uni.$emit(`menu:deactivate:${MAIN_MENU_ITEMS[selectedIndex.value].code}`)

  selectedIndex.value = index

  // 发送激活事件给新选中的菜单组件
  uni.$emit(`menu:activate:${MAIN_MENU_ITEMS[index].code}`)

  if (index === 0) {
    await nextTick()
    setTimeout(() => {
      uni.$emit('deviceMonitor:restart')
    }, 300)
  }

  // 预加载相邻组件
  const prevIndex = index - 1 >= 0 ? index - 1 : null
  const nextIndex = index + 1 < MAIN_MENU_ITEMS.length ? index + 1 : null

  if (prevIndex !== null) {
    renderedComponents.value.add(prevIndex)
  }

  if (nextIndex !== null) {
    renderedComponents.value.add(nextIndex)
  }
}

onMounted(async () => {
  uni.$on('periodicRefreshStatusChanged', handlePeriodicRefreshStatusChanged)
  uni.$on('systemMemoryUpdated', handleMemoryInfoUpdated)
  uni.$on('baseInfoUpdated', handleBaseInfoUpdated)
})

onUnmounted(() => {
  uni.$off('periodicRefreshStatusChanged', handlePeriodicRefreshStatusChanged)
  uni.$off('systemMemoryUpdated', handleMemoryInfoUpdated)
  uni.$off('baseInfoUpdated', handleBaseInfoUpdated)
  uni.$off('deviceMonitor:pause')
  uni.$off('deviceMonitor:restart')
})

const serialStore = useSerialStore()

function handlePeriodicRefreshStatusChanged(data: { isRunning: boolean }) {
  serialStore.isPeriodicRefreshRunning = data.isRunning
}

function handleMemoryInfoUpdated(data: {
  usage: number
  free: number
  total: number
  lowMemory: boolean
  threshold: number
  app: {
    free: number
    total: number
    max: number
  }
}) {
  serialStore.updateMemoryInfo(data)
}

function handleBaseInfoUpdated(data: Partial<BaseInfo>) {
  // 更新基础信息，通过provide自动传递给子组件
  baseInfo.value = data
}
</script>

<style lang="scss" scoped>
.main-container {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  padding: 0 31px;
  overflow: hidden;
  color: #fff;
  background: url('/static/frame/main-bg.png');
  background-size: 100% 100%;
}

.content-container {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding-bottom: 30px;
  margin-top: 20px;
  margin-bottom: 20px;
  overflow: hidden;
}
</style>
