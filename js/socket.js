/**
 * 1. 因为可能安卓 IOS 需要在手机端内嵌Web使用，所以采用兼容性较强的写法，没使用ES6。
 * 2. 重连未测试。
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
      that.init();
    }
  }, 15000)
  
}

WebSocketClient.prototype.init = function() {
  var that = this;
  var opt = this._opt;
  var cbOption = this._cbOption;

  this._ws = new WebSocket(opt.socketUrl);

  this._ws.onopen = function() {
    console.log(that._ws)
    cbOption.onopen && cbOption.onopen();
    that._waitEventList = that._waitEventList.filter(function(key){
      that._ws.send(key)
      return false;
    })
    for(var key in that._cb){
      that._ws.send(key)
    }
  }

  this._ws.onmessage = function(event) {
    cbOption.onmessage && cbOption.onmessage(event);
    
    try {
      var res = JSON.parse(event.data);
      var eventKey = res[0];
      console.log('GET MESSAGE:', eventKey, event.data);
      
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
    this._ws.send(key)
  }
}

WebSocketClient.prototype.add = function(param, cb){
  var that = this;
  var key = this.handleKey(param);

  if(!key){
    return false;
  }
  
  var sendKey = 'sub.' + key;
  var unKey = 'uns.' + key;

  if(this._cb[sendKey]){
    this._cb[sendKey].push(cb);
  } else {
    console.log('send:', sendKey)
    this.send(sendKey);
    this._cb[sendKey] = [cb];
  }

  var listener = {
    cb: cb,
    param: param,
    addTime: new Date(),
    sendKey: sendKey,
    delete: function() {
      if(!that._cb[sendKey]){
        return ;
      }
      that._cb[sendKey] = that._cb[sendKey].filter(function(item){
        return item !== cb;
      })
    },
    close: function() {
      console.log('un:', unKey)
      delete that._cb[sendKey]
      that.send(unKey);
    }
  }

  this._listener.push(listener);

  return listener;
}

WebSocketClient.prototype.close = function() {
  this._cb = {};
  this._ws.close();
}

WebSocketClient.prototype.handleKey = function(param) {
  var type = param.type;
  if(type = 'kline'){
    if(!param.name || !param.period){
      return false
    }
    return 'market.' + param.name + '.kline|{"period":"' + param.period + '"}';
  }
}

window.WebSocketClient = WebSocketClient;