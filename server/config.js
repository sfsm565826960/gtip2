var path = require('path');

/**
 * 修复在gtip目录下和gtip/server目录下获取dbPath绝对路径不一致的问题
 */
var basePath = path.resolve('.');
var result = basePath.match(/.+?server/);
if (result) {
  basePath = result[0];
} else {
  basePath = path.resolve('server');
}

exports.DB = {
  host: '127.0.0.1',
  port: 27077,
  dbPath: path.resolve(basePath, './localdb/data/'),
  logPath: path.resolve(basePath, './localdb/log/db.log'),
  db: 'gtip',
  user: 'gtip',
  password: '8a3a2a7e'
}
