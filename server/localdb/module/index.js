var mongoose = require('mongoose');
var Log = require('../../utils/log')({
  file: 'module.log'
});
var CONF_DB = require('../../config.js').DB;
var constr = 'mongodb://' + CONF_DB.user + ':' + CONF_DB.password + '@' + CONF_DB.host + ':' + CONF_DB.port + '/' + CONF_DB.db;

/**
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
 * @param {Function} callback function(err, modules){}
 */
exports.getModules = function(callback) {
  exports.getMongoose(function(err, mongoose){
    if (err) {
      callback(err);
    } else {
      callback(null, {
        User: require('./user').getUserModels(mongoose)
      }, mongoose);
    }
  })
}
