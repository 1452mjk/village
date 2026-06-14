/// <reference types="vite/client" />

// 声明.vue文件的类型，让TypeScript能识别
// declare module '*.vue' {
//   import type { DefineComponent } from 'vue'
//   // 匹配Vue组件的类型定义，兼容任意props/emit/setup
//   const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
//   export default component
// }


declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}


// declare module '*.vue' {
//   import type { Component } from 'vue'
//   const component: Component
//   export default component
// }