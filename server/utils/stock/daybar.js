/**
 * 获取历史每日交易数据
 */
var http = require('../http.js');
var stockLib = require('./lib.js');
var Log = require('../log.js')({
  file: 'stock.daybar.log'
});

function parseDaybar(list, callback){
  var data = {
    date: [],
    kline: [],
    macd: [],
    kdj: {
      k: [],
      d: [],
      j: []
    }
  }
  var oMacd = null;
  var oKdj = null;
  // 载入数据
  for (var index = 0; index < list.length; index++) {
    data.date.push(list[index].date.toString().replace(/(\w{4})(\w{2})(\w{2})/, '$1/$2/$3'));
    data.kline.push([
      list[index].kline.open,
      list[index].kline.close,
      list[index].kline.low,
      list[index].kline.high
    ]);
    oMacd = stockLib.calcMacd(list[index].kline.close, oMacd);
    data.macd.push(JSON.parse(JSON.stringify(oMacd)));
    oKdj = stockLib.calcKdj(list[index].kline.close, oKdj);
    data.kdj.k.push(oKdj.k);
    data.kdj.d.push(oKdj.d);
    data.kdj.j.push(oKdj.j);
  }
  callback(null, data);
}

/**
 * @param {String} code 股票代码
 * @param {Number} count 数据数
 * @param {String} start 开始时间，如：20151216
 * @param {Function} callback function(err, data){}  data=[]
 */
module.exports = function (code, count, start, callback) {
  if (typeof count === 'function') {
    callback = count;
    count = '';
    start = '';
  } else if (typeof start === 'function') {
    callback = start;
    start = '';
  }
  if(!start)start = '';
  if(!count || count < 0) count = 60;
  var url = 'https://gupiao.baidu.com/api/stocks/stockdaybar?from=pc&os_ver=1&cuid=xxx&vv=100&format=json&step=3&fq_type=no'
    + '&stock_code=' + code + '&start=' + start + '&count=' + count + '&timestamp' + new Date().getTime();
  if (typeof callback !== 'function') callback = function () { };
  http.get(url, function (err, body, response) {
    if (err) {
      Log.e(err, true);
      callback(err);
    } else {
      try {
        var json = JSON.parse(body);
        if (json.errorNo == 0) {
          parseDaybar((json.mashData || []).reverse(), callback);
        } else {
          callback(json.errorMsg || '获取数据失败');
        }
      } catch (err) {
        Log.e(err, true);
        callback(err)
      }
    }
  });
}
