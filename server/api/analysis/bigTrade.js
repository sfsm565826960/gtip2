/**
 * 用于分析交易情况
 * 单笔大单买入、单笔大单卖出、1分钟内疯狂买入、1分钟内疯狂卖出
 */
var CompanyInfo = require('../../utils/stock/companyInfo');
var Log = require('../../utils/log.js')({
  file: 'analysi.bigTrade.log'
});

const BIG_TRADE_MONEY = 150 * 10000;//逐单交易金额超过该值视为大单
const BIG_TRADE_CAPITAL_RATE = 0.001;//逐单交易数量比例超过该值视为大单

const TOTAL_BIG_TRADE_MONEY = 800 * 10000;//一分钟内交易金额超过该值视为大转手
const TOTAL_BIG_TRADE_CAPITAL_RATE = 0.003;//一分钟内交易数量比例超过该值视为大转手

// 输出价格或比例要求保留两位小数
function parsePrice(price) {
  return Math.round(price * 100) / 100;
}

function toValueStr(value) {
  return value > 10000000 ? parsePrice(value / 100000000) + '亿' : parsePrice(value / 10000) + '万';
}

/**
 * 生成单笔大单交易分析结果
 * @param {Object} stock 股票对象
 * @param {Object} trade 交易对象
 * @param {Object} tempData 临时数据对象
 * @param {Number} tradeMoney 单笔交易金额
 */
function singleBigTradeResult(stock, trade, tempData, tradeMoney) {
  var result = {
    code: stock.code,
    name: stock.name,
    text: '单笔大单' + (trade.type === 'buy' ? '买入' : '卖出') + '：',
    type: 'none',
    valuation: trade.type === 'buy' ? 'good' : 'bad',
    params: {
      '现价': hq.current,
      '总涨额': hq.diff > 0 ? '+' + hq.diff : hq.diff,
      '总涨幅': hq.rate > 0 ? '+' + hq.rate : hq.rate,
      '交易股数': (trade.count / 100) + '手',
      '交易金额': toValueStr(tradeMoney) + '元'
    },
    createDate: now,
    from: '大单提醒',
    receivers: stock.subscribers
  };
  if (tradeMoney > BIG_TRADE_MONEY) {
    result.text += '达' + priceStr + '，';
  }
  if (trade.count > tempData.capitals) { // 交易股数占一定比例
    var rate = parsePrice(trade.count / tempData.currcapital * 100);
    result.text += '占流通量' + rate + '%，';
    result.params['占流通量'] = rate + '%';
  }
  // 更换最后一个符号为句号
  result.text.replace(/[,，：:]$/, '。');
  // 返回结果
  return result;
}

/**
 * 生成1分钟大交易提醒
 * @param {Object} stock 股票对象
 * @param {Object} trade 交易对象
 * @param {Object} tempData 临时数据对象
 * @param {Object} total 统计对象
 */
function totalBigTradeResult(stock, trade, tempData, total){
  var result = {
    code: stock.code,
    name: stock.name,
    type: 'none',
    text: '一分钟内',
    valuation: total.totalBuyMoney > total.totalSaleMoney ? 'good' : 'bad',
    params: {
      '现价': hq.current,
      '总涨额': hq.diff > 0 ? '+' + hq.diff : hq.diff,
      '总涨幅': hq.rate > 0 ? '+' + hq.rate : hq.rate,
      '流入金额': toValueStr(total.totalBuyMoney) + '元',
      '流入股数': toValueStr(total.totalBigTradeResult / 100) + '手',
      '流出金额': toValueStr(total.totalSaleMoney) + '元',
      '流出股数': toValueStr(total.totalSaleCount / 100) + '手'
    },
    createDate: now,
    from: '大单提醒',
    receivers: stock.subscribers
  };
  // 流入参数
  var texts = [];
  if (total.totalBuyMoney > TOTAL_BIG_TRADE_MONEY) {
    texts.push('流入' + toValueStr(total.totalBuyMoney))
  }
  if (total.totalBuyCount > tempData.totalCapitals) {
    var rate = parsePrice(total.totalBuyCount / tempData.currcapital * 100);
    texts.push('占' + rate + '%');
    result.params['流入比例'] = rate + '%';
  }
  result.text += texts.join('，') + '。';
  // 流出参数
  texts = [];
  if (total.totalSaleMoney > TOTAL_BIG_TRADE_MONEY) {
    texts.push('流出' + toValueStr(total.totalSaleMoney))
  }
  if (total.totalSaleCount > tempData.totalCapitals) {
    var rate = parsePrice(total.totalSaleCount / tempData.currcapital * 100);
    texts.push('占' + rate + '%');
    result.params['流出比例'] = rate + '%';
  }
  result.text += texts.join('，') + '。';
  // 返回结果
  return result;
}

function bigTrade(stock, key, resultData, done) {
  var tradeList = stock.tradeList;
  var hq = stock.quotation;
  var tempData = stock.temp[key];
  var totalBuyMoney = 0; // 一分钟买入总金额
  var totalBuyCount = 0; // 一分钟买入总股数
  var totalSaleMoney = 0; // 一分钟卖出总金额
  var totalSaleCount = 0; // 一分钟卖出总股数
  var currentMinute = new Date().setSeconds(0, 0); // 当前分钟的时间戳
  var results = { // 用于暂存分析结果
    single: [],
    total: null
  };
  for (var i = 0, trade = {}, tradeMoney = 0; i < tradeList.length; i++) {
    trade = tradeList[i] || {};
    tradeMoney = trade.price * trade.count;
    if (trade.date >= currentMinute) { // 若为本分钟内发生的交易
      // 判断单笔大单交易
      if (trade.count > tempData.capitals || tradeMoney > BIG_TRADE_MONEY) {
        // 加入结果
        results.single.push(singleBigTradeResult(stock, trade, tempData, tradeMoney));
      }
      // 计算总交易量
      if (trade.type === 'buy') {
        totalBuyCount += trade.count;
        totalBuyMoney += tradeMoney;
      } else {
        totalSaleCount += trade.count;
        totalSaleMoney += tradeMoney;
      }
    } else {
      break;
    }
  }
  // 判断一分钟内巨额交易
  if (totalBuyCount > tempData.totalCapitals || totalSaleCount > tempData.totalCapitals || totalBuyMoney > TOTAL_BIG_TRADE_MONEY || totalSaleMoney > TOTAL_BIG_TRADE_MONEY) {
    // 加入结果
    results.total = totalBigTradeResult(stock, trade, tempData, {
      totalBuyCount,
      totalBuyMoney,
      totalSaleCount,
      totalSaleMoney
    });
  }
}

module.exports = function (stock, key, resultData, done) {
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
          currcapital: data.currcapital, // 股票流通量
          capitals: parseInt(data.currcapital * BIG_TRADE_CAPITAL_RATE), // 单笔大单巨大流通量
          totalCapitals: parseInt(data.currcapital * TOTAL_BIG_TRADE_CAPITAL_RATE), // 一分钟内股票交易巨大流通量
          oldPrice: stock.quotation.open, // 开盘价
          expiredDate: expired // 过期时间
        }
        bigTrade(stock, key, resultData, done);
      }
    });
  } else {
    bigTrade(stock, key, resultData, done);
  }
}