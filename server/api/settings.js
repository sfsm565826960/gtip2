/**
 * 该模块用于用户信息和配置的修改
 */

var express = require('express');
var router = express.Router();
var User = null;
var Log = require('../utils/log')({
  file: 'api.settings.log'
});

// 检查路由是否畅通
router.get('/', (req, res) => {
  res.send('router /api/settings test success');
});

/**
 * @api {post} /api/settings/notifications 通知设置
 * @apiName NotificationsSetting
 * @apiGoup setting
 * 
 * @apiParam {String} token 用户令牌
 * @apiParam {JSONString} settings 配置信息(receiveNotify,arriveSound,arriveVibrate,voiceBroadcast)
 */
router.post('/notifications', (req, res) => {
  // 检查参数
  if (!req.body.settings || req.body.settings.length === 0) {
    res.json({ state: 'fail', detail: '配置信息不能为空' });
    return;
  }
  // 获取配置信息
  var settings;
  try{
    settings = JSON.parse(req.body.settings);
  } catch(err) {
    Log.e(err, true);
    res.json({state: 'fail', detail: '配置信息格式无效', error: err.message || err});
    return;
  }
  // 修改设置
  User.getUserByToken(req.body.token, (err, user) => {
    if (err) {
      res.json(err);
    } else {
      ['receiveNotify', 'arriveSound', 'arriveVibrate', 'voiceBroadcast'].forEach(key => {
        if(settings[key] !== undefined) {
          user.settings.notifications[key] = settings[key];
        }
      })
      user.save().then(doc => {
        res.json({ state: 'ok', detail: '修改提醒设置成功', data: doc.settings });
      }).catch(err => {
        Log.e(err, true);
        res.json(errMsg(err));
      });
    }
  })
});

module.exports = function(models) {
  User = models.User;
  return router;
}