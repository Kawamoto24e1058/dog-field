# 🐕 Dog Field - ターン制オンライン対戦カードゲーム

ブラウザで遊べる、リアルタイムマルチプレイヤーのターン制カードバトルゲームです。

## 🎮 ゲーム概要

**Dog Field**は、2人のプレイヤーがオンラインで対戦し、カードを使用して相手のHPを0にすることを目指すターン制カードゲームです。

### コア機能

- **🔍 オンラインマッチング**: ロビーでプレイヤーを探し、クイックマッチで自動対戦
- **🎴 カードシステム**: 攻撃・防御・回復・ドロー等、8種類のカードタイプ
- **⏱️ ターン制管理**: 制限時間（30秒/ターン）付きの交代制ターンシステム
- **💻 リアルタイム同期**: Socket.io によるHP・手札・状態の双方向リアルタイム更新
- **📊 戦績管理**: Firebase でプレイヤー情報と試合履歴を管理

## 🛠️ 技術スタック

| レイヤー | テクノロジー | 説明 |
|---------|-------------|------|
| **フロントエンド** | HTML5 / CSS3 / Vanilla JS | シンプル・軽量・ブラウザ互換性重視 |
| **バックエンド** | Node.js / Express | REST + リアルタイムゲームロジック |
| **通信** | Socket.io | ターン管理・HP同期・マッチング |
| **データベース** | Firebase (Realtime DB) | プレイヤー情報・試合履歴保存 |

## 📋 プロジェクト構成

```
dog-field/
├── server/
│   ├── index.js                 # メインサーバー（Socket.io ハブ）
│   ├── game-logic.js            # ゲームロジック（GameMatch/GamePlayer）
│   ├── game-config.js           # ゲーム設定・カード定義（バランス調整）
│   └── firebase-config.js       # Firebase 初期化
├── public/
│   ├── index.html               # ロビー・ゲーム・終了画面
│   ├── game-client.js           # クライアント側ゲーム管理
│   ├── client-config.js         # クライアント設定
│   └── style.css                # 全画面 UI スタイル
├── package.json                 # Node.js 依存関係
└── README.md                    # このファイル
```

## 🚀 セットアップ＆実行

### 必要な環境
- Node.js 14.0+
- npm または yarn

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/Kawamoto24e1058/dog-field.git
cd dog-field

# 依存関係をインストール
npm install
```

### サーバー起動

```bash
npm start
```
サーバーは `http://localhost:8080` で起動します。

### 開発モード（自動リロード）

```bash
npm run dev  # nodemon で監視（PORT=8080）
```

### 共有（GitHub Codespaces）
- Ports パネルで `8080` を `Public` に切り替えると共有URLが生成されます
- 共有URL例: `https://<codespace>-8080.app.github.dev/`

### 🚀 常時起動・共有デプロイ（Render - 完全自動）

**ワンクリックデプロイ：**

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Kawamoto24e1058/dog-field)

**または手動セットアップ：**

