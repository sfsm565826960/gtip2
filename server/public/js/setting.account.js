(function($, doc, Server, view, App) {
	view.addEventListener('pageShow', function(e) {
		switch(e.detail.page.id) {
			case 'account':
				var state = App.getInfo();
				var nickBox = doc.getElementById('accountNick');
				var mailBox = doc.getElementById('accountMail');
				var levelBox = doc.getElementById('accountLevel');
				nickBox.firstElementChild.innerHTML = state.nick;
				mailBox.firstElementChild.innerHTML = state.account;
				levelBox.firstElementChild.innerHTML = state.level;
				break;
			default:
				break;
		}
	});
	//修改昵称
	doc.getElementById('accountNick').addEventListener('tap', function(e) {
		plus.nativeUI.prompt('修改昵称', function(e) {
			if(e.index == 0) {
				if(e.value.length < 3) {
					$.toast('昵称不能少于3个字符');
				} else {
					Server.send('account.php', {
						'do': "nick",
						'nick': e.value
					}, function(res) {
						if(res) {
							if(res.state == 'ok') {
								var state = App.getInfo();
								state.nick = decodeURI(res.nick);
								App.setInfo(state);
								var nickBox = doc.getElementById('accountNick');
								nickBox.firstElementChild.innerHTML = state.nick;
								mui.toast('修改成功');
							} else {
								mui.toast(res.detail);
							}
						} else {
							mui.toast('服务器返回格式错误');
						}
					});
				}
			}
		}, '账户信息', '不能少于3个字符', ['修改', '取消']);
	}, false);
	//修改密码
	var resetPwdBtn = doc.getElementById('resetPwdBtn');
	resetPwdBtn.addEventListener('tap', function(e) {
		var oldPwdBox = doc.getElementById('oldPwd');
		var newPwdBox = doc.getElementById('newPwd');
		var newPwd2Box = doc.getElementById('newPwd2');
		if(oldPwdBox.value.length < 6) {
			$.toast('旧密码格式错误');
			return false;
		}
		if(newPwdBox.value.length < 6) {
			$.toast('新密码最短不能少于6个字符');
			newPwd2Box.value = '';
			return false;
		}
		if(newPwdBox.value != newPwd2Box.value) {
			$.toast('两次输入的新密码不同');
			return false;
		}
		Server.send('account.php', {
			'do': 'pwd',
			'newPwd': newPwdBox.value,
			'oldPwd': oldPwdBox.value
		}, function(res) {
			if(res) {
				if(res.state == 'ok') {
					$.toast('密码修改成功！');
					$.back();
				} else {
					$.toast(res.detail);
				}
			} else {
				$.toast('服务器返回格式错误');
			}
		});
	}, false);
	$.enterfocus('#resetPwd-form input', function() {
		$.trigger(resetPwdBtn, 'tap');
	});
})(mui, document, Server, viewApi.view, App);