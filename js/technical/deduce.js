// ============================================
// 显示推导系统 - 配置模块
// ============================================

const DisplayConfig = {
  // 阈值配置
  thresholds: {
    normalFormat: new Decimal(10).tetrate(9e99), // 正常格式显示的上限
    omegaDisplay: new Decimal(10).tetrate(9e99), // 显示ω符号的阈值
    // 可以添加更多阈值
  },
  
  // 显示模式配置
  modes: {
    NORMAL: "normal",      // 正常数字格式
    OMEGA: "omega",        // ω符号显示
    RETRIBUTION: "retribution", // 复仇模式显示
    CUSTOM: "custom"       // 自定义显示
  },
  
  // 符号配置
  symbols: {
    omega: "ω",
    infinity: "∞",
    // 可以添加更多符号
  }
};

// ============================================
// 显示推导系统 - 状态检查器
// ============================================

class GameStateChecker {
  // 检查是否处于复仇模式
  static isRetributionActive() {
    return !!player?.retribution;
  }
  
  // 检查点数是否超过阈值
  static isPointsAboveThreshold(threshold) {
    const points = player?.points || new Decimal(0);
    return points.gt(threshold);
  }
  
  // 检查点数是否在范围内
  static isPointsInRange(min, max) {
    const points = player?.points || new Decimal(0);
    return points.gte(min) && points.lte(max);
  }
  
  // 获取当前游戏阶段
  static getGameStage() {
    if (this.isRetributionActive()) {
      return DisplayConfig.modes.RETRIBUTION;
    }
    
    if (this.isPointsAboveThreshold(DisplayConfig.thresholds.omegaDisplay)) {
      return DisplayConfig.modes.OMEGA;
    }
    
    return DisplayConfig.modes.NORMAL;
  }
  
  // 获取玩家点数
  static getPlayerPoints() {
    return player?.points || new Decimal(0);
  }
}

// ============================================
// 显示推导系统 - 格式化器
// ============================================

class PointsFormatter {
  // 基础格式化
  static formatPoints(points) {
    if (!points || typeof points !== 'object') {
      return "0";
    }
    
    try {
      return format(points);
    } catch (error) {
      console.error("格式化点数时出错:", error);
      return "ERROR";
    }
  }
  
  // 智能格式化（根据大小自动选择格式）
  static smartFormat(points) {
    if (!points) return "0";
    
    // 超大规模数字的特殊处理
    if (points.gt(DisplayConfig.thresholds.omegaDisplay)) {
      return DisplayConfig.symbols.omega;
    }
    
    // 中等规模数字
    if (points.gt(new Decimal(1e6))) {
      return this.formatScientific(points);
    }
    
    // 小规模数字
    return this.formatWithCommas(points);
  }
  
  // 科学计数法格式
  static formatScientific(points) {
    try {
      return points.toExponential(2);
    } catch {
      return format(points);
    }
  }
  
  // 带逗号分隔的格式
  static formatWithCommas(points) {
    try {
      return points.toNumber().toLocaleString('en-US', {
        maximumFractionDigits: 0
      });
    } catch {
      return format(points);
    }
  }
  
  // 获取显示模式对应的格式化函数
  static getFormatterForMode(mode) {
    const formatters = {
      [DisplayConfig.modes.NORMAL]: (points) => this.formatPoints(points),
      [DisplayConfig.modes.OMEGA]: () => DisplayConfig.symbols.omega,
      [DisplayConfig.modes.RETRIBUTION]: (points) => this.formatRetribution(points),
      [DisplayConfig.modes.CUSTOM]: (points, customFormatter) => 
        customFormatter ? customFormatter(points) : this.formatPoints(points)
    };
    
    return formatters[mode] || formatters[DisplayConfig.modes.NORMAL];
  }
  
  // 复仇模式特殊格式化
  static formatRetribution(points) {
    // 复仇模式可能有特殊的显示逻辑
    // 例如：显示为红色、添加特殊前缀等
    return `<span class="retribution-points">${this.formatPoints(points)}</span>`;
  }
}

