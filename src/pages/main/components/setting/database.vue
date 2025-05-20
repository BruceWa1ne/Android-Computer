<template>
  <view class="database-manager">
    <view class="action-header">
      <view class="header-actions">
        <view class="actions-btn">
          <button
            class="refresh-btn"
            :class="{ rotating: isLoading }"
            @click="debouncedLoadTableCounts"
          >
            <text class="i-material-symbols-sync"></text>
          </button>
        </view>
        <view class="actions-btn">
          <button class="action-btn reset-all-btn" @click="handleResetAll">重置所有数据</button>
        </view>
      </view>
    </view>

    <view class="tables-grid">
      <view v-for="table in databaseTables" :key="table.name" class="table-card">
        <view class="table-info">
          <view class="table-header">
            <view class="table-header-content">
              <view class="table-header-content_left">
                <text class="table-name">{{ table.label }}</text>
                <text class="table-description">{{ table.description }}</text>
              </view>
              <view class="table-header-content_right">
                <view
                  :class="{
                    'i-material-symbols-delete': table.exists,
                    'i-material-symbols:create-new-folder': !table.exists,
                    'text-#f56c6c': table.exists,
                  }"
                  @click="handleTableAction(table.exists ? 'dropTable' : 'createTable', table.name)"
                ></view>
              </view>
            </view>
            <text class="table-count">{{ tableCounts[table.name] || 0 }}条数据</text>
          </view>
          <view class="table-actions">
            <button
              class="action-btn reset-btn"
              :disabled="!tableCounts[table.name]"
              @click="handleResetTable(table.name)"
            >
              重置数据
            </button>
          </view>
        </view>
      </view>
    </view>
  </view>

  <Modal
    ref="modalRef"
    :visible="visible"
    :title="modalConfig.title"
    useMaskClose
    showCancelButton
    showConfirmButton
    @confirm="handleConfirm"
    @close="handleModalClose"
  >
    <view class="confirm-content">
      {{ modalConfig.content }}
    </view>
  </Modal>
</template>

<script setup lang="ts">
import { debounce } from '@/utils/eventTools'
import { ref, onMounted } from 'vue'
import Modal from '@/components/Modal.vue'
import { DatabaseTables } from '@/enum/database'
import SqliteManager from '@/utils/sqlite'
import TablesManager from '@/utils/tables'
import { useMenuLifecycle } from '@/utils/menu-lifecycle'

const modalRef = ref(null)
const visible = ref(false)
const modalConfig = ref({
  title: '',
  content: '',
  action: '',
  targetTable: '',
})

const tableCounts = ref<Record<string, number>>({})
const isLoading = ref(false)

const databaseTables = ref([
  {
    name: DatabaseTables.Record,
    label: '日志记录',
    description: '系统操作和事件日志',
    exists: false,
  },
  {
    name: DatabaseTables.DataCoil,
    label: '线圈电流',
    description: '线圈电流数据',
    exists: false,
  },
  {
    name: DatabaseTables.TempCurve,
    label: '温度曲线',
    description: '温度变化数据',
    exists: false,
  },
  {
    name: DatabaseTables.PartialCurve,
    label: '局放曲线',
    description: '局部放电数据',
    exists: false,
  },
  {
    name: DatabaseTables.StandardDataCoil,
    label: '标准曲线',
    description: '标准曲线数据',
    exists: false,
  },
])

function handleModalClose() {
  visible.value = false
}

async function resetAllTables() {
  try {
    for (const table of databaseTables.value) {
      if (table.exists) {
        await SqliteManager.deleteTableData(table.name)
      }
    }
    uni.showToast({
      title: '所有数据已重置',
      icon: 'success',
    })
  } catch (error) {
    console.error('重置所有数据失败:', error)
    uni.showToast({
      title: '重置失败，请重试',
      icon: 'none',
    })
  } finally {
    visible.value = false
  }
}

async function resetTable(tableName: string) {
  try {
    await SqliteManager.deleteTableData(tableName)
    uni.showToast({
      title: '数据已重置',
      icon: 'success',
    })
  } catch (error) {
    console.error(`重置表 ${tableName} 失败:`, error)
    uni.showToast({
      title: '重置失败，请重试',
      icon: 'none',
    })
  } finally {
    visible.value = false
  }
}

async function dropTable(tableName: string) {
  try {
    await SqliteManager.dropTable(tableName)
    uni.showToast({
      title: `表 ${tableName} 已删除`,
      icon: 'success',
    })
  } catch (error) {
    console.error(`删除表 ${tableName} 失败:`, error)
    uni.showToast({
      title: '删除失败，请重试',
      icon: 'none',
    })
  } finally {
    visible.value = false
  }
}

async function createTable(tableName: string) {
  try {
    const tableTemplate = TablesManager.CommonTables.find((table) => table.tableName === tableName)
    if (tableTemplate) {
      await SqliteManager.initTable(tableTemplate)
      uni.showToast({
        title: `表 ${tableName} 已创建`,
        icon: 'success',
      })
    } else {
      uni.showToast({
        title: `无法查询到表 ${tableName} 的模板`,
        icon: 'none',
      })
    }
  } catch (error) {
    console.error(`创建表 ${tableName} 失败:`, error)
    uni.showToast({
      title: '创建失败，请重试',
      icon: 'none',
    })
  } finally {
    visible.value = false
  }
}

function handleResetAll() {
  if (databaseTables.value.length === 0) {
    uni.showToast({
      title: '没有可重置的数据表',
      icon: 'none',
    })
    return
  }

  modalConfig.value = {
    title: '重置所有数据',
    content: '确定要重置所有表的数据吗？此操作不可恢复。',
    action: 'resetAll',
    targetTable: '',
  }
  visible.value = true
}

