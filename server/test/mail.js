var mail = require('../utils/mail');

mail.send('1078777529@qq.com', '测试', '测试内容', function(err, info) {
  if (err) {
    console.error(err, 1)
  } else {
    console.log(info, 1)
  }
})

mail.send('565826960@qq.com', '测试2', '测试内容2', function(err, info) {
  if (err) {
    console.error(err, 2)
  } else {
    console.log(info, 2)
  }
})