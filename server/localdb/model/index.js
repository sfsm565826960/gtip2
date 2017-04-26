var mongoose = require('mongoose');
var Log = require('../../utils/log')({
  file: 'module.log'
});
var CONF = require('../../config.js');
var path = require('path');
var MODEL_PATH = path.resolve(CONF.SERVER_PATH, './localdb/model/')
var CONF_DB = CONF.DB;
var constr = 'mongodb://' + CONF_DB.user + ':' + CONF_DB.password + '@' + CONF_DB.host + ':' + CONF_DB.port + '/' + CONF_DB.db;

/**
 * 连接数据库并返回mongoose对象
 * @param {Function} callback function(err, mongoose)
 */
exports.getMongoose = function(callback) {
  mongoose.connect(constr);
  var db = mongoose.connection;
  db.on('error', callback);
  db.once('open', function() {
    Log.i('mongoose opend');
    callback(null, mongoose);
  });
}

/**
 * 获取所有模块
 * @param {Function} callback function(err, modules){}
 */
exports.getModels = function(callback) {
  exports.getMongoose(function(err, mongoose){
    if (err) {
      callback(err);
    } else {
      callback(null, {
        User: require(path.resolve(MODEL_PATH, 'user')).getUserModel(mongoose)
      }, mongoose);
    }
  });
}
  
