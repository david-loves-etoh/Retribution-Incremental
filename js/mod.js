// 1. 基本使用（兼容原函数）
drawTree(); // 渲染整个树

// 2. 添加自定义连接
TreeRenderSystem.addCustomConnection("node1", "node2", {
  color: 2, // 使用主题颜色2
  width: 10,
  style: "dashed",
  curve: { type: "quadratic", intensity: 30 }
});

// 3. 更改颜色主题
TreeRenderSystem.setColorTheme("dark");

// 4. 获取渲染统计
const stats = TreeRenderSystem.getStats();
console.log(`平均渲染时间: ${stats.averageFrameTime.toFixed(2)}ms`);

// 5. 手动触发渲染（例如在游戏状态变化后）
TreeRenderSystem.render();

// 6. 清除缓存（例如在DOM变化后）
TreeRenderSystem.clearCache();

// 7. 动态添加自定义主题
TreeRendererConfig.colorThemes.myTheme = ["#FF5733", "#33FF57", "#3357FF"];

// 8. 监听渲染完成事件
TreeRenderSystem.canvasManager.addResizeHandler(() => {
  console.log("画布已调整大小");
});

// ============================================
// 游戏配置系统 - 主配置模块
// ============================================

class GameConfig {
  constructor() {
    this.config = {
      // 基础游戏信息
      info: {
        name: "果报增量 - Retribution Incremental",
        nameI18N: "Retribution Incremental",
        id: "retribution-incremental",
        author: "RBNR_326649",
        pointsName: "Energy",
        pointsNameI18N: "Energy"
      },
      
      // 游戏文件配置
      files: {
        layers: [
          "layers/layerCounter.js",
          "layers/g.js",
          "layers/retri.js"
        ],
        others: ["tree.js"]
      },
      
      // 国际化配置
      i18n: {
        enabled: true,
        changedDefaultLanguage: false,
        defaultLanguages: {
          en: "English",
          zh: "Chinese"
        }
      },
      
      // 游戏初始设置
      initialization: {
        startPoints: new Decimal(0),
        offlineLimit: 8760, // 小时
        maxTickLength: 3600, // 最大tick长度
        devSpeed: 1
      },
      
      // 颜色主题配置
      themes: {
        current: "default",
        presets: {
          default: {
            colors: {
              primary: "#ffffff",
              secondary: "#bfbfbf",
              tertiary: "#7f7f7f",
              text: "#dfdfdf",
              points: "#ffffff",
              locked: "#bf8f8f",
              background: "#0f0f0f",
              tooltipBackground: "rgba(0, 0, 0, 0.75)"
            },
            button: {
              width: '250px',
              height: '40px',
              fontSize: '25px',
              borderWidth: '3px'
            }
          },
          // 可以添加更多主题
          light: {
            colors: {
              primary: "#000000",
              secondary: "#404040",
              tertiary: "#808080",
              text: "#202020",
              points: "#000000",
              locked: "#8f4f4f",
              background: "#f0f0f0",
              tooltipBackground: "rgba(255, 255, 255, 0.9)"
            },
            button: {
              width: '250px',
              height: '40px',
              fontSize: '25px',
              borderWidth: '3px'
            }
          }
        }
      },
      
      // 版本信息
      version: {
        number: "0.0",
        name: "Literally nothing",
        changelog: ""
      },
      
      // 性能优化
      performance: {
        doNotCallEveryTick: [
          "blowUpEverything"
        ],
        cacheResults: true,
        maxRecursionDepth: 100
      }
    };
    
    // 初始化
    this.initialize();
  }
  
  // 初始化配置
  initialize() {
    // 合并现有配置（如果存在）
    if (typeof modInfo !== 'undefined') {
      this.mergeExistingConfig();
    }
    
    // 应用配置
    this.applyConfig();
    
    console.log('游戏配置系统初始化完成');
  }
  
