<template>
  <ContentContainer>
    <SubLayout
      :componentsMap="componentsMap"
      :menuItems="ANALYSIS_MENU_ITEMS"
      :pageType="PageType.Analysis"
      barHeight="100px"
      @change="handleTabChange"
    />
  </ContentContainer>
</template>

<script lang="ts" setup>
import { markRaw } from 'vue'
import { ANALYSIS_MENU_ITEMS } from '@/utils/menu'
import ContentContainer from '@/components/Content-Container.vue'
import SubLayout from '@/components/Sub-Layout.vue'
import AnalysisMechanical from '../components/analysis/mechanical.vue'
import AnalysisTemperature from '../components/analysis/temperature.vue'
import AnalysisPartial from '../components/analysis/partial.vue'
import { PageType } from '@/enum/page-type'

const componentsMap = {
  'analysis-mechanical': markRaw(AnalysisMechanical),
  'analysis-temperature': markRaw(AnalysisTemperature),
  'analysis-partial': markRaw(AnalysisPartial),
}

const activeMenuIndex = ref(0)

const handleTabChange = (index) => {
  activeMenuIndex.value = index
}

const handleMainMenuActivate = () => {
  const currentMenuCode = ANALYSIS_MENU_ITEMS[activeMenuIndex.value].code
  uni.$emit(`menu:activate:${currentMenuCode}`)
}

onMounted(() => {
  uni.$on('menu:activate:monitorAnalysis', handleMainMenuActivate)
})

onUnmounted(() => {
  uni.$off('menu:activate:monitorAnalysis', handleMainMenuActivate)
})
</script>
