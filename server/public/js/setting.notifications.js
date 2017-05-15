//加载设置
mui.plusReady(function(){
	var s=App.getSettings();
	var synchronize={};//需要同步的数据
	var monitor=['receiveNotify','voiceBroadcast'];//需要同步的监视对象
	var isNeedSynchronize=false;//是否需要同步
	var isSettingsChange=false;//是否更改了设置
	//开启语音播报
	if(s.voiceBroadcast){
		plus.device.setWakelock(true);
		mui.toast('语音播报已开启');
	}
	//新信息通知
	for(key in s.newTip){
		var elm=document.getElementById(key);
		if(elm){
			elm.classList[s.newTip[key]?'add':'remove']('mui-active');
			elm.addEventListener("toggle",function(e){
				s.newTip[e.target.id]=e.detail.isActive;
				if(monitor.indexOf(e.target.id)>-1){
					isNeedSynchronize=true;
					synchronize[e.target.id]=e.detail.isActive;
				}
				switch (e.target.id){
					case 'voiceBroadcast':
						plus.device.setWakelock(e.detail.isActive);
						mui.toast('语音播报'+(e.detail.isActive?'已开启':'已关闭'))
						break;
				}
				isSettingsChange=true;
			});
		}
	}
	viewApi.view.addEventListener('pageBeforeShow',function(e){
		if(e.detail.page.id=='notifications'){
			s=App.getSettings();
			for(key in s.newTip){
				var elm=document.getElementById(key);
				if(elm)elm.classList[s.newTip[key]?'add':'remove']('mui-active');
			}
		}
	});
	viewApi.view.addEventListener('pageBack',function(e){
		if(e.detail.page.id=='notifications'){
			if(isSettingsChange){
				App.setSettings(s);
				isSettingsChange=false;
			}
			if(isNeedSynchronize){
				Server.send('account.php',{
					'do':'settings',
					'settings':JSON.stringify(synchronize)
				},function(res){
					if(res){
						if(res.state=='ok'){
							mui.toast('设置同步成功');
						}else{mui.toast(res.detail);}
					}else{mui.toast('服务器返回格式错误');}
				});
				synchronize={};
				isNeedSynchronize=false;
			}
		}
	});
});

