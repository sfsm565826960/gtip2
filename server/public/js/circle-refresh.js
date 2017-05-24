function CircleRefresh(option, onRefresh) {
	var enabled = false;
	var loadding = false;
	var self = this;
	if(typeof onRefresh !== 'function') onRefresh = function(endRefresh) {
		console.log('CircleRefresh Invaild Callback');
		setTimeout(endRefresh, 1000);
	}
	self.isEnable = function() {
		return enabled;
	};
	self.doRefresh = function() {
		if(loadding) return;
		if(!enabled) {
			self.setEnabled(true);
			enabled = false;
		}
		plus.webview.currentWebview().beginPullToRefresh();
	};
	self.onRefresh = function(cb) {
		onRefresh = cb;
	};
	self.endRefresh = function() {
		loadding = false;
		plus.webview.currentWebview().endPullToRefresh();
		if(!enabled) {
			self.setEnabled(false);
		}
	};
	self.setEnabled = function(enable) {
		if(loadding || enable === enabled) return;
		enabled = enable;
		mui.plusReady(function() {
			option.support = enable;
//			console.log((enable ? '开启' : '关闭') + '下拉');
			option.style = 'circle';
			plus.webview.currentWebview().setPullToRefresh(option, function() {
				loadding = true;
				onRefresh(self.endRefresh);
			});
		});
	};
}