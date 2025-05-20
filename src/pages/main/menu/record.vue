<template>
  <ContentContainer>
    <view class="record-grid">
      <view class="placeholder-content">
        <Table
          :listName="tableColumns"
          :data="tableData"
          :showIndex="true"
          :total="total"
          @change="pageChange"
          :loading="isLoading"
          height="100%"
        />
      </view>
    </view>
  </ContentContainer>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import ContentContainer from '@/components/Content-Container.vue'
import Table from '@/components/Table.vue'
import TablesManager from '@/utils/tables'
import { useMenuLifecycle } from '@/utils/menu-lifecycle'

const TABLE_NAME = 'record'
const PAGE_SIZE = 10

const tableColumns = ref([
  ['eventTime', 'eventName', 'eventDescription'],
  ['日期', '事件', '执行结果'],
])

const tableData = ref([])

const current = ref(1)
const total = ref(0)
const isLoading = ref(false)

const loadData = async () => {
  isLoading.value = true

  try {
    const [dataResult, countResult] = await Promise.all([
      TablesManager.getDataList(current.value, PAGE_SIZE, TABLE_NAME, 'desc', 'eventTime'),
      TablesManager.getPageCount(TABLE_NAME),
    ])

    tableData.value = Array.isArray(dataResult) ? dataResult : []
    total.value = countResult?.[0]?.num || 0
  } catch (error) {
    uni.showToast({
      title: error.message || '加载记录数据失败',
      icon: 'none',
    })
    tableData.value = []
    total.value = 0
  } finally {
    isLoading.value = false
  }
}

const pageChange = (page) => {
  if (page === current.value) return
  current.value = page
  loadData()
}

useMenuLifecycle('record', loadData)

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.record-grid {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}
</style>
