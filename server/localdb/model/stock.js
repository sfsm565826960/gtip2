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
    quotation: { // 盘口数据
      open: Types.Number,
      close: Types.Number,
      current: Types.Number,
      diff: Types.Number,
      rate: Types.Number,
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
    timeline: [timelineSchema], // 实时数据
    temp: { // 有关该股票的相关临时数据，主要存放Analysis相关数据
      type: Types.Mixed
    },
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
      } else if (!data.stocks[code]) {
        return callback('股票代码无效');
      } else {
        var hq = data.stocks[code];
        var stock = new self({
          code: hq.code,
          name: hq.name
        });
        stock.update({
          quotation: hq
        }, callback);
      }
    })
  }
  // 添加方法
  /**
   * 更新quotation数据
   * @param {Stock} stock 
   * @param {Function} done 
   * @param {Object} quotation 
   */
  function updateQuotation(stock, done, quotation) {
    var todo = (quotation) => {
      stock.quotation.open = quotation.open;
      stock.quotation.close = quotation.close;
      stock.quotation.current = quotation.current;
      stock.quotation.MAX = quotation.MAX;
      stock.quotation.MIN = quotation.MIN;
      stock.quotation.max = quotation.max;
      stock.quotation.min = quotation.min;
      stock.quotation.firstBuyPrice = quotation.firstBuyPrice;
      stock.quotation.firstSalePrice = quotation.firstSalePrice;
      stock.quotation.tradeCount = quotation.tradeCount;
      stock.quotation.tradePrice = quotation.tradePrice;
      for (var i = 0; i < quotation.buy.length; i++) {
        stock.quotation.buy.push({
          count: quotation.buy[i].count,
          price: quotation.buy[i].price
        });
      }
      for (var i = 0; i < quotation.sale.length; i++) {
        stock.quotation.sale.push({
          count: quotation.sale[i].count,
          price: quotation.sale[i].price
        });
      }
      done(null, stock);
    }
    if (quotation) {
      todo(quotation);
    } else {
      Quotation(stock.code, (err, data) => {
        if (done()) return;
        if (err || !data.stocks[stock.code]) {
          done(err || 'fetch ' + stock.code + ' quotation fail.');
        } else {
          todo(data.stocks[stock.code]);
        }
      })
    }
  }

  /**
   * 更新实时数据
   * @param {Stock} stock 
   * @param {Function} done 
   * @param {Object} timeline 
   */
  function updateTimeline(stock, done, timeline) {
    var todo = (timeline) => {
      stock.timeline.splice(0);
      for (var i = 0; i < timeline.length; i++) {
        stock.timeline.push({
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
      done(null, stock);
    }
    if (timeline) {
      todo(timeline);
    } else {
      Timeline(stock.code, (err, data) => {
        if (done()) return;
        if (err || data.length === 0) {
          done(err || 'fetch ' + stock.code + ' timeline fail.');
        } else {
          todo(data);
        }
      })
    }
  }
  /**
   * 更新数据
   * @param {Object} options 配置:
   *    quotation 盘口数据,null则自动联网获取
   *    timeline 当日实时数据，null则自动联网获取
   *    daybar 历史每日数据，null则自动联网获取
   *    save 更新后保存，默认为true
   * @param {Function} callback function(err, stock){}
   */
  schema.methods.update = function (options, callback) {
    if (typeof option === 'function') {
      callback = option;
      options = {};
    }
    if (typeof callback !== 'function') {
      callback = function () { }
    }
    var process = 2; // 当process <= 0 时,调用callback。若process===-1则已经调用过callback
    var done = function (err, stock) { // 判断进程是否结束
      if (!err && !stock) return process <= 0;
      if (process-- > 0) {
        if (err) {
          process = -1;
          callback(err);
          return true;
        } else if (process <= 0) {
          process = -1;
          if (options.save !== false) {
            console.log(stock.name + ' update save');
            stock.save().then(doc => {
              callback(null, doc);
            }).catch(err => {
              callback(err);
            });
          } else {
            callback(null, stock);
          }
          return true;
        }
        return false;
      }
      return true;
    }
    updateQuotation(this, done, options.quotation);
    updateTimeline(this, done, options.timeline);
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