/**
 * 该模块用于获取关于用户关注的相关信息
 */

var express = require('express');
var router = express.Router();
var User = null;
var Stock = null;
var Log = require('../../utils/log')({
  file: 'api.concern.stock.log'
});
var Push = require('../../utils/push');

// 检查User模型是否加载成功
router.use((req, res, next) => {
  if (User === null) {
    res.json({ state: 'fail', detail: 'User Model is null' });
  } else if (Stock === null) {
    res.json({ state: 'fail', detail: 'Stock Model is null' });
  } else {
    next();
  }
});

// 检查路由是否畅通
router.get('/', (req, res) => {
  res.send('router /api/concern/stock test success');
});


/**
 * 通用数据库验证错误
 * @param {Object} err
 */
function errMsg(err) {
  var data = { state: 'fail', detail: err.message, errors: {} }
  for (key in err.errors) {
    data.errors[key] = err.errors[key].message;
  }
  return data;
}

/**
 * @api {post} /api/concern/stock/add 添加股票关注
 * @apiName AddStockConcern
 * @apiGroup concern
 * 
 * @apiParam {String} token 用户令牌
 * @apiParam {String} stockId 股票代码
 */
router.post('/add', (req, res) => {
  User.getUserByToken(req.body.token, (err, user) => {
    if (err) {
      res.json(err);
    } else if ((user.concern.stockIds || []).indexOf(req.body.stockId) >= 0) {
      res.json({ state: 'fail', detail: '用户已关注股票:' + req.body.stockId })
    } else {
      Stock.findOne({
        code: req.body.stockId
      }, (err, stock) => {
        var saveStockId = function (stock) {
          stock.subscribers.push(user._id);
          stock.save()
            .then(doc => {
              user.concern.stockIds.push(req.body.stockId);
              user.save().then(doc => {
                res.json({ state: 'ok', detail: 'add stock concern success', data: doc.concern.stockIds });
              }).catch(err => {
                Log.e(err, true);
                res.json(errMsg(err));
              })
              if (user.clientId && user.clientId.length > 0) {
                Push.getClientTag(user.clientId, (err, res) => {
                  if (err) {
                    return;
                  }
                  if (!res.tags) res.tags = [];
                  if (res.tags.indexOf(req.body.stockId) < 0) {
                    res.tags.push(req.body.stockId);
                    Push.setClientTag(user.clientId, res.tags);
                  }
                })
              }
            })
            .catch(err => {
              Log.e(err, true);
              res.json(errMsg(err));
            });
        }
        if (err) {
          Log.e(err, true);
          res.json({ state: 'fail', detail: err.message || err });
        } else if (stock === null) {
          // 需要新建
          Stock.create(req.body.stockId, (err, stock) => {
            if (err) {
              Log.e(err, true);
              res.json({ state: 'fail', detail: err.message || err });
            } else {
              saveStockId(stock);
            }
          })
        } else {
          saveStockId(stock);
        }
      });
    }
  })
});

/**
 * @api {post} /api/concern/stock/remove 移除股票关注
 * @apiName RemoveStockConcern
 * @apiGroup concern
 * 
 * @apiParam {String} token 用户令牌
 * @apiParam {String} stockId 股票代码
 */
router.post('/remove', (req, res) => {
  User.getUserByToken(req.body.token, (err, user) => {
    if (err) {
      res.json(err);
    } else if ((user.concern.stockIds || []).indexOf(req.body.stockId) < 0) {
      res.json({ state: 'fail', detail: '用户未关注股票:' + req.body.stockId })
    } else {
      var removeStockId = function () {
        var index = (user.concern.stockIds || []).indexOf(req.body.stockId);
        user.concern.stockIds.splice(index, 1);
        user.save().then(doc => {
          res.json({ state: 'ok', detail: 'remove stock concern success', data: doc.concern.stockIds })
        }).catch(err => {
          Log.e(err, true);
          res.json({ state: 'fail', detail: err.message || err });
        });
        if (user.clientId && user.clientId.length > 0) {
          Push.getClientTag(user.clientId, (err, res) => {
            if (err) {
              return;
            }
            var index = (res.tags || []).indexOf(req.body.stockId);
            if (index >= 0) {
              res.tags.splice(index, 1);
              Push.setClientTag(user.clientId, res.tags);
            }
          })
        }
      }
      Stock.findOne({
        code: req.body.stockId
      }, (err, stock) => {
        if (err) {
          Log.e(err, true);
          res.json({ state: 'fail', detail: err.message || err });
        } else if (stock !== null) {
          var index = (stock.subscribers || []).indexOf(user._id);
          if (index >= 0) {
            stock.subscribers.splice(index, 1);
            stock.save()
              .then(removeStockId)
              .catch(err => {
                Log.e(err, true);
                res.json({ state: 'fail', detail: err.message || err });
              });
          } else {
            removeStockId();
          }
        } else {
          removeStockId();
        }
      })
    }
  })
})


module.exports = function (models) {
  User = models.User;
  Stock = models.Stock;
  return router;
}