  // 合并现有配置
  mergeExistingConfig() {
    // 合并modInfo
    this.config.info = {
      ...this.config.info,
      name: modInfo.name || this.config.info.name,
      nameI18N: modInfo.nameI18N || this.config.info.nameI18N,
      id: modInfo.id || this.config.info.id,
      author: modInfo.author || this.config.info.author,
      pointsName: modInfo.pointsName || this.config.info.pointsName
    };
    
    // 合并文件配置
    if (modInfo.modFiles) {
      this.config.files.layers = modInfo.modFiles.filter(file => 
        file.includes('layers/')
      );
      this.config.files.others = modInfo.modFiles.filter(file => 
        !file.includes('layers/')
      );
    }
    
    // 合并国际化配置
    this.config.i18n = {
      ...this.config.i18n,
      enabled: modInfo.internationalizationMod !== undefined ? 
        modInfo.internationalizationMod : this.config.i18n.enabled,
      changedDefaultLanguage: modInfo.changedDefaultLanguage !== undefined ? 
        modInfo.changedDefaultLanguage : this.config.i18n.changedDefaultLanguage
    };
    
    // 合并初始设置
    this.config.initialization = {
      ...this.config.initialization,
      startPoints: modInfo.initialStartPoints || this.config.initialization.startPoints,
      offlineLimit: modInfo.offlineLimit || this.config.initialization.offlineLimit
    };
  }
  
  // 应用配置到全局变量
  applyConfig() {
    // 设置modInfo
    window.modInfo = {
      name: this.config.info.name,
      nameI18N: this.config.info.nameI18N,
      id: this.config.info.id,
      author: this.config.info.author,
      pointsName: this.config.info.pointsName,
      pointsNameI18N: this.config.info.pointsNameI18N,
      modFiles: [
        ...this.config.files.layers,
        ...this.config.files.others
      ],
      internationalizationMod: this.config.i18n.enabled,
      changedDefaultLanguage: this.config.i18n.changedDefaultLanguage,
      initialStartPoints: this.config.initialization.startPoints,
      offlineLimit: this.config.initialization.offlineLimit
    };
    
    // 设置颜色配置
    window.colors = this.getCurrentThemeColors();
    
    // 设置版本信息
    window.VERSION = {
      num: this.config.version.number,
      name: this.config.version.name
    };
  }
  
  // 获取当前主题的颜色配置
  getCurrentThemeColors() {
    const theme = this.config.themes.presets[this.config.themes.current] || 
                  this.config.themes.presets.default;
    
    return {
      button: theme.button,
      default: theme.colors
    };
  }
  
  // 切换主题
  setTheme(themeName) {
    if (this.config.themes.presets[themeName]) {
      this.config.themes.current = themeName;
      window.colors = this.getCurrentThemeColors();
      return true;
    }
    return false;
  }
  
  // 获取主题列表
  getAvailableThemes() {
    return Object.keys(this.config.themes.presets);
  }
  
  // 创建自定义主题
  createCustomTheme(themeName, themeConfig) {
    if (this.config.themes.presets[themeName]) {
      console.warn(`主题 "${themeName}" 已存在，将被覆盖`);
    }
    
    this.config.themes.presets[themeName] = themeConfig;
    return true;
  }
  
  // 获取配置信息
  getInfo() {
    return {
      game: this.config.info,
      version: this.config.version,
      i18n: this.config.i18n,
      theme: this.config.themes.current,
      initialization: this.config.initialization
    };
  }
}

// ============================================
// 游戏配置系统 - 版本管理器
// ============================================

class VersionManager {
  constructor(config) {
    this.config = config;
    this.migrationHandlers = new Map();
  }
  
  // 获取版本信息
  getVersion() {
    return {
      number: this.config.version.number,
      name: this.config.version.name,
      changelog: this.getChangelog()
    };
  }
  
  // 获取更新日志
  getChangelog() {
    if (this.config.version.changelog) {
      return this.config.version.changelog;
    }
    
    // 生成默认更新日志
    return `
      ${this.config.version.number} - ${this.config.version.name}
      ====================================
      
      初始版本
      
      功能：
      - 基础增量游戏框架
      - 星系生成器系统
      - 果报系统
      - 国际化支持
      
      注意：这是开发中的早期版本
    `;
  }
  
