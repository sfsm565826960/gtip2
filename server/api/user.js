/**
 * 该模块用于实现用户登录、注册、退出、在线状态切换
 */

var express = require('express');
var router = express.Router();
// var userDb = null;
// require('../utils/db.js').getCollection('user', function(err, collection) {
//   if (err) {
//     console.error(err);
//   } else {
//     userDb = collection;
//   }
// })
var Modules = {};
require('../localdb/module').getModules(function(err, modules) {
  if (err) {
    Log.e(err, true, true);
  } else {
    Modules = modules;
  }
});

/* GET users listing. */
router.post('/login', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/logout', function(req, res, next) {

});

router.post('/register', function(req, res, next) {
  var user = new Modules.User({
    mail: req.body.mail,
    nickname: req.body.nickname,
    password: req.body.password,
    clientId: req.body.clientId
  });
  user.save();
});

module.exports = router;
