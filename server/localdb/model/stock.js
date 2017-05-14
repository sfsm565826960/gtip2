var Quotation = require('../../utils/stock/quotation');
var Timeline = require('../../utils/stock/timeline');
function StockSchema(mongoose) {
  var Types = mongoose.Schema.Types;
  var timelineSchema = new mongoose.Schema({
    date: Types.Date,
    time: Types.String,
    price: Types.Number,
    volume: Types.Number,
    avgPrice: Types.Number,
    netChangeRatio: Types.Number,
    macd: {
      diff: Types.Number,
      dea: Types.Number,
      macd: Types.Number
    },
    kdj: {
      k: Types.Number,
      d: Types.Number,
      j: Types.Number
    }
  });
  var billSchema = new mongoose.Schema({
    count: Types.Number,
    price: Types.Number
  });
  var schema = new mongoose.Schema({
    code: { type: Types.String, unique: true, required: true },
    name: Types.String,
    lastUpdate: Types.Date,
    firstUpdate: Types.Date,
    quotation: {
      open: Types.Number,
      close: Types.Number,
      current: Types.Number,
      MAX: Types.Number,
      MIN: Types.Number,
      max: Types.Number,
      min: Types.Number,
      firstBuyPrice: Types.Number,
      firstSalePrice: Types.Number,
      tradeCount: Types.Number,
      tradePrice: Types.Number,
      buy: [billSchema],
      sale: [billSchema]
    },
    timeline: [timelineSchema],
    subscribers: [{ type: Types.ObjectId, ref: 'User' }] // 订阅者
  });
  // 添加索引
  schema.index({ code: 1 }, { unique: true });
  schema.index({ name: 1 });
  // 添加静态方法
  /**
   * 创建新的Stock对象
   * 若股票代码不存在或出错会返回err
   * @param {String} code 股票代码
   * @param {Function} callback function(err, stock){}
   */
  schema.statics.create = function (code, callback) {
    var self = this;
    if (typeof callback !== 'function') callback = function () { };
    Quotation([code], function (err, data) {
      if (err) {
        return callback(err);
      } else if (data.stocks.length === 0) {
        return callback('股票代码无效');
      } else {
        var hq = data.stocks[code];
        var stock = new self({
          code: hq.code,
          name: hq.name
        });
        stock.update(hq, callback);
      }
    })
  }
  // 添加方法
  /**
   * 更新数据
   * @param {Object} quotation 盘口数据,null则自动联网获取
   * @param {Object} timeline 当日实时数据，null则自动联网获取
   * @param {Object} daybar 历史每日数据，null则自动联网获取
   * @param {Function} callback function(err, stock){}
   */
  schema.methods.update = function (quotation, timeline, daybar, callback) {
    if (typeof quotation === 'function') {
      callback = quotation;
      quotation = null;
    } else if (typeof timeline === 'function') {
      callback = timeline;
      timeline = null;
    } else if (typeof daybar === 'function') {
      callback = daybar;
      daybar = null;
    } else if (typeof callback !== 'function') {
      callback = function () { }
    }
    var process = 2; // 当process <= 0 时,调用callback。若process===-1则已经调用过callback
    // 更新quotation数据
    var updateQuotation = (quotation) => {
      this.quotation.open = quotation.open;
      this.quotation.close = quotation.close;
      this.quotation.current = quotation.current;
      this.quotation.MAX = quotation.MAX;
      this.quotation.MIN = quotation.MIN;
      this.quotation.max = quotation.max;
      this.quotation.min = quotation.min;
      this.quotation.firstBuyPrice = quotation.firstBuyPrice;
      this.quotation.firstSalePrice = quotation.firstSalePrice;
      this.quotation.tradeCount = quotation.tradeCount;
      this.quotation.tradePrice = quotation.tradePrice;
      for (var i = 0; i < quotation.buy.length; i++) {
        this.quotation.buy.push({
          count: quotation.buy[i].count,
          price: quotation.buy[i].price
        });
      }
      for (var i = 0; i < quotation.sale.length; i++) {
        this.quotation.sale.push({
          count: quotation.sale[i].count,
          price: quotation.sale[i].price
        });
      }
      if (process < 0) return;
      if (--process <= 0) {
        process = -1;
        callback(null, this);
      }
    }
    if (quotation) {
      updateQuotation(quotation);
    } else {
      Quotation(this.code, (err, data) => {
        if (process < 0) return;
        if (err || !data.stocks[this.code]) {
          process = -1;
          return callback(err || 'fetch ' + this.code + ' quotation fail.');
        } else {
          updateQuotation(data.stocks[this.code]);
        }
      })
    }
    // 更新timeline数据
    var updateTimeline = (timeline) => {
      this.timeline.splice(0);
      for (var i = 0; i < timeline.length; i++) {
        this.timeline.push({
          date: timeline[i].date,
          time: timeline[i].time,
          price: timeline[i].price,
          volume: timeline[i].volume,
          avgPrice: timeline[i].avgPrice,
          netChangeRatio: timeline[i].netChangeRatio,
          macd: {
            diff: timeline[i].macd.diff,
            dea: timeline[i].macd.dea,
            macd: timeline[i].macd.macd
          },
          kdj: {
            k: timeline[i].kdj.k,
            d: timeline[i].kdj.d,
            j: timeline[i].kdj.j
          }
        })
      }
      if (process < 0) return;
      if (--process <= 0) {
        process = -1;
        callback(null, this);
      }
    }
    if (timeline) {
      updateTimeline(timeline);
    } else {
      Timeline(this.code, (err, data) => {
        if (process < 0) return;
        if (err || data.length === 0) {
          process = -1;
          return callback(err || 'fetch ' + this.code + ' timeline fail.');
        } else {
          updateTimeline(data);
        }
      })
    }
  }
  return schema;
}

/**
 * 获取StockModules
 * @param {Object|Function} mongoose 当为mongoose时同步，当为function时异步
 */
exports.getModel = function (callback) {
  if (typeof callback === 'function') {
    require('./index').getMongoose(function (err, mongoose) {
      if (err) {
        callback(err);
      } else {
        callback(null, mongoose.model('Stock', StockSchema(mongoose)), mongoose);
      }
    })
  } else {
    var mongoose = callback;
    return mongoose.model('Stock', StockSchema(mongoose));
  }
  return null;
}

/**
 * 获取StockSchema
 * @param {Object|Function} mongoose 当为mongoose时同步，当为function时异步
 */
exports.getSchema = function (callback) {
  if (typeof callback === 'function') {
    require('./index').getMongoose(function (err, mongoose) {
      if (err) {
        callback(err);
      } else {
        callback(null, StockSchema(mongoose), mongoose);
      }
    })
  } else {
    var mongoose = callback;
    return StockSchema(mongoose);
  }
  return null;
}