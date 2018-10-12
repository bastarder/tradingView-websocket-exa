var ajax: any = {
  get: function (url, fn, fnf) {
    var obj = new XMLHttpRequest();
    obj.open('GET', url, true);
    obj.onreadystatechange = function () {
      if (obj.readyState == 4 && obj.status == 200 || obj.status == 304) {
        fn.call(this, JSON.parse(obj.responseText));
      } else if (obj.readyState == 4) {
        fnf.call(this, { data: '服务端错误!' })
      }
    };
    obj.onerror = function () {
      fnf.call(this, { data: '服务端错误!' })
    }
    obj.send(null);
  }
}

var defaultConfig: any = {
  supports_search: false,
  supports_time: true,
  supports_timescale_marks: false,
  supports_group_request: false,
  supports_marks: false,
  supported_resolutions: ['1', '5', '15', '60', '240', '1440', '10080', '43200'],
};

var defaultSymbolResolve: any = {
  name: 'BTC/USDT',
  timezone: 'Asia/Shanghai',
  minmov: 1,
  minmov2: 0,
  pointvalue: 1,
  session: '24x7',
  has_intraday: true,
  has_daily: true,
  has_empty_bars: true,
  has_no_volume: false,
  has_weekly_and_monthly: false,
  description: '',
  type: 'stock',
  supported_resolutions:['1', '5', '15', '60', '240', '1440', '10080', '43200'],
  pricescale: 0.1,
  ticker: 'BTC/USDT',
};

var api: any = {
  getServerTime: '/time',
  getMarks: '/marks',
  resolveSymbol: '/trading_pairs',
  getHistory: '/get_bars',
}

var timeMap: any = {
  '1': '1m',
  '5': '5m',
  '15': '15m',
  '60': '1h',
  '240': '4h',
  '1440': '1D',
  '10080': '7D',
  '43200': '1M',
}

var Datafeeds: any = {};

Datafeeds.UDFCompatibleDatafeed = function (datafeedURL, updateFrequency, protocolVersion, app) {
  var that = this;
  this._datafeedURL = datafeedURL;
  this._app = app;
  this._configuration = defaultConfig;
  this._ws = null;
  this.onRealtimeCallback = () => {};
  this._protocolVersion = protocolVersion || 2;

  this._app._closeCurrentKline = function(){
    that._ws && that._ws.close();
    clearInterval(that._intervalTimer);
  }
};

Datafeeds.UDFCompatibleDatafeed.prototype.getServerTime = function (callback) {
  if (this._configuration.supports_time) {
    this._send(api.getServerTime, {}, function (response) {
      callback(+response);
    })
  }
};

Datafeeds.UDFCompatibleDatafeed.prototype.onReady = function (callback) {
  var that = this;

  setTimeout(() => {
    if (!that._configuration.exchanges) {
      that._configuration.exchanges = [];
    }
    callback(that._configuration);
  }, 0);
};

Datafeeds.UDFCompatibleDatafeed.prototype.resolveSymbol = function (symbolName, onSymbolResolvedCallback, onResolveErrorCallback) {
  this._send(api.resolveSymbol, {
    pair: symbolName ? symbolName.toUpperCase() : ""
  },
    function (res) {
      defaultSymbolResolve.name = symbolName;
      defaultSymbolResolve.ticker = symbolName;
      defaultSymbolResolve.pricescale = Math.pow(10, res.base_decimal || 4);
      defaultSymbolResolve.base_name = [symbolName];
      defaultSymbolResolve.legs = [symbolName];
      defaultSymbolResolve.full_name = symbolName;
      defaultSymbolResolve.pro_name = symbolName;
      onSymbolResolvedCallback(defaultSymbolResolve);
    },
    function (reason) {
      onResolveErrorCallback("unknown_symbol");
    }
  )
};

