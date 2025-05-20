<!--
 * @Author: Stephen_zhou
 * @Date: 2025-03-19 10:19:14
 * @LastEditors: Stephen_zhou
 * @LastEditTime: 2025-03-19 10:19:14
 * @Description: 头部组件 Header
-->
<template>
  <view class="control-header">
    <view class="left" @click="toggleStatusPanel">
      <view class="left-logo"></view>
      <text class="logo-text">{{ Name }}</text>
    </view>
    <view class="right" @click.stop>
      <view
        class="menu-list"
        v-for="(item, idx) in menuItems"
        :key="idx"
        @click.stop="menuChange(item, idx)"
      >
        <view :class="['nav-item', { active: activeIndex === idx }]">
          <span>{{ item.name }}</span>
        </view>
      </view>
    </view>

    <StatusPanel v-model:visible="isStatusPanelOpen" title="系统状态">
      <template #headerActions>
        <view class="action-btn" @click="showSerialConfig">设置</view>
      </template>

      <view class="status-item">
        <text class="status-label">CPU占用率：</text>
        <view class="progress-bar">
          <view class="progress-inner" :style="{ width: `${cpuUsage}%` }" />
        </view>
        <text class="status-value">{{ serialStore.cpuInfo.cpuUsageFormatted }}</text>
      </view>

      <view class="status-item cpu-cores">
        <text class="status-label">CPU核心：</text>
        <text class="status-value">
          {{ serialStore.cpuInfo.cpuCores }}核 / 平均使用率:
          {{ serialStore.cpuInfo.avgCpuUsageFormatted }}
        </text>
      </view>

      <view class="status-item">
        <text class="status-label">应用内存：</text>
        <view class="progress-bar">
          <view class="progress-inner" :style="{ width: `${appMemoryUsage}%` }" />
        </view>
        <text class="status-value">{{ appMemoryUsage }}%</text>
      </view>
      <view class="status-item">
        <text class="status-label">系统内存：</text>
        <view class="progress-bar">
          <view class="progress-inner" :style="{ width: `${systemMemoryUsage}%` }" />
        </view>
        <text class="status-value">{{ systemMemoryUsage }}%</text>
      </view>
      <view class="status-item memory-detail">
        <!-- <text class="status-label"></text> -->
        <view class="memory-info">
          <view class="memory-card">
            <text class="memory-title">应用使用</text>
            <text class="memory-value">{{ serialStore.memoryInfo.pssTotalFormatted }}</text>
          </view>
          <view class="memory-card">
            <text class="memory-title">系统使用</text>
            <text class="memory-value">{{ serialStore.memoryInfo.usedMemory }}</text>
          </view>
          <view class="memory-card">
            <text class="memory-title">系统可用</text>
            <text class="memory-value">{{ serialStore.memoryInfo.availableMemory }}</text>
          </view>
          <view class="memory-card">
            <text class="memory-title">系统总共</text>
            <text class="memory-value">{{ serialStore.memoryInfo.totalMemory }}</text>
          </view>
        </view>
      </view>

      <view class="status-item">
        <text class="status-label">串口状态：</text>
        <text :class="['status-value', isSerialOpen ? 'success-status' : 'error-status']">
          {{ isSerialOpen ? '已连接' : '未连接' }}
        </text>
        <view class="action-btn" @click="toggleSerial">
          {{ isSerialOpen ? '关闭' : '打开' }}
        </view>
      </view>

      <view class="status-item">
        <text class="status-label">68帧串口状态：</text>
        <text :class="['status-value', is68FrameOpen ? 'success-status' : 'error-status']">
          {{ is68FrameOpen ? '已连接' : '未连接' }}
        </text>
        <view class="action-btn" @click="toggle68FrameSerial">
          {{ is68FrameOpen ? '关闭' : '打开' }}
        </view>
      </view>

      <view class="status-item">
        <text class="status-label">数据库状态：</text>
        <text :class="['status-value', isDatabaseOpen ? 'success-status' : 'error-status']">
          {{ isDatabaseOpen ? '已打开' : '未打开' }}
        </text>
        <view class="action-btn" @click="showDatabaseStatus">详情</view>
      </view>

      <view class="status-item">
        <text class="status-label">数据刷新：</text>
        <text :class="['status-value', isPeriodicRunning ? 'success-status' : 'error-status']">
          {{ isPeriodicRunning ? '运行中' : '已停止' }}
        </text>
        <view class="refresh-status">
          <view
            class="refresh-btn"
            :class="{
              rotating: isPeriodicRunning,
              'i-material-symbols-refresh-rounded': isPeriodicRunning,
              'i-material-symbols-stop-circle-outline-rounded': !isPeriodicRunning,
            }"
          ></view>
        </view>
      </view>

      <view class="status-item">
        <text class="status-label">运行时长：</text>
        <text class="status-value">{{ formattedRuntime }}</text>
      </view>
    </StatusPanel>

    <StatusPanel v-model:visible="isSerialConfigOpen" title="串口设置" width="360" :centered="true">
      <view class="serial-tabs">
        <view
          class="tab-item"
          :class="{ active: activeSerialTab === 'modbus' }"
          @click="activeSerialTab = 'modbus'"
        >
          Modbus串口
        </view>
        <view
          class="tab-item"
          :class="{ active: activeSerialTab === 'frame68' }"
          @click="activeSerialTab = 'frame68'"
        >
          68帧串口
        </view>
      </view>

      <!-- Modbus串口设置 -->
      <view v-if="activeSerialTab === 'modbus'" class="tab-content">
        <view class="config-item">
          <text class="status-label">串口地址：</text>
          <view class="input-group">
            <text class="input-prefix">/dev/ttyS</text>
            <input
              type="number"
              class="config-input port-input"
              v-model="serialConfig.portSuffix"
              :disabled="isSerialOpen"
            />
          </view>
        </view>
        <view class="config-item">
          <text class="status-label">波特率：</text>
          <view class="input-group">
            {{ serialConfig.baudRate }}
          </view>
        </view>
        <view class="config-item">
          <text class="status-label">校验位：</text>
          <view class="input-group">
            {{ serialConfig.parity }}
          </view>
        </view>
        <view class="config-item">
          <text class="status-label">数据位：</text>
          <view class="input-group">
            {{ serialConfig.dataBits }}
          </view>
        </view>
        <view class="config-item">
          <text class="status-label">停止位：</text>
          <view class="input-group">
            {{ serialConfig.stopBit }}
          </view>
        </view>
        <view class="config-actions">
          <view class="action-btn" @click="saveSerialConfig" :class="{ disabled: isSerialOpen }">
            保存设置
          </view>
        </view>
      </view>

      <!-- 68帧串口设置 -->
      <view v-else class="tab-content">
        <view class="config-item">
          <text class="status-label">串口地址：</text>
          <view class="input-group">
            <text class="input-prefix">/dev/ttyS</text>
            <input
              type="number"
              class="config-input port-input"
              v-model="frameConfig.portSuffix"
              :disabled="is68FrameOpen"
            />
          </view>
        </view>
        <view class="config-item">
          <text class="status-label">波特率：</text>
          <view class="input-group">
            {{ frameConfig.baudRate }}
          </view>
        </view>
        <view class="config-item">
          <text class="status-label">校验位：</text>
          <view class="input-group">
            {{ frameConfig.parity }}
          </view>
        </view>
        <view class="config-item">
          <text class="status-label">数据位：</text>
          <view class="input-group">
            {{ frameConfig.dataBits }}
          </view>
        </view>
        <view class="config-item">
          <text class="status-label">停止位：</text>
          <view class="input-group">
            {{ frameConfig.stopBit }}
          </view>
        </view>
        <view class="config-actions">
          <view class="action-btn" @click="save68FrameConfig" :class="{ disabled: is68FrameOpen }">
            保存设置
          </view>
        </view>
      </view>
    </StatusPanel>

    <StatusPanel
      v-model:visible="isDatabaseModalOpen"
      title="数据库状态"
      width="420"
      :centered="true"
    >
      <view class="database-status-content">
        <view class="db-status-section">
          <view class="db-section-title">运行状态</view>
          <view class="db-status-row">
            <view class="db-status-dot" :class="{ 'status-active': isDatabaseOpen }"></view>
            <text class="db-status-text">运行</text>
            <view class="db-status-actions">
              <view>
                <button
                  class="refresh-btn"
                  :class="{ rotating: isRefreshingDatabaseStatus }"
                  @click="refreshDatabaseStatus"
                >
                  <text class="i-material-symbols-sync"></text>
                </button>
              </view>
              <view class="action-btn db-action-btn" v-if="!isDatabaseOpen" @click="openDatabase">
                打开数据库
              </view>
            </view>
          </view>
        </view>

        <view class="db-tables-section">
          <view class="db-section-title">
            数据表状态
            {{
              '(' +
              databaseTables.filter((table) => table.exists).length +
              '/' +
              databaseTables.length +
              ')'
            }}
          </view>
          <view class="tables-container">
            <view class="tables-grid">
              <view v-for="(table, index) in databaseTables" :key="index" class="table-card">
                <view class="table-icon" :class="{ 'table-exists': table.exists }">
                  <text class="table-icon-symbol">{{ table.exists ? '#' : '×' }}</text>
                </view>
                <view class="table-info">
                  <view class="table-header">
                    <text class="table-name">{{ table.name }}</text>
                    <view class="table-description">{{ table.description }}</view>
                  </view>
                  <text :class="['table-status', table.exists ? 'success-status' : 'error-status']">
                    {{ table.exists ? '已创建' : '未创建' }}
                  </text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </StatusPanel>
  </view>
