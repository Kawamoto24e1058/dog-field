# 🐕 Dog Field - ターン制オンライン対戦カードゲーム

ブラウザで遊べる、リアルタイムマルチプレイヤーのターン制カードバトルゲームです。

## 🎮 ゲーム概要

**Dog Field**は、2人のプレイヤーがオンラインで対戦し、カードを使用して相手のHPを0にすることを目指すターン制カードゲームです。

### コア機能


# Dog Field

## 無料公開（GitHub Pages）
- このリポジトリには GitHub Pages への自動デプロイ用ワークフローが含まれています（.github/workflows/deploy-pages.yml）。
- 反映後、公開URLは次になります（初回デプロイ完了後に有効）：
   - https://Kawamoto24e1058.github.io/dog-field/
- もし公開が無効の場合は、GitHub のリポジトリ設定で以下を確認してください。
   - Settings → Pages → Build and deployment: Source に「GitHub Actions」を選択。
   - Actions が成功すれば自動で公開されます。

## マッチングとキーワード（合言葉）
- スタート画面で「ニックネーム」と「合言葉」を設定し「マッチ開始」を押すだけで参加＋検索まで自動で行います。
- 同じ合言葉のプレイヤー同士でペアリング。空欄なら「any」として誰とでもマッチ。
- 最大20文字。半角英数・日本語どちらでもOK。

## ローカルで遊ぶ
## 🛠️ 技術スタック

| レイヤー | テクノロジー | 説明 |

## 注意
- GitHub Pages は静的ホスティングです。サーバー機能（リアルタイム対戦など）が必要な場合は別途無料バックエンド（例：Cloudflare Workers）を用意します。必要なら次のステップで用意できます。

## 無料バックエンド: Cloudflare Workers（WebSocket / マッチング）
- フロントはGitHub Pagesで無料公開、バックエンドはCloudflare Workersで無料運用できます。
- このリポジトリの `cf-worker/` に最小のWorkersひな型を追加しました（ロビーで2人を自動ペア、WebSocketでメッセージ中継）。

### セットアップ / デプロイ手順
1. Cloudflareに無料登録（クレジットカード不要）
2. ローカルにwranglerをインストール
   ```bash
   npm install -g wrangler
   wrangler login
   ```
3. ワーカーをデプロイ
   ```bash
   cd cf-worker
   wrangler publish
   ```
4. 成功すると公開URL（例）が発行されます
   - `https://<your-worker-subdomain>.workers.dev/health`
   - WebSocketエンドポイント: `wss://<your-worker-subdomain>.workers.dev/ws`

### クライアントからの利用例（最小）
```html
<script>
  const ws = new WebSocket('wss://<your-worker-subdomain>.workers.dev/ws');
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.type === 'waiting') console.log('待機中');
    if (msg.type === 'paired') console.log('ペア成立', msg);
    if (msg.type === 'relay') console.log('相手から', msg.data);
  };
  // 相手へJSONを送りたいとき
  function send(data) { ws.send(JSON.stringify(data)); }
</script>
```

このひな型は「ロビーで2人を自動ペア→メッセージ中継（relay）」までを提供します。ゲーム固有のプロトコル（ターン開始/カード使用/HP更新等）は、`relay` 経由でJSONを設計してやり取りしてください。必要ならクライアント実装もこちらで追加できます。
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
