// ============================================
// 游戏核心系统 - 配置模块
// ============================================

const GameCoreConfig = {
  // 游戏版本信息
  version: {
    tmtNum: "2.6.6.2",
    tmtName: "Fixed Reality",
    newtmtNum: "3.1.0.5",
  },
  
  // 游戏循环配置
  gameLoop: {
    interval: 50, // 主游戏循环间隔(ms)
    canvasUpdateInterval: 500, // 画布更新间隔(ms)
    maxTickLength: null, // 最大tick长度(可配置函数)
    offlineLimit: 3600, // 离线时间限制(秒)
  },
  
  // 数值计算配置
  calculations: {
    defaultPrecision: 10,
    softcapPower: 0.5,
  },
  
  // 调试配置
  debug: {
    logResets: false,
    logChallenges: false,
    logGameLoop: false,
  }
};

// ============================================
// 游戏核心系统 - 数值计算模块
// ============================================

class GameCalculations {
  // 软上限计算
  static softcap(value, cap, power = GameCoreConfig.calculations.softcapPower) {
    if (value.lte(cap)) return value;
    return value.pow(power).times(cap.pow(decimalOne.sub(power)));
  }
  
  // 获取重置收益
  static getResetGain(layer, useType = null) {
    const type = useType || tmp[layer]?.type;
    const layerObj = layers[layer];
    
    // 自定义重置收益
    if (!useType && layerObj?.getResetGain !== undefined) {
      return layerObj.getResetGain();
    }
    
    // 无类型图层
    if (tmp[layer]?.type === "none") {
      return new Decimal(0);
    }
    
    const tmpLayer = tmp[layer];
    if (!tmpLayer || tmpLayer.gainExp?.eq(0)) {
      return decimalZero;
    }
    
    switch (type) {
      case "static":
        return this.calculateStaticGain(tmpLayer);
      case "normal":
        return this.calculateNormalGain(tmpLayer);
      case "custom":
        return layerObj?.getResetGain?.() || decimalZero;
      default:
        return decimalZero;
    }
  }
  
  // 计算静态增益
  static calculateStaticGain(tmpLayer) {
    if ((!tmpLayer.canBuyMax) || tmpLayer.baseAmount.lt(tmpLayer.requires)) {
      return decimalOne;
    }
    
    let gain = tmpLayer.baseAmount
      .div(tmpLayer.requires)
      .div(tmpLayer.gainMult)
      .max(1)
      .log(tmpLayer.base)
      .times(tmpLayer.gainExp)
      .pow(Decimal.pow(tmpLayer.exponent, -1));
    
    gain = gain.times(tmpLayer.directMult);
    return gain.floor().sub(player[tmpLayer.layer]?.points || 0).add(1).max(1);
  }
  
  // 计算普通增益
  static calculateNormalGain(tmpLayer) {
    if (tmpLayer.baseAmount.lt(tmpLayer.requires)) {
      return decimalZero;
    }
    
    let gain = tmpLayer.baseAmount
      .div(tmpLayer.requires)
      .pow(tmpLayer.exponent)
      .times(tmpLayer.gainMult)
      .pow(tmpLayer.gainExp);
    
    // 应用软上限
    if (gain.gte(tmpLayer.softcap)) {
      gain = this.softcap(gain, tmpLayer.softcap, tmpLayer.softcapPower);
    }
    
    gain = gain.times(tmpLayer.directMult);
    return gain.floor().max(0);
  }
  
  // 获取下一次重置所需点数
  static getNextAt(layer, canMax = false, useType = null) {
    const type = useType || tmp[layer]?.type;
    const layerObj = layers[layer];
    
    // 自定义计算
    if (!useType && layerObj?.getNextAt !== undefined) {
      return layerObj.getNextAt(canMax);
    }
    
    // 无类型图层
    if (tmp[layer]?.type === "none") {
      return new Decimal(Infinity);
    }
    
    const tmpLayer = tmp[layer];
    if (!tmpLayer || tmpLayer.gainMult?.lte(0) || tmpLayer.gainExp?.lte(0)) {
      return new Decimal(Infinity);
    }
    
    switch (type) {
      case "static":
        return this.calculateStaticNextAt(tmpLayer, canMax);
      case "normal":
        return this.calculateNormalNextAt(tmpLayer);
      case "custom":
        return layerObj?.getNextAt?.(canMax) || decimalZero;
      default:
        return decimalZero;
    }
  }
  