function handleResetTable(tableName: string) {
  const table = databaseTables.value.find((t) => t.name === tableName)
  if (!table) return

  modalConfig.value = {
    title: '重置表数据',
    content: `确定要重置"${table.label}"的数据吗？此操作不可恢复。`,
    action: 'resetTable',
    targetTable: tableName,
  }
  visible.value = true
}

async function handleTableAction(action: string, tableName: string) {
  const table = databaseTables.value.find((t) => t.name === tableName)
  if (!table) return
  if (action === 'createTable') {
    modalConfig.value = {
      title: '创建表数据',
      content: `确定要创建"${table.label}"吗？`,
      action: 'createTable',
      targetTable: tableName,
    }
  } else if (action === 'dropTable') {
    modalConfig.value = {
      title: '删除表数据',
      content: `确定要删除"${table.label}"吗？`,
      action: 'dropTable',
      targetTable: tableName,
    }
  }
  visible.value = true
}

async function handleConfirm() {
  uni.showLoading({
    title: '正在重置数据...',
    mask: true,
  })
  try {
    if (modalConfig.value.action === 'resetAll') {
      await resetAllTables()
    } else if (modalConfig.value.action === 'resetTable') {
      await resetTable(modalConfig.value.targetTable)
    } else if (modalConfig.value.action === 'dropTable') {
      await dropTable(modalConfig.value.targetTable)
    } else if (modalConfig.value.action === 'createTable') {
      await createTable(modalConfig.value.targetTable)
    }
    await loadTableCounts()
  } catch (error) {
    console.error('重置数据失败:', error)
    uni.showToast({
      title: '重置失败，请重试',
      icon: 'none',
    })
  } finally {
    uni.hideLoading()
  }
}

async function loadTableCounts() {
  if (isLoading.value) return

  isLoading.value = true
  try {
    for (const table of databaseTables.value) {
      const tableExists = await SqliteManager.isTableExists(table.name)
      table.exists = tableExists
      if (!tableExists) {
        tableCounts.value[table.name] = 0
        continue
      }

      const result = await TablesManager.getPageCount(table.name)
      if (result && result[0] && result[0].num !== undefined) {
        tableCounts.value[table.name] = result[0].num
      } else {
        tableCounts.value[table.name] = 0
      }
    }
    uni.showToast({
      title: '数据刷新成功',
      icon: 'success',
    })
  } catch (error) {
    console.error('加载表数据计数失败:', error)
    databaseTables.value.forEach((table) => {
      tableCounts.value[table.name] = 0
    })
    uni.showToast({
      title: '刷新失败，请重试',
      icon: 'none',
    })
  } finally {
    setTimeout(() => {
      isLoading.value = false
    }, 1000)
  }
}

const debouncedLoadTableCounts = debounce(loadTableCounts, 1000)

useMenuLifecycle('setting-database', async () => {
  await loadTableCounts()
})

onMounted(async () => {
  await loadTableCounts()
})

defineExpose({
  hideAnimation: () => {
    modalRef.value?.hideAnimation()
  },
})
</script>

<style lang="scss" scoped>
.database-manager {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 20px;
}

.action-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  align-items: center;
}

.actions-btn {
  display: flex;
  align-items: center;
}

.actions-btn + .actions-btn {
  margin-left: 12px;
}

.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 10px;
}

.table-card {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  width: 100%;
  padding: 16px;
  background: rgba(0, 149, 255, 0.15);
  border: 1px solid rgba(64, 158, 255, 0.3);
  border-radius: 8px;
  transition: all 0.25s ease;
}

.table-info {
  flex: 1;
  min-width: 0;
}

.table-header {
  margin-bottom: 12px;
}

.table-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  &_left {
    display: flex;
    align-items: center;
  }
  &_right {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    color: #fff;
  }
}

.table-name {
  margin-right: 8px;
  font-size: 16px;
  font-weight: 500;
  color: #ffffff;
}

.table-description {
  display: inline-block;
  max-width: 100%;
  padding: 2px 6px;
  margin-left: 4px;
  overflow: hidden;
  font-size: 12px;
  font-weight: bold;
  color: #ffffff;
  text-overflow: ellipsis;
  white-space: nowrap;
  background-color: rgba(0, 149, 255, 0.4);
  border-radius: 4px;
}

.table-count {
  display: block;
  margin-top: 4px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.table-actions {
  display: flex;
  justify-content: flex-end;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.action-btn {
  min-width: 100px;
  height: 36px;
  padding: 0 16px;
  font-size: 14px;
  color: #ffffff;
  background: rgba(0, 149, 255, 0.3);
  border: 1px solid rgba(64, 158, 255, 0.5);
  border-radius: 4px;
  transition: all 0.2s ease;

  &:active {
    transform: scale(0.98);
  }
}

.action-btn[disabled] {
  cursor: not-allowed;
  opacity: 0.5;
}

.reset-all-btn {
  background: rgba(255, 66, 0, 0.3);
  border-color: rgba(255, 66, 0, 0.5);

  &:hover {
    background: rgba(255, 66, 0, 0.4);
    box-shadow: 0 2px 8px rgba(255, 66, 0, 0.3);
  }
}

.confirm-content {
  padding: 20px;
  font-size: 16px;
  color: #ffffff;
  text-align: center;
}

.no-tables-message {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 200px;
  margin-top: 20px;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: #ffffff;
  background: rgba(0, 149, 255, 0.3);
  border: 1px solid rgba(64, 158, 255, 0.5);
  border-radius: 50%;
  transition: all 0.2s ease;
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
