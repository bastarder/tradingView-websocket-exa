"use strict";
var ajax = function (url, fn, fnf) {
    var obj = new XMLHttpRequest();
    obj.open('GET', url, true);
    obj.onreadystatechange = function () {
        if (obj.readyState == 4 && obj.status == 200 || obj.status == 304) {
            fn(JSON.parse(obj.responseText));
        }
        else if (obj.readyState == 4) {
            fnf();
        }
    };
    obj.onerror = function () { return fnf(); };
    obj.send(null);
};
var timeMap = {
    '1': '1m',
    '5': '5m',
    '15': '15m',
    '30': '30m',
    '60': '1h',
    '240': '4h',
    '1440': '1D',
    '10080': '7D',
    '43200': '1M',
};
var Datafeeds = (function () {
    function Datafeeds(_datafeedURL, _app) {
        var _this = this;
        this._datafeedURL = _datafeedURL;
        this._app = _app;
        this._protocolVersion = 2;
        this.onTick = function () { };
        this._app._closeCurrentKline = function () {
            _this._ws && _this._ws.close();
        };
    }
    Datafeeds.prototype.searchSymbols = function () {
        return;
    };
    Datafeeds.prototype.getServerTime = function (cb) {
        setTimeout(function () { return cb(Date.now()); }, 0);
    };
    Datafeeds.prototype.onReady = function (cb) {
        setTimeout(function () { return cb({
            supports_time: true,
            supports_timescale_marks: false,
            supports_marks: false,
            supported_resolutions: ['1', '5', '15', '30', '60', '240', '1440', '10080', '43200'],
            exchanges: [],
        }); }, 0);
    };
    Datafeeds.prototype.resolveSymbol = function (trading_pair, onResolve, onError) {
        setTimeout(function () { return onResolve({
            name: trading_pair,
            base_name: [trading_pair],
            full_name: trading_pair,
            timezone: 'Asia/Shanghai',
            minmov: 1,
            exchange: "",
            listed_exchange: "",
            session: '24x7',
            has_intraday: true,
            has_daily: true,
            has_empty_bars: true,
            has_no_volume: false,
            has_weekly_and_monthly: false,
            description: '',
            type: 'stock',
            supported_resolutions: ['1', '5', '15', '30', '60', '240', '1440', '10080', '43200'],
            pricescale: 10000,
            ticker: trading_pair,
        }); }, 0);
    };
    Datafeeds.prototype.subscribeBars = function (symbolInfo, resolution, onTick, listenerGuid, onResetCacheNeededCallback) {
        this.onTick = onTick;
    };
    Datafeeds.prototype.unsubscribeBars = function () {
        this.onTick = function () { };
    };
    Datafeeds.prototype.getBars = function (symbolInfo, resolution, rangeStartDate, rangeEndDate, onResult, onError, isFirstCall) {
        var _this = this;
        if (!isFirstCall) {
            try {
                this._send('/get_bars', {
                    pair: symbolInfo.name,
                    limit: 1000,
                    end: this.cacheBars[0].time,
                    period: timeMap[resolution],
                }, function (res) {
                    var options = _this.getBarsDataFormat(res) || {};
                    var _a = options.bars, bars = _a === void 0 ? [] : _a;
                    _this.cacheBars = _this.cacheBars.concat(bars);
                    _this.cacheBars = _this.cacheBars.sort(function (a, b) { return a.time - b.time; });
                    onResult(bars, { noData: !bars.length });
                }, function () {
                    onResult([], { noData: true });
                });
            }
            catch (error) {
                onResult([], { noData: true });
            }
            return;
        }
        this._ws && this._ws.close();
        var rssParam = {
            service: "market",
            type: 'kline',
            pair: symbolInfo.name.toLowerCase(),
            period: timeMap[resolution],
        };
        this._ws = this._app.add(rssParam, function (data) {
            var options = _this.getBarsDataFormat(data);
            if (!options)
                return;
            if (options.isFirst) {
                _this.cacheBars = options.bars;
                onResult(options.bars, options.meta);
            }
            else {
                var lastIndex = _this.cacheBars.length - 1;
                var lastBar = _this.cacheBars[lastIndex];
                if (lastBar.time === options.bars[0].time) {
                    _this.cacheBars[lastIndex] = options.bars[0];
                }
                else {
                    _this.cacheBars.push(options.bars[0]);
                }
                _this.onTick(options.bars[0]);
            }
        });
    };
    Datafeeds.prototype.getBarsDataFormat = function (res) {
        var type = res.type, _a = res.data, data = _a === void 0 ? [] : _a;
        if (!data || !data.length)
            return false;
        var dt = { s: 'ok', t: [], c: [], o: [], h: [], l: [], v: [] };
        for (var i = 0; i < data.length; i++) {
            dt.t.push(parseInt((data[i][0] / 1000).toString()));
            dt.o.push(parseFloat(data[i][1]));
            dt.h.push(parseFloat(data[i][2]));
            dt.l.push(parseFloat(data[i][3]));
            dt.c.push(parseFloat(data[i][4]));
            dt.v.push(parseFloat(data[i][5]));
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
            }
            else {
                barValue.open = barValue.high = barValue.low = barValue.close;
            }
            if (volumePresent) {
                barValue.volume = dt.v[i];
            }
            bars.push(barValue);
        }
        var meta = { version: this._protocolVersion, noData: false, nextTime: dt.nb || dt.nextTime };
        bars = bars.sort(function (a, b) {
            return a.time - b.time;
        });
        return {
            bars: bars,
            meta: meta,
            isFirst: type === 'i',
        };
    };
    Datafeeds.prototype._send = function (urlPath, params, cb, ecb) {
        if (cb === void 0) { cb = function (data) { }; }
        if (ecb === void 0) { ecb = function () { }; }
        if (params) {
            var paramKeys = Object.keys(params);
            if (paramKeys.length !== 0) {
                urlPath += '?';
            }
            urlPath += paramKeys.map(function (key) {
                return encodeURIComponent(key) + "=" + encodeURIComponent(params[key].toString());
            }).join('&');
        }
        return ajax(this._datafeedURL + urlPath, cb, ecb);
    };
    return Datafeeds;
}());
