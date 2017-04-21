var quotation = require('../utils/quotation.js');

quotation([
  'sh000001'
], function(err, data) {
  if (err) {
    console.error(err);
  } else {
    console.log(JSON.stringify(data));
  }
})