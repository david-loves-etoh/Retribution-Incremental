// 侧边图层配置系统
const SIDE_LAYER_CONFIG = {
  // 图层基础配置
  baseConfig: {
    small: true,
    nodeStyle: {
      "font-size": "15px",
      "height": "30px"
    },
    color: "#ffffff",
    type: "none",
    tooltip() { return false },
    layerShown() { return layerDisplayTotal(['g']) },
    tabFormat: [
      ["display-text", function() { return getPointsDisplay() }]
    ]
  },
  
  // 所有侧边图层定义
  layers: [
    {
      id: "1layer",
      name: "sideLayer1",
      position: -1,
      row: 0,
      symbol: "↓ Layer 1 ↓",
      displayCondition: () => true, // 可以自定义显示条件
      customConfig: {} // 可以覆盖或扩展基础配置
    },
    {
      id: "metalayer",
      name: "sideLayerMeta",
      position: -1,
      row: 99,
      symbol: "↓ Meta-Layer ↓",
      displayCondition: () => true,
      customConfig: {}
    }
  ],
  
  // 可以添加更多配置选项
  displayOptions: {
    alwaysShow: false, // 是否总是显示
    hideWhenLocked: false, // 锁定后隐藏
    showInTree: true, // 是否在科技树中显示
  }
};

// 侧边图层管理器
class SideLayerManager {
  constructor(config) {
    this.config = config;
    this.registeredLayers = new Map();
    this.initialized = false;
  }
  
  // 初始化所有图层
  initializeAll() {
    if (this.initialized) return;
    
    for (const layerConfig of this.config.layers) {
      this.registerLayer(layerConfig);
    }
    
    this.initialized = true;
    console.log(`SideLayerManager: 已初始化 ${this.config.layers.length} 个侧边图层`);
  }
  
  // 注册单个图层
  registerLayer(layerConfig) {
    const layerId = layerConfig.id;
    
    if (this.registeredLayers.has(layerId)) {
      console.warn(`图层 ${layerId} 已注册，跳过重复注册`);
      return;
    }
    
    const fullConfig = this.buildLayerConfig(layerConfig);
    
    try {
      addLayer(layerId, fullConfig);
      this.registeredLayers.set(layerId, {
        config: layerConfig,
        instance: fullConfig,
        status: 'registered'
      });
      
      console.log(`已注册侧边图层: ${layerId}`);
    } catch (error) {
      console.error(`注册图层 ${layerId} 时出错:`, error);
    }
  }
  
  // 构建完整的图层配置
  buildLayerConfig(layerConfig) {
    const baseConfig = { ...this.config.baseConfig };
    
    // 合并自定义配置
    if (layerConfig.customConfig) {
      Object.assign(baseConfig, layerConfig.customConfig);
    }
    
    // 构建完整配置
    return {
      name: layerConfig.name,
      position: layerConfig.position,
      row: layerConfig.row,
      symbol: () => layerConfig.symbol,
      symbolI18N: () => layerConfig.symbol,
      
      // 使用覆盖的显示条件或默认条件
      layerShown: layerConfig.displayCondition || this.config.baseConfig.layerShown,
      
      // 图层特定的开始数据
      startData() {
        return {
          unlocked: true,
          points: new Decimal(0),
          // 可以添加图层特定的数据
          ...(layerConfig.initialData || {})
        };
      },
      
      // 如果有自定义tabFormat则使用，否则使用基础配置
      tabFormat: layerConfig.tabFormat || baseConfig.tabFormat,
      
      // 复制基础配置的其余部分
      small: baseConfig.small,
      nodeStyle: baseConfig.nodeStyle,
      color: baseConfig.color,
      type: baseConfig.type,
      tooltip: baseConfig.tooltip,
      
      // 可以添加更多功能
      update(diff) {
        // 每帧更新逻辑
        if (this.onUpdate) {
          this.onUpdate(diff);
        }
      },
      
      // 重置钩子
      onReset() {
        // 图层重置时的逻辑
        if (this.customReset) {
          this.customReset();
        }
      },
      
      // 状态获取器
      getStatus() {
        return {
          points: this.points || new Decimal(0),
          unlocked: this.unlocked || true,
          // 可以添加更多状态信息
        };
      }
    };
  }
  
