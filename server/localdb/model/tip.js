function TipSchema (mongoose) {
  var Types = mongoose.Schema.Types;
  var schema = new mongoose.Schema({
    text: Types.String,
    type: { type: Types.String, enum: ['trend', 'turn', 'none'], default: 'none' }, // 提醒类型：趋势、转折、其他
    valuation: { type: Types.String, enum: ['good', 'bad', 'none'], default: 'none'}, // 好坏类型：好消息、坏消息、其他
    params: Types.Mixed,
    date: Types.Date, // 创建日期
    from: Types.String, // 消息来源
    receivers: [{ type: Types.ObjectId, ref: 'User' }] // 接收者
  });
  // 添加索引
  schema.index({mail: 1}, {unique: true});
  schema.index({token: 1}, {unique: true});
  schema.index({mail: 1, password: 1});
  // 添加方法
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