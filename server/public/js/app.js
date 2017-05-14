(function($, owner, server) {
	var API_HOST = 'http://gtip.sfsm.me:3305/api/';
	var _temp = {};
	_temp.expired = function(keep) {
		if(!keep) keep = 300000;
		return new Date(new Date().getTime() + keep);
	}
	/**
	 * 与服务器交换方法
	 * @param {String} url 如果没有加http则会自动补上http://project.sfsm.me/gtip/
	 * @param {Object} params 若没有参数token则自动追加该参数
	 * @param {Function} callback function(res){}
	 * @param {String} method
	 * @param {String} resType json,xml,text,html,script
	 */
	server.send = function(url, params, callback, method, resType) {
		$.plusReady(function() {
			if(typeof params === 'function') {
				resType = method;
				method = callback;
				callback = params;
				params = {};
			}
			var hasCB = typeof callback === 'function';
			if(plus.networkinfo.getCurrentType() == plus.networkinfo.CONNECTION_NONE) {
				if(hasCB) {
					callback({
						'state': 'CONNECTION_NONE',
						'detail': '请开启网络'
					});
				} else {
					$.toast("请开启网络！");
				}
				return null;
			}
			if(!url || url.length == 0) {
				if(hasCB) {
					callback({
						state: 'fail',
						detail: '请求地址不能为空!'
					});
				} else {
					$.toast("请求地址不能为空!");
				}
				return null;
			}
			if(url.indexOf("http") < 0) url = API_HOST + url;
			method = method || 'post';
			method = method.toLowerCase();
			$.ajax(url, {
				data: params || {},
				dataType: resType || 'json',
				type: method,
				timeout: 10000,
				crossDomain: true, // 强制跨域，要求5+
				success: function(res) {
					console.log('server return: ' + (typeof res === 'object'?JSON.stringify(res):res));
					if(res && res.state == 'logout') {
						owner.reLogin();
						if(hasCB) {
							callback({
								'state': 'logout',
								'detail': '登录令牌失效，请重新登录'
							});
						} else {
							$.toast('登录失效，请重新登录');
						}
					} else {
						if(hasCB) {
							callback(res || {
								state: 'fail',
								detail: '获取数据失败'
							});
						}
					}
				},
				error: function(xhr, type, errorThrown) {
					console.error('server fail: ' + type + ',' + url);
					if(hasCB) {
						callback({
							state: type,
							detail: errorThrown
						})
					} else {
						$.toast(errorThrown)
					}
				}
			})
		})
	}

	/**
	 * 清除所有用户数据
	 */
	owner.clear = function() {
		owner.setState({});
		owner.setSettings({});
		// 清空系统消息中心所有的推送消息。
		plus.push.clear();
	}

	/**
	 * 要求用户重新登录
	 */
	owner.reLogin = function() {
		owner.clear();
		mui.openWindow({
			url: 'login.html',
			id: 'login',
			show: {
				aniShow: 'pop-in'
			},
			waiting: {
				autoShow: false
			}
		});
	}

	/**
	 * 获取当前状态
	 **/
	owner.getState = function() {
		if(_temp.state && _temp.state._expired > new Date()) {
			return _temp.state
		} else {
			var stateText = localStorage.getItem('$state') || "{}";
			_temp.state = JSON.parse(stateText);
			_temp.state._expired = _temp.expired();
			return _temp.state;
		}
	};

	/**
	 * 设置当前状态
	 **/
	owner.setState = function(state) {
		_temp.state = state || {}
		_temp.state._expired = _temp.expired();
		localStorage.setItem('$state', JSON.stringify(_temp.state));
	};

	/**
	 * 获取用户令牌
	 */
	owner.getToken = function() {
		return owner.getState().token || '';
	}

	/**
	 * 获取应用本地配置
	 **/
	owner.setSettings = function(settings) {
		_temp.settings = settings || {};
		_temp.settings._expired = _temp.expired();
		localStorage.setItem('$settings', JSON.stringify(_temp.settings));
	}

	/**
	 * 设置应用本地配置
	 **/
	owner.getSettings = function() {
		if(_temp.settings && _temp.settings._expired > new Date()) {
			return _temp.settings;
		} else {
			var settingsText = localStorage.getItem('$settings') || "{}";
			_temp.settings = JSON.parse(settingsText);
			_temp.settings._expired = _temp.expired();
			return _temp.settings;
		}
	}
	
	owner.getConcern = function() {
		if (_temp.concern && _temp.concern._expired > new Date()) {
			return _temp.concern;
		} else {
			var concernText = localStorage.getItem('$concern') || '{}';
			_temp.concern = JSON.parse(concernText);
			_temp.concern._expired = _temp.expired();
			return _temp.concern;
		}
	}
	
	owner.setConcern = function (concern) {
		_temp.concern = concern || {};
		_temp.concern._expired = _temp.expired();
		localStorage.setItem('$concern', JSON.stringify(_temp.concern));
	}

	/**
	 * 创建数据仓库
	 * @param {Object} params
	 * @param {Object} callback
	 */
	owner.createState = function(params, callback) {
		// 创建状态
		var state = owner.getState();
		state.mail = params.mail;
		state.nickname = decodeURI(params.nickname);
		state.token = params.token;
		owner.setState(state);
		// 创建关注
		owner.setConcern(params.concern);
		// 创建设置
		var settings = owner.getSettings();
		settings.receiveNotify = params.settings.receiveNotify;
		settings.voiceBroadcast = params.settings.voiceBroadcast;
		if(settings.voiceBroadcast === true) {
			plus.device.setWakelock(true);
			mui.toast('语音播报已开启');
		}
		settings.autoLogin = params.settings.autoLogin;
		if(settings.autoLogin === true) {
			settings.gestures = params.settings.gestures;
		} else {
			settings.gestures = '';
		}
		owner.setSettings(settings);
		// 回调函数
		return callback();
	};

	var checkEmail = function(email) {
		email = email || '';
		return(email.length > 3 && email.indexOf('@') > -1);
	};

	/**
	 * 用户登录
	 * @param {Object} loginInfo 若为null则使用token进行登录
	 * @param {Function} callback function(err){}
	 **/
	owner.login = function(loginInfo, callback) {
		callback = callback || $.noop;
		if(loginInfo != null) {
			loginInfo = loginInfo || {};
			loginInfo.mail = loginInfo.mail || '';
			loginInfo.password = loginInfo.password || '';
			if(typeof loginInfo.autoLogin !== 'boolean') loginInfo.autoLogin = false;
			if(!checkEmail(loginInfo.mail)) {
				return callback('邮箱地址不合法');
			}
			if(loginInfo.password.length < 6) {
				return callback('密码最短为 6 个字符');
			}
			loginInfo.token = ''; // 不使用Token
			var cinfo = plus.push.getClientInfo();
			loginInfo.clientId = cinfo.clientid || cinfo.token;
		} else {
			loginInfo = {
				token: owner.getToken()
			}
		}
		server.send('user/login', loginInfo, function(res) {
			if(res.state === 'ok') {
				owner.createState(res.data, callback);
			} else {
				callback(res.detail);
			}
		});
	};

	/**
	 * 新用户注册
	 **/
	owner.register = function(regInfo, callback) {
		callback = callback || $.noop;
		regInfo = regInfo || {};
		regInfo.mail = regInfo.mail || '';
		regInfo.password = regInfo.password || '';
		regInfo.nickname = regInfo.nickname || '';
		if(!checkEmail(regInfo.mail)) {
			return callback('邮箱地址不合法');
		}
		if(regInfo.password.length < 6) {
			return callback('密码最短需要 6 个字符');
		}
		if(regInfo.nickname.length < 2) {
			return callback('昵称最少需要2个字符');
		}
		var cinfo = plus.push.getClientInfo();
		regInfo.clientId = cinfo.clientid || cinfo.token;
		server.send('user/register', regInfo, function(res) {
			if(res.state === 'ok') {
				owner.createState(res.data, callback);
			} else {
				callback(res.detail);
			}
		});
	};

	/**
	 * 用户注销
	 * @param {Function} callback function(err,msg)
	 */
	owner.logout = function(callback) {
		callback = callback || function(err) {
			$toast(err || '退出用户成功');
		}
		server.send('user/logout', {
			offline: false,
			token: owner.getToken()
		}, function(res) {
			if(res, state === 'ok') {
				owner.reLogin();
				callback(null);
			} else {
				callback(res.detail);
			}
		})
	}

	/**
	 * 找回密码
	 * @param {String} email
	 * @param {Function} callback function(errmsg, okmsg){};
	 **/
	owner.forgetPassword = function(email, callback) {
		callback = callback || $.noop;
		if(!checkEmail(email)) {
			return callback('邮箱地址不合法');
		}
		server.send('user/forget', {
			mail: email
		}, function(res) {
			if(res.state === 'ok') {
				callback(null, '新的随机密码已经发送到您的邮箱，请查收邮件。');
			} else {
				callback(res.detail);
			}
		});
	};

	/**
	 * 修改密码
	 * @param {Object} pwdInfo
	 * @param {Function} callback function(errmsg, okmsg){};
	 */
	owner.changePassword = function(pwdInfo, callback) {
		callback = callback || $.noop;
		server.send('user/password', pwdInfo, function(res) {
			if(res.state === 'ok') {
				owner.reLogin();
				callback(null, '密码修改成功，请重新登录！');
			} else {
				callback(res.detail);
			}
		});
	}

	owner.quit = function() {
		server.send("user/logout", {
			offline: true,
			isExit: true,
			token: owner.getToken()
		}, function(res) {
			plus.runtime.quit();
		});
		setTimeout(plus.runtime.quit, 3000); //若3秒内还没退出则强制退出
	}

	owner.pause = function() {
		var isDone = false;
		var pause = function() {
			if(isDone) return;
			isExit = true;
			$.toast('后台接收通知');
			var main = plus.android.runtimeMainActivity();
			main.moveTaskToBack(false);
		}
		server.send("user/logout", {
			offline: true,
			isExit: false,
			token: owner.getToken()
		}, function(res) {
			if(!isDone) pause();
		});
		setTimeout(pause, 3000);
	}

	owner.resume = function() {
		var settings = owner.getSettings();
		var cinfo = plus.push.getClientInfo();
		server.send('user/login', {
			token: owner.getToken()
		}, function(res) {
			if(res.state === 'ok') {
				if(settings.voiceBroadcast) {
					plus.device.setWakelock(true);
				}
			} else {
				owner.reLogin();
				$.toast('登录过期，请重新登录！');
			}
		});
	}
}(mui, window.app = {}, window.server = {}));