/**
 * 测试timeout和interval的稳定性
 */

var MongoClient = require('mongodb').MongoClient;
var Server = require('mongodb').Server;
var CONF_DB = require('../config.js').DB;

var collectionTickTest = null;
var setIntervalIndex = 0;
var setTimeoutIndex = 0;

function runTest() {
  if (!collectionTickTest) return;
  console.info('tickTest start');
  setInterval(function(){
    collectionTickTest.insert({
      type: 'setInterval',
      time: new Date().getTime(),
      index: ++setIntervalIndex
    }, function(err, results) {
      if (err) {
        console.error('insert fail: ' + err, err);
      }
    });
  }, 1000);

  var timeoutInsert = function() {
    collectionTickTest.insert({
      type: 'setTimeout',
      time: new Date().getTime(),
      index: ++setTimeoutIndex
    }, function(err, results) {
      if (err) {
        console.error('insert fail: ' + err, err);
      }
    })
    setTimeout(timeoutInsert, 1000);
  }
  setTimeout(timeoutInsert, 1000);
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
              runTest();
            }
          })
        }
      })
    } else {
      console.error('Cannot access db gtip')
    }
  }
});