<template>
  <view
    class="sub-layout-grid"
    :class="{
      'cabinet-bg': pageType === PageType.Analysis,
      'curve-page': pageType === PageType.Curve,
      'analysis-page': pageType === PageType.Analysis,
    }"
  >
    <view class="sub-layout-header">
      <SubTabs v-model="activeIndex" @change="handleMenuChange" :tabItems="menuItems" />
      <view class="action-button" v-if="pageType === PageType.Curve">
        <button class="confirm-button" @click="handleSelectData">选择数据</button>
      </view>
    </view>
    <view class="sub-layout-content" :style="{ height: contentHeight }">
      <component :is="currentComponent" v-if="currentComponent"></component>
    </view>
    <view
      v-if="showBottomBar"
      class="sub-layout-bar"
      :style="{ height: convertToViewportUnits(barHeight) }"
    >
      <view class="sub-layout-bar-item" v-for="(data, idx) in footerList" :key="idx">
        <view class="col-1">{{ data.name }}：</view>
        <view class="col-2" :class="onStatusChange(data.key).class">
          {{ onStatusChange(data.key).msg }}
        </view>
      </view>
    </view>
  </view>
  <CurveSelectModal v-model:visible="curveSelectModalVisible" :use-mask-close="true" />
</template>

<script lang="ts" setup>
import { ref, inject, nextTick, computed } from 'vue'
import type { Component } from 'vue'
import SubTabs from '@/components/Sub-Tabs.vue'
import type { BaseInfo } from '@/types/base-info'
import { BaseInfoKey } from '@/types/device-data-keys'
import { DeviceState } from '@/enum/states'
import { PageType } from '@/enum/page-type'
import CurveSelectModal from './Curve-Select-Modal.vue'
import { convertToViewportUnits, getResolutionScale } from '@/utils'

interface Props {
  componentsMap: Record<string, Component>
  initialActiveIndex?: number
  menuItems: Array<{ name: string; code: string }>
  pageType: PageType
  barHeight?: number | string
  showBottomBar?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  initialActiveIndex: 0,
  menuItems: () => [],
  pageType: PageType.Setting,
  barHeight: 0,
  showBottomBar: true,
})

const emit = defineEmits(['change'])

const { wScale, hScale } = getResolutionScale()
const widthScale = computed(() => wScale)
const heightScale = computed(() => hScale)
const curveSelectModalVisible = ref(false)
const baseInfo = inject(BaseInfoKey) || ref<Partial<BaseInfo>>({})
const activeIndex = ref(props.initialActiveIndex)
const currentComponent = ref(null)
const componentsCache = ref({})
const footerList = ref([
  { name: '断路器状态', key: 'breakerState' },
  { name: '底盘车位置', key: 'chassisPosition' },
  { name: '接地刀状态', key: 'groundingState' },
])

/**
 * 自动计算内容区域的高度
 */
const contentHeight = computed(() => {
  const headerHeight = 56 // 头部高度
  const marginTop = 24 // 上边距
  const barHeightValue =
    typeof props.barHeight === 'number'
      ? props.barHeight
      : parseInt(props.barHeight as string, 10) || 0

  if (barHeightValue > 0) {
    return `calc(100% - ${convertToViewportUnits(barHeightValue)} - ${convertToViewportUnits(
      headerHeight + marginTop,
    )})`
  } else {
    return `calc(100% - ${convertToViewportUnits(headerHeight + marginTop)})`
  }
})

const handleMenuChange = async (index) => {
  const prevMenuCode = props.menuItems[activeIndex.value].code

  activeIndex.value = index

  const menuCode = props.menuItems[index].code

  uni.$emit(`menu:deactivate:${prevMenuCode}`)

  currentComponent.value = props.componentsMap[menuCode]

  uni.$emit(`menu:activate:${menuCode}`)

  emit('change', index)

  await nextTick()
}

const onStatusChange = (e) => {
  switch (e) {
    case 'breakerState':
      if (baseInfo.value.breakerState === DeviceState.ON) {
        return {
          msg: '合闸',
          class: 'error-status',
        }
      } else {
        return {
          msg: '分闸',
          class: 'success-status',
        }
      }
    case 'chassisPosition':
      if (baseInfo.value.chassisPosition === DeviceState.ON) {
        return {
          msg: '工作位',
          class: 'error-status',
        }
      } else if (baseInfo.value.chassisPosition === DeviceState.OFF) {
        return {
          msg: '试验位',
          class: 'success-status',
        }
      } else {
        return {
          msg: '中间位',
          class: 'success-status',
        }
      }
    case 'groundingState':
      if (baseInfo.value.groundingState === DeviceState.ON) {
        return {
          msg: '合闸',
          class: 'error-status',
        }
      } else {
        return {
          msg: '分闸',
          class: 'success-status',
        }
      }
    default:
      return {
        msg: '未知',
        class: 'normal-status',
      }
  }
}

function handleSelectData() {
  curveSelectModalVisible.value = true
}

onShow(async () => {
  const initialMenuCode = props.menuItems[activeIndex.value].code
  currentComponent.value = props.componentsMap[initialMenuCode]

  // 发送初始组件的激活事件
  uni.$emit(`menu:activate:${initialMenuCode}`)

  setTimeout(() => {
    props.menuItems.forEach((item) => {
      if (item.code !== initialMenuCode) {
        const comp = props.componentsMap[item.code]
        componentsCache.value[item.code] = comp
      }
    })
  }, 1000)

  await nextTick()
})
</script>

<style lang="scss" scoped>
.sub-layout-grid {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  transition: opacity 0.3s ease;
}

.sub-layout-content {
  box-sizing: border-box;
  margin-top: 24px;
  transition: transform 0.3s ease;
  /* height 已通过绑定样式动态设置 */
}

.sub-layout-bar {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  background: linear-gradient(to bottom, rgba(6, 72, 162, 0.18), transparent);
  border-radius: 3px;
}

.sub-layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.curve-page .sub-layout-bar {
  height: 54px;
}

.analysis-page .sub-layout-bar {
  height: 100px;
}

.sub-layout-bar-item {
  display: flex;
  align-items: center;
  font-family: Source Han Sans CN;
  font-size: 19px;
  font-weight: 400;
  color: #f1f2f7;
}

.cabinet-bg {
  background: url('/static/images/cabinet-bg.png') no-repeat center center;
  background-size: calc(320px * #{v-bind(widthScale)}) calc(348px * #{v-bind(heightScale)});
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin: 0 10px;
  font-size: 18px;
  button {
    box-sizing: border-box;
    width: 150px;
    height: 47px;
    padding: 0 33px;
    font-family: Source Han Sans CN;
    font-size: 18px;
    font-weight: 500;
    color: #fff;
    text-align: center;
    background-color: #051635;
  }
}

.confirm-button {
  background-image: url('/static/frame/confirm-btn.png');
  background-size: 100% 100%;
}

.success-status {
  color: #00ffcc;
}

.error-status {
  color: #ff4200;
}

.normal-status {
  color: #ffffff;
}
</style>
