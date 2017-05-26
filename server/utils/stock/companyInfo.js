/**
 * 本模块用于获取股票公司信息
 */
var http = require('../http.js');
var Log = require('../log.js')({
  file: 'stock.companyInfo.log'
});

function parseCompanyInfo(info, callback) {
  var lastfive = 0; // 过去5个交易日平均每分钟成交量
  var totalcapital = 0; //总股本
  var currcapital = 0; //流通股本，单位为股，1手=100股
  var fourQ_mgsy = 0;//最近四个季度每股收益和
  var lastyear_mgsy = 0;//前一年每股收益和
  var mgjzc = 0;//最近报告的每股净资产
  var profit = 0;//最近年度净利润
  var profit_four = 0;//最近四个季度净利润
  eval(info);
  callback(null, {
    currcapital: currcapital * 10000,
    totalcapital: totalcapital * 10000,
    lastfive: lastfive,
    fourQ_mgsy: fourQ_mgsy,
    lastyear_mgsy: lastyear_mgsy,
    mgjzc: mgjzc,
    profit: profit,
    profit_four: profit_four
  })
}

/**
 * @param {String} code
 * @param {Function} callback function(err, data){}  data=[]
 */
module.exports = function (code, callback) {
  var url = 'http://finance.sina.com.cn/realstock/company/' + code + '/jsvar.js';
  if (typeof callback !== 'function') callback = function(){};
  http.get(url, function (err, body, response) {
    if (err) {
      Log.e(err, true);
      callback(err);
    } else {
      parseCompanyInfo(body, callback);
    }
  });
}