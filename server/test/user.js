var Modules = {};
require('../localdb/module').getModules(function(err, modules, mongoose) {
  if (err) {
    console.log(err);
  } else {
    Modules = modules;
    mongoose.set('debug', true);
    var user = new Modules.User({
      mail: 'req.body.mail',
      nickname: 'req.body.nickname',
      password: 'req.body.password',
      clientId: 'req.body.clientId'
    });
    user.save();
  }
});