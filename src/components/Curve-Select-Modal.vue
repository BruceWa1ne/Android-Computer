<!--
 * @Author: Stephen_zhou
 * @Date: 2025-03-21 10:19:14
 * @LastEditors: Stephen_zhou
 * @LastEditTime: 2025-03-21 10:19:14
 * @Description: 曲线数据选择弹窗组件
-->
<template>
  <Modal
    ref="modalRef"
    :visible="visible"
    :title="title"
    :useMaskClose="useMaskClose"
    :showConfirmButton="false"
    width="70%"
    @close="handleClose"
  >
    <view class="curve-select-modal">
      <view class="select">
        <view class="item">
          <view class="date mr-26px">
            <view>日期选择：</view>
            <uni-datetime-picker
              v-model="datetimerange"
              type="daterange"
              rangeSeparator="至"
              @change="timeChange"
            />
          </view>
          <view class="btn-style">
            <button @click="saveStandardCurve" class="onetouch-btn" :disabled="!isSeleted">
              设置标准曲线
            </button>
          </view>
        </view>
        <view class="item">
          <view class="select">
            <view>动作类型：</view>
            <uni-data-select v-model="actionType" :localdata="actionTypes"></uni-data-select>
          </view>
          <view class="select">
            <view>数据类型：</view>
            <uni-data-select v-model="dataType" :localdata="dataTypes"></uni-data-select>
          </view>
          <view class="btn-style">
            <button @click="search" class="onetouch-btn">搜索</button>
          </view>
          <view class="btn-style">
            <button :disabled="!isSeleted" @click="comfirm" class="onetouch-btn">确定</button>
          </view>
        </view>
      </view>
      <view class="standard-now">
        <view class="standard">当前合闸标准曲线序号：{{ closeId || '--' }}</view>
        <view class="standard">当前分闸标准曲线序号：{{ openId || '--' }}</view>
      </view>
      <view class="table-container">
        <Table
          height="100%"
          :listName="head"
          :data="tableData"
          :showIndex="false"
          selection
          @change="pageChange"
          @select="selectCurve"
          :total="total"
          :size="5"
        />
      </view>
    </view>
  </Modal>
</template>

<script lang="ts" setup>
import Modal from './Modal.vue'
import Table from './Table.vue'
import { ref, watch, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import TablesManager from '@/utils/tables'
import { deepClone } from '@/utils'
import { CurveDataType, DataType } from '@/enum/states'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '选择数据',
  },
  useMaskClose: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['close', 'update:visible'])

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      getStandardCurveId()
      loadData()
    }
  },
)

const TABLE_NAME = 'data_coil'
const PAGE_SIZE = 5

const isLoading = ref(false)
const datetimerange = ref([])
const openId = ref('')
const closeId = ref('')
const startTime = ref('')
const endTime = ref('')
const head = ref([
  ['id', 'type', 'dataType', 'actionTime'],
  ['动作序号', '动作类型', '数据类型', '动作时间'],
])
const tableData = ref([])
const current = ref(1)
const total = ref(0)
const selectedCurve = ref<any>({})
const actionType = ref('') // 动作类型
const actionTypes = ref([
  { value: 0, text: '分闸' },
  { value: 1, text: '合闸' },
])
const dataType = ref('') // 数据类型
const dataTypes = ref([
  { value: 0, text: '正常' },
  { value: 1, text: '异常' },
])

const params = computed(() => {
  const _return = {
    sTime: startTime.value ? startTime.value + ' 00:00:00' : '',
    eTime: endTime.value ? endTime.value + ' 23:59:59' : '',
    actionType: actionType.value !== '' ? Number(actionType.value) : '',
    dataType: dataType.value !== '' ? Number(dataType.value) : '',
  }
  return _return
})

const isSeleted = computed(() => {
  return selectedCurve.value.id
})

const timeChange = (val) => {
  if (val.length !== 0) {
    startTime.value = val[0]
    endTime.value = val[1]
  } else {
    startTime.value = ''
    endTime.value = ''
  }
}

const search = () => {
  current.value = 1
  loadData()
}

