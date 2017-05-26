/**
 * 本模块用于获取交易列表
 */

var http = require('../http.js');
var Log = require('../log.js')({
  file: 'stock.bigTrade.log'
});

/**
 * 解析大单数据
 */
function parseBigTrade(body, callback) {
  var trade_item_list = null; // 交易数据
  var trade_INVOL_OUTVOL = [0, 0]; // 交易统计
  var tradeList = []; // 存放大单数据
  eval(body); // 执行解析
  if (trade_item_list) {
    var date = new Date().toISOString().replace(/([\d-]+).+/, '$1') + ' ';
    for(var i = 0; i < trade_item_list.length; i++) {
      tradeList.push({
        date: new Date(date + trade_item_list[i][0]),
        count: parseInt(trade_item_list[i][1]),
        price: parseFloat(trade_item_list[i][2]),
        type: trade_item_list[i][3] === 'UP'?'buy':'sale'
      });
    }
    callback(null, {
      list: tradeList,
      totalBuyCount: trade_INVOL_OUTVOL[0],
      totalSaleCount: trade_INVOL_OUTVOL[1]
    });
  } else {
      callback(null, {
        list: [],
        totalBuyCount: 0,
        totalSaleCount: 0
      });
  }
}

/**
 * @param {String} code 股票代码
 * @param {Number} num 获取大单数目
 * @param {Function} callback function(err, data){}  data=[]
 */
module.exports = function (code, num, callback) {
  var url = 'http://vip.stock.finance.sina.com.cn/quotes_service/view/CN_TransListV2.php?symbol=' + code + '&num=' + num + '&rn=' + new Date().getTime();
  if (typeof callback !== 'function') callback = function () { };
  http.get(url, function (err, body, response) {
    if (err) {
      Log.e(err, true);
      callback(err);
    } else {
      parseBigTrade(body, callback);
    }
  });
}