var http = require('../utils/http');
var async = require('async');

var times = [];

function sub(i, cb){
  var start = Date.now();
  console.time('第' + i + '次');
  var url = [
    'http://hq.sinajs.cn/list=sh600988',
    'http://hq.sinajs.cn/list=sz300456',
    'http://hq.sinajs.cn/list=sh603003',
    'https://gupiao.baidu.com/api/stocks/stocktimeline?from=pc&os_ver=1&cuid=xxx&vv=100&format=json&stock_code=sh600988',
    'https://gupiao.baidu.com/api/stocks/stocktimeline?from=pc&os_ver=1&cuid=xxx&vv=100&format=json&stock_code=sh603003',
    'https://gupiao.baidu.com/api/stocks/stocktimeline?from=pc&os_ver=1&cuid=xxx&vv=100&format=json&stock_code=sz300456'
  ]
  url = url[Math.floor(url.length * Math.random())];
  http.get(url, function(err, body) {
    var cost = Date.now() - start;
    // console.log('第' + i + '次：' + cost);
    console.timeEnd('第' + i + '次');
    times.push(cost);
    cb();
  })
}

function arrAverageNum2(arr){
    var sum = eval(arr.join("+"));
    return ~~(sum/arr.length*100)/100;
}

// sub(1);

var index = [];
for(var i = 0; i < 100; i++) {
  index.push(i);
}
async.mapLimit(index, 20, sub, () => {
  times.sort();
  console.log('max: ' + times.pop());
  console.log('avg: ' + arrAverageNum2(times));
})


