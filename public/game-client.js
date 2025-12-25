class GameClient {
  constructor() {
    // Socket.io 接続
    this.socket = io(SOCKET_CONFIG);
    
    // ゲーム状態
    this.gameState = null;
    this.playerId = null;
    this.nickname = null;
    this.matchId = null;
    this.playerRole = null; // 'player1' or 'player2'
    
    // UI要素
    this.screens = {
      lobby: document.getElementById('lobby-screen'),
      game: document.getElementById('game-screen'),
      gameOver: document.getElementById('game-over-screen')
    };

    this.turnTimer = null;
    this.startRequested = false;
    this.pendingKeyword = '';

    this.init();
  }

  /**
   * 初期化
   */
  init() {
    this.setupEventListeners();
    this.setupSocketListeners();
  }

  /**
   * イベントリスナー設定
   */
  setupEventListeners() {
    // ロビー画面
    document.getElementById('start-btn').addEventListener('click', () => this.startMatchFlow());
    document.getElementById('cancel-search-btn').addEventListener('click', () => this.cancelSearch());
    
    // ゲーム画面
    document.getElementById('surrender-btn').addEventListener('click', () => this.surrender());
    
    // ゲーム終了画面
    document.getElementById('return-to-lobby-btn').addEventListener('click', () => this.returnToLobby());

    // ニックネーム入力
    document.getElementById('nickname-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.startMatchFlow();
    });

    // 前回のキーワードを復元
    const savedKeyword = localStorage.getItem('df_keyword');
    if (savedKeyword) {
      document.getElementById('keyword-input').value = savedKeyword;
    }
  }

  /**
   * Socket.io リスナー設定
   */
  setupSocketListeners() {
    // 接続
    this.socket.on('connect', () => {
      console.log('✅ Socket.io 接続確立');
    });

    // ゲーム参加成功
    this.socket.on('join_success', (data) => {
      this.playerId = data.playerId;
      this.nickname = data.nickname;
      console.log(`✅ ゲーム参加: ${this.nickname}`);
      this.showLobbyGame();

       // スタート要求が残っていれば即検索
       if (this.startRequested) {
         this.searchMatch(this.pendingKeyword);
         this.startRequested = false;
       }
    });

    // ロビー更新
    this.socket.on('lobby_update', (data) => {
      this.updateLobbyPlayers(data.activePlayers);
      document.getElementById('search-status').textContent = `待機中 (${data.waitingCount}人)`;
      this.updateWaitingKeywords(data.keywords || []);
    });

    // マッチング検索状態
    this.socket.on('search_status', (data) => {
      this.setSearchingUI(true, this.pendingKeyword, data.message);
    });

    // マッチング検索キャンセル
    this.socket.on('search_cancelled', () => {
      this.setSearchingUI(false);
    });

    // マッチ開始
    this.socket.on('match_started', (data) => {
      this.matchId = data.matchId;
      this.gameState = data.gameState;

      // プレイヤー情報を確認
      const self = data.players.find(p => p.id === this.playerId);
      this.playerRole = self.role;

      this.startGame(data);
    });

    // ゲーム状態更新
    this.socket.on('game_state_update', (state) => {
      this.gameState = state;
      this.updateGameUI();
    });

    // ゲーム終了
    this.socket.on('match_ended', (data) => {
      this.endGame(data);
    });

    // 相手切断
    this.socket.on('opponent_disconnected', (data) => {
      alert(data.message);
      this.returnToLobby();
    });

    // エラー
    this.socket.on('error', (data) => {
      console.error('❌ エラー:', data.message);
      alert('エラー: ' + data.message);
    });

    // 通知
    this.socket.on('notification', (data) => {
      this.showNotification(data.message);
    });

    // 切断
    this.socket.on('disconnect', () => {
      console.log('❌ Socket.io 切断');
    });
  }

  /**
   * ロビーゲーム画面表示
   */
  showLobbyGame() {
    document.getElementById('players-section').style.display = 'block';
  }

  /**
   * プレイヤーリスト更新
   */
  updateLobbyPlayers(players) {
    const list = document.getElementById('players-list');
    if (players.length === 0) {
      list.innerHTML = '<p>プレイヤーがいません</p>';
      return;
    }

    list.innerHTML = players.map(p => `
      <div class="player-item">
        <span class="player-name">${p.nickname}</span>
        <span class="player-status ${p.status}">${p.status === 'searching' ? '検索中' : 'オンライン'}</span>
      </div>
    `).join('');
  }

  /**
   * マッチング検索
   */
  searchMatch(keywordArg) {
    const keywordInput = document.getElementById('keyword-input');
    const keyword = (keywordArg ?? keywordInput.value || '').trim().slice(0, 20);
    if (keyword) {
      localStorage.setItem('df_keyword', keyword);
    } else {
      localStorage.removeItem('df_keyword');
    }
    this.pendingKeyword = keyword;
    this.setSearchingUI(true, keyword);
    this.socket.emit('search_match', { keyword });
  }

  /**
   * マッチング検索キャンセル
   */
  cancelSearch() {
    this.socket.emit('cancel_search');
    this.setSearchingUI(false);
  }

  /**
   * スタートフロー: ニックネーム＋キーワードで join → search
   */
  startMatchFlow() {
    const nicknameInput = document.getElementById('nickname-input');
    const nickname = nicknameInput.value.trim() || 'Player';
    const keywordInput = document.getElementById('keyword-input');
    const keyword = (keywordInput.value || '').trim().slice(0, 20);

    if (nickname.length > 20) {
      alert('ニックネームは20文字以内です');
      return;
    }

    this.pendingKeyword = keyword;

    if (!this.playerId) {
      this.startRequested = true;
      this.socket.emit('join_game', { nickname });
      return;
    }

    // 既に参加済みなら即検索
    this.searchMatch(keyword);
  }

  setSearchingUI(isSearching, keyword = '', message = '') {
    const startBtn = document.getElementById('start-btn');
    const cancelBtn = document.getElementById('cancel-search-btn');
    const status = document.getElementById('search-status');
    const nicknameInput = document.getElementById('nickname-input');
    const keywordInput = document.getElementById('keyword-input');

    if (isSearching) {
      startBtn.disabled = true;
      cancelBtn.style.display = 'inline-flex';
      status.textContent = message || `キーワード: ${keyword || 'any'} で検索中...`;
      nicknameInput.disabled = true;
      keywordInput.disabled = true;
    } else {
      startBtn.disabled = false;
      cancelBtn.style.display = 'none';
      status.textContent = '待機中...';
      nicknameInput.disabled = false;
      keywordInput.disabled = false;
    }
  }

  /**
   * 待機中キーワード表示
   */
  updateWaitingKeywords(keywords) {
    const box = document.getElementById('waiting-keywords');
    if (!keywords || keywords.length === 0) {
      box.textContent = '待機中のキーワードはありません';
      return;
    }

    // 集計
    const counts = keywords.reduce((acc, k) => {
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} (${v})`)
      .join(' / ');

    box.textContent = `待機キーワード: ${sorted}`;
  }

  /**
   * ゲーム開始
   */
  startGame(data) {
    console.log('🎮 ゲーム開始:', data);

    // UI切り替え
    this.hideScreen('lobby');
    this.showScreen('game');

    // プレイヤー情報設定
    const opponent = data.players.find(p => p.id !== this.playerId);
    document.getElementById('player-name').textContent = data.players.find(p => p.id === this.playerId).nickname;
    document.getElementById('opponent-name').textContent = opponent.nickname;

    // 初期UI更新
    this.updateGameUI();
    
    // ターンタイマー開始
    this.startTurnTimer();
  }

  /**
   * ゲームUI更新
   */
  updateGameUI() {
    const state = this.gameState;
    if (!state) return;

    // プレイヤー情報
    const player = state.players.find(p => p.role === this.playerRole);
    const opponent = state.players.find(p => p.role !== this.playerRole);

    if (player) {
      const hpPercent = (player.hp / player.maxHP) * 100;
      document.getElementById('player-hp-fill').style.width = hpPercent + '%';
      document.getElementById('player-hp-text').textContent = `${player.hp}/${player.maxHP}`;

      if (player.defense > 0) {
        document.getElementById('defense-indicator').style.display = 'block';
        document.getElementById('defense-value').textContent = player.defense;
      } else {
        document.getElementById('defense-indicator').style.display = 'none';
      }
    }

    if (opponent) {
      const oppHpPercent = (opponent.hp / opponent.maxHP) * 100;
      document.getElementById('opponent-hp-fill').style.width = oppHpPercent + '%';
      document.getElementById('opponent-hp-text').textContent = `${opponent.hp}/${opponent.maxHP}`;
      document.getElementById('opponent-hand-size').textContent = opponent.handSize;
    }

    // ターン情報
    const isMyTurn = state.currentTurnPlayerId === this.playerId;
    const myPlayer = state.players.find(p => p.role === this.playerRole);

    if (isMyTurn) {
      document.getElementById('turn-indicator').textContent = '🎬 あなたのターン';
      document.getElementById('turn-indicator').style.color = '#ff6b6b';
    } else {
      document.getElementById('turn-indicator').textContent = '⏳ 相手のターン';
      document.getElementById('turn-indicator').style.color = '#666';
    }

    // タイマー更新
    document.getElementById('turn-timer-display').textContent = state.timeRemaining + '秒';

    // アクションログ更新
    this.updateActionLog(state.actionLog);

    // 手札表示（自分のターンの場合のみ）
    if (isMyTurn) {
      this.displayHand(myPlayer);
    } else {
      document.getElementById('hand-cards').innerHTML = '';
    }
  }

  /**
   * 手札表示
   */
  displayHand(player) {
    const handContainer = document.getElementById('hand-cards');
    const playerData = this.gameState.players.find(p => p.role === this.playerRole);

     if (!playerData || !playerData.hand || playerData.hand.length === 0) {
       handContainer.innerHTML = '<p style="text-align: center; color: #999;">カードを引いています...</p>';
       return;
     }

     handContainer.innerHTML = playerData.hand.map(card => `
       <div class="card-item" data-card-id="${card.id}" style="background-color: ${CARD_COLORS[card.type]};">
         <div class="card-emoji">${card.emoji}</div>
         <div class="card-name">${card.name}</div>
         <div class="card-cost">⚙️ ${card.cost}</div>
         <button class="card-btn" onclick="window.gameClient.playCardFromUI('${card.id}')">使用</button>
       </div>
     `).join('');
  }

  /**
   * アクションログ更新
   */
  updateActionLog(logs) {
    const logContainer = document.getElementById('action-log-content');
    
    const logHTML = logs.map(log => {
      const time = new Date(log.timestamp).toLocaleTimeString('ja-JP');
      
      let actionText = '';
      switch (log.action) {
        case 'attack':
          actionText = `<strong>${log.cardName}</strong> でダメージ${log.damage} (敵HP: ${log.targetHP})`;
          break;
        case 'defend':
          actionText = `<strong>${log.cardName}</strong> で防御+${log.defense}`;
          break;
        case 'heal':
          actionText = `<strong>${log.cardName}</strong> で${log.recovery}回復 (自身HP: ${log.currentHP})`;
          break;
        case 'draw':
          actionText = `<strong>${log.cardName}</strong> を使用 (+${log.cardsDrawn}カード)`;
          break;
      }

      return `<div class="log-entry">[${time}] ${actionText}</div>`;
    }).join('');

    logContainer.innerHTML = logHTML || '<p>試合開始...</p>';
  }

  /**
   * ターンタイマー開始
   */
  startTurnTimer() {
    if (this.turnTimer) clearInterval(this.turnTimer);

    this.turnTimer = setInterval(() => {
      const timeRemaining = this.gameState?.timeRemaining || 0;
      
      if (timeRemaining <= 0) {
        clearInterval(this.turnTimer);
        if (this.gameState.currentTurnPlayerId === this.playerId) {
          this.socket.emit('turn_timeout');
        }
      }
    }, 1000);
  }

  /**
   * 降参
   */
  surrender() {
    if (confirm('本当に降参しますか？')) {
      // 相手のHP=0に設定してゲーム終了
      alert('降参しました');
      this.returnToLobby();
    }
  }

  /**
   * ゲーム終了
   */
  endGame(data) {
    console.log('🏆 ゲーム終了:', data);

    clearInterval(this.turnTimer);

    const isWinner = data.winner.id === this.playerId;
    const title = isWinner ? '🎉 勝利！' : '😔 敗北';

    document.getElementById('game-over-title').textContent = title;
    document.getElementById('result-details').innerHTML = `
      <p><strong>勝者:</strong> ${data.winner.nickname}</p>
      <p><strong>敗者:</strong> ${data.loser.nickname}</p>
      <p><strong>最終HP:</strong></p>
      <ul>
        <li>${data.winner.nickname}: ${data.gameState.players.find(p => p.id === data.winner.id).hp}/${data.gameState.players[0].maxHP}</li>
        <li>${data.loser.nickname}: ${data.gameState.players.find(p => p.id === data.loser.id).hp}/${data.gameState.players[0].maxHP}</li>
      </ul>
    `;

    this.hideScreen('game');
    this.showScreen('gameOver');
  }

  /**
   * ロビーに戻る
   */
  returnToLobby() {
    this.hideScreen('game');
    this.hideScreen('gameOver');
    this.showScreen('lobby');
    
    this.gameState = null;
    this.matchId = null;
    
    clearInterval(this.turnTimer);

    // ロビー状態リセット
    document.getElementById('search-btn').style.display = 'block';
    document.getElementById('cancel-search-btn').style.display = 'none';
    document.getElementById('search-status').textContent = '待機中...';
  }

  /**
   * 通知表示
   */
  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
  }

  /**
   * スクリーン表示/非表示
   */
  showScreen(screenName) {
    if (this.screens[screenName]) {
      this.screens[screenName].classList.add('active');
    }
  }

  hideScreen(screenName) {
    if (this.screens[screenName]) {
      this.screens[screenName].classList.remove('active');
    }
  }
}

  /**
   * UI からカードをプレイ
   */
  playCardFromUI(cardId) {
    if (this.gameState.currentTurnPlayerId !== this.playerId) {
      alert('あなたのターンではありません');
      return;
    }
    this.socket.emit('play_card', { cardId });
  }

// ゲーム開始
window.addEventListener('DOMContentLoaded', () => {
  window.gameClient = new GameClient();
  console.log('🚀 Dog Field - ゲームクライアント起動');
});
