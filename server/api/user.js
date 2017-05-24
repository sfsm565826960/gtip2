/**
 * 该模块用于实现用户登录、注册、退出、在线状态切换
 */

var express = require('express');
var router = express.Router();
var User = null;
var secret = require('../utils/secret');
var Push = require('../utils/push');
var mail = require('../utils/mail');
var Log = require('../utils/log')({
  file: 'api.user.log'
});

// 检查User模型是否加载成功
router.use((req, res, next) => {
  if (User === null) {
    res.json({state: 'fail', detail: 'User Model is null'});
  } else {
    next();
  }
});

// 检查路由是否畅通
router.get('/', (req, res) => {
  res.send('router /api/user test success');
});

/**
 * 通用数据库验证错误
 * @param {Object} err
 */
function errMsg(err) {
  var data = {state: 'fail', detail: err.message, errors: {}}
  for(key in err.errors) {
    data.errors[key] = err.errors[key].message;
  }
  return data;
}

/**
 * 通用用户数据返回
 * @param {Object} user 用户数据模型
 * @param {Object} 通用用户数据返回
 */
function userInfo(user) {
  return {
    info: {
      mail: user.mail,
      token: user.token,
      nickname: user.nickname,
      headimg: user.headimg
    },
    settings: user.settings,
    concern: user.concern,
    authority: user.authority
  }
}

/**
 * @api {post} /api/user/login 用户登录
 * @apiName UserLogin
 * @apiGroup user
 * 
 * @apiParam {String} mail 用户邮箱（必填1）
 * @apiParam {String{6..}} password 用户密码，长度不得小于6（必填1）
 * @apiParam {String} token 用户令牌（必填2）
 * @apiParam {String} clientId 推送ID
 * @apiParam {String="true","false"} autoLogin 自动登录（true|false），若无该参数则保持默认
 */
router.post('/login', (req, res) => {
  User.findOne({ $or: [
    { // 通过邮箱密码登录
      mail: req.body.mail,
      password: secret.createPassword(req.body.password)
    },
    { // 通过令牌自动登录，要求开启自动登录
      state: { $ne: 'logout' },
      'settings.autoLogin': true,
      token: req.body.token
    },
    { // 通过令牌登录，要求登录不过期
      state: { $ne: 'logout' },
      'settings.autoLogin': false,
      token: req.body.token,
      loginExpired: { $gt: new Date() }
    }
  ]}, (err, user) => {
    if (err) {
      Log.e(err, true);
      res.json({state: 'fail', detail: err.message || err})
    } else if (user === null) {
      res.json({state: 'fail', detail: '邮箱/密码/令牌无效'});
    } else {
      switch(req.body.autoLogin) { // 可选
        case 'true':
          user.settings.autoLogin = true;
          break;
        case 'false':
          user.settings.autoLogin = false;
          user.settings.gestures = ''; // 手势密码仅在autoLogin为true时可用
          break;
      }
      if (req.body.clientId &&
          req.body.clientId.length > 0 &&
          user.clientId !== req.body.clientId) {
        user.clientId = req.body.clientId;
      }
      user.signLogin();
      user.save().then(doc => {
        // 重新设置标签
        if (doc.clientId && doc.clientId.length > 0) {
          var tagList = [].concat(doc.concern.stockId);
          Push.setClientTag(doc.clientId, tagList);
        }
        res.json({state: 'ok', detail: 'Login Success', data: userInfo(doc)});
      }).catch(err => {
        Log.e(err, true);
        res.json(errMsg(err))
      });
    }
  })
});

/**
 * @api {post} /api/user/register 用户注册
 * @apiName UserRegister
 * @apiGroup user
 * 
 * @apiParam {String} mail 用户邮箱
 * @apiParam {String{2..}} nickname 用户昵称，长度不能小于2
 * @apiParam {String{6..}} password 用户密码，长度不能小于6
 * @apiParam {String} clientId 推送ID
 */
