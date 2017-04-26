var Log = require('../../utils/log')({
  file: 'models.user.log'
});
function UserSchema (mongoose) {
  var Types = mongoose.Schema.Types;
  var schema = new mongoose.Schema({
    mail: { type: Types.String, match: /^[A-Za-z0-9]+([-_.][A-Za-z0-9]+)*@([A-Za-z0-9]+[-.])+[A-Za-z]{2,5}$/, required: true},
    nickname: { type: Types.String, match: /.{2,}/, required: true },
    password: { type: Types.String, match: /.{6,}/, required: true },
    token: Types.String,
    verifiyCode: { // 验证码
      brief: Types.String,
      value: Types.String,
      createDate: Types.Date, // 创建日期，60秒内不允许重复创建（发送邮件)
      expireDate: Types.Date // 过期日期，十分钟内有效，超过该日期验证码失效
    },
    clientId: Types.String,
    state: { type: Types.String, enum: ['online', 'offline', 'logout'], default: 'logout' }, // online在线,offline离线,logout未登录
    // lock: { // 登录锁
    //   brief: Types.String,
    //   failCount: { type: Types.Number, default: 0 }, // 记录密码输错次数 %5 来实现
    //   unlockDate: { type: Types.Date, default: new Date() } // 解锁时间
    // },
    habit: { // 用户习惯
      loginTime: [Types.Date],
      logoutTime: [Types.Date]
    },
    lastLogin: Types.Date, // 最近一次登录时间
    firstLogin: { type: Types.Date, default: new Date() }, // 注册时间
    settings: {
      receiveNotifiy: { type: Types.Boolean, default: true },
      voiceBroadcast: { type: Types.Boolean, default: false },
      autoLogin: { type: Types.Boolean, default: true } // 若为true，则登录的时候使用token即可
    },
    concern: {
      stockId: [Types.String]
    },
    authority: {
      analysis: Types.Mixed
    }
  });
  return schema;
}

/**
 * 获取UserModules
 * @param {Object|Function} mongoose 当为mongoose时同步，当为function时异步
 */
exports.getUserModel = function(callback) {
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