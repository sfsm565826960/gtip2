/**
 * 股票走势
 * @param {Object} $
 * @param {Object} dom
 * @param {Object} stocks 格式：{name:'',code:''}
 */
function InitBroaderIndex($, dom, stocks) {
	var broaderIndex = echarts.init(dom);
	var textColor = 'rgba(255,255,255,0.5)';
	var splitLineColor = 'rgba(255,255,255,0.2)';
	var dataLineStyle = {
		normal: {
			width: 3,
			color: 'red'
		}
	}
	var _currentTimeLineIndex = 0; // 当前时间轴显示的Index
	var _currentLegendName = ''; // 当前显示的图像名
	broaderIndex.showLoading();
	var option = {
		baseOption: {
			backgroundColor: 'rgb(36,37,42)',
			timeline: {
				axisType: 'category',
				data: [],
				left: 'center',
				top: -15,
				symbolSize: 0,
				checkpointStyle: {
					symbolSize: 5
				},
				controlStyle: {
					showPlayBtn: false,
					itemSize: 10,
					normal: {
						color: '#f00'
					}
				},
				label: {
					position: -8,
					normal: {
						textStyle: {
							color: textColor
						}
					}
				}
			},
			grid: [{
				top: '5px',
				left: '5px',
				right: '5px',
				bottom: '50px'
			}],
			dataZoom: {
				type: 'inside'
			},
			legend: {
				bottom: 0,
				left: 'center',
				data: ['实时', '日K', 'MACD', 'KDJ'],
				selectedMode: 'single',
				textStyle: {
					color: '#f00'
				},
				inactiveColor: '#777'
			},
			xAxis: {
				data: [],
				axisLine: {
					lineStyle: {
						color: '#777'
					}
				},
				axisTick: {
					inside: true
				},
				axisLabel: {
					margin: 15,
					textStyle: {
						color: textColor,
						align: 'left'
					}
				}
			},
			yAxis: {
				scale: true,
				axisLabel: {
					inside: true,
					textStyle: {
						color: textColor,
						baseline: 'top'
					}
				},
				axisLine: {
					lineStyle: {
						color: '#777'
					}
				},
				axisTick: {
					inside: true
				},
				splitLine: {
					show: true,
					lineStyle: {
						color: splitLineColor
					}
				}
			},
			series: [{
					name: '实时',
					type: 'line',
					data: [],
					lineStyle: dataLineStyle
				},
				{
					name: '日K',
					type: 'candlestick',
					data: [],
					itemStyle: {
						normal: {
							color: '#FD1050',
							color0: '#0CF49B',
							borderColor: '#FD1050',
							borderColor0: '#0CF49B'
						}
					},
					lineStyle: dataLineStyle
				},
				{
					name: 'MACD',
					type: 'bar',
					data: [],
					lineStyle: dataLineStyle
				},
				{
					name: 'KDJ',
					type: 'line',
					data: [],
					lineStyle: dataLineStyle
				}
			]
		},
		options: []
	}
	/**
	 * 载入实时股票数据
	 * @param {String} code 股票代码
	 * @param {Function} callback function(err,data){}
	 */
	function loadTimeLine(code, callback) {
		var url = 'https://gupiao.baidu.com/api/stocks/stocktimeline';
		server.send(url, {
			from: 'pc',
			os_ver: 1,
			cuid: 'xxx',
			vv: 100,
			format: 'json',
			stock_code: code,
			timestamp: new Date().getTime()
		}, function(res) {
			if(res.errorNo === 0) {
				var list = res.timeLine;
				var len = list.length;
				var time = [];
				var price = [];
				var index = 0;
				// 忽略某段时间，仅显示9：30~11：30 或 13：00~15：00
				if(new Date().getHours() < 13) {
					while(index < len && list[index].time < 93000000) index++;
				} else {
					while(index < len && list[index].time < 130000000) index++;
				}
				// 载入数据
				while(index < len) {
					time.push(list[index].time.toString().replace(/(\w{1,2})(\w{2})0{5}/, '$1:$2'))
					price.push(Math.round(list[index].price * 100) / 100);
					index++;
				}
				typeof callback === 'function' && callback(null, {
					time: time,
					price: price
				})
			} else {
				var err = res.errorMsg || res.detail;
				if(typeof err === 'object') err = JSON.stringify(err);
				console.error(err);
				if(typeof callback === 'function') {
					callback(err);
				} else {
					$.toast(err);
				}
			}
		});
	}

	/**
	 * 计算新MACD值
	 * @param {Number} price
	 * @param {Object} oMacd
	 */
	function calcMacd(price, oMacd) {
		var cMacd = [];
		if(oMacd) {
			cMacd['ema12'] = (2 * price + 11 * oMacd['ema12']) / 13;
			cMacd['ema26'] = (2 * price + 25 * oMacd['ema26']) / 27;
			cMacd['diff'] = cMacd['ema12'] - cMacd['ema26'];
			cMacd['dea'] = (2 * cMacd['diff'] + 8 * oMacd['dea']) / 10;
			cMacd['macd'] = 2 * (cMacd['diff'] - cMacd['dea']);
		} else {
			cMacd['ema12'] = price;
			cMacd['ema26'] = price;
			cMacd['diff'] = 0;
			cMacd['dea'] = 0;
			cMacd['macd'] = 0;
		}
		return cMacd;
	}
	
	function calcKdj(price, oKdj) {
		var cKdj = {};
		var getMinMax = function(arr) {
			var min = arr[0],max = arr[0];
			for(var i = 1; i< arr.length; i++) {
				if (arr[i] < min) {
					min = arr[i]
				} else if (arr[i] > max) {
					max = arr[i]
				}
			}
			return {min:min,max:max};
		}
		var round = function (v) {
			if (v < 0){
				return 0;
			} else if (v > 100) {
				return 100;
			} else {
				return v
			}
		}
		if (oKdj) {
			oKdj.prices.push(price);
			cKdj.prices = oKdj.prices.splice(oKdj.prices.length - 9);
			var minmax = getMinMax(cKdj.prices);
			cKdj.rsv = (price - minmax.min) / (minmax.max - minmax.min) * 100;
			cKdj.k = round((2 * oKdj.k + cKdj.rsv) / 3);
			cKdj.d = round((2 * oKdj.d + cKdj.k) / 3);
			cKdj.j = round(3 * cKdj.d - 2 * cKdj.k);
		} else {
			cKdj.rsv = 0;
			cKdj.prices = [price];
			cKdj.k = 50;
			cKdj.d = 50;
			cKdj.j = 50;
		}
		return cKdj;
	}

	function loadDaybar(code, count, start, callback) {
		if(typeof count === 'function') {
			callback = count;
			count = '';
			start = '';
		} else if(typeof start === 'function') {
			callback = start;
			start = '';
		}
		var url = 'https://gupiao.baidu.com/api/stocks/stockdaybar';
		server.send(url, {
			from: 'pc',
			os_ver: 1,
			cuid: 'xxx',
			vv: 100,
			format: 'json',
			stock_code: code,
			step: 3,
			start: start || '',
			count: count || 60,
			fq_type: 'no',
			timestamp: new Date().getTime()
		}, function(res) {
			if(res.errorNo === 0) {
				var list = res.mashData.reverse();
				var data = {
					date: [],
					kline: [],
					macd: [],
					kdj: {
						k:[],
						d:[],
						j:[]
					}
				}
				var oMacd = null;
				var oKdj = null;
				// 载入数据
				for(var index = 0; index < list.length; index++) {
					data.date.push(list[index].date.toString().replace(/(\w{4})(\w{2})(\w{2})/, '$1/$2/$3'));
					data.kline.push([
						list[index].kline.open,
						list[index].kline.close,
						list[index].kline.low,
						list[index].kline.high
					]);
					oMacd = calcMacd(list[index].kline.close, oMacd);
					if(oMacd.macd < 0) {
						data.macd.push({
							value: oMacd.macd,
							itemStyle: {
								normal: {
									color: '#0F0'
								}
							},
							macd: JSON.parse(JSON.stringify(oMacd)) // 简易Clone
						});
					} else {
						data.macd.push({
							value: oMacd.macd,
							macd: JSON.parse(JSON.stringify(oMacd)) // 简易Clone
						});
					}
					oKdj = calcKdj(list[index].kline.close, oKdj);
					data.kdj.k.push(oKdj.k);
					data.kdj.d.push(oKdj.d);
					data.kdj.j.push(oKdj.j);
				}
				typeof callback === 'function' && callback(null, data)
			} else {
				var err = res.errorMsg || res.detail;
				if(typeof err === 'object') err = JSON.stringify(err);
				console.error(err);
				if(typeof callback === 'function') {
					callback(err);
				} else {
					$.toast(err);
				}
			}
		});
	}

	broaderIndex.on('timelinechanged', function(object) {
		_currentTimeLineIndex = object.currentIndex;
	})
	broaderIndex.on('legendselectchanged', function(object) {
		var series = option.options[_currentTimeLineIndex].series;
		for(var i = 0, l = series.length; i < l; i++) {
			if(series[i].name === object.name && series[i].xAxis) {
				broaderIndex.setOption({
					baseOption: {
						xAxis: {
							data: series[i].xAxis
						}
					}
				});
			}
		}
		_currentLegendName = object.name;
	})

	function updateOption(data) {
		var opt = {
			series: [{
					name: '实时',
					data: data.price,
					xAxis: data.time
				},
				{
					name: '日K',
					type: 'candlestick',
					data: data.kline,
					itemStyle: {
						normal: {
							color: '#FD1050',
							color0: '#0CF49B',
							borderColor: '#FD1050',
							borderColor0: '#0CF49B'
						}
					},
					xAxis: data.date
				},
				{
					name: 'MACD',
					data: data.macd,
					xAxis: data.date,
					itemStyle: {
						normal: {
							color: 'red'
						}
					}
				},
				{
					name: 'KDJ',
					data: data.kdj.k,
					type: 'line',
					lineStyle: {
						normal: {
							color: '#faa',
							width: 2
						}
					},
					xAxis: data.date
				},
				{
					name: 'KDJ',
					data: data.kdj.d,
					type: 'line',
					lineStyle: {
						normal: {
							color: '#afa',
							width: 2
						}
					},
					xAxis: data.date
				},
				{
					name: 'KDJ',
					data: data.kdj.j,
					type: 'line',
					lineStyle: {
						normal: {
							color: '#aaf',
							width: 2
						}
					},
					xAxis: data.date
				}
			]
		}
		var index = option.baseOption.timeline.data.indexOf(data.stock.name);
		if(index < 0) {
			option.baseOption.timeline.data.push(data.stock.name);
			option.baseOption.xAxis.data = data.time;
			option.options.push(opt)
			broaderIndex.setOption(option);
			broaderIndex.dispatchAction({
				type: 'legendSelect',
				name: '实时'
			});
			_currentLegendName = '实时';
		} else {
			for(var i=0;i<opt.series.length;i++){
				if (opt.series[i].name === _currentLegendName) {
					option.baseOption.xAxis.data = opt.series[i].xAxis;
				}
			}
			option.options[index] = opt;
			broaderIndex.setOption(option);
		}
	}

	/**
	 * 加载股票图，若股票已经存在则更新数据，不存在则加入图
	 * @param {Object} stock
	 * @param {Object} callback function(err){}
	 */
	function loadStock(stock, callback) {
		var tmp = {
			stock: stock
		};
		var process = 0;
		var finsh = 2;
		var done = function() {
			updateOption(tmp);
			typeof callback === 'function' && callback();
		}
		loadTimeLine(stock.code, function(err, data) {
			if(err) {
				if(typeof callback === 'function') {
					callback(err, stock);
				} else {
					$.toast('无法加载' + stock.name + '实时数据')
				}
			} else {
				$.extend(tmp, data);
				process++;
				if(process >= finsh) done();
			}
		});
		loadDaybar(stock.code, function(err, data) {
			if(err) {
				if(typeof callback === 'function') {
					callback(err, stock);
				} else {
					$.toast('无法加载' + stock.name + '每日数据')
				}
			} else {
				$.extend(tmp, data);
				process++;
				if(process >= finsh) done();
			}
		})
	}

	function init() {
		var successCount = 0;
		for(var i = 0; i < stocks.length; i++) {
			loadStock(stocks[i], function(err, stock) {
				if(err) {
					$.toast('加载' + stock.name + ' 图像失败');
				}
				successCount++;
				if(successCount >= stocks.length) {
					broaderIndex.hideLoading();
				}
			})
		}
	}
	setInterval(init, 60000);
	init();
}