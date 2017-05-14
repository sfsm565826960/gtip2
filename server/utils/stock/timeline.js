/**
 * 本模块用于获取当日实时数据
 */

var http = require('../http.js');
var Log = require('../log.js')({
  file: 'stock.timeline.log'
});
var lib = require('./lib.js');

function parseTimeline(timeLine, callback) {
  try {
    var data = [];
    var index = 0, len = timeLine.length;
    var tl = {}, oMacd = null, oKdj = null;
    // 忽略9:15~9:30这段时间
    while(index < len && timeLine[index].time < 93000000) index++;
    // 载入数据
    while(index < len) {
      tl = timeLine[index];
      oMacd = lib.calcMacd(tl.price, oMacd);
      oKdj = lib.calcKdj(tl.price, oKdj);
      var timeStr = tl.time.toString().replace(/(\w{1,2})(\w{2})0{5}/, '$1:$2');
      var dateStr = tl.date.toString().replace(/(\w{4})(\w{2})(\w{2})/, '$1/$2/$3');
      data.push({
        date: new Date(dateStr + ' ' + timeStr), // 时间轴
        time: timeStr, // 时间
        price: tl.price, // 价格
        volume: tl.volume,    // 成交量
        avgPrice: tl.avgPrice, // 平均价格
        netChangeRatio: tl.netChangeRatio, // 跌涨幅
        macd: { // macd
          diff: oMacd.diff,
          dea: oMacd.dea,
          macd: oMacd.macd
        },
        kdj: { // kdj
          k: oKdj.k,
          d: oKdj.d,
          j: oKdj.j
        }
      })
      index++; //最重要
    }
    callback(null, data);
  } catch (err) {
    callback(err);
  }
}

/**
 * @param {String} code
 * @param {Function} callback function(err, data){}  data=[]
 */
module.exports = function (code, callback) {
  var url = 'https://gupiao.baidu.com/api/stocks/stocktimeline?from=pc&os_ver=1&cuid=xxx&vv=100&format=json'
    + '&stock_code=' + code + '&timestamp' + new Date().getTime();
  if (typeof callback !== 'function') callback = function(){};
  http.get(url, function (err, body, response) {
    if (err) {
      Log.e(err, true);
      callback(err);
    } else {
      try {
        var json = JSON.parse(body);
        if (json.errorNo == 0) {
          parseTimeline(json.timeLine, callback);
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