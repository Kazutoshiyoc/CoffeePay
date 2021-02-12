process.on('unhandledRejection', console.dir);

const fs = require('fs');
const http = require('http');

// -----------------------------------------------------------------------------------------------------------------------
//                                                      HTTPサーバ
// -----------------------------------------------------------------------------------------------------------------------
const server = http.createServer(function(req, res) {

    var thisStatusCode, html;
    const InternalServerError = '<h1>CoffeePay</h1><hr><h2>500 InternalServerError</h2>';

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // '/'にGETアクセスされた場合 index.htmlを表示
	if (req.url === '/' && req.method === 'GET') {

        // index.htmlを読み込む
        fs.readFile(docRoot + 'index.html', {
            encoding: 'utf8'
        }, function(err_404, index) {

			if (err_404) {                                                  // index.htmlの読み込みに失敗した場合
                fs.readFile(docRoot + '/error/404.html', {
					encoding: 'utf8'
				}, function(err_500, NotFound) {
					if (err_500) [thisStatusCode, html] = [500, InternalServerError];   // 500エラー
					else         [thisStatusCode, html] = [404, NotFound];              // 404エラー
                });
            } else [thisStatusCode, html] = [200, index];                   // 正常に動作した場合（200）

            // ページをリターン
            res.statusCode = thisStatusCode;
            res.setHeader('Content-Type', 'text/html');
			res.end(html);
        });

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // '/updateInfo'にGETアクセスされた場合 admin/updateInfo.htmlを表示
	} else if (req.url === '/updateInfo' && req.method === 'GET') {

        // admin/updateInfo.htmlを読み込む
        fs.readFile(docRoot + '/admin/updateInfo.html', {
            encoding: 'utf8'
        }, function(err_404, doc) {

            if (err_404) {                                                  // admin/updateInfo.htmlの読み込みに失敗した場合
                fs.readFile(docRoot + '/error/404.html', {
                    encoding: 'utf8'
                }, function(err_500, NotFound) {
                    if (err_500) [thisStatusCode, html] = [500, InternalServerError];   // 500エラー
                    else         [thisStatusCode, html] = [404, NotFound];              // 404エラー
                });
            } else [thisStatusCode, html] = [200, doc];                   // 正常に動作した場合（200）

            // ページをリターン
            res.statusCode = thisStatusCode;
            res.setHeader('Content-Type', 'text/html');
            res.end(html);
        });

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // '/'以外にGETアクセスされた場合 404エラーを返す
    } else if (req.method === 'GET') {

        // 404.htmlを読み込む
        fs.readFile(docRoot + '/error/404.html', {
            encoding: 'utf8'
        }, function(err_500, NotFound) {
            if (err_500) [thisStatusCode, html] = [500, InternalServerError];   // 500エラー
            else         [thisStatusCode, html] = [404, NotFound];              // 404エラー

            // ページをリターン
            res.statusCode = thisStatusCode;
            res.setHeader('Content-Type', 'text/html');
			res.end(html);
        });
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