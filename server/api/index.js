var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.use('/fetch', require('./fetch.js'));
router.use('/user', require('./user.js'));

module.exports = router;
