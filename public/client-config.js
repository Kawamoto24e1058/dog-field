// クライアント側ゲーム設定
const CLIENT_CONFIG = {
  // カード定義（サーバー側と同期する必要あり）
  CARDS: {
    // 攻撃系 - 物理
    atk_light: { name: '軽撃', emoji: '⚔️', type: 'attack', damage: 10, cost: 1 },
    atk_medium: { name: '中撃', emoji: '🗡️', type: 'attack', damage: 15, cost: 2 },
    atk_heavy: { name: '重撃', emoji: '🪓', type: 'attack', damage: 20, cost: 3 },
    atk_pierce: { name: '貫通', emoji: '🔪', type: 'attack', damage: 18, cost: 2, piercing: true },
    atk_critical: { name: '会心', emoji: '💥', type: 'attack', damage: 25, cost: 4 },
    atk_rapid: { name: '連撃', emoji: '🗡️⚡', type: 'attack', damage: 8, cost: 2, hits: 2 },
    
    // 攻撃系 - 魔法
    atk_fire: { name: '炎撃', emoji: '🔥', type: 'attack', damage: 16, cost: 2 },
    atk_ice: { name: '氷撃', emoji: '❄️', type: 'attack', damage: 14, cost: 2, slow: true },
    atk_thunder: { name: '雷撃', emoji: '⚡', type: 'attack', damage: 22, cost: 3 },
    atk_dark: { name: '闇撃', emoji: '🌑', type: 'attack', damage: 19, cost: 3, lifesteal: 5 },
    atk_holy: { name: '聖撃', emoji: '✨', type: 'attack', damage: 17, cost: 2 },
    
    // 防御系
    def_light: { name: '軽防', emoji: '🛡️', type: 'defend', mitigation: 5, cost: 1 },
    def_heavy: { name: '強防', emoji: '🏰', type: 'defend', mitigation: 12, cost: 2 },
    def_perfect: { name: '完防', emoji: '💎', type: 'defend', mitigation: 20, cost: 3 },
    def_counter: { name: '反撃', emoji: '🪃', type: 'defend', mitigation: 8, cost: 2, counterDamage: 8 },
    def_barrier: { name: '障壁', emoji: '🔷', type: 'defend', mitigation: 10, cost: 2, duration: 2 },
    def_dodge: { name: '回避', emoji: '💨', type: 'defend', mitigation: 15, cost: 2 },
    
    // 回復系
    heal_small: { name: '小回復', emoji: '💚', type: 'heal', recovery: 15, cost: 2 },
    heal_medium: { name: '中回復', emoji: '💖', type: 'heal', recovery: 25, cost: 3 },
    heal_large: { name: '大回復', emoji: '💗', type: 'heal', recovery: 35, cost: 4 },
    heal_regen: { name: '再生', emoji: '🌿', type: 'heal', recovery: 10, cost: 2, duration: 3 },
    heal_cleanse: { name: '浄化', emoji: '✨💚', type: 'heal', recovery: 20, cost: 3, cleanse: true },
    
    // 特殊系 - サポート
    draw_extra: { name: '増幅', emoji: '🔄', type: 'draw', drawCount: 2, cost: 2 },
    draw_mega: { name: '大増幅', emoji: '🔄✨', type: 'draw', drawCount: 3, cost: 3 },
    buff_power: { name: '力強化', emoji: '💪', type: 'buff', powerBoost: 5, cost: 2, duration: 2 },
    buff_speed: { name: '速度強化', emoji: '⚡🏃', type: 'buff', speedBoost: true, cost: 2 },
    debuff_weak: { name: '弱体化', emoji: '😵', type: 'debuff', powerReduction: 5, cost: 2 },
    
    // 特殊系 - ユーティリティ
    steal_card: { name: 'カード奪取', emoji: '🃏', type: 'special', stealCard: true, cost: 3 },
    discard_enemy: { name: '手札破壊', emoji: '💢', type: 'special', discardEnemy: 1, cost: 2 },
    revive: { name: '復活', emoji: '👼', type: 'special', reviveHP: 30, cost: 5 },
    reflect: { name: '反射', emoji: '🪞', type: 'special', reflectNext: true, cost: 3 },
    poison: { name: '毒', emoji: '☠️', type: 'special', poisonDamage: 5, cost: 2, duration: 3 }
  },

  // ゲーム設定
  GAME: {
    INITIAL_HP: 100,
    TURN_TIME_LIMIT: 30
  }
};

// カードのカラーマッピング
const CARD_COLORS = {
  attack: '#ff6b6b',    // 赤系
  defend: '#4ecdc4',    // 青系
  heal: '#95e1d3',      // 緑系
  draw: '#f9ca24',      // 黄系
  buff: '#a78bfa',      // 紫系
  debuff: '#fb923c',    // オレンジ系
  special: '#ec4899'    // ピンク系
};

// Socket.io 接続設定
const SOCKET_CONFIG = {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
};
