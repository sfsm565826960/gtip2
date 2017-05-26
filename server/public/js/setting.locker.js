 //************************
 //锁屏设置
 (function($, doc) {
	var lockStateButton = doc.getElementById("lockState");
	var locker = doc.querySelector('.mui-locker');
	function saveGestures(gestures) {
		var settings = App.getSettings();
		var account = settings.account || {};
		account.gestures = gestures;
		settings.account = account;
		App.setSettings(settings);
	}
	lockStateButton.addEventListener('toggle', function(event) {
		var isActive = event.detail.isActive;
		locker.style.display = isActive ? 'block' : 'none';
		if (!isActive) saveGestures('');
	}, false);
	var record = [];
	locker.addEventListener('done', function(event) {
		var rs = event.detail;
		if (rs.points.length < 4) {
			plus.nativeUI.toast('设定的手势太简单了');
			record = [];
			rs.sender.clear();
			return;
		}
		record.push(rs.points.join(''));
		if (record.length >= 2) {
			if (record[0] == record[1]) {
				$.toast('解锁手势设定成功，以后用户只需使用手势解锁而无需输入密码登录。');
				saveGestures(record[0])
				setTimeout($.back, 200);
			} else {
				$.toast('两次手势不一致,请重新设定');
			}
			rs.sender.clear();
			record = [];
		} else {
			$.toast('请确认手势设定');
			rs.sender.clear();
		}
	}, false);
}(mui, document));
viewApi.view.addEventListener('pageShow', function(e) {
	//进入手执设定界面时
	if (e.detail.page.id == 'lock') {
		var settings = App.getSettings();
		var account = settings.account || {};
		var hasGestures = account.gestures && account.gestures.length > 0;
		var lockStateButton = document.getElementById("lockState");
		var locker = document.querySelector('.mui-locker');
		lockStateButton.classList[hasGestures ? 'add' : 'remove']('mui-active')
		locker.style.display = hasGestures ? 'block' : 'none';
	}
});