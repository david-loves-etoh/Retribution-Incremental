// 游戏核心配置（语义化替换原有配置命名）
const GAME_CORE_CONFIG = {
  coreSerialNumber: "9191919191919",
  coreDefaultLabel: "智障antidim19728",
  coreEmptySerialNumber: "000000000",
};

// 全局状态与常量（建议后续迁移到模块作用域，命名更清晰）
let gamePlayerData = {};
let isCanvasUpdateRequired = true;
const decimalValueZero = new Decimal(0);
const decimalValueOne = new Decimal(1);

/**
 * 计算图层重置收益（替换原getResetGain）
 * @param {string} layerId - 图层唯一标识
 * @param {string|null} profitType - 收益类型（static/normal/custom，默认自动识别）
 * @returns {Decimal} 图层重置的具体收益值
 */
function calculateLayerResetProfit(layerId, profitType = null) {
  // 参数校验：确保图层配置存在
  if (!layers[layerId] || !tmp[layerId]) return decimalValueZero;

  // 优先使用自定义收益计算逻辑
  if (!profitType && layers[layerId].calculateResetProfit) {
    return layers[layerId].calculateResetProfit();
  }

  const layerType = profitType || tmp[layerId].type;
  const layerConfig = tmp[layerId];

  // 无类型/自定义类型处理
  if (layerType === "none") return decimalValueZero;
  if (layerType === "custom") return layers[layerId].calculateResetProfit();
  if (layerConfig.profitExponent.eq(0)) return decimalValueZero;

  // 静态类型收益计算
  if (layerType === "static") {
    if (layerConfig.baseAmount.lt(layerConfig.requirement)) return decimalValueOne;
    if (!layerConfig.canBuyMax) return decimalValueOne;

    let profitAmount = layerConfig.baseAmount
      .div(layerConfig.requirement)
      .div(layerConfig.profitMultiplier)
      .max(1)
      .log(layerConfig.base)
      .times(layerConfig.profitExponent)
      .pow(Decimal.pow(layerConfig.exponent, -1));

    return profitAmount.times(layerConfig.directMultiplier)
      .floor()
      .sub(gamePlayerData[layerId].points)
      .add(1)
      .max(1);
  }

  // 普通类型收益计算
  if (layerType === "normal") {
    if (layerConfig.baseAmount.lt(layerConfig.requirement)) return decimalValueZero;

    let profitAmount = layerConfig.baseAmount
      .div(layerConfig.requirement)
      .pow(layerConfig.exponent)
      .times(layerConfig.profitMultiplier)
      .pow(layerConfig.profitExponent);

    // 软上限处理
    if (profitAmount.gte(layerConfig.softcap)) {
      profitAmount = profitAmount.pow(layerConfig.softcapPower)
        .times(layerConfig.softcap.pow(decimalValueOne.sub(layerConfig.softcapPower)));
    }

    return profitAmount.times(layerConfig.directMultiplier).floor().max(0);
  }

  return decimalValueZero;
}

/**
 * 计算下一次重置所需条件值（替换原getNextAt）
 * @param {string} layerId - 图层唯一标识
 * @param {boolean} allowMaxBuy - 是否允许最大购买
 * @param {string|null} profitType - 类型（static/normal/custom）
 * @returns {Decimal} 下一次重置所需的阈值
 */
