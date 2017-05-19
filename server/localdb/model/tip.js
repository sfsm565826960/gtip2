function TipSchema (mongoose) {
  var Types = mongoose.Schema.Types;
  var schema = new mongoose.Schema({
    code: Types.String,
    name: Types.String,
    text: Types.String,
    type: { // 提醒类型：趋势、转折、其他
      type: Types.String,
      default: 'none',
      enum: ['trend', 'turn', 'none']
    },
    valuation: { // 好坏类型：好消息、坏消息、重要、其他
      type: Types.String,
      default: 'none',
      enum: ['good', 'bad', 'important', 'none']
    },
    params: Types.Mixed,
    date: Types.Date, // 创建日期
    from: Types.String, // 消息来源
    thumbsUp: [{type: Types.ObjectId, ref: 'User'}], // 点赞者
    thumbsDown: [{type: Types.ObjectId, ref: 'User'}], // 反对者
    receivers: [{ type: Types.ObjectId, ref: 'User' }] // 接收者
  });
  // 添加索引
  schema.index({code: 1});
  schema.index({receiveres: 1});
  return schema;
}

/**
 * 获取TipModules
 * @param {Object|Function} mongoose 当为mongoose时同步，当为function时异步
 */
exports.getModel = function (callback) {
  if (typeof callback === 'function') {
    require('./index').getMongoose(function (err, mongoose) {
      if (err) {
        callback(err);
      } else {
        callback(null, mongoose.model('Tip', TipSchema(mongoose)), mongoose);
      }
    })
  } else {
    var mongoose = callback;
    return mongoose.model('Tip', TipSchema(mongoose));
  }
  return null;
}

/**
 * 获取TipSchema
 * @param {Object|Function} mongoose 当为mongoose时同步，当为function时异步
 */
exports.getSchema = function (callback) {
  if (typeof callback === 'function') {
    require('./index').getMongoose(function (err, mongoose) {
      if (err) {
        callback(err);
      } else {
        callback(null, TipSchema(mongoose), mongoose);
      }
    })
  } else {
    var mongoose = callback;
    return TipSchema(mongoose);
  }
  return null;
}