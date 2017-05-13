var quotation = require('../../utils/stock/quotation');
function StockSchema(mongoose) {
  var Types = mongoose.Schema.Types;
  var schema = new mongoose.Schema({
    code: { type: Types.String, unique: true, required: true },
    name: Types.String,
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
    buy: [Types.Mixed],
    sale: [Types.Mixed],
    lastUpdate: Types.Date,
    firstUpdate: Types.Date,
    timeline:[Types.Number],
    macd: {
      diff: [Types.Number],
      dea: [Types.Number],
      macd: [Types.Number]
    },
    kdj: {
      k: [Types.Number],
      d: [Types.Number],
      j: [Types.Number]
    },
    subscribers:[{type: Types.ObjectId, ref: 'User'}] // 订阅者
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
  schema.statics.create = function(code, callback) {
    var self = this;
    if (typeof callback !== 'function') callback = function(){};
    quotation([code], function(err, data){
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
        return callback(null, stock);
      }
    })
  }
  // 添加方法
  // schema.methods.a = function(){

  // }
  return schema;
}

/**
 * 获取StockModules
 * @param {Object|Function} mongoose 当为mongoose时同步，当为function时异步
 */
exports.getModel = function(callback) {
  if (typeof callback === 'function') {
    require('./index').getMongoose(function(err, mongoose) {
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
exports.getSchema = function(callback) {
  if (typeof callback === 'function') {
    require('./index').getMongoose(function(err, mongoose) {
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