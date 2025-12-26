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
      start: document.getElementById('start-screen'),
      matching: document.getElementById('matching-screen'),
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
    // スタート画面
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.startMatchFlow();
      });
    }
    
    // マッチング待機画面
    document.getElementById('cancel-matching-btn').addEventListener('click', () => this.cancelMatching());
    // スタート待機インジケーターのキャンセル
    const startCancelBtn = document.getElementById('start-cancel-btn');
    if (startCancelBtn) {
      startCancelBtn.addEventListener('click', () => this.cancelMatching());
    }
    
    // ゲーム画面
    document.getElementById('surrender-btn').addEventListener('click', () => this.surrender());
    
    // ゲーム終了画面
    document.getElementById('return-to-lobby-btn').addEventListener('click', () => this.returnToHome());

    // ニックネーム入力でEnter
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
      
    });

    // ゲーム参加成功
    this.socket.on('join_success', (data) => {
      this.playerId = data.playerId;
      this.nickname = data.nickname;
      

       // スタート要求が残っていれば即マッチング待機画面へ
       if (this.startRequested) {
         this.searchMatchAndShowWaiting(this.pendingKeyword);
         this.startRequested = false;
       }
    });

    // ロビー更新
    this.socket.on('lobby_update', (data) => {
      // マッチング待機画面では表示しない
    });

    // マッチング検索状態
    this.socket.on('search_status', (data) => {
      if (this.screens.matching.classList.contains('active')) {
        this.updateMatchingStatus(data.message);
      } else {
        const el = document.getElementById('start-waiting-status');
        if (el) el.textContent = data.message;
      }
    });

    // マッチング検索キャンセル
    this.socket.on('search_cancelled', () => {
      this.setSearchingUI(false);
      this.hideStartWaiting();
    });

    // マッチ開始
    this.socket.on('match_started', (data) => {
      this.matchId = data.matchId;
      this.gameState = data.gameState;

      // プレイヤー情報を確認
      const self = data.players.find(p => p.id === this.playerId);
      this.playerRole = self.role;

      // 待機表示をクリアし、ゲーム画面を表示
      this.hideStartWaiting();
      this.showScreen('game');
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
      
      alert('エラー: ' + data.message);
    });

    // 通知
    this.socket.on('notification', (data) => {
      this.showNotification(data.message);
    });

    // 切断
    this.socket.on('disconnect', () => {
      
    });
  }

  /**
   * ロビーゲーム画面表示
   */
  showLobbyGame() {
    // 不要（マッチング待機画面に置き換え）
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
    const keyword = (keywordArg !== undefined ? keywordArg : keywordInput.value || '').trim().slice(0, 20);
    if (keyword) {
      localStorage.setItem('df_keyword', keyword);
    } else {
      localStorage.removeItem('df_keyword');
    }
    this.pendingKeyword = keyword;
    this.socket.emit('search_match', { keyword });
  }

  /**
   * マッチング検索キャンセル
   */
  cancelMatching() {
    this.socket.emit('cancel_search');
    this.showScreen('start');
  }

  /**
   * スタートフロー: ニックネーム＋キーワードで join → search → マッチング待機画面へ
   */
  startMatchFlow() {
    console.log('📝 startMatchFlow() 呼び出し');
    
    const nicknameInput = document.getElementById('nickname-input');
    const nickname = nicknameInput.value.trim() || 'Player';
    const keywordInput = document.getElementById('keyword-input');
    const keyword = (keywordInput.value || '').trim().slice(0, 20);

    console.log('入力:', { nickname, keyword, playerId: this.playerId });

    if (nickname.length > 20) {
      alert('ニックネームは20文字以内です');
      return;
    }

    if (!nickname) {
      alert('ニックネームを入力してください');
      return;
    }

    this.pendingKeyword = keyword;
    this.pendingNickname = nickname;

    if (!this.playerId) {
      console.log('未参加状態 → 待機インジケーター表示 + join_game 送信');
      // 未参加なら、まず待機画面を表示（UX向上）
      this.showStartWaiting(keyword);
      this.startRequested = true;
      // ニックネームを保存して join_game を送信
      this.socket.emit('join_game', { nickname });
      return;
    }

    console.log('既参加状態 → マッチング待機画面へ移動');
    // 既に参加済み → 検索＋マッチング待機画面へ
    this.searchMatchAndShowWaiting(keyword);
  }

  /**
   * マッチング検索して待機画面を表示
   */
  searchMatchAndShowWaiting(keyword) {
    // キーワードを小文字化・正規化
    const normalizedKeyword = (keyword || '').trim().toLowerCase() || 'any';
    const displayKeyword = normalizedKeyword === 'any' ? 'any' : normalizedKeyword;
    
    // スタート待機インジケーターを隠す
    this.hideStartWaiting();
    
    // マッチング待機画面を表示
    this.showScreen('matching');
    
    // マッチング画面を更新
    document.getElementById('matching-keyword-display').innerHTML = `合言葉: <strong>${displayKeyword}</strong>`;
    document.getElementById('matching-status').textContent = '対手を探しています...';
    
    // キーワードを保存
    if (normalizedKeyword !== 'any') {
      localStorage.setItem('df_keyword', normalizedKeyword);
    }
    
    // サーバーに正規化されたキーワードで検索を開始
    this.socket.emit('search_match', { keyword: normalizedKeyword });
  }

  /**
   * スタート画面の待機インジケーター表示
   */
  showStartWaiting(keyword) {
    console.log('⏳ showStartWaiting() 呼び出し, keyword:', keyword);
    const el = document.getElementById('start-waiting');
    if (!el) {
      console.error('❌ #start-waiting 要素が見つかりません');
      return;
    }
    console.log('✅ #start-waiting 要素見つかり、表示');
    const displayKeyword = keyword || 'any';
    document.getElementById('start-waiting-keyword').innerHTML = `合言葉: <strong>${displayKeyword}</strong>`;
    document.getElementById('start-waiting-status').textContent = '対手を探しています';
    el.style.display = 'block';
    document.getElementById('nickname-input').disabled = true;
    document.getElementById('keyword-input').disabled = true;
    document.getElementById('start-btn').disabled = true;
  }

  hideStartWaiting() {
    console.log('⏹ hideStartWaiting() 呼び出し');
    const el = document.getElementById('start-waiting');
    if (!el) return;
    el.style.display = 'none';
    document.getElementById('nickname-input').disabled = false;
    document.getElementById('keyword-input').disabled = false;
    document.getElementById('start-btn').disabled = false;
  }

  setSearchingUI(isSearching, keyword = '', message = '') {
    const startBtn = document.getElementById('start-btn');
    const nicknameInput = document.getElementById('nickname-input');
    const keywordInput = document.getElementById('keyword-input');

    if (isSearching) {
      startBtn.disabled = true;
      nicknameInput.disabled = true;
      keywordInput.disabled = true;
    } else {
      startBtn.disabled = false;
      nicknameInput.disabled = false;
      keywordInput.disabled = false;
    }
  }

  /**
   * マッチング待機画面のステータス更新
   */
  updateMatchingStatus(message) {
    document.getElementById('matching-status').textContent = message || '対手を探しています';
  }

  /**
   * ゲーム開始
   */
  startGame(data) {
    

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

    // UI切り替え: ゲーム画面を隠す、終了画面を表示
    this.showScreen('gameOver');
  }

  /**
   * ホームに戻る
   */
  returnToHome() {
    // UI切り替え: 終了画面を隠す、スタート画面を表示
    this.showScreen('start');
    
    // ゲーム状態をリセット
    this.gameState = null;
    this.matchId = null;
    this.playerRole = null;
    
    clearInterval(this.turnTimer);

    // スタート画面の入力をクリア
    document.getElementById('nickname-input').value = '';
    // キーワードは保持
    this.hideStartWaiting();
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
    // 全スクリーンを非表示
    Object.values(this.screens).forEach(screen => {
      if (screen) screen.classList.remove('active');
    });
    
    // 指定スクリーンのみ表示
    if (this.screens[screenName]) {
      this.screens[screenName].classList.add('active');
    }
  }

  hideScreen(screenName) {
    if (this.screens[screenName]) {
      this.screens[screenName].classList.remove('active');
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
}

// ゲーム開始
window.addEventListener('DOMContentLoaded', () => {
  window.gameClient = new GameClient();
  console.log('🚀 Dog Field - ゲームクライアント起動完了');
  
  // デバッグ用: ボタンが実際に存在するか確認
  const startBtn = document.getElementById('start-btn');
  console.log('🔘 start-btn 要素:', startBtn ? '見つかった' : '見つからない');
});
