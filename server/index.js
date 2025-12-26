const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { GameMatch } = require('./game-logic');
const CONFIG = require('./game-config');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ミドルウェア
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// グローバル状態管理
const gameMatches = new Map(); // matchId -> GameMatch
const playerSessions = new Map(); // playerId -> { matchId, socketId, nickname }
const waitingQueue = []; // マッチング待ちプレイヤー { playerId, socketId, keyword }

// ═══════════════════════════════════════════════════════════════
// Socket.io イベントハンドラ
// ═══════════════════════════════════════════════════════════════

io.on('connection', (socket) => {
  console.log(`✨ プレイヤー接続: ${socket.id}`);

  /**
   * プレイヤーがゲームに参加
   */
  socket.on('join_game', (data) => {
    const playerId = uuidv4();
    const { nickname = 'Player ' + playerId.slice(0, 4) } = data;

    // セッション登録
    playerSessions.set(playerId, {
      socketId: socket.id,
      nickname,
      matchId: null
    });

    socket.playerId = playerId;

    console.log(`📝 プレイヤー登録: ${nickname} (${playerId})`);
    socket.emit('join_success', {
      playerId,
      nickname
    });

    // ロビー更新
    broadcastLobbyUpdate();
  });

  /**
   * クイックマッチ検索
   */
  socket.on('search_match', (data = {}) => {
    const playerId = socket.playerId;
    if (!playerId) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    const session = playerSessions.get(playerId);
    const keyword = (data.keyword || '').trim().toLowerCase() || 'any';

    console.log(`🔍 マッチング検索: ${session.nickname} keyword=${keyword}, 待ち人数=${waitingQueue.length}`);

    // マッチング相手探索の優先順位:
    // 1) 完全一致
    // 2) 片方が any (自分か相手)
    let opponentIndex = waitingQueue.findIndex(p => p.keyword === keyword);
    if (opponentIndex === -1 && keyword !== 'any') {
      // 相手が any の場合
      opponentIndex = waitingQueue.findIndex(p => p.keyword === 'any');
    }
    if (opponentIndex === -1 && keyword === 'any') {
      // 自分が any の場合、キューの先頭（何でもいい）
      opponentIndex = waitingQueue.length > 0 ? 0 : -1;
    }

    if (opponentIndex !== -1) {
      const opponent = waitingQueue.splice(opponentIndex, 1)[0];
      console.log(`✅ マッチング成立: ${session.nickname} ⇄ ${playerSessions.get(opponent.playerId).nickname}`);
      startMatch(playerId, opponent.playerId);
    } else {
      // キューに追加
      waitingQueue.push({ playerId, socketId: socket.id, keyword });
      console.log(`⏳ キューに追加: ${session.nickname} (keyword=${keyword})`);
      socket.emit('search_status', { status: 'searching', message: `待機中... (キーワード: ${keyword})` });
    }

    broadcastLobbyUpdate();
  });

  /**
   * マッチング検索キャンセル
   */
  socket.on('cancel_search', () => {
    const playerId = socket.playerId;
    const index = waitingQueue.findIndex(p => p.playerId === playerId);
    if (index !== -1) {
      waitingQueue.splice(index, 1);
      socket.emit('search_cancelled', { message: 'マッチング検索をキャンセルしました' });
    }
    broadcastLobbyUpdate();
  });

  /**
   * カード使用
   */
  socket.on('play_card', (data) => {
    const playerId = socket.playerId;
    const { cardId } = data;

    const session = playerSessions.get(playerId);
    if (!session?.matchId) {
      socket.emit('error', { message: 'Not in a match' });
      return;
    }

    const match = gameMatches.get(session.matchId);
    if (!match || match.currentTurnPlayerId !== playerId) {
      socket.emit('error', { message: 'Not your turn' });
      return;
    }

    // ゲームロジック実行
    const result = match.playCard(playerId, cardId);

    if (result.success) {
      // 攻撃カードの場合、相手に防御カード選択を要求
      if (result.cardType === 'attack' && result.damage > 0) {
        const opponentId = match.getOpponentId(playerId);
        const opponentSocket = Array.from(io.sockets.sockets.values())
          .find(s => s.playerId === opponentId);
        
        if (opponentSocket) {
          // 相手に防御選択を要求
          opponentSocket.emit('request_defend', {
            attackDamage: result.damage,
            attackId: Date.now(),
            attacker: session.nickname
          });
          
          // 攻撃者側にも待機状態を通知
          socket.emit('waiting_for_defense', {
            message: '相手が防御を選択中...'
          });
        }
      } else {
        // 攻撃以外のカードは即座にゲーム状態を更新
        const gameState = match.getGameState();
        io.to(session.matchId).emit('game_state_update', gameState);

        // ゲーム終了判定
        if (match.gameStatus === 'ended') {
          endMatch(session.matchId, match.winner);
        } else {
          // ターン切り替え
          const turnDelay = 1500;
          setTimeout(() => {
            match.switchTurn();
            const updatedState = match.getGameState();
            io.to(session.matchId).emit('game_state_update', updatedState);
          }, turnDelay);
        }
      }
    } else {
      socket.emit('error', { message: result.error });
    }
  });

  /**
   * 防御カード選択
   */
  socket.on('defend_card_selected', (data) => {
    const playerId = socket.playerId;
    const { defendCardId, attackId } = data;

    const session = playerSessions.get(playerId);
    if (!session?.matchId) return;

    const match = gameMatches.get(session.matchId);
    if (!match) return;

    // 攻撃を解決
    const result = match.resolveAttackWithDefense(playerId, defendCardId);

    if (result.success) {
      // ゲーム状態を更新
      const gameState = match.getGameState();
      io.to(session.matchId).emit('game_state_update', gameState);

      // ゲーム終了判定
      if (match.gameStatus === 'ended') {
        endMatch(session.matchId, match.winner);
      } else {
        // ターン切り替え
        const turnDelay = 2000;
        setTimeout(() => {
          match.switchTurn();
          const updatedState = match.getGameState();
          io.to(session.matchId).emit('game_state_update', updatedState);
        }, turnDelay);
      }
    }
  });

  /**
   * タイムアップ（ターン時間切れ）
   */
  socket.on('turn_timeout', () => {
    const playerId = socket.playerId;
    const session = playerSessions.get(playerId);

    if (!session?.matchId) return;

    const match = gameMatches.get(session.matchId);
    if (match && match.currentTurnPlayerId === playerId) {
      match.switchTurn();
      const gameState = match.getGameState();
      io.to(session.matchId).emit('game_state_update', gameState);
      io.to(session.matchId).emit('notification', {
        message: `${session.nickname}の時間が切れました`,
        type: 'timeout'
      });
    }
  });

  /**
   * ゲーム状態リクエスト
   */
  socket.on('request_game_state', () => {
    const playerId = socket.playerId;
    const session = playerSessions.get(playerId);

    if (session?.matchId) {
      const match = gameMatches.get(session.matchId);
      if (match) {
        socket.emit('game_state_update', match.getGameState());
      }
    }
  });

  /**
   * 接続切断
   */
  socket.on('disconnect', () => {
    const playerId = socket.playerId;
    if (playerId) {
      const session = playerSessions.get(playerId);
      console.log(`❌ プレイヤー切断: ${session?.nickname || playerId}`);

      // マッチング待機キューから削除
      const queueIndex = waitingQueue.findIndex(p => p.playerId === playerId);
      if (queueIndex !== -1) {
        waitingQueue.splice(queueIndex, 1);
      }

      // マッチ中の場合は相手に通知
      if (session?.matchId) {
        io.to(session.matchId).emit('opponent_disconnected', {
          message: '相手プレイヤーが切断しました'
        });
      }

      playerSessions.delete(playerId);
      broadcastLobbyUpdate();
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// ヘルパー関数
// ═══════════════════════════════════════════════════════════════

/**
 * マッチ開始
 */
function startMatch(player1Id, player2Id) {
  const matchId = uuidv4();
  const match = new GameMatch(matchId, player1Id, player2Id);

  gameMatches.set(matchId, match);

  // セッション更新
  playerSessions.get(player1Id).matchId = matchId;
  playerSessions.get(player2Id).matchId = matchId;

  // ルーム参加
  const socket1 = io.sockets.sockets.get(playerSessions.get(player1Id).socketId);
  const socket2 = io.sockets.sockets.get(playerSessions.get(player2Id).socketId);

  socket1?.join(matchId);
  socket2?.join(matchId);

  console.log(`🎮 マッチ開始: ${matchId}`);

  // ゲーム状態を送信
  const gameState = match.getGameState();
  io.to(matchId).emit('match_started', {
    matchId,
    gameState,
    players: [
      { id: player1Id, nickname: playerSessions.get(player1Id).nickname, role: 'player1' },
      { id: player2Id, nickname: playerSessions.get(player2Id).nickname, role: 'player2' }
    ]
  });
}

/**
 * マッチ終了
 */
function endMatch(matchId, winnerId) {
  const match = gameMatches.get(matchId);
  if (!match) return;

  const loser = Object.keys(match.players).find(id => id !== winnerId);
  const winnerSession = playerSessions.get(winnerId);
  const loserSession = playerSessions.get(loser);

  console.log(`🏆 マッチ終了: ${winnerSession.nickname} 勝利`);

  io.to(matchId).emit('match_ended', {
    winner: {
      id: winnerId,
      nickname: winnerSession.nickname
    },
    loser: {
      id: loser,
      nickname: loserSession.nickname
    },
    gameState: match.getGameState()
  });

  // クリーンアップ
  gameMatches.delete(matchId);
  playerSessions.get(winnerId).matchId = null;
  playerSessions.get(loser).matchId = null;

  broadcastLobbyUpdate();
}

/**
 * ロビー情報をブロードキャスト
 */
function broadcastLobbyUpdate() {
  const activePlayers = Array.from(playerSessions.entries())
    .filter(([, session]) => !session.matchId)
    .map(([id, session]) => ({
      id,
      nickname: session.nickname,
      status: waitingQueue.some(p => p.playerId === id) ? 'searching' : 'idle'
    }));

  const keywords = waitingQueue.map(p => p.keyword);

  io.emit('lobby_update', {
    activePlayers,
    waitingCount: waitingQueue.length,
    keywords
  });
}

// ═══════════════════════════════════════════════════════════════
// ルート
// ═══════════════════════════════════════════════════════════════

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ═══════════════════════════════════════════════════════════════
// サーバー起動
// ═══════════════════════════════════════════════════════════════

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🚀 Dog Field - バトルゲーム サーバー起動`);
  console.log(`   ポート: ${PORT}`);
  console.log(`   URL: http://localhost:${PORT}`);
  console.log(`\n📊 ゲーム設定:`);
  console.log(`   初期HP: ${CONFIG.PLAYER.INITIAL_HP}`);
  console.log(`   初期手札: ${CONFIG.PLAYER.INITIAL_HAND_SIZE}枚`);
  console.log(`   ターン時間: ${CONFIG.TURN.TIME_LIMIT}秒\n`);
});

module.exports = { app, io, gameMatches, playerSessions };