  // 计算静态下一次所需
  static calculateStaticNextAt(tmpLayer, canMax) {
    if (!tmpLayer.canBuyMax) canMax = false;
    
    const layerId = this.extractLayerId(tmpLayer);
    const points = player[layerId]?.points || decimalZero;
    
    let amt = points.plus((canMax && tmpLayer.baseAmount.gte(tmpLayer.nextAt)) ? tmpLayer.resetGain : 0)
      .div(tmpLayer.directMult);
    
    let extraCost = Decimal.pow(tmpLayer.base, amt.pow(tmpLayer.exponent).div(tmpLayer.gainExp))
      .times(tmpLayer.gainMult);
    
    let cost = extraCost.times(tmpLayer.requires).max(tmpLayer.requires);
    
    if (tmpLayer.roundUpCost) cost = cost.ceil();
    return cost;
  }
  
  // 计算普通下一次所需
  static calculateNormalNextAt(tmpLayer) {
    let next = tmpLayer.resetGain.add(1).div(tmpLayer.directMult);
    
    // 反向软上限计算
    if (next.gte(tmpLayer.softcap)) {
      next = next.div(tmpLayer.softcap.pow(decimalOne.sub(tmpLayer.softcapPower)))
        .pow(decimalOne.div(tmpLayer.softcapPower));
    }
    
    next = next.root(tmpLayer.gainExp)
      .div(tmpLayer.gainMult)
      .root(tmpLayer.exponent)
      .times(tmpLayer.requires)
      .max(tmpLayer.requires);
    
    if (tmpLayer.roundUpCost) next = next.ceil();
    return next;
  }
  
  // 从tmpLayer中提取图层ID
  static extractLayerId(tmpLayer) {
    // 假设tmpLayer有一个layer属性或可以从其他属性推断
    return tmpLayer.layer || Object.keys(tmp).find(key => tmp[key] === tmpLayer);
  }
}

// ============================================
// 游戏核心系统 - 重置管理器
// ============================================

class ResetManager {
  constructor() {
    this.needCanvasUpdate = true;
  }
  
  // 检查图层是否需要通知
  shouldNotify(layer) {
    // 检查升级
    if (tmp[layer]?.upgrades) {
      for (const id in tmp[layer].upgrades) {
        if (this.isUpgradeNotifiable(layer, id)) {
          return true;
        }
      }
    }
    
    // 检查挑战
    if (player[layer]?.activeChallenge && 
        this.canCompleteChallenge(layer, player[layer].activeChallenge)) {
      return true;
    }
    
    // 检查自定义通知
    if (tmp[layer]?.shouldNotify) {
      return true;
    }
    
    // 检查主选项卡
    if (tmp[layer]?.tabFormat && typeof tmp[layer].tabFormat === 'object') {
      for (const subtab in tmp[layer].tabFormat) {
        if (this.subtabShouldNotify(layer, 'mainTabs', subtab)) {
          tmp[layer].trueGlowColor = tmp[layer].tabFormat[subtab].glowColor || defaultGlow;
          return true;
        }
      }
    }
    
    // 检查微选项卡
    if (tmp[layer]?.microtabs) {
      for (const family in tmp[layer].microtabs) {
        for (const subtab in tmp[layer].microtabs[family]) {
          if (this.subtabShouldNotify(layer, family, subtab)) {
            tmp[layer].trueGlowColor = tmp[layer].microtabs[family][subtab].glowColor;
            return true;
          }
        }
      }
    }
    
    return false;
  }
  
  // 检查升级是否需要通知
  isUpgradeNotifiable(layer, id) {
    const upgrade = layers[layer]?.upgrades[id];
    if (!upgrade || typeof upgrade !== 'object') return false;
    
    return canAffordUpgrade(layer, id) && 
           !hasUpgrade(layer, id) && 
           tmp[layer]?.upgrades[id]?.unlocked;
  }
  
  // 检查子选项卡是否需要通知
  subtabShouldNotify(layer, family, subtab) {
    // 原游戏逻辑，这里保持原样
    try {
      return run(layers[layer][family][subtab].shouldNotify, layers[layer][family][subtab], layer) || false;
    } catch (e) {
      return false;
    }
  }
  
