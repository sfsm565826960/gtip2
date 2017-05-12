/**
 * 本模块用于获取历史日交易盘口数据
 */

var http = require('./http.js');
var Log = require('./log.js')({
  file: 'stock.baidu.log'
});

exports.timeline = function(){

}

exports.daybar = function(code, option, callback){
  if (typeof option === 'function') {
    callback = option;
    option = {}
  }
  option = Object.assign({
    start: '',
    count: '160'
  }, option);
  var url = 'https://gupiao.baidu.com/api/stocks/stockmonthbar?from=pc&os_ver=1&cuid=xxx&vv=100&format=json&stock_code=' + code
            + '&step=3&start=' + option.start
            + '&count=' + option.count
            + '&fq_type=no&timestamp=' + new Date().getTime();
  http.get(url, function(err, body, response){
    if (err) {
      callback(err);
    } else {
      try {
        var json = JSON.parse(body);
        if (json.errorNo === 0) {
          
        } else {
          callback(json.errorMsg);
        }
      } catch (error) {
        Log.w(error + '\n' + body, true);
        callback(error);
      }
    }
  })
}
