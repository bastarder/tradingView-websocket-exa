var light = {
  preset: "mobile",
  container_id: 'tv_chart_container',
  library_path: './charting_library/',
  disabled_features: [
    'header_widget',
    'widget_logo',
    'use_localstorage_for_settings',
    'left_toolbar',
    'display_market_status',
    'go_to_date',
    'volume_force_overlay',
    'control_bar',
    'timeframes_toolbar',
  ],
  enabled_features: ["", "hide_last_na_study_output"],
  client_id: 'tradingview.com',
  user_id: 'public_user_id',
  fullscreen: false,
  autosize: true,
  custom_css_url: './light.css',
  loading_screen: {
    backgroundColor: "#FFFFFF"
  },
  overrides: {
    'mainSeriesProperties.minTick': "100/1",
    'paneProperties.background': "#FFFFFF",
    'paneProperties.bottomMargin': 25,
    'paneProperties.topMargin': 5,
    'mainSeriesProperties.barStyle.upColor': "#15CC89", //蜡烛图颜色-绿
    'mainSeriesProperties.barStyle.downColor': "#FF5B7D",//蜡烛图颜色-红
    'mainSeriesProperties.candleStyle.wickUpColor': "#15CC89",
    'mainSeriesProperties.candleStyle.wickDownColor': "#FF5B7D",
    'paneProperties.vertGridProperties.color': "transparent",
    'paneProperties.horzGridProperties.color': "#EDF1F4",
    'scalesProperties.textColor': "#C4D0D7",
    'scalesProperties.lineColor': "#EDF1F4",
    'paneProperties.legendProperties.showLegend': false,
    'paneProperties.legendProperties.showStudyArguments': false,
    'paneProperties.legendProperties.showStudyTitles': false,
    'paneProperties.legendProperties.showStudyValues': false,
    'paneProperties.legendProperties.showSeriesTitle': false,
    'paneProperties.legendProperties.showSeriesOHLC': false,
  },
  studies_overrides: { //布林柱状图颜色
    "volume.precision": 2,
    "volume.volume.color.1": "#15CC89", //绿
    "volume.volume.color.0": "#FF5B7D",//红
    "stochastic.hlines background.visible": false,
    "Relative Strength Index.hlines background.visible": false,
    "Williams %R.hlines background.visible": false,
  },
  time_frames: [],
}

var dark = {
  preset: "mobile",
  container_id: 'tv_chart_container',
  library_path: './charting_library/',
  disabled_features: [
    'header_widget',
    'widget_logo',
    'use_localstorage_for_settings',
    'left_toolbar',
    'display_market_status',
    'go_to_date',
    'volume_force_overlay',
    'control_bar',
    'timeframes_toolbar',
  ],
  enabled_features: ["", "hide_last_na_study_output"],
  client_id: 'tradingview.com',
  user_id: 'public_user_id',
  fullscreen: false,
  autosize: true,
  custom_css_url: './dark.css',
  loading_screen: {
    backgroundColor: "#1E2C3B"
  },
  overrides: {
    'paneProperties.bottomMargin': 25,
    'paneProperties.topMargin': 5,
    'mainSeriesProperties.minTick': "100/1",
    'paneProperties.background': "#1E2C3B",
    'mainSeriesProperties.barStyle.upColor': "#15CC89", //蜡烛图颜色-绿
    'mainSeriesProperties.barStyle.downColor': "#FF5B7D",//蜡烛图颜色-红
    'mainSeriesProperties.candleStyle.wickUpColor': "#15CC89",
    'mainSeriesProperties.candleStyle.wickDownColor': "#FF5B7D",
    'paneProperties.vertGridProperties.color': "transparent",
    'paneProperties.horzGridProperties.color': "#394D66",
    'scalesProperties.textColor': "#627180",
    'scalesProperties.lineColor': "#394D66",
    'paneProperties.legendProperties.showLegend': false,
    'paneProperties.legendProperties.showStudyArguments': false,
    'paneProperties.legendProperties.showStudyTitles': false,
    'paneProperties.legendProperties.showStudyValues': false,
    'paneProperties.legendProperties.showSeriesTitle': false,
    'paneProperties.legendProperties.showSeriesOHLC': false,
  },
  studies_overrides: { //布林柱状图颜色
    "volume.precision": 2,
    "volume.volume.color.1": "#00ce7d", //绿
    "volume.volume.color.0": "#e55541",//红

    "stochastic.hlines background.visible": false,
    "stochastic.%D.color": "#FF5B7D",
    "stochastic.%K.color": "#4D81F3",

    "Relative Strength Index.hlines background.visible": false,
    "Relative Strength Index.Plot.color": "#E04DF3",

    "Williams %R.hlines background.visible": false,
    "Williams %R.Plot.color": "#5E4DF3",

    "Moving Average.Plot.color": "#4D81F3",

    "Bollinger Bands.Median.color": "#FF5B7D",
    "Bollinger Bands.Upper.color": "#4D81F3",
    "Bollinger Bands.Lower.color": "#4D81F3",

    "MACD.Histogram.color": "#FF5B7D",
    "MACD.MACD.color": "#4D81F3",
    "MACD.Signal.color": "#FF5B7D",
  },
  time_frames: [],
}

var tradingConfig = {
  light: light,
  dark: dark
}