</template>

<script lang="ts" setup>
import { MAIN_MENU_ITEMS } from '@/utils/menu'
import { useSerialStore } from '@/store/serialStore'
import SystemStatusManager from '@/utils/systemStatus'
import { DatabaseTables } from '@/enum/database'
import SqliteManager from '@/utils/sqlite'
import StatusPanel from '@/components/StatusPanel.vue'
import { onMounted, onUnmounted, nextTick, watch, computed } from 'vue'

const Name = import.meta.env.VITE_LOGO_NAME

const props = defineProps({
  modelValue: {
    type: Number,
    default: 0,
  },
})
const emit = defineEmits(['change'])

watch(
  () => props.modelValue,
  (newValue) => {
    activeIndex.value = newValue
  },
)
const activeIndex = ref(props.modelValue)
const menuItems = ref(MAIN_MENU_ITEMS)

const menuChange = (e, idx) => {
  if (activeIndex.value === idx) return
  activeIndex.value = idx
  emit('change', idx)
}

const serialStore = useSerialStore()
const isStatusPanelOpen = ref(false)
const formattedRuntime = ref('00:00:00')
const isSerialConfigOpen = ref(false)
const activeSerialTab = ref('modbus') // 默认选中普通串口
const isDatabaseModalOpen = ref(false)
const isRefreshingDatabaseStatus = ref(false)
const serialConfig = ref({
  portSuffix: '6',
  baudRate: 115200,
  parity: 'N',
  dataBits: 8,
  stopBit: 1,
})
const frameConfig = ref({
  portSuffix: '7',
  baudRate: 115200,
  parity: 'N',
  dataBits: 8,
  stopBit: 1,
})

