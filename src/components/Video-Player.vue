<template>
  <view class="video-player">
    <video
      :id="id"
      :style="videoStyle"
      :src="src"
      :autoplay="autoplay"
      :loop="loop"
      :muted="muted"
      :initial-time="initialTime"
      :direction="direction"
      :show-progress="showProgress"
      :show-fullscreen-btn="showFullscreenBtn"
      :show-play-btn="showPlayBtn"
      :show-center-play-btn="showCenterPlayBtn"
      :enable-progress-gesture="enableProgressGesture"
      :object-fit="objectFit"
      :poster="poster"
      :show-mute-btn="showMuteBtn"
      :title="title"
      :play-btn-position="playBtnPosition"
      :enable-play-gesture="enablePlayGesture"
      :vslide-gesture="vslideGesture"
      :vslide-gesture-in-fullscreen="vslideGestureInFullscreen"
      :show-casting-button="showCastingButton"
      :controls="controls"
      :enable-danmu="enableDanmu"
      :danmu-btn="danmuBtn"
      :danmu-list="danmuList"
      :advanced="advanced"
      @play="onPlay"
      @pause="onPause"
      @ended="onEnded"
      @timeupdate="onTimeUpdate"
      @fullscreenchange="onFullScreenChange"
      @waiting="onWaiting"
      @error="onError"
      @progress="onProgress"
      @loadedmetadata="onLoadedMetadata"
    />
  </view>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick, getCurrentInstance } from 'vue'
import { convertToViewportUnits } from '@/utils'
interface VideoDanmu {
  text: string
  color: string
  time: number
}

type VideoDirection = 0 | 90 | -90
type VideoObjectFit = 'contain' | 'fill' | 'cover'
type VideoPlayBtnPosition = 'bottom' | 'center'

const instance = getCurrentInstance()
const retryCount = ref(0)
const maxRetries = 3

const props = defineProps({
  id: {
    type: String,
    default: () => `video-${Date.now()}`,
  },
  src: {
    type: String,
    required: true,
  },
  height: {
    type: [Number, String],
    default: '',
  },
  width: {
    type: [Number, String],
    default: '100%',
  },
  // 是否自动播放
  autoplay: {
    type: Boolean,
    default: false,
  },
  // 是否循环播放
  loop: {
    type: Boolean,
    default: false,
  },
  // 是否静音
  muted: {
    type: Boolean,
    default: false,
  },
  // 初始播放时间
  initialTime: {
    type: Number,
    default: 0,
  },
  // 视频方向
  direction: {
    type: Number as () => VideoDirection,
    default: undefined,
  },
  // 是否显示进度条
  showProgress: {
    type: Boolean,
    default: true,
  },
  // 是否显示全屏按钮
  showFullscreenBtn: {
    type: Boolean,
    default: true,
  },
  // 是否显示视频底部控制栏的播放按钮
  showPlayBtn: {
    type: Boolean,
    default: false,
  },
  // 是否显示视频中间的播放按钮
  showCenterPlayBtn: {
    type: Boolean,
    default: true,
  },
  // 是否开启控制进度的手势
  enableProgressGesture: {
    type: Boolean,
    default: true,
  },
  // 视频对象适配
  objectFit: {
    type: String as () => VideoObjectFit,
    default: 'contain',
  },
  // 视频封面
  poster: {
    type: String,
    default: '',
  },
  // 是否显示静音按钮
  showMuteBtn: {
    type: Boolean,
    default: false,
  },
  // 视频标题
  title: {
    type: String,
    default: '',
  },
  // 播放按钮位置
  playBtnPosition: {
    type: String as () => VideoPlayBtnPosition,
    default: 'bottom',
  },
  // 是否开启播放手势，即双击切换播放/暂停
  enablePlayGesture: {
    type: Boolean,
    default: false,
  },
  // 在非全屏模式下，是否开启亮度与音量调节手势
  vslideGesture: {
    type: Boolean,
    default: false,
  },
  // 在全屏模式下，是否开启亮度与音量调节手势
  vslideGestureInFullscreen: {
    type: Boolean,
    default: true,
  },
  showCastingButton: {
    type: Boolean,
    default: false,
  },
  // 是否显示控制栏
  controls: {
    type: Boolean,
    default: true,
  },
  // 是否启用弹幕
  enableDanmu: {
    type: Boolean,
    default: false,
  },
  // 是否显示弹幕按钮
  danmuBtn: {
    type: Boolean,
    default: false,
  },
  // 弹幕列表
  danmuList: {
    type: Array as () => VideoDanmu[],
    default: () => [],
  },
})

const emit = defineEmits([
  'play',
  'pause',
  'ended',
  'timeupdate',
  'fullscreenchange',
  'waiting',
  'error',
  'progress',
  'loadedmetadata',
])

const videoStyle = computed(() => {
  return {
    width: typeof props.width === 'number' ? `${props.width}px` : props.width,
    height: props.height ? convertToViewportUnits(props.height) : '100%',
  }
})

const videoContext = ref(null)
const advanced = ref([
  {
    key: 'max-fps',
    value: 25,
    type: 'player',
  },
  {
    key: 'framedrop', // 跳帧处理,CPU处理较慢时，进行跳帧处理，保证播放流程，画面和声音同步
    value: 5,
    type: 'player',
  },
  {
    key: 'mediacodec', // android 1开启 0关闭 硬解码（硬件解码更清晰。软解，更稳定）
    value: 1,
    type: 'player',
  },
  {
    key: 'videotoolbox', // ios 1开启 0关闭 硬解码（硬件解码CPU消耗低。软解，更稳定）
    value: 1,
    type: 'player',
  },
  {
    key: 'reconnect', // ios 播放是否重连 0否1是   注意：这里不是重连次数，使用除0和1以外的值视频将无法播放（亲测）
    value: 1,
    type: 'format',
  },
  {
    key: 'skip_loop_filter', // 设置是否开启环路过滤: 0开启，画面质量高，解码开销大，48关闭，画面质量差点，解码开销小
    value: 48,
    type: 'codec',
  },
  {
    key: 'max-buffer-size', // 最大缓冲大小,单位kb
    value: 1024 * 1024,
    type: 'player',
  },
])

