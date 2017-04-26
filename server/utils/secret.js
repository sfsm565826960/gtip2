var crypto = require('crypto');
var CONF = require('../config').APP;
var keyBuffer = CONF.key;

exports.createToken = function(mail) {
  if (!mail) return null;
  var hmac = crypto.createHmac('sha1', keyBuffer);
  hmac.update(mail);
  hmac.update(new Date().getTime().toString());
  hmac.update(Math.random().toString());
  return hmac.digest('hex');
}

exports.createVerifyCode = function(length) {
  if (!length || length < 4) length = 4;
  var hmac = crypto.createHmac('sha1', keyBuffer);
  var index = function(){ return Math.floor(Math.random() * 16)}
  hmac.update(new Date().getTime().toString());
  hmac.update(Math.random().toString());
  var src = hmac.digest('hex');
  var value = '';
  while(length-->0){ value += src[index()] }
  return value;
}

// test
// console.log(exports.createToken('test@test.com'));
// console.log(exports.createVerifyCode());
// console.log(exports.createVerifyCode(6));