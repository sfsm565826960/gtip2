/**
 * 此模块用于Http的Get和Post请求
 */
var request = require('request').defaults({
  pool: { maxSockets: 50 },
});
var iconv = require('iconv-lite');

/**
 * 获取Charset，仅GBK，GB2313，UTF8有效，
 * 若为空或其他编码，默认返回UTF8
 */
var getCharset = function (response) {
  var contentType = (response.headers || {})['content-type'];
  // console.log(contentType);
  if (!contentType) {
    return 'UTF8';
  } else {
    var charset = contentType.replace(/ /g, '').match(/charset=([\w-\d]+)/i);
    if (charset && charset.length > 1) {
      return charset[1];
    } else {
      return 'UTF8';
    }
  }
}

/**
 * GET请求
 * @param {String} url 请求的URL地址
 * @param {Function} callback 请求回调函数，function(err, body, response)
 */
var get = function(url, callback) {
  request.get({
    url: url,
    encoding: null,
    timeout: 15000
  }, function(error, response, body) {
    if (error) {
      if (error.code === 'ETIMEOUT') {
        console.warn('request ' + url + ' Timeout. Retry ...');
        get(url, callback);
      } else {
        callback(error, body, response);
      }
    } else {
      callback(null, iconv.decode(body, getCharset(response)));
    }
  })
}

/**
 * POST请求
 * @param {String} url 请求的URL地址
 * @param {Object} data 发送的数据（JSON）
 * @param {Function} callback 请求回调函数，function(err, body, response)
 */
var post = function(url, data, callback) {
  request.post({
    url: url,
    form: data,
    encoding: null,
    timeout: 15000
  }, function(error, response, body) {
    if (error) {
      if (error.code === 'ETIMEOUT') {
        console.warn('request ' + url + ' Timeout. Retry ...');
        get(url, callback);
      } else {
        callback(error, body, response);
      }
    } else {
      callback(null, iconv.decode(body, getCharset(response)));
    }
  })
}

module.exports = {
  get: get,
  post: post
};