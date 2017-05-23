/**
 * 本模块用于分析结论管理
 */
var cluster = require('cluster');
var express = require('express');
var async = require('async');
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
var analysisList = { // 分析工具
    priceTip: require('./priceTip')
};
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
    Timer = setInterval(main, 60000);
    Log.i('Analysis Service Restart');
    main();
}

/**
 * 分析服务主函数
 * 用于获取所有受关注的股票并调用子函数进行分析
 */
function main() {
    // 更新心跳时间，说明分析服务正在运行
    heartBeat.lastUpdate = new Date();
    // 如果不是交易时间则跳过分析服务
    if (!isTradeTime()) return;
    // 获取所有受关注的股票
    try {
        Stock.find({
            'subscribers.0': { $exists: true } // 订阅者数组长度不小于1（subscribers[0]存在说明数组长度不小于1）
        }, function (err, stocks) {
            if (err) {
                Log.e(err, true, true);
                return;
            }
            console.time('Analysis Complate');
            async.mapLimit(stocks, 20, subprocess, () => {
                console.timeEnd('Analysis Complate');
            });
        })
    } catch (err) {
        Log.e(err, true);
    }
}


/**
 * 更新该股票的数据
 * 调用分析模块对股票进行分析
 * @param {Stock} stock 股票对象
 * @param {Function} callback 当stock.update完成后调用，用于async.mapLimit
 */
function subprocess(stock, callback) {
    // 更新股票数据
    stock.update({
        save: false // 更新股票数据后暂不存到数据库
    }, (err, _stock) => {
        typeof callback === 'function' && callback(); // update请求结束，告知async更新下一个股票数据
        if (err) {
            Log.e(err, true);
            setTimeout(subprocess, 10, stock); // 若更新失败，记录错误信息后重试
            return;
        } else {
            var result = { list: [] }; // 分析结果对象
            // 调用分析模块
            for (key in analysisList) {
                try {
                    // 要求每个分析工具最多返回一个分析结果
                    var ret = analysisList[key](stock);
                    // 若无分析结论则忽略，有则推入数组并建立哈希索引
                    if (ret) result[key] = result.list.push(ret);
                } catch (error) {
                    Log.e(error, true);
                }
            }
            // 将分析工具的临时数据存入数据库
            stock.markModified('temp');
            stock.save().then(doc => {
                // Log.i(doc.name + ' temp data save ok');
            }).catch(err => {
                Log.e(err, true);
            });
            // 处理分析结果，若分析结果为空则跳过
            if (result.list.length > 0) {
                Log.i(JSON.stringify(result));
                // 存储分析结论
                Tip.create(result.list, function (err, tips) {
                    if (err) {
                        Log.e(err, true);
                    } else {
                        // Log.i('存储分析结论成功');
                        // 执行综合分析
                        // analysis(doc, result);
                        // 执行推送
                        // pushAnalysis(stock, result);
                    }
                });
            }
        }
    })
}

/**
 * 综合分析股票
 */
function analysis(stock, result) {

}

/**
 * 推送提示给客户端
 */
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

/**
 * 判断是否交易时间
 */
function isTradeTime() {
    var date = new Date();
    var day = date.getDay();
    if (day > 5 || day < 1) return false;
    var hour = date.getHours();
    var minute = date.getMinutes();
    var time = hour * 100 + minute;
    if (time < 930 || time > 1500) return false;
    if (time > 1130 && time < 1300) return false;
    return true;
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
    heartBeatCheck();// 心跳检测
    if (!req.body.range || req.body.range.length === 0) req.body.range = 'my';
    User.getUserByToken(req.body.token, (err, user) => {
        if (err) {
            res.json(err);
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
// function init() {
//     require(serverPath + '/localdb/model/index').getModels({
//             server: {
//                 poolSize: 50,
//                 auto_reconnect: true
//             }
//         }, (err, models, mongodbose) => {
//         if (err) {
//             Log.e(err, true, true);
//         } else {
//             User = models.User;
//             Tip = models.Tip;
//             Stock = models.Stock;
//             Log.i('DB Models Loaded', true);
//             setInterval(function () {
//                 heartBeatCheck();
//                 heartBeat.lastCheck = new Date();
//             }, 60000);
//             restart();
//         }
//     });
// }

module.exports = function (models) {
    User = models.User;
    Tip = models.Tip;
    Stock = models.Stock;
    restart();
    setInterval(heartBeatCheck, 60000);
    // init();
    return router;
}