1. [Render](https://render.com) にGitHubでサインイン
2. **Dashboard → New → Web Service**
3. リポジトリ `Kawamoto24e1058/dog-field` を接続
4. **Branch**: `copilot/create-online-matching-game`（または `main`）
5. Renderが `render.yaml` を自動検出 → **Apply** をクリック
6. 数分後、`https://dog-field.onrender.com` のような公開URLが発行されます

✅ **特徴：**
- 🌐 24/7 常時稼働
- 🔄 Git push で自動デプロイ
- 🆓 無料プランで利用可能
- 🔗 共有URL即座に取得可能

## 🎴 ゲームシステム

### プレイヤー情報

| パラメータ | 値 |
|-----------|-----|
| 初期HP | 100 |
| 初期手札 | 5枚 |
| 最大手札 | 8枚 |
| ターン時間 | 30秒 |

### カード一覧

#### 攻撃系 ⚔️
- **軽撃** (コスト1): 10ダメージ
- **中撃** (コスト2): 15ダメージ
- **重撃** (コスト3): 20ダメージ

#### 防御系 🛡️
- **軽防** (コスト1): 5 軽減・1ターン有効
- **強防** (コスト2): 12 軽減・2ターン有効

#### 回復系 💚
- **小回復** (コスト2): 15 回復
- **中回復** (コスト3): 25 回復

#### 特殊系 🔄
- **増幅** (コスト2): +2カード ドロー

### ターンの流れ

1. **ドローフェーズ**: カード1枚を引く
2. **アクションフェーズ**: カード1枚を選択して使用
3. **エンドフェーズ**: ターン切り替え、相手にターン権移譲

## 📡 Socket.io イベント

### クライアント → サーバー

| イベント | ペイロード | 説明 |
|---------|----------|------|
| `join_game` | `{ nickname }` | ゲームに参加 |
| `search_match` | - | マッチング検索開始 |
| `cancel_search` | - | 検索キャンセル |
| `play_card` | `{ cardId }` | カードを使用 |
| `turn_timeout` | - | ターン時間切れ |
| `request_game_state` | - | ゲーム状態リクエスト |

### サーバー → クライアント

| イベント | ペイロード | 説明 |
|---------|----------|------|
| `join_success` | `{ playerId, nickname }` | 参加成功 |
| `search_status` | `{ status, message }` | 検索状態更新 |
| `search_cancelled` | `{ message }` | 検索キャンセル完了 |
| `match_started` | `{ matchId, gameState, players }` | マッチ開始 |
| `game_state_update` | `{ gameState }` | ゲーム状態更新 |
| `match_ended` | `{ winner, loser, gameState }` | マッチ終了 |
| `lobby_update` | `{ activePlayers, waitingCount }` | ロビー情報更新 |

## 🎨 UI/UX 設計

### 3つの画面

1. **ロビー画面**
   - ニックネーム入力
   - オンラインプレイヤー表示
   - クイックマッチボタン

2. **ゲーム画面**
   - 対手HP・自身HP ゲージ
   - ターン情報・残り時間
   - アクション履歴ログ
   - 手札表示（自ターン時のみ）

3. **ゲーム終了画面**
   - 勝敗表示
   - 最終HP表示
   - ロビーへ戻るボタン

## 🔄 リアルタイム同期の実装

### HP 同期
- プレイヤーがカード使用時、即座にサーバーで計算
- `game_state_update` で両プレイヤーに配信
- HP ゲージはリアルタイムで更新

### ターン交代
- プレイヤーがアクション終了 → 2秒後に自動ターン切り替え
- タイムアウト時は `turn_timeout` イベントで検知

### 状態保持
- サーバー側で `GameMatch` オブジェクトがマッチごとの状態を管理
- メモリ保持（本運用は Firebase へ保存推奨）

## 📦 Firebase 統合（オプション）

現在はメモリ保持ですが、本運用時は以下を実装：

```javascript
// server/firebase-config.js に実装
admin.database().ref(`matches/${matchId}`).set(gameState);
admin.database().ref(`players/${playerId}`).update({ lastMatch: matchId });
```

## 🐛 デバッグ

### ブラウザコンソール
```javascript
gameClient.socket.on('*', (event, ...args) => {
  console.log('Socket Event:', event, args);
});
```

### サーバーログ
```bash
npm start  # すべてのイベントがコンソール出力される
```

## 🎯 将来の機能拡張

- [ ] プレイヤーレーティングシステム
- [ ] カスタムデッキビルド機能
- [ ] トーナメントモード
- [ ] スペシャルカード（レア度）実装
- [ ] バトルリプレイ機能
- [ ] チャット機能
- [ ] モバイル アプリ化（React Native）

## 📄 ライセンス

MIT License

## 👨‍💻 開発者

Kawamoto24e1058

---

**楽しいゲームプレイをお祈りします！🎮✨**
