var express = require('express');
var router = express.Router();
var modelLoaded = false;
var Log = require('../utils/log')({
  file: 'api.log'
});

router.get('/', (req, res) => {
  res.send('router /api test success');
});

/**
 * @api {get} /api/app/version 获取最新应用版本信息
 * @apiName appVersion
 * @apiGroup app
 */
router.get('/app/version', (req, res) => {
  try{
    res.json({
      state: 'ok',
      detail: '获取最新应用版本信息成功',
      data: require('../config').APP.version
    });
  } catch(err) {
    Log.e(err, true);
    res.json({state: 'fail', detail: '获取最新版本信息失败', error: err});
  }
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
    // router.use('/fetch', require('./fetch')(models));
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
