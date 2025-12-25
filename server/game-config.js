// ゲーム仕様（バランス設定）
module.exports = {
  // プレイヤー設定
  PLAYER: {
    INITIAL_HP: 100,
    INITIAL_HAND_SIZE: 5,
    MAX_HAND_SIZE: 8
  },

  // ターン設定
  TURN: {
    TIME_LIMIT: 30, // 秒
    TURN_PHASES: ['draw', 'action', 'end']
  },

  // カードテンプレート（バランス調整）
  CARDS: {
    // 攻撃系（威力: 10-20）
    ATTACK_LIGHT: {
      id: 'atk_light',
      name: '軽撃',
      emoji: '⚔️',
      type: 'attack',
      damage: 10,
      cost: 1,
      description: '小ダメージ'
    },
    ATTACK_MEDIUM: {
      id: 'atk_medium',
      name: '中撃',
      emoji: '🗡️',
      type: 'attack',
      damage: 15,
      cost: 2,
      description: '中程度ダメージ'
    },
    ATTACK_HEAVY: {
      id: 'atk_heavy',
      name: '重撃',
      emoji: '🪓',
      type: 'attack',
      damage: 20,
      cost: 3,
      description: '大ダメージ（高コスト）'
    },

    // 防御系（軽減: 5-15）
    DEFEND_LIGHT: {
      id: 'def_light',
      name: '軽防',
      emoji: '🛡️',
      type: 'defend',
      mitigation: 5,
      cost: 1,
      duration: 1, // 1ターン有効
      description: 'ダメージ軽減'
    },
    DEFEND_HEAVY: {
      id: 'def_heavy',
      name: '強防',
      emoji: '🏰',
      type: 'defend',
      mitigation: 12,
      cost: 2,
      duration: 2,
      description: 'ダメージ大幅軽減'
    },

    // 回復系（回復: 15-30）
    HEAL_SMALL: {
      id: 'heal_small',
      name: '小回復',
      emoji: '💚',
      type: 'heal',
      recovery: 15,
      cost: 2,
      description: '小回復'
    },
    HEAL_MEDIUM: {
      id: 'heal_medium',
      name: '中回復',
      emoji: '💖',
      type: 'heal',
      recovery: 25,
      cost: 3,
      description: '中程度回復'
    },

    // 特殊系
    DRAW_EXTRA: {
      id: 'draw_extra',
      name: '増幅',
      emoji: '🔄',
      type: 'draw',
      drawCount: 2,
      cost: 2,
      description: '+2カード引く'
    }
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
