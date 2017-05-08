function InitBroaderIndex($, dom) {
	var broaderIndex = echarts.init(dom);
	broaderIndex.setOption({
		title: {
			text: '大盘指数'
		},
		legend: {
			data: ['实时', '日K', 'MACD', 'KDJ'],
			selectedMode: 'single'
		},
		series: [{
				name: '实时',
				type: 'line',
				data: []
			},
			{
				name: '日K',
				type: 'line',
				data: []
			},
			{
				name: 'MACD',
				type: 'line',
				data: []
			}
		]
	})
	broaderIndex.showLoading();
	
}