/**
 * 用于分析交易情况
 * 单笔大单买入、单笔大单卖出、1分钟内疯狂买入、1分钟内疯狂卖出
 */
var CompanyInfo = require('../../utils/stock/companyInfo');

const BIG_TRADE_MONEY = 150 * 10000;//逐单交易金额超过该值视为大单
const BIG_TRADE_CAPITAL_RATE = 0.001;//逐单交易数量比例超过该值视为大单

const TOTAL_BIG_TRADE_MONEY = 800 * 10000;//一分钟内交易金额超过该值视为大转手
const TOTAL_BIG_TRADE_CAPITAL_RATE = 0.003;//一分钟内交易数量比例超过该值视为大转手

// 输出价格或比例要求保留两位小数
function parsePrice(price) {
  return Math.round(price * 100) / 100;
}

function bigTrade(stock, result, key, done) {
  var results = []; // 存放分析结果
  var tradeList = stock.tradeList;
  var hq = stock.quotation;
  var tempDate = stock.temp[key];
  var totalBuyMoney = 0; // 一分钟买入总金额
  var totalBuyCount = 0; // 一分钟买入总股数
  var totalSaleMoney = 0; // 一分钟卖出总金额
  var totalSaleCount = 0; // 一分钟卖出总股数
  var currentMinute = new Date().setSeconds(0, 0); // 当前分钟的时间戳
  for (var i = 0, trade = {}, tradeMoney = 0; i < tradeList.length; i++) {
    trade = tradeList[i] || {};
    tradeMoney = trade.price * trade.count;
    if (trade.date >= currentMinute) { // 若为本分钟内发生的交易
      if (trade.count > tempDate.capitals || tradeMoney > BIG_TRADE_MONEY) { // 本单为大单交易
        var result = {
          code: stock.code,
          name: stock.name,
          text: '单笔大单' + (trade.type === 'buy' ? '买入':'卖出'),
          type: 'none',
          valuation: trade.type === 'buy' ? 'good' : 'bad',
          params: {
            '现价': hq.current,
            '总涨额': hq.diff > 0 ? '+' + hq.diff : hq.diff,
            '总涨幅': hq.rate > 0 ? '+' + hq.rate : hq.rate,
            '交易股数': (trade.count / 100) + '手',
            '交易金额': parsePrice(tradeMoney / 10000) + '万'
          },
          createDate: now,
          from: '大单提醒',
          receivers: stock.subscribers
        };
        if (trade.count > tempDate.capitals) { // 交易股数占一定比例s

        } else { // 交易金额达一定值

        }
        results.push(result);
      }
      if (trade.type === 'buy') {
        totalBuyCount += trade.count;
        totalBuyMoney += tradeMoney;
      } else {
        totalSaleCount += trade.count;
        totalSaleMoney += tradeMoney;
      }
    }
  }
}

module.exports = function (stock, key, done) {
  // 开始分析
  if (!stock.temp || !stock.temp[key] || stock.temp[key].expiredDate < now) { // 当日开市第一次分析
    if (!stock.temp) stock.temp = {};
    CompanyInfo(stock.code, (err, data) => { // 获取公司信息并得到流通股数
      if (err) {
        Log.e(err, true);
      } else {
        var expired = new Date();
        expired.setHours(9, 29, 0);
        expired.setTime(expired.getTime() + 86400000);
        stock.temp[key] = {
          capitals: parseInt(data.currcapital * BIG_TRADE_CAPITAL_RATE), // 股票0.1%的流通量
          oldPrice: stock.quotation.open, // 开盘价
          expiredDate: expired // 过期时间
        }
        bigTrade(stock, key, done);
      }
    });
  } else {
    bigTrade(stock, key, done);
  }
}