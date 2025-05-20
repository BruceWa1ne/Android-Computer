<!--
 * @Author: Stephen_zhou
 * @Date: 2025-03-21 10:19:14
 * @LastEditors: Stephen_zhou
 * @LastEditTime: 2025-03-21 10:19:14
 * @Description: 内容容器组件 ContentContainer
-->
<template>
  <view class="content-wrapper">
    <view class="content-box">
      <view class="content-inner">
        <slot></slot>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup></script>

<style lang="scss" scoped>
.content-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  transition: opacity 0.3s ease;
}

.content-box {
  position: relative;
  flex: 1;
  height: 100%;
  background: rgba(0, 19, 48, 0.6);
  border-radius: 10px;
  transition: all 0.3s ease;
}

.content-inner {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: transform 0.3s ease;
}
</style>