// ============================================
// 显示推导系统 - 规则引擎
// ============================================

class DisplayRuleEngine {
  constructor() {
    this.rules = [];
    this.initializeDefaultRules();
  }
  
  // 初始化默认规则
  initializeDefaultRules() {
    // 规则1: 复仇模式
    this.addRule({
      name: "retribution_mode",
      priority: 100, // 高优先级
      condition: () => GameStateChecker.isRetributionActive(),
      action: (points) => ({
        display: PointsFormatter.formatRetribution(points),
        mode: DisplayConfig.modes.RETRIBUTION,
        cssClass: "retribution-display"
      })
    });
    
    // 规则2: 超大规模数字显示ω
    this.addRule({
      name: "omega_display",
      priority: 50,
      condition: () => GameStateChecker.isPointsAboveThreshold(
        DisplayConfig.thresholds.omegaDisplay
      ),
      action: (points) => ({
        display: DisplayConfig.symbols.omega,
        mode: DisplayConfig.modes.OMEGA,
        cssClass: "omega-display",
        tooltip: `实际值: ${PointsFormatter.formatPoints(points)}`
      })
    });
    
    // 规则3: 默认规则（正常显示）
    this.addRule({
      name: "normal_display",
      priority: 0,
      condition: () => true, // 总是匹配
      action: (points) => ({
        display: PointsFormatter.formatPoints(points),
        mode: DisplayConfig.modes.NORMAL,
        cssClass: "normal-display"
      })
    });
  }
  
  // 添加新规则
  addRule(rule) {
    this.rules.push(rule);
    // 按优先级降序排序，高优先级规则先执行
    this.rules.sort((a, b) => b.priority - a.priority);
  }
  
  // 移除规则
  removeRule(ruleName) {
    this.rules = this.rules.filter(rule => rule.name !== ruleName);
  }
  
  // 应用所有规则，返回第一个匹配的结果
  applyRules(points) {
    for (const rule of this.rules) {
      try {
        if (rule.condition()) {
          const result = rule.action(points);
          return {
            ...result,
            ruleName: rule.name,
            rawPoints: points
          };
        }
      } catch (error) {
        console.error(`应用规则 ${rule.name} 时出错:`, error);
      }
    }
    
    // 如果没有规则匹配，返回默认值
    return {
      display: "0",
      mode: DisplayConfig.modes.NORMAL,
      cssClass: "default-display",
      ruleName: "fallback"
    };
  }
  
  // 批量应用规则，返回所有匹配结果（用于调试）
  applyAllRules(points) {
    const results = [];
    
    for (const rule of this.rules) {
      try {
        if (rule.condition()) {
          const result = rule.action(points);
          results.push({
            ...result,
            ruleName: rule.name,
            priority: rule.priority
          });
        }
      } catch (error) {
        console.error(`应用规则 ${rule.name} 时出错:`, error);
      }
    }
    
    return results;
  }
}

// ============================================
// 显示推导系统 - 主管理器
// ============================================

class DisplayManager {
  constructor() {
    this.ruleEngine = new DisplayRuleEngine();
    this.cache = new Map();
    this.cacheEnabled = true;
    this.cacheDuration = 1000; // 缓存1秒
  }
  
  // 主推导函数（替换原deduceDisplay函数）
  deduceDisplay() {
    const points = GameStateChecker.getPlayerPoints();
    
    // 检查缓存
    if (this.cacheEnabled) {
      const cacheKey = this.getCacheKey(points);
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
        return cached.display;
      }
    }
    
    // 应用规则引擎
    const result = this.ruleEngine.applyRules(points);
    
    // 缓存结果
    if (this.cacheEnabled) {
      const cacheKey = this.getCacheKey(points);
      this.cache.set(cacheKey, {
        display: result.display,
        timestamp: Date.now(),
        result: result
      });
      
      // 限制缓存大小
      if (this.cache.size > 100) {
        const oldestKey = Array.from(this.cache.keys())[0];
        this.cache.delete(oldestKey);
      }
    }
    
