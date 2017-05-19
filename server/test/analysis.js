var MongoClient = require('mongodb').MongoClient;
var Server = require('mongodb').Server;
var CONF_DB = require('../config.js').DB;

var quotations = []

var constr = 'mongodb://' + CONF_DB.user + ':' + CONF_DB.password + '@' + CONF_DB.host + ':' + CONF_DB.port + '/' + CONF_DB.db;
MongoClient.connect(constr, function (err, con) {
  if (err) {
    console.error('Connect fail: ' + err, err)
  } else {
    var db = con.db(CONF_DB.db);
    if (db) {
      db.authenticate(CONF_DB.user, CONF_DB.password, function (err, result) {
        if (err) {
          console.error('DB user authenticate fail: ' + err, err);
          client.close();
          console.log('Connect closed');
        } else {
          db.collection('tickTest', {}, function (err, collection) {
            if (err) {
              console.error('Access collection tickTest fail: ' + err, err);
              client.close();
              console.log('Connect closed');
            } else {
              collection.find((err, con) => {
                if (err) {
                  console.log(err)
                } else {
                  con.toArray((err, items) => {
                    quotations = items;
                    // analysis(items)
                  });
                }
              });
            }
          })
        }
      })
    } else {
      console.error('Cannot access db gtip')
    }
  }
});


function analysis(quotations) {
  var priceTip = require('../api/analysis/priceTip');
  var stockId = ['sh603003', 'sh600988', 'sz300456', 'sh600138', 'sh600803', 'sz300159'];
  var data = {}
  var result = null;
  // var s = 1;
  for (var s = 0; s < stockId.length; s++) {
    for (var i = 0; i < quotations.length; i++) {
      if (i === 0) {
        data[stockId[s]] = {
          code: stockId[s],
          temp: {}
        }
      }
      data[stockId[s]].quotation = quotations[i][stockId[s]];
      result = priceTip(data[stockId[s]])
      if (result.length > 0) {
        console.log('\n' + i);
        console.log(JSON.stringify(result));
      }
    }
  }
  console.log('done');
}

exports.testStock = function(code) {
  var stock = {};
  stock.index = 0;
  stock.temp = {};
  stock.update = function(cb) {
    // console.log(stock.index);
    stock.index ++;
    cb(null, {
      code: code,
      name: 'N' + code,
      temp: stock.temp,
      quotation: quotations[stock.index++][code]
    })
  }
  return stock;
}