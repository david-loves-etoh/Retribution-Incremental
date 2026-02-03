// ============================================
// 树形渲染系统 - 配置模块
// ============================================

const TreeRendererConfig = {
  // 画布ID
  canvasId: "treeCanvas",
  containerId: "treeTab",
  
  // 颜色主题配置
  colorThemes: {
    default: [
      "#3498db", // 蓝色 - 主连接线
      "#e74c3c", // 红色 - 重要连接
      "#2ecc71", // 绿色 - 解锁状态
      "#f39c12", // 橙色 - 活动状态
      "#9b59b6", // 紫色 - 特殊连接
      "#1abc9c", // 青绿色
      "#34495e", // 深蓝色
      "#e67e22", // 胡萝卜色
      "#16a085", // 绿色海洋
      "#8e44ad"  // 紫色
    ],
    
    // 可以添加更多主题
    dark: [
      "#2980b9",
      "#c0392b",
      "#27ae60",
      "#d35400",
      "#8e44ad"
    ],
    
    // 自定义主题可以通过函数动态生成
    dynamic: () => {
      return [
        `hsl(${Date.now() / 1000 % 360}, 70%, 60%)`,
        `hsl(${(Date.now() / 1000 + 120) % 360}, 70%, 60%)`,
        `hsl(${(Date.now() / 1000 + 240) % 360}, 70%, 60%)`
      ];
    }
  },
  
  // 线条样式配置
  lineStyles: {
    default: {
      width: 15,
      opacity: 0.8,
      lineCap: "round"
    },
    
    thin: {
      width: 5,
      opacity: 0.6,
      lineCap: "butt"
    },
    
    thick: {
      width: 25,
      opacity: 0.9,
      lineCap: "round"
    },
    
    dashed: {
      width: 10,
      opacity: 0.7,
      lineCap: "round",
      lineDash: [10, 5]
    }
  },
  
  // 性能配置
  performance: {
    debounceResize: 250, // 防抖延迟（毫秒）
    maxRenderTime: 16, // 最大渲染时间（毫秒）
    cacheElements: true, // 缓存元素引用
    batchDraw: true // 批量绘制
  }
};

// ============================================
// 树形渲染系统 - 画布管理器
// ============================================

class CanvasManager {
  constructor(config) {
    this.config = config;
    this.canvas = null;
    this.ctx = null;
    this.isInitialized = false;
    this.resizeHandlers = [];
    this.elementCache = new Map();
    
    // 防抖函数
    this.debouncedResize = this.debounce(this.handleResize.bind(this), 
      this.config.performance.debounceResize);
  }
  
  // 防抖函数
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  // 初始化画布
  initialize() {
    if (this.isInitialized) return true;
    
    try {
      this.canvas = document.getElementById(this.config.canvasId);
      const container = document.getElementById(this.config.containerId);
      
      if (!this.canvas || !container) {
        console.warn(`无法找到画布元素: ${this.config.canvasId} 或容器: ${this.config.containerId}`);
        return false;
      }
      
      // 获取2D上下文
      this.ctx = this.canvas.getContext('2d');
      
      if (!this.ctx) {
        console.error('无法获取画布上下文');
        return false;
      }
      
      // 设置初始尺寸
      this.resizeToWindow();
      
      // 添加窗口大小调整监听器
      window.addEventListener('resize', this.debouncedResize);
      
      this.isInitialized = true;
      console.log('画布管理器初始化完成');
      return true;
    } catch (error) {
      console.error('画布管理器初始化失败:', error);
      return false;
    }
  }
  
  // 处理窗口大小调整
  handleResize() {
    this.resizeToWindow();
    
    // 通知所有注册的resize处理器
    this.resizeHandlers.forEach(handler => {
      try {
        handler();
      } catch (error) {
        console.error('窗口大小调整处理器出错:', error);
      }
    });
  }
  
  // 调整画布大小为窗口大小
  resizeToWindow() {
    if (!this.canvas || !this.ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    // 设置显示尺寸
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    
    // 设置实际绘制尺寸（考虑设备像素比）
    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);
    
    // 缩放上下文以匹配DPI
    this.ctx.scale(dpr, dpr);
    
    console.log(`画布调整尺寸: ${this.canvas.width}×${this.canvas.height}`);
  }
  
  // 注册resize处理器
  addResizeHandler(handler) {
    this.resizeHandlers.push(handler);
  }
  
  // 移除resize处理器
  removeResizeHandler(handler) {
    const index = this.resizeHandlers.indexOf(handler);
    if (index > -1) {
      this.resizeHandlers.splice(index, 1);
    }
  }
  