  // 设置版本
  setVersion(versionNumber, versionName, changelog = "") {
    this.config.version.number = versionNumber;
    this.config.version.name = versionName;
    
    if (changelog) {
      this.config.version.changelog = changelog;
    }
    
    // 更新全局VERSION
    if (typeof window !== 'undefined') {
      window.VERSION = {
        num: versionNumber,
        name: versionName
      };
    }
    
    return true;
  }
  
  // 添加版本迁移处理器
  addMigrationHandler(versionFrom, versionTo, handler) {
    const key = `${versionFrom}_${versionTo}`;
    this.migrationHandlers.set(key, handler);
  }
  
  // 执行版本迁移
  migrateSaveData(oldVersion, newVersion) {
    const key = `${oldVersion}_${newVersion}`;
    const handler = this.migrationHandlers.get(key);
    
    if (handler) {
      console.log(`正在从版本 ${oldVersion} 迁移到 ${newVersion}`);
      return handler();
    }
    
    console.log(`没有找到从版本 ${oldVersion} 到 ${newVersion} 的迁移处理器`);
    return false;
  }
  
  // 修复旧版本存档
  fixOldSave(oldVersion) {
    // 这里可以添加版本特定的修复逻辑
    console.log(`修复旧版本存档: ${oldVersion}`);
    
    // 默认实现（不做任何操作，但保留原函数接口）
    return true;
  }
}

// ============================================
// 游戏配置系统 - 国际化管理器
// ============================================

class I18nManager {
  constructor(config) {
    this.config = config;
    this.currentLanguage = null;
    this.translations = new Map();
    this.initializeTranslations();
  }
  
  // 初始化翻译
  initializeTranslations() {
    // 基础翻译
    this.translations.set('en', {
      points_name: "Energy",
      you_have: "You have",
      congratulations: "Congratulations! You have reached the end and beaten this game, but for now...",
      choose_language: "You should choose your language first"
    });
    
    this.translations.set('zh', {
      points_name: "能量",
      you_have: "你有",
      congratulations: "你暂时完成了游戏!",
      choose_language: "你需要先选择语言"
    });
  }
  
  // 设置当前语言
  setLanguage(languageCode) {
    if (this.translations.has(languageCode)) {
      this.currentLanguage = languageCode;
      return true;
    }
    return false;
  }
  
  // 获取翻译
  translate(key, defaultValue = "") {
    if (!this.currentLanguage) {
      return defaultValue;
    }
    
    const langTranslations = this.translations.get(this.currentLanguage);
    return langTranslations[key] || defaultValue;
  }
  
  // 添加翻译
  addTranslation(languageCode, key, translation) {
    if (!this.translations.has(languageCode)) {
      this.translations.set(languageCode, {});
    }
    
    const langTranslations = this.translations.get(languageCode);
    langTranslations[key] = translation;
  }
  
  // 获取可用语言
  getAvailableLanguages() {
    return Array.from(this.translations.keys()).map(code => ({
      code,
      name: this.config.i18n.defaultLanguages[code] || code
    }));
  }
}

// ============================================
// 游戏配置系统 - 显示管理器
// ============================================

class DisplayManager {
  constructor(config, i18nManager) {
    this.config = config;
    this.i18n = i18nManager;
    this.displayComponents = [];
    this.customDisplays = new Map();
  }
  
  // 初始化显示组件
  initialize() {
    // 添加默认显示组件
    this.addDisplayComponent(() => {
      if (this.shouldShowLanguagePrompt()) {
        return this.getLanguagePrompt();
      }
      return '<div class="res">' + this.getDisplayContent() + '</div><br><div class="vl2"></div></span>';
    });
  }
  
  // 添加显示组件
  addDisplayComponent(component) {
    this.displayComponents.push(component);
  }
  
