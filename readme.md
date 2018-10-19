```
./charting_library  图表库
./charting_library/static/view.css  图表库样式位置

./js/app.js  启动相关
./js/datafeeds.js  封装的数据源接口对象（UDF-JS-API）
./js/socket.js  封装的websocket对象

运行需要本地启动web server
例: cd trading-view-example && python3 -m http.server

```


### 初始化图表方法（只需执行一次）
startChart（baseUrl?: string , symbol?: string , language?: string , resolution?: string , theme? : string）:void;
例:  startChart("192.168.21.135:8081", 'btc_usdt', 'en', '1440', 'dark')

### 强制刷新图表（一般无需调用）
initChart()

### 修改主题
setTheme(theme: 'dark' | 'light');

### 修改交易对
setSymbol(trading_pair: string);

### 修改语言
setLanguage(language: string);

### 修改间隔 ('1天', 5分 这些) 
setResolution(resolution: string): boolean; 
间隔对照表，传左侧的数字字符串的值; 例: setResolution('240')
  '1': '1m',
  '5': '5m',
  '15': '15m',
  '60': '1h',
  '240': '4h',
  '1440': '1D',
  '10080': '7D',
  '43200': '1M',
  
### 设置图表类型
setChartType(type: string);  "3"为分时 "1"为正常;