  // 检查是否可以重置
  canReset(layer) {
    const layerObj = layers[layer];
    
    if (layerObj?.canReset !== undefined) {
      return run(layerObj.canReset, layerObj);
    }
    
    if (tmp[layer]?.type === "normal") {
      return tmp[layer].baseAmount.gte(tmp[layer].requires);
    } else if (tmp[layer]?.type === "static") {
      return tmp[layer].baseAmount.gte(tmp[layer].nextAt);
    }
    
    return false;
  }
  
  // 执行重置
  doReset(layer, force = false) {
    if (tmp[layer]?.type === "none") return;
    
    const row = tmp[layer]?.row;
    const layerObj = layers[layer];
    
    if (!force) {
      if (tmp[layer]?.canReset === false) return;
      if (tmp[layer]?.baseAmount.lt(tmp[layer].requires)) return;
      
      let gain = tmp[layer].resetGain;
      
      if (tmp[layer].type === "static") {
        if (tmp[layer].baseAmount.lt(tmp[layer].nextAt)) return;
        gain = (tmp[layer].canBuyMax ? gain : 1);
      }
      
      // 触发重置前事件
      if (layerObj?.onPrestige) {
        run(layerObj.onPrestige, layerObj, gain);
      }
      
      // 增加点数
      this.addPoints(layer, gain);
      
      // 更新里程碑和成就
      updateMilestones(layer);
      updateAchievements(layer);
      
      // 解锁处理
      if (!player[layer]?.unlocked) {
        player[layer].unlocked = true;
        this.needCanvasUpdate = true;
        
        // 增加解锁顺序
        if (tmp[layer]?.increaseUnlockOrder) {
          const lrs = tmp[layer].increaseUnlockOrder;
          for (const lr in lrs) {
            if (!player[lrs[lr]]?.unlocked) {
              player[lrs[lr]].unlockOrder = (player[lrs[lr]].unlockOrder || 0) + 1;
            }
          }
        }
      }
    }
    
    // 检查是否什么都不重置
    if (run(layerObj?.resetsNothing, layerObj)) return;
    
    // 快速修复：重置基数
    tmp[layer].baseAmount = decimalZero;
    
    // 重置相关行
    this.resetRelatedRows(row, layer, force);
    
    // 更新游戏状态
    player[layer].resetTime = 0;
    updateTemp();
    updateTemp();
    
    if (GameCoreConfig.debug.logResets) {
      console.log(`Reset performed: layer=${layer}, force=${force}, row=${row}`);
    }
  }
  
  // 重置相关行
  resetRelatedRows(row, resettingLayer, force) {
    // 完成挑战
    for (const layerResetting in layers) {
      if (row >= layers[layerResetting].row && (!force || layerResetting !== resettingLayer)) {
        this.completeChallenge(layerResetting);
      }
    }
    
    // 重置点数
    player.points = (row === 0 ? decimalZero : getStartPoints());
    
    // 重置行
    for (let x = row; x >= 0; x--) {
      this.rowReset(x, resettingLayer);
    }
    
    // 重置其他图层
    for (const r in OTHER_LAYERS) {
      this.rowReset(r, resettingLayer);
    }
  }
  
  // 重置整行
  resetRow(row) {
    if (prompt('Are you sure you want to reset this row? It is highly recommended that you wait until the end of your current run before doing this! Type "I WANT TO RESET THIS" to confirm') !== "I WANT TO RESET THIS") {
      return;
    }
    
    const preLayers = ROW_LAYERS[row - 1] || [];
    const rowLayers = ROW_LAYERS[row] || [];
    const postLayers = ROW_LAYERS[row + 1] || [];
    
    // 重置后续行
    if (postLayers.length > 0) {
      this.rowReset(row + 1, postLayers[0]);
    }
    
    // 重置前行
    if (preLayers.length > 0) {
      this.doReset(preLayers[0], true);
    }
    
    // 解锁当前行图层
    for (const layer of rowLayers) {
      player[layer].unlocked = false;
      if (player[layer].unlockOrder) {
        player[layer].unlockOrder = 0;
      }
    }
    
    // 重置点数
    player.points = getStartPoints();
    
    // 更新临时数据
    updateTemp();
    resizeCanvas();
  }
  