  // 获取显示内容
  getDisplayContent() {
    let content = "";
    
    // 获取所有显示组件的内容
    for (const component of this.displayComponents) {
      try {
        const componentContent = component();
        if (componentContent) {
          content += componentContent;
        }
      } catch (error) {
        console.error('显示组件执行出错:', error);
      }
    }
    
    return content;
  }
  
  // 检查是否应该显示语言选择提示
  shouldShowLanguagePrompt() {
    return this.config.i18n.enabled && 
           typeof options !== 'undefined' && 
           options.ch === undefined;
  }
  
  // 获取语言选择提示
  getLanguagePrompt() {
    const message = this.i18n.translate('choose_language', "You should choose your language first");
    return `<big><br>${message}<br>你需要先选择语言</big>`;
  }
  
  // 获取游戏结束文本
  getWinText() {
    return this.i18n.translate('congratulations', "Congratulations! You have reached the end and beaten this game, but for now...");
  }
  
  // 获取点数显示
  getPointsDisplay() {
    let display = '';
    
    // 显示开发速度（如果启用）
    if (player.devSpeed && player.devSpeed !== 1) {
      const devSpeedLabel = options.ch ? '时间加速: ' : 'Dev Speed: ';
      display += `<br>${devSpeedLabel}${format(player.devSpeed)}x`;
    }
    
    // 显示离线时间（如果启用）
    if (player.offTime !== undefined) {
      const offlineLabel = options.ch ? '离线加速剩余时间: ' : 'Offline Time: ';
      display += `<br>${offlineLabel}${formatTime(player.offTime.remain)}`;
    }
    
    display += '<br>';
    
    // 显示点数信息
    if (!this.shouldShowLanguagePrompt()) {
      const pointsLabel = this.i18n.translate('you_have', 'You have');
      const pointsName = this.i18n.translate('points_name', this.config.info.pointsName);
      
      display += `
        <span class="overlayThing">
          ${pointsLabel} <h2 class="overlayThing" id="points">${this.getDeducedPointsDisplay()}</h2> ${pointsName}
        </span>
      `;
      
      // 显示每秒生成点数
      if (this.canGeneratePoints()) {
        const pointGen = this.getPointGeneration();
        display += `<br><span class="overlayThing">(${this.formatPointGeneration(pointGen)}/sec)</span>`;
      }
      
      display += `<div style="margin-top: 3px"></div>`;
    }
    
    // 添加其他显示内容
    if (typeof tmp !== 'undefined' && tmp.displayThings) {
      display += tmp.displayThings;
    }
    
    display += '<br><br>';
    
    return display;
  }
  
  // 获取推导的点数显示
  getDeducedPointsDisplay() {
    // 如果存在deduceDisplay函数则使用它
    if (typeof deduceDisplay === 'function') {
      return deduceDisplay();
    }
    
    // 否则使用默认格式化
    return format(player.points || new Decimal(0));
  }
  
  // 检查是否可以生成点数
  canGeneratePoints() {
    return true;
  }
  
  // 获取点数生成率
  getPointGeneration() {
    let gain = new Decimal(2).pow(player.g?.points || 0);
    
    // 应用星系升级效果
    if (hasUpgrade("g", 13)) {
      gain = gain.tetrate(player.g?.meta || 0);
    }
    
    // 应用上限
    gain = gain.min(new Decimal(10).tetrate(1e100));
    
    return gain;
  }
  
  // 格式化点数生成率
  formatPointGeneration(pointGen) {
    if (typeof tmp !== 'undefined' && tmp.other?.oompsMag !== 0) {
      const oomps = tmp.other.oomps || 0;
      const mag = tmp.other.oompsMag || 0;
      
      if (mag < 0) {
        return `${format(oomps)} OoM^OoMs`;
      } else if (mag > 1) {
        return `${format(oomps)} OoM^${mag}s`;
      } else {
        return `${format(oomps)} OoMs`;
      }
    }
    
    return formatSmall(pointGen);
  }
  
