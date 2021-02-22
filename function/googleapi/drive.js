// ================================================================================
//
//                              Google Drive REST API
//
// ================================================================================
'use strict';
// -----------------------------------------
//              モジュールのロード
// -----------------------------------------
const { google } = require('googleapis');
const fs         = require('fs');
const path       = require('path');


// -----------------------------------------
//             Google Drive 仕様
// -----------------------------------------
const _FOLDERS_URL = 'https://drive.google.com/drive/folders/';
const _FILE_URL    = 'https://drive.google.com/open?id=';

exports.FOLDERS_URL = _FOLDERS_URL;
exports.FILE_URL    = _FILE_URL;


// -----------------------------------------
//      crient_secret / token の設定
// -----------------------------------------
const API_INFO_DIR       = path.resolve(__dirname    + '/credential');
const CLIENT_SECRET_PATH = path.resolve(API_INFO_DIR + '/drive/client_secret.json');
const TOKEN_PATH         = path.resolve(API_INFO_DIR + '/drive/token.drive.file.json');


// -----------------------------------------
//          OAuth2クライアントの設定
// -----------------------------------------
// クレデンシャル情報の取得
const content     = fs.readFileSync(CLIENT_SECRET_PATH);
const credentials = JSON.parse(content);
const {client_secret, client_id, redirect_uris} = credentials.installed;

// OAuth2クライアントの生成
const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
const token = fs.readFileSync(TOKEN_PATH);
oauth2Client.credentials = JSON.parse(token);


// --------------------------------------------------------------------------------
//
//                              Drive REST API V.3
//
// --------------------------------------------------------------------------------
const drive_v3 = google.drive('v3');

// ~~~~~~~~~~~~~~~~~~~~~~~~
// 新規フォルダを生成する関数
// ~~~~~~~~~~~~~~~~~~~~~~~~
exports.createFolder = async (folderName, parent_dir_id) => {

    // メタ情報
	var fileMetadata = {
		name: folderName,
		mimeType: 'application/vnd.google-apps.folder',
		parents: [parent_dir_id]
	};
    if (parent_dir_id == '') {
        fileMetadata = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder'
        };
    }

    // フォルダ生成
    const response = await drive_v3.files.create ({
        auth: oauth2Client,
        resource: fileMetadata
    });

    return String(response.data.id);
};


// ~~~~~~~~~~~~~~~~~~~~~~~~
// 新規ファイルを生成する関数
// ~~~~~~~~~~~~~~~~~~~~~~~~
exports.createFile = async (fileName, mimeType, body, parent_dir_id) => {

    // メタ情報
	var fileMetadata = {
		name: fileName,
		parents: [parent_dir_id]
	};

    // ファイル本体
    var media = {
        mimeType: mimeType,
        body: body
    };

    // ファイルの生成
    const response = await drive_v3.files.create ({
        auth: oauth2Client,
        resource: fileMetadata,
        media: media
    });

    return String(response.data.id);
};


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 任意のIDをもつファイルを更新する関数
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
exports.updateFile = async (fileId, mimeType, body) => {

    // 更新内容
    var media = {
        mimeType: mimeType,
        body: body
    };

    // ファイルの更新
    const response = await drive_v3.files.update ({
        auth: oauth2Client,
        fileId: fileId,
        media: media
    });
};


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 任意のIDをもつファイルを取得する関数
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
exports.getFile = async (fileId) => {

    // ファイルの取得
    const response = await drive_v3.files.get ({
        auth: oauth2Client,
        fileId: fileId,
        alt: 'media'
    });

    return String(response.data);
};


// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 任意のディレクトリ内にあるファイル／ディレクトリリストを取得する関数
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
exports.getFileDirList = async (parent_dir_id) => {

    // 戻り値を格納する変数
    var id   = [];
    var name = [];

    // リスト取得のための初期化
    var response = [];
    var pageNum  = 0;
    var thisPageSize  = 1000;
    var nextPageToken = undefined;

    // nextPageTokenが返ってくる限り繰り返す
    while (pageNum >= 0) {

        // リストの取得
        response[pageNum] = await drive_v3.files.list ({
            auth: oauth2Client,
            pageSize: thisPageSize,
            pageToken: nextPageToken,
            orderBy: 'name',
            fields: 'nextPageToken, files(id, name)',
            q: '"' + parent_dir_id + '" in parents and trashed = false'
        });
        nextPageToken = response[pageNum].data.nextPageToken;

        // データの保管
        for (var i = 0; i < response[pageNum].data.files.length; i++) {
            await id.push(response[pageNum].data.files[i].id);
            await name.push(response[pageNum].data.files[i].name);
        }

        // nextPageTokenがundefinedになるまで繰り返す
        if (response[pageNum].data.nextPageToken == undefined) pageNum = -100;
        pageNum++;

    }

    return [id, name];
};