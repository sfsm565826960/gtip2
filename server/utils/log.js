module.exports = function (config) {
  var fs = require('fs');
  var nodemailer = require('nodemailer');
  var path = require('path');
  var CONFIG = require('../config.js');
  var CONF_MAIL = CONFIG.MAIL;
  var errList = []; // 存放错误列表，用于防止记录重复的错误
  var LOG = {
    PATH: path.resolve(CONFIG.SERVER_PATH, (config.path || './logs/')),
    FILE: config.file || 'common.log',
    t: function (msg) {
      var dNum = function (v) { if (v > 9) { return v.toString(); } else { return '0' + v.toString(); } }
      var date = new Date();
      var dateStr = dNum(date.getMonth() + 1) + '-'
        + dNum(date.getDate()) + ' '
        + dNum(date.getHours()) + ":"
        + dNum(date.getMinutes()) + ":"
        + dNum(date.getSeconds());
      var text = msg.stack || msg;
      return '[' + dateStr + "]\n" + text + "\n";
    },
    d: function (msg, saveToFile, sendToMail) {
      var text = '\n[log] ' + this.t(msg);
      console.log(text);
      if (saveToFile) this.f(text);
      if (sendToMail) this.m(text, msg);
    },
    e: function (msg, saveToFile, sendToMail) {
      var text = '\n[error] ' + this.t(msg);
      console.error(text);
      if (saveToFile) this.f(text);
      if (sendToMail) this.m(text, msg);
    },
    i: function (msg, saveToFile, sendToMail) {
      var text = '\n[info] ' + this.t(msg);
      console.info(text);
      if (saveToFile) this.f(text);
      if (sendToMail) this.m(text, msg);
    },
    w: function (msg, saveToFile, sendToMail) {
      var text = '\n[warn] ' + this.t(msg);
      console.warn(text);
      if (saveToFile) this.f(text);
      if (sendToMail) this.m(text, msg);
    },
    f: function (text) {
      fs.appendFile(path.resolve(this.PATH, this.FILE), text, function (err) {
        if (err) { LOG.e(err.stack || err); }
      });
    },
    m: function (text, msg) {
      if (CONF_MAIL.enable) {
        if (msg && msg.stack) {
          for (var n = 0; n < errList.length; n++) {
            if (msg.stack === errList[n]) {
              this.w('重复错误不再发送邮件');
              return false; // 避免发送重复错误
            }
          }
          errList.push(msg.stack);
        }
        // 开始发送邮件
        try {
          var transporter = nodemailer.createTransport({
            host: CONF_MAIL.host,
            auth: {
              user: CONF_MAIL.user,
              pass: CONF_MAIL.pwd
            }
          });
          transporter.sendMail({
            from: CONF_MAIL.user,
            to: CONF_MAIL.admin,
            subject: 'GTip重要日志信息',
            text: text,
            html: text.replace(/\n/g, "<br />")
          }, function (error, info) {
            if (error) {
              LOG.e(error.stack || error, true);
            } else {
              LOG.i('Message send:' + info.response);
            }
            transporter.close();
          });
        } catch (error) {
          LOG.e(error.stack || error, true);
        }
      } else {
        this.w('不支持邮件发送');
        return false;
      }
    }
  }
  return LOG;
}