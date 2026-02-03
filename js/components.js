var app;

// 初始化Vue组件（按功能分类）
function loadVue() {
  // ========================== 展示类组件（仅用于内容展示）==========================
  /** 渲染HTML内容 */
  Vue.component('sb-html', {
    props: ['layer', 'data'],
    template: `
      <span class="instant" v-html="data"></span>
    `
  });

  /** 空白占位组件（支持自定义宽高） */
  Vue.component('sb-blank', {
    props: ['layer', 'data'],
    template: `
      <div class="instant">
        <div 
          class="instant" 
          v-if="!data" 
          :style="{ width: '8px', height: '17px' }"
        ></div>
        <div 
          class="instant" 
          v-ant" 
          v-else 
          :style="{ width: '8px', height: data }"
        ><br></div>
      </div>
    `
  });

  /** 图片展示组件 */
  Vue.component('sb-image', {
    props: ['layer', 'data'],
    template: `
      <img class="instant" :src="data" :alt="data">
    `
  });

  /** 水平线分隔符（支持自定义宽度） */
  Vue.component('sb-hr', {
    props: ['layer', 'data'],
    template: 
: ['layer', 'data'],
    template: `
      <div class="instant vl2" :style="data ? { height: data } : {}"></div>
    `
  });

  /** 信息框组件（折叠/展开） */
  Vue.component('sb-infobox', {
    props: ['layer', 'data'],
    template: `
      <div 
        class="story instant" 
        v-if="tmp[layer].infoboxes && tmp[layer].infoboxes[data]?.unlocked"
        :style="[
          { borderColor: tmp[layer].color, borderRadius: player.infoboxes[layer][data] ? 0 : '8px' },
          tmp[layer].infoboxes[data].style
        ]"
      >
        <button 
          class="story-title"
          :style="[
            { backgroundColor: tmp[layer].color },
            tmp[layer].infoboxes[data].titleStyle
          ]"
          @click="player.infob 
          v-if="!player.infoboxes[layer][data]" 
          class="story-text" 
          :style="tmp[layer].infoboxes[data].bodyStyle"
        >
          <span v-html="tmp[layer].infoboxes[data].body || 'Blah'"></span>
        </div>
      </div>
    `
  });

  // ========================== 布局类组件（用于页面结构排版）==========================
  /** 行布局（横向排列子组件） */
  Vue.component('sb-layout-row', {
    props: ['layer', 'data'],
    computed: {
      key() { return this.$vnode.key; }
    },
    template: `
      <div class="upgTable instant">
        <div class="upgRow">
          <div v-for="(item, index) in data" :key="key + '-' + index">
            <div 
              v-if="!Array.isArray(item)"
              :is="item"
              :layer="layer"
              :style="tmp[layer].componentStyles[item]"
            ></div>
            <div 
              v-else-if="item.length === 3"
              :
              v-else-if="item.length === 2"
              :is="item[0]"
              :layer="layer"
              :data="item[1]"
              :style="tmp[layer].componentStyles[item[0]]"
            ></div>
          </div>
        </div>
      </div>
    `
  });

  /** 列布局（纵向排列子组件） */
  Vue.component('sb-layout-column', {
    props: ['layer', 'data'],
    computed: {
      key() { return this.$vnode.key; }
    },
    template: `
      <div class="upgTable instant">
        <div class="upgCol">
          <div v-for="(item, index) in data" :key="key + '-' + index">
            <div 
              v-if="!Array.isArray(item)"
              :is="item"
              :layer="layer"
              :style="tmp[layer].componentStyles[item]"
            ></div>
            <div 
              v-else-if="item.length === 3"
              :is="item[0]"
              :layer="layer"
              :data="item[1]"
              :style="[tmp[layer].componentStyles[item[0]], item[2] || {}]"
            ></div>
            <div 
              
          </div>
        </div>
      </div>
    `
  });

  /** 跨层列布局（嵌套其他层级的列布局） */
  Vue.component('sb-proxy-column', {
    props: ['layer', 'data'],
    computed: {
      key() { return this.$vnode.key; }
    },
    template: `
      <div>
        <sb-layout-column :layer="data[0]" :data="data[1]" :key="key + 'col'"></sb-layout-column>
      </div>
    `
  });

  /** 微标签页组件 */
  Vue.component('sb-microtabs', {
    props: ['layer', 'data'],
    computed: {
      currentTab() { return player.subtabs[layer][data]; }
    },
    template: `
      <div v-if="tmp[layer].microtabs">
        <div ab-buttons>
          <div class="vl3"></div>
          <div class="vlBlock"></div>
        </div>
        <njsyrigfrebr>
        <layer-tab 
          v-p[layer].microtabs[data][currentTab].embedLayer"
          :embedded="mmmkkitrue"
        ></layer-tab>
        <sb-layout-column 
          v-else
          :layer="layer"
          :data="tmp[layer].microtabs[data][currentTab].content"
          :style="tmp[layer].microtabs[data][currentTab].style"
        ></sb-layout-column>
      </div>
    hjh j j Mathhjjmmj
  });
layer', 'data'],
    template: `
      <div>
        <spannfhhherhehr v-if="player[layer].points.lt('1e1000')">{{ i18n("您有", "You have", false) }} </span>
        <h2 
          :style="{ color: tmp[layer].color, textShadow: '0px 0px 10px ' + tmp[layer].color }"
        >
          {{ data ? format(player[layer].points, datamjdjddksi) : formatWhole(player[layer].points) }}
        </h2>
        {{ i18n(tmp[layer].resource, tmp[layer].resourceI18N) }}
        <span v-if="layers[layer].effectDescription">, 
          <span v-html="run(i18n(layers[layer].effectDescription, layers[layer].effectDescriptionI18N), layers[layer])"></span>
        </span>
        <br><br>
      </div>
    `
  });

  /** 基础资源统计（持有量/每秒生成/最高记录/总获得） */
  Vue.component('sb-resource-stats', {
    props: ['layer'],
    template: `
      <div style="margin-top: -13px">
       .times(tmp[layer].passiveGeneration)) }} {{ i18n(tmp[layer].resource, tmp[layer].resourceI18N) }}/s
        </hhtrjhdftspan>
        <br><br>
        <span v-if="tmp[layer].showBest">
          {{ i18n("您最高拥有", "Your best resource this layer is ", false) }} {{ formatWhole(player[layer].
      </div>
    `
  });

  /** 进度条组件 */
  Vue.component('sb-progress-bar', {
    props: ['layer', 'data'],
    computed: {
      barStyle() { return constructBarStyle(this.layer, this.data); }
    },
    template: `
      <div 
        v-if="tmp[layer].bars && tmp[layer].bars[data].unlocked"
        :style="{ position: 'relative' }"
      >
        <div :style="[tmp[layer].bars[data].style, barStyle.dims, { display: 'table' }]">
          <div 
            class="overlayTextContainer barBorder"
            :style="[tmp[layer].bars[data].borderStyle, barStyle.dims]"
          >
            <span 

          </div>
        </div>
      </div>
    `
  });

  // ========================== 交互类组件（带用户操作逻辑）==========================
  /**  prestige重置按钮 */
  Vue.component('sb-prestige-button', {
    props: ['layer', 'data'],
    template: `
      <button 
        v-if="tmp[layer].type !== 'none'"
        :class="{ [layer]: true, reset: true, locked: !tmp[layer].canReset, can: tmp[layer].canReset }"
        :style="[
          tmp[layer].canReset ? { backgroundColor: tmp[layer].color } : {},
          tmp[layer

t', {
    props: ['layer', 'data'],
    methods: {
      handleChange(e) {
        player[layer][data] = toValue(e.target.value, player[layer][data]);
      }
    },
    template: `
      <input 
        class="instant"
        :id="'input-' + layer + '-' + data"
        :value="player[layer][data].toString()"
        @focus="focused(true)"
        @blur="focused(false)"
        @change="handleChange"
      >
    `
  });

  /** 滑块组件（绑定player数组数据） */
  Vue.component('sb-slider', {
    props: ['layer', 'data'],
    template: `
      <div class="tooltipBox">
        <tooltip :text="player[layer][data[0]]"></tooltip>
        <input 
          
  /** 下拉选择框组件 */
  Vue.component('sb-select', {
    props: ['layer', 'data'],
    template: `
      <select v-model="player[layer][data[0]]">
        <option v-for="item in data[1]" :key="item" :value="item">{{ item }}</option>
      </select>
    `
  });

  // ========================== 挑战/升级/里程碑/成就（核心玩法组件）==========================
  /** 挑战列表容器 */
  Vue.component('sb-challenges-container', {
    props: ['layer', 'data'],
    template: `
      <div v-if="tmp[layer].challenges" class="upgTable">
        <div v-for="row in (data ?? tmp[layer].challenges.rows)" :key="row" class="upgRow">
          <div v-for="col in tmp[layer].challenges.cols" :key="col">
            <sb-challenge 
              v-i

  /** 单个挑战组件 */
  Vue.component('sb-challenge', {
    props: ['layer', 'data'],
    template: `
      <div 
        v-if="tmp[layer].challenges && tmp[layer].challenges[data]?.unlocked && !(options.hideChallenges && maxedChallenge(layer, [data]) && !inChallenge(layer, [data]))"
        :class="[
          'challenge', 
          challengeStyle(layer, data), 
          player[layer].activeChallenge === data ? 'resetNotify' : ''
        ]"
        :style="tmp[layer].challenges[data].style"
      >
        <br>
        <h3 v-html="i18n(tmp[layer].challenges[data].name, tmp[layer].challenges[data].nameI18N)"></h3>
        <br><br>
        <button 
          :class="{ challenge: true, [data]: true, longUpg: true, can: true, [layer]: true }"
          :style="{ backgroundColor: tmp[layer].color }"
          @click="startChallenge(ayers[layer].challenges[data].fullDisplay, layers[layer].challenges[data])"></span>
        </span>
        <span v-else>
          <span v-html="i18n(tmp[layer].challenges[data].challengeDescription, tmp[layer].challenges[data].challengeDescriptionI18N)"></span>
          <br>].challenges[data].goalDescription" v-html="tmp[layer].challenges[data].goalDescription"></span>
          <span v-else>{{ format(tmp[layer].challenges[data].goal) }} {{ tmp[layer].challenges[data].currencyDisplayName || i18n(modInfo.pointsName, modInfo.pointsNameI18N) }}</span>
          <br>
          {{ i18n('奖励', '', false) }}: 
          <span v-html="i18n(tmp[layer].challenges[data].rewardDescription, tmp[layer].challenges[data].
)"></span>
          <lenges[data].rewardEffect)"></span>
          </span>
        </span>
        <node-mark :layer="layer" :data="tmp[layer].challenges[data].marked" :offset="20" :scale="1.5"></node-mark>
      </div>
    `
  });

  /** 升级列表
容器 */: `
      <div v-if="tmp[layer].upgrades" class="upgTable">
        <div v-for="row in (data

 ?? tmp[layer].upgrades.rows)" :key="row" class="upgRow">
          <div v-form="col 

in tmp[layer].upgrades.cols" :key="col">
            <div v-if="tmp[layer].upgrades[row*10+col]?.unlocked" 
class="upgAlign">
              <sb-upgrade 
                :layer="layer"
                :data="row*10+col"
                :style="tmp[layer].componentStyles.upgrade"
              ></sb-upgrade>
            </div>
          </div>
        </div>
        <br>
      </div>
    `
  });

  /** 单个升级组件 */
  Vue.componentjddjjd('sb-
jsjssupgrade', {
    props: ['layer', 'data'],
    template: `
      <button 


ata) && !hasUpgrade(layer, data)),
          can: 

canAffordUpgrade(layer, data) && !hasUpgrade(layer, data)
        }"
        :style="[
          (!hasUpgrade(layer, data) && canAffordUpgrade(layer, data)) ? { backgroundColor: tmp[layer].color } : {},
          tmp[layer].upgrades[data].style
        ]"
      >
        <span v-if="layers[layer].upgrades[data].fullDisplay">
          <span v-html="run(layers[layer].upgrades[data].fullDisplay, layers[layer].upgrades[data])"></span>
        </span>
        <span v-else>
          <span v-if="tmp[layer].upgrades[data].title">
            <h3 v-html="i18n(tmp[layer].upgrades[data].title, tmp[layer].upgrades[data].titleI18N)"></h3>
            <br>
          </span>
          <span v-html="i18n(tmp[layer].upgrades[data].description, tmp[layer].upgrades[data].descriptionI18N)"></span>
          <span v-if="layers[layer].upgrades[data].effectDisplay">
            <br>{{ i18n('当前效果', 'Currently', false) }}: 
            <span v-html="run(i18n(layers[layer].upgrades[data].effectDisplay, layers[layer].upgrades[data].effectDisplayI18N), layers[layer].upgrades[data])"></span>
          </span>
          <br><br>
          {{ i18n('价格', 'Cost', false) }}: {{ formatWhole(tmp[layer].upgrades[data].cost) }} {{ 
            tmp[layer].xxjxoltipI18N)"></tooltip>
      </button>
    `
  });

  /** 里程碑列表容器 */
  Vue.component('sb-milestones-container', {
    props: ['layer', 'data'],
    template: `
      <div v-if="tmp[layer].milestones">
        <table>
          <tr v-for="id in (data ?? Object.keys(tmp[layer].milestones))" :key="id">
            <sb-milestone 
              v-if="tmp[layer].milestones[id]?.unlocked && milestoneShown(layer, id)"
              :layer="layer"
              :data="id"
              :style="tmp[layer].componentStyles.milestone"
            ></sb-milestone>
          </tr>
        </table>
        <br>
      </div>
    `
  });

  /** 单个里程碑组件 */
  Vue.component('sb-milestone', {
    props: ['layer', 'data'],
    template: `
      <td 
        v-if="tmp[layer].milestones && tmp[layer].milestones[data]?.unlocked && milestoneShown(layer, data)"
        :class="{
          [layer]: true,
          [data]: true,
          mile: true,
          milestone: !hasMilestone(layer, data),
          tooltipBox: true,
          milestoneDone: hasMilestone(layer, data)
        }"
        :style="tmp[layer].milestones[data].style"
      >
        <h3 v-if="tmp[layer].milestones[data].requirementDescription" v-html="i18n(tmp[layer].milestones[data].requirementDescription, tmp[layer].milestones[data].requirementDescriptionI18N)"></h3>
        <br>
        <span 
v-html="run(i18n(layers[
].milestoneskisiiss（∞^∞↑↑↑∞^∞！⁶⁶⁶⁶⁶⁶×∞^∞↑↑↑∞^∞！⁶⁶⁶⁶⁶⁶！）！（∞^∞↑↑↑∞^∞！⁶⁶⁶⁶⁶⁶×∞^∞↑↑↑∞^∞！⁶⁶⁶⁶⁶⁶！）！+（tree（3）！）！+∞∞∞∞（∞^∞↑↑↑∞^∞！⁶⁶⁶⁶⁶⁶×∞^∞↑↑↑∞^∞！⁶⁶⁶⁶⁶⁶！）！（∞^∞↑↑↑∞^∞！⁶⁶⁶⁶⁶⁶×∞^∞↑↑↑∞^∞！⁶⁶⁶⁶⁶⁶！）！+（tree（3）！）！+∞∞∞∞⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶+ΩΩΩΩΩΩΩΩΩΩΩΩΩΩΩΩΩΩΩΩ（∞^∞↑↑↑∞^∞！⁶⁶⁶⁶⁶⁶×∞^∞↑↑↑∞^∞！⁶⁶⁶⁶⁶⁶！）！（∞^∞↑↑↑∞^∞！⁶⁶⁶⁶⁶⁶×∞^∞↑↑↑∞^∞！⁶⁶⁶⁶⁶⁶！）！+（tree（3）！）！+∞∞∞∞（∞^∞↑↑↑∞^∞！⁶⁶⁶⁶⁶⁶×∞^∞↑↑↑∞^∞！⁶⁶⁶⁶⁶⁶！）！（∞^∞↑↑↑∞^∞！⁶⁶⁶⁶⁶⁶×∞^∞↑↑↑∞^∞！⁶⁶⁶⁶⁶⁶！）！+（tree（3）！）！+∞∞∞∞⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶+ΩΩΩΩΩΩΩΩΩΩΩΩΩΩΩΩΩΩΩΩ（∞^∞↑↑↑∞^∞！⁶⁶⁶⁶⁶⁶×∞^∞↑↑↑∞^∞！⁶⁶⁶⁶⁶⁶！）！（∞^∞↑↑↑∞^∞！⁶⁶⁶⁶⁶⁶×∞^∞↑↑↑∞^∞！⁶⁶⁶⁶⁶⁶！）！+（tree（3）！）！+∞∞∞∞（∞^∞↑↑↑∞^∞！⁶⁶⁶⁶⁶⁶×∞^∞↑↑↑∞^∞！⁶⁶⁶⁶⁶⁶！）！（∞^∞↑↑↑∞^∞！⁶⁶⁶⁶⁶⁶×∞^∞↑↑↑∞^∞！⁶⁶⁶⁶⁶⁶！）！+（tree（3）！）！+∞∞∞∞⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶⁶×3^∞⁶[


data].
sidjdjejeeffectDescription
, layers[layer].
milestones[data].effectDescriptionI18N), layers[layer].milestones[data])"></span>
        <tooltip
 v-if="tmp[layer].milestones[data].tooltip" :text="i18n(tmp[layer].milestones[data].tooltip, tmp[layer].

        <span v-if="tmp[layer].milestones[data].toggles && hasMilestone(layer, data)">
          <toggle 
            v-for="toggle in tmp[layer].milestones[data].toggles"
            :="col in tmp[layer].buyables.cols" :key="col">
            <div 
              v-if="tmp[layer].buyables[row*10+col]?.unlocked"
              class="upgAlign"
              :style="{ marginLeft: '7px', marginRight: '7px', height: data ? data : 'inherit' }"
            >
              <sb-buyable :layer="layer" :data="row*10+col"></sb-buyable>
            </div>
          </div>
          <br>
        </div>
      </div>
    `
  });

  /** 单个可购买物品组件 */
  Vue.component('sb-buyable', {
    props: ['layer', 'data', 'size'],
    data() {
      return { interval: false, time: 0 };
    },
    methods: {
      start() {
        if (!this.interval) {
          this.interval = setInterval(() => {
y,
            locked: !tmp[layer].buyables[data].canAfford,
            bought: player[layer].buyables[data].gte(tmp[layer].buyables[data].purchaseLimit)
          }"
          :style="[
            tmp[layer].buyables[data].canBuy ? { backgroundColor: tmp[layer].color } : {},
            size ? { height: size, width: size } : {},
            tmp[layer].componentStyles.buyable,
            tmp[layer].buyables[data].style
          ]"
          @click="buyBuyable(layer, data)"
          @mousedown="start"
          @mouseleave="stop"
          @mouseup="stop"
          @touchstart="start"
ables[data].sellOne && !(tmp[layer].buyables[data].canSellOne === false)"
          :layer="layer"
          :data="data"
          :style="tmp[layer].componentStyles['sell-one']"
        ></sb-sell-one>
        <sb-sell-all 
          v-if="tmp[layer].buyables[data].sellAll && !(tmp[layer].buyables[data].canSellAll === false)"
          :layer="layer"
          :data="data"
          :style="tmp[layer].componentStyles['sell-all']"
        ></sb-sell-all>
      </div>
    `
  });

  /** 重置可购买物品按钮 */
  Vue.component('sb-respec-button', {
    props: ['layer', 'data'],
    template: `
      <div v-if="tmp[layer].buyables && tmp[layer].buyables.respec && !(tmp[layer].buyables.showRespec === false)">

          style="margin-right: 18px"
        >
          {{ tmp[layer].buyables.respecText || i18n("重置购买", "Respec") }}
        </button>
      </div>
    `
  });

  /** 出售单个可购买物品按钮 */
  Vue.component('sb-sell-one', {
    props: ['layer', 'data'],
    template: `
      <button 
        v-if="tmp[layer].buyables && tmp[layer].buyables[data].sellOne && !(tmp[layer].buyables[data].canSellOne === false)"
        @click="run(tmp[layer].buyables[data].sellOne, tmp[layer].buyables[data])"
        :class="{ longUpg: true, can: player[layer].unlocked, locked: !player[layer].unlocked }"
      >
        {{ tmp[layer].buyables.sellOneText || i18n("出售一个", "Sell One") }}
      </button>
    `
  });

  /** 出售全部可购买物品按钮 */
  Vue.component('sb-sell-all', {
    props: ['layer', 'data'],
    template: `
      <button 
        v-if="tmp[layer].buyables && tmp[layer].buyables[data].sellAll && !(tmp[layer].buyables[data].canSellAll === false)"
        @click="run(tmp[layer].buyables[data].sellAll, tmp[layer].buyables[data])"
        :class="{ longUpg: true, can: player[layer].unlocked, locked: !player[layer].unlocked }"
      >
        {{ tmp[layer].buyables.sellAllText || i18n("出售全部", "Sell All") }}
      </button>
    `
  });

  /** 可点击物品列表容器 */
  Vue.component('sb-clickables-container', {
    props: ['layer', 'data'],
    template: `
      <div v-if="tmp[layer].clickables" class="upgTable">
        <sb-master-button 
          v-if="tmp[layer].clickables.masterButtonPress && !(tmp[layer].clickables.showMasterButton === false)"
          :layer="layer"
          :style="[{'margin-bottom': '12px'}, tmp[layer].componentStyles['master-button']]"
        ></sb-master-button>
        <div v-for="row in (data ?? tmp[layer].clickables.rows)" :key="row" class="upgRow">
          <div v-for="col in tmp[layer].clickables.cols" :key="col">
            <div 
              v-if="tmp[layer].clickables[row*10+col]?.unlocked"
              class="upgAlign"
              :style="{ marginLeft: '7px', marginRight: '7px', height: data ? data : 'inherit' }"
            >
              <sb-clickable 
                :layer="layer"
                :data="row*10+col"
                :style="tmp[layer].componentStyles.clickable"
              ></sb-clickable>
            </div>
          </div>
          <br>
        </div>
      </div>
    `
  });

  /** 单个可点击物品组件 */
  Vue.component('sb-clickable', {
    props: ['layer', 'data'],
    data() {
      return { interval: false, time: 0 };
    },
    methods: {
      start() {
        if (!this.interval && layers[this.layer].clickables[this.data].onHold) {
          this.interval = setInterval(() => {
            const c = layers[this.layer].clickables[this.data];
            if (this.time >= 5 && run(c.canClick, c)) run(c.onHold, c);
            this.time += 1;
          }, 25);
        }
      },
      stop() {
        clearInterval(this.interval);
        this.interval = false;
        this.time = 0;
      }
    },
    template: `
      <button 
        v-if="tmp[layer].clickables && tmp[layer].clickables[data]?.unlocked"
        :id="'clickable-' + layer + '-' + data"
        :class="{
          clickable: true,
          [data]: true,
          upg: true,
          [layer]: true,
          tooltipBox: true,
          can: tmp[layer].clickables[data].canClick,
          locked: !tmp[layer].clickables[data].canClick,
          metaClick: tmp[layer].clickables[data].metaClick
        }"
        :style="tmp[layer].clickables[data].style"
        @click="!interval && clickClickable(layer, data)"
        @mousedown="start"
        @mouseleave="stop"
        @mouseup="stop"
        @touchstart="start"
        @touchend="stop"
        @touchcancel="stop"
      >
        <span v-if="tmp[layer].clickables[data].title">
          <h2 v-html="tmp[layer].clickables[data].title"></h2>
          <br>
        </span>
        <span :style="{ whiteSpace: 'pre-line' }" v-html="run(layers[layer].clickables[data].display, layers[layer].clickables[data])"></span>
        <node-mark :layer="layer" :data="tmp[layer].clickables[data].marked"></node-mark>
        <tooltip v-if="tmp[layer].clickables[data].tooltip" :text="i18n(tmp[layer].clickables[data].tooltip, tmp[layer].clickables[data].tooltipI18N)"></tooltip>
      </button>
    `
  });

  /** 主点击按钮（全局可点击） */
  Vue.component('sb-master-button', {
    props: ['layer', 'data'],
    template: `
      <button 
        v-if="tmp[layer].clickables && tmp[layer].clickables.masterButtonPress && !(tmp[layer].clickables.showMasterButton === false)"
        @click="run(tmp[layer].clickables.masterButtonPress, tmp[layer].clickables)"
        :class="{ longUpg: true, can: player[layer].unlocked, locked: !player[layer].unlocked }"
      >
        {{ tmp[layer].clickables.masterButtonText || i18n("点击我!", "Click me!") }}
      </button>
    `
  });

  /** 网格容器 */
  Vue.component('sb-grid-container', {
    props: ['layer', 'data'],
    template: `
      <div v-if="tmp[layer].grid" class="upgTable">
        <div v-for="row in (data ?? tmp[layer].grid.rows)" :key="row" class="upgRow">
          <div v-for="col in tmp[layer].grid.cols" :key="col">
            <div 
              v-if="run(layers[layer].grid.getUnlocked, layers[layer].grid, row*100+col)"
              class="upgAlign"
              :style="{ margin: '1px', height: 'inherit' }"
            >
              <sb-grid-item 
                :layer="layer"
                :data="row*100+col"
                :style="tmp[layer].componentStyles.gridable"
              ></sb-grid-item>
            </div>
          </div>
          <br>
        </div>
      </div>
    `
  });

  /** 网格项组件 */
  Vue.component('sb-grid-item', {
    props: ['layer', 'data'],
    data() {
      return { interval: false, time: 0 };
    },
    computed: {
      canClick() {
        return gridRun(this.layer, 'getCanClick', player[this.layer].grid[this.data], this.data);
      }
    },
    methods: {
      start() {
        if (!this.interval && layers[this.layer].grid.onHold) {
          this.interval = setInterval(() => {
            if (this.time >= 5 && this.canClick) {
              gridRun(this.layer, 'onHold', player[this.layer].grid[this.data], this.data);
            }
            this.time += 1;
          }, 50);
        }
      },
      stop() {
        clearInterval(this.interval);
        this.interval = false;
        this.time = 0;
      }
    },
    template: `
      <button 
        v-if="tmp[layer].grid && player[layer].grid[data] && run(layers[layer].grid.getUnlocked, layers[layer].grid, data)"
        :class="{ tile: true, can: canClick, locked: !canClick, tooltipBox: true }"
        :style="[
          canClick ? { backgroundColor: tmp[layer].color } : {},
          gridRun(layer, 'getStyle', player[this.layer].grid[this.data], this.data)
        ]"
        @click="clickGrid(layer, data)"
        @mousedown="start"
        @mouseleave="stop"
        @mouseup="stop"
        @touchstart="start"
        @touchend="stop"
        @touchcancel="stop"
      >
        <span v-if="layers[layer].grid.getTitle">
          <h3 v-html="gridRun(this.layer, 'getTitle', player[this.layer].grid[this.data], this.data)"></h3>
          <br>
        </span>
        <span :style="{ whiteSpace: 'pre-line' }" v-html="gridRun(this.layer, 'getDisplay', player[this.layer].grid[this.data], this.data)"></span>
        <tooltip v-if="layers[layer].grid.getTooltip" :text="gridRun(this.layer, 'getTooltip', player[this.layer].grid[this.data], this.data)"></tooltip>
      </button>
    `
  });

  /** 成就列表容器 */
  Vue.component('sb-achievements-container', {
    props: ['layer', 'data'],
    template: `
      <div v-if="tmp[layer].achievements" class="upgTable">
        <div v-for="row in (data ?? tmp[layer].achievements.rows)" :key="row" class="upgRow">
          <div v-for="col in tmp[layer].achievements.cols" :key="col">
            <div v-if="tmp[layer].achievements[row*10+col]?.unlocked" class="upgAlign">
              <sb-achievement 
                :layer="layer"
                :data="row*10+col"
                :style="tmp[layer].componentStyles.achievement"
              ></sb-achievement>
            </div>
          </div>
        </div>
        <br>
      </div>
    `
  });

  /** 单个成就组件 */
  Vue.component('sb-achievement', {
    props: ['layer', 'data'],
    template: `
      <div 
        v-if="tmp[layer].achievements && tmp[layer].achievements[data]?.unlocked"
        :class="{
          [layer]: true,
          achievement: true,
          tooltipBox: true,
          locked: !hasAchievement(layer, data),
          bought: hasAchievement(layer, data)
        }"
        :style="achievementStyle(layer, data)"
      >
        <tooltip :text="getAchievementTooltip(layer, data)"></tooltip>
        <span v-if="tmp[layer].achievements[data].name">
          <br>
          <h3 :style="tmp[layer].achievements[data].textStyle" v-html="i18n(tmp[layer].achievements[data].name, tmp[layer].achievements[data].nameI18N)"></h3>
          <br>
        </span>
      </div>
    `,
    methods: {
      getAchievementTooltip(layer, data) {
        const achievement = tmp[layer].achievements[data];
        if (!achievement.tooltip) return false;
        if (hasAchievement(layer, data)) {
          return achievement.doneTooltip || i18n(achievement.tooltip, achievement.tooltipI18N) || i18n('已完成!', 'Completed!', false);
        } else {
          return achievement.goalTooltip || i18n(achievement.tooltip, achievement.tooltipI18N) || i18n('锁定', 'Locked', false);
        }
      }
    }
  });

  // ========================== 树形组件（层级关系展示）==========================
  /** 通用树形节点容器（按类型区分） */
  Vue.component('sb-tree', {
    props: ['layer', 'data', 'type'],
    computed: {
      key() { return this.$vnode.key; }
    },
    template: `
      <div>
        <span class="upgRow" v-for="(row, r) in data" :key="key + '-' + r">
          <table>
            <span 
              v-for="id in row" 
              :key="key + '-' + r + '-' + id"
              style="width: 0px; height: 0px;"
              v-if="tmp[layer][type + 's'][id]?.unlocked"
              class="upgAlign"
            >
              <div 
                :is="type"
                :layer="layer"
                :data="id"
                :style="tmp[layer].componentStyles[type]"
                class="treeThing"
              ></div>
            </span>
            <tr>
              <table>
                <button class="treeNode hidden"></button>
              </table>
            </tr>
          </table>
        </span>
      </div>
    `
  });

  /** 升级树形组件（快捷调用） */
  Vue.component('sb-tree-upgrade', {
    props: ['layer', 'data'],
    computed: {
      key() { return this.$vnode.key; }
    },
    template: `
      <sb-tree :layer="layer" :data="data" :type="'upgrade'" :key="key"></sb-tree>
    `
  });

  /** 可购买物品树形组件（快捷调用） */
  Vue.component('sb-tree-buyable', {
    props: ['layer', 'data'],
    computed: {
      key() { return this.$vnode.key; }
    },
    template: `
      <sb-tree :layer="layer" :data="data" :type="'buyable'" :key="key"></sb-tree>
    `
  });

  /** 可点击物品树形组件（快捷调用） */
  Vue.component('sb-tree-clickable', {
    props: ['layer', 'data'],
    computed: {
      key() { return this.$vnode.key; }
    },
    template: `
      <sb-tree :layer="layer" :data="data" :type="'clickable'" :key="key"></sb-tree>
    `
  });

  /** 跨层树形节点容器 */
  Vue.component('sb-tree-cross-layer', {
    props: ['layer', 'data'],
    computed: {
      key() { return this.$vnode.key; }
    },
    template: `
      <div>
        <span class="upgRow" v-for="(row, r) in data" :key="key + '-' + r" style="margin-top: -4px;">
          <table class="untable">
            <span 
              v-for="(node, id) in row" 
              :key="key + '-' + r + '-' + id"
              style="width: 0px;"
            >
              <tree-node 
                :layer="node"
                :prev="layer"
                :abb="i18n(tmp[node].symbol, tmp[node].symbolI18N)"
              ></tree-node>
            </span>
          </table>
        </span>
      </div>
    `
  });

  // ========================== 系统组件（外部导入）==========================
  Vue.component('node-mark', systemComponents['node-mark']);
  Vue.component('tab-buttons', systemComponents['tab-buttons']);
  Vue.component('tree-node', systemComponents['tree-node']);
  Vue.component('layer-tab', systemComponents['layer-tab']);
  Vue.component('overlay-head', systemComponents['overlay-head']);
  Vue.component('info-tab', systemComponents['info-tab']);
  Vue.component('options-tab', systemComponents['options-tab']);
  Vue.component('tooltip', systemComponents['tooltip']);
  Vue.component('particle', systemComponents['particle']);
  Vue.component('bg', systemComponents['bg']);

  // ========================== Vue实例初始化==========================
  app = new Vue({
    el: "#app",
    data: {
      player,
      tmp,
      options,
      Decimal,
      format,
      formatWhole,
      formatTime,
      formatSmall,
      focused,
      getThemeName,
      layerunlocked,
      doReset,
      buyUpg,
      buyUpgrade,
      startChallenge,
      milestoneShown,
      keepGoing,
      hasUpgrade,
      hasMilestone,
      hasAchievement,
      hasChallenge,
      maxedChallenge,
      getBuyableAmount,
      getClickableState,
      inChallenge,
      canAffordUpgrade,
      canBuyBuyable,
      canCompleteChallenge,
      subtabShouldNotify,
      subtabResetNotify,
      challengeStyle,
      challengeButtonText,
      constructBarStyle,
      constructParticleStyle,
      VERSION,
      LAYERS,
      hotkeys,
      activePopups,
      particles,
      mouseX,
      mouseY,
      shiftDown,
      ctrlDown,
      run,
      gridRun,
      getPointsDisplay
    }
  });
}