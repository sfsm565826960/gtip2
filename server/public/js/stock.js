/**
 * 用于获取股票相关数据
 * @param {Object} $
 * @param {Object} stock
 * @description 依赖模块app.js的server
 */
(function($, stock, server) {
	if (typeof server.send !== 'function') {
		console.error('缺少模块app.js');
		return;
	}
	/**
	 * 获取实时股票数据
	 * @param {Array|String} list 股票代码列表
	 * @param {Function} callback function(res){}
	 */
	stock.realTime = function(list, callback) {
		var url = 'http://hq.sinajs.cn/list=' + (typeof list === 'string' ? list : list.join(','));
		var retry = 0;
		var task = function(url) {
			server.send(url, function(res) {
				if (res.state === 'ok') {
					
				}
				if(err) {
					callback(err);
				} else {
					if(body && body.length > 0) {
						parseQuotation(body, callback);
					} else {
						if(++retry < 3) {
							task(url);
						} else {
							callback(new Error('Fetch empty: ' + url));
						}
					}
				}
			}, 'get');
		};
		task(url);
	}
})(mui, window.stock = {}, window.server || {});