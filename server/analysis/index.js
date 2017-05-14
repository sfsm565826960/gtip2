var modelLoaded = false;
var Log = require('../utils/log')({
  file: 'analysis.log'
});
var data = {};

/**
 * 连接数据库并加载模型
 * 
 * 逻辑：
 * 获取所有被关注的股票代码
 * 
 */
require('../localdb/model/index').getModels((err, models, mongodbose) => {
  if (err) {
    Log.e(err, true, true);
  } else {
    modelLoaded = true;
    Log.i('DB Models Loaded', true);
    setInterval(function(){
      // 获取盘口数据
      try{
        
      }
    }, 60000);
    require('./price')(models);
  }
});