const isDatabaseOpen = ref(false)
const databaseTables = ref([
  { name: DatabaseTables.DataCoil, description: '数据线圈', exists: false },
  { name: DatabaseTables.StandardDataCoil, description: '标准数据线圈', exists: false },
  { name: DatabaseTables.TempCurve, description: '温度曲线', exists: false },
  { name: DatabaseTables.PartialCurve, description: '局放曲线', exists: false },
  { name: DatabaseTables.Record, description: '日志记录', exists: false },
])

const appMemoryUsage = computed(() => serialStore.appMemoryUsagePercentage || 0)
const systemMemoryUsage = computed(() => serialStore.memoryUsagePercentage || 0)
const isSerialOpen = computed(() => serialStore.serialStatus.isModbusOpen)
const is68FrameOpen = computed(() => serialStore.serialStatus.is68FrameOpen)
const isPeriodicRunning = computed(() => serialStore.periodicStatus.isRunning)
const cpuUsage = computed(() => serialStore.cpuInfo.cpuUsage || 0)

const toggleStatusPanel = () => {
  isStatusPanelOpen.value = !isStatusPanelOpen.value

  if (isStatusPanelOpen.value) {
    refreshDatabaseStatus()
    const memoryInfo = SystemStatusManager.getMemoryInfo()
    const cpuInfo = SystemStatusManager.getCpuInfo()
    serialStore.updateMemoryInfo(memoryInfo)
    serialStore.updateCpuInfo(cpuInfo)
  }
}

