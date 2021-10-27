let no_data_text = 'There is currently no data available.';
let not_supported_text = 'The current site selected is not supported.';

function buildChart(config) {
  let chart_options = {
    chart: {
      type: config.chart_type,
      height: config.height || 300,
      marginTop: config.marginTop || undefined,
      marginRight: config.marginRight || undefined,
      marginRight: config.marginLeft || undefined,
      marginBottom: config.marginBottom || undefined,
      events: {
        load: function(event) {
          adjustChartButtons();
        }
      },
      style: { fontFamily: 'Maven Pro' },
      className: config.className || '',
    },
    title: { text: '' },
    subtitle: { text: '' },
    xAxis: {
      allowDecimals: false,
      labels: {
        formatter: config.xAxisFormatter || undefined
      },
      type: config.xAxisType || 'datetime'
    },
    yAxis: {
      title: { text: '' },
      labels: {
        formatter: function() {
          return this.value / 1000 + 'K';
        },
      },
      endOnTick: false
    },
    tooltip: {},
    plotOptions: {
      area: {
        marker: {
          enabled: false,
          symbol: 'circle',
          radius: 2,
          states: {
            hover: { enabled: true }
          }
        },
        stacking: 'stacked'
      },
      pie: {
        point: {
          events: {
            legendItemClick: function(e) {
              e.preventDefault();
            }
          }
        }
      },
      series: {
        marker: { enabled: false },
        lineWidth: 3,
        events: {
          legendItemClick: function(e) {
            e.preventDefault();
          }
        }
      }
    },
    noData: {
      style: {
        'align': 'center',
        'verticalAlign': 'middle',
        'fontSize': '1.5v',
        'fontWeight': 'normal'
      }
    },
    series: [],
    legend: { enabled: true },
    colors: ['#3397DA','#5CB85C','#F9C822','#E64C3C','#756BB1','#76C3FF','#8CD58C','#FFDA6A','#FF7683','#BFB7F4','#1769A0','#2DA22D','#B28A00','#A3392E','#6E60C3'],
    credits: { enabled: false },
    exporting: {
      enabled: false,
      buttons: {},
      chartOptions: {
        title: { text: '' },
        subtitle: {
          text: '',
          style: {
            color: '#000',
            fontSize: '8px'
          },
          align: 'right'
        },
        yAxis: {
          labels: {
            style: { color: '#444F57' },
          },
        },
        xAxis: {
          labels: {
            style: { color: '#444F57' },
          },
        },
      }
    }
  }

  button_options = config.button_options || {};
  button_option_keys = Object.keys(button_options);

  if (button_option_keys.length > 0) {
    if (button_options.line === true && $.inArray('line', button_option_keys) > -1) {
      button_state = button_options.default === 'line' ? true : false;
      chart_options.exporting.buttons.line = createButton('Line', 'spline', 'line', button_state);
    }
    if (button_options.column === true && $.inArray('column', button_option_keys) > -1) {
      button_state = button_options.default === 'column' ? true : false;
      chart_options.exporting.buttons.column = createButton('Column', 'column', 'column', button_state);
    }
    if (button_options.stackedArea === true && $.inArray('stackedArea', button_option_keys) > -1) {
      button_state = button_options.default === 'stackedArea' ? true : false;
      chart_options.exporting.buttons.stackedArea = createButton('Stacked Area', 'area', 'stackedArea', button_state, 'stacked');
    }
    if (button_options.pctArea === true && $.inArray('pctArea', button_option_keys) > -1) {
      button_state = button_options.default === 'pctArea' ? true : false;
      chart_options.exporting.buttons.pctArea = createButton('100% Area', 'area', 'pctArea', button_state, 'percent');
    }
    if (button_options.area === true && $.inArray('area', button_option_keys) > -1) {
      button_state = button_options.default === 'area' ? true : false;
      chart_options.exporting.buttons.area = createButton('Area', 'area', 'area', button_state);
    }
    if (button_options.area === true && $.inArray('pie', button_option_keys) > -1) {
      button_state = button_options.default === 'pie' ? true : false;
      chart_options.exporting.buttons.area = createButton('Pie', 'pie', 'pie', button_state);
    }
  }

  return chart_options;
}

function createButton(button_text, chart_type, button_target, button_state, stacking) {
  stacking = stacking || '';

  return {
    text: button_text,
    onclick: function() {
      updateChart(this, chart_type, button_target, stacking)
    },
    symbol: 'circle',
    symbolFill: button_state === true ? '#DDD' : 'transparent',
    symbolSize: 7,
    symbolStroke: '#DDD',
    symbolStrokeWidth: 2
  }
}

function updateChart(chart, chartType, button, stackingType) {
  stackingType = stackingType || '';

  chart.update({
    'chart': {
      'type': chartType
    },
    'plotOptions': {
      'area': {
        'stacking': stackingType
      },
      'column': {
        'stacking': stackingType
      }
    },
    'exporting': {
      'buttons': {
        'pctArea': {
          'symbolFill': button === 'pctArea' ? '#DDD' : 'transparent'
        },
        'stackedArea': {
          'symbolFill': button === 'stackedArea' ? '#DDD' : 'transparent'
        },
        'column': {
          'symbolFill': button === 'column' ? '#DDD' : 'transparent'
        },
        'line': {
          'symbolFill': button === 'line' ? '#DDD' : 'transparent'
        },
        'pie': {
          'symbolFill': button === 'pie' ? '#DDD' : 'transparent'
        },
      }
    }
  });

  adjustChartButtons();
}

function adjustChartButtons() {
  $('.highcharts-button.undefined>text').attr('x', '20');
  $('.highcharts-button.undefined>text').attr('y', '15');
}