// 配置文件 - 便于修改和扩展
const RETRIBUTION_CONFIG = {
  name: "Retribution",
  symbol: "Retribution",
  position: 0,
  row: 99,
  color: "#FF0000",
  resource: "Retributions",
  
  // 每个阶段的要求和行为
  stages: [
    {
      requirement: (player) => player.points.gte(new Decimal(10).tetrate(1e100)),
      action: () => {
        alert('没做完');
        return true; // 返回true表示执行成功
      },
      description: "第一阶段"
    },
    {
      requirement: () => false,
      action: () => {
        console.warn("第二阶段尚未实现");
        return false;
      },
      description: "第二阶段（锁定）"
    }
  ]
};

// 辅助函数 - 提高代码可读性和复用性
const RetributionUtils = {
  getCurrentStageIndex() {
    return player.retributions || 0;
  },

  getCurrentStage() {
    const stageIndex = this.getCurrentStageIndex();
    return RETRIBUTION_CONFIG.stages[stageIndex] || RETRIBUTION_CONFIG.stages[0];
  },

  canAffordCurrentStage() {
    const stage = this.getCurrentStage();
    try {
      return stage.requirement(player);
    } catch (error) {
      console.error("检查Retribution条件时出错:", error);
      return false;
    }
  },

  executeCurrentStageAction() {
    const stage = this.getCurrentStage();
    try {
      return stage.action();
    } catch (error) {
      console.error("执行Retribution操作时出错:", error);
      return false;
    }
  },

  shouldAdvanceStage() {
    const currentIndex = this.getCurrentStageIndex();
    return currentIndex < RETRIBUTION_CONFIG.stages.length - 1;
  },

  advanceStage() {
    if (this.shouldAdvanceStage()) {
      player.retributions = (player.retributions || 0) + 1;
      return true;
    }
    return false;
  }
};

// 显示文本生成器
const RetributionDisplay = {
  getStageDisplay() {
    const stageIndex = RetributionUtils.getCurrentStageIndex();
    const stage = RetributionUtils.getCurrentStage();
    
    return `
      <div class="retribution-display">
        <h1>[RETRIBUTION]</h1>
        <div class="stage-info">
          当前阶段: ${stageIndex + 1}/${RETRIBUTION_CONFIG.stages.length}
        </div>
        <div class="stage-description">
          ${stage.description}
        </div>
      </div>
    `;
  },

  getPointsDisplay() {
    const points = player.retri?.points || new Decimal(0);
    const stageIndex = RetributionUtils.getCurrentStageIndex();
    
    return `
      <div class="retribution-points">
        <strong>Retributions:</strong> ${stageIndex}<br>
        <strong>Points:</strong> ${format(points)}
      </div>
    `;
  }
};

// 主图层定义
addLayer("retri", {
  name: RETRIBUTION_CONFIG.name,
  symbol: RETRIBUTION_CONFIG.symbol,
  symbolI18N: RETRIBUTION_CONFIG.symbol,
  position: RETRIBUTION_CONFIG.position,
  row: RETRIBUTION_CONFIG.row,
  
  startData() {
    return {
      unlocked: true,
      points: new Decimal(0),
      // 初始化retribution阶段索引
      stageIndex: 0
    };
  },
  
  color: RETRIBUTION_CONFIG.color,
  requires: new Decimal(0),
  
  layerShown() {
    return true;
  },
  
  resource: RETRIBUTION_CONFIG.resource,
  resourceI18N: RETRIBUTION_CONFIG.resource,
  
  baseAmount() {
    return player.points;
  },
  
  type: "none",
  
  buyables: {
    11: {
      display() {
        return RetributionDisplay.getStageDisplay();
      },
      
      canAfford() {
        return RetributionUtils.canAffordCurrentStage();
      },
      
      buy() {
        const success = RetributionUtils.executeCurrentStageAction();
        if (success) {
          RetributionUtils.advanceStage();
        }
        
        // 更新显示
        updateBuyable("retri", 11);
        return success;
      },
      
      // 添加视觉反馈
      style: {
        "background-color": function() {
          return RetributionUtils.canAffordCurrentStage() ? "#4CAF50" : "#FF5252";
        },
        "color": "white",
        "padding": "10px",
        "border-radius": "5px"
      }
    }
  },
  
  microtabs: {
    tab: {
      "main": {
        name: () => 'Retribution',
        nameI18N: () => 'Retribution',
        content: [
          ['buyable', 11],
          ['display-text', () => RetributionDisplay.getPointsDisplay()]
        ]
      }
    }
  },
  
  tabFormat: [
    ["display-text", () => RetributionDisplay.getPointsDisplay()],
    "main-display",
    "prestige-button",
    "blank",
    ["microtabs", "tab"]
  ],
  
  // 添加更新钩子
  update(diff) {
    const stage = RetributionUtils.getCurrentStage();
    // 可以在这里添加每帧更新的逻辑
  },
  
  // 添加快捷访问方法
  getStageInfo() {
    return {
      currentIndex: RetributionUtils.getCurrentStageIndex(),
      totalStages: RETRIBUTION_CONFIG.stages.length,
      canAdvance: RetributionUtils.canAffordCurrentStage()
    };
  }
});

// 初始化函数（如果需要）
function initRetribution() {
  // 确保player.retributions存在
  if (player.retributions === undefined) {
    player.retributions = 0;
  }
  
  // 初始化完成后调用
  console.log("Retribution系统初始化完成");
}

// 自动初始化（如果游戏已加载）
if (typeof player !== 'undefined') {
  initRetribution();
}