  // 行重置
  rowReset(row, layer) {
    const rowLayers = ROW_LAYERS[row] || [];
    
    for (const lr of rowLayers) {
      const layerObj = layers[lr];
      
      if (layerObj?.doReset) {
        if (!isNaN(row)) {
          Vue.set(player[lr], "activeChallenge", null);
        }
        run(layerObj.doReset, layerObj, layer);
      } else {
        if (tmp[layer]?.row > tmp[lr]?.row && !isNaN(row)) {
          this.layerDataReset(lr);
        }
      }
    }
  }
  
  // 图层数据重置
  layerDataReset(layer, keep = []) {
    const storedData = {
      unlocked: player[layer]?.unlocked,
      forceTooltip: player[layer]?.forceTooltip,
      noRespecConfirm: player[layer]?.noRespecConfirm,
      prevTab: player[layer]?.prevTab
    };
    
    // 保留指定数据
    for (const thing of keep) {
      if (player[layer]?.[thing] !== undefined) {
        storedData[thing] = player[layer][thing];
      }
    }
    
    // 重置各种数据
    Vue.set(player[layer], "buyables", getStartBuyables(layer));
    Vue.set(player[layer], "clickables", getStartClickables(layer));
    Vue.set(player[layer], "challenges", getStartChallenges(layer));
    Vue.set(player[layer], "grid", getStartGrid(layer));
    
    // 重置图层数据
    layOver(player[layer], getStartLayerData(layer));
    player[layer].upgrades = [];
    player[layer].milestones = [];
    player[layer].achievements = [];
    
    // 恢复保留的数据
    for (const thing in storedData) {
      player[layer][thing] = storedData[thing];
    }
  }
  
  // 添加点数
  addPoints(layer, gain) {
    if (!player[layer]) return;
    
    player[layer].points = player[layer].points.add(gain).max(0);
    
    if (player[layer].best) {
      player[layer].best = player[layer].best.max(player[layer].points);
    }
    
    if (player[layer].total) {
      player[layer].total = player[layer].total.add(gain);
    }
  }
  
  // 生成点数
  generatePoints(layer, diff) {
    if (!tmp[layer]?.resetGain) return;
    
    this.addPoints(layer, tmp[layer].resetGain.times(diff));
  }
}

// ============================================
// 游戏核心系统 - 挑战管理器
// ============================================

class ChallengeManager {
  // 开始挑战
  startChallenge(layer, x) {
    if (!player[layer]?.unlocked || !tmp[layer]?.challenges[x]?.unlocked) {
      return;
    }
    
    let enter = false;
    
    // 如果已经在挑战中，则完成它
    if (player[layer].activeChallenge === x) {
      this.completeChallenge(layer, x);
      Vue.set(player[layer], "activeChallenge", null);
    } else {
      enter = true;
    }
    
    // 重置图层
    GameCore.resetManager.doReset(layer, true);
    
    // 进入挑战
    if (enter) {
      Vue.set(player[layer], "activeChallenge", x);
      const challenge = layers[layer]?.challenges[x];
      if (challenge?.onEnter) {
        run(challenge.onEnter, challenge);
      }
    }
    
    // 更新挑战临时数据
    updateChallengeTemp(layer);
  }
  
  // 检查是否可以完成挑战
  canCompleteChallenge(layer, x) {
    if (x !== player[layer]?.activeChallenge) return false;
    
    const challenge = tmp[layer]?.challenges[x];
    if (!challenge) return false;
    
    // 自定义完成条件
    if (challenge.canComplete !== undefined) {
      return challenge.canComplete;
    }
    
    // 基于货币的完成条件
    if (challenge.currencyInternalName) {
      const currencyName = challenge.currencyInternalName;
      
      if (challenge.currencyLocation) {
        return !(challenge.currencyLocation[currencyName]?.lt(challenge.goal));
      } else if (challenge.currencyLayer) {
        const lr = challenge.currencyLayer;
        return !(player[lr]?.[currencyName]?.lt(challenge.goal));
      } else {
        return !(player[currencyName]?.lt(challenge.goal));
      }
    }
    
    // 基于点数的完成条件
    return !(player.points.lt(challenge.goal));
  }
  
