<template>
  <view class="analysis-tab">
    <view
      class="analysis-tab-item"
      :class="{
        'analysis-tab-item-title-active': activeIndex === tIndex,
        'analysis-tab-item-active': activeIndex === tIndex,
      }"
      v-for="(tab, tIndex) in tabItems"
      :key="tIndex"
      @click="menuChange(tab, tIndex)"
    >
      <view class="analysis-tab-item-title">
        <text>{{ tab.name }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
interface Props {
  modelValue: number
  tabItems: Array<{ name: string; code: string }>
}
const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  tabItems: () => [],
})
const emit = defineEmits(['change'])

watch(
  () => props.modelValue,
  (newValue) => {
    activeIndex.value = newValue
  },
)

const activeIndex = ref(props.modelValue)

const menuChange = (e, idx) => {
  if (activeIndex.value === idx) return
  activeIndex.value = idx
  emit('change', idx)
}
</script>

<style scoped lang="scss">
.analysis-tab {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.analysis-tab-item {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  height: 56px;
  padding: 16px 24px;
  background: rgba(0, 50, 78, 0.6);
  border: 2px solid #00528a;
  border-radius: 4px;
  transition: color 0.3s ease;
}

.analysis-tab-item-title {
  font-family: Source Han Sans CN;
  font-size: 18px;
  font-weight: 400;
  color: #ffffff;
}

.analysis-tab-item-active {
  background-image: url('/static/frame/L-button-bg.png');
  background-repeat: no-repeat;
  background-size: 100% 100%;
  border: none;
}

.analysis-tab-item-title-active text {
  color: #00deff;
  transition: color 0.3s ease;
}

.analysis-tab-item + .analysis-tab-item {
  margin-left: 16px;
}
</style>
