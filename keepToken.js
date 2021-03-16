process.on('unhandledRejection', console.dir);

// 環境変数の読み込み
require('dotenv').config();
const PAYPAY_QR_EXPIRY_DATE_ID = process.env.PAYPAY_QR_EXPIRY_DATE_ID;

// 外部定義関数のロード
const drive = require ('./function/googleapi/drive.js');

// 定期的にアクセスしないとトークンが無効になる
const main = async () => {

    // QRリンクの有効期限を取得
    var PayPay_QR_Link_Expiry_Date = await drive.getFile (PAYPAY_QR_EXPIRY_DATE_ID);
    console.log (PayPay_QR_Link_Expiry_Date);

};

main ();