const showSerialConfig = () => {
  if (serialStore.modbusConfig) {
    const portMatch = serialStore.modbusConfig.port.match(/\/dev\/ttyS(\d+)/)
    if (portMatch) {
      serialConfig.value.portSuffix = portMatch[1]
    }
  }

  isSerialConfigOpen.value = true
}

const showDatabaseStatus = async () => {
  await refreshDatabaseStatus()
  isDatabaseModalOpen.value = true
}

const saveSerialConfig = () => {
  if (isSerialOpen.value) {
    uni.showToast({
      title: '串口已打开，无法修改设置',
      icon: 'none',
    })
    return
  }

  const configToSave = {
    port: `/dev/ttyS${serialConfig.value.portSuffix}`,
    baudRate: 115200,
    parity: 'N' as 'N' | 'O' | 'E',
    dataBits: 8,
    stopBit: 1,
    hex: true,
  }

  serialStore.modbusConfig = configToSave

  uni.showToast({
    title: '串口设置已保存',
    icon: 'success',
  })

  isSerialConfigOpen.value = false
}

const save68FrameConfig = () => {
  if (is68FrameOpen.value) {
    uni.showToast({
      title: '68帧串口已打开，无法修改设置',
      icon: 'none',
    })
    return
  }

  const configToSave = {
    port: `/dev/ttyS${frameConfig.value.portSuffix}`,
    baudRate: 115200,
    parity: 'N' as 'N' | 'O' | 'E',
    dataBits: 8,
    stopBit: 1,
    hex: true,
  }

  serialStore.frameConfig = configToSave

  uni.showToast({
    title: '68帧串口设置已保存',
    icon: 'success',
  })

  isSerialConfigOpen.value = false
}

const toggleSerial = () => {
  if (isSerialOpen.value) {
    if (isPeriodicRunning.value) {
      serialStore.stopPeriodicRefresh()
    }
    serialStore.closeModbusSerial()
  } else {
    const defaultConfig = {
      port: `/dev/ttyS${serialConfig.value.portSuffix}`,
      baudRate: 115200,
      parity: 'N' as 'N' | 'O' | 'E',
      dataBits: 8,
      stopBit: 1,
      hex: true,
    }

    const config = serialStore.modbusConfig || defaultConfig
    if (!config.port) {
      uni.showToast({
        title: '串口配置错误：端口不能为空',
        icon: 'none',
      })
      return
    }

    const success = serialStore.openModbusSerial(config)
    if (success) {
      serialStore.startPeriodicRefresh()
    }
  }
}

const toggle68FrameSerial = () => {
  if (is68FrameOpen.value) {
    serialStore.close68FrameSerial()
  } else {
    const defaultConfig = {
      port: `/dev/ttyS${frameConfig.value.portSuffix}`,
      baudRate: 115200,
      parity: 'N' as 'N' | 'O' | 'E',
      dataBits: 8,
      stopBit: 1,
      hex: true,
    }

    const config = serialStore.frameConfig || defaultConfig
    if (!config.port) {
      uni.showToast({
        title: '串口配置错误：端口不能为空',
        icon: 'none',
      })
      return
    }
    serialStore.open68FrameSerial(config)
  }
}

