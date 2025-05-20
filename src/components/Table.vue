<!--
 * @Author: Stephen_zhou
 * @Date: 2025-04-09 10:19:14
 * @LastEditors: Stephen_zhou
 * @LastEditTime: 2025-04-09 10:19:14
 * @Description: 数据表格组件
-->
<template>
  <view class="data-table-container" :style="{ width: convertToViewportUnits(width) }">
    <view class="data-table">
      <table>
        <thead>
          <tr>
            <td style="width: 50px" v-if="showIndex">序号</td>
            <td v-for="(item, idx) in listName[1]" :key="idx">{{ item }}</td>
          </tr>
        </thead>
        <tbody ref="tableBody" class="table-body" :style="bodyStyle">
          <tr
            v-for="(item, idx) in data"
            :key="idx"
            @click="handleSelect(idx)"
            :class="{ 'row-selected': selectIdx === idx && selection }"
          >
            <td style="width: 50px" v-if="showIndex">{{ idx + 1 }}</td>
            <td v-for="(i, n) in listName[0]" :key="n">{{ item[i] }}</td>
          </tr>
          <tr v-if="data.length === 0" class="empty-data-row">
            <td
              :colspan="showIndex ? listName[1].length + 1 : listName[1].length"
              class="empty-row"
            >
              暂无数据
            </td>
          </tr>
        </tbody>
      </table>
    </view>
    <view class="pagination-container">
      <view class="uni-pagination-box page">
        <uni-pagination
          show-icon
          :page-size="size"
          :current="pageCurrent"
          :total="props.total"
          @change="handleChange"
        />
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { convertToViewportUnits } from '@/utils'

const props = defineProps({
  listName: {
    // 二维数组[[key],[列名称]]
    type: Array,
    default: () => [[], []],
    required: true,
  },
  data: {
    type: Array,
    default: () => [],
    required: true,
  },
  width: {
    type: [String, Number],
    default: '',
  },
  showIndex: {
    type: Boolean,
    default: false,
  },
  height: {
    type: String,
    default: '',
  },
  selection: {
    type: Boolean,
    default: false,
  },
  total: {
    type: Number,
    default: 0,
  },
  size: {
    type: Number,
    default: 10,
  },
})
const emit = defineEmits(['change', 'select'])

const tableBody = ref(null)
const selectIdx = ref(null)
const pageCurrent = ref(1)

const bodyStyle = computed(() => {
  if (props.height) {
    return {
      height: convertToViewportUnits(props.height),
      overflow: 'auto',
    }
  } else if (props.data.length === 0) {
    return {
      height: '100%',
      overflow: 'auto',
    }
  } else {
    return {
      height: 'auto',
      maxHeight: 'calc(50vh - 50px)',
      overflow: 'auto',
    }
  }
})

const handleChange = (val) => {
  pageCurrent.value = val.current
  emit('change', pageCurrent.value)
}

const handleSelect = (val) => {
  selectIdx.value = val
  emit('select', props.data[val])
}

watch(
  () => props.data,
  () => {
    selectIdx.value = null
  },
)
</script>

<style lang="scss" scoped>
.data-table-container {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.data-table {
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100%;
  overflow: hidden;
  font-family: Source Han Sans CN;
  font-size: 16px;
  font-weight: 500;
  color: #ffffff;
  text-align: center;

  table {
    display: flex;
    flex-direction: column;
    width: 99%;
    height: 100%;
    margin: 0 auto;
    table-layout: fixed;
    border-collapse: collapse;
  }

  thead {
    display: table;
    width: 100%;
    table-layout: fixed;
    background-color: #07265f;
  }

  table tr td {
    height: 40px;
    padding: 8px;
    border: 1px solid #07d9ff;
  }

  tbody {
    display: flex;
    flex: 1;
    flex-direction: column;
    width: 100%;
  }

  tbody tr {
    display: table;
    width: 100%;
    table-layout: fixed;
  }

  .empty-data-row {
    display: flex;
    flex: 1;
    height: 100%;
  }

  .row-selected {
    background-color: #00528a;
    transition: background-color 0.2s ease;
  }

  .empty-row {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    font-size: 18px;
    text-align: center;
    background-color: rgba(7, 38, 95, 0.3);
  }
}

.table-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100%;
  overflow-y: auto;
  &::-webkit-scrollbar {
    display: none;
  }
}

.pagination-container {
  width: 100%;
  padding: 10px 0;
}

.page {
  display: flex;
  justify-content: flex-end;
  margin: 10px;
}
</style>
