var GetTui = require('./GT.push');
var _CONF = require('../../config');
var CONF = _CONF.PUSH;
var Log = require('../log')({
  file: 'push.log'
});

var Target = require('./getui/Target');
var SingleMessage = require('./getui/message/SingleMessage');
var ListMessage = require('./getui/message/ListMessage');
var AppMessage = require('./getui/message/AppMessage');

var DEFAULT_MESSAGE_OPTIONS = {
  appId: CONF.appId,
  appKey: CONF.appKey,
  title: _CONF.APP.name,
  logo: _CONF.APP.logo,
  isRing: false,
  isVibrate: false,
  transmissionType: 2 // 1 立即启动应用，2 不启动应用
};

var DEFAULT_PUSH_OPTIONS = {
  pushNetWorkType: 0, // 0 全部，1 仅wifi
  isOffline: true,
  offlineExpireTime: 1000 * 60 * 60 * 24 // 离线时间1天
};

var gt = new GetTui(CONF.host, CONF.appKey, CONF.masterSecret);

exports.Target = Target;
exports.NotificationTemplate = require('./getui/template/NotificationTemplate');
exports.TransmissionTemplate = require('./getui/template/TransmissionTemplate');
exports.LinkTemplate = require('./getui/template/LinkTemplate');
exports.SingleMessage = SingleMessage;
exports.ListMessage = ListMessage;
exports.AppMessage = AppMessage;

exports.Notification = function(text, title, options) {
  if (typeof title === 'object') options = title;
  if (typeof text === 'object') options = text;
  options = Object.assign(
    {}, DEFAULT_MESSAGE_OPTIONS, options,
    (typeof text === 'string'?{text:text}:{}),
    (typeof title === 'string'?{title:title}:{})
  );
  console.log(options);
  return new exports.NotificationTemplate(options);
};

exports.Link = function(url, text, title, options) {
  if (typeof title === 'object') options = title;
  if (typeof text === 'object') options = text;
  options = Object.assign(
    {url:url}, DEFAULT_MESSAGE_OPTIONS, options,
    (typeof text === 'string'?{text:text}:{}),
    (typeof title === 'string'?{title:title}:{})
  );
  console.log(options);
  return new exports.LinkTemplate(options);
};

exports.Transmission = function(content, options) {
  options = Object.assign({transmissionContent:content}, DEFAULT_MESSAGE_OPTIONS, options);
  console.log(options);
  return new exports.TransmissionTemplate(options);
};

/**
 * 按Id推送
 * @param {Object} template template or SingleMessage
 * @param {String|Object} clientId string or Target
 * @param {Object|Function} options options or callback
 * @param {Function} callback function(err, res){}
 */
exports.pushMessageToSingle = function(template, clientId, options, callback) {
  if (!template || !clientId) return;
  if (typeof options === 'function') {
    callback = options;
    options = {};
  } else if (typeof callback !== 'function') {
    callback = function(){}
  }
  options = Object.assign({data:template}, DEFAULT_PUSH_OPTIONS, options);
  var message = template instanceof SingleMessage ? template : new SingleMessage(options);
  var target = clientId instanceof Target ? target : new Target({
    appId: CONF.appId,
    clientId: clientId
  });
  gt.pushMessageToSingle(message, target, function(err, res) {
    if (err !== null && err.exception !== null) {
      Log.e(err, true);
      // 发送异常，重传
      var requestId = err.exception.requestId;
      gt.pushMessageToSingle(message, target, requestId, function(err, res) {
        if (err) {
          Log.e(err, true);
          callback(err);
        } else {
          Log.i('pushMessageToSingle: ' + JSON.stringify(res));
          callback(err, res);
        }
      });
    } else {
      Log.i('pushMessageToSingle: ' + JSON.stringify(res));
      callback(err, res);
    }
  });
};

/**
 * 按列表推送
 * @param {Object} template template or ListMessage
 * @param {Array} clientList string or Target
 * @param {Object|Function} options options or callback
 * @param {Function} callback function(err, res){}
 */
exports.pushMessageToList = function(template, clientList, options, callback) {
  if (!template || !clientList || clientList.length === 0) return;
  if (typeof options === 'function') {
    callback = options;
    options = {};
  } else if (typeof callback !== 'function') {
    callback = function(){}
  }
  options = Object.assign({data:template}, DEFAULT_PUSH_OPTIONS, options);
  var message = template instanceof ListMessage ? template : new ListMessage(options);
  // 任务名称
  var taskName = message.data.title || 'task' + new Date().getTime();
  gt.getContentId(message, taskName, function(err, contentId) {
    if (err) {
      Log.e(err, true);
      callback(err);
    } else {
      Log.i('contentId: ' + contentId);
      var targets = [];
      for(var i = 0; i < clientList.length; i++) {
        if (clientList[i] instanceof Target) {
          targets.push(clientList[i]);
        } else {
          targets.push(new Target({
            appId: CONF.appId,
            clientId: clientList[i]
          }));
        }
      }
      gt.pushMessageToList(contentId, targets, function(err, res) {
        if (err) {
          Log.e(err, true);
          callback(err);
        } else {
          Log.i('pushMessageToList: ' + JSON.stringify(res));
          callback(null, res);
        }
      });
    }
  });
};

/**
 * 按标签/地区/系统进行推送
 * @param {Object} template template or AppMessage
 * @param {Object|Function} options options or callback
 * @param {Function} callback function(err, res){}
 */
exports.pushMessageToApp = function(template, options, callback) {
  if (!template) return;
  if (typeof options === 'function') {
    callback = options;
    options = {};
  } else if (typeof callback !== 'function') {
    callback = function(){}
  }
  options = Object.assign({
    data: template,
    appIdList: [CONF.appId],
    phoneTypeList: ['ANDROID', 'IOS'],
    speed: 1000
  }, DEFAULT_PUSH_OPTIONS, options);
  var message = template instanceof AppMessage ? template : new AppMessage(options);
  var taskName = message.data.title || 'task' + new Date().getTime();
  gt.pushMessageToApp(message, taskName, function(err, res) {
    if (err) {
      Log.e(err, true);
      callback(err);
    } else {
      Log.i('pushMessageToApp: ' + JSON.stringify(res));
      callback(null, res);
    }
  });
};

/**
 * 设置用户标签
 * @param {String} clientId
 * @param {Array} tagList
 * @param {Function} callback function(err, res){}
 */
exports.setClientTag = function(clientId, tagList, callback) {
  gt.setClientTag(CONF.appId, clientId, tagList, function(err, res) {
    if (err) {
      Log.e(err, true);
      typeof callback === 'function' && callback(err);
    } else {
      Log.i('setClientTag: ' + JSON.stringify(res));
      typeof callback === 'function' && callback(null, res);
    }
  });
}

/**
 * 获取用户标签
 * @param {String} clientId
 * @param {Function} callback function(err, res){}
 */
exports.getClientTag = function(clientId, callback) {
  gt.getUserTags(CONF.appId, clientId, function(err, res) {
    if (err) {
      Log.e(err, true);
      typeof callback === 'function' && callback(err);
    } else {
      Log.i('getClientTag: ' + JSON.stringify(res));
      typeof callback === 'function' && callback(null, res);
    }
  });
}