var Log = require('../../utils/log')({
  file: 'models.user.log'
});
var secret = require('../../utils/secret');
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
      loginDate: [Types.Date],
      logoutDate: [Types.Date]
    },
    lastLogin: Types.Date, // 最近一次登录时间
    loginExpired: Types.Date, // 登录过期时间
    firstLogin: { type: Types.Date, default: new Date() }, // 注册时间
    settings: {
      receiveNotifiy: { type: Types.Boolean, default: true },
      voiceBroadcast: { type: Types.Boolean, default: false },
      autoLogin: { type: Types.Boolean, default: false }, // 若为true，则登录的时候使用token即可
      gestures: { type: Types.String, default: '' } // 用户手势密码，仅在autoLogin为true时有效
    },
    concern: {
      stockIds: [Types.String]
    },
    authority: {
      analysis: Types.Mixed
    }
  });
  schema.methods.signLogin = function() {
    var date = new Date();
    var token = secret.createToken(this.mail);
    this.token = token;
    this.lastLogin = date;
    this.loginExpired = new Date(date.getTime() + 1800000);
    this.habit.loginDate.push(date);
    this.state = 'online';
    return token;
  };
  /**
   * @param {Boolean} offline true离线模式;false注销
   * @param {Boolean} isBackground true关闭程序;false进入后台。仅offline为true有效
   */
  schema.methods.signLogout = function(offline, isExit) {
    var date = new Date();
    if (offline === true) {
      this.state = 'offline';
      if (isExit === true) {
        this.loginExpired = date; // 将登录过期时间设置为当前时间。若autoLogin为true可自动登录，否则需要账户密码登录。
        this.habit.logoutDate.push(date);
      }
    } else {
      this.token = 'InvalidToken' + (date.getTime() * Math.random());
      this.state = 'logout';
      this.habit.logoutDate.push(date);
    }
  }
  schema.methods.createVerifiyCode = function(brief) {
    var date = new Date();
    var verifiyCode = secret.createVerifyCode(6);
    this.verifiyCode.brief = brief;
    this.verifiyCode.value = verifiyCode;
    this.verifiyCode.createDate = date;
    this.verifiyCode.expireDate = new Date(date.getTime() + 600000);
    return verifiyCode;
  };
  schema.methods.checkVerifiyCode = function(brief, verifyCode) {
    var date = new Date();
    if (this.verifiyCode.brief === brief &&
        this.verifiyCode.expireDate > date && 
        this.verifiyCode.createDate < date &&
        this.verifiyCode.value === verifyCode) {
        this.verifiyCode.value = '';
        this.verifiyCode.createDate = date;
        this.verifiyCode.expireDate = date;
        this.verifiyCode.brief = '';
      return true;
    } else {
      return false;
    }
  }
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