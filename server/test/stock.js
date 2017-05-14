// var quotation = require('../utils/stock/quotation.js');
// quotation([
//   'sh000001'
// ], function(err, data) {
//   if (err) {
//     console.error(err);
//   } else {
//     console.log(JSON.stringify(data));
//   }
// })

// var realtime = require('../utils/stock/realtime');

// realtime('sh601212', (err, data) => {
//   if (err) {
//     console.error(err);
//   } else {
//     console.log(JSON.stringify(data))
//   }
// })

require('../localdb/model/stock').getModel((err, Stock) => {
  if (err) {
    console.error(err)
  } else {
    Stock.create('sh601212', (err, stock) => {
      if (err) {
        console.error(err);
      } else {
        console.log(JSON.stringify(stock));
        stock.save().then(doc => {
          console.log('ok')
        })
      }
    })
  }
});