/**
 * 本模块用于分析结论管理
 */
var cluster = require('cluster');
var express = require('express');
var router = express.Router();
var Log = require('../utils/log.js')({
    file: 'analysis.log'
});
var heartBeat = { // 心跳检测对象
    lastCheck = 0,
    lastUpdate = 0,
    limitInterval = 120000
}
var User = null; // 用户数据库对象
var Tip = null; // 提示数据库对象
var Stock = null; // 股票数据库对象
var Push = require('../utils/push'); // 推送对象
var Timer = null; // 定时器ID

/**
 * 重启分析服务
 */
function restart() {
    clearInterval(Timer);
    Timer = setInterval(main, 60000);
    Log.i('Analysis Service Restart');
}

/**
 * 分析服务主函数
 * 用于获取所有受关注的股票并调用子函数进行分析
 */
function main() {
    var now = new Date();
    // 获取所有受关注的股票
    try {
        Stock.find({
            'subscribers.0': { $exist: 1 } // 订阅者数组长度不小于1（subscribers[0]存在说明数组长度不小于1）
        }, function(stocks) {
            // 下面代码需要进行调度优化
            for (var i = 0; i < stocks.length; i++) {
                process(stocks[i]);
            }
        })
    } catch (err) {
        Log.e(err, true);
    }
    heartBeat.lastUpdate = now;
}

/**
 * 更新该股票的数据
 * 调用分析模块对股票进行分析
 * @param {Stock} stock 股票对象
 */
var analysisList = {
  priceTip: require('./priceTip')
};
function process(stock) {
    stock.update(function(err, doc) {
        if (err) {
            Log.i(err, true);
            setTimeout(process, 10, stock);
            return;
        } else {
          // 调用分析模块
            var result = {};
            for (key in analysisList) {
              try {
                result[key] = analysisList[key].analysis(doc);
              } catch (error) {
                Log.e(error, true);
              }
            }
          // 执行综合分析
          analysis(doc, result);
        }
    })
}

function analysis(stock, result) {
  JSON.stringify(result);
}

/**
 * 心跳检测
 */
function heartBeatCheck() {
    var now = new Date();
    heartBeat.lastCheck = now;
    if (now - heartBeat.lastUpdate > heartBeat.limitInterval) {
        return restart();
    }
    return true;
}

router.get('/', (req, res) => {
    res.send('router /api/analysis test success');
})

router.get('/heartbeatcheck', (req, res) => {
    if (heartBeatCheck()) {
        req.json({
            state: 'ok',
            detail: 'analysis service is running.',
            data: {
                lastUpdate: heartBeat.lastUpdate,
                lastCheck: heartBeat.lastCheck
            }
        })
    } else {
        req.json({
            state: 'fail',
            detail: 'Analysis service restart now.',
            data: {
                lastUpdate: heartBeat.lastUpdate,
                lastCheck: heartBeat.lastCheck
            }
        })
    }
});

/**
 * @api {post} /api/analysis/list 获取分析列表
 * @apiName analysisList
 * @apiGroup analysis
 * 
 * @apiParam {String} token 用户令牌
 * @apiParam {String='all','my','{{stockCode}}'} range 获取访问：所有（不建议）、我所关注的（默认）、指定股票
 * @apiParam {Number} count 每页显示数量
 * @apiParam {Number} index 第几页
 */
router.post('/list', (req, res) => {
    if (!req.body.range || req.body.range.length === 0) req.body.range = 'my';
    User.getUserByToken(req.body.token, (err, user) => {
        if (err) {
            Log.e(err, true);
            res.json({ state: 'fail', detail: err.message || err });
        } else if (user === null) {
            res.json({ state: 'logout', detail: '用户不存在或不在线' });
        } else {
            var sql = {};
            switch (req.body.range) {
                case 'all':
                    break;
                case 'my':
                    sql.receivers = { $in: [user._id] };
                    break;
                default:
                    sql.code = req.body.range;
            }
            var query = Tip.find(sql);
            // 限制显示数目
            var pCount = parseInt(req.body.count);
            if (pCount > 0) {
                query.limit(pCount);
            }
            // 跳过指定数目
            var pIndex = parseInt(req.body.index);
            if (pIndex > 0) {
                query.skip(pCount * pIndex)
            }
            // 执行
            query.exec((err, tips) => {
                if (err) {
                    Log.e(err, true);
                    res.json({ state: 'fail', detail: err.message || err });
                } else if (tips === null || tips.length === 0) {
                    res.json({ state: 'ok', detail: '提醒列表为空', data: [] });
                } else {
                    // 处理数据
                    for(var i = 0; i < tips.length; i++) {
                        tips[i].isThumbsUp = (tips[i].thumbsUp || []).indexOf(user._id) >= 0;
                        tips[i].thumbsUp = (tips[i].thumbsUp || []).length;
                        tips[i].isThumbsDown = (tips[i].thumbsDown || []).indexOf(user._id) >= 0;
                        tips[i].thumbsDown = (tips[i].thumbsDown || []).length;
                        delete tips[i].receivers;
                    });
                    res.json({ state: 'ok', detail: '获取提醒列表成功', data: tips })
                }
            });
        }
    })
})


// 启动多进程
if (cluster.isMaster) {
    // 进行心跳监控
    setInterval(function() {
        heartBeatCheck();
        heartBeat.lastCheck = new Date();
    }, 60000);
    cluster.fork();
} else {
    /**
   * 连接数据库,加载模型,启动分析进程
   */
    require('../localdb/model/index').getModels((err, models, mongodbose) => {
        if (err) {
            Log.e(err, true, true);
        } else {
            User = models.User;
            Tip = models.Tip;
            Stock = models.Stock;
            Log.i('DB Models Loaded', true);
            restart();
        }
    });
}

module.exports = router;