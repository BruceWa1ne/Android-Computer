<template>
  <view class="camera-settings">
    <view class="header">
      <text class="title">摄像头设置</text>
    </view>
    <view class="settings-container">
      <view class="camera-grid">
        <view class="camera-card">
          <view class="card-header">
            <view class="card-title">断路器室摄像头</view>
            <view class="protocol-tag">
              <view class="tag-content">{{ breakingConfig.protocol }}</view>
            </view>
          </view>

          <view class="form-item">
            <view class="form-label">IP地址</view>
            <input
              class="form-input"
              type="text"
              v-model="breakingConfig.ip"
              placeholder="192.168.1.12"
              :maxlength="15"
            />
          </view>

          <view class="form-item">
            <view class="form-label">端口号</view>
            <input
              class="form-input"
              type="text"
              v-model="breakingConfig.port"
              placeholder="554"
              :maxlength="5"
            />
          </view>

          <view class="form-item">
            <view class="form-label">子码流</view>
            <view class="select-wrapper">
              <picker
                @change="onStreamChange('breaking', $event)"
                :value="breakingConfig.streamLevel"
                :range="streamLevels"
              >
                <view class="uni-input">{{ streamLevels[breakingConfig.streamLevel] }}</view>
              </picker>
            </view>
          </view>

          <view class="preview">
            <text class="preview-url">{{ breakingCameraPreview }}</text>
          </view>
        </view>

        <view class="camera-card">
          <view class="card-header">
            <view class="card-title">电缆室摄像头</view>
            <view class="protocol-tag">
              <view class="tag-content">{{ cableConfig.protocol }}</view>
            </view>
          </view>

          <view class="form-item">
            <view class="form-label">IP地址</view>
            <input
              class="form-input"
              type="text"
              v-model="cableConfig.ip"
              placeholder="192.168.1.11"
              :maxlength="15"
            />
          </view>

          <view class="form-item">
            <view class="form-label">端口号</view>
            <input
              class="form-input"
              type="text"
              v-model="cableConfig.port"
              placeholder="554"
              :maxlength="5"
            />
          </view>

          <view class="form-item">
            <view class="form-label">子码流</view>
            <view class="select-wrapper">
              <picker
                @change="onStreamChange('cable', $event)"
                :value="cableConfig.streamLevel"
                :range="streamLevels"
              >
                <view class="uni-input">{{ streamLevels[cableConfig.streamLevel] }}</view>
              </picker>
            </view>
          </view>

          <view class="preview">
            <text class="preview-url">{{ cableCameraPreview }}</text>
          </view>
        </view>
      </view>
      <view class="form-actions">
        <button class="reset-btn" @click="resetToDefaults">恢复默认值</button>
        <button class="save-btn" @click="saveSettings(false)">保存设置</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useConfigStore } from '@/store/config'

