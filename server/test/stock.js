// var quotation = require('../utils/stock/quotation.js');
// quotation([
//   'sz184728'
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

// var tradelist = require('../utils/stock/tradelist');
// tradelist('sh600988', 50, (err, data) => {
//   if (err) {
//     console.error(err);
//   } else {
//     for(var i = 0; i < data.list.length; i++) {
//       data.list[i].date = data.list[i].date.toLocaleString()
//       console.log(JSON.stringify(data.list[i]));
//     }
//   }
// })

var CompanyInfo = require('../utils/stock/companyInfo');
CompanyInfo('sh600988', (err, data) => {
  if (err) {
    console.error(err)
  } else {
    console.log(data);
  }
})

// require('../localdb/model/stock').getModel((err, Stock) => {
//   if (err) {
//     console.error(err)
//   } else {
//     Stock.create('sh600988', (err, stock) => {
//       if (err) {
//         console.error(err);
//       } else {
//         console.log(JSON.stringify(stock));
//       }
//     })
//   }
// });

// require('../localdb/model/stock').getModel((err, Stock) => {
//   if (err) {
//     console.error(err)
//   } else {
//     Stock.findOne({ code: 'sh600988' }, (err, stock) => {
//       if (err) {
//         console.error(err);
//       } else if (stock === null) {
//         console.error('cannot find the stock');
//       } else {
//         stock.update({
//           save: false,
//           fetchTradeNum: 5
//         }, (err, doc) => {
//           if (err) {
//             console.error(err);
//           } else {
//             console.log(JSON.stringify(doc.tradeList));
//           }
//         })
//       }
//     })
//   }
// });

