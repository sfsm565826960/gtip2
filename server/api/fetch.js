/**
 * 本模块用于获取外部股票数据
 */

var express = require('express');
var router = express.Router();
var Log = require('../utils/log.js')({
  file: 'fetch.log'
});

router.get('/', function(req, res) {
  res.send('router /api/fetch test success');
})

router.post('/quotation', function(req, res) {
  if (req.body.list && req.body.list.length > 0) {
    require('../utils/quotation.js')(req.body.list, function(err, data){
      if (err) {
        res.json({
          state: 'fail',
          detail: err
        });
      } else {
        res.json({
          state: 'ok',
          data: data
        })
      }
    })
  } else {
    res.json({
      state: 'fail',
      detail: 'param list is empty.eg: list=sz000001,sz000002'
    });
  }
});

module.exports = router;