onMounted(() => {
  createVideoContext()
})

onUnmounted(() => {
  destroyVideoContext()
})

watch(
  () => props.src,
  (newSrc, oldSrc) => {
    if (newSrc !== oldSrc) {
      destroyVideoContext()
      retryCount.value = 0
      nextTick(() => {
        setTimeout(() => {
          createVideoContext()
          if (props.autoplay) {
            setTimeout(() => {
              playWithRetry()
            }, 500)
          }
        }, 100)
      })
    }
  },
)

const createVideoContext = () => {
  try {
    if (!videoContext.value) {
      videoContext.value = uni.createVideoContext(props.id, instance)
    }
  } catch (error) {
    console.error('创建视频上下文失败:', error)
    setTimeout(() => {
      try {
        videoContext.value = uni.createVideoContext(props.id, instance)
      } catch (retryError) {
        console.error('重试创建视频上下文失败:', retryError)
      }
    }, 500)
  }
}

const destroyVideoContext = () => {
  if (videoContext.value) {
    try {
      videoContext.value.pause()
      videoContext.value = null
    } catch (error) {
      console.error('销毁视频上下文失败:', error)
    }
  }
}

const onPlay = (event) => {
  emit('play', event)
}

const onPause = (event) => {
  emit('pause', event)
}

const onEnded = (event) => {
  emit('ended', event)
}

const onTimeUpdate = (event) => {
  emit('timeupdate', event)
}

const onFullScreenChange = (event) => {
  emit('fullscreenchange', event)
}

const onWaiting = (event) => {
  emit('waiting', event)
}

const onError = (event) => {
  console.error('视频播放错误:', event)

  // 获取错误细节
  const errorDetail = event.detail || {}
  const errorMessage = errorDetail.errMsg || ''

  // 防止循环重试：如果是格式不支持或视频解码错误，不要重试
  if (
    errorMessage.includes('format not supported') ||
    errorMessage.includes('decoder') ||
    errorMessage.includes('unknown')
  ) {
    console.error(`视频格式不支持或解码错误，不进行重试: ${errorMessage}`)
    emit('error', event)
    return
  }

  // 尝试自动恢复，最多重试3次
  if (retryCount.value < maxRetries) {
    const currentRetryNumber = retryCount.value + 1
    retryCount.value = currentRetryNumber
    console.log(`开始第${currentRetryNumber}次重试，最多${maxRetries}次`)

    // 增加延迟时间，避免立即重试引起的死循环
    const delayTime = 2000 * currentRetryNumber // 每次重试增加延迟时间

    setTimeout(() => {
      try {
        destroyVideoContext()
        createVideoContext()
        if (props.autoplay) {
          setTimeout(() => {
            // 在视频播放前检查组件是否还存在
            if (videoContext.value) {
              videoContext.value.play()
            }
          }, 500)
        }
      } catch (error) {
        console.error(`第${currentRetryNumber}次重试失败:`, error)
      }
    }, delayTime)
  } else {
    console.error(`已达到最大重试次数(${maxRetries})，不再尝试恢复`)
    // 通知父组件处理失败
    emit('error', {
      ...event,
      detail: {
        ...errorDetail,
        finalFailure: true,
      },
    })
  }
}

const onProgress = (event) => {
  emit('progress', event)
}

const onLoadedMetadata = (event) => {
  emit('loadedmetadata', event)
}

const playWithRetry = (currentRetry = 0) => {
  if (currentRetry >= maxRetries) {
    console.error(`视频播放失败，已达到最大重试次数(${maxRetries})`)
    emit('error', {
      detail: {
        errMsg: '播放失败，已达到最大重试次数',
        finalFailure: true,
      },
    })
    return
  }

  const currentRetryNumber = currentRetry + 1

  try {
    if (videoContext.value) {
      videoContext.value.play()
    } else {
      throw new Error('视频上下文不存在')
    }
  } catch (error) {
    console.error(`视频播放失败，重试中(${currentRetryNumber}/${maxRetries}):`, error)
    // 使用指数退避策略，避免频繁重试
    const delayTime = Math.min(1000 * Math.pow(2, currentRetryNumber), 8000)
    setTimeout(() => {
      playWithRetry(currentRetryNumber)
    }, delayTime)
  }
}

const play = () => {
  retryCount.value = 0
  try {
    if (videoContext.value) {
      videoContext.value.play()
    } else {
      createVideoContext()
      setTimeout(() => {
        playWithRetry()
      }, 300)
    }
  } catch (error) {
    if (retryCount.value < maxRetries) {
      retryCount.value++
      setTimeout(() => {
        createVideoContext()
        playWithRetry()
      }, 500)
    }
  }
}

const pause = () => {
  videoContext.value?.pause()
}

const seek = (position) => {
  videoContext.value?.seek(position)
}

const stop = () => {
  videoContext.value?.stop()
}

const fullScreen = (direction: VideoDirection = 0) => {
  videoContext.value?.requestFullScreen({ direction })
}

const exitFullScreen = () => {
  videoContext.value?.exitFullScreen()
}

defineExpose({
  play,
  pause,
  seek,
  stop,
  fullScreen,
  exitFullScreen,
  videoContext,
  retryCount,
})
</script>

<style lang="scss" scoped>
.video-player {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
