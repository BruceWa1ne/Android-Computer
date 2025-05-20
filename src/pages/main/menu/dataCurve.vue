<template>
  <ContentContainer>
    <SubLayout
      :componentsMap="componentsMap"
      :menuItems="CURVE_MENU_ITEMS"
      :pageType="PageType.Curve"
      barHeight="54px"
      @change="handleTabChange"
    />
  </ContentContainer>
</template>

<script lang="ts" setup>
import { ref, markRaw, onMounted, onUnmounted } from 'vue'
import { CURVE_MENU_ITEMS } from '@/utils/menu'
import ContentContainer from '@/components/Content-Container.vue'
import SubLayout from '@/components/Sub-Layout.vue'
import CurveMechanical from '../components/curve/mechanical.vue'
import CurveTemperature from '../components/curve/temperature.vue'
import CurvePartial from '../components/curve/partial.vue'
import { PageType } from '@/enum/page-type'

const componentsMap = {
  'curve-mechanical': markRaw(CurveMechanical),
  'curve-temperature': markRaw(CurveTemperature),
  'curve-partial': markRaw(CurvePartial),
}

const activeMenuIndex = ref(0)

const handleTabChange = (index) => {
  activeMenuIndex.value = index
}

const handleMainMenuActivate = () => {
  const currentMenuCode = CURVE_MENU_ITEMS[activeMenuIndex.value].code
  uni.$emit(`menu:activate:${currentMenuCode}`)
}

onMounted(() => {
  uni.$on('menu:activate:dataCurve', handleMainMenuActivate)
})

onUnmounted(() => {
  uni.$off('menu:activate:dataCurve', handleMainMenuActivate)
})
</script>

<style lang="scss" scoped>
.curve-grid {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.placeholder-content {
  font-size: 24px;
  color: #fff;
}

.data-curve {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 20px 0;
}

.section-title {
  margin-bottom: 20px;
  font-size: 28px;
  font-weight: bold;
  color: #fff;
}

.curve-content {
  flex: 1;
  overflow: auto;
}

.placeholder-content {
  font-size: 24px;
  color: #fff;
}
</style>