function calculateNextResetRequirement(layerId, allowMaxBuy = false, profitType = null) {
  if (!layers[layerId] || !tmp[layerId]) return new Decimal(Infinity);

  // 优先使用自定义逻辑
  if (!profitType && layers[layerId].calculateNextResetReq) {
    return layers[layerId].calculateNextResetReq(allowMaxBuy);
  }

  const layerType = profitType || tmp[layerId].type;
  const layerConfig = tmp[layerId];

  // 无效配置处理
  if (layerType === "none") return new Decimal(Infinity);
  if (layerConfig.profitMultiplier.lte(0) || layerConfig.profitExponent.lte(0)) {
    return new Decimal(Infinity);
  }

  // 自定义类型处理
  if (layerType === "custom") return layers[layerId].calculateNextResetReq(allowMaxBuy);

  // 静态类型计算
  if (layerType === "static") {
    const effectiveMaxBuy = allowMaxBuy && layerConfig.canMax;
    const amount = gamePlayerData[layerId].points.plus(
      effectiveMaxBuy && layerConfig.baseAmount.gte(layerConfig.nextResetReq)
        ? layerConfig.resetProfit
        : 0
    ).div(layerConfig.directMultiplier);

    const extraCost = Decimal.pow(layerConfig.base, amount.pow(layerConfig.exponent).div(layerConfig.profitExponent))
      .times(layerConfig.profitMultiplier);

    let cost = extraCost.times(layerConfig.requirement).max(layerConfig.requirement);
    return layerConfig.roundUpCost ? cost.ceil() : cost;
  }

  // 普通类型计算
  if (layerType === "normal") {
    let nextReq = layerConfig.resetProfit.add(1).div(layerConfig.directMultiplier);

    // 软上限反向计算
    if (nextReq.gte(layerConfig.softcap)) {
      nextReq = nextReq.div(layerConfig.softcap.pow(decimalValueOne.sub(layerConfig.softcapPower)))
        .pow(decimalValueOne.div(layerConfig.softcapPower));
    }

    nextReq = nextReq
      .root(layerConfig.profitExponent)
      .div(layerConfig.profitMultiplier)
      .root(layerConfig.exponent)
      .times(layerConfig.requirement)
      .max(layerConfig.requirement);

    return layerConfig.roundUpCost ? nextReq.ceil() : nextReq;
  }

  return decimalValueZero;
}

/**
 * 数值软上限处理（替换原softcap）
 * @param {Decimal} targetValue - 待处理的目标数值
 * @param {Decimal} capThreshold - 软上限阈值
 * @param {number|Decimal} decayPower - 衰减幂次（默认0.5）
 * @returns {Decimal} 应用软上限后的最终数值
 */
function applyValueSoftCap(targetValue, capThreshold, decayPower = 0.5) {
  const decayPowerDecimal = Decimal.isDecimal(decayPower) ? decayPower : new Decimal(decayPower);
  return targetValue.lte(capThreshold)
    ? targetValue
    : targetValue.pow(decayPowerDecimal).times(capThreshold.pow(decimalValueOne.sub(decayPowerDecimal)));
}

/**
 * 判断图层是否需要高亮提示（替换原shouldNotify）
 * @param {string} layerId - 图层唯一标识
 * @returns {boolean} 是否需要显示高亮提示
 */
function checkLayerNeedsNotification(layerId) {
  if (!layers[layerId] || !tmp[layerId]) return false;
  const layerConfig = tmp[layerId];

  // 检查可购买升级
  for (const [upgradeId, upgradeConfig] of Object.entries(layerConfig.upgrades || {})) {
    if (isPlainObject(upgradeConfig) && !hasUpgrade(layerId, upgradeId)) {
      if (upgradeConfig.unlocked && canAffordUpgrade(layerId, upgradeId)) {
        return true;
      }
    }
  }

  // 检查可完成的挑战
  if (gamePlayerData[layerId].activeChallenge) {
    if (checkChallengeIsCompletable(layerId, gamePlayerData[layerId].activeChallenge)) {
      return true;
    }
  }

  // 自定义提示条件
  if (layerConfig.needNotification) return true;

  // 检查主标签页提示
  if (isPlainObject(layerConfig.tabFormat)) {
    for (const subTab of Object.keys(layerConfig.tabFormat)) {
      if (subTabNeedsNotification(layerId, "mainTabs", subTab)) {
        layerConfig.trueGlowColor = layerConfig.tabFormat[subTab].glowColor || defaultGlow;
        return true;
      }
    }
  }

  // 检查微标签页提示
  for (const [tabFamily, subTabs] of Object.entries(layerConfig.microtabs || {})) {
    for (const subTab of Object.keys(subTabs)) {
      if (subTabNeedsNotification(layerId, tabFamily, subTab)) {
        layerConfig.trueGlowColor = subTabs[subTab].glowColor;
        return true;
      }
    }
  }

  return false;
}

/**
 * 判断图层是否可重置（替换原canReset）
 * @param {string} layerId - 图层唯一标识
 * @returns {boolean} 该图层是否满足重置条件
 */
