<!--
 * @Author: 
 * @Date: 2025-03-21 10:19:14
 * @LastEditors: 
 * @LastEditTime: 2025-03-21 10:19:14
 * @Description: 状态面板组件 StatusPanel
-->
<template>
  <view class="status-panel" :class="{ open: visible }" :style="panelStyle" @click.stop>
    <view class="panel-header">
      <view class="panel-title">
        <text>{{ title }}</text>
        <slot name="headerActions"></slot>
      </view>
      <view class="close-btn" @click.stop="handleClose">×</view>
    </view>
    <view class="panel-content">
      <slot></slot>
    </view>
  </view>
  <view v-if="visible" class="status-panel-mask" @click="maskClose && handleClose()"></view>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue'
import { convertToViewportUnits } from '@/utils'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '面板标题',
  },
  width: {
    type: [String, Number],
    default: '320px',
  },
  top: {
    type: [String, Number],
    default: '130px',
  },
  left: {
    type: [String, Number],
    default: '20px',
  },
  right: {
    type: [String, Number],
    default: 'auto',
  },
  bottom: {
    type: [String, Number],
    default: 'auto',
  },
  maskClose: {
    type: Boolean,
    default: true,
  },
  centered: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'update:visible'])

const panelStyle = computed(() => {
  if (props.centered) {
    return {
      top: '50%',
      left: '50%',
      width: convertToViewportUnits(props.width),
      transform: 'translate(-50%, -50%)',
    }
  }

  return {
    top: convertToViewportUnits(props.top),
    left: convertToViewportUnits(props.left),
    right: convertToViewportUnits(props.right),
    bottom: convertToViewportUnits(props.bottom),
    width: convertToViewportUnits(props.width),
  }
})

const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}
</script>

<style lang="scss" scoped>
.status-panel {
  position: fixed;
  z-index: 2000;
  pointer-events: auto;
  visibility: hidden;
  background: rgba(0, 25, 51, 0.85);
  border: 1px solid rgba(64, 158, 255, 0.6);
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0, 149, 255, 0.3);
  opacity: 0;
  transition: all 0.3s ease;
  transform: translateY(-10px);

  &.open {
    visibility: visible;
    opacity: 1;
    transform: translateY(0);
  }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(64, 158, 255, 0.3);
}

.panel-title {
  display: flex;
  align-items: center;
  font-family: 'AlibabaPuHuiTi';
  font-size: 20px;
  font-weight: 500;
  color: #ffffff;

  :deep(.action-btn) {
    margin-left: 8px;
  }
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding-bottom: 3px; /* 调整X的垂直位置 */
  font-size: 24px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 50%;
  transition: all 0.2s ease;

  &:hover {
    color: #ffffff;
    background-color: rgba(0, 0, 0, 0.4);
    transform: scale(1.1);
  }
}

.panel-content {
  max-height: 50vh;
  padding: 16px;
  overflow-y: auto;
  scrollbar-width: thin;
  &::-webkit-scrollbar {
    display: none;
  }
}

.status-panel-mask {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1999;
  width: 100%;
  height: 100%;
  pointer-events: auto;
  background-color: transparent;
}
</style>
