"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

var WebSocketClient = (function () {
    function WebSocketClient(opt, cbOption) {
        var _this = this;
        this._cbOption = {};
        this._cb = {};
        this._listener = {};
        this._opt = opt;
        this._cbOption = cbOption;
        this.init();
        setInterval(function () {
            !_this._ws || _this._ws.readyState !== 1 && _this.init();
        }, WebSocketClient.reConnectDelay);
    }
    WebSocketClient.prototype.init = function (reload) {
        var _this = this;
        var _a = this, _cbOption = _a._cbOption, _opt = _a._opt, _cb = _a._cb;
        this._ws = new WebSocket(_opt.socketUrl);
        this._ws.onopen = function () {
            _cbOption.onopen && _cbOption.onopen();
            if (!reload)
                return;
            for (var key in _cb) {
                _this.send(_this._listener[key].sendKey);
            }
        };
        this._ws.onmessage = function (event) {
            _cbOption.onmessage && _cbOption.onmessage(event);
            try {
                var response_1 = JSON.parse(event.data);
                var eventKey = _this.handleKey(response_1.subject);
                var activeCb = _cb[eventKey];
                if (activeCb && activeCb.length > 0) {
                    activeCb.forEach(function (cb) { return cb(response_1); });
                }
            }
            catch (error) {
                console.warn('Onmessage Error: ==> ', error);
            }
        };
    };
    WebSocketClient.prototype.send = function (sendKey) {
        this._ws.send(JSON.stringify(sendKey));
    };
    WebSocketClient.prototype.handleKey = function (data) {
        var type = data.type, _a = data.service, service = _a === void 0 ? "@" : _a, _b = data.pair, pair = _b === void 0 ? "$" : _b, _c = data.period, period = _c === void 0 ? "#" : _c, _d = data.limit, limit = _d === void 0 ? "*" : _d;
        if (!type || !~WebSocketClient.supportEventType.indexOf(type))
            return false;
        return service + "." + type + "." + pair + "." + period + "." + limit;
    };
    WebSocketClient.prototype.close = function () {
        this._cb = {};
        this._ws.close();
    };
    WebSocketClient.prototype.add = function (param, cb) {
        var _this = this;
        var key = this.handleKey(param);
        if (!key)
            return false;
        var sendKey = __assign({}, param, { model: 'sub' });
        var unKey = __assign({}, param, { model: 'uns' });
        if (this._cb[key]) {
            this._cb[key].push(cb);
        }
        else {
            this.send(sendKey);
            this._cb[key] = [cb];
        }
        var listener = {
            cb: cb,
            param: param,
            sendKey: sendKey,
            addTime: new Date(),
            delete: function () {
                if (!_this._cb[key])
                    return;
                _this._cb[key] = _this._cb[key].filter(function (item) { return item !== cb; });
            },
            close: function () {
                delete _this._cb[key];
                _this.send(unKey);
            }
        };
        this._listener[key] = listener;
        return listener;
    };
    WebSocketClient.reConnectDelay = 15000;
    WebSocketClient.supportEventType = ['kline', 'ticker', 'trade', 'depth'];
    return WebSocketClient;
}());

