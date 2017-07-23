/**
 * 股票走势
 * @param {Object} $
 * @param {Object} dom
 * @param {Object} stocks 格式：{name:'',code:''}
 */
function InitBroaderIndex($, dom, stocks) {
	/* 颜色预设 */
	var COLOR_RED = '#b33'; // 默认红色
	var COLOR_GREEN = '#3b3'; // 默认绿色
	var COLOR_BLUE = '#3bf'; // 默认蓝色
	var COLOR_BACKGROUND = 'rgb(36,37,42)'; // 图像背景颜色
	var COLOR_INACTIVE = '#aaa'; // 非活动颜色
	var COLOR_SPLIT_LINE = 'rgba(255,255,255,0.2)'; // 分割线颜色
	var COLOR_AXIS_TEXT = 'rgba(255,255,255,0.6)'; // 坐标字体颜色
	var COLOR_AXIS = '#777'; // 坐标线颜色
	var COLOR_TOOLTIP_BACKGROUND = '#444'; // 数据显示框背景
	var DAYBAR_COUNT = 60; // 显示多少个日K数据
	// 初始化股票走势
	var broaderIndex = echarts.init(dom);
	var dataLineStyle = {
		normal: {
			width: 3,
			color: COLOR_RED
		}
	}
	var _currentTimeLineIndex = 0; // 当前时间轴显示的Index
	var _currentLegendName = ''; // 当前显示的图像名
	broaderIndex.showLoading();
	/**
	 * 四舍五入，精确到小数点后两位
	 */
	function parsePrice(price) {
		return Math.round(price * 100) / 100;
	}
	var option = {
		baseOption: {
			backgroundColor: COLOR_BACKGROUND,
			timeline: {
				show: stocks.length > 1,
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
						color: COLOR_RED
					}
				},
				label: {
					position: -8,
					normal: {
						textStyle: {
							color: COLOR_AXIS_TEXT
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
					color: COLOR_RED
				},
				inactiveColor: COLOR_INACTIVE
			},
			xAxis: {
				data: [],
				axisLine: {
					lineStyle: {
						color: COLOR_AXIS
					}
				},
				axisTick: {
					inside: true
				},
				axisLabel: {
					margin: 15,
					textStyle: {
						color: COLOR_AXIS_TEXT,
						align: 'left'
					}
				}
			},
			yAxis: {
				scale: true,
				axisLabel: {
					inside: true,
					textStyle: {
						color: COLOR_AXIS_TEXT,
						baseline: 'top'
					}
				},
				axisLine: {
					lineStyle: {
						color: COLOR_AXIS
					}
				},
				axisTick: {
					inside: true
				},
				splitLine: {
					show: true,
					lineStyle: {
						color: COLOR_SPLIT_LINE
					}
				}
			},
			tooltip: {
				trigger: 'axis',
				backgroundColor: COLOR_TOOLTIP_BACKGROUND,
				position: function(pos, params, dom, rect, size) {
					var obj = {
						top: '80%'
					};
					if(pos[0] < size.viewSize[0] / 2) {
						obj.left = Math.max(pos[0] - size.contentSize[0] / 2, 20);
					} else {
						obj.left = Math.min(pos[0] - size.contentSize[0] / 2, size.viewSize[0] - size.contentSize[0] - 20);
					}
					return obj;
				},
				formatter: function(params) {
					switch(params[0].seriesName) {
						case '实时':
							return [
								'实时行情',
								'价格：' + parsePrice(params[0].value),
								'时间：' + params[0].name
							].join('<br />');
						case '日K':
							var kline = {
								open: params[0].value[0],
								close: params[0].value[1],
								low: params[0].value[2],
								high: params[0].value[3],
								preClose: params[0].value[4],
								volume: params[0].value[5]
							};
							var diff = kline.close - kline.open;
							var rate = parsePrice(diff / kline.open * 100);
							var preDiff = kline.close - kline.preClose;
							var preRate = parsePrice(preDiff / kline.preClose * 100);
							return [
								'日K线',
								'[今开] 涨额：' + (diff > 0 ? '+' : '') + parsePrice(diff) + '  |  涨幅：' + (diff > 0 ? '+' : '') + rate + '%',
								'[昨收] 涨额：' + (preDiff > 0 ? '+' : '') + parsePrice(preDiff) + '  |  涨幅：' + (preDiff > 0 ? '+' : '') + preRate + '%',
								'今开：' + parsePrice(kline.open) + '  |  今收：' + parsePrice(kline.close),
								'最低：' + parsePrice(kline.low) + '  |  最高：' + parsePrice(kline.high),
								'昨收：' + parsePrice(kline.preClose) + '  |  成交量：' + parsePrice(kline.volume / 1000000) + '万手',
								'<span style="color: ' + COLOR_RED + '">MA5  ：' + parsePrice(params[1].value) + '</span>',
								'<span style="color: ' + COLOR_GREEN + '">MA10：' + parsePrice(params[2].value) + '</span>',
								'<span style="color: ' + COLOR_BLUE + '">MA20：' + parsePrice(params[3].value) + '</span>',
								'日期：' + params[0].name
							].join('<br />');
						case 'MACD':
							var macd = params[0].data.macd;
							return [
								'MACD指标',
								'MACD：' + parsePrice(macd.macd),
								'DIFF：' + parsePrice(macd.diff),
								'DEA：' + parsePrice(macd.dea),
								'日期：' + params[0].name
							].join('<br />');
						case 'KDJ':
							var kdj = params[0].data.kdj;
							var mark = kdj.mark;
							var texts = [
								'KDJ指标',
								'<span style="color: ' + COLOR_RED + '">K值：' + parsePrice(kdj.k) + '</span>',
								'<span style="color: ' + COLOR_GREEN + '">D值：' + parsePrice(kdj.d) + '</span>',
								'<span style="color: ' + COLOR_BLUE + '">J值：' + parsePrice(kdj.j) + '</span>'
							];
							if(mark) {
								texts.push('推荐操作：' + mark.type + '【仅供参考】');
								//								texts.push('推荐指数：' + parsePrice(mark.accuracy.total) + '%');
								texts.push('历史准确率：' + mark.accuracy.right + '/' + mark.accuracy.count + ' (' + parsePrice(mark.accuracy.total) + '%)');
								if(kdj.mark.nextKline) {
									var nKline = kdj.mark.nextKline;
									var diff = nKline.close - nKline.open;
									var rate = parsePrice(diff / nKline.open * 100);
									diff = diff > 0 ? '+' + parsePrice(diff) : parsePrice(diff);
									if(rate > 0) rate = '+' + rate;
									texts.push('隔日验证：' + diff + '（' + rate + '%）[' + mark.accuracy.check + ']');
								}
								//								texts.push('两端开口：' + mark.endpointDiff.join(','));
								//								texts.push('角度：' + mark.angle);
								//								texts.push('角度指数：' + parsePrice(mark.accuracyAngle * 100) + '%');
								//								texts.push('标记指数：' + parsePrice(mark.accuracyBoundary * 100) + '%');
							}
							texts.push('日期：' + params[0].name)
							return texts.join('<br />');
					}
					params = params[0];

				},
				axisPointer: {
					animation: false
				}
			},
			series: [{
					name: '实时',
					type: 'line',
					data: [],
					lineStyle: dataLineStyle,
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
		Server.send(url, {
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
				if(err === 'timeout') {
					loadTimeLine(code, callback);
					return;
				} else {
					if(typeof callback === 'function') {
						callback(err);
					} else {
						$.toast(err);
					}
				}

			}
		});
	}

	/**
	 * 计算新日K数据
	 * @param {Object} item
	 * @param {Object} oKline
	 */
	function createKline(item, oKline) {
		if(!item) return null;
		var diff = item.kline.close - item.kline.open;
		var preDiff = item.kline.close - item.kline.preClose;
		var volume = (diff < 0 ? -1 : 1) * item.kline.volume || 0;
		var cKline = {
			open: item.kline.open || 0,
			close: item.kline.close || 0,
			low: item.kline.low || 0,
			high: item.kline.high || 0,
			volume: volume, // 成交量
			amount: (diff < 0 ? -1 : 1) * item.kline.amount || 0, // 总金额
			preClose: item.kline.preClose || 0, // 前天收盘价
			diff: diff || 0, // 今开涨额
			rate: (diff / item.kline.open * 100) || 0, // 今开涨幅
			preDiff: preDiff || 0, // 昨收涨额
			preRate: item.kline.netChangeRatio || 0, // 昨收涨幅
			priceTrend: item.kline.close > item.kline.preClose ? 'up' : item.kline.close < item.kline.preClose ? 'down' : 'equal' // 价格趋势
		}
		if(oKline) {
			// 成交量趋势
			cKline.volumeTrend = volume > oKline.volume ? 'up' : volume < oKline.volume ? 'down' : 'equal';
			if(cKline.volumeTrend === oKline.volumeTrend) {
				cKline.keepVolumeTrend = oKline.keepVolumeTrend + 1;
			} else {
				cKline.keepVolumeTrend = 1;
			}
			// 价格趋势
			if(oKline.priceTrend === cKline.priceTrend) {
				cKline.keepPriceTrend = oKline.keepPriceTrend + 1;
			} else {
				cKline.keepPriceTrend = 1;
			}
		} else {
			cKline.keepPriceTrend = 1;
			cKline.volumeTrend = 'unknow';
			cKline.keepVolumeTrend = 1;
		}
		return cKline;
	}

	/**
	 * 计算新MACD值
	 * @param {Object} item
	 * @param {Object} oMacd
	 */
	function createMacd(item, oMacd) {
		var cMacd = {
			diff: item.macd.diff,
			dea: item.macd.dea,
			macd: item.macd.macd
		};
		if(oMacd) {
			cMacd.trend = cMacd.macd > oMacd.macd ? 'up' : cMacd.macd < oMacd.macd ? 'down' : 'equal';
			if(cMacd.trend === oMacd.trend) {
				cMacd.keepTrend = oMacd.keepTrend + 1;
			} else {
				cMacd.keepTrend = 1;
			}
		} else {
			cMacd.trend = 'unknow';
			cMacd.keepTrend = 1;
		}
		return cMacd;
	}

	/**
	 * 计算两线段交点
	 * @param {Point} a 线段1端点a{x:Number,y:Number}
	 * @param {Point} b 线段1端点b{x:Number,y:Number}
	 * @param {Point} c 线段2端点c{x:Number,y:Number}
	 * @param {Point} d 线段2端点d{x:Number,y:Number}
	 */
	function segmentsIntr(a, b, c, d) {
		// 三角形abc 面积的2倍
		var area_abc = (a.x - c.x) * (b.y - c.y) - (a.y - c.y) * (b.x - c.x);
		// 三角形abd 面积的2倍
		var area_abd = (a.x - d.x) * (b.y - d.y) - (a.y - d.y) * (b.x - d.x);
		// 面积符号相同则两点在线段同侧,不相交;
		if(area_abc * area_abd > 0) return null;
		// 三角形cda 面积的2倍
		var area_cda = (c.x - a.x) * (d.y - a.y) - (c.y - a.y) * (d.x - a.x);
		// 三角形cdb 面积的2倍。注意: 这里有一个小优化.不需要再用公式计算面积,而是通过已知的三个面积加减得出.
		var area_cdb = area_cda + area_abc - area_abd;
		// 面积符号相同则两点在线段同侧,不相交;
		if(area_cda * area_cdb > 0) return null;
		//计算交点坐标
		var t = area_cda / (area_abd - area_abc);
		var dx = t * (b.x - a.x),
			dy = t * (b.y - a.y);
		return {
			x: a.x + dx,
			y: a.y + dy
		};
	}

	/**
	 * 计算两点与平行线的夹角（不准）
	 * @param {Point} start 起点{x:Number,y:Number}
	 * @param {Point} end 终点{x:Number,y:Number}
	 */
	function lineAngle(start, end) {
		var diff_x = end.x - start.x,
			diff_y = end.y - start.y;
		return 360 * Math.atan(diff_y / diff_x) / (2 * Math.PI);
	}

	/**
	 * 计算新KDJ值
	 * @param {Object} item
	 * @param {Object} oKdj
	 */
	function createKdj(item, oKdj) {
		var KDJ_CARE_BOUNDARY = 50;
		var cKdj = {
			k: item.kdj.k,
			d: item.kdj.d,
			j: item.kdj.j
		}
		if(oKdj) {
			cKdj.mark = segmentsIntr( // 计算交点｛Point｝
				{
					x: 0,
					y: oKdj.k
				}, {
					x: 1,
					y: cKdj.k
				}, {
					x: 0,
					y: oKdj.d
				}, {
					x: 1,
					y: cKdj.d
				}
			);
			// 创建标记 //
			if(cKdj.mark) { // 有效标记
				// if (cKdj.mark && (cKdj.mark.y < KDJ_CARE_BOUNDARY || cKdj.mark.y > 100 - KDJ_CARE_BOUNDARY)) {
				// 标记来源
				cKdj.mark.from = 'KDJ';
				// 两端偏差
				cKdj.mark.endpointDiff = [
					oKdj.k - oKdj.d,
					cKdj.k - cKdj.d
				];
				// 计算角度
				cKdj.mark.angle = lineAngle({
						x: 1,
						y: oKdj.k
					}, {
						x: 50,
						y: cKdj.k
					}) -
					lineAngle({
						x: 1,
						y: oKdj.d
					}, {
						x: 50,
						y: cKdj.d
					});
				// 计算边界
				cKdj.mark.boundary = (cKdj.mark.y < KDJ_CARE_BOUNDARY ? cKdj.mark.y : 100 - cKdj.mark.y);
				// 计算可靠性
				cKdj.mark.accuracy = {
					total: 0
				};
				cKdj.mark.accuracy.endpointDiff = cKdj.mark.endpointDiff[1] - cKdj.mark.endpointDiff[0];
				cKdj.mark.accuracy.angle = Math.abs(cKdj.mark.angle / 80);
				cKdj.mark.accuracy.boundary = (1 - cKdj.mark.boundary / KDJ_CARE_BOUNDARY); // 可靠性估算-贴近 边界程度
				// cKdj.mark.accuracy = cKdj.mark.accuracyAngle * 0.7 + cKdj.mark.accuracyBoundary * 0.3;
				// 标记类型
				if(cKdj.mark.y < KDJ_CARE_BOUNDARY) {
					cKdj.mark.type = cKdj.mark.angle > 0 ? '买' : '减';
				} else {
					cKdj.mark.type = cKdj.mark.angle < 0 ? '卖' : '增';
				}
			} else {
				delete cKdj.mark;
			}
		}
		return cKdj;
	}

	/**
	 * 计算新MA值
	 * @param {Object} item
	 * @param {Object} oMA
	 */
	function createMa(item, oMA) {
		var cMA = {
			ma5: {
				price: item.ma5.avgPrice,
				volume: item.ma5.volume
			},
			ma10: {
				price: item.ma10.avgPrice,
				volume: item.ma10.volume
			},
			ma20: {
				price: item.ma20.avgPrice,
				volume: item.ma20.volume
			}
		}
		return cMA;
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
		Server.send(url, {
			from: 'pc',
			os_ver: 1,
			cuid: 'xxx',
			vv: 100,
			format: 'json',
			stock_code: code,
			step: 3,
			start: start || '',
			//			count: count || DAYBAR_COUNT,
			fq_type: 'no',
			timestamp: new Date().getTime()
		}, function(res) {
			if(res.errorNo === 0) {
				var list = (res.mashData || []).reverse();
				var data = { // 前面带_的参数为完整指标对象
					date: [],
					_kline: [],
					_macd: [],
					_kdj: [],
					_ma: [],
					_mark: [],
					kline: [],
					macd: [],
					kdj: {
						k: [],
						d: [],
						j: [],
						mark: []
					},
					ma: {
						ma5: [],
						ma10: [],
						ma20: []
					}
				}
				var oKline = null;
				var oMacd = null;
				var oKdj = null;
				var oMA = null;
				var pMark = null;
				var KDJ_CARE_BOUNDARY = 50;
				// 修复Object.assign无效
				if(typeof Object.assign != 'function') {
					(function() {
						Object.assign = function(target) {
							'use strict';
							if(target === undefined || target === null) {
								throw new TypeError('Cannot convert undefined or null to object');
							}

							var output = Object(target);
							for(var index = 1; index < arguments.length; index++) {
								var source = arguments[index];
								if(source !== undefined && source !== null) {
									for(var nextKey in source) {
										if(source.hasOwnProperty(nextKey)) {
											output[nextKey] = source[nextKey];
										}
									}
								}
							}
							return output;
						};
					})();
				}
				var packData = function(mark) {
					return Object.assign({
						_data: data
					}, mark);
				}
				var packMark = function(oKdj) {
					oKdj.mark.index = index;
					oKdj.mark.code = code;
					oKdj.mark.date = date;
					oKdj.mark.kline = oKline;
					oKdj.mark.nextKline = createKline(list[index + 1], oKline);
					// 历史准确率
					if(pMark) {
						oKdj.mark.accuracy.count = (pMark.accuracy.count || 0) + 1;
						oKdj.mark.accuracy.right = (pMark.accuracy.right || 0)
					} else {
						oKdj.mark.accuracy.count = 1;
						oKdj.mark.accuracy.right = 0;
					}
					oKdj.mark.accuracy.check = '未知';
					// 验证指标正确性
					if(oKdj.mark.nextKline) {
						if((oKdj.mark.type === '买' || oKdj.mark.type === '增') && oKdj.mark.nextKline.diff > 0) {
							oKdj.mark.accuracy.right++;
							oKdj.mark.accuracy.check = '正确';
						} else if((oKdj.mark.type === '卖' || oKdj.mark.type === '减') && oKdj.mark.nextKline.diff < 0) {
							oKdj.mark.accuracy.right++;
							oKdj.mark.accuracy.check = '正确';
						} else {
							oKdj.mark.accuracy.check = '错误';
						}
					}
					oKdj.mark.accuracy.total = oKdj.mark.accuracy.right / oKdj.mark.accuracy.count * 100;
					oKdj.mark.macd = oMacd;
					pMark = oKdj.mark;
				}
				// 预计算KDJ的历史准确率
				for(var index = 0; index < list.length - DAYBAR_COUNT; index++) {
					// KDJ
					oKdj = createKdj(list[index], oKdj);
					if(oKdj.mark) packMark(oKdj);
				}
				list = list.splice(-DAYBAR_COUNT);
				// 载入数据
				for(var index = 0; index < list.length; index++) {
					// 日期
					var date = list[index].date.toString().replace(/(\w{4})(\w{2})(\w{2})/, '$2/$3');
					data.date.push(date);
					// 日K
					data.kline.push([
						list[index].kline.open,
						list[index].kline.close,
						list[index].kline.low,
						list[index].kline.high,
						list[index].kline.preClose,
						list[index].kline.volume
					]);
					oKline = createKline(list[index], oKline);
					data._kline.push(packData(oKline));
					// MA
					oMA = createMa(list[index], oMA);
					data._ma.push(packData(oMA));
					data.ma.ma5.push(oMA.ma5.price);
					data.ma.ma10.push(oMA.ma10.price);
					data.ma.ma20.push(oMA.ma20.price);
					// MACD
					oMacd = createMacd(list[index], oMacd);
					data._macd.push(packData(oMacd));
					if(oMacd.macd < 0) {
						data.macd.push({
							value: oMacd.macd,
							itemStyle: {
								normal: {
									color: COLOR_GREEN
								}
							},
							macd: oMacd
						});
					} else {
						data.macd.push({
							value: oMacd.macd,
							macd: oMacd
						});
					}
					// KDJ
					oKdj = createKdj(list[index], oKdj);
					if(oKdj.mark) packMark(oKdj);
					data.kdj.k.push({
						value: oKdj.k,
						kdj: oKdj
					});
					data.kdj.d.push({
						value: oKdj.d,
						kdj: oKdj
					});
					data.kdj.j.push({
						value: oKdj.j,
						kdj: oKdj
					});
					data._kdj.push(packData(oKdj));
					// Mark
					oKdj.mark && data.kdj.mark.push({
						tip: oKdj.mark.type,
						//kdj: oKdj,
						coord: [
							date,
							(oKdj.mark.y < KDJ_CARE_BOUNDARY ? Math.max : Math.min)(oKdj.k, oKdj.j)
						],
						itemStyle: {
							normal: {
								color: oKdj.mark.angle > 0 ? COLOR_RED : COLOR_GREEN
							},
							emphasis: {
								color: oKdj.mark.angle > 0 ? COLOR_RED : COLOR_GREEN
							}
						},
						label: {
							normal: {
								offset: [0, oKdj.mark.y < KDJ_CARE_BOUNDARY ? 0 : 10]
							},
							emphasis: {
								offset: [0, oKdj.mark.y < KDJ_CARE_BOUNDARY ? 0 : 10]
							}
						},
						symbolRotate: oKdj.mark.y < KDJ_CARE_BOUNDARY ? 0 : 180
					});
				}
				typeof callback === 'function' && callback(null, data)
			} else {
				var err = res.errorMsg || res.detail || res.state;
				if(typeof err === 'object') err = JSON.stringify(err);
				console.error('loadDayBar[' + code + ']: ' + err);
				if(err === 'timeout') {
					loadDaybar(code, count, start, callback);
					return;
				} else {
					if(typeof callback === 'function') {
						callback(err);
					} else {
						$.toast(err);
					}
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
					name: '日K',
					type: 'line',
					hoverAnimation: false,
					smooth: true, // 平滑显示
					data: data.ma.ma5,
					lineStyle: {
						normal: {
							color: 'rgba(205,56,56,0.3)',
							width: 2
						}
					},
					xAxis: data.date
				},
				{
					name: '日K',
					type: 'line',
					hoverAnimation: false,
					smooth: true, // 平滑显示
					data: data.ma.ma10,
					lineStyle: {
						normal: {
							color: 'rgba(56,205,56,0.3)',
							width: 2
						}
					},
					xAxis: data.date
				},
				{
					name: '日K',
					type: 'line',
					hoverAnimation: false,
					smooth: true, // 平滑显示
					data: data.ma.ma20,
					lineStyle: {
						normal: {
							color: 'rgba(56,205,255,0.3)',
							width: 2
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
							color: COLOR_RED
						}
					}
				},
				{
					name: 'KDJ',
					data: data.kdj.k,
					hoverAnimation: false,
					type: 'line',
					lineStyle: {
						normal: {
							color: COLOR_RED,
							width: 2
						}
					},
					xAxis: data.date
				},
				{
					name: 'KDJ',
					hoverAnimation: false,
					data: data.kdj.d,
					type: 'line',
					lineStyle: {
						normal: {
							color: COLOR_GREEN,
							width: 2
						}
					},
					xAxis: data.date
				},
				{
					name: 'KDJ',
					data: data.kdj.j,
					hoverAnimation: false,
					type: 'line',
					lineStyle: {
						normal: {
							color: COLOR_BLUE,
							width: 2
						}
					},
					xAxis: data.date,
					markPoint: {
						label: {
							normal: {
								formatter: function(param) {
									return param.data.tip ? param.data.tip : Math.round(param.value);
								},
								textStyle: {
									fontSize: 16
								}
							},
							emphasis: {
								formatter: function(param) {
									return param.data.tip ? param.data.tip : Math.round(param.value);
								},
								textStyle: {
									fontSize: 16
								}
							}
						},
						data: data.kdj.mark.splice(-5)
					}
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
			for(var i = 0; i < opt.series.length; i++) {
				if(opt.series[i].name === _currentLegendName) {
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
			//console.log(stock.name + '图像加载完成');
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
					$.toast('更新' + stock.name + ' 图像失败');
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