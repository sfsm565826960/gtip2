var path = require('path');

/**
 * 修复在gtip目录下和gtip/server目录下获取dbPath绝对路径不一致的问题
 */
var basePath = path.resolve('.');
var result = basePath.match(/.+?server/);
if (result) { basePath = result[0]; } else { basePath = path.resolve('server'); }
exports.SERVER_PATH = path.resolve(basePath);

exports.APP = {
  name: 'gtip',
  logo: 'gtip.png'
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

exports.MAIL = {
  enable: false,
  host: 'smtp.sina.com',
  user: 'sfsm_gtip@sina.com',
  pwd: 'sfsm_gtip',
  admin: '1078777529@qq.com'
}

exports.PUSH = {
  host: 'http://sdk.open.api.igexin.com/apiex.htm',
  appId: '8q1qy5UUU86JheqOeJBrb', // '6wwCkjEpyx7MO292BIjzH2',
  appKey: 'a2tjYW6pLQ8QZh8I2PXwZ3', // 'aQYm3ENv8WAHHuN5nVqtd5',
  masterSecret: 'XeYdAikOXvAJyYAcWPJbB7' // 'ilP1eCl1RD8BLcfsC7JBfA'
}
