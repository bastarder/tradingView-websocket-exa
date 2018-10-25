## 运行
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
```
startChart（baseUrl?: string , symbol?: string , language?: string , resolution?: string , theme? : string, chartType?: string）:void;
例:  startChart("192.168.21.135:8081", 'BTC_USDT', 'en', '5', 'light', '1')
```

### 强制刷新图表（一般无需调用）
```
initChart()
```

### 修改主题
```
setTheme(theme: 'dark' | 'light');
```

### 修改交易对
```
setSymbol(trading_pair: string);
```

### 修改语言
```
setLanguage(language: string);
```

### 修改间隔 ('1天', 5分 这些) 
```
setResolution(resolution: string): boolean; 
间隔对照表，传左侧的数字字符串的值; 
例: setResolution('240')
'1': '1m',
'5': '5m',
'15': '15m',
'30': '30m',
'60': '1h',
'240': '4h',
'1440': '1D',
'10080': '7D',
'43200': '1M',
```

### 设置图表类型
```
setChartType(type: string);  "3"为分时 "1"为正常;
```

### 创建指标
```
createStudy(name, forceOverlay, lock, inputs, callback, overrides, options): string | boolean;
例: createStudy('Money Flow');
```
[查看详情参数解释](https://zlq4863947.gitbooks.io/tradingview/book/Chart-Methods.html#createstudyname-forceoverlay-lock-inputs-callback-overrides-options)
### 删除指标
```
removeStudy(id): boolean;
创建指标时会返回指标的唯一标识(string);
```

### 获取当前已存在的指标列表
```
getAllStudies(): [];
返回示例: [
  {id: "QKqW9B", name: "Volume"},
  {id: "bzJSHX", name: "MACD"},
]
```

## 智能创建指标方法
```
createStudyAuto(studyName, type)
type: 主指标: 'first' 副指标: 'second';
studyName 传 空字符串("")时, 将影藏所有 指定类型（主或副）的指标;
例1: createStudyAuto('Relative Strength Index', 'second');
例2: createStudyAuto('', 'first') //隐藏所有主指标;
```