  // 完成挑战
  completeChallenge(layer, x) {
    const activeChallenge = player[layer]?.activeChallenge;
    if (!activeChallenge) return;
    
    const completions = this.canCompleteChallenge(layer, activeChallenge);
    const challengeObj = layers[layer]?.challenges[activeChallenge];
    
    if (!completions) {
      Vue.set(player[layer], "activeChallenge", null);
      if (challengeObj?.onExit) {
        run(challengeObj.onExit, challengeObj);
      }
      return;
    }
    
    // 检查完成限制
    const currentCompletions = player[layer]?.challenges[activeChallenge] || 0;
    const completionLimit = tmp[layer]?.challenges[activeChallenge]?.completionLimit || Infinity;
    
    if (currentCompletions < completionLimit) {
      GameCore.resetManager.needCanvasUpdate = true;
      
      // 增加完成次数
      player[layer].challenges[activeChallenge] = Math.min(
        currentCompletions + completions,
        completionLimit
      );
      
      // 触发完成事件
      if (challengeObj?.onComplete) {
        run(challengeObj.onComplete, challengeObj);
      }
    }
    
    // 退出挑战
    Vue.set(player[layer], "activeChallenge", null);
    if (challengeObj?.onExit) {
      run(challengeObj.onExit, challengeObj);
    }
    
    // 更新挑战临时数据
    updateChallengeTemp(layer);
    
    if (GameCoreConfig.debug.logChallenges) {
      console.log(`Challenge completed: layer=${layer}, challenge=${activeChallenge}, completions=${player[layer].challenges[activeChallenge]}`);
    }
  }
}

// ============================================
// 游戏核心系统 - 游戏循环管理器
// ============================================

class GameLoopManager {
  constructor() {
    this.ticking = false;
    this.gameEnded = false;
    this.interval = null;
    this.canvasUpdateInterval = null;
  }
  
  // 初始化游戏循环
  initialize() {
    // 设置版本信息
    this.setupVersionInfo();
    
    // 启动主游戏循环
    this.startMainLoop();
    
    // 启动画布更新循环
    this.startCanvasUpdateLoop();
    
    console.log('游戏循环管理器初始化完成');
  }
  
  // 设置版本信息
  setupVersionInfo() {
    if (typeof VERSION !== 'undefined') {
      VERSION.withoutName = "v" + VERSION.num + 
        (VERSION.pre ? " Pre-Release " + VERSION.pre : 
         VERSION.beta ? " Beta " + VERSION.beta : "");
      
      VERSION.withName = VERSION.withoutName + 
        (VERSION.name ? ": " + VERSION.name : "");
    }
  }
  
  // 自动购买升级
  autobuyUpgrades(layer) {
    if (!tmp[layer]?.upgrades) return;
    
    for (const id in tmp[layer].upgrades) {
      const upgrade = layers[layer]?.upgrades[id];
      
      if (isPlainObject(tmp[layer].upgrades[id]) && 
          (upgrade?.canAfford === undefined || upgrade.canAfford() === true)) {
        buyUpg(layer, id);
      }
    }
  }
  
  // 主游戏循环
  gameLoop(diff) {
    if (this.gameEnded || tmp.gameEnded) {
      tmp.gameEnded = true;
      clearParticles();
    }
    
    // 验证diff
    if (isNaN(diff) || diff < 0) diff = 0;
    
    // 游戏结束处理
    if (tmp.gameEnded && !player.keepGoing) {
      diff = 0;
      clearParticles();
    }
    
    // 限制tick长度
    if (GameCoreConfig.gameLoop.maxTickLength) {
      const limit = GameCoreConfig.gameLoop.maxTickLength();
      if (diff > limit) diff = limit;
    }
    
    // 更新时间
    addTime(diff);
    
    // 生成基础点数
    player.points = player.points.add(tmp.pointGen?.times(diff) || decimalZero).max(0);
    
    // 更新所有图层
    this.updateAllLayers(diff);
    
    // 自动化系统
    this.runAutomation(diff);
    
    // 更新里程碑和成就
    this.updateMilestonesAndAchievements();
    
    if (GameCoreConfig.debug.logGameLoop && diff > 0) {
      console.log(`Game loop tick: diff=${diff.toFixed(3)}s, points=${format(player.points)}`);
    }
  }
  
  // 更新所有图层
  updateAllLayers(diff) {
    // 更新树形图层
    for (let x = 0; x <= maxRow; x++) {
      for (const item in TREE_LAYERS[x]) {
        const layer = TREE_LAYERS[x][item];
        this.updateLayer(layer, diff);
      }
    }
    
    // 更新其他图层
    for (const row in OTHER_LAYERS) {
      for (const item in OTHER_LAYERS[row]) {
        const layer = OTHER_LAYERS[row][item];
        this.updateLayer(layer, diff);
      }
    }
  }
  