function checkLayerIsResettable(layerId) {
  if (!layers[layerId] || !tmp[layerId]) return false;

  // 自定义重置条件
  if (layers[layerId].isResettable !== undefined) {
    return run(layers[layerId].isResettable, layers[layerId]);
  }

  const layerConfig = tmp[layerId];
  switch (layerConfig.type) {
    case "normal":
      return layerConfig.baseAmount.gte(layerConfig.requirement);
    case "static":
      return layerConfig.baseAmount.gte(layerConfig.nextResetReq);
    default:
      return false;
  }
}

/**
 * 重置指定行的所有图层（替换原rowReset）
 * @param {number} rowNum - 图层行号
 * @param {string} triggerLayerId - 触发重置的图层唯一标识
 */
function resetLayerRow(rowNum, triggerLayerId) {
  if (isNaN(rowNum) || !triggerLayerId) return;

  for (const layerId of ROW_LAYERS[rowNum] || []) {
    const layerObj = layers[layerId];
    // 执行图层自定义重置逻辑
    if (layerObj.executeResetLogic) {
      if (!isNaN(rowNum)) {
        Vue.set(gamePlayerData[layerId], "activeChallenge", null); // 退出挑战
      }
      run(layerObj.executeResetLogic, layerObj, triggerLayerId);
    }
    // 重置低行数据
    else if (tmp[triggerLayerId].row > tmp[layerId].row && !isNaN(rowNum)) {
      resetSingleLayerData(layerId);
    }
  }
}

/**
 * 重置单个图层数据（保留关键配置，替换原layerDataReset）
 * @param {string} layerId - 图层唯一标识
 * @param {string[]} extraPreserveFields - 额外需要保留的字段数组
 */
function resetSingleLayerData(layerId, extraPreserveFields = []) {
  if (!gamePlayerData[layerId]) return;

  // 始终保留的核心字段（语义化命名）
  const corePreservedLayerFields = [
    "unlocked",
    "forceTooltip",
    "noRespecConfirm",
    "prevTab",
    ...extraPreserveFields
  ];

  // 缓存需保留的数据
  const cachedPreservedData = {};
  corePreservedLayerFields.forEach(field => {
    if (gamePlayerData[layerId][field] !== undefined) {
      cachedPreservedData[field] = gamePlayerData[layerId][field];
    }
  });

  // 重置图层基础数据
  Vue.set(gamePlayerData[layerId], "buyables", getStartBuyables(layerId));
  Vue.set(gamePlayerData[layerId], "clickables", getStartClickables(layerId));
  Vue.set(gamePlayerData[layerId], "challenges", getStartChallenges(layerId));
  Vue.set(gamePlayerData[layerId], "grid", getStartGrid(layerId));
  layOver(gamePlayerData[layerId], getStartLayerData(layerId));

  // 清空可重置数据
  gamePlayerData[layerId].upgrades = [];
  gamePlayerData[layerId].milestones = [];
  gamePlayerData[layerId].achievements = [];

  // 恢复保留字段
  Object.assign(gamePlayerData[layerId], cachedPreservedData);
}

/**
 * 给指定图层添加点数（替换原addPoints）
 * @param {string} layerId - 图层唯一标识
 * @param {Decimal} pointAmount - 要增加的点数（必须是Decimal类型）
 */
function addLayerPoints(layerId, pointAmount) {
  if (!gamePlayerData[layerId] || !Decimal.isDecimal(pointAmount)) return;

  gamePlayerData[layerId].points = gamePlayerData[layerId].points.add(pointAmount).max(0);
  // 更新最佳记录和总点数
  if (gamePlayerData[layerId].bestRecord) {
    gamePlayerData[layerId].bestRecord = gamePlayerData[layerId].bestRecord.max(gamePlayerData[layerId].points);
  }
  if (gamePlayerData[layerId].totalPoints) {
    gamePlayerData[layerId].totalPoints = gamePlayerData[layerId].totalPoints.add(pointAmount);
  }
}

/**
 * 基于时间差生成图层点数（替换原generatePoints）
 * @param {string} layerId - 图层唯一标识
 * @param {number|Decimal} timeDelta - 时间差（秒）
 */
