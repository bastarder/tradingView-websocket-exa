
var _baseUrl = "192.168.21.135:8081";
var rss = null;
var widget = null;
var _symbol = 'BTC_USDT';
var _language = 'en';
var _datafeedUrl = 'http://' + _baseUrl + '/v1';
var _resolution = '5';
var _theme = 'dark';
var _chartType = '1';
var initTimer = null;
var loading = true;
var pageInitFinish = false;
var waitInitTimer = null;

window.onload = function(){
  pageInitFinish = true;
  // startChart('13.230.25.84:8081');
  handleTouchRange();
}

function handleTouchRange(){
  action();
  setInterval(action, 1000);
  function action(){
    try {
      var width = +window.frames[0].document.getElementsByClassName('chart-markup-table price-axis')[1].style.width.replace('px', '');
    } catch (error) {
      var width = 55;
    }

    try {
      document.getElementById('disabled-touch-scale').style.width = width + 4 + 'px';
    } catch (error) {

    }
  }
}

function startChart(baseUrl, symbol, language, resolution, theme, chartType){
  _baseUrl = baseUrl || _baseUrl;
  _datafeedUrl = 'http://' + _baseUrl + '/v1';
  _symbol = symbol || _symbol;
  _language = language || _language;
  _resolution = resolution || _resolution;
  _theme = theme || _theme;
  _chartType = chartType || _chartType;
  document.body.className = _theme;

  waitInitTimer = setInterval(function(){
    if(!pageInitFinish) return ;
    clearInterval(waitInitTimer);

    rss = new WebSocketClient({
      socketUrl: "ws://" + _baseUrl + "/ws",
    }, {
      onopen: function(){
        initChart();
      }
    })
  }, 100)
}

function initChart(){
  initTimer && clearTimeout(initTimer);
  initTimer = setTimeout(function(){
    loading = true;
    rss && rss._closeCurrentKline && rss._closeCurrentKline();

    var config = tradingConfig[_theme];

    config.symbol = _symbol;
    config.interval = _resolution;
    config.locale = _language;
    config.datafeed = new Datafeeds(_datafeedUrl, rss)

    widget = new TradingView.widget(config)
    widget.onChartReady(function(){
      createStudy('volume', true);
      createStudyAuto('Moving Average', 'first');
      setChartType(_chartType);
      widget.chart().onDataLoaded().subscribe(null, function(){
        loading = false;
      })
      widget.subscribe('edit_object_dialog', function(){
        widget.closePopupsAndDialogs();
      })
    });
  }, 200)
}

function setTheme(theme){
  _theme = theme;
  document.body.className = _theme;
  initChart();
}

function setSymbol(symbol){
  _symbol = symbol;
  initChart();
}

function setLanguage(language){
  _language = language;
  initChart();
}

function setResolution(interval){
  if(!widget || loading){
    return false;
  }

  var chartType = 1;
  var resolution = interval;

  if(interval == '1000001'){
    chartType = 3;
    resolution = '1';
  }

  _resolution = resolution;

  if(widget.chart().resolution() != resolution){
    loading = true;
    widget.chart().setResolution(String(resolution), function() {
      console.log('Set Success!', String(resolution))
      loading = false;
      widget.chart().setChartType(chartType);
    });
  }else{
    widget.chart().setChartType(chartType);
  }
}

function setChartType(chartType){
  if(chartType === '3'){
    setResolution('1000001');
  }else{
    widget && widget.chart().setChartType(Number(chartType));
  }
}

function createStudy(){
  if(!widget || !widget.chart()){
    return false
  }

  if(arguments[0] === 'Moving Average'){
    // var colors = ['#222222', '#333333', '#ffffff', '#000000'];
    [5, 10, 30, 60].forEach(function(range, index){
      widget.chart().createStudy('Moving Average', false, false, [range], null, {
        // 'Plot.color': colors[index],
      })
    })
    return '0'
  }

  var id = widget.chart().createStudy.apply(widget.chart(), arguments);

  widget.chart().getStudyById(id).setUserEditEnabled(false);

  return id;
}

function createStudyAuto(key, type){
  var studiesMap = {
    first: ['Moving Average', 'Bollinger Bands'],
    second: ['MACD', 'Stochastic', 'Relative Strength Index', 'Williams %R']
  }

  var studies = studiesMap[type] || [];
  var current_studies = getAllStudies() || [];

  current_studies.forEach(function(study){
    if(~studies.indexOf(study.name)){
      removeStudy(study.id);
    }
  });

  key && createStudy(key);
}

function removeStudy(id){
  if(!widget || !widget.chart()){
    return false
  }
  return widget.chart().removeEntity(id);
}

function getAllStudies(){
  if(!widget || !widget.chart()){
    return false
  }
  return widget.chart().getAllStudies()
}

function action(id){
  if(!widget || !widget.chart()){
    return false
  }
  return widget.chart().executeActionById(id || 'chartProperties')
}

window.onerror = function(err) {
  console.warn('Error:', err)
}