  // 获取元素位置（带缓存）
  getElementPosition(elementId, prefix = '') {
    const cacheKey = prefix + elementId;
    
    // 使用缓存（如果启用）
    if (this.config.performance.cacheElements && this.elementCache.has(cacheKey)) {
      return this.elementCache.get(cacheKey);
    }
    
    const element = document.getElementById(cacheKey);
    if (!element) {
      console.warn(`元素未找到: ${cacheKey}`);
      return null;
    }
    
    const rect = element.getBoundingClientRect();
    const position = {
      x: rect.left + (rect.width / 2) + document.body.scrollLeft,
      y: rect.top + (rect.height / 2) + document.body.scrollTop,
      width: rect.width,
      height: rect.height,
      element: element
    };
    
    // 缓存位置
    if (this.config.performance.cacheElements) {
      this.elementCache.set(cacheKey, position);
    }
    
    return position;
  }
  
  // 清空缓存
  clearCache() {
    this.elementCache.clear();
  }
  
  // 清除画布
  clear() {
    if (!this.ctx || !this.canvas) return;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  // 销毁资源
  destroy() {
    window.removeEventListener('resize', this.debouncedResize);
    this.resizeHandlers = [];
    this.clearCache();
    this.canvas = null;
    this.ctx = null;
    this.isInitialized = false;
  }
}

// ============================================
// 树形渲染系统 - 连接线绘制器
// ============================================

class ConnectionRenderer {
  constructor(canvasManager, config) {
    this.canvasManager = canvasManager;
    this.config = config;
    this.activeColorTheme = 'default';
  }
  
  // 绘制连接线
  drawConnection(sourceId, targetId, options = {}) {
    const ctx = this.canvasManager.ctx;
    if (!ctx) return false;
    
    // 获取元素位置
    const sourcePos = this.canvasManager.getElementPosition(sourceId, options.prefix);
    const targetPos = this.canvasManager.getElementPosition(targetId, options.prefix);
    
    if (!sourcePos || !targetPos) {
      return false;
    }
    
    // 解析选项
    const lineStyle = this.parseLineStyle(options);
    const color = this.parseColor(options.color);
    
    // 保存当前上下文状态
    ctx.save();
    
    // 设置线条样式
    ctx.lineWidth = lineStyle.width;
    ctx.strokeStyle = color;
    ctx.globalAlpha = lineStyle.opacity;
    ctx.lineCap = lineStyle.lineCap;
    
    // 设置虚线（如果有）
    if (lineStyle.lineDash) {
      ctx.setLineDash(lineStyle.lineDash);
    }
    
    // 开始绘制路径
    ctx.beginPath();
    ctx.moveTo(sourcePos.x, sourcePos.y);
    ctx.lineTo(targetPos.x, targetPos.y);
    
    // 应用曲线效果（如果有）
    if (options.curve) {
      this.applyCurve(ctx, sourcePos, targetPos, options.curve);
    }
    
    // 绘制线条
    ctx.stroke();
    
    // 恢复上下文状态
    ctx.restore();
    
    return true;
  }
  
  // 解析线条样式
  parseLineStyle(options) {
    const styleName = options.style || 'default';
    let style = { ...this.config.lineStyles.default };
    
    if (this.config.lineStyles[styleName]) {
      style = { ...style, ...this.config.lineStyles[styleName] };
    }
    
    // 覆盖选项中的自定义值
    if (options.width) style.width = options.width;
    if (options.opacity) style.opacity = options.opacity;
    if (options.lineCap) style.lineCap = options.lineCap;
    if (options.lineDash) style.lineDash = options.lineDash;
    
    return style;
  }
  
  // 解析颜色
  parseColor(colorOption) {
    if (!colorOption) {
      return this.getThemeColor(1); // 默认使用主题颜色1
    }
    
    // 如果是数字，使用主题颜色
    if (typeof colorOption === 'number') {
      return this.getThemeColor(colorOption);
    }
    
    // 如果是字符串，直接使用
    if (typeof colorOption === 'string') {
      return colorOption;
    }
    
    // 默认颜色
    return this.getThemeColor(1);
  }
  
  // 获取主题颜色
  getThemeColor(index) {
    const theme = this.config.colorThemes[this.activeColorTheme];
    
    if (typeof theme === 'function') {
      const colors = theme();
      return colors[index % colors.length] || colors[0];
    }
    
    if (Array.isArray(theme)) {
      return theme[index % theme.length] || theme[0];
    }
    
    // 回退到默认主题
    return this.config.colorThemes.default[index % this.config.colorThemes.default.length];
  }
  
