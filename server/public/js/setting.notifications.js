//加载设置
mui.plusReady(function() {
	var settings = App.getSettings();
	var notifications = settings.notifications || {};
	var modifyData = {}; // 被修改的数据
	var isSettingsChange = false; // 是否更改了设置
	//新信息通知
	for(key in notifications) {
		var elm = doc.getElementById(key);
		if(!elm) {
			console.error(key + 'has no match element');
			continue;
		}
		console.log('add:' + key);
		elm.addEventListener("toggle", function(e) {
			modifyData[e.target.id] = e.detail.isActive;
			isSettingsChange = true;
		});
	}
	viewApi.view.addEventListener('pageBeforeShow', function(e) {
		if(e.detail.page.id === 'notifications') {
			var settings = App.getSettings();
			var notifications = settings.notifications || {};
			for(key in notifications) {
				var elm = doc.getElementById(key);
				if(elm) elm.classList[notifications[key] === true ? 'add' : 'remove']('mui-active');
			}
		}
	});
	viewApi.view.addEventListener('pageBack', function(e) {
		console.log(isSettingsChange)
		if(e.detail.page.id === 'notifications') {
			if(isSettingsChange) {
				console.log(JSON.stringify(modifyData));
				Server.send('settings/notifications', {
					token: App.getToken(),
					settings: JSON.stringify(modifyData)
				}, function(res) {
					if(res) {
						if(res.state == 'ok') {
							$.toast('设置提醒成功');
							App.setSettings(res.data);
						} else {
							$.toast(res.detail);
						}
					} else {
						$.toast('服务器返回格式错误');
					}
				});
				modifyData = {};
				isSettingsChange = false;
			}
		}
	});
});