Datafeeds.UDFCompatibleDatafeed.prototype.getBarsDataFormat = function(res){
  var res: any = {
    key: res.subject,
    type: res.type,
    state: res.status,
    data: res.data || [],
  }

  if (!res.data.length) return null;

  // | 首次历史数据 i | 更新 u |
  if(res.type === 'u'){
    res.data = [res.data];
  }

  var data: any = res.data;
  var dt: any = { s: 'ok', t: [], c: [], o: [], h: [], l: [], v: [] };

  // 格式化数据
  for (var i = 0; i < data.length; i++) {
    dt.t.push(parseInt((data[i][0] / 1000).toString()))
    dt.o.push(parseFloat(data[i][1]))
    dt.h.push(parseFloat(data[i][2]))
    dt.l.push(parseFloat(data[i][3]))
    dt.c.push(parseFloat(data[i][4]))
    dt.v.push(parseFloat(data[i][5]))
  }

  var bars = [];

  var barsCount = dt.t.length || 0;
  var volumePresent = typeof dt.v !== 'undefined';
  var ohlPresent = typeof dt.o !== 'undefined';

  for (var i = 0; i < barsCount; ++i) {
    var barValue: any = {
      time: dt.t[i] * 1000,
      close: dt.c[i],
    };

    if (ohlPresent) {
      barValue.open = dt.o[i];
      barValue.high = dt.h[i];
      barValue.low = dt.l[i];
    } else {
      barValue.open = barValue.high = barValue.low = barValue.close;
    }

    if (volumePresent) {
      barValue.volume = dt.v[i];
    }
    bars.push(barValue);
  }

  var meta = { version: this._protocolVersion, noData: false, nextTime: dt.nb || dt.nextTime };

  bars = bars.sort(function(a,b){
    return a.time - b.time
  })

  return {
    bars : bars,
    meta : meta,
    isFirst: res.type === 'i',
  }
}

Datafeeds.UDFCompatibleDatafeed.prototype.getBars = function (symbolInfo, resolution, rangeStartDate, rangeEndDate, onDataCallback, onErrorCallback, flag) {
  var that = this;

  // that.cacheBars && console.warn(that.cacheBars[0].time)
  // 缓存中的第一个数据的时间 用于获取历史记录;

  // console.warn(`Get Bars: ====> ${resolution},
  //   first: ${flag},
  //   from: ${new Date(rangeStartDate)},
  //   to: ${new Date(rangeEndDate)}
  // `)

  if(!flag){
    try {
      that._send(api.getHistory, {
        pair: symbolInfo.name,
        limit: 1000,
        end: that.cacheBars[0].time,
        period: timeMap[resolution],
      }, function(res) {
        var options = that.getBarsDataFormat(res);
        var bars = options && options.bars || [];
        that.cacheBars = that.cacheBars.concat(bars)
        that.cacheBars = that.cacheBars.sort(function(a,b){
          return a.time - b.time;
        })
        // console.warn(`Get History: ====>`, bars);
        onDataCallback(bars, { noData: !bars.length });
      }, function() {
        onDataCallback([], { noData: true });
      })
    } catch (error) {
      onDataCallback([], { noData: true });
    }
    return ;
  }

  var oldWs = this._ws;
  this._ws && this._ws.delete();

  var rssParam = {
    service: "market",
    type: 'kline',
    pair: symbolInfo.name.toLowerCase(),
    period: timeMap[resolution],
  }

  // console.log('rssParam:', rssParam)

  this._ws = this._app.add(rssParam, function(data) {
    var options = that.getBarsDataFormat(data);

    if(!options) {
      return;
    }

    if(options.isFirst){
      // websocket 返回初始数据
      that.cacheBars = options.bars;
      onDataCallback(options.bars, options.meta);
    }else{
      // websocket 更新数据
      var lastIndex = that.cacheBars.length - 1;
      var lastBar = that.cacheBars[lastIndex];
      if(lastBar.time === options.bars[0].time){
        that.cacheBars[lastIndex] = options.bars[0];
      }else{
        that.cacheBars.push(options.bars[0]);
      }
      that.onRealtimeCallback(options.bars[0])
    }

  });

  // 如果切换新参数则 删除旧的Websocket监听事件;
  if(oldWs && oldWs.sendKey !== this._ws.sendKey){
    oldWs.close();
  }
};

Datafeeds.UDFCompatibleDatafeed.prototype.subscribeBars = function (symbolInfo, resolution, onRealtimeCallback, listenerGUID, onResetCacheNeededCallback) {
  this.onRealtimeCallback = onRealtimeCallback
};

Datafeeds.UDFCompatibleDatafeed.prototype.unsubscribeBars = function () {
  this.onRealtimeCallback = () => {}
};

Datafeeds.UDFCompatibleDatafeed.prototype._send = function (urlPath, params, cb, ecb) {
  if (params !== undefined) {
    var paramKeys = Object.keys(params);
    if (paramKeys.length !== 0) {
      urlPath += '?';
    }
    urlPath += paramKeys.map(function (key) {
      return encodeURIComponent(key) + "=" + encodeURIComponent(params[key].toString());
    }).join('&');
  }

  var cb = cb || function() {};
  var ecb = ecb || function() {};

  return ajax.get(this._datafeedURL + urlPath, cb, ecb)
};

export default Datafeeds;