# Dog Field - Quick Deploy Guide

## 🚀 最速デプロイ（3分で完了）

### ステップ 1: Render にサインイン
[Render](https://render.com) を開き、**Sign Up / Log In with GitHub** をクリック

### ステップ 2: ワンクリックデプロイ
下のボタンをクリック：

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Kawamoto24e1058/dog-field)

### ステップ 3: 設定確認
- **Branch**: `copilot/create-online-matching-game` または `main`
- **Service Name**: `dog-field`（そのままでOK）
- **Plan**: Free（無料プラン）

**Apply** → **Create Web Service**

### ステップ 4: デプロイ完了
数分後、画面上部に公開URLが表示されます：

```
https://dog-field.onrender.com
```

✅ **このURLを共有すれば、誰でもアクセス可能です**

---

## 📤 共有方法

### ゲームをプレイしてもらう
1. Renderの公開URLをコピー（例: `https://dog-field.onrender.com`）
2. 友達やテスターに送信
3. 各自がURLにアクセスして、ニックネームを入力
4. 「クイックマッチ」で対戦開始！

### 注意点
- **初回アクセス**: 無料プランの場合、しばらくアクセスがないとスリープします（初回アクセス時に30秒ほど起動時間がかかります）
- **常時稼働**: アクセスがある限り稼働し続けます
- **同時対戦**: 複数ペアが同時にプレイ可能

---

## 🔄 更新方法

コードを更新したら：

```bash
git add .
git commit -m "Update game features"
git push
```

Renderが自動的に再デプロイします（約2-3分）。

---

## 🆘 トラブルシューティング

### デプロイが失敗する場合
1. Render ダッシュボードの **Logs** タブを確認
2. `npm install` がエラーになっていないか確認
3. `render.yaml` が正しく読み込まれているか確認

### サーバーが起動しない場合
- **Environment** タブで `PORT=8080` が設定されているか確認
- **Start Command** が `node server/index.js` になっているか確認

### ゲームが表示されない
- ブラウザのコンソール（F12）でエラーを確認
- Socket.io接続エラーが出ている場合、HTTPSとWSS（WebSocket Secure）の設定を確認

---

## 📊 無料プランの制限

| 項目 | 制限 |
|------|------|
| 稼働時間 | 月間750時間（常時稼働でほぼ1ヶ月分） |
| スリープ | 15分間アクセスがないとスリープ |
| メモリ | 512MB |
| 同時接続 | 制限なし（メモリ次第） |

💡 **アップグレード不要**: 小規模なゲームテストには十分です。

---

**準備完了！あとはRenderに接続するだけです 🎮**