const openDatabase = async () => {
  try {
    await SqliteManager.openDB()
    isDatabaseOpen.value = true
    uni.showToast({
      title: '数据库已打开',
      icon: 'success',
    })
    await refreshDatabaseStatus()
  } catch (error) {
    console.error('打开数据库失败:', error)
    uni.showToast({
      title: '打开数据库失败',
      icon: 'none',
    })
  }
}

const refreshDatabaseStatus = async () => {
  try {
    isDatabaseOpen.value = SqliteManager.isOpened()
    isRefreshingDatabaseStatus.value = true

    if (!isDatabaseOpen.value) {
      databaseTables.value.forEach((table) => {
        table.exists = false
      })
      return
    }

    for (const table of databaseTables.value) {
      try {
        table.exists = await SqliteManager.isTableExists(table.name)
      } catch (error) {
        console.error(`检查表 ${table.name} 状态失败:`, error)
        table.exists = false
      }
    }
  } catch (error) {
    console.error('刷新数据库状态失败:', error)
  } finally {
    setTimeout(() => {
      isRefreshingDatabaseStatus.value = false
    }, 1000)
  }
}

const handleSystemMemoryUpdated = (memoryInfo) => {
  serialStore.updateMemoryInfo(memoryInfo)
}

const handleSystemCpuUpdated = (cpuInfo) => {
  serialStore.updateCpuInfo(cpuInfo)
}

const handleSystemRuntimeUpdated = () => {
  formattedRuntime.value = SystemStatusManager.getFormattedRuntime()
}

onMounted(() => {
  uni.$on('systemMemoryUpdated', handleSystemMemoryUpdated)
  uni.$on('systemCpuUpdated', handleSystemCpuUpdated)
  uni.$on('systemRuntimeUpdated', handleSystemRuntimeUpdated)
  uni.$on('systemMemoryWarning', handleMemoryWarning)

  formattedRuntime.value = SystemStatusManager.getFormattedRuntime()
  refreshDatabaseStatus()
})

onUnmounted(() => {
  uni.$off('systemMemoryUpdated', handleSystemMemoryUpdated)
  uni.$off('systemCpuUpdated', handleSystemCpuUpdated)
  uni.$off('systemRuntimeUpdated', handleSystemRuntimeUpdated)
  uni.$off('systemMemoryWarning', handleMemoryWarning)
})

const handleMemoryWarning = (data: { usagePercentage: number; memoryInfo: any }) => {
  uni.showToast({
    title: `应用内存使用过高: ${data.usagePercentage.toFixed(0)}%`,
    icon: 'none',
  })

  if (!isStatusPanelOpen.value) {
    toggleStatusPanel()
  }
}
</script>

<style lang="scss" scoped>
.control-header {
  position: relative;
  display: flex;
  align-items: center;
  overflow: visible;
}
.left {
  display: flex;
  flex: 0 0 40%;
  align-items: center;
  height: 94.2px;
  padding-left: 10px;
  margin-top: 31px;
  background: url('/static/frame/logo-bg.png');
  background-size: 100% 100%;
  .left-logo {
    width: 120px;
    height: 33px;
    background: url('/static/frame/logo.png');
    background-size: 100% 100%;
    transform: translateY(-8px);
  }
  .logo-text {
    margin-left: 2px;
    font-family: 'YouSheBiaoTiHei';
    font-size: 25px;
    font-weight: 500;
    line-height: 40px;
    color: #ffffff;
    letter-spacing: 1px;
    background: linear-gradient(
      to bottom,
      rgba(255, 255, 255, 1) 0%,
      rgba(240, 250, 255, 0.95) 50%,
      rgba(180, 220, 255, 0.9) 100%
    );
    -webkit-background-clip: text;
    background-clip: text;
    transform: translateY(-8px);
    -webkit-text-fill-color: transparent;
  }
}
.right {
  position: relative;
  display: flex;
  flex: 0 0 60%;
  height: 104px;
  margin-top: 21px;
  background: url('/static/frame/nav-decoration.png');
  background-repeat: no-repeat;
  background-position-y: 10px;
  background-size: 100% 100%;
}
.menu-list {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-family: 'AlibabaPuHuiTi';
  font-size: 24px;
  font-weight: 500;
  color: #ffffff;
  white-space: nowrap;
}
.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 32px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

  &::before {
    position: absolute;
    top: 0;
    left: 50%;
    z-index: -1;
    width: 0;
    height: 100%;
    content: '';
    background: url('/static/frame/nav-active.png');
    background-size: 100% 100%;
    opacity: 0;
    transition:
      width 0.3s ease,
      opacity 0.3s ease;
    transform: translateX(-50%);
  }

  &:hover {
    transform: translateY(-2px);
  }

  span {
    position: relative;
    z-index: 1;
    background: linear-gradient(
      0deg,
      rgba(239, 251, 255, 0.85) 0%,
      rgba(152, 212, 250, 0.85) 11.9140625%,
      rgba(255, 254, 254, 0.85) 100%
    );
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    transition:
      color 0.3s ease,
      font-weight 0.3s ease;
  }

  &.active {
    font-weight: bold;
    transform: scale(1.05);

    &::before {
      width: 100%;
      opacity: 1;
    }

    span {
      -webkit-text-fill-color: #fff;
      color: #fff;
    }
  }
}

