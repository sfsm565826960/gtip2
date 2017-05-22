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
 * @param {Object} options see:http://www.nodeclass.com/api/mongoose.html#guide_connections
 * @param {Function} callback function(err, mongoose)
 */
exports.getMongoose = function(options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {}
  }
  mongoose.connect(constr, options);
  var db = mongoose.connection;
  db.on('error', callback);
  db.once('open', function() {
    Log.i('mongoose opend');
    callback(null, mongoose);
  });
}

/**
 * 获取所有模块
 * @param {Object} options see:http://www.nodeclass.com/api/mongoose.html#guide_connections
 * @param {Function} callback function(err, modules, mongoose){}
 */
exports.getModels = function(options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {}
  }
  exports.getMongoose(options, function(err, mongoose){
    if (err) {
      callback(err);
    } else {
      callback(null, {
        User: require(path.resolve(MODEL_PATH, 'user')).getModel(mongoose),
        Stock: require(path.resolve(MODEL_PATH, 'stock')).getModel(mongoose),
        Tip: require(path.resolve(MODEL_PATH, 'tip')).getModel(mongoose)
      }, mongoose);
    }
  });
}
  
