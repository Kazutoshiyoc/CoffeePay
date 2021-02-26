process.on('unhandledRejection', console.dir);

// 環境変数の設定
require('dotenv').config();
const APP_ID                   = process.env.APP_ID;
const PAYPAY_QR_ID             = process.env.PAYPAY_QR_ID;
const PAYPAY_QR_EXPIRY_DATE_ID = process.env.PAYPAY_QR_EXPIRY_DATE_ID;

// モジュールのロード
const fs          = require('fs');
const http        = require('http');
const querystring = require('querystring');
const path        = require('path');
const ejs         = require('ejs');

// 外部定義関数のロード
const drive = require ('./function/googleapi/drive.js');

// エラーページをロードする関数
const InternalServerError = '<h1>CoffeePay</h1><hr><h2>500 Internal Server Error</h2>';
function errorPage (error_code, template_html) {

    var this_error_msg;
    if (error_code == 400) this_error_msg = 'Bad Request';
    if (error_code == 403) this_error_msg = 'Forbidden';
    if (error_code == 404) this_error_msg = 'Page Not Found';
    if (error_code == 500) this_error_msg = 'Internal Server Error';

    var error_html;
    try {
        error_html = ejs.render(template_html, {
            error_code: error_code,
            error_msg: this_error_msg
        });
    } catch (e2) {
        error_html = InternalServerError;
    }
    return error_html;
}

