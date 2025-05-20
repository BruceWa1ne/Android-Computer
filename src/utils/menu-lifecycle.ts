import { onMounted, onUnmounted } from 'vue'

/**
 * 为菜单组件添加激活/停用生命周期钩子
 *
 * @param menuCode 菜单项代码
 * @param onActivateCallback 当组件被激活时调用的回调函数
 * @param onDeactivateCallback 当组件被停用时调用的回调函数
 */
export function useMenuLifecycle(
  menuCode: string,
  onActivateCallback: () => void,
  onDeactivateCallback?: () => void,
) {
  const handleActivate = () => {
    onActivateCallback()
  }

  const handleDeactivate = () => {
    if (onDeactivateCallback) {
      onDeactivateCallback()
    }
  }

  onMounted(() => {
    uni.$on(`menu:activate:${menuCode}`, handleActivate)

    if (onDeactivateCallback) {
      uni.$on(`menu:deactivate:${menuCode}`, handleDeactivate)
    }
  })

  onUnmounted(() => {
    uni.$off(`menu:activate:${menuCode}`, handleActivate)

    if (onDeactivateCallback) {
      uni.$off(`menu:deactivate:${menuCode}`, handleDeactivate)
    }
  })
}