const comfirm = () => {
  uni.$emit('updateStandardCurve', selectedCurve.value)
  handleClose()
}

const saveStandardCurve = () => {
  try {
    TablesManager.saveStandard(selectedCurve.value, 'standardDataCoil', {
      addTimestamp: true,
      timestampField: 'addTime',
    })
    if (selectedCurve.value.type === DataType.CLOSE) {
      closeId.value = selectedCurve.value.id.toString() || ''
      openId.value = ''
    } else {
      openId.value = selectedCurve.value.id.toString() || ''
      closeId.value = ''
    }
    uni.showToast({
      title: '设置成功',
      duration: 2000,
    })
  } catch (error) {
    uni.showToast({
      title: error.message || '设置失败',
      icon: 'none',
    })
  }
}

const selectCurve = (val) => {
  selectedCurve.value = deepClone(val)
  selectedCurve.value.type = val.type === '合闸' ? DataType.CLOSE : 0
  selectedCurve.value.dataType =
    val.dataType === '正常' ? CurveDataType.NORMAL : CurveDataType.EXCEPTION
}

const loadData = async () => {
  isLoading.value = true

  try {
    const [dataResult, countResult] = await Promise.all([
      TablesManager.getDataList(current.value, PAGE_SIZE, TABLE_NAME, 'asc', 'id', params.value),
      TablesManager.getPageCount(TABLE_NAME),
    ])
    tableData.value =
      Array.isArray(dataResult) &&
      dataResult.map((item) => ({
        ...item,
        type: item.type === DataType.CLOSE ? '合闸' : '分闸',
        dataType: item.dataType === CurveDataType.NORMAL ? '正常' : '异常',
      }))
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

function handleClose() {
  emit('update:visible', false)
  initData()
}

async function getStandardCurveId() {
  const res = await TablesManager.getStandardData('standardDataCoil', {})
  if (res.length > 0) {
    const standardData = res[0]
    if (standardData.type === DataType.OPEN) {
      openId.value = standardData.id.toString() || ''
      closeId.value = ''
    } else {
      closeId.value = standardData.id.toString() || ''
      openId.value = ''
    }
  } else {
    openId.value = ''
    closeId.value = ''
  }
}

function initData() {
  selectedCurve.value = {}
  actionType.value = ''
  dataType.value = ''
  datetimerange.value = []
  startTime.value = ''
  endTime.value = ''
  current.value = 1
  openId.value = ''
  closeId.value = ''
}
</script>

<style lang="scss" scoped>
.curve-select-modal {
  width: 100%;
  height: calc(100vh - 260px);
}
.select {
  font-size: 14px;
  .item {
    display: flex;
    align-items: center;
    height: 10%;
    margin: 10px;
    color: #fff;
    .date {
      display: flex;
      align-items: center;
      width: 60%;
    }
    .select {
      display: flex;
      align-items: center;
      width: 30%;
      margin-right: 4px;
    }
    .select + .select {
      margin-left: 20px;
    }
  }
  .item + .item {
    margin-top: 20px;
  }
}

.standard-now {
  display: flex;
  margin-bottom: 20px;
  font-size: 14px;
  color: #fff;
  .standard {
    margin-right: 10px;
  }
}

.btn-style {
  margin: 0 10px;
  button {
    box-sizing: border-box;
    width: 100%;
    padding: 10px 20px;
    font-family: Source Han Sans CN;
    font-size: 14px;
    line-height: 16px;
    color: #179aff;
    text-align: center;
    background-color: #051635;
  }
}

.onetouch-btn[disabled] {
  cursor: not-allowed;
  opacity: 0.5;
}

::v-deep .uniui-arrowthinright {
  font-size: 16px !important;
  line-height: 40px !important;
}

::v-deep .uniui-clear {
  font-size: 22px !important;
}

::v-deep .uni-date-x .icon-calendar {
  font-size: 22px !important;
}

::v-deep .uni-select__selector {
  background-color: #07265f;
}

::v-deep .uni-select__input-placeholder {
  color: #fff;
}

::v-deep .uni-select__input-text {
  color: #fff;
}

::v-deep .uni-date-x {
  color: #fff;
  background-color: transparent;
}
</style>
