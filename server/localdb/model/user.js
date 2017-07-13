var secret = require('../../utils/secret');
function UserSchema (mongoose) {
  var Types = mongoose.Schema.Types;
  var habitLoginSchema = new mongoose.Schema({
    date: Types.Date,
    appVersion: Types.String,
    ip: Types.String
  });
  var schema = new mongoose.Schema({
    mail: {
      type: Types.String,
      required: true,
      unique: true,
      match: /^[A-Za-z0-9]+([-_.][A-Za-z0-9]+)*@([A-Za-z0-9]+[-.])+[A-Za-z]{2,5}$/
    },
    nickname: { type: Types.String, match: /.{2,}/, required: true },
    headimg: { type: Types.String, default: '../../images/headimg.jpg' },
    password: { type: Types.String, match: /.{6,}/, required: true },
    token: { type: Types.String, unique: true },
    verifiyCode: { // 验证码
      brief: Types.String, // 验证码用途
      value: Types.String,
      createDate: Types.Date, // 创建日期，60秒内不允许重复创建（发送邮件)
      expireDate: Types.Date // 过期日期，十分钟内有效，超过该日期验证码失效
    },
    clientId: Types.String, // 移动端设备推送ID
    state: { // 用户状态：online在线,offline离线,logout未登录
      type: Types.String,
      default: 'logout',
      enum: ['online', 'offline', 'logout']
    },
    // lock: { // 登录锁
    //   brief: Types.String,
    //   failCount: { type: Types.Number, default: 0 }, // 记录密码输错次数 %5 来实现
    //   unlockDate: { type: Types.Date, default: new Date() } // 解锁时间
    // },
    habit: { // 用户习惯
      login: [habitLoginSchema],
      logoutDate: [Types.Date]
    },
    lastLogin: Types.Date, // 最近一次登录时间
    loginExpired: Types.Date, // 登录过期时间
    firstLogin: { type: Types.Date, default: new Date() }, // 注册时间
    settings: { // 移动端设置
      notifications: { // 提醒设置
        receiveNotify: { type: Types.Boolean, default: true }, // 若为true则向其推送通知
        voiceBroadcast: { type: Types.Boolean, default: false }, // 若为true则收到通知后进行朗读
        arriveVibrate: { type: Types.Boolean, default: true }, // 若为true则收到通知后震动
        arriveSound: {type: Types.Boolean, default: true }, // 若为true则收到通知后响铃
      },
      account: { // 账户设置
        autoLogin: { type: Types.Boolean, default: false }, // 若为true，则登录的时候使用token即可
        gestures: { type: Types.String, default: '' } // 用户手势密码，仅在autoLogin为true时有效
      }
    },
    concern: { // 关注内容
      stockIds: [Types.String] // 用户关注的股票ID
    },
    // authority: { // 权限管理
    //   analysis: Types.Mixed
    // }
  });
  // 添加索引
  schema.index({mail: 1}, {unique: true});
  schema.index({token: 1}, {unique: true});
  schema.index({mail: 1, password: 1});
  // 静态方法
  /**
   * 使用令牌获取用户，eg:
   * User.getUserByToken(req.body.token, (err, user) = >{
   *    if(err){
   *      res.json(err);
   *    }else{
   *      // user.xxx
   *    }
   * })
   */
  schema.statics.getUserByToken = function(token, sql, callback) {
    // 多态实现
    if (typeof sql === 'function') {
      callback = sql;
      sql = {}
    }
    // 检测参数
    if (!token || token.length === 0) {
      return callback({state: 'logout', detail: '令牌无效' });
    }
    // 允许配置sql参数
    var opt = Object.assign({
      token: token,
      state: 'online',
      loginExpired: {$gt: new Date()}
    }, sql);
    // 执行查询
    this.findOne(opt, (err, user) => {
      if (err) {
        Log.e(err, true);
        callback({state: 'fail', detail: err.message || err});
      } else if (user === null) {
        callback({state: 'logout', detail: '令牌无效'});
      } else {
        callback(null, user);
      }
    });
  }
  // 添加方法
  /**
   * 签署用户登录状态
   */
  schema.methods.signLogin = function() {
    var date = new Date();
    var token = secret.createToken(this.mail);
    this.token = token;
    this.lastLogin = date;
    this.loginExpired = new Date(date.getTime() + 1800000);
    this.state = 'online';
    return token;
  };
  /**
   * 添加用户登录习惯
   * @param {Object} loginHabit {ip,appVersion}
   */
  schema.methods.addLoginHabit = function(loginHabit) {
    this.habit.login.push({
      date: new Date(),
      ip: loginHabit.ip || 'unknow',
      appVersion: loginHabit.appVersion || 'unknow'
    });
  }
  /**
   * 签署用户离线/注销状态
   * @param {Boolean} offline true离线模式;false注销
   * @param {Boolean} isExit true关闭程序;false进入后台。仅offline为true有效
   * 
   * 说明：
   * 若offline为false，则退出用户，下次启动程序时要求用户使用账户密码登录；
   * 若offline为true，且isExit为true，则退出程序，下次启动时取决autoLogin进行自动登录或账户密码登录
   * 若offline为true，且isExit为false，则进入后台，下次启动时判断登录是否过期，不过期则正常使用，过期则取决于autoLogin
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
  /**
   * 创建验证码
   * @param {String} brief 简要说明验证码的用途
   */
  schema.methods.createVerifiyCode = function(brief) {
    var date = new Date();
    var verifiyCode = secret.createVerifyCode(6);
    this.verifiyCode.brief = brief;
    this.verifiyCode.value = verifiyCode;
    this.verifiyCode.createDate = date;
    this.verifiyCode.expireDate = new Date(date.getTime() + 600000);
    return verifiyCode;
  };
  /**
   * 校验验证码
   * @param {String} brief 校验验证码的用途
   * @param {String} verifyCode 校验验证码值
   */
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
  // 返回Schema对象
  return schema;
}

/**
 * 获取UserModules
 * @param {Object|Function} mongoose 当为mongoose时同步，当为function时异步
 */
exports.getModel = function(callback) {
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
exports.getSchema = function(callback) {
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