  // 获取开始点数
  getStartPoints() {
    return new Decimal(this.config.initialization.startPoints);
  }
  
  // 检查是否隐藏左侧表格
  shouldHideLeftTable() {
    return false;
  }
  
  // 检查游戏是否结束
  isEndgame() {
    return false;
  }
  
  // 获取最大tick长度
  getMaxTickLength() {
    return this.config.initialization.maxTickLength;
  }
}

// ============================================
// 游戏配置系统 - 主管理器
// ============================================

class GameConfigurationSystem {
  constructor() {
    this.config = new GameConfig();
    this.versionManager = new VersionManager(this.config.config);
    this.i18nManager = new I18nManager(this.config.config);
    this.displayManager = new DisplayManager(this.config.config, this.i18nManager);
    
    // 初始化
    this.initialize();
  }
  
  // 初始化系统
  initialize() {
    // 初始化显示管理器
    this.displayManager.initialize();
    
    // 设置全局函数
    this.setupGlobalFunctions();
    
    console.log('游戏配置系统初始化完成');
  }
  
  // 设置全局函数
  setupGlobalFunctions() {
    // 原函数兼容性包装
    window.hiddenLeftTable = () => this.displayManager.shouldHideLeftTable();
    window.changelog = () => this.versionManager.getChangelog();
    window.winText = () => this.displayManager.getWinText();
    window.getStartPoints = () => this.displayManager.getStartPoints();
    window.canGenPoints = () => this.displayManager.canGeneratePoints();
    window.getPointGen = () => this.displayManager.getPointGeneration();
    window.getPointsDisplay = () => this.displayManager.getPointsDisplay();
    window.isEndgame = () => this.displayManager.isEndgame();
    window.maxTickLength = () => this.displayManager.getMaxTickLength();
    window.fixOldSave = (oldVersion) => this.versionManager.fixOldSave(oldVersion);
    
    // 玩家数据扩展
    window.addedPlayerData = () => ({
      retributions: 0,
      // 可以添加更多默认玩家数据
      lastPlayed: Date.now(),
      settings: {
        theme: this.config.config.themes.current,
        language: this.i18nManager.currentLanguage
      }
    });
    
    // 不每tick调用的函数
    window.doNotCallTheseFunctionsEveryTick = [
      ...this.config.config.performance.doNotCallEveryTick
    ];
    
    // 显示组件
    window.displayThings = [
      () => this.displayManager.getDisplayContent()
    ];
    
    // 背景样式
    window.backgroundStyle = {};
  }
  
  // 获取系统信息
  getInfo() {
    return {
      config: this.config.getInfo(),
      version: this.versionManager.getVersion(),
      languages: this.i18nManager.getAvailableLanguages(),
      themes: this.config.getAvailableThemes()
    };
  }
  
  // 设置语言
  setLanguage(languageCode) {
    return this.i18nManager.setLanguage(languageCode);
  }
  
  // 设置主题
  setTheme(themeName) {
    return this.config.setTheme(themeName);
  }
  
  // 创建自定义主题
  createCustomTheme(themeName, themeConfig) {
    return this.config.createCustomTheme(themeName, themeConfig);
  }
  
  // 添加版本迁移
  addVersionMigration(fromVersion, toVersion, handler) {
    this.versionManager.addMigrationHandler(fromVersion, toVersion, handler);
  }
  
  // 添加显示组件
  addDisplayComponent(component) {
    this.displayManager.addDisplayComponent(component);
  }
}

// ============================================
// 游戏配置系统 - 全局实例
// ============================================

// 创建全局实例
const GameConfigSystem = new GameConfigurationSystem();

// 设置全局访问
if (typeof window !== 'undefined') {
  window.GameConfigSystem = GameConfigSystem;
}

// 初始化完成提示
console.log('果报增量游戏配置系统已加载');

// 导出模块（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GameConfigSystem,
    GameConfigurationSystem,
    GameConfig,
    VersionManager,
    I18nManager,
    DisplayManager
  };
}
