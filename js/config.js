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
  custom_css_url: './view.css',
  overrides: {
    'mainSeriesProperties.minTick': "100/1",
    'paneProperties.background': "#FFFFFF",
    'mainSeriesProperties.barStyle.upColor': "#15CC89", //蜡烛图颜色-绿
    'mainSeriesProperties.barStyle.downColor': "#FF5B7D",//蜡烛图颜色-红
    'mainSeriesProperties.candleStyle.wickUpColor': "#15CC89",
    'mainSeriesProperties.candleStyle.wickDownColor': "#FF5B7D",
    'paneProperties.vertGridProperties.color': "transparent",
    'paneProperties.horzGridProperties.color': "#EDF1F4",
    'scalesProperties.textColor': "#C4D0D7",
    'scalesProperties.lineColor': "#EDF1F4",
  },
  studies_overrides: { //布林柱状图颜色
    "volume.precision": 2,
    "volume.volume.color.1": "#15CC89", //绿
    "volume.volume.color.0": "#FF5B7D",//红
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
  custom_css_url: './view.css',
  overrides: {
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
  },
  studies_overrides: { //布林柱状图颜色
    "volume.precision": 2,
    "volume.volume.color.1": "#00ce7d", //绿
    "volume.volume.color.0": "#e55541",//红
  },
  time_frames: [],
}

var tradingConfig = {
  light: light,
  dark: dark
}