  // 动态添加新图层
  addDynamicLayer(layerConfig) {
    const dynamicId = `dynamic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullConfig = {
      id: dynamicId,
      ...layerConfig
    };
    
    this.config.layers.push(fullConfig);
    this.registerLayer(fullConfig);
    
    return dynamicId;
  }
  
  // 移除图层（需要小心使用）
  removeLayer(layerId) {
    if (!this.registeredLayers.has(layerId)) {
      console.warn(`尝试移除不存在的图层: ${layerId}`);
      return false;
    }
    
    // 注意：在增量游戏中，通常不建议动态移除图层
    // 这里只是标记为隐藏
    const layerInfo = this.registeredLayers.get(layerId);
    layerInfo.status = 'hidden';
    
    // 可以在这里添加逻辑来隐藏图层节点
    console.log(`图层 ${layerId} 已标记为隐藏`);
    return true;
  }
  
  // 获取所有图层信息
  getAllLayerInfo() {
    return Array.from(this.registeredLayers.entries()).map(([id, info]) => ({
      id,
      name: info.config.name,
      status: info.status,
      config: info.config
    }));
  }
  
  // 批量操作图层
  batchOperation(operation) {
    const results = [];
    
    for (const [id, info] of this.registeredLayers) {
      try {
        const result = operation(id, info);
        results.push({ id, success: true, result });
      } catch (error) {
        results.push({ id, success: false, error: error.message });
      }
    }
    
    return results;
  }
}

// 侧边图层显示组件
const SideLayerDisplay = {
  // 获取图层的显示状态
  getLayerDisplayStatus(layerId) {
    const layer = layers[layerId];
    if (!layer) return { exists: false };
    
    return {
      exists: true,
      points: layer.points || new Decimal(0),
      unlocked: layer.unlocked || false,
      canBeSeen: layer.layerShown ? layer.layerShown() : false
    };
  },
  
  // 创建图层节点HTML
  createLayerNodeHTML(layerId, config) {
    const status = this.getLayerDisplayStatus(layerId);
    
    if (!status.exists || !status.canBeSeen) return '';
    
    return `
      <div class="side-layer-node" data-layer="${layerId}">
        <div class="layer-symbol">${config.symbol}</div>
        <div class="layer-points">${format(status.points)}</div>
      </div>
    `;
  },
  
  // 更新所有侧边图层的显示
  updateAllDisplays() {
    const container = document.querySelector('.side-layers-container');
    if (!container) return;
    
    let html = '';
    
    for (const layerConfig of SIDE_LAYER_CONFIG.layers) {
      html += this.createLayerNodeHTML(layerConfig.id, layerConfig);
    }
    
    container.innerHTML = html;
  }
};

// 侧边图层注册钩子
const SideLayerHooks = {
  onGameLoad() {
    console.log('游戏加载，初始化侧边图层系统...');
    sideLayerManager.initializeAll();
  },
  
  onReset() {
    console.log('游戏重置，清理侧边图层状态...');
    // 可以在这里清理临时状态
  },
  
  onUpdate(diff) {
    // 定期更新显示
    if (gameUpdateTick % 60 === 0) { // 每60帧更新一次
      SideLayerDisplay.updateAllDisplays();
    }
  }
};

// 创建管理器实例
const sideLayerManager = new SideLayerManager(SIDE_LAYER_CONFIG);

// 初始化函数
function initializeSideLayers() {
  // 注册到游戏全局对象以便访问
  if (typeof window !== 'undefined') {
    window.SideLayers = sideLayerManager;
    window.SideLayerDisplay = SideLayerDisplay;
  }
  
  // 初始化所有图层
  sideLayerManager.initializeAll();
  
  // 设置游戏钩子
  if (typeof setupGameHooks === 'function') {
    setupGameHooks(SideLayerHooks);
  }
  
  console.log('侧边图层系统初始化完成');
}

// 自动初始化
if (typeof addLayer !== 'undefined') {
  initializeSideLayers();
} else {
  console.warn('addLayer 函数未定义，延迟初始化侧边图层');
  // 可以设置一个延迟初始化
  setTimeout(() => {
    if (typeof addLayer !== 'undefined') {
      initializeSideLayers();
    }
  }, 1000);
}

// 添加CSS样式用于侧边图层显示
const sideLayerStyles = `
<style>
.side-layer-node {
  margin: 5px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.2s;
}

.side-layer-node:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.layer-symbol {
  font-weight: bold;
  text-align: center;
  margin-bottom: 4px;
}

.layer-points {
  font-size: 12px;
  text-align: center;
  opacity: 0.8;
}
</style>
`;

// 注入样式
if (typeof document !== 'undefined') {
  document.head.insertAdjacentHTML('beforeend', sideLayerStyles);
  
  // 创建侧边图层容器
  const container = document.createElement('div');
  container.className = 'side-layers-container';
  container.style.position = 'fixed';
  container.style.right = '10px';
  container.style.top = '50%';
  container.style.transform = 'translateY(-50%)';
  container.style.zIndex = '1000';
  document.body.appendChild(container);
}

// 1. 添加新侧边图层
const newLayerId = sideLayerManager.addDynamicLayer({
  name: "sideLayerCustom",
  position: -1,
  row: 50,
  symbol: "↓ Custom ↓",
  customConfig: {
    color: "#FF9900",
    tabFormat: [
      ["display-text", function() { 
        return `Custom Points: ${format(player["customLayer"]?.points || 0)}`;
      }]
    ]
  }
});

// 2. 获取所有图层信息
const allLayers = sideLayerManager.getAllLayerInfo();
console.log("所有侧边图层:", allLayers);

// 3. 批量更新
sideLayerManager.batchOperation((id, info) => {
  console.log(`处理图层: ${id}`);
  // 执行操作
});

// 4. 获取图层显示状态
const layerStatus = SideLayerDisplay.getLayerDisplayStatus("1layer");
console.log("图层状态:", layerStatus);
