var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('router /api test success');
});

router.use('/fetch', require('./fetch'));
router.use('/user', require('./user'));

module.exports = router;
