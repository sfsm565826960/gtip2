/**
 * 该模块用于实现用户登录、注册、退出、在线状态切换
 */

var express = require('express');
var router = express.Router();
var User = null;
var secret = require('../utils/secret');
var push = require('../utils/push');
var mail = require('../utils/mail');
var Log = require('../utils/log')({
  file: 'api.user.log'
});

// 连接数据库并加载User模型
require('../localdb/model/user').getUserModel((err, model) => {
  if (err) {
    Log.e(err, true, true);
  } else {
    User = model;
    Log.i('User Model Loaded', true);
  }
});

// 检查User模型是否加载成功
router.use((req, res, next) => {
  if (User === null) {
    res.json({code: 'fail', detail: 'User Model is null'});
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
  var data = {code: 'fail', detail: err.message, errors: {}}
  for(key in err.errors) {
    data.errors[key] = err.errors[key].message;
  }
  return data;
}

router.post('/login', (req, res) => {
  User.findOne({ $or: [
    {
      mail: req.body.mail,
      password: secret.createPassword(req.body.password)
    },
    {
      state: { $ne: 'logout' },
      'settings.autoLogin': true,
      token: req.body.token
    }
  ]}, (err, user) => {
    if (err) {
      Log.e(err, true);
      res.json({code: 'fail', detail: err.message || err})
    } else if (user === null) {
      res.json({code: 'fail', detail: 'Mail or Password or Token is wrong'});
    } else {
      var date = new Date();
      var token = secret.createToken(user.mail);
      user.token = token;
      user.lastLogin = date;
      user.habit.loginTime.push(date);
      user.state = 'online';
      if (typeof req.body.autoLogin === 'boolean') {
        user.settings.autoLogin = req.body.autoLogin;
      }
      if (req.body.clientId &&
          req.body.clientId.length > 0 &&
          user.clientId !== req.body.clientId) {
        user.clientId = req.body.clientId;
        // 重新设置标签
        var tagList = [].concat(user.concern.stockId);
        push.setClientTag(user.clientId, tagList)
      }
      user.save().then(doc => {
        res.json({code: 'ok', detail: 'Login Success', data: {
          user: {
            token: doc.token,
            nickname: doc.nickname,
            settings: doc.settings,
            concern: doc.concern,
            authority: doc.authority
          }
        }});
      }).catch(err => {
        Log.e(err, true);
        res.json(errMsg(err))
      });
    }
  })
});

router.post('/register', (req, res) => {
  // 检查用户是否存在
  User.findOne({ mail: req.body.mail }, (err, result) => {
    if (err) {
      Log.e(err, true);
      res.json({code: 'fail', detail: err.message || err});
    } else if (result !== null) {
      res.json({code: 'fail', detail: 'Mail Exist'});
    } else {
      if (!req.body.password || req.body.password.length < 6) {
        res.json({code: 'fail', detail: 'User validation failed', errors: {
          password: 'Password Min-length is six'
        }});
        return;
      } else {
        req.body.password = secret.createPassword(req.body.password);
      }
      var token = secret.createToken(req.body.mail);
      var date = new Date(); 
      var user = new User({
        mail: req.body.mail,
        nickname: req.body.nickname,
        password: req.body.password,
        token: token,
        lastLogin: date,
        clientId: req.body.clientId,
        state: 'online'
      });
      user.habit.loginTime.push(date);
      user.save().then(doc => {
        res.json({code: 'ok', detail: 'Register Success', data: {
          user: {
            token: doc.token
          }
        }});
      }).catch(err => {
        Log.e(err, true);
        res.json(errMsg(err));
      });
    }
  });
});

router.post('/logout', (req, res) => {
  User.findOne({
    token: req.body.token,
    state: {$ne: 'logout'}
  }, (err, user) => {
    if (err) {
      Log.e(err, true);
      res.json({code: 'fail', detail: err.message || err});
    } else if (user === null) {
      res.json({code: 'fail', detail: 'User not exist or User had logout'});
    } else {
      if (req.body.offline) {
        user.state = 'offline';
      } else {
        user.state = 'logout';
      }
      user.save().then(doc => {
        res.json({code: 'ok', detail: 'User logout success'});
      }).catch(err => {
        Log.e(err, true);
        res.json(errMsg(err));
      })
    }
  })
});

router.post('/forget', (req, res) => {
  User.findOne({
    mail: req.body.mail
  }, (err, user) => {
    if (err) {
      Log.e(err, true);
      res.json({code: 'fail', detail: err.message || err});
    } else if (user === null) {
      res.json({code: 'fail', detail: 'Mail not exist'});
    } else {
      var expired = new Date().getTime();
      user.verifiyCode.brief = 'Forget password';
      user.verifiyCode.value = secret.createVerifyCode(6);
      user.verifiyCode.createDate = new Date();
      user.verifiyCode.expireDate = new Date(expired + 600000);
      user.save().then(doc => {
        mail.send(
          doc.mail,
          '【GTip】忘记密码申请。若不是您的操作，请忽略本邮件。',
          '尊贵的' + doc.nickname + '，\n' +
          '您好，感谢您使用我们的产品GTip。下面六位验证码可帮您修改密码重新登录，请妥善保管，不要告知他人。\n' +
          '\n验证码：' + doc.verifiyCode.value + '\n' +
          '以上验证码[十分钟]内有效，请尽快输入。\n\n' +
          '如有任何疑问和帮助，欢迎随时联系我们。\n' +
          'GTip产品开发组',
          function(err, info) {
            if (err) {
              Log.e(err, true);
              res.json({code: 'fail', detail: 'Send forget application mail fail'});
            } else {
              Log.i(info);
              res.json({code: 'ok', detail: 'Send forget application mail success'});
            }
          });
      }).catch(err => {
        Log.e(err, true);
        res.json(errMsg(err));
      });
    }
  })
});

module.exports = router;