  // 更新单个图层
  updateLayer(layer, diff) {
    if (!player[layer]) return;
    
    // 更新重置时间
    player[layer].resetTime += diff;
    
    // 被动生成点数
    if (tmp[layer]?.passiveGeneration) {
      GameCore.resetManager.generatePoints(layer, diff * tmp[layer].passiveGeneration);
    }
    
    // 图层特定更新
    if (layers[layer]?.update) {
      layers[layer].update(diff);
    }
  }
  
  // 运行自动化系统
  runAutomation(diff) {
    // 从最高行开始，确保正确的重置顺序
    for (let x = maxRow; x >= 0; x--) {
      for (const item in TREE_LAYERS[x]) {
        const layer = TREE_LAYERS[x][item];
        this.automateLayer(layer);
      }
    }
    
    // 自动化其他图层
    for (const row in OTHER_LAYERS) {
      for (const item in OTHER_LAYERS[row]) {
        const layer = OTHER_LAYERS[row][item];
        this.automateLayer(layer);
      }
    }
  }
  
  // 自动化单个图层
  automateLayer(layer) {
    // 自动重置
    if (tmp[layer]?.autoPrestige && tmp[layer]?.canReset) {
      GameCore.resetManager.doReset(layer);
    }
    
    // 图层特定自动化
    if (layers[layer]?.automate) {
      layers[layer].automate();
    }
    
    // 更新最佳点数
    if (player[layer]?.best) {
      player[layer].best = player[layer].best.max(player[layer].points);
    }
    
    // 自动升级
    if (tmp[layer]?.autoUpgrade) {
      this.autobuyUpgrades(layer);
    }
  }
  
  // 更新里程碑和成就
  updateMilestonesAndAchievements() {
    for (const layer in layers) {
      if (layers[layer]?.milestones) updateMilestones(layer);
      if (layers[layer]?.achievements) updateAchievements(layer);
    }
  }
  
  // 开始主游戏循环
  startMainLoop() {
    this.interval = setInterval(() => {
      if (player === undefined || tmp === undefined) return;
      if (this.ticking) return;
      if (tmp.gameEnded && !player.keepGoing) return;
      
      this.ticking = true;
      
      try {
        const now = Date.now();
        let diff = (now - player.time) / 1000;
        const trueDiff = diff;
        
        // 离线时间处理
        this.processOfflineTime(diff);
        
        // 开发者速度调整
        if (player.devSpeed) diff *= player.devSpeed;
        
        player.time = now;
        
        // 更新画布（如果需要）
        if (GameCore.resetManager.needCanvasUpdate) {
          resizeCanvas();
          GameCore.resetManager.needCanvasUpdate = false;
        }
        
        // 更新各种状态
        this.updateGameState(diff, trueDiff);
        
      } catch (error) {
        console.error('游戏循环错误:', error);
      } finally {
        this.ticking = false;
      }
    }, GameCoreConfig.gameLoop.interval);
  }
  
  // 处理离线时间
  processOfflineTime(diff) {
    if (player.offTime !== undefined) {
      const offlineLimit = GameCoreConfig.gameLoop.offlineLimit * 3600;
      
      // 限制离线时间
      if (player.offTime.remain > offlineLimit) {
        player.offTime.remain = offlineLimit;
      }
      
      // 应用离线时间
      if (player.offTime.remain > 0) {
        const offlineDiff = Math.max(player.offTime.remain / 10, diff);
        player.offTime.remain -= offlineDiff;
        diff += offlineDiff;
      }
      
      // 清理离线时间
      if (!options.offlineProd || player.offTime.remain <= 0) {
        player.offTime = undefined;
      }
    }
  }
  
  // 更新游戏状态
  updateGameState(diff, trueDiff) {
    // 更新滚动状态
    const treeTab = document.getElementById('treeTab');
    tmp.scrolled = treeTab && treeTab.scrollTop > 30;
    
    // 更新临时数据
    updateTemp();
    updateOomps(diff);
    updateWidth();
    updateTabFormats();
    
    // 运行游戏循环
    this.gameLoop(diff);
    
    // 修复NaN值
    fixNaNs();
    
    // 调整弹出时间
    adjustPopupTime(trueDiff);
    
    // 更新粒子效果
    updateParticles(trueDiff);
  }
  
