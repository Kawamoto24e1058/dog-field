// Firebase 設定ファイル
// 実際の使用時は環境変数から読み込み
const admin = require('firebase-admin');

// デモ用 - 実運用ではセキュリティキーを環境変数に
const serviceAccount = {
  "type": "service_account",
  "project_id": "dog-field-game",
  "private_key_id": "demo-key",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAAOCBKGA\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk@dog-field-game.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs"
};

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://dog-field-game.firebaseio.com"
  });
  console.log('✅ Firebase 初期化完了');
} catch (error) {
  console.log('⚠️  Firebase初期化: デモモード（メモリ使用）');
}

module.exports = admin;
