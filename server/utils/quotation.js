/**
 * 本模块用于获取交易盘口数据
 */

var http = require('./http.js');
var Log = require('./log.js')({
  file: 'quotation.log'
});

function parseItem(code, detailStr) {
  var detail = detailStr.split(',');
  if (detail.length < 32) {
    Log.w('Invaild Quotation: ' + detailStr, true);
    return null;
  } else {
    return {
      code: code,
      name: detail[0],
      open: parseFloat(detail[1]),
      close: parseFloat(detail[2]),
      current: parseFloat(detail[3]),
      MAX: Math.floor(parseFloat(detail[2]) * 1.1 * 10000) / 10000,
      MIN: Math.floor(parseFloat(detail[2]) * 0.9 * 10000) / 10000,
      max: parseFloat(detail[4]),
      min: parseFloat(detail[5]),
      firstBuyPrice: parseFloat(detail[6]),
      firstSalePrice: parseFloat(detail[7]),
      tradeCount: parseInt(detail[8]),
      tradePrice: parseFloat(detail[9]),
      buy: [
        {
          count: parseInt(detail[10]),
          price: parseFloat(detail[11])
        },{
          count: parseInt(detail[12]),
          price: parseFloat(detail[13])
        },{
          count: parseInt(detail[14]),
          price: parseFloat(detail[15])
        },{
          count: parseInt(detail[16]),
          price: parseFloat(detail[17])
        },{
          count: parseInt(detail[18]),
          price: parseFloat(detail[19])
        }
      ],
      sale: [
        {
          count: parseInt(detail[20]),
          price: parseFloat(detail[21])
        },{
          count: parseInt(detail[22]),
          price: parseFloat(detail[23])
        },{
          count: parseInt(detail[24]),
          price: parseFloat(detail[25])
        },{
          count: parseInt(detail[26]),
          price: parseFloat(detail[27])
        },{
          count: parseInt(detail[28]),
          price: parseFloat(detail[29])
        }
      ],
      date: detail[30],
      time: detail[31],
      timestamp: Date.parse(detail[30] + ' ' + detail[31])
    }
  }
}

function parseQuotation(body, callback) {
  var data = { ignore: [] };
  var regExp = /hq_str_(\w{8})="(.+?)";/g;
  var result = regExp.exec(body);
  while(result != null) {
    try {
      var item = parseItem(result[1], result[2]);
      if (item !== null) {
        data[item.code] = item;
      } else {
        data.ignore.push(result[0]);
      }
    } catch(err) {
      callback(err);
    }
    result = regExp.exec(body);
  }
  callback(null, data);
}

module.exports = function (list, callback) {
  var url = 'http://hq.sinajs.cn/list=' + (typeof list === 'string' ? list : list.join(','));
  var retry = 0;
  var task = function (url) {
    http.get(url, function (err, body, response) {
      if (err) {
        callback(err);
      } else {
        if (body && body.length > 0) {
          parseQuotation(body, callback);
        } else {
          if (++retry < 3) {
            task(url);
          } else {
            callback(new Error('Fetch empty: ' + url));
          }
        }
      }
    });
  };
  task(url);
}

/**
 * 获取历史日交易记录：http://vip.stock.finance.sina.com.cn/corp/go.php/vMS_MarketHistory/stockid/000001/type/S.phtml
 * 获取实时数据：https://gupiao.baidu.com/api/stocks/stocktimeline?from=pc&os_ver=1&cuid=xxx&vv=100&format=json&stock_code=sh000001&timestamp=1494215025325
 * 获取历史5日交易记录：https://gupiao.baidu.com/api/stocks/stocktimelinefive?from=pc&os_ver=1&cuid=xxx&vv=100&format=json&stock_code=sh000001&step=3&timestamp=1494217570037
 */