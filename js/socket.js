/**
 * 1. 因为可能安卓 IOS 需要在手机端内嵌Web使用，所以采用兼容性较强的写法，没使用ES6。
 */

function WebSocketClient(opt, cbOption){
  var that = this;
  this._opt = opt;
  this._cbOption= cbOption;
  this._cb = {};
  this._listener = [];
  this._waitEventList = [];
  this._ws = null;

  this.init();

  this.reconnectTimer = setInterval(function(){
    if(!that._ws || that._ws.readyState !== 1){
      console.warn('正在重连!');
      that.init(true);
    }
  }, 15000)

}

WebSocketClient.prototype.init = function(reload) {
  var that = this;
  var opt = this._opt;
  var cbOption = this._cbOption;

  this._ws = new WebSocket(opt.socketUrl);

  this._ws.onopen = function() {
    cbOption.onopen && cbOption.onopen();

    if(reload){
      for(var key in that._cb){
        that.send(that._listener[key].sendKey)
      }
    }

    that._waitEventList = that._waitEventList.filter(function(key){
      !that._cb[key] && that.send(key)
      return false;
    })
  }

  this._ws.onmessage = function(event) {
    cbOption.onmessage && cbOption.onmessage(event);

    try {
      var res = JSON.parse(event.data);
      var eventKey = that.handleKey(res.subject);

      if(that._cb[eventKey] && that._cb[eventKey].length > 0){
        for(var i=0; i < that._cb[eventKey].length; i++){
          that._cb[eventKey][i](res);
        }
      }

    } catch (error) {
      console.warn('Onmessage Error: ==> ', error)
    }

  };
}

WebSocketClient.prototype.send = function(key) {
  if(!this._ws || this._ws.readyState !== 1){
    this._waitEventList.push(key);
  }else{
    this._ws.send(JSON.stringify(key))
  }
}

WebSocketClient.prototype.add = function(param, cb){
  var that = this;
  var key = this.handleKey(param);

  if(!key){
    return false;
  }

  var sendKey = { ...param, model: 'sub' };
  var unKey = { ...param, model: 'uns' };

  if(this._cb[key]){
    this._cb[key].push(cb);
  } else {
    this.send(sendKey);
    this._cb[key] = [cb];
  }

  var listener = {
    cb: cb,
    param: param,
    addTime: new Date(),
    sendKey: sendKey,
    delete: function() {
      if(!that._cb[key]){
        return ;
      }
      that._cb[key] = that._cb[key].filter(function(item){
        return item !== cb;
      })
    },
    close: function() {
      delete that._cb[key]
      that.send(unKey);
    }
  }

  this._listener[key] = listener;

  return listener;
}

WebSocketClient.prototype.close = function() {
  this._cb = {};
  this._ws.close();
}

WebSocketClient.prototype.handleKey = function(param) {
  var type = param && param.type;

  if(type === 'kline'){
    if(!param.pair || !param.period){
      return false
    }
    return param.service + '.' + param.pair + '.kline|{"period":"' + param.period + '"}';
  }

  if(type === 'ticker'){
    return 'market.all.ticker'
  }

  if(type === 'trade'){
    if(!param.pair){
      return false
    }
    return 'market.'+ param.pair + '.trade';
  }

  return false

}

export default WebSocketClient;