/**
 * MongoDB 数据库工具
 */

var MongoClient = require('mongodb').MongoClient;
var Server = require('mongodb').Server;
var CONF_DB = require('../config.js').DB;
var constr = 'mongodb://' + CONF_DB.user + ':' + CONF_DB.password + '@' + CONF_DB.host + ':' + CONF_DB.port + '/' + CONF_DB.db;
var _db = null;

var _default = function(callback, requireNew) {
  if (_db && requireNew !== true) {
    callback(null, _db);
  } else {
    MongoClient.connect(constr, function(err, con) {
      if (err) {
        console.error('Connect fail: ' + err, err);
        callback(err);
      } else {
        var db = con.db(CONF_DB.db);
        if (db) {
          db.authenticate(CONF_DB.user, CONF_DB.password, function(err, result) {
            if (err) {
              console.error('DB user authenticate fail: ' + err, err);
              callback(new Error(err));
              client.close();
              console.log('Connect closed');
            } else {
              if (requireNew !== true) _db = db;
              callback(null, db);
            }
          });
        } else {
          console.error('Cannot access db ' + CONF_DB.db);
          callback(new Error('Cannot access db ' + CONF_DB.db));
        }
      }
    });
  }
}

_default.getCollection = function(name, callback, option) {
  _default(function(err, db){
    if (err) {
      callback(err);
    } else {
      db.collection(name, option || {}, callback);
    }
  });
}

module.exports = _default;