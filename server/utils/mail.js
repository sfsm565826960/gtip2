var nodemailer = require('nodemailer');
var CONF_MAIL = require('../config').MAIL;
var Log = require('./log')({
  file: 'mail.log'
});

/**
 * 发送邮件
 * @param {String|Array} toMail string or Array
 * @param {String} title
 * @param {String} text
 * @param {Function} callback function(err, info){}
 */
exports.send = function (toMail, title, text, callback) {
  if (typeof callback !== 'function') callback = function(){}
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
      to: toMail,
      subject: title,
      text: text,
      html: text.replace(/\n/g, "<br />")
    }, function (error, info) {
      if (error) {
        Log.e(error.stack || error, true);
        callback(error);
      } else {
        Log.i('Message send:' + info.response);
        callback(null, info);
      }
      transporter.close();
    });
  } catch (error) {
    Log.e(error.stack || error, true);
  }
}