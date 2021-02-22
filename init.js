process.on('unhandledRejection', console.dir);

// 外部定義関数のロード
const drive = require ('./function/googleapi/drive.js');

// Google Driveの初期化
const main = async () => {

    // CoffeePayフォルダを生成
    var CoffeePay_folder = await drive.createFolder ('CoffeePay', '');
    await console.log ('>>> 環境変数 "APP_ID" に次のIDを設定して下さい:                ' + CoffeePay_folder);

    // PayPay受け取りリンクを保存するファイルを生成
    var PayPay_QR_Id = await drive.createFile ('PayPay_QR', 'application/octet-stream', '', CoffeePay_folder);
    await console.log ('>>> 環境変数 "PAYPAY_QR_ID" に次のIDを設定して下さい:             ' + PayPay_QR_Id);

    // PayPay受け取りリンクの有効期限を保存するファイルを生成
    var PayPay_QR_expiry_date_Id = await drive.createFile ('PayPay_QR_expiry_date', 'application/octet-stream', '', CoffeePay_folder);
    await console.log ('>>> 環境変数 "PAYPAY_QR_EXPIRY_DATE_ID" に次のIDを設定して下さい: ' + PayPay_QR_expiry_date_Id);

};

main ();