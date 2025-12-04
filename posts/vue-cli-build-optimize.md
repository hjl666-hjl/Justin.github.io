# Vue CLI打包优化指南

> 本文详细介绍Vue CLI项目打包时的各种优化技巧，帮助你显著减小打包体积，提升首屏加载速度。

## 问题背景

使用 `npm run build` 打包Vue项目时，经常会遇到以下问题：
- `vendor.js` 文件过大，首屏加载缓慢
- 打包生成大量 `.map` 文件，部署包体积庞大
- 压缩不彻底，还有优化空间

## 优化方案

### 1. CDN引入第三方库

**原因**：vue-cli打包时默认会把 `dependencies` 中的依赖统一打包到 `vendor.js` 中。

**解决方案**：将Vue、axios、element-ui等稳定依赖通过CDN引入。

#### 步骤一：在 `index.html` 中引入CDN

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>My App</title>
  <!-- CDN引入Vue -->
  <script src="https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.min.js"></script>
  <!-- CDN引入axios -->
  <script src="https://cdn.jsdelivr.net/npm/axios@0.21.1/dist/axios.min.js"></script>
  <!-- CDN引入Element UI -->
  <link href="https://cdn.jsdelivr.net/npm/element-ui@2.15.6/lib/theme-chalk/index.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/element-ui@2.15.6/lib/index.js"></script>
</head>
<body>
  <div id="app"></div>
</body>
</html>
```

#### 步骤二：配置 webpack externals

在 `vue.config.js` 中添加：

```javascript
module.exports = {
  configureWebpack: {
    externals: {
      'vue': 'Vue',
      'axios': 'axios',
      'element-ui': 'ELEMENT'
    }
  }
}
```

#### 步骤三：删除 main.js 中的 import 语句

```javascript
// 删除以下import语句
// import Vue from 'vue'
// import axios from 'axios'
// import ElementUI from 'element-ui'
```

### 2. 关闭 Source Map

**原因**：打包时会生成 `.map` 文件用于调试，但生产环境不需要。

**解决方案**：在 `vue.config.js` 中配置：

```javascript
module.exports = {
  productionSourceMap: false
}
```

### 3. 开启 Gzip 压缩

**原因**：webpack自带Gzip压缩功能，但默认未开启。

#### 步骤一：安装插件

```bash
npm install compression-webpack-plugin@6.1.1 --save-dev
```

#### 步骤二：配置 vue.config.js

```javascript
const CompressionPlugin = require('compression-webpack-plugin')

module.exports = {
  configureWebpack: config => {
    if (process.env.NODE_ENV === 'production') {
      return {
        plugins: [
          new CompressionPlugin({
            algorithm: 'gzip',
            test: /\.(js|css|html)$/,
            threshold: 10240,
            minRatio: 0.8
          })
        ]
      }
    }
  }
}
```

## 优化效果对比

| 优化项 | 优化前 | 优化后 | 减少比例 |
|--------|--------|--------|----------|
| vendor.js | 2.1MB | 320KB | 85% |
| 总包体积 | 5.8MB | 1.2MB | 79% |
| 首屏加载 | 4.2s | 1.1s | 74% |

## 总结

通过以上三个优化方案，可以显著减小Vue项目的打包体积，提升用户体验。建议在项目初期就配置好这些优化项，避免后期重构的麻烦。

---

*本文作者：Justin*  
*发布日期：2024-12-01*
