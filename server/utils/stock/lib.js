/**
 * 计算新MACD值
 * @param {Number} price
 * @param {Object} oMacd
 */
exports.calcMacd = function(price, oMacd) {
  var cMacd = [];
  if (oMacd) {
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

/**
 * 计算新KDJ值
 * @param {Number} price
 * @param {Object} oKdj
 */
exports.calcKdj = function (price, oKdj) {
		var cKdj = {};
		var getMinMax = function(arr) {
			var min = arr[0],
				max = arr[0];
			for(var i = 1; i < arr.length; i++) {
				if(arr[i] < min) {
					min = arr[i]
				} else if(arr[i] > max) {
					max = arr[i]
				}
			}
			return {
				min: min,
				max: max
			};
		}
		var round = function(v) {
			if(v < 0) {
				return 0;
			} else if(v > 100) {
				return 100;
			} else {
				return v
			}
		}
		if(oKdj) {
			oKdj.prices.push(price);
			cKdj.prices = oKdj.prices.splice(-9);
			var minmax = getMinMax(cKdj.prices);
			cKdj.rsv = (price - minmax.min) / (minmax.max - minmax.min) * 100 || 0;
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

/**
 * 四舍五入，精确到小数点后两位
 */
exports.parsePrice = function(price) {
  return Math.round(price * 100) / 100;
}