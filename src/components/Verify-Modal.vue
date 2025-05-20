<template>
  <Modal
    ref="modalRef"
    :visible="visible"
    :title="title"
    :useMaskClose="useMaskClose"
    @close="handleClose"
    @confirm="handleVerify"
  >
    <view class="verify-modal">
      <view class="form-item">
        <view class="label">账号</view>
        <input type="text" v-model="username" class="input" placeholder="请输入账号" />
      </view>
      <view class="form-item">
        <view class="label">密码</view>
        <input
          type="text"
          v-model="password"
          class="input password-input"
          placeholder="请输入密码"
        />
      </view>
      <view class="error-message" v-if="errorMsg">{{ errorMsg }}</view>
    </view>
  </Modal>
</template>

<script lang="ts" setup>
import Modal from './Modal.vue'
import { ref } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '验证身份',
  },
  useMaskClose: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(['close', 'update:visible', 'verify'])

const username = ref('admin')
const password = ref('123456')
const errorMsg = ref('')
const modalRef = ref(null)

function handleClose() {
  emit('update:visible', false)
  resetForm()
}

function handleVerify() {
  if (!username.value) {
    errorMsg.value = '请输入账号'
    return
  }
  if (!password.value) {
    errorMsg.value = '请输入密码'
    return
  }

  const success = username.value === 'admin' && password.value === '123456'

  if (success) {
    errorMsg.value = ''
    emit('verify', true)
    modalRef.value?.hideAnimation()
    setTimeout(() => {
      resetForm()
    }, 300)
  } else {
    errorMsg.value = '账号或密码错误'
    emit('verify', false)
  }
}

function resetForm() {
  errorMsg.value = ''
}

defineExpose({
  hideAnimation: () => {
    modalRef.value?.hideAnimation()
  },
})
</script>

<style lang="scss" scoped>
.verify-modal {
  box-sizing: border-box;
  width: 100%;

  .form-item {
    display: flex;
    align-items: center;
    margin-bottom: 20px;

    .label {
      width: 100px;
      margin-bottom: 8px;
      font-size: 16px;
      color: #fff;
    }

    .input {
      width: 100%;
      height: 40px;
      padding: 0 12px;
      font-size: 14px;
      color: #fff;
      background-color: #0d1b3e;
      border: 1px solid #1e3c72;
      border-radius: 4px;
      outline: none;

      &::placeholder {
        color: rgba(255, 255, 255, 0.3);
      }

      &:focus {
        border-color: #3a6fc9;
      }

      &.password-input {
        -webkit-text-security: disc;
      }
    }
  }

  .error-message {
    margin-bottom: 20px;
    font-size: 14px;
    color: #ff4d4f;
  }
}
</style>
