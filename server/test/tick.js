/**
 * 测试timeout和interval的稳定性
 */

var MongoClient = require('mongodb').MongoClient;
var Server = require('mongodb').Server;
var CONF_DB = require('../config.js').DB;

var collectionTickTest = null;
var setIntervalIndex = 0;
var setTimeoutIndex = 0;
var interval = 1000 * 60;

function runTest() {
  if (!collectionTickTest) return;
  console.info('tickTest start');
  setInterval(function(){
    collectionTickTest.insert({
      type: 'setInterval60',
      time: new Date().getTime(),
      index: ++setIntervalIndex
    }, function(err, results) {
      if (err) {
        console.error('insert fail: ' + err, err);
      }
    });
  }, interval);

  var timeoutInsert = function() {
    collectionTickTest.insert({
      type: 'setTimeout60',
      time: new Date().getTime(),
      index: ++setTimeoutIndex
    }, function(err, results) {
      if (err) {
        console.error('insert fail: ' + err, err);
      }
    })
    setTimeout(timeoutInsert, interval);
  }
  setTimeout(timeoutInsert, interval);
}

function analysis (result) {
  var count = result.length;
  console.log('count: ' + count);
  // 总差
  var sumDiff = (result[count - 1].time - result[0].time) - count * interval;
  console.log('sumDiff: ' + sumDiff);
  // 平均值
  var average = (result[count - 1].time - result[0].time) / count;
  console.log('average: ' + average);
  // 每个值
  var individual = [];
  // 极差
  var max = interval, min = interval;
  // 方差
  var variance = 0;
  for (var i = 0; i < count -1; i++) {
    individual.push(result[i + 1].time - result[i].time);
    if (individual[i] > max) {
      max = individual[i];
    } else if (individual[i] < min) {
      min = individual[i];
    }
    variance += Math.pow((individual[i] - average), 2);
  }
  console.log('max: ' + max + ', min: ' + min + ', maxDiff: ' + (max -min));
  console.log('variance: ' + (variance / count))
}

function analysisSetInterval () {
  if (!collectionTickTest) return;
  console.info('tickTest analysis setInterval');
  collectionTickTest.find({
    type: 'setInterval60'
  }).toArray(function(err, result){
    if (err) {
      console.error('find setInterval result fail: ' + err, err);
    } else {
      analysis(result);
    }
  });
}

function analysisSetTimeout () {
  if (!collectionTickTest) return;
  console.info('tickTest analysis setTimeout');
  collectionTickTest.find({
    type: 'setTimeout60'
  }).toArray(function(err, result){
    if (err) {
      console.error('find setTimeout result fail: ' + err, err);
    } else {
      analysis(result);
    }
  });
}

var constr = 'mongodb://' + CONF_DB.user + ':' + CONF_DB.password + '@' + CONF_DB.host + ':' + CONF_DB.port + '/' + CONF_DB.db;
MongoClient.connect(constr, function(err, con) {
  if (err) {
    console.error('Connect fail: ' + err, err)
  } else {
    var db = con.db(CONF_DB.db);
    if (db) {
      db.authenticate(CONF_DB.user, CONF_DB.password, function(err, result) {
        if (err) {
          console.error('DB user authenticate fail: ' + err, err);
          client.close();
          console.log('Connect closed');
        } else {
          db.collection('tickTest', {}, function(err, collection) {
            if (err) {
              console.error('Access collection tickTest fail: ' + err, err);
              client.close();
              console.log('Connect closed');
            } else {
              collectionTickTest = collection;
              // runTest();
              // analysisSetInterval();
              analysisSetTimeout();
            }
          })
        }
      })
    } else {
      console.error('Cannot access db gtip')
    }
  }
});