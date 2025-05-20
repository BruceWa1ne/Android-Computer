<template>
  <ContentContainer>
    <SubLayout
      :componentsMap="componentsMap"
      :menuItems="SETTING_MENU_ITEMS"
      :pageType="PageType.Setting"
      :showBottomBar="false"
      @change="handleTabChange"
    />
  </ContentContainer>
</template>

<script lang="ts" setup>
import { markRaw } from 'vue'
import { SETTING_MENU_ITEMS } from '@/utils/menu'
import { PageType } from '@/enum/page-type'
import ContentContainer from '@/components/Content-Container.vue'
import SubLayout from '@/components/Sub-Layout.vue'
import SettingAlarm from '../components/setting/alarm.vue'
import SettingBackstage from '../components/setting/backstage.vue'
import SettingDatabase from '../components/setting/database.vue'
import SettingDelay from '../components/setting/delay.vue'
import SettingCamera from '../components/setting/carmera.vue'

const componentsMap = {
  'setting-alarm': markRaw(SettingAlarm),
  'setting-backstage': markRaw(SettingBackstage),
  'setting-database': markRaw(SettingDatabase),
  'setting-delay': markRaw(SettingDelay),
  'setting-camera': markRaw(SettingCamera),
}

const activeMenuIndex = ref(0)

const handleTabChange = (index) => {
  activeMenuIndex.value = index
}

const handleMainMenuActivate = () => {
  const currentMenuCode = SETTING_MENU_ITEMS[activeMenuIndex.value].code
  uni.$emit(`menu:activate:${currentMenuCode}`)
}

onMounted(() => {
  uni.$on('menu:activate:setting', handleMainMenuActivate)
})

onUnmounted(() => {
  uni.$off('menu:activate:setting', handleMainMenuActivate)
})
</script>

<style lang="scss" scoped>
.setting-grid {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.placeholder-content {
  font-size: 24px;
  color: #fff;
}
</style>
