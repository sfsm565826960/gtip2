/**
 * 用于分析价格极速波动的提醒
 * 价格新高、新低，急速上升、下降，涨停、跌停，涨停打开、跌停打开
 */

module.exports = function(stock, Tip, Push) {
  // 存放分析结果
  var result = [];
  var hq = stock.quotation;
  // 开始分析
  if (!stock.temp.priceTip) { // 第一次分析
    stock.temp.priceTip = {
      min: hq.min, // 旧最低价
      max: hq.max, // 旧最高价
      limitUp: hq.current >= hq.MAX, // 涨停
      limitDown: hq.current <= hq.MIN, // 跌停
      price: hq.current // 旧价格
    }
  } else { // 继续分析
    var data = stock.temp.priceTip;
    // 新最低价
    if (data.min > hq.min) {
      result.push(new Tip({
        code: stock.code,
        name: stock.name,
        text: '新最低价：' + hq.min,
        type: 'none',
        valuation: 'none',
        params: {

        },
        date: new date(),
        'from': '价格提醒',
        receivers: stock.subscribers
      }));
      data.min = hq.min;
    }
    // 新最高价
    if (data.max < hq.max) {

      data.max = hq.max;
    }
    // 价格急速波动
    var rate = (hq.current - data.price) / data.price;
    if (rate > 0.018) { // 急速上升

    } else if (rate < -0.018) { // 急速下降

    }
    // 进入涨跌停
    if (hq.current >= hq.MAX && !data.limitUp) { // 涨停

      data.limitUp = true;
    } else if (hq.current <= hq.MIN && !data.limitDown) { // 跌停

      data.limitDown = true;
    } else if (data.limitUp && hq.current < hq.MAX) { // 涨停打开

      data.limitUp = false;
    } else if (data.limitDown && hq.current > hq.MIN) { // 跌停打开

      data.limitDown = false;
    }
  }
  // 返回结果
  return result;
}