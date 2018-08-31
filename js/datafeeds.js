var defaultConfig = {
  supports_search: false,
  supports_time: true,
  supports_timescale_marks: false,
  supports_group_request: false,
  supports_marks: false,
  supported_resolutions: ['1', '5', '15', '60', '240', '1440', '10080', '43200'],
};

var defaultSymbolResolve = {
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

var api = {
  getServerTime: '/api/market/time',
  getMarks: '/marks',
  resolveSymbol: '/api/market/trading_pairs',
}

var timeMap = {
  '1': '1m',
  '5': '5m',
  '15': '15m',
  '60': '1h',
  '240': '4h',
  '1440': '1D',
  '10080': '7D',
  '43200': '1M',
}

var Datafeeds = {};
var oldUnsubscribeBarsName = null;

Datafeeds.UDFCompatibleDatafeed = function (datafeedURL, updateFrequency, protocolVersion, app) {
  var that = this;
  this._datafeedURL = datafeedURL;
  this._app = app;
  this._configuration = defaultConfig;
  this._ws = null;
  this._barsPulseUpdater = new Datafeeds.DataPulseUpdater(this, updateFrequency || 1000 * 10);
  this._protocolVersion = protocolVersion || 2;

  this._app._closeCurrentKline = function(){
    that._ws && that._ws.close();
    clearInterval(that._intervalTimer);
  }
};

Datafeeds.UDFCompatibleDatafeed.prototype.getServerTime = function (callback) {
  if (this._configuration.supports_time) {
    this._send(api.getServerTime, {})
      .then(function (response) {
        callback(+response);
      })
      .catch(function () { });
  }
};

Datafeeds.UDFCompatibleDatafeed.prototype.onReady = function (callback) {

  if (!this._configuration.exchanges) {
    this._configuration.exchanges = [];
  }

  this._logMessage(`Initialized with ${JSON.stringify(this._configuration)}`);

  callback(this._configuration);
};

Datafeeds.UDFCompatibleDatafeed.prototype.resolveSymbol = function (symbolName, onSymbolResolvedCallback, onResolveErrorCallback) {
  var that = this;
  this._send(api.resolveSymbol, {
    symbol: symbolName ? symbolName.toUpperCase() : ""
  })
    .then(function (response) {
      var data = response.result || {};
      if (!data.can_trading) {
        onResolveErrorCallback("unknown_symbol");
      }
      else {
        defaultSymbolResolve.name = data.name;
        defaultSymbolResolve.ticker = data.name;
        defaultSymbolResolve.pricescale = Math.pow(10, parseInt(data.quote_decimal));
        defaultSymbolResolve.base_name = [data.name];
        defaultSymbolResolve.legs = [data.name];
        defaultSymbolResolve.full_name = data.name;
        defaultSymbolResolve.pro_name = data.name;
        onSymbolResolvedCallback(defaultSymbolResolve);
      }
    })
    .catch(function (reason) {
      that._logMessage("Error resolving symbol: " + JSON.stringify([reason]));
      onResolveErrorCallback("unknown_symbol");
    });

};

Datafeeds.UDFCompatibleDatafeed.prototype.getBarsDataFormat = function(res){
  var res = {
    key: res[0],
    type: res[1],
    state: res[2],
    data: res[3] || [],
  }

  if (!res.data.length) return null;

  // | 首次历史数据 i | 更新 u |

  if(res.type === 'u'){
    res.data = [res.data];
  }

  var data = res.data;
  var dt = { s: 'ok', t: [], c: [], o: [], h: [], l: [], v: [] };

  // 格式化数据
  for (var i = 0; i < data.length; i++) {
    dt.t.push(parseInt(parseInt(data[i][0]) / 1000));
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
    var barValue = {
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

  return {
    bars : bars, 
    meta : meta
  }
}

Datafeeds.UDFCompatibleDatafeed.prototype.getBars = function (symbolInfo, resolution, rangeStartDate, rangeEndDate, onDataCallback, onErrorCallback, flag) {
  var that = this;

  // 退订旧监听;
  var unsubscribeBarsName = symbolInfo.name + '_' + resolution;

  if (unsubscribeBarsName != oldUnsubscribeBarsName) {
    that._barsPulseUpdater.unsubscribeDataListener(oldUnsubscribeBarsName);
    oldUnsubscribeBarsName = unsubscribeBarsName;
  }

  if(!flag){
    return onDataCallback(that.cacheBars || [],{ noData: true })
  }

  var oldWs = this._ws;
  this._ws && this._ws.delete();

  var rssParam = {
    type: 'kline',
    name: symbolInfo.name,
    period: timeMap[resolution],
  }

  this._ws = this._app.add(rssParam, function(data) {
    var options = that.getBarsDataFormat(data);

    if(!options || !flag) return ;

    // 打开这可以修复 左滑到尽头 历史数据丢失问题，但是非常占用资源
    // 问题是由于 TradingView 的period 时间，文档上说数字 代表分钟，但事实上，1却代表了1天，导致 1天以上的数据 会发送多次请求，导致数据分段显示，会造成无限加载上一段数据。
    if(options.bars.length > 1){
      that.cacheBars = options.bars;
    }

    onDataCallback(options.bars, options.meta);
  });

  // 如果切换新参数则 删除旧的Websocket监听事件;
  if(oldWs && oldWs.sendKey !== this._ws.sendKey){
    oldWs.close();
  }
};

Datafeeds.UDFCompatibleDatafeed.prototype.subscribeBars = function (symbolInfo, resolution, onRealtimeCallback, listenerGUID, onResetCacheNeededCallback) {
  this._barsPulseUpdater.subscribeDataListener(symbolInfo, resolution, onRealtimeCallback, listenerGUID, onResetCacheNeededCallback);
};

Datafeeds.UDFCompatibleDatafeed.prototype.unsubscribeBars = function (listenerGUID) {
  this._barsPulseUpdater.unsubscribeDataListener(listenerGUID);
};

Datafeeds.UDFCompatibleDatafeed.prototype._send = function (urlPath, params) {
  if (params !== undefined) {
    var paramKeys = Object.keys(params);
    if (paramKeys.length !== 0) {
      urlPath += '?';
    }
    urlPath += paramKeys.map(function (key) {
      return encodeURIComponent(key) + "=" + encodeURIComponent(params[key].toString());
    }).join('&');
  }

  this._logMessage('New request: ' + urlPath);

  return fetch(this._datafeedURL + "/" + urlPath)
    .then(function (response) { return response.text(); })
    .then(function (responseTest) { return JSON.parse(responseTest); });
};

Datafeeds.UDFCompatibleDatafeed.prototype._logMessage = function (message) {
  // console.log("[TradingView]: " + message);
};

Datafeeds.DataPulseUpdater = function (datafeed, updateFrequency) {

  this._datafeed = datafeed;
  this._subscribers = {};

  this._requestsPending = 0;
  var that = this;

  var update = function () {
    if (that._requestsPending > 0) {
      return;
    }
    
    for (var listenerGUID in that._subscribers) {
      var subscriptionRecord = that._subscribers[listenerGUID];
      var resolution = subscriptionRecord.resolution;
      var datesRangeRight = parseInt((new Date().valueOf()) / 1000);
      var datesRangeLeft = datesRangeRight - that.periodLengthSeconds(resolution, 10);

      that._requestsPending++;

      (function (_subscriptionRecord) {
        that._datafeed.getBars(_subscriptionRecord.symbolInfo, resolution, datesRangeLeft, datesRangeRight, function (bars) {
          that._requestsPending--;
          if (!that._subscribers.hasOwnProperty(listenerGUID)) {
            return;
          }

          if (bars.length === 0) {
            return;
          }

          var lastBar = bars[bars.length - 1];
          if (!isNaN(_subscriptionRecord.lastBarTime) && lastBar.time < _subscriptionRecord.lastBarTime) {
            return;
          }

          var subscribers = _subscriptionRecord.listeners;

          _subscriptionRecord.lastBarTime = lastBar.time;

          for (var i = 0; i < subscribers.length; ++i) {
            subscribers[i](lastBar);
          }
        },
        function (){
          that._requestsPending--;
        }, 'Interval')
      }(subscriptionRecord));
    }
  };

  if (typeof updateFrequency !== 'undefined' && updateFrequency > 0) {
    this._datafeed._intervalTimer = setInterval(update, updateFrequency);
  }
};

Datafeeds.DataPulseUpdater.prototype.unsubscribeDataListener = function (listenerGUID) {
  this._datafeed._logMessage(`Unsubscribing ${listenerGUID}`);
  delete this._subscribers[listenerGUID];
};

Datafeeds.DataPulseUpdater.prototype.subscribeDataListener = function (symbolInfo, resolution, newDataCallback, listenerGUID) {
  this._datafeed._logMessage(`Subscribing ${listenerGUID}`);
  if (!this._subscribers.hasOwnProperty(listenerGUID)) {
    this._subscribers[listenerGUID] = {
      symbolInfo,
      resolution,
      lastBarTime: NaN,
      listeners: [],
    };
  }
  this._subscribers[listenerGUID].listeners.push(newDataCallback);
};

Datafeeds.DataPulseUpdater.prototype.periodLengthSeconds = function (resolution, requiredPeriodsCount) {
  var daysCount = 0;
  
  if (resolution == 'D') {
    daysCount = requiredPeriodsCount;
  } else if (resolution == 'M') {
    daysCount = 31 * requiredPeriodsCount;
  } else if (resolution == 'W') {
    daysCount = 7 * requiredPeriodsCount;
  } else {
    daysCount = requiredPeriodsCount * resolution / (24 * 60);
  }

  return daysCount * 24 * 60 * 60;
};

window.Datafeeds = Datafeeds;