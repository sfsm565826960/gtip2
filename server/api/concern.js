/**
 * 该模块用于获取关于用户关注的相关信息
 */

var express = require('express');
var router = express.Router();
var User = null;
var Log = require('../utils/log')({
  file: 'api.concern.log'
});
