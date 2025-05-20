<!--
 * @Author: Stephen_zhou
 * @Date: 2025-03-21 10:19:14
 * @LastEditors: Stephen_zhou
 * @LastEditTime: 2025-03-21 10:19:14
 * @Description: 弹窗组件 BaseModal
-->
<template>
  <view v-if="visible" class="base-modal" :class="{ 'is-fullscreen': isFullscreen }">
    <view class="modal-mask" :style="{ opacity: maskOpacity }" @click="handleMaskClick"></view>
    <view
      class="modal-content"
      :style="{
        opacity: contentOpacity,
        transform: `scale(${contentScale})`,
        width: isFullscreen ? '100%' : modalWidth,
      }"
    >
      <view class="modal-header">
        <text class="title">{{ title }}</text>
        <view class="header-actions">
          <view
            v-if="fullscreen"
            class="fullscreen-btn"
            :class="{
              'i-material-symbols-fullscreen': !isFullscreen,
              'i-material-symbols-fullscreen-exit': isFullscreen,
            }"
            @click="toggleFullscreen"
          ></view>
          <view class="close-btn i-carbon-close-outline" @click="handleClose"></view>
        </view>
      </view>
      <view class="modal-body">
        <slot></slot>
      </view>
      <view v-if="!hasNoButton" class="modal-footer" :class="{ 'single-button': isSingleButton }">
        <slot name="footer">
          <view class="modal-button" v-if="showCancelButton">
            <button class="cancel-button" @click="handleClose">
              {{ cancelText }}
            </button>
          </view>
          <view class="modal-button" v-if="showConfirmButton">
            <button class="confirm-button" @click="handleConfirm">{{ confirmText }}</button>
          </view>
        </slot>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, watch, computed, useSlots } from 'vue'
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
  showCancelButton: {
    type: Boolean,
    default: false,
  },
  showConfirmButton: {
    type: Boolean,
    default: true,
  },
  cancelText: {
    type: String,
    default: '取消',
  },
  confirmText: {
    type: String,
    default: '确认',
  },
  width: {
    type: String,
    default: '35%',
  },
  fullscreen: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'cancel', 'confirm', 'onFullscreen'])

const maskOpacity = ref(0)
const contentOpacity = ref(0)
const contentScale = ref(0.8)
const animating = ref(false)
const isFullscreen = ref(false)

const isSingleButton = computed(() => {
  return (
    (props.showCancelButton && !props.showConfirmButton) ||
    (!props.showCancelButton && props.showConfirmButton)
  )
})

const hasNoButton = computed(() => {
  return !props.showCancelButton && !props.showConfirmButton && !useSlots().footer
})

const modalWidth = computed(() => {
  if (/^[\d.]+(%|px|rpx)$/.test(props.width)) {
    return props.width
  }
  if (/^\d+$/.test(props.width)) {
    return `${props.width}px`
  }
  return '35%'
})

function showAnimation() {
  animating.value = true
  maskOpacity.value = 0
  contentOpacity.value = 0
  contentScale.value = 0.8

  setTimeout(() => {
    maskOpacity.value = 1
    contentOpacity.value = 1
    contentScale.value = 1

    setTimeout(() => {
      animating.value = false
    }, 300)
  }, 50)
}

function hideAnimation() {
  if (animating.value) return

  animating.value = true
  maskOpacity.value = 0
  contentOpacity.value = 0
  contentScale.value = 0.8

  setTimeout(() => {
    emit('close')
    animating.value = false
  }, 300)
}

function handleConfirm() {
  emit('confirm')
}

function handleClose() {
  hideAnimation()
}

function handleMaskClick() {
  if (props.useMaskClose) {
    hideAnimation()
  }
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
  emit('onFullscreen', isFullscreen.value)
}

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      showAnimation()
    } else {
      isFullscreen.value = false
    }
  },
)

defineExpose({
  hideAnimation,
  toggleFullscreen,
  isFullscreen,
})
</script>

<style lang="scss" scoped>
.base-modal {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;

  .modal-mask {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background-color: rgba(0, 0, 0, 0.5);
    transition: opacity 0.3s ease;
  }

  .modal-content {
    position: relative;
    overflow: hidden;
    background: #051635;
    border: 1px solid #07d9ff;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease-out;
    transform-origin: center;
  }

  &.is-fullscreen {
    .modal-content {
      height: 100%;
      border-radius: 0;
    }
  }

  .modal-header {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 14px;
    background-color: #00528a;
    border-bottom: 1px solid #00deff;

    .title {
      position: absolute;
      left: 50%;
      font-size: 18px;
      font-weight: 400;
      color: #ffffff;
      transform: translateX(-50%);
    }

    .header-actions {
      display: flex;
      align-items: center;
      margin-left: auto;
    }

    .fullscreen-btn,
    .close-btn {
      position: relative;
      z-index: 10;
      padding: 10px;
      font-size: 16px;
      cursor: pointer;
    }

    .fullscreen-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 20px;
      font-size: 16px;
    }
  }

  .modal-body {
    padding: 33px;
  }

  .modal-footer {
    display: flex;
    justify-content: space-between;
    padding: 30px;

    .modal-button {
      flex: 1;
      margin: 0 10px;
      button {
        box-sizing: border-box;
        width: 100%;
        font-size: 18px;
        font-weight: 500;
        color: #fff;
        text-align: center;
        background-color: #051635;
        border-radius: 4px;
      }
    }
    .cancel-button {
      height: 40px;
      line-height: 40px;
      border: 1px solid #07d9ff;
    }

    .confirm-button {
      height: 40px;
      line-height: 40px;
      background-image: url('/static/frame/confirm-btn.png');
      background-size: 100% 100%;
    }

    &.single-button {
      justify-content: center;

      .modal-button {
        flex: 0 0 auto;
        width: 40%;

        button {
          width: 100%;
        }
      }
    }
  }
}
</style>
