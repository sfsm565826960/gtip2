var util = require('util');

var a = {a: 1}
var b = undefined;

util._extend(a, b);

console.log(a, b);