  // 应用曲线效果
  applyCurve(ctx, sourcePos, targetPos, curveOptions) {
    const { type = 'quadratic', intensity = 50 } = curveOptions;
    
    switch (type) {
      case 'quadratic':
        // 二次贝塞尔曲线
        const cpX = (sourcePos.x + targetPos.x) / 2;
        const cpY = Math.min(sourcePos.y, targetPos.y) - intensity;
        ctx.quadraticCurveTo(cpX, cpY, targetPos.x, targetPos.y);
        break;
        
      case 'bezier':
        // 三次贝塞尔曲线
        const cp1X = sourcePos.x + (targetPos.x - sourcePos.x) / 3;
        const cp1Y = sourcePos.y - intensity;
        const cp2X = sourcePos.x + 2 * (targetPos.x - sourcePos.x) / 3;
        const cp2Y = targetPos.y - intensity;
        ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, targetPos.x, targetPos.y);
        break;
        
      case 'arc':
        // 圆弧连接
        const radius = Math.abs(targetPos.x - sourcePos.x) / 2;
        const startAngle = Math.atan2(targetPos.y - sourcePos.y, targetPos.x - sourcePos.x);
        ctx.arcTo(sourcePos.x, sourcePos.y, targetPos.x, targetPos.y, radius);
        break;
    }
  }
  
  // 批量绘制连接线
  drawConnections(connections) {
    const startTime = performance.now();
    let drawnCount = 0;
    
    for (const connection of connections) {
      // 性能检查：如果渲染时间过长，跳过剩余的连接
      if (performance.now() - startTime > this.config.performance.maxRenderTime) {
        console.warn(`渲染超时，跳过了 ${connections.length - drawnCount} 个连接`);
        break;
      }
      
      if (this.drawConnection(
        connection.source,
        connection.target,
        connection.options
      )) {
        drawnCount++;
      }
    }
    
    return drawnCount;
  }
  
  // 设置颜色主题
  setColorTheme(themeName) {
    if (this.config.colorThemes[themeName]) {
      this.activeColorTheme = themeName;
      return true;
    }
    return false;
  }
}

// ============================================
// 树形渲染系统 - 树形数据处理器
// ============================================

class TreeDataProcessor {
  constructor(config) {
    this.config = config;
  }
  
  // 收集所有连接线数据
  collectConnections() {
    const connections = [];
    
    // 处理图层连接
    for (const layer in layers) {
      if (tmp[layer]?.layerShown && tmp[layer].branches) {
        this.processBranches(layer, tmp[layer].branches, connections);
      }
      
      // 处理组件连接
      this.processComponentBranches(layer, tmp[layer]?.upgrades, connections, 'upgrade-');
      this.processComponentBranches(layer, tmp[layer]?.buyables, connections, 'buyable-');
      this.processComponentBranches(layer, tmp[layer]?.clickables, connections, 'clickable-');
    }
    
    return connections;
  }
  
  // 处理分支数据
  processBranches(sourceId, branches, connections, prefix = '') {
    for (const branchKey in branches) {
      const branchData = branches[branchKey];
      this.parseBranchData(sourceId, branchData, connections, prefix);
    }
  }
  
  // 解析分支数据
  parseBranchData(sourceId, data, connections, prefix = '') {
    let targetId, colorId, width;
    
    // 解析数据格式（支持数组或简单值）
    if (Array.isArray(data)) {
      targetId = data[0];
      colorId = data[1] || 1;
      width = data[2];
    } else {
      targetId = data;
      colorId = 1;
      width = null;
    }
    
    // 构建连接对象
    const connection = {
      source: prefix + sourceId,
      target: prefix + targetId,
      options: {
        color: colorId,
        width: width,
        prefix: prefix
      }
    };
    
    connections.push(connection);
  }
  
  // 处理组件分支
  processComponentBranches(layer, componentData, connections, componentPrefix) {
    if (!componentData) return;
    
    for (const id in componentData) {
      if (componentData[id]?.branches) {
        this.processBranches(id, componentData[id].branches, connections, componentPrefix + layer + "-");
      }
    }
  }
  
  // 创建自定义连接
  createCustomConnection(sourceId, targetId, options = {}) {
    return {
      source: sourceId,
      target: targetId,
      options: {
        color: options.color || 1,
        width: options.width,
        style: options.style,
        curve: options.curve,
        prefix: options.prefix || ''
      }
    };
  }
}

// ============================================
// 树形渲染系统 - 主渲染器
// ============================================

class TreeRenderer {
  constructor(config = TreeRendererConfig) {
    this.config = config;
    this.canvasManager = new CanvasManager(config);
    this.connectionRenderer = new ConnectionRenderer(this.canvasManager, config);
    this.dataProcessor = new TreeDataProcessor(config);
    this.isRendering = false;
    this.animationFrameId = null;
    this.renderStats = {
      totalFrames: 0,
      lastFrameTime: 0,
      averageFrameTime: 0
    };
  }
  