    return result.display;
  }
  
  // 获取缓存键
  getCacheKey(points) {
    const stage = GameStateChecker.getGameStage();
    const pointsStr = points.toString();
    return `${stage}_${pointsStr.substring(0, 50)}`; // 限制长度
  }
  
  // 清空缓存
  clearCache() {
    this.cache.clear();
  }
  
  // 启用/禁用缓存
  setCacheEnabled(enabled) {
    this.cacheEnabled = enabled;
  }
  
  // 获取当前显示模式的详细信息
  getDisplayInfo() {
    const points = GameStateChecker.getPlayerPoints();
    const result = this.ruleEngine.applyRules(points);
    
    return {
      display: result.display,
      mode: result.mode,
      cssClass: result.cssClass,
      tooltip: result.tooltip,
      rawPoints: points,
      formattedPoints: PointsFormatter.formatPoints(points),
      stage: GameStateChecker.getGameStage(),
      ruleName: result.ruleName
    };
  }
  
  // 添加自定义显示规则
  addDisplayRule(rule) {
    this.ruleEngine.addRule(rule);
    this.clearCache(); // 清除缓存以应用新规则
  }
  
  // 批量添加规则
  addDisplayRules(rules) {
    rules.forEach(rule => this.ruleEngine.addRule(rule));
    this.clearCache();
  }
  
  // 创建简单的条件规则
  createSimpleRule(name, conditionCallback, displayCallback, priority = 10) {
    return {
      name: name,
      priority: priority,
      condition: conditionCallback,
      action: (points) => ({
        display: displayCallback(points),
        mode: DisplayConfig.modes.CUSTOM,
        cssClass: `custom-display-${name.toLowerCase()}`
      })
    };
  }
}

// ============================================
// 显示推导系统 - 全局实例和兼容函数
// ============================================

// 创建全局实例
const DisplaySystem = new DisplayManager();

// 原函数兼容版本（保持原有API）
function deduceDisplay() {
  return DisplaySystem.deduceDisplay();
}

// 增强版本（返回更多信息）
function deduceDisplayEnhanced() {
  return DisplaySystem.getDisplayInfo();
}

// ============================================
// 游戏集成和初始化
// ============================================

// 初始化显示系统
function initializeDisplaySystem() {
  // 确保player对象存在
  if (typeof player === 'undefined') {
    console.warn("player对象未定义，延迟初始化显示系统");
    setTimeout(initializeDisplaySystem, 100);
    return;
  }
  
  // 设置全局访问
  if (typeof window !== 'undefined') {
    window.DisplaySystem = DisplaySystem;
    window.DeduceDisplay = deduceDisplay;
    window.PointsFormatter = PointsFormatter;
    window.GameStateChecker = GameStateChecker;
  }
  
  console.log("显示推导系统初始化完成");
  
  // 添加示例自定义规则
  // DisplaySystem.addDisplayRule(
  //   DisplaySystem.createSimpleRule(
  //     "custom_threshold",
  //     () => GameStateChecker.getPlayerPoints().gt(new Decimal(1e1000)),
  //     () => "VERY BIG!"
  //   )
  // );
}

// 自动初始化
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDisplaySystem);
  } else {
    setTimeout(initializeDisplaySystem, 100);
  }
}

// CSS样式
const displaySystemStyles = `
<style>
.retribution-points {
  color: #FF0000;
  font-weight: bold;
  text-shadow: 0 0 5px rgba(255, 0, 0, 0.5);
}

.omega-display {
  font-family: 'Times New Roman', serif;
  font-style: italic;
  font-size: 1.2em;
}

.normal-display {
  font-family: monospace;
  color: #333;
}

.display-tooltip {
  position: relative;
  cursor: help;
}

.display-tooltip:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  white-space: nowrap;
  font-size: 12px;
  z-index: 1000;
}
</style>
`;

// 注入样式
if (typeof document !== 'undefined') {
  document.head.insertAdjacentHTML('beforeend', displaySystemStyles);
}

// 导出模块（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DisplaySystem,
    deduceDisplay,
    deduceDisplayEnhanced,
    PointsFormatter,
    GameStateChecker,
    DisplayConfig
  };
}