function generateLayerPointsByTime(layerId, timeDelta) {
  const timeDeltaDecimal = Decimal.isDecimal(timeDelta) ? timeDelta : new Decimal(timeDelta);
  const profitAmount = tmp[layerId].resetProfit.times(timeDeltaDecimal);
  addLayerPoints(layerId, profitAmount);
}

/**
 * 执行指定图层的重置操作（替换原doReset）
 * @param {string} layerId - 图层唯一标识
 * @param {boolean} forceReset - 强制重置（忽略常规条件检查）
 */
function executeLayerReset(layerId, forceReset = false) {
  if (!layers[layerId] || !tmp[layerId]) return;

  const layerConfig = tmp[layerId];
  const layerObj = layers[layerId];

  // 无类型图层跳过重置
  if (layerConfig.type === "none") return;

  const rowNum = layerConfig.row;

  // 非强制重置：检查前置条件
  if (!forceReset) {
    if (layerConfig.isResettable === false) return;
    if (layerConfig.baseAmount.lt(layerConfig.requirement)) return;

    // 计算重置收益
    let profitAmount = layerConfig.resetProfit;
    if (layerConfig.type === "static") {
      if (layerConfig.baseAmount.lt(layerConfig.nextResetReq)) return;
      profitAmount = layerConfig.canBuyMax ? profitAmount : 1;
    }

    // 执行重置前回调函数
    if (layerObj.beforePrestige) {
      run(layerObj.beforePrestige, layerObj, profitAmount);
    }

    // 添加图层点数并更新进度
    addLayerPoints(layerId, profitAmount);
    updateMilestones(layerId);
    updateAchievements(layerId);

    // 解锁图层（首次重置时）
    if (!gamePlayerData[layerId].unlocked) {
      gamePlayerData[layerId].unlocked = true;
      isCanvasUpdateRequired = true;

      // 提升关联图层解锁顺序
      if (layerConfig.increaseUnlockOrder) {
        layerConfig.increaseUnlockOrder.forEach(relatedLayerId => {
          if (!gamePlayerData[relatedLayerId].unlocked) {
            gamePlayerData[relatedLayerId].unlockOrder++;
          }
        });
      }
    }
  }

  // 跳过重置逻辑（自定义配置）
  if (run(layerObj.noResetData, layerObj)) return;

  // 重置图层基础数值
  layerConfig.baseAmount = decimalValueZero;

  // 完成所有相关挑战
  for (const resetLayerId of Object.keys(layers)) {
    if (rowNum >= layers[resetLayerId].row && (!forceReset || resetLayerId !== layerId)) {
      finishLayerChallenge(resetLayerId);
    }
  }

  // 重置核心点数和对应行数据
  gamePlayerData.points = rowNum === 0 ? decimalValueZero : getStartPoints();
  for (let x = rowNum; x >= 0; x--) {
    resetLayerRow(x, layerId);
  }
  Object.keys(OTHER_LAYERS).forEach(r => resetLayerRow(r, layerId));

  // 重置计时并更新临时状态
  gamePlayerData[layerId].resetTime = 0;
  updateTemp();
  updateTemp();
}

/**
 * 确认并重置指定行图层（替换原resetRow）
 * @param {number} rowNum - 图层行号
 */
function confirmAndResetLayerRow(rowNum) {
  const confirmText = "I WANT TO RESET THIS";
  const userInput = prompt(
    "Are you sure you want to reset this row? It is highly recommended that you wait until the end of your current run before doing this! Type \"" + confirmText + "\" to confirm"
  );

  if (userInput !== confirmText) return;

  // 获取行关联图层
  const prevRowLayers = ROW_LAYERS[rowNum - 1] || [];
  const targetRowLayers = ROW_LAYERS[rowNum] || [];
  const nextRowLayers = ROW_LAYERS[rowNum + 1] || [];

  // 执行重置逻辑
  if (nextRowLayers.length > 0) resetLayerRow(rowNum + 1, nextRowLayers[0]);
  if (prevRowLayers.length > 0) executeLayerReset(prevRowLayers[0], true);

  // 锁定目标行图层
  targetRowLayers.forEach(layerId => {
    gamePlayerData[layerId].unlocked = false;
    if (gamePlayerData[layerId].unlockOrder !== undefined) {
      gamePlayerData[layerId].unlockOrder = 0;
    }
  });

  // 重置核心点数并更新页面状态
  gamePlayerData.points = getStartPoints();
  updateTemp();
  resizeCanvas();
}

