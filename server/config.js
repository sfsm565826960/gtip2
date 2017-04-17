var path = require('path');

exports.DB = {
  host: '127.0.0.1',
  port: 27077,
  dbPath: path.resolve('localdb/data/'),
  logPath: path.resolve('localdb/log/db.log'),
  db: 'gtip',
  user: 'gtip',
  password: '8a3a2a7e'
}