  // 启动画布更新循环
  startCanvasUpdateLoop() {
    this.canvasUpdateInterval = setInterval(() => {
      GameCore.resetManager.needCanvasUpdate = true;
    }, GameCoreConfig.gameLoop.canvasUpdateInterval);
  }
  
  // 停止游戏循环
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    if (this.canvasUpdateInterval) {
      clearInterval(this.canvasUpdateInterval);
      this.canvasUpdateInterval = null;
    }
    
    console.log('游戏循环已停止');
  }
  
  // 硬重置游戏
  hardReset(resetOptions = false) {
    if (!confirm("Are you sure you want to do this? You will lose all your progress!")) {
      return;
    }
    
    player = null;
    if (resetOptions) options = null;
    
    save(true);
    window.location.reload();
  }
}

// ============================================
// 游戏核心系统 - 主管理器
// ============================================

class GameCore {
  static instance = null;
  
  constructor() {
    if (GameCore.instance) {
      return GameCore.instance;
    }
    
    this.calculations = new GameCalculations();
    this.resetManager = new ResetManager();
    this.challengeManager = new ChallengeManager();
    this.gameLoopManager = new GameLoopManager();
    
    // 全局变量
    this.player = null;
    
    GameCore.instance = this;
  }
  
  // 初始化游戏核心
  initialize() {
    console.log('初始化游戏核心系统...');
    
    // 初始化各个管理器
    this.gameLoopManager.initialize();
    
    // 设置全局访问
    if (typeof window !== 'undefined') {
      window.GameCore = this;
      
      // 兼容性函数
      window.getResetGain = (...args) => this.calculations.getResetGain(...args);
      window.getNextAt = (...args) => this.calculations.getNextAt(...args);
      window.softcap = this.calculations.softcap;
      window.shouldNotify = (...args) => this.resetManager.shouldNotify(...args);
      window.canReset = (...args) => this.resetManager.canReset(...args);
      window.doReset = (...args) => this.resetManager.doReset(...args);
      window.resetRow = (...args) => this.resetManager.resetRow(...args);
      window.layerDataReset = (...args) => this.resetManager.layerDataReset(...args);
      window.rowReset = (...args) => this.resetManager.rowReset(...args);
      window.addPoints = (...args) => this.resetManager.addPoints(...args);
      window.generatePoints = (...args) => this.resetManager.generatePoints(...args);
      window.startChallenge = (...args) => this.challengeManager.startChallenge(...args);
      window.canCompleteChallenge = (...args) => this.challengeManager.canCompleteChallenge(...args);
      window.completeChallenge = (...args) => this.challengeManager.completeChallenge(...args);
      window.autobuyUpgrades = (...args) => this.gameLoopManager.autobuyUpgrades(...args);
      window.gameLoop = (...args) => this.gameLoopManager.gameLoop(...args);
      window.hardReset = (...args) => this.gameLoopManager.hardReset(...args);
    }
    
    console.log('游戏核心系统初始化完成');
  }
  
  // 获取游戏状态
  getGameState() {
    return {
      player: this.player,
      gameEnded: this.gameLoopManager.gameEnded,
      ticking: this.gameLoopManager.ticking,
      needCanvasUpdate: this.resetManager.needCanvasUpdate
    };
  }
  
  // 设置玩家对象
  setPlayer(playerObj) {
    this.player = playerObj;
    window.player = playerObj; // 保持全局兼容性
  }
  
  // 销毁游戏核心
  destroy() {
    this.gameLoopManager.stop();
    
    if (typeof window !== 'undefined') {
      delete window.GameCore;
    }
    
    console.log('游戏核心系统已销毁');
  }
}

// ============================================
// 游戏核心系统 - 全局实例
// ============================================

// 创建全局实例
const gameCore = new GameCore();

// 游戏加载时自动初始化
function initializeGameCore() {
  // 等待必要对象加载
  if (typeof layers === 'undefined' || typeof tmp === 'undefined') {
    setTimeout(initializeGameCore, 100);
    return;
  }
  
  gameCore.initialize();
}

// 自动初始化
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGameCore);
  } else {
    setTimeout(initializeGameCore, 100);
  }
}

// 导出模块（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GameCore: gameCore,
    GameCalculations,
    ResetManager,
    ChallengeManager,
    GameLoopManager,
    GameCoreConfig
  };
}