/**
 * 开始/结束指定图层的挑战（替换原startChallenge）
 * @param {string} layerId - 图层唯一标识
 * @param {string|number} challengeId - 挑战唯一标识
 */
function toggleLayerChallenge(layerId, challengeId) {
  if (!gamePlayerData[layerId] || !tmp[layerId]?.challenges[challengeId]) return;

  const isChallengeActive = gamePlayerData[layerId].activeChallenge === challengeId;
  let needEnterChallenge = false;

  // 验证挑战解锁状态
  if (!gamePlayerData[layerId].unlocked || !tmp[layerId].challenges[challengeId].unlocked) {
    return;
  }

  // 处理当前激活的挑战
  if (isChallengeActive) {
    finishLayerChallenge(layerId, challengeId);
    Vue.set(gamePlayerData[layerId], "activeChallenge", null);
  } else {
    needEnterChallenge = true;
  }

  // 强制重置该图层
  executeLayerReset(layerId, true);

  // 进入新挑战
  if (needEnterChallenge) {
    Vue.set(gamePlayerData[layerId], "activeChallenge", challengeId);
    const challengeConfig = layers[layerId].challenges[challengeId];
    if (challengeConfig.onEnterChallenge) {
      run(challengeConfig.onEnterChallenge, challengeConfig);
    }
  }

  updateChallengeTemp(layerId);
}

/**
 * 判断指定挑战是否可完成（替换原canCompleteChallenge）
 * @param {string} layerId - 图层唯一标识
 * @param {string|number} challengeId - 挑战唯一标识
 * @returns {boolean} 该挑战是否满足完成条件
 */
function checkChallengeIsCompletable(layerId, challengeId) {
  if (!gamePlayerData[layerId] || gamePlayerData[layerId].activeChallenge !== challengeId) {
    return false;
  }

  const challengeConfig = tmp[layerId].challenges[challengeId];
  if (challengeConfig.isCompletable !== undefined) {
    return challengeConfig.isCompletable;
  }

  // 自定义货币判断逻辑
  if (challengeConfig.currencyInternalName) {
    const currencyName = challengeConfig.currencyInternalName;
    let currencyValue;

    if (challengeConfig.currencyLocation) {
      currencyValue = challengeConfig.currencyLocation[currencyName];
    } else if (challengeConfig.currencyLayerId) {
      currencyValue = gamePlayerData[challengeConfig.currencyLayerId][currencyName];
    } else {
      currencyValue = gamePlayerData[currencyName];
    }

    return currencyValue !== undefined && !currencyValue.lt(challengeConfig.goal);
  }

  // 默认使用核心点数判断挑战完成条件
  return !gamePlayerData.points.lt(challengeConfig.goal);
}

/**
 * 完成指定图层的挑战（替换原completeChallenge）
 * @param {string} layerId - 图层唯一标识
 * @param {string|number|null} challengeId - 挑战唯一标识（默认使用当前激活挑战）
 */
