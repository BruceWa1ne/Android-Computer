<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import 'abortcontroller-polyfill/dist/abortcontroller-polyfill-only'
import SystemStatusManager from '@/utils/systemStatus'
import SqliteManager from '@/utils/sqlite'
import TablesManager from '@/utils/tables'
import CurveManager from '@/utils/curveManager'

const TRIM_MEMORY_RUNNING = {
  MODERATE: 5, // 进程在后台LRU列表的中间；释放内存可以帮助系统保持列表中稍后运行的其他进程，以获得更好的整体性能。
  LOW: 10, // 该进程不是可消耗的后台进程，但设备内存不足
  CRITICAL: 15, // 该进程不是可消耗的后台进程，但设备运行的内存极低，即将无法保持任何后台进程运行。
}

const initDatabaseTables = async () => {
  try {
    if (!SqliteManager.isOpened()) {
      await SqliteManager.openDB()
    }

    await TablesManager.initializeDeviceTables()
  } catch (error) {
    console.error('数据库表初始化失败:', error)
  }
}

onLaunch(() => {
  console.log('App Launch')
  // #ifdef APP-PLUS
  // 应用启动时初始化数据库和表
  initDatabaseTables()

  // 初始化曲线管理器
  CurveManager.initialize()

  uni.onMemoryWarning((res) => {
    console.log('内存监测', res)
    if (
      [
        TRIM_MEMORY_RUNNING.CRITICAL,
        TRIM_MEMORY_RUNNING.LOW,
        TRIM_MEMORY_RUNNING.MODERATE,
      ].includes(res.level)
    ) {
      SystemStatusManager.forceGarbageCollection()
      uni.$emit('systemMemoryWarning', {
        usagePercentage: 80, // 估计值
        memoryInfo: SystemStatusManager.getMemoryInfo(),
        level: res.level,
      })
    }
  })
  // #endif
})

onShow(() => {
  console.log('App Show')
  SystemStatusManager.startMonitoring()

  // #ifdef APP-PLUS
  // 如果应用从后台恢复，确保数据库连接正常
  if (!SqliteManager.isOpened()) {
    SqliteManager.openDB()
  }
  // #endif
})

onHide(() => {
  console.log('App Hide')
  if (SqliteManager.isOpened()) {
    SqliteManager.closeDB()
  }

  // 清理曲线管理器资源
  CurveManager.cleanup()

  setTimeout(() => {
    SystemStatusManager.forceGarbageCollection()
  }, 200)
})
</script>

<style lang="scss">
/* stylelint-disable selector-type-no-unknown */
button::after {
  border: none;
}

swiper,
scroll-view {
  flex: 1;
  height: 100%;
  overflow: hidden;
}

image {
  width: 100%;
  height: 100%;
  vertical-align: middle;
}

// 单行省略，优先使用 unocss: text-ellipsis
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// 两行省略
.ellipsis-2 {
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

// 三行省略
.ellipsis-3 {
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}
</style>
