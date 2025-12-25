// クライアント側ゲーム設定
const CLIENT_CONFIG = {
  // カード定義（サーバー側と同期する必要あり）
  CARDS: {
    // 攻撃系
    atk_light: { name: '軽撃', emoji: '⚔️', type: 'attack', damage: 10, cost: 1 },
    atk_medium: { name: '中撃', emoji: '🗡️', type: 'attack', damage: 15, cost: 2 },
    atk_heavy: { name: '重撃', emoji: '🪓', type: 'attack', damage: 20, cost: 3 },

    // 防御系
    def_light: { name: '軽防', emoji: '🛡️', type: 'defend', mitigation: 5, cost: 1 },
    def_heavy: { name: '強防', emoji: '🏰', type: 'defend', mitigation: 12, cost: 2 },

    // 回復系
    heal_small: { name: '小回復', emoji: '💚', type: 'heal', recovery: 15, cost: 2 },
    heal_medium: { name: '中回復', emoji: '💖', type: 'heal', recovery: 25, cost: 3 },

    // 特殊系
    draw_extra: { name: '増幅', emoji: '🔄', type: 'draw', drawCount: 2, cost: 2 }
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
  draw: '#f9ca24'       // 黄系
};

// Socket.io 接続設定
const SOCKET_CONFIG = {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
};