function finishLayerChallenge(layerId, challengeId = null) {
  const activeChallengeId = challengeId || gamePlayerData[layerId].activeChallenge;
  if (!activeChallengeId) return;

  const challengeConfig = tmp[layerId].challenges[activeChallengeId];
  const isChallengeCompletable = checkChallengeIsCompletable(layerId, activeChallengeId);

  // 未完成：退出挑战并执行退出回调
  if (!isChallengeCompletable) {
    Vue.set(gamePlayerData[layerId], "activeChallenge", null);
    if (layers[layerId].challenges[activeChallengeId].onExitChallenge) {
      run(layers[layerId].challenges[activeChallengeId].onExitChallenge, challengeConfig);
    }
    return;
  }

  // 完成挑战：更新挑战完成次数
  const currentCompletionCount = gamePlayerData[layerId].challenges[activeChallengeId] || 0;
  const newCompletionCount = Math.min(
    currentCompletionCount + 1,
    challengeConfig.completionLimit
  );

  if (newCompletionCount > currentCompletionCount) {
    isCanvasUpdateRequired = true;
    gamePlayerData[layerId].challenges[activeChallengeId] = newCompletionCount;

    // 执行挑战完成回调函数
    if (layers[layerId].challenges[activeChallengeId].onCompleteChallenge) {
      run(layers[layerId].challenges[activeChallengeId].onCompleteChallenge, challengeConfig);
    }
  }

  // 退出挑战并更新临时状态
  Vue.set(gamePlayerData[layerId], "activeChallenge", null);
  if (layers[layerId].challenges[activeChallengeId].onExitChallenge) {
    run(layers[layerId].challenges[activeChallengeId].onExitChallenge, challengeConfig);
  }
  updateChallengeTemp(layerId);
}

/**
 * 自动购买指定图层的可用升级（替换原autobuyUpgrades）
 * @param {string} layerId - 图层唯一标识
 */
function autoPurchaseLayerUpgrades(layerId) {
  if (!layers[layerId] || !tmp[layerId]?.upgrades) return;

  for (const [upgradeId, upgradeConfig] of Object.entries(tmp[layerId].upgrades)) {
    if (isPlainObject(upgradeConfig) && !hasUpgrade(layerId, upgradeId)) {
      // 检查升级解锁状态和购买能力
      const canAffordUpgrade = layers[layerId].upgrades[upgradeId].isAffordable === undefined
        ? canAffordUpgrade(layerId, upgradeId)
        : layers[layerId].upgrades[upgradeId].isAffordable();

      if (upgradeConfig.unlocked && canAffordUpgrade) {
        buyUpg(layerId, upgradeId);
      }
    }
  }
}

/**
 * 游戏主循环（处理时间更新、点数生成、自动化逻辑，替换原gameLoop）
 * @param {number} timeDelta - 时间差（秒）
 */
function runGameMainLoop(timeDelta) {
  // 终局状态处理
  if (isEndgame() || tmp.gameEnded) {
    tmp.gameEnded = true;
    clearParticles();
  }

  // 时间差有效性校验
  let effectiveTimeDelta = isNaN(timeDelta) || timeDelta < 0 ? 0 : timeDelta;
  if (tmp.gameEnded && !gamePlayerData.keepGoing) {
    effectiveTimeDelta = 0;
    clearParticles();
  }

  // 最大帧时间限制（防止帧率异常）
  if (maxTickLength) {
    const tickLimit = maxTickLength();
    effectiveTimeDelta = Math.min(effectiveTimeDelta, tickLimit);
  }

  // 更新游戏总时间
  addTime(effectiveTimeDelta);

  // 生成核心点数
  gamePlayerData.points = gamePlayerData.points.add(tmp.pointGen.times(effectiveTimeDelta)).max(0);

  // 处理单个图层的被动逻辑和自动化
  const processSingleLayer = (layerId) => {
    if (!gamePlayerData[layerId]) return;
    gamePlayerData[layerId].resetTime += effectiveTimeDelta;
    // 被动点数生成
    if (tmp[layerId].passiveGeneration) {
      generateLayerPointsByTime(layerId, effectiveTimeDelta * tmp[layerId].passiveGeneration);
    }
    // 图层自定义更新逻辑
    if (layers[layerId].onUpdate) {
      layers[layerId].onUpdate(effectiveTimeDelta);
    }
    // 自动化逻辑（自动重置/自动升级）
    if (tmp[layerId].autoPrestige && tmp[layerId].isResettable) {
      executeLayerReset(layerId);
    }
    if (layers[layerId].automateLogic) {
      layers[layerId].automateLogic();
    }
    if (tmp[layerId].autoUpgrade) {
      autoPurchaseLayerUpgrades(layerId);
    }
    // 更新图层最佳点数记录
    if (gamePlayerData[layerId].bestRecord) {
      gamePlayerData[layerId].bestRecord = gamePlayerData[layerId].bestRecord.max(gamePlayerData[layerId].points);
    }
  };

  // 按行顺序遍历所有图层处理
  for (let x = 0; x <= maxRow; x++) {
    (TREE_LAYERS[x] || []).forEach(processSingleLayer);
  }
  // 处理其他独立图层
  Object.values(OTHER_LAYERS).forEach(rowLayers => {
    rowLayers.forEach(processSingleLayer);
  });

  // 更新所有图层的里程碑和成就
  Object.keys(layers).forEach(layerId => {
    if (layers[layerId].milestones) updateMilestones(layerId);
    if (layers[layerId].achievements) updateAchievements(layerId);
  });
}