router.post('/register', (req, res) => {
  // 检查用户是否存在
  User.findOne({ mail: req.body.mail }, (err, result) => {
    if (err) {
      Log.e(err, true);
      res.json({state: 'fail', detail: err.message || err});
    } else if (result !== null) {
      res.json({state: 'fail', detail: 'Mail Exist'});
    } else {
      if (!req.body.password || req.body.password.length < 6) {
        res.json({state: 'fail', detail: 'User validation failed', errors: {
          password: 'Password Min-length is six'
        }});
        return;
      }
      req.body.password = secret.createPassword(req.body.password);
      var user = new User({
        mail: req.body.mail,
        nickname: (req.body.nickname || '').trim(),
        password: req.body.password,
        clientId: req.body.clientId
      });
      user.signLogin();
      user.save().then(doc => {
        if (doc.clientId && doc.clientId.length > 0) {
          var tagList = [].concat(doc.concern.stockId);
          Push.setClientTag(doc.clientId, tagList);
        }
        res.json({state: 'ok', detail: 'Register Success', data: userInfo(doc)});
      }).catch(err => {
        Log.e(err, true);
        res.json(errMsg(err));
      });
    }
  });
});

/**
 * @api {post} /api/user/logout 用户离线/退出
 * @apiName UserLogout
 * @apiGroup user
 * 
 * @apiParam {String} token 用户令牌
 * @apiParam {String="true","false"} offline 若为true则用户离线（例如APP进入后台）
 * @apiParam {String="true","false"} isExit 若为true则用户退出程序
 * 
 * @apiDescription 说明：
 * 若offline为false，则退出用户，下次启动程序时要求用户使用账户密码登录；
 * 若offline为true，且isExit为true，则退出程序，下次启动时取决autoLogin进行自动登录或账户密码登录
 * 若offline为true，且isExit为false，则进入后台，下次启动时判断登录是否过期，不过期则正常使用，过期则取决于autoLogin
 */
router.post('/logout', (req, res) => {
  User.findOne({
    token: req.body.token,
    state: {$ne: 'logout'}
  }, (err, user) => {
    if (err) {
      Log.e(err, true);
      res.json({state: 'fail', detail: err.message || err});
    } else if (user === null) {
      res.json({state: 'fail', detail: '用户不存在或已退出'});
    } else {
      user.signLogout(req.body.offline === 'true', req.body.isExit === 'true');
      user.save().then(doc => {
        res.json({state: 'ok', detail: 'User logout success'});
      }).catch(err => {
        Log.e(err, true);
        res.json(errMsg(err));
      })
    }
  })
});

/**
 * @api {post} /api/user/forget 忘记密码申请
 * @apiName UserForgetPassword
 * @apiGroup user
 * 
 * @apiParam {String} mail 用户邮箱
 */
router.post('/forget', (req, res) => {
  User.findOne({
    mail: req.body.mail
  }, (err, user) => {
    if (err) {
      Log.e(err, true);
      res.json({state: 'fail', detail: err.message || err});
    } else if (user === null) {
      res.json({state: 'fail', detail: '该邮箱未注册'});
    } else {
      user.createVerifiyCode('ForgetPassword');
      user.save().then(doc => {
        mail.send(
          doc.mail,
          '【GTip】忘记密码申请。若不是您的操作，请忽略本邮件。',
          '尊贵的' + doc.nickname + '，\n' +
          '您好，感谢您使用我们的产品GTip。\n' +
          '下面[六位]验证码可帮您验证身份后修改密码，请妥善保管，不要告知他人。\n' +
          '\n验证码：' + doc.verifiyCode.value + '\n' +
          '以上验证码[十分钟]内有效，请尽快输入。\n\n' +
          '如有任何疑问和帮助，欢迎随时联系我们。\n' +
          'GTip产品开发组',
          function(err, info) {
            if (err) {
              Log.e(err, true);
              res.json({state: 'fail', detail: '发送验证码失败，请确认邮箱是否可用'});
            } else {
              Log.i(info);
              res.json({state: 'ok', detail: '验证码已经发送到您的邮箱，请查收'});
            }
          });
      }).catch(err => {
        Log.e(err, true);
        res.json(errMsg(err));
      });
    }
  })
});

