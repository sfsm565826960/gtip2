(function($, doc, Server, view, App) {
	//修改密码
	var resetPwdBtn = doc.getElementById('resetPwdBtn');
	var oldPwdBox = doc.getElementById('oldPwd');
	var newPwdBox = doc.getElementById('newPwd');
	var newPwd2Box = doc.getElementById('newPwd2');
	// 绑定手机
	var phoneBox = doc.getElementById('phone');
	// 初始化页面
	viewApi.view.addEventListener('pageBeforeShow', function(e) {
		switch(e.detail.page.id) {
			case 'changePwd':
				oldPwdBox.value = '';
				newPwdBox.value = '';
				newPwd2Box.value = '';
				break;
		}
	});
	resetPwdBtn.addEventListener('tap', function(e) {
		if(oldPwdBox.value.length < 6) {
			$.toast('旧密码错误');
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
		var w = plus.nativeUI.showWaiting('提交中', {
			back: 'none',
			width: '100px',
			height: '100px'
		});
		Server.send('user/password', {
			token: App.getToken(),
			oldPassword: oldPwdBox.value,
			newPassword: newPwdBox.value
		}, function(res) {
			w.close();
			if(res) {
				if(res.state == 'ok') {
					$.toast('密码修改成功！');
					$.back();
				} else { $.toast(res.detail); }
			} else { $.toast('服务器返回格式错误'); }
		});
	}, false);
	$.enterfocus('#resetPwd-form input', function() {
		$.trigger(resetPwdBtn, 'tap');
	});
})(mui, document, Server, viewApi.view, App);