function UserSchema (mongoose) {
  var Types = mongoose.Schema.Types;
  return new mongoose.Schema({
    mail: Types.String,
    nickname: Types.String,
    password: Types.String,
    token: Types.String,
    clientId: Types.String,
    tags: [Types.String],
    state: { type: Types.String, default: 'logout' }, // online在线,offline离线,logout未登录,lock锁定
    lastLogin: Types.Date, // 最近一次登录时间
    settings: {
      receiveNotifiy: {type: Types.Boolean, default: true },
      voiceBroadcast: { type: Types.Boolean, default: false }
    },
    concern: {
      stockId: [Types.String]
    },
    authority: {
      analysis: Types.Mixed
    }
  });
}

/**
 * 获取UserModules
 * @param {Object|Function} mongoose 当为mongoose时同步，当为function时异步
 */
exports.getUserModels = function(callback) {
  if (typeof callback === 'function') {
    require('./index').getMongoose(function(err, mongoose) {
      if (err) {
        callback(err);
      } else {
        callback(null, mongoose.model('User', UserSchema(mongoose)), mongoose);
      }
    })
  } else {
    var mongoose = callback;
    return mongoose.model('User', UserSchema(mongoose));
  }
  return null;
}

/**
 * 获取UserSchema
 * @param {Object|Function} mongoose 当为mongoose时同步，当为function时异步
 */
exports.getUserSchema = function(callback) {
  if (typeof callback === 'function') {
    require('./index').getMongoose(function(err, mongoose) {
      if (err) {
        callback(err);
      } else {
        callback(null, UserSchema(mongoose), mongoose);
      }
    })
  } else {
    var mongoose = callback;
    return UserSchema(mongoose);
  }
  return null;
}