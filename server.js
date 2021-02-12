process.on('unhandledRejection', console.dir);

const fs = require('fs');
const http = require('http');

// --------------------------------------------------
//                    HTTPサーバ
// --------------------------------------------------
const server = http.createServer(function(req, res) {

    // '/'にGETアクセスされた場合 index.htmlを表示
	if (req.url === '/' && req.method === 'GET') {

        // index.htmlを読み込む
        fs.readFile(__dirname + '/index.html', {
            encoding: 'utf8'
        }, function(err_404, html) {
            // ファイルの読み込みに失敗したら404エラーのレスポンスを返す
			if (err_404) {
				fs.readFile(__dirname + '/error/404.html', {
					encoding: 'utf8'
				}, function(err_500, notFound) {
					// 404ファイルの読み込みに失敗したら500エラーのレスポンスを返す*/
					if (err_500) {
						res.statusCode = 500;
						res.end('<h1>CoffeePay for Nespresso</h1><hr><h2>500 InternalServerError</h2>');
					} else {
						res.setHeader('Content-Type', 'text/html');
						res.end(notFound);
					}
				});
			}
			// ファイルの読み込みが成功したらHTMLを返す
			else {
				res.setHeader('Content-Type', 'text/html');
				res.end(html);
            } 
        });
    }
    
});

// --------------------------------------------------
//                  Server Settings
// --------------------------------------------------
// localhostの8080番ポートでサーバーを起動する
server.listen(process.env.PORT || 8080);

// Timeoutの設定
const timeout_sec = 30;
server.setTimeout(timeout_sec * 1000);