// -----------------------------------------------------------------------------------------------------------------------
//                                                      HTTPサーバ
// -----------------------------------------------------------------------------------------------------------------------
const server = http.createServer(function(req, res) {

    var html;
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // エラーページ, テンプレートの読み込み
    var error_html = fs.readFileSync( path.resolve(docRoot + 'error.ejs'), 'utf-8');

    // '/admin'テンプレートの読み込み
    var admin_html, admin_css;
    try {
        admin_html = fs.readFileSync( path.resolve(docRoot + 'admin/index.ejs'), 'utf-8');
        admin_css  = fs.readFileSync( path.resolve(docRoot + 'admin/style.css'), 'utf-8');
    } catch (e) {
        admin_html = errorPage (404, error_html);
    }

    // '/redirect'テンプレートの読み込み
    var redirect_html;
    try {
        redirect_html = fs.readFileSync( path.resolve(docRoot + 'redirect.ejs'), 'utf-8');
    } catch (e) {
        redirect_html = errorPage (404, error_html);
    }


    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // '/'にGETアクセスされた場合 index.htmlを表示
    if (req.url === '/' && req.method === 'GET') {

        const getPayPayQRInfo = async () => {
            try {
                // PayPay受け取りリンクと有効期限の取得
                var PayPay_QR_Link             = await drive.getFile (PAYPAY_QR_ID);
                    PayPay_QR_Link             = decodeURIComponent(PayPay_QR_Link);
                var PayPay_QR_Link_Expiry_Date = await drive.getFile (PAYPAY_QR_EXPIRY_DATE_ID);
                    PayPay_QR_Link_Expiry_Date = parseInt(PayPay_QR_Link_Expiry_Date, 10);

                // 現在時刻を取得（UNIXTIME）
                var now = new Date();
                var unixtime = now.getTime();

                // 有効期限が切れていないときの処理
                if (unixtime < PayPay_QR_Link_Expiry_Date) {

                    html = ejs.render(redirect_html, {
                        infomation: '最新のPayPayリンクを取得しました。<br>自動的に画面が遷移しない場合は以下のリンクをクリックして下さい。',
                        redirect_url: PayPay_QR_Link,
                        option: 'target="_blank" rel="noopener noreferrer"'
                    });

                // 有効期限が切れているときの処理
                } else {

                    html = ejs.render(redirect_html, {
                        infomation: 'PayPayリンクの有効期限が切れています。<br>お手数ですが、現金もしくは支払履歴・電話番号検索などからの決済をお願いします。',
                        redirect_url: '#',
                        option: ''
                    });
                }
                res.statusCode = 200;

            } catch (e) {
                res.statusCode = 500;
                html = errorPage (res.statusCode, error_html);

            } finally {
                res.end(html);
            }
        };
        res.setHeader('Content-Type', 'text/html');
        getPayPayQRInfo ();

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // '/admin'にGETアクセスされた場合 admin/index.ejsをベースにページを返す
    } else if (req.url === '/admin' && req.method === 'GET') {

        const setPayPayQRInfo = async () => {
            try {
                 // PayPay受け取りリンクと有効期限の取得
                var PayPay_QR_Link             = await drive.getFile (PAYPAY_QR_ID);
                    PayPay_QR_Link             = decodeURIComponent(PayPay_QR_Link);
                var PayPay_QR_Link_Expiry_Date = await drive.getFile (PAYPAY_QR_EXPIRY_DATE_ID);
                    PayPay_QR_Link_Expiry_Date = new Date(parseInt(PayPay_QR_Link_Expiry_Date, 10));

                // タイムゾーンオフセットの計算
                var LocalTimeZone_offset           = PayPay_QR_Link_Expiry_Date.getTimezoneOffset();
                var JST_offset                     = -9*60;
                var PayPay_QR_Link_Expiry_Date_JST = new Date(PayPay_QR_Link_Expiry_Date.getTime() + LocalTimeZone_offset + JST_offset);

                // 変数の入力
                res.statusCode = 200;
                html = ejs.render(admin_html, {
                    css_setting: admin_css,
                    paypay_expiry_date: PayPay_QR_Link_Expiry_Date_JST,
                    qr_link: PayPay_QR_Link
                });

            } catch (e) {
                res.statusCode = 500;
                html = errorPage (res.statusCode, error_html);

            } finally {
                res.end(html);
            }
        };

        res.setHeader('Content-Type', 'text/html');
        setPayPayQRInfo ();
    
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // '/paypayQR'にPOSTアクセスされた場合 GoogleDriveのファイルを更新
    } else if (req.url === '/paypayQR' && req.method === 'POST') {

        //readableイベントが発火したらデータにリクエストボディのデータを追加
        var data = '';
        req.on('readable', function(chunk) {
            data += req.read();
        });
        req.on('end', async function() {

            // POSTされたデータを取り出す
            querystring.parse(data);
            var posted_data = data.split(/null/);
                posted_data = posted_data[0].split(/&/);

            for (var i = 0; i < posted_data.length; i++) posted_data[i] = posted_data[i].split(/=/);
            var paypay_qr = posted_data[0][1];
            var app_id    = posted_data[1][1];
            var password  = posted_data[2][1];

            // 空欄が存在しない場合
            if ( paypay_qr != '' && app_id != '' && password != '' ) {

                // IDパスが正しい場合
                if ( app_id == APP_ID && password == PAYPAY_QR_ID ) {

                    // 現在時刻を取得（UNIXTIME）
                    var now = new Date();
                    var unixtime = now.getTime();
                    var expiry_time = 14 * 24 * 60 * 60 * 1000;         // 有効期限は2週間
                    var expiry_date_unixtime = unixtime + expiry_time;

                    // PayPay受け取りリンクを更新
                    await drive.updateFile (PAYPAY_QR_ID, 'application/octet-stream', paypay_qr);

                    // 有効期限を設定
                    await drive.updateFile (PAYPAY_QR_EXPIRY_DATE_ID, 'application/octet-stream', expiry_date_unixtime);

                    // '/admin' へリダイレクト
                    try {
                        res.statusCode = 200;
                        html = ejs.render(redirect_html, {
                            infomation: '情報を更新しています...',
                            redirect_url: '/admin',
                            option: ''
                        });

                    } catch (e) {
                        res.statusCode = 500;
                        html = errorPage (res.statusCode, error_html);
                    }

                // IDパスが不正な場合
                } else {
                    res.statusCode = 403;
                    html = errorPage (res.statusCode, error_html);
                }

            // 空欄が存在する場合
            } else {
                res.statusCode = 400;
                html = errorPage (res.statusCode, error_html);
            }

            res.setHeader('Content-Type', 'text/html');
            res.end(html);
        });

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // '/'以外にGETアクセスされた場合 404エラーを返す
    } else if (req.method === 'GET') {

        res.statusCode = 404;
        html = errorPage (res.statusCode, error_html);
        res.setHeader('Content-Type', 'text/html');
        res.end(html);

    }
});

// -----------------------------------------------------------------------------------------------------------------------
//                                                  Server Settings
// -----------------------------------------------------------------------------------------------------------------------
// localhostの8080番ポートでサーバーを起動する
server.listen(process.env.PORT || 8080);

// ドキュメントルートの設定
const docRoot = __dirname + '/www/html/';

// Timeoutの設定
const timeout_sec = 30;
server.setTimeout(timeout_sec * 1000);