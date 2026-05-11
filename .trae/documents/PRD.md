# 动态3D正方体 - 产品需求文档

## 1. 概念与愿景

一个沉浸式的动态3D正方体可视化体验。正方体悬浮在深色空间中，持续进行优雅的旋转动画，同时带有脉动的发光效果。这不是一个简单的几何演示，而是一个具有生命力的小型数字艺术品，能够吸引用户的视觉注意力并带来科技感与未来感的氛围。

## 2. 设计语言

### 美学方向
- **风格**: 赛博朋克 + 极简主义
- **氛围**: 深邃、科技感、数字艺术

### 色彩系统
```
主色: #00f5ff (青色霓虹)
次色: #ff00ff (品红霓虹)
强调色: #ffff00 (黄色高光)
背景: #0a0a0f (深空黑)
边框/线框: rgba(0, 245, 255, 0.6)
```

### 排版
- **标题字体**: Orbitron (Google Fonts) - 科技感强
- **备用**: 'Courier New', monospace

### 动效哲学
- 正方体持续旋转 (X轴: 0.005rad/frame, Y轴: 0.008rad/frame)
- 发光效果脉动 (opacity 在 0.3-0.8 之间循环)
- 边缘线框闪烁效果
- 所有动画使用 requestAnimationFrame 实现流畅的60fps

### 视觉资产
- Three.js 渲染引擎
- 自定义着色器实现发光效果
- CSS radial-gradient 背景光晕

## 3. 布局与结构

### 页面结构
```
┌─────────────────────────────────┐
│         全屏画布区域            │
│                                 │
│                                 │
│         [3D 正方体]            │
│                                 │
│                                 │
└─────────────────────────────────┘
      底部标题 + 装饰线
```

### 响应式策略
- Canvas 自动适应窗口大小
- 正方体大小保持视觉比例
- 移动端优化触摸交互

## 4. 功能与交互

### 核心功能
1. **持续旋转动画**
   - X轴旋转: 0.005 rad/frame
   - Y轴旋转: 0.008 rad/frame
   - Z轴旋转: 0.002 rad/frame

2. **发光脉动效果**
   - 使用 EdgesGeometry 绘制线框
   - 脉动周期: 2秒
   - 使用 sine 函数控制 opacity

3. **鼠标交互**
   - 鼠标悬停时旋转速度增加
   - 拖拽可以手动旋转视角
   - 滚轮缩放

### 边界情况
- 窗口resize时自动调整
- 低性能设备降级处理

## 5. 组件清单

### Canvas 容器
- 全屏覆盖
- 背景: radial-gradient 模拟深空
- 居中放置 3D 场景

### 3D 正方体组件
- BoxGeometry (2x2x2 单位)
- MeshPhongMaterial (半透明 + 高光)
- EdgesGeometry (线框发光)
- 环绕的光晕粒子效果

### 装饰元素
- 底部标题: "DYNAMIC CUBE"
- 装饰性霓虹线条

## 6. 技术方案

### 技术栈
- Three.js r152+ (CDN)
- 原生 JavaScript ES6+
- 单 HTML 文件架构

### 关键实现
- WebGLRenderer with antialiasing
- PerspectiveCamera (FOV: 75, near: 0.1, far: 1000)
- AmbientLight + PointLight 照明
- Animation Loop 使用 requestAnimationFrame

### 性能考虑
- 使用 BufferGeometry
- 避免内存泄漏 (正确的 dispose)
- 合理的渲染分辨率