/**
 * 执行游戏硬重置（清除所有玩家进度，替换原hardReset）
 * @param {object|null} resetOptions - 重置配置选项
 */
function executeFullHardReset(resetOptions = null) {
  if (!confirm("Are you sure you want to do this? You will lose all your progress!")) {
    return;
  }

  // 清除玩家数据和配置选项
  gamePlayerData = {};
  if (resetOptions) {
    options = {};
  }

  // 保存重置状态并刷新页面
  save(true);
  window.location.reload();
}

/**
 * 游戏定时器（控制帧率和主循环执行，替换原匿名定时器逻辑）
 */
let isGameLoopRunning = false;
const GAME_TICK_INTERVAL = 50; // 20 FPS（每50毫秒执行一次主循环）
const CANVAS_AUTO_UPDATE_INTERVAL = 500; // 0.5秒自动更新一次画布

// 主循环定时器
setInterval(() => {
  if (!gamePlayerData || !tmp) return;
  if (isGameLoopRunning) return;
  if (tmp.gameEnded && !gamePlayerData.keepGoing) return;

  isGameLoopRunning = true;
  const currentTime = Date.now();
  let timeDelta = (currentTime - gamePlayerData.time) / 1000;
  const trueTimeDelta = timeDelta;

  // 离线收益处理逻辑
  if (gamePlayerData.offlineTime !== undefined) {
    const maxOfflineDuration = modInfo.offlineLimit * 3600;
    gamePlayerData.offlineTime.remain = Math.min(gamePlayerData.offlineTime.remain, maxOfflineDuration);

    if (gamePlayerData.offlineTime.remain > 0) {
      const offlineTimeDelta = Math.max(gamePlayerData.offlineTime.remain / 10, timeDelta);
      gamePlayerData.offlineTime.remain -= offlineTimeDelta;
      timeDelta += offlineTimeDelta;
    }

    if (!options.offlineProd || gamePlayerData.offlineTime.remain <= 0) {
      gamePlayerData.offlineTime = undefined;
    }
  }

  // 开发者模式：速度倍率调整
  if (gamePlayerData.devSpeed) {
    timeDelta *= gamePlayerData.devSpeed;
  }

  // 更新玩家当前游戏时间
  gamePlayerData.time = currentTime;

  // 画布更新触发
  if (isCanvasUpdateRequired) {
    resizeCanvas();
    isCanvasUpdateRequired = false;
  }

  // 执行游戏主循环前置更新
  tmp.scrolled = document.getElementById('treeTab')?.scrollTop > 30;
  updateTemp();
  updateOomps(timeDelta);
  updateWidth();
  updateTabFormats();

  // 执行游戏主循环核心逻辑
  runGameMainLoop(timeDelta);

  // 主循环后置处理（修复异常值、更新弹窗、粒子效果）
  fixNaNs();
  adjustPopupTime(trueTimeDelta);
  updateParticles(trueTimeDelta);

  isGameLoopRunning = false;
}, GAME_TICK_INTERVAL);

// 画布自动更新定时器
setInterval(() => {
  isCanvasUpdateRequired = true;
}, CANVAS_AUTO_UPDATE_INTERVAL);

// 版本信息格式化（补充原始代码的VERSION处理，命名同步优化）
if (typeof VERSION === "object") {
  VERSION.withoutName = `v${VERSION.num}` + (VERSION.pre
    ? ` Pre-Release ${VERSION.pre}`
    : VERSION.beta
      ? ` Beta ${VERSION.beta}`
      : "");
  VERSION.withName = VERSION.withoutName + (VERSION.name ? `: ${VERSION.name}` : "");
}