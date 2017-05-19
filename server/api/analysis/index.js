/**
 * 本模块用于分析结论管理
 */
var cluster = require('cluster');
var express = require('express');
var router = express.Router();
var serverPath = '../..';
var Log = require(serverPath + '/utils/log.js')({
    file: 'analysis.log'
});
var heartBeat = { // 心跳检测对象
    lastCheck: 0,
    lastUpdate: 0,
    limitInterval: 120000
}
var User = {}; // 用户数据库对象
var Tip = {}; // 提示数据库对象
var Stock = {}; // 股票数据库对象
var Push = require(serverPath + '/utils/push'); // 推送对象
var Timer = null; // 定时器ID

/**
 * 重启分析服务
 */
function restart() {
    clearInterval(Timer);
    Timer = setInterval(main, 500);
    Log.i('Analysis Service Restart');
    // main();
    setTimeout(main, 5000);
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
            'subscribers.0': { $exists: true } // 订阅者数组长度不小于1（subscribers[0]存在说明数组长度不小于1）
        }, function (err, stocks) {
            if (err) {
                Log.e(err, true, true);
                return;
            }
            // 下面代码需要进行调度优化
            for (var i = 0; i < stocks.length; i++) {
                subprocess(stocks[i]);
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
// var testStock = require(serverPath + '/test/analysis').testStock;
// var test = {};
function subprocess(stock) {
    // Log.i('subprocess: ' + stock.name + '(' + stock.code + ')');
    // if (!test[stock.code]) {
    //     test[stock.code] = testStock(stock.code);
    // }
    // test[stock.code].update(function (err, doc) {
    stock.update({
        save: false
    }, (err, _stock) => {
        // console.log(JSON.stringify(doc));
        if (err) {
            Log.e(err, true);
            setTimeout(subprocess, 10, stock);
            return;
        } else {
            // 调用分析模块
            var result = {
                list: []
            };
            for (key in analysisList) {
                try {
                    var ret = analysisList[key](stock);
                    if (ret) result[key] = result.list.push(ret);
                } catch (error) {
                    Log.e(error, true);
                }
            }
            stock.markModified('temp');
            stock.save().then(doc => {
                console.log(JSON.stringify(doc.temp));
                Log.i(doc.name + ' temp data save ok');
            }).catch(err => {
                console.log(JSON.stringify(stock.temp));
                Log.e(err, true);
            })
            if (result.list.length > 0) {
                console.log(JSON.stringify(result));
                // 存储分析结论
                Tip.create(result.list, function (err, tips) {
                    if (err) {
                        Log.e(err, true, true)
                    } else {
                        Log.i('存储分析结论成功');
                        // 执行推送
                        pushAnalysis(stock, result);
                        // 执行综合分析
                        // analysis(doc, result);
                    }
                });
            }
        }
    })
}

/**
 * 处理返回给用户的Tip数据
 * 屏蔽User._id，改点赞和反对为数字，判断用户是否参与点赞和反对
 * @param {Tip} tip 
 */
function parseTip(tip, userId) {
    tip.isThumbsUp = (tip.thumbsUp || []).indexOf(userId) >= 0;
    tip.thumbsUp = (tip.thumbsUp || []).length;
    tip.isThumbsDown = (tip.thumbsDown || []).indexOf(userId) >= 0;
    tip.thumbsDown = (tip.thumbsDown || []).length;
    delete tip.receivers;
    return tip
}

function pushAnalysis(stock, result) {
    var template = Push.Transmission(JSON.stringify({
        type: 'analysis',
        date: new Date(),
        data: result.list
    }));
    Push.pushMessageToApp(template, {
        tagList: [stock.code]
    }, (err, res) => {
        if (err) {
            Log.e(err, true);
        } else {
            Log.i(res);
        }
    });
}

function analysis(stock, result) {

}

/**
 * 心跳检测
 */
function heartBeatCheck() {
    var now = new Date();
    heartBeat.lastCheck = now;
    if (now - heartBeat.lastUpdate > heartBeat.limitInterval) {
        Log.w('Analysis service had stop.It is restart now.', true, true);
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
                    sql.receivers = user._id;
                    break;
                default:
                    sql.code = req.body.range;
            }
            var query = Tip.find(sql).sort({_id: -1});
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
                    for (var i = 0; i < tips.length; i++) {
                        tips[i] = parseTip(tips[i], user._id);
                    }
                    res.json({ state: 'ok', detail: '获取提醒列表成功', data: tips })
                }
            });
        }
    })
})



/**
 * 连接数据库,加载模型,启动分析进程
 */
// require(serverPath + '/localdb/model/index').getModels((err, models, mongodbose) => {
//     if (err) {
//         Log.e(err, true, true);
//     } else {
//         User = models.User;
//         Tip = models.Tip;
//         Stock = models.Stock;
//         Log.i('DB Models Loaded', true);
//         setInterval(function () {
//             heartBeatCheck();
//             heartBeat.lastCheck = new Date();
//         }, 60000);
//         restart();
//     }
// });

module.exports = function (models) {
    User = models.User;
    Tip = models.Tip;
    Stock = models.Stock;
    // setInterval(function () {
    //     heartBeatCheck();
    //     heartBeat.lastCheck = new Date();
    // }, 60000);
    // restart();
    return router;
}