var Modules = {};
var secret = require('../utils/secret');
require('../localdb/model').getModules(function(err, modules, mongoose) {
  if (err) {
    console.log(err);
  } else {
    Modules = modules;
    console.log('modules loaded')
    mongoose.set('debug', true);
    var token = secret.createToken('req.body.mail');
    var date = new Date(); 
    var user = new Modules.User({
      mail: 'testtest.me',
      nickname: 'req.body.nickname',
      password: 'req.body.password',
      token: token,
      lastLogin: date,
      clientId: 'req.body.clientId',
      state: 'online'
    });
    user.habit.loginTime.push(date);
    user.save().then(function(doc){
      console.log(doc);
    }).catch(function(err) {
      var data = {code: 'fail', detail: err.message, errors: {}}
      for(key in err.errors) {
        data.errors[key] = err.errors[key].message;
      }
      console.log(data);
    })
    // Modules.User.findOne({mail: 'req.body.mail1'}, function(err, result) {
    //   if (err) {
    //     console.log(err);
    //   } else {
    //     console.log(result);
    //   }
    // })
  }
});