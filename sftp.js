//@ts-check
require('dotenv').config(); //自定义读取文件

var fs = require('fs')
var path = require("path")
var SFTP = require('ssh2-sftp-client');


let BASH_PATH = process.env.SFTP_PATH || '/ftp'
let APP_PATH = ''
if (path.isAbsolute(process.env.APP_PATH)) {
  APP_PATH = process.env.APP_PATH
} else {
  APP_PATH = path.resolve(__dirname, process.env.APP_PATH)
}

let sftp = new SFTP();
var uploadList = []

sftp.connect({
  host: process.env.SFTP_HOST,
  port: +process.env.SFTP_PORT || 22,
  username: process.env.SFTP_USER,
  password: process.env.SFTP_PASSWORD,
}).then(async () => {
  scanDir(APP_PATH)
  var fileCount = 0;
  for (var item of uploadList) {
    fileCount++
    // 统一 路径分隔符 替换windows 分隔符为 linux
    var remoteFile = path.normalize(path.join(BASH_PATH, item.rel)).replace(/\\/g, "/")
    // console.log(item, remoteFile)
    console.log(`上传文件：${item.abs} 到服务器： ${remoteFile}`)
    try {
      // 创建文件夹
      await sftp.mkdir(path.dirname(remoteFile), true)
    } catch (error) {
      // 不处理
    }
    try {
      // 移动文件
      await sftp.fastPut(item.abs, remoteFile)
    } catch (error) {
      console.error(error)
    }
  }
  console.log(`上传完成，一共上传${fileCount}个文件`)
  sftp.end()
}).catch(err => {
  console.log(err, 'catch error');
});

function scanDir(dirpath) {
  var fileList = fs.readdirSync(dirpath)
  for (var fileName of fileList) {
    var _tempPath = `${dirpath}${path.sep}${fileName}`;
    var stat = fs.lstatSync(_tempPath);
    if (stat.isDirectory()) {
      scanDir(_tempPath)
    } else {
      uploadList.push({
        abs: _tempPath,
        rel: path.relative(APP_PATH, _tempPath),
        fileName: fileName
      })
    }
  }
}