.status-item {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}

.memory-detail {
  margin-top: -8px;
  margin-bottom: 20px;
}

.memory-info {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  width: 100%;
  color: rgba(255, 255, 255, 0.7);
}

.memory-card {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 6px 8px;
  background: rgba(0, 149, 255, 0.15);
  border: 1px solid rgba(64, 158, 255, 0.3);
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 149, 255, 0.25);
    transform: translateY(-2px);
  }
}

.memory-title {
  margin-bottom: 2px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.memory-value {
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
}

.status-label {
  width: 98px;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
}

.status-value {
  flex: 1;
  font-size: 16px;
  color: #ffffff;
}

.progress-bar {
  flex: 1;
  height: 8px;
  margin-right: 10px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.progress-inner {
  height: 100%;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 4px;
}

.status-item:first-child .progress-inner {
  background: linear-gradient(90deg, #ff7e5f 0%, #feb47b 100%);
}

.cpu-cores {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);

  .status-value {
    font-size: 14px;
  }
}

.success-status {
  color: #00ffcc;
}

.error-status {
  color: #ff4200;
}

.action-btn {
  min-width: 60px;
  height: 30px;
  margin-left: 8px;
  font-size: 14px;
  line-height: 30px;
  color: #4facfe;
  text-align: center;
  cursor: pointer;
  background: rgba(0, 149, 255, 0.2);
  border: 1px solid rgba(64, 158, 255, 0.6);
  border-radius: 4px;

  &:hover {
    background: rgba(0, 149, 255, 0.4);
  }

  &.disabled {
    cursor: not-allowed;
    opacity: 0.5;

    &:hover {
      background: rgba(0, 149, 255, 0.2);
    }
  }
}

.refresh-status {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 30px;
  margin-left: 8px;
}

.pause-icon {
  font-size: 20px;
  color: #ff4200;
}
.db-panel-id {
  padding: 2px 8px;
  margin-left: 10px;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(0, 149, 255, 0.2);
  border: 1px solid rgba(64, 158, 255, 0.4);
  border-radius: 4px;
}

.database-status-content {
  box-sizing: border-box;
  width: 100%;
  padding: 10px;
}

.db-status-section,
.db-tables-section {
  box-sizing: border-box;
  width: 100%;
  margin-bottom: 15px;
  overflow: hidden;
  background: rgba(0, 25, 51, 0.4);
  border-radius: 6px;
}

.db-section-title {
  padding: 8px 12px;
  font-size: 15px;
  font-weight: 500;
  color: #ffffff;
  background: rgba(0, 51, 102, 0.5);
  border-bottom: 1px solid rgba(64, 158, 255, 0.3);
}

.db-status-row {
  display: flex;
  align-items: center;
  padding: 12px;
}

.db-status-dot {
  width: 12px;
  height: 12px;
  margin-right: 6px;
  background: rgba(255, 66, 0, 0.7);
  border-radius: 50%;
  box-shadow: 0 0 4px rgba(255, 66, 0, 0.5);

  &.status-active {
    background: rgba(0, 255, 204, 0.7);
    box-shadow: 0 0 6px rgba(0, 255, 204, 0.5);
  }
}

.db-status-text {
  margin-right: 12px;
  font-size: 15px;
  color: #ffffff;
}

.db-status-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.db-action-btn {
  min-width: 80px;
  height: 30px;
  font-size: 13px;
}

.tables-container {
  box-sizing: border-box;
  width: 100%;
  max-height: 300px;
  padding: 12px;
  overflow-y: auto;
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 25, 51, 0.2);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 149, 255, 0.4);
    border-radius: 3px;

    &:hover {
      background: rgba(0, 149, 255, 0.6);
    }
  }
}