  // 初始化渲染器
  initialize() {
    if (!this.canvasManager.initialize()) {
      console.error('画布管理器初始化失败');
      return false;
    }
    
    // 注册resize处理器
    this.canvasManager.addResizeHandler(() => {
      this.render();
    });
    
    console.log('树形渲染器初始化完成');
    return true;
  }
  
  // 渲染树形结构
  render() {
    if (this.isRendering) {
      return; // 防止重复渲染
    }
    
    this.isRendering = true;
    
    // 使用requestAnimationFrame确保渲染在下一帧进行
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.animationFrameId = requestAnimationFrame(() => {
      const startTime = performance.now();
      
      try {
        // 清除画布
        this.canvasManager.clear();
        
        // 收集所有连接线
        const connections = this.dataProcessor.collectConnections();
        
        // 批量绘制连接线
        const drawnCount = this.connectionRenderer.drawConnections(connections);
        
        // 更新渲染统计
        this.updateRenderStats(startTime, connections.length, drawnCount);
        
      } catch (error) {
        console.error('渲染树形结构时出错:', error);
      } finally {
        this.isRendering = false;
        this.animationFrameId = null;
      }
    });
  }
  
  // 更新渲染统计
  updateRenderStats(startTime, totalConnections, drawnConnections) {
    const frameTime = performance.now() - startTime;
    
    this.renderStats.totalFrames++;
    this.renderStats.lastFrameTime = frameTime;
    this.renderStats.averageFrameTime = 
      (this.renderStats.averageFrameTime * (this.renderStats.totalFrames - 1) + frameTime) / 
      this.renderStats.totalFrames;
    
    // 只在调试模式下显示统计信息
    if (this.config.debug) {
      console.log(`渲染统计: ${frameTime.toFixed(2)}ms, 连接: ${drawnConnections}/${totalConnections}`);
    }
  }
  
  // 添加自定义连接
  addCustomConnection(sourceId, targetId, options = {}) {
    const customConnection = this.dataProcessor.createCustomConnection(
      sourceId, targetId, options
    );
    
    // 立即绘制自定义连接
    return this.connectionRenderer.drawConnection(
      customConnection.source,
      customConnection.target,
      customConnection.options
    );
  }
  
  // 清除元素缓存
  clearCache() {
    this.canvasManager.clearCache();
  }
  
  // 设置颜色主题
  setColorTheme(themeName) {
    return this.connectionRenderer.setColorTheme(themeName);
  }
  
  // 获取渲染统计信息
  getStats() {
    return { ...this.renderStats };
  }
  
  // 销毁渲染器
  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.canvasManager.destroy();
    this.isRendering = false;
    
    console.log('树形渲染器已销毁');
  }
}

// ============================================
// 树形渲染系统 - 全局实例和兼容函数
// ============================================

// 创建全局实例
const TreeRenderSystem = new TreeRenderer();

// 原函数兼容版本
function retrieveCanvasData() {
  return TreeRenderSystem.canvasManager.initialize();
}

function resizeCanvas() {
  TreeRenderSystem.canvasManager.handleResize();
}

function drawTree() {
  TreeRenderSystem.render();
}

function drawTreeBranch(num1, data, prefix) {
  // 解析数据格式
  let targetId, colorId, width;
  
  if (Array.isArray(data)) {
    targetId = data[0];
    colorId = data[1] || 1;
    width = data[2];
  } else {
    targetId = data;
    colorId = 1;
    width = null;
  }
  
  return TreeRenderSystem.addCustomConnection(num1, targetId, {
    color: colorId,
    width: width,
    prefix: prefix
  });
}

// ============================================
// 系统初始化和游戏集成
// ============================================

function initializeTreeRenderer() {
  // 等待DOM加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      TreeRenderSystem.initialize();
      
      // 设置全局访问
      if (typeof window !== 'undefined') {
        window.TreeRenderSystem = TreeRenderSystem;
      }
      
      console.log('树形渲染系统初始化完成');
    });
  } else {
    TreeRenderSystem.initialize();
    
    if (typeof window !== 'undefined') {
      window.TreeRenderSystem = TreeRenderSystem;
    }
    
    console.log('树形渲染系统初始化完成');
  }
}

// 自动初始化
initializeTreeRenderer();

// 添加CSS样式（用于画布）
const treeRendererStyles = `
<style>
#${TreeRendererConfig.canvasId} {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* 允许鼠标穿透 */
  z-index: 9999; /* 确保在最上层 */
}

.tree-connection-hover {
  stroke-width: 20px !important;
  opacity: 1 !important;
}
</style>
`;

// 注入样式
if (typeof document !== 'undefined') {
  document.head.insertAdjacentHTML('beforeend', treeRendererStyles);
}

// 导出模块（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TreeRenderSystem,
    TreeRenderer,
    CanvasManager,
    ConnectionRenderer,
    TreeDataProcessor
  };
}