/**
 * @api {post} /api/user/password 用户修改密码
 * @apiName UserResetPassword
 * @apiGroup user
 * 
 * @apiParam {String} token 用户令牌（必选1）
 * @apiParam {String} oldPassword 用户旧密码（必选1）
 * @apiParam {String} mail 用户邮箱（必选2）
 * @apiParam {String} verifiyCode 验证码（必选2）
 * @apiParam {String{6..}} newPassword 用户新密码，长度不得小于6
 * 
 */
router.post('/password', (req, res) => {
  var date = new Date();
  var brief = 'ForgetPassword';
  req.body.oldPassword = secret.createPassword(req.body.oldPassword);
  User.findOne({$or: [
    {
      token: req.body.token,
      password: req.body.oldPassword,
      state: 'online',
      loginExpired: {$gt: date}
    },
    {
      mail: req.body.mail,
      'verifiyCode.brief': brief
    }
  ]}, function(err, user) {
    if (err) {
      Log.e(err, true);
      res.json({state: 'fail', detail: err.message || err});
    } else if (user === null) {
      res.json({state: 'fail', detail: '令牌或邮箱不存在'});
    } else {
      // 检查验证码
      if (req.body.verifiyCode && req.body.verifiyCode.length > 0) {
        if (!user.checkVerifiyCode(brief, req.body.verifiyCode)) {
          res.json({state: 'fail', detail: '验证码错误'});
          return;
        }
      }
      // 检测新密码格式
      if (!req.body.newPassword || req.body.newPassword.length < 6) {
        res.json({state: 'fail', detail: '密码格式无效', errors: {
          password: 'Password Min-length is six'
        }});
        return;
      }
      // 修改密码
      user.password = secret.createPassword(req.body.newPassword);
      user.signLogout(false, true);
      user.save().then(doc => {
        res.json({state: 'ok', detail: '密码修改成功，请重新登录'});
      }).catch(err => {
        res.json(errMsg(err));
      })
    }
  })
});

/**
 * @api {post} /api/user/nickname 用户修改密码
 * @apiName UserResetNickname
 * @apiGoup user
 * 
 * @apiParam {String} token 用户令牌
 * @apiParam {String{2..}} nickname 用户新昵称，要求至少2个字符
 */
router.post('/nickname', (req, res) => {
  // 检查参数
  if (!req.body.nickname || req.body.nickname.length < 2) {
    res.json({ state: 'fail', detail: '新昵称无效，要求至少2个字符' });
    return;
  }
  // 修改昵称
  User.getUserByToken(req.body.token, (err, user) => {
    if (err) {
      res.json(err);
    } else {
      user.nickname = req.body.nickname;
      user.save().then(doc => {
        res.json({state: 'ok', detail: '修改昵称成功', data: userInfo(doc)});
      }).catch(err => {
        Log.e(err, true);
        res.json(errMsg(err));
      })
    }
  })
});

/**
 * @api {post} /api/user/headimg 用户修改头像
 * @apiName UserResetHeadimg
 * @apiGoup user
 * 
 * @apiParam {String} token 用户令牌
 * @apiParam {String} headimg 用户新头像URL地址
 */
router.post('/headimg', (req, res) => {
  // 检查参数
  if (!req.body.headimg || req.body.headimg.length === 0) {
    res.json({ state: 'fail', detail: '新头像地址不能为空' });
    return;
  }
  // 修改头像
  User.getUserByToken(req.body.token, (err, user) => {
    if (err) {
      res.json(err);
    } else {
      user.headimg = req.body.headimg;
      user.save().then(doc => {
        res.json({state: 'ok', detail: '修改头像成功', data: userInfo(doc)});
      }).catch(err => {
        Log.e(err, true);
        res.json(errMsg(err));
      })
    }
  })
});

module.exports = function(models) {
  User = models.User;
  return router;
}
