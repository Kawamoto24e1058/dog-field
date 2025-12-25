const { v4: uuidv4 } = require('uuid');
const CONFIG = require('./game-config');

/**
 * ゲームマッチ管理クラス
 */
class GameMatch {
  constructor(matchId, player1Id, player2Id) {
    this.matchId = matchId;
    this.players = {
      [player1Id]: new GamePlayer(player1Id, 'player1'),
      [player2Id]: new GamePlayer(player2Id, 'player2')
    };
    
    this.currentTurnPlayerId = player1Id;
    this.turnPhase = 'draw'; // draw -> action -> end
    this.turnStartTime = Date.now();
    this.gameStatus = 'playing'; // playing, ended
    this.winner = null;

    this.actionLog = [];
  }

  /**
   * プレイヤーのHP取得
   */
  getPlayerHP(playerId) {
    return this.players[playerId]?.hp || 0;
  }

  /**
   * ターン切り替え
   */
  switchTurn() {
    const playerIds = Object.keys(this.players);
    const currentIndex = playerIds.indexOf(this.currentTurnPlayerId);
    this.currentTurnPlayerId = playerIds[(currentIndex + 1) % 2];
    this.turnPhase = 'draw';
    this.turnStartTime = Date.now();
  }

  /**
   * カードの使用
   */
  playCard(playerId, cardId) {
    const player = this.players[playerId];
    const opponent = this.getOpponent(playerId);

    if (!player || !opponent) return { success: false, error: 'Player not found' };
    if (player.handCards.length === 0) return { success: false, error: 'No cards in hand' };

    // カードを手札から探す
    const cardIndex = player.handCards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return { success: false, error: 'Card not in hand' };

    const card = player.handCards[cardIndex];

    // ダメージ計算＆適用
    let damage = 0;
    let recovery = 0;
    let defense = 0;

    switch (card.type) {
      case 'attack':
        damage = card.damage;
        opponent.takeDamage(damage);
        this.actionLog.push({
          timestamp: Date.now(),
          playerId,
          action: 'attack',
          cardName: card.name,
          damage,
          targetHP: opponent.hp
        });
        break;

      case 'defend':
        player.setDefense(card.mitigation, card.duration);
        this.actionLog.push({
          timestamp: Date.now(),
          playerId,
          action: 'defend',
          cardName: card.name,
          defense: card.mitigation
        });
        break;

      case 'heal':
        recovery = card.recovery;
        player.heal(recovery);
        this.actionLog.push({
          timestamp: Date.now(),
          playerId,
          action: 'heal',
          cardName: card.name,
          recovery,
          currentHP: player.hp
        });
        break;

      case 'draw':
        const drawnCards = player.drawCards(card.drawCount);
        this.actionLog.push({
          timestamp: Date.now(),
          playerId,
          action: 'draw',
          cardName: card.name,
          cardsDrawn: drawnCards.length
        });
        break;
    }

    // 手札から削除
    player.handCards.splice(cardIndex, 1);
    this.turnPhase = 'end';

    // 勝敗判定
    if (opponent.hp <= 0) {
      this.gameStatus = 'ended';
      this.winner = playerId;
    }

    return {
      success: true,
      damage,
      recovery,
      defense,
      opponentHP: opponent.hp,
      playerHP: player.hp
    };
  }

  /**
   * 相手プレイヤーを取得
   */
  getOpponent(playerId) {
    const playerIds = Object.keys(this.players);
    return this.players[playerIds.find(id => id !== playerId)];
  }

  /**
   * ゲーム状態スナップショット
   */
  getGameState() {
    const playerIds = Object.keys(this.players);
    return {
      matchId: this.matchId,
      gameStatus: this.gameStatus,
      players: playerIds.map(id => ({
        id,
        role: this.players[id].role,
        hp: this.players[id].hp,
        maxHP: CONFIG.PLAYER.INITIAL_HP,
        handSize: this.players[id].handCards.length,
         hand: this.players[id].handCards.map(card => ({
           id: card.id,
           name: card.name,
           emoji: card.emoji,
           type: card.type,
           cost: card.cost,
           description: card.description
         })),
         defense: this.players[id].defense
      })),
      currentTurnPlayerId: this.currentTurnPlayerId,
      turnPhase: this.turnPhase,
      timeRemaining: Math.max(0, CONFIG.TURN.TIME_LIMIT - Math.floor((Date.now() - this.turnStartTime) / 1000)),
      actionLog: this.actionLog.slice(-10) // 最後の10アクション
    };
  }
}

/**
 * プレイヤークラス
 */
class GamePlayer {
  constructor(playerId, role) {
    this.id = playerId;
    this.role = role; // 'player1' or 'player2'
    this.hp = CONFIG.PLAYER.INITIAL_HP;
    this.defense = 0; // 防御力（ターンごとに減少）
    this.handCards = [];
    this.deckCards = this.initializeDeck();

    // 初期手札
    this.drawCards(CONFIG.PLAYER.INITIAL_HAND_SIZE);
  }

  /**
   * デッキ初期化（カード生成）
   */
  initializeDeck() {
    const deck = [];
    const cardTemplates = Object.values(CONFIG.CARDS);

    // 各カード種類を複数回デッキに追加（バランス調整）
    cardTemplates.forEach(template => {
      const count = template.cost <= 1 ? 4 : template.cost === 2 ? 3 : 2;
      for (let i = 0; i < count; i++) {
        deck.push({
          id: `${template.id}_${uuidv4()}`,
          ...template
        });
      }
    });

    // シャッフル
    return this.shuffle(deck);
  }

  /**
   * カードを引く
   */
  drawCards(count = 1) {
    const drawn = [];
    for (let i = 0; i < count && this.deckCards.length > 0; i++) {
      const card = this.deckCards.pop();
      this.handCards.push(card);
      drawn.push(card);

      // デッキ切れの場合は手札をシャッフルして戻す
      if (this.deckCards.length === 0 && this.handCards.length > 0) {
        this.deckCards = this.shuffle([...this.handCards]);
        this.handCards = [];
      }
    }
    return drawn;
  }

  /**
   * ダメージ受信
   */
  takeDamage(damage) {
    const mitigated = Math.max(0, damage - this.defense);
    this.hp = Math.max(0, this.hp - mitigated);
    this.defense = 0; // 防御力リセット
  }

  /**
   * 回復
   */
  heal(amount) {
    this.hp = Math.min(CONFIG.PLAYER.INITIAL_HP, this.hp + amount);
  }

  /**
   * 防御設定
   */
  setDefense(amount, duration) {
    this.defense = amount;
  }

  /**
   * シャッフル（Fisher-Yates）
   */
  shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

module.exports = { GameMatch, GamePlayer };
