var Log = require('../utils/log.js')({
  file: 'testLog.log'
});

Log.d('test d');
Log.i('test i');
Log.e('test e');
Log.w('test w');

Log.d('test d f', true);
Log.i('test i f', true);
Log.e('test e f', true);
Log.w('test w f', true);

Log.d('test d f m', true, true);
Log.i('test i f m', true, true);
Log.e('test e f m', true, true);
Log.w('test w f m', true, true);