const configStore = useConfigStore()
const ipRegex =
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
const portRegex =
  /^([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/

const protocols = ['rtsp', 'rtmp', 'hls']
const streamLevels = ['高清', '标清', '流畅']

const breakingConfig = reactive({
  ip: '192.168.1.12',
  protocol: 'rtsp',
  port: '554',
  streamLevel: 1,
})

const cableConfig = reactive({
  ip: '192.168.1.11',
  protocol: 'rtsp',
  port: '554',
  streamLevel: 1,
})

const breakingCameraPreview = computed(() => {
  const base = `${breakingConfig.protocol}://${breakingConfig.ip}:${breakingConfig.port}`
  switch (breakingConfig.protocol) {
    case 'rtsp':
      return `${base}/user=admin&password=&channel=1&stream=${breakingConfig.streamLevel}.sdp?`
    case 'rtmp':
      return `${base}/live/stream${breakingConfig.streamLevel}`
    case 'hls':
      return `${base}/hls/stream${breakingConfig.streamLevel}.m3u8`
    default:
      return `${base}/user=admin&password=&channel=1&stream=${breakingConfig.streamLevel}.sdp?`
  }
})

const cableCameraPreview = computed(() => {
  const base = `${cableConfig.protocol}://${cableConfig.ip}:${cableConfig.port}`
  switch (cableConfig.protocol) {
    case 'rtsp':
      return `${base}/user=admin&password=&channel=1&stream=${cableConfig.streamLevel}.sdp?`
    case 'rtmp':
      return `${base}/live/stream${cableConfig.streamLevel}`
    case 'hls':
      return `${base}/hls/stream${cableConfig.streamLevel}.m3u8`
    default:
      return `${base}/user=admin&password=&channel=1&stream=${cableConfig.streamLevel}.sdp?`
  }
})

const onStreamChange = (type: 'breaking' | 'cable', event: any) => {
  const streamLevel = Number(event.detail.value)
  if (type === 'breaking') {
    breakingConfig.streamLevel = streamLevel
  } else {
    cableConfig.streamLevel = streamLevel
  }
}

const loadSettings = () => {
  const breakingCameraConfig = configStore.cameraConfig.breaking
  const cableCameraConfig = configStore.cameraConfig.cable

  breakingConfig.ip = breakingCameraConfig.ip
  breakingConfig.protocol = breakingCameraConfig.protocol
  breakingConfig.port = breakingCameraConfig.port
  breakingConfig.streamLevel = breakingCameraConfig.streamLevel

  cableConfig.ip = cableCameraConfig.ip
  cableConfig.protocol = cableCameraConfig.protocol
  cableConfig.port = cableCameraConfig.port
  cableConfig.streamLevel = cableCameraConfig.streamLevel
}

const resetToDefaults = () => {
  breakingConfig.ip = '192.168.1.12'
  breakingConfig.protocol = 'rtsp'
  breakingConfig.port = '554'
  breakingConfig.streamLevel = 1

  // 电缆室默认配置
  cableConfig.ip = '192.168.1.11'
  cableConfig.protocol = 'rtsp'
  cableConfig.port = '554'
  cableConfig.streamLevel = 1

  saveSettings(true)
  uni.showToast({
    title: '已恢复默认设置',
    icon: 'success',
  })
}

// 保存设置
const saveSettings = (skipValidation: boolean) => {
  if (!skipValidation) {
    if (!ipRegex.test(breakingConfig.ip)) {
      uni.showToast({
        title: '断路器室摄像头IP地址格式不正确',
        icon: 'none',
      })
      return
    }

    if (!ipRegex.test(cableConfig.ip)) {
      uni.showToast({
        title: '电缆室摄像头IP地址格式不正确',
        icon: 'none',
      })
      return
    }

    if (!portRegex.test(breakingConfig.port)) {
      uni.showToast({
        title: '断路器室摄像头端口不正确',
        icon: 'none',
      })
      return
    }

    if (!portRegex.test(cableConfig.port)) {
      uni.showToast({
        title: '电缆室摄像头端口不正确',
        icon: 'none',
      })
      return
    }
  }

  try {
    configStore.updateCameraConfig('breaking', {
      ip: breakingConfig.ip,
      protocol: breakingConfig.protocol,
      port: breakingConfig.port,
      streamLevel: breakingConfig.streamLevel,
    })

    configStore.updateCameraConfig('cable', {
      ip: cableConfig.ip,
      protocol: cableConfig.protocol,
      port: cableConfig.port,
      streamLevel: cableConfig.streamLevel,
    })

    uni.$emit('cameraConfig:updated')

    if (!skipValidation) {
      uni.showToast({
        title: '设置已保存',
        icon: 'success',
      })
    }
  } catch (error) {
    console.error('保存设置失败:', error)
    uni.showToast({
      title: '保存设置失败，请重试',
      icon: 'none',
    })
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped lang="scss">
.camera-settings {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
}

.settings-container {
  box-sizing: border-box;
  height: 100%;
  padding: 12px;
  background: rgba(0, 149, 255, 0.15);
  border: 1px solid rgba(64, 158, 255, 0.3);
  border-radius: 8px;
}

.header {
  margin-bottom: 12px;
}

.title {
  display: block;
  font-size: 18px;
  font-weight: 500;
  color: #ffffff;
}

.subtitle {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.camera-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.camera-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 6px;
  margin-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.card-title {
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
}

.protocol-tag {
  padding: 2px 6px;
  font-size: 11px;
  color: #ffffff;
  cursor: pointer;
  background: rgba(64, 158, 255, 0.3);
  border-radius: 4px;
}

.tag-content {
  display: flex;
  align-items: center;
  height: 20px;
}

.form-item {
  margin-bottom: 6px;
}

.form-label {
  margin-bottom: 3px;
  font-size: 12px;
  color: #ffffff;
}

.form-input,
.select-wrapper {
  box-sizing: border-box;
  width: 100%;
  height: 32px;
  padding: 0 8px;
  font-size: 12px;
  color: #ffffff;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(64, 158, 255, 0.3);
  border-radius: 4px;
}

.select-wrapper {
  display: flex;
  align-items: center;
}

.uni-input {
  width: 100%;
  height: 32px;
  font-size: 12px;
  line-height: 32px;
}

.preview {
  padding: 5px;
  overflow: hidden;
  font-size: 10px;
  text-overflow: ellipsis;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.preview-url {
  color: rgba(255, 255, 255, 0.8);
  word-break: break-all;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 10px;
}

.reset-btn,
.save-btn {
  padding: 6px 12px;
  font-size: 12px;
  border: none;
  border-radius: 4px;
}

.reset-btn {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.2);
}

.save-btn {
  color: #ffffff;
  background: #409eff;
}
</style>
