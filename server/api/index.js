var express = require('express');
var router = express.Router();
var modelLoaded = false;
var Log = require('../utils/log')({
  file: 'api.log'
});

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('router /api test success');
});

// 连接数据库并加载模型
require('../localdb/model/index').getModels({
  server: {
    poolSize: 50,
    auto_reconnect: true
  }
}, (err, models) => {
  if (err) {
    Log.e(err, true, true);
  } else {
    modelLoaded = true;
    Log.i('DB Models Loaded', true);
    router.use('/fetch', require('./fetch')(models));
    router.use('/user', require('./user')(models));
    router.use('/concern/stock', require('./concern/stock')(models));
    router.use('/analysis', require('./analysis')(models));
    router.use('/settings', require('./settings')(models));
  }
});

// 检查User模型是否加载成功
router.use((req, res, next) => {
  if (!modelLoaded) {
    res.json({ state: 'fail', detail: 'Model is null' });
  } else {
    next();
  }
});

module.exports = router;
