// ============================================
// 星系生成器系统 - 配置模块
// ============================================

const GalaxyGeneratorConfig = {
  id: "g",
  name: "galaxy",
  symbol: "Galaxy Generator",
  position: 0,
  row: 0,
  color: "#00FFFF",
  resource: "Galaxies",
  
  // 基础属性
  baseProperties: {
    unlocked: true,
    points: new Decimal(0),
    meta: new Decimal(0)
  },
  
  // 升级系统配置
  upgrades: {
    // 第一行升级
    row1: [
      {
        id: 11,
        title: "U-R0-0",
        description: "Boost Galaxy Generation based on Galaxies",
        cost: () => new Decimal(10),
        unlocked: () => true,
        effect: {
          type: "multiplier",
          formula: (state) => state.points.div(2).add(1),
          affects: "gGain"
        }
      },
      {
        id: 12,
        title: "U-R0-1",
        description: "Vigintuple Galaxy Generation",
        cost: () => new Decimal(10000),
        unlocked: () => true,
        effect: {
          type: "static_multiplier",
          value: 20,
          affects: "gGain"
        }
      },
      {
        id: 13,
        title: "U-R0-2",
        description: "Unlock Meta-Galaxy",
        cost: () => new Decimal(1e100),
        unlocked: () => true,
        effect: {
          type: "unlock",
          unlocks: "metaSystem"
        }
      }
    ],
    
    // 第二行升级 (需要meta解锁)
    row2: [
      {
        id: 21,
        title: "U-R0-3",
        description: "Boost Galaxy Generation based on Meta-Galaxies",
        cost: () => new Decimal(2).pow(1024),
        unlocked: () => GalaxyGeneratorUpgradeManager.hasUpgrade(13),
        effect: {
          type: "exponent",
          formula: (state) => state.meta.add(1),
          affects: "gGain"
        }
      },
      {
        id: 22,
        title: "U-R0-4",
        description: "Boost Meta-Galaxy Generation based on Meta-Galaxies",
        cost: () => new Decimal("e1e100"),
        unlocked: () => GalaxyGeneratorUpgradeManager.hasUpgrade(13),
        effect: {
          type: "multiplier",
          formula: (state) => state.meta.add(100),
          affects: "metaGain"
        }
      },
      {
        id: 23,
        title: "U-R0-5",
        description: "Centuple Meta-Galaxy Generation",
        cost: () => new Decimal("e1e1000"),
        unlocked: () => GalaxyGeneratorUpgradeManager.hasUpgrade(13),
        effect: {
          type: "static_multiplier",
          value: 100,
          affects: "metaGain"
        }
      },
      {
        id: 24,
        title: "U-R0-6",
        description: "Unlock RETRIBUTION",
        cost: () => new Decimal("e1e10000"),
        unlocked: () => GalaxyGeneratorUpgradeManager.hasUpgrade(23),
        effect: {
          type: "unlock",
          unlocks: "retribution"
        }
      }
    ]
  },
  
  // 进度条配置
  bars: {
    retributionProgress: {
      direction: "RIGHT",
      width: 1000,
      height: 50,
      fillStyle: { 'background-color': "#FF0000" },
      unlocked: () => GalaxyGeneratorUpgradeManager.hasUpgrade(24),
      display: () => `Progress to Retribution: ${format(player.points.slog().log10().min(100))}%`,
      progress: () => player.points.slog().log10().div(100),
      instant: true
    }
  },
  
  // 选项卡配置
  tabs: {
    main: {
      name: "Upgrades",
      unlocked: () => true,
      content: [
        ["display-text", () => `Your Galaxies boost Energy gain ×<font color="#00FFFF">${format(new Decimal(2).pow(player.g?.points || 0))}</font>`],
        ["row", [
          ["upgrade", 11],
          ["upgrade", 12],
          ["upgrade", 13]
        ]]
      ]
    },
    meta: {
      name: "Meta-Galaxy",
      unlocked: () => GalaxyGeneratorUpgradeManager.hasUpgrade(13),
      content: [
        ["display-text", () => {
          const metaPoints = player.g?.meta || new Decimal(0);
          return `You have <font color="#00C0FF">${format(metaPoints)}</font> Meta-Galaxies, Energy gain ↑↑<font color="#00C0FF">${format(metaPoints.add(1))}</font>`;
        }],
        ["row", [
          ["upgrade", 21],
          ["upgrade", 22],
          ["upgrade", 23],
          ["upgrade", 24]
        ]],
        "blank",
        ["bar", "retributionProgress"]
      ]
    }
  }
};

// ============================================
// 星系生成器系统 - 升级管理器
// ============================================

class GalaxyGeneratorUpgradeManager {
  // 检查是否拥有特定升级
  static hasUpgrade(upgradeId) {
    return hasUpgrade("g", upgradeId);
  }
  
