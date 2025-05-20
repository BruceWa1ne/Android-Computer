import { defineUniPages } from '@uni-helper/vite-plugin-uni-pages'

export default defineUniPages({
  globalStyle: {
    navigationStyle: 'default',
    navigationBarTitleText: '安卓工业屏',
    navigationBarBackgroundColor: '#f8f8f8',
    navigationBarTextStyle: 'black',
    backgroundColor: '#FFFFFF',
    pageOrientation: 'landscape',
    rpxCalcMaxDeviceWidth: 1920,
    rpxCalcBaseDeviceWidth: 1280,
    rpxCalcIncludeWidth: 9999,
    dynamicRpx: false,
    'app-plus': {
      titleView: false,
    },
  },
  easycom: {
    autoscan: true,
    custom: {
      '^wd-(.*)': 'wot-design-uni/components/wd-$1/wd-$1.vue',
      '^(?!z-paging-refresh|z-paging-load-more)z-paging(.*)':
        'z-paging/components/z-paging$1/z-paging$1.vue',
      '^uni-(.*)': '@dcloudio/uni-ui/lib/uni-$1/uni-$1.vue',
    },
  },
  pages: [
    {
      path: 'pages/main/index',
    },
  ],
})
