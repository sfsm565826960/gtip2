(function($, owner, Server) {
	var API_HOST = 'http://gtip.sfsm.me:3305/api/';
	var _temp = {};
	_temp.expired = function(keep) {
		if(!keep) keep = 1000;
		return new Date(new Date().getTime() + keep);
	}
	var keepUserOnlineTimer = null; // 用于保持用户在线
	/**
	 * 与服务器交换方法
	 * @param {String} url 如果没有加http则会自动补上http://project.sfsm.me/gtip/
	 * @param {Object} params 发送的参数对象
	 * @param {Function} callback function(res){}
	 * @param {String} method
	 * @param {String|Object} option resType|option:{ resType: json|xml|text|html|script, timeoutRetry: true, timeout: 10000 }
	 */
	Server.send = function(url, params, callback, method, option) {
		$.plusReady(function() {
			if(typeof params === 'function') {
				option = method;
				method = callback;
				callback = params;
				params = {};
			}
			if(typeof method === 'object') {
				option = method;
				method = undefined;
			}
			if(typeof option === 'string') {
				option = {
					resType: option
				};
			} else if(typeof option !== 'object') {
				option = {};
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
			if(!url) {
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
				dataType: option.resType || 'json',
				type: method,
				timeout: option.timeout || 10000,
				crossDomain: true, // 强制跨域，要求5+
				success: function(res) {
					//	console.log('Server return: ' + (typeof res === 'object'?JSON.stringify(res):res));
					if(res && res.state == 'logout') {
						var token = owner.getToken();
						var account = owner.getSettings().account || {};
						var reLogin = function() {
							owner.reLogin();
							if(hasCB) {
							callback(res || {
									'state': 'logout',
									'detail': '登录令牌失效，请重新登录'
								});
							} else {
								$.toast('登录失效，请重新登录');
							}
						}
						// 尝试重新登录
						if(account.autoLogin && token && !account.gestures) {
							console.log('登录失效，尝试重新登录');
							owner.login(null, function(err) {
								if(err) {
									reLogin();
								} else {
									if (params.token) params.token = owner.getToken();
									Server.send(url, params, callback, method, option);
								}
							})
						} else {
							reLogin();
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
					console.error('Server fail: ' + type + ',' + url + (type === 'timeout' ? '[Retry]' : ''));
					if(type === 'timeout') {
						Server.send(url, params, callback, method, option);
					} else {
						if(hasCB) {
							callback({
								state: type,
								detail: errorThrown
							});
						} else {
							$.toast(errorThrown)
						}
					}
				}
			})
		})
	}
	
	/**
	 * 获取应用版本（要求plusReady）
	 */
	owner.getVersion = function(){
		var version = plus.runtime.version.split('.');
		if(version.length > 3) {
			version.splice(3);
		}
		while(version.length < 3){
			version.push(0)
		}
		return version.join('.');
	}

	/**
	 * 清除所有用户数据
	 */
	owner.clear = function() {
		owner.setInfo({});
		owner.setSettings({});
		owner.setConcern({});
		// 清空系统消息中心所有的推送消息。
		plus.push.clear();
	}

	/**
	 * 要求用户重新登录
	 */
	owner.reLogin = function() {
		mui.openWindow({
			url: '/html/auth/login.html',
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
	owner.getInfo = function() {
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
	owner.setInfo = function(state) {
		_temp.state = state || {}
		_temp.state._expired = _temp.expired();
		localStorage.setItem('$state', JSON.stringify(_temp.state));
	};

	/**
	 * 获取用户令牌
	 */
	owner.getToken = function() {
		return owner.getInfo().token || '';
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
		if(_temp.concern && _temp.concern._expired > new Date()) {
			return _temp.concern;
		} else {
			var concernText = localStorage.getItem('$concern') || '{}';
			_temp.concern = JSON.parse(concernText);
			_temp.concern._expired = _temp.expired();
			return _temp.concern;
		}
	}

	owner.setConcern = function(concern) {
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
		if(!callback) callback = function(){};
		// 创建状态
		owner.setInfo(params.info);
		// 创建关注
		owner.setConcern(params.concern);
		// 创建设置
		owner.setSettings(params.settings);
		// 回调函数
		return callback();
	};

	var checkEmail = function(email) {
		email = email || '';
		return(email.length > 3 && email.indexOf('@') > -1);
	};
	
	/**
	 * 保持用户在线
	 */
	function keepUserOnline(){
		clearInterval(keepUserOnlineTimer);
		keepUserOnlineTimer = setInterval(function(){
			Server.send('user/online', {
				token: owner.getToken()
			}, function(res){
				if(res.state === 'ok') {
					owner.createState(res.data)
				} else {
					if (mui.toast) {
						mui.toast(res.detail);
					}
				}
			})
		}, 300000);
	}
	
	/**
	 * 检查应用版本
	 * @param {Function} callback function(err, data){}如果有callback则返回版本数据，否则默认处理
	 */
	owner.checkAppVersion = function(callback){
		var APP_VERSION = owner.getVersion();
		var vCode = function(version){
			var code = 0;
			version = version.split('.');
			code = code * 100 + (version[0]||1);
			code = code * 100 + (version[1]||1);
			code = code * 100 + (version[2]||1);
			return code;
		}
		// 更新应用资源
		var installApp = function(path){
		    plus.nativeUI.showWaiting("安装更新...", {
		    	back: 'none'	
		    });
		    plus.runtime.install(path,{},function(){
		        plus.nativeUI.closeWaiting();
		        console.log("安装更新成功！");
		        plus.nativeUI.alert("应用资源更新完成！",function(){
		            plus.runtime.restart();
		        });
		    },function(e){
		        plus.nativeUI.closeWaiting();
		        console.log("安装更新失败["+e.code+"]："+e.message);
		        plus.nativeUI.alert("安装更新失败["+e.code+"]："+e.message);
		    });
		}
		var updateApp = function(version){
			var w = plus.nativeUI.showWaiting("连接服务器中...", {
				back: 'none'
			});
			var t = null;
			var d = plus.downloader.createDownload(version.download, {}, function(downloader, status){
				clearInterval(t);
				plus.nativeUI.closeWaiting();
				if(status === 200){
					installApp(downloader.filename);
				}else{
					mui.alert('下载更新文件失败！', '错误提示', '退出', owner.quit);
				}
			});
			d.start();
			t = setInterval(function(){
				if(d.state === 3) w.setTitle('下载更新包（' + Math.round((d.downloadedSize / d.totalSize) * 100) + '%）')
			}, 500);
		}
		var checkVersion = function(version){
			if (vCode(APP_VERSION) === vCode(version.lastest)) return true;
			var isAbandon = function(cVersion, abandon){
				cVersion = vCode(cVersion);
				for(var i = 0; i < abandon.length; i++){
					if(cVersion === vCode(abandon[i])){
						return true;
					}
				}
				return false;
			}
			if (vCode(APP_VERSION) < vCode(version.oldest) || isAbandon(APP_VERSION, version.abandons)) {
				mui.confirm('应用版本过低或不可使用，请更新！\n' + version.note + '\n发布日期：' + version.date,'版本检查',['升级', '退出'], function(event){
					if(event.index === 0) {
						if(plus){
							updateApp(version);
						} else {}
					} else { owner.quit(); }
				});
			} else {
				mui.confirm('发现新版本（V' + version.lastest + '），推荐升级！\n' + version.note + '\n发布日期：' + version.date,'版本检查',['升级', '下次提醒'], function(event){
					if(event.index === 0) updateApp(version);
				});
			}
		}
		Server.send('app/version', function(res){
			if(res.state === 'ok'){
				if(callback){
					callback(null, res.data);
				} else {
					if (mui && plus) {
						checkVersion(res.data);
					} else {
						console.warn('mui.js需放在app.js前面！');
					}
				}
			} else {
				if(callback){
					callback(res.error||res.detail);
				} else {
					console.log(res.error||res.detail);
					if (mui.toast)mui.toast(res.detail);
				}
			}
		}, 'get');
	}

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
			loginInfo.appVersion = plus.runtime.innerVersion;
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
		Server.send('user/login', loginInfo, function(res) {
			if(res.state === 'ok') {
				owner.createState(res.data, callback);
				keepUserOnline()
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
		Server.send('user/register', regInfo, function(res) {
			if(res.state === 'ok') {
				owner.createState(res.data, callback);
				keepUserOnline()
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
			$.toast(err || '退出用户成功');
		}
		clearInterval(keepUserOnlineTimer);
		Server.send('user/logout', {
			offline: false,
			token: owner.getToken()
		}, function(res) {
			if(res.state === 'ok') {
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
	 * @param {Function} callback function(errmsg){};
	 **/
	owner.forgetPassword = function(email, callback) {
		callback = callback || $.noop;
		if(!checkEmail(email)) {
			return callback('邮箱地址不合法');
		}
		Server.send('user/forget', {
			mail: email
		}, function(res) {
			if(res.state === 'ok') {
				callback(null);
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
		Server.send('user/password', pwdInfo, function(res) {
			if(res.state === 'ok') {
				owner.createState(res.data, callback)
			} else {
				callback(res.detail);
			}
		});
	}

	owner.quit = function() {
		clearInterval(keepUserOnlineTimer);
		Server.send("user/logout", {
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
		Server.send("user/logout", {
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
		Server.send('user/login', {
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
}(mui, window.App = {}, window.Server = {}));