.tables-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  width: 100%;
}

.table-card {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
  padding: 12px;
  overflow: hidden;
  background: rgba(0, 149, 255, 0.15);
  border: 1px solid rgba(64, 158, 255, 0.3);
  border-radius: 8px;
  transition: all 0.25s ease;

  &:hover {
    background: rgba(0, 149, 255, 0.25);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    transform: translateY(-2px);
  }
}

.table-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-top: 2px;
  margin-right: 10px;
  background: rgba(255, 66, 0, 0.2);
  border: 1px solid rgba(255, 66, 0, 0.4);
  border-radius: 6px;

  &.table-exists {
    background: rgba(0, 255, 204, 0.2);
    border: 1px solid rgba(0, 255, 204, 0.4);
  }

  .table-icon-symbol {
    font-size: 16px;
    font-weight: bold;
    color: #ffffff;
  }
}

.table-info {
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  max-width: calc(100% - 70px);
  overflow: hidden;
}

.table-header {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  width: 100%;
  margin-bottom: 4px;
}

.table-name {
  display: block;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.3;
  color: #ffffff;
}

.table-description {
  display: inline-block;
  max-width: 100%;
  padding: 2px 6px;
  margin-left: 4px;
  overflow: hidden;
  font-size: 12px;
  color: #ffffff;
  text-overflow: ellipsis;
  white-space: nowrap;
  background-color: rgba(0, 149, 255, 0.4);
  border-radius: 4px;
}

.table-status {
  margin-top: 4px;
  font-size: 13px;
}

.table-action {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-left: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.table-action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  font-size: 16px;
  font-weight: bold;
  color: #ffffff;
  background: rgba(0, 149, 255, 0.4);
  border-radius: 4px;
  transition: all 0.2s;
}

.table-action:hover .table-action-icon {
  background: rgba(0, 255, 204, 0.4);
}

.init-tables-action {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.db-init-btn {
  min-width: 140px;
  height: 36px;
  padding: 0 20px;
  font-size: 15px;
  font-weight: 500;
  background: linear-gradient(90deg, rgba(0, 120, 215, 0.6), rgba(0, 149, 255, 0.6));
  box-shadow: 0 4px 12px rgba(0, 149, 255, 0.3);

  &:hover {
    background: linear-gradient(90deg, rgba(0, 120, 215, 0.7), rgba(0, 149, 255, 0.7));
    box-shadow: 0 6px 16px rgba(0, 149, 255, 0.4);
    transform: translateY(-2px);
  }
}

.config-item {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.input-group {
  display: flex;
  flex: 1;
  align-items: center;
  font-size: 14px;
}

.input-prefix {
  margin-right: 2px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.config-input {
  flex: 1;
  height: 36px;
  padding: 0 8px;
  font-size: 14px;
  color: #ffffff;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(64, 158, 255, 0.4);
  border-radius: 4px;
}

.port-input {
  width: 60px;
}

.serial-tabs {
  display: flex;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(64, 158, 255, 0.3);
}

.tab-item {
  padding: 8px 16px;
  margin-right: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;

  &:hover {
    color: #ffffff;
  }

  &.active {
    color: #409eff;
    border-bottom-color: #409eff;
  }
}

.tab-content {
  padding: 8px 0;
}

.config-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
