/**
 * 用于分析价格极速波动的提醒
 * 价格新高、新低，急速上升、下降，涨停、跌停，涨停打开、跌停打开
 */

// 价格急速波动阀值
const CHANGE_RATE = 1.8;

// 输出价格或比例要求保留两位小数
function parsePrice(price) {
  return Math.round(price * 100) / 100;
}

module.exports = function (stock, key, done) {
  // 存放分析结果
  var result = [];
  var hq = stock.quotation;
  var now = new Date();
  // 开始分析
  if (!stock.temp || !stock.temp[key] || stock.temp[key].expiredDate < now) { // 当日开市第一次分析
    if (!stock.temp) stock.temp = {};
    var expired = new Date();
    expired.setHours(9, 29, 0);
    expired.setTime(expired.getTime() + 86400000);
    stock.temp[key] = {
      min: hq.min, // 旧最低价
      max: hq.max, // 旧最高价
      price: hq.current, // 旧价格
      limitUp: hq.current >= hq.MAX, // 涨停
      limitDown: hq.current <= hq.MIN, // 跌停
      expiredDate: expired // 过期时间      
    }
  } else { // 继续分析
    var data = stock.temp[key];
    // 进入涨跌停
    if (hq.current >= hq.MAX && !data.limitUp) { // 涨停
      result.push({
        code: stock.code,
        name: stock.name,
        text: '股票涨停',
        type: 'none',
        valuation: 'good',
        params: {
          '现价': hq.current,
          '涨额': hq.diff > 0 ? '+' + hq.diff : hq.diff,
          '开盘': hq.open,
          '涨幅': hq.rate > 0 ? '+' + hq.rate : hq.rate
        },
        createDate: now,
        from: '价格提醒',
        receivers: stock.subscribers
      });
      data.limitUp = true;
    } else if (hq.current <= hq.MIN && !data.limitDown) { // 跌停
      result.push({
        code: stock.code,
        name: stock.name,
        text: '股票跌停',
        type: 'none',
        valuation: 'bad',
        params: {
          '现价': hq.current,
          '涨额': hq.diff > 0 ? '+' + hq.diff : hq.diff,
          '开盘': hq.open,
          '涨幅': hq.rate > 0 ? '+' + hq.rate : hq.rate
        },
        createDate: now,
        from: '价格提醒',
        receivers: stock.subscribers
      });
      data.limitDown = true;
    } else if (data.limitUp && hq.current < hq.MAX) { // 涨停打开
      result.push({
        code: stock.code,
        name: stock.name,
        text: '股票打开涨封',
        type: 'none',
        valuation: 'bad',
        params: {
          '现价': hq.current,
          '涨停价': hq.MAX
        },
        createDate: now,
        from: '价格提醒',
        receivers: stock.subscribers
      });
      data.limitUp = false;
    } else if (data.limitDown && hq.current > hq.MIN) { // 跌停打开
      result.push({
        code: stock.code,
        name: stock.name,
        text: '股票打开跌封',
        type: 'none',
        valuation: 'good',
        params: {
          '现价': hq.current,
          '跌停价': hq.MIN
        },
        createDate: now,
        from: '价格提醒',
        receivers: stock.subscribers
      });
      data.limitDown = false;
    }
    var priceChangeRate = Math.round((hq.current - data.price) / data.price * 10000) / 100;
    if (priceChangeRate > CHANGE_RATE) { // 急速上升
      result.push({
        code: stock.code,
        name: stock.name,
        text: '价格急速上涨：+' + priceChangeRate + '%',
        type: 'none',
        valuation: 'good',
        params: {
          '总涨额': hq.diff > 0 ? '+' + hq.diff : hq.diff,
          '总涨幅': hq.rate > 0 ? '+' + hq.rate : hq.rate,
          '现价': hq.current,
          '涨额': '+' + Math.round((hq.current - data.price) * 100) / 100,
          '旧价': data.price,
          '涨幅': '+' + priceChangeRate + '%'
        },
        createDate: now,
        from: '价格提醒',
        receivers: stock.subscribers
      });
    } else if (priceChangeRate < -CHANGE_RATE) { // 急速下降
      result.push({
        code: stock.code,
        name: stock.name,
        text: '价格急速下跌：' + priceChangeRate + '%',
        type: 'none',
        valuation: 'bad',
        params: {
          '总涨额': hq.diff > 0 ? '+' + hq.diff : hq.diff,
          '总涨幅': hq.rate > 0 ? '+' + hq.rate : hq.rate,
          '现价': hq.current,
          '涨额': Math.round((hq.current - data.price) * 100) / 100,
          '旧价': data.price,
          '涨幅': priceChangeRate + '%'
        },
        createDate: now,
        from: '价格提醒',
        receivers: stock.subscribers
      });
    }
    // 新最低价
    if (data.min > hq.min) {
      result.push({
        code: stock.code,
        name: stock.name,
        text: '新最低价：' + hq.min,
        type: 'none',
        valuation: 'bad',
        params: {
          '现价': hq.current,
          '开盘价': hq.open,
          '最低价': hq.min,
          '跌停价': hq.MIN,
          '最高价': hq.max,
          '涨停价': hq.MAX
        },
        createDate: now,
        from: '价格提醒',
        receivers: stock.subscribers
      });
    } else if (data.max < hq.max) { // 新最高价
      result.push({
        code: stock.code,
        name: stock.name,
        text: '新最高价：' + hq.max,
        type: 'none',
        valuation: 'good',
        params: {
          '现价': hq.current,
          '开盘价': hq.open,
          '最高价': hq.max,
          '涨停价': hq.MAX,
          '最低价': hq.min,
          '跌停价': hq.MIN
        },
        createDate: now,
        from: '价格提醒',
        receivers: stock.subscribers
      });
    }
    // 更新数据
    data.max = hq.max;
    data.min = hq.min;
    data.price = hq.current;
  }
  // 模块综合分析
  if (result.length > 0) {
    var texts = [];
    var params = [];
    for(var i = 0; i < result.length; i++) {
      texts.push(result[i].text);
      params.push(result[i].params);
    }
    result = {
      code: stock.code,
      name: stock.name,
      text: texts.join(','),
      type: result[0].type,
      valuation: result[0].valuation,
      params: Object.assign.apply({}, params),
      createDate: now,
      from: '价格提醒',
      receivers: stock.subscribers
    }
  } else {
    result = null;
  }
  // 返回结果
  done(key, result);
}