  // 获取所有升级效果
  static getActiveEffects(state) {
    const effects = {
      gGainMultiplier: new Decimal(1),
      gGainExponent: new Decimal(1),
      metaGainMultiplier: new Decimal(1),
      unlocks: new Set()
    };
    
    // 收集所有已激活升级的效果
    const allUpgrades = [
      ...GalaxyGeneratorConfig.upgrades.row1,
      ...GalaxyGeneratorConfig.upgrades.row2
    ];
    
    allUpgrades.forEach(upgrade => {
      if (this.hasUpgrade(upgrade.id)) {
        const effect = upgrade.effect;
        
        switch (effect.type) {
          case "multiplier":
            if (effect.affects === "gGain") {
              effects.gGainMultiplier = effects.gGainMultiplier.mul(effect.formula(state));
            } else if (effect.affects === "metaGain") {
              effects.metaGainMultiplier = effects.metaGainMultiplier.mul(effect.formula(state));
            }
            break;
            
          case "static_multiplier":
            if (effect.affects === "gGain") {
              effects.gGainMultiplier = effects.gGainMultiplier.mul(effect.value);
            } else if (effect.affects === "metaGain") {
              effects.metaGainMultiplier = effects.metaGainMultiplier.mul(effect.value);
            }
            break;
            
          case "exponent":
            effects.gGainExponent = effect.formula(state);
            break;
            
          case "unlock":
            effects.unlocks.add(effect.unlocks);
            break;
        }
      }
    });
    
    return effects;
  }
  
  // 创建游戏兼容的升级对象
  static createUpgradeObject() {
    const upgrades = {};
    
    // 处理所有升级
    const processUpgradeArray = (upgradeArray) => {
      upgradeArray.forEach(upgrade => {
        upgrades[upgrade.id] = {
          title: upgrade.title,
          titleI18N: upgrade.title,
          description: typeof upgrade.description === 'function' 
            ? upgrade.description 
            : () => this.getUpgradeDescription(upgrade, upgrade.id),
          descriptionI18N: typeof upgrade.description === 'function' 
            ? upgrade.description 
            : () => this.getUpgradeDescription(upgrade, upgrade.id),
          cost: upgrade.cost,
          unlocked: upgrade.unlocked
        };
      });
    };
    
    processUpgradeArray(GalaxyGeneratorConfig.upgrades.row1);
    processUpgradeArray(GalaxyGeneratorConfig.upgrades.row2);
    
    return upgrades;
  }
  
  // 获取升级描述
  static getUpgradeDescription(upgrade, upgradeId) {
    const state = player.g || GalaxyGeneratorConfig.baseProperties;
    
    switch (upgradeId) {
      case 11:
        return `Boost Galaxy Generation based on Galaxies.<br>Currently: ×${format(state.points.div(2).add(1))}`;
      case 21:
        return `Boost Galaxy Generation based on Meta-Galaxies.<br>Currently: ^${format(state.meta.add(1))}`;
      case 22:
        return `Boost Meta-Galaxy Generation based on Meta-Galaxies.<br>Currently: ×${format(state.meta.add(100))}`;
      default:
        return upgrade.description;
    }
  }
}

// ============================================
// 星系生成器系统 - 核心逻辑
// ============================================

class GalaxyGeneratorCore {
  constructor() {
    this.gGain = new Decimal(0);
    this.metaGain = new Decimal(0);
  }
  
  // 计算增益
  calculateGains(diff) {
    const state = player.g || GalaxyGeneratorConfig.baseProperties;
    const effects = GalaxyGeneratorUpgradeManager.getActiveEffects(state);
    
    // 计算星系增益
    let gGain = new Decimal(diff);
    
    // 应用乘数效应
    gGain = gGain.mul(effects.gGainMultiplier);
    
    // 应用指数效应
    if (effects.gGainExponent.gt(1)) {
      gGain = gGain.pow(effects.gGainExponent);
    }
    
    this.gGain = gGain;
    
    // 计算元星系增益（如果解锁）
    if (effects.unlocks.has("metaSystem")) {
      let metaGain = new Decimal(diff * 0.01);
      metaGain = metaGain.mul(effects.metaGainMultiplier);
      this.metaGain = metaGain;
    } else {
      this.metaGain = new Decimal(0);
    }
  }
  
  // 应用增益
  applyGains() {
    if (!player.g) return;
    
    player.g.points = player.g.points.add(this.gGain);
    player.g.meta = player.g.meta.add(this.metaGain);
  }
  
  // 更新循环
  update(diff) {
    this.calculateGains(diff);
    this.applyGains();
  }
  
  // 获取显示信息
  getDisplayInfo() {
    const state = player.g || GalaxyGeneratorConfig.baseProperties;
    return {
      galaxies: state.points,
      metaGalaxies: state.meta,
      gGain: this.gGain,
      metaGain: this.metaGain,
      energyBoost: new Decimal(2).pow(state.points)
    };
  }
}

// ============================================
// 星系生成器系统 - 显示模块
// ============================================

const GalaxyGeneratorDisplay = {
  // 获取点数显示
  getPointsDisplay() {
    const state = player.g || GalaxyGeneratorConfig.baseProperties;
    return `
      <div class="galaxy-display">
        <div class="galaxy-count">
          <strong>Galaxies:</strong> ${format(state.points)}
        </div>
        ${state.meta.gt(0) ? `
        <div class="meta-galaxy-count">
          <strong>Meta-Galaxies:</strong> ${format(state.meta)}
        </div>
        ` : ''}
      </div>
    `;
  },
  
  // 创建选项卡格式
  createTabFormat() {
    return [
      ["display-text", () => this.getPointsDisplay()],
      "main-display",
      "prestige-button",
      "blank",
      ["microtabs", "tab"]
    ];
  },
  
  // 创建微选项卡配置
  createMicrotabs() {
    const microtabs = {
      tab: {}
    };
    
    Object.entries(GalaxyGeneratorConfig.tabs).forEach(([tabKey, tabConfig]) => {
      microtabs.tab[tabKey] = {
        name: () => tabConfig.name,
        nameI18N: () => tabConfig.name,
        unlocked: tabConfig.unlocked,
        content: tabConfig.content
      };
    });
    
    return microtabs;
  },
  
  // 创建进度条配置
  createBars() {
    const bars = {};
    
    Object.entries(GalaxyGeneratorConfig.bars).forEach(([barKey, barConfig]) => {
      bars[barKey] = barConfig;
    });
    
    return bars;
  }
};

// ============================================
// 星系生成器系统 - 主入口
// ============================================

class GalaxyGeneratorSystem {
  constructor() {
    this.core = new GalaxyGeneratorCore();
    this.display = GalaxyGeneratorDisplay;
    this.config = GalaxyGeneratorConfig;
    this.initialized = false;
  }
  
  // 初始化星系生成器
  initialize() {
    if (this.initialized) return;
    
    // 确保玩家状态存在
    if (!player.g) {
      player.g = { ...GalaxyGeneratorConfig.baseProperties };
    }
    
    this.initialized = true;
    console.log("Galaxy Generator System initialized");
  }
  
  // 创建图层配置
  createLayerConfig() {
    this.initialize();
    
    return {
      name: this.config.name,
      symbol: this.config.symbol,
      symbolI18N: this.config.symbol,
      position: this.config.position,
      row: this.config.row,
      
      startData() {
        return { ...GalaxyGeneratorConfig.baseProperties };
      },
      
      color: this.config.color,
      requires: new Decimal(0),
      layerShown: () => true,
      
      resource: this.config.resource,
      resourceI18N: this.config.resource,
      
      baseAmount: () => player.points,
      type: "none",
      
      // 更新逻辑
      update: (diff) => {
        this.core.update(diff);
      },
      
      // 升级系统
      upgrades: GalaxyGeneratorUpgradeManager.createUpgradeObject(),
      
      // 进度条
      bars: this.display.createBars(),
      
      // 热键（暂无）
      hotkeys: [],
      
      // 微选项卡
      microtabs: this.display.createMicrotabs(),
      
      // 主选项卡格式
      tabFormat: this.display.createTabFormat()
    };
  }
  
  // 注册到游戏
  registerToGame() {
    const layerConfig = this.createLayerConfig();
    addLayer(this.config.id, layerConfig);
    
    console.log(`Galaxy Generator layer registered as "${this.config.id}"`);
  }
  
  // 获取系统状态
  getStatus() {
    return {
      initialized: this.initialized,
      ...this.core.getDisplayInfo()
    };
  }
}

// ============================================
// 星系生成器系统 - 全局实例
// ============================================

const GalaxyGenerator = new GalaxyGeneratorSystem();

// ============================================
// 游戏集成
// ============================================

// 初始化钩子
function initializeGalaxyGenerator() {
  // 等待游戏核心就绪
  if (typeof addLayer === 'undefined') {
    console.warn("addLayer not available yet, retrying in 1 second");
    setTimeout(initializeGalaxyGenerator, 1000);
    return;
  }
  
  // 注册星系生成器
  GalaxyGenerator.registerToGame();
  
  // 设置全局访问
  if (typeof window !== 'undefined') {
    window.GalaxyGenerator = GalaxyGenerator;
  }
  
  console.log("Galaxy Generator fully integrated");
}

// 游戏加载时自动初始化
if (typeof document !== 'undefined') {
  // 使用DOMContentLoaded或延迟执行以确保游戏框架已加载
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGalaxyGenerator);
  } else {
    setTimeout(initializeGalaxyGenerator, 100);
  }
}

// CSS样式（可选）
const galaxyGeneratorStyles = `
<style>
.galaxy-display {
  padding: 10px;
  background: rgba(0, 255, 255, 0.1);
  border-radius: 5px;
  margin: 10px 0;
}

.galaxy-count {
  color: #00FFFF;
  font-size: 16px;
  margin-bottom: 5px;
}

.meta-galaxy-count {
  color: #00C0FF;
  font-size: 14px;
  margin-top: 5px;
}

.upgrade-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 15px 0;
}

.retribution-progress {
  margin-top: 20px;
  padding: 10px;
  border: 2px solid #FF0000;
  border-radius: 5px;
  background: rgba(255, 0, 0, 0.05);
}
</style>
`;

// 注入样式
if (typeof document !== 'undefined') {
  document.head.insertAdjacentHTML('beforeend', galaxyGeneratorStyles);
}
