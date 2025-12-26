// ゲーム仕様（バランス設定）
module.exports = {
  // プレイヤー設定
  PLAYER: {
    INITIAL_HP: 100,
    INITIAL_HAND_SIZE: 5,
    MAX_HAND_SIZE: 12
  },

  // ターン設定
  TURN: {
    TIME_LIMIT: 30, // 秒
    TURN_PHASES: ['draw', 'action', 'end']
  },

  // カードテンプレート（バランス調整）
  CARDS: {
    // 攻撃系 - 物理
    ATTACK_LIGHT: { id: 'atk_light', name: '軽撃', emoji: '⚔️', type: 'attack', damage: 10, cost: 1, description: '小ダメージ' },
    ATTACK_MEDIUM: { id: 'atk_medium', name: '中撃', emoji: '🗡️', type: 'attack', damage: 15, cost: 2, description: '中程度ダメージ' },
    ATTACK_HEAVY: { id: 'atk_heavy', name: '重撃', emoji: '🪓', type: 'attack', damage: 20, cost: 3, description: '大ダメージ（高コスト）' },
    ATTACK_PIERCE: { id: 'atk_pierce', name: '貫通', emoji: '🔪', type: 'attack', damage: 18, cost: 2, piercing: true, description: '防御無視ダメージ' },
    ATTACK_CRITICAL: { id: 'atk_critical', name: '会心', emoji: '💥', type: 'attack', damage: 25, cost: 4, description: '超大ダメージ' },
    ATTACK_RAPID: { id: 'atk_rapid', name: '連撃', emoji: '🗡️⚡', type: 'attack', damage: 8, cost: 2, hits: 2, description: '2回攻撃' },
    
    // 攻撃系 - 魔法
    ATTACK_FIRE: { id: 'atk_fire', name: '炎撃', emoji: '🔥', type: 'attack', damage: 16, cost: 2, description: '炎属性ダメージ' },
    ATTACK_ICE: { id: 'atk_ice', name: '氷撃', emoji: '❄️', type: 'attack', damage: 14, cost: 2, slow: true, description: '氷属性ダメージ' },
    ATTACK_THUNDER: { id: 'atk_thunder', name: '雷撃', emoji: '⚡', type: 'attack', damage: 22, cost: 3, description: '雷属性大ダメージ' },
    ATTACK_DARK: { id: 'atk_dark', name: '闇撃', emoji: '🌑', type: 'attack', damage: 19, cost: 3, lifesteal: 5, description: '闇属性+吸収' },
    ATTACK_HOLY: { id: 'atk_holy', name: '聖撃', emoji: '✨', type: 'attack', damage: 17, cost: 2, description: '聖属性ダメージ' },
    
    // 防御系
    DEFEND_LIGHT: { id: 'def_light', name: '軽防', emoji: '🛡️', type: 'defend', mitigation: 5, cost: 1, duration: 1, description: 'ダメージ軽減' },
    DEFEND_HEAVY: { id: 'def_heavy', name: '強防', emoji: '🏰', type: 'defend', mitigation: 12, cost: 2, duration: 2, description: 'ダメージ大幅軽減' },
    DEFEND_PERFECT: { id: 'def_perfect', name: '完防', emoji: '💎', type: 'defend', mitigation: 20, cost: 3, duration: 1, description: '超軽減' },
    DEFEND_COUNTER: { id: 'def_counter', name: '反撃', emoji: '🪃', type: 'defend', mitigation: 8, cost: 2, counterDamage: 8, duration: 1, description: '防御+反撃' },
    DEFEND_BARRIER: { id: 'def_barrier', name: '障壁', emoji: '🔷', type: 'defend', mitigation: 10, cost: 2, duration: 2, description: '2ターン防御' },
    DEFEND_DODGE: { id: 'def_dodge', name: '回避', emoji: '💨', type: 'defend', mitigation: 15, cost: 2, duration: 1, description: '高回避力' },
    
    // 回復系
    HEAL_SMALL: { id: 'heal_small', name: '小回復', emoji: '💚', type: 'heal', recovery: 15, cost: 2, description: '小回復' },
    HEAL_MEDIUM: { id: 'heal_medium', name: '中回復', emoji: '💖', type: 'heal', recovery: 25, cost: 3, description: '中程度回復' },
    HEAL_LARGE: { id: 'heal_large', name: '大回復', emoji: '💗', type: 'heal', recovery: 35, cost: 4, description: '大回復' },
    HEAL_REGEN: { id: 'heal_regen', name: '再生', emoji: '🌿', type: 'heal', recovery: 10, cost: 2, duration: 3, description: '3ターン継続回復' },
    HEAL_CLEANSE: { id: 'heal_cleanse', name: '浄化', emoji: '✨💚', type: 'heal', recovery: 20, cost: 3, cleanse: true, description: '回復+状態異常解除' },
    
    // 特殊系 - サポート
    DRAW_EXTRA: { id: 'draw_extra', name: '増幅', emoji: '🔄', type: 'draw', drawCount: 2, cost: 2, description: '+2カード引く' },
    DRAW_MEGA: { id: 'draw_mega', name: '大増幅', emoji: '🔄✨', type: 'draw', drawCount: 3, cost: 3, description: '+3カード引く' },
    BUFF_POWER: { id: 'buff_power', name: '力強化', emoji: '💪', type: 'buff', powerBoost: 5, cost: 2, duration: 2, description: '攻撃力+5' },
    BUFF_SPEED: { id: 'buff_speed', name: '速度強化', emoji: '⚡🏃', type: 'buff', speedBoost: true, cost: 2, description: '行動速度アップ' },
    DEBUFF_WEAK: { id: 'debuff_weak', name: '弱体化', emoji: '😵', type: 'debuff', powerReduction: 5, cost: 2, description: '相手の攻撃力-5' },
    
    // 特殊系 - ユーティリティ
    STEAL_CARD: { id: 'steal_card', name: 'カード奪取', emoji: '🃏', type: 'special', stealCard: true, cost: 3, description: '相手の手札を奪う' },
    DISCARD_ENEMY: { id: 'discard_enemy', name: '手札破壊', emoji: '💢', type: 'special', discardEnemy: 1, cost: 2, description: '相手の手札を捨てる' },
    REVIVE: { id: 'revive', name: '復活', emoji: '👼', type: 'special', reviveHP: 30, cost: 5, description: 'HP0から復活' },
    REFLECT: { id: 'reflect', name: '反射', emoji: '🪞', type: 'special', reflectNext: true, cost: 3, description: '次の攻撃を反射' },
    POISON: { id: 'poison', name: '毒', emoji: '☠️', type: 'special', poisonDamage: 5, cost: 2, duration: 3, description: '3ターン毒ダメージ' }
  },

  // マッチング設定
  MATCHING: {
    SEARCH_TIMEOUT: 30, // マッチング待機時間（秒）
    MIN_PLAYERS: 2
  },

  // 勝敗判定
  WIN_CONDITION: {
    OPPONENT_HP_ZERO: 'opponent_defeated',
    TIMEOUT: 'timeout'
  }
};
