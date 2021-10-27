dropdown_options('#region','Select Region', { 'width': 90, 'includeSelectAllOption': true });
dropdown_options('#gender','Select Gender',{ 'width': 125, 'includeSelectAllOption': true });
dropdown_options('#age-group','Select Age Group',{ 'width': 125, 'includeSelectAllOption': true });
dropdown_options('#metric','Select Metric',{ 'width': 165 });

let game_compare_list = ['Cyberpunk 2077', 'Final Fantasy VII Remake'];
let colors = ['#3397DA','#5CB85C','#F9C822','#E64C3C','#756BB1','#8CD58C',
    '#FFDA6A','#FF7683','#BFB7F4','#1769A0','#2DA22D','#B28A00','#A3392E',
    '#6E60C3'];
let genres = ['Action','Action Adventure','Adventure','Miscellaneous',
    'Racing','Role-Playing','Simulation','Sports','Strategy'];

// date range
let max_date = moment.tz('America/New_York').subtract(1, 'month').endOf('month');
let sd = moment(max_date).startOf('month').subtract(1, 'year').format('YYYY-MM-DD');
let ed = moment(max_date).endOf('month').format('YYYY-MM-DD');
let selected_date = ed;
let dt = $('#datepicker').datetimepicker({
  viewMode: 'months',
  format: 'MMM YYYY',
  defaultDate: max_date,
  minDate: moment('2013-05-01', 'YYYY-MM-DD'),
  maxDate: max_date
}).on('dp.change', function(e) {
  selected_date = e.date.endOf('month').format('YYYY-MM-DD');
  ed = e.date.endOf('month').format('YYYY-MM-DD');
  sd = e.date.startOf('month').subtract(1,'year').format('YYYY-MM-DD');
  if (window.location.pathname !== '/game_consoles') $('#update').addClass('pulse-primary');
});

$('#datepicker').val(moment(selected_date).format('MMM YYYY'));

const get_filters = () => {
  let filters = {
    'region': [...$('#region option:selected').map((i,d) => d.value )],
    'gender': [...$('#gender option:selected').map((i,d) => d.value )],
    'age_group': [...$('#age-group option:selected').map((i,d) => d.value )],
    'metric': $('#metric').val(),
    'game_list': [...$('#games-list option:selected').map((i,d) => d.value )],
    'csrfmiddlewaretoken': $('#csrf-token').val(),
    'errors': []
  }

  if (filters.game_list.length === 0)
    filters.errors.push('Please select at least one <b>Game</b>.');
  if (filters.metric === '')
    filters.errors.push('Please select a <b>Metric</b>.');
  if (filters.region.length === 0)
    filters.errors.push('Please select a <b>Region</b>.');
  if (filters.gender.length === 0)
    filters.errors.push('Please select a <b>Gender</b>.');
  if (filters.age_group.length === 0)
    filters.errors.push('Please select an <b>Age Group</b>.');

  if (filters.errors.length > 0) {
    let message = '';
    filters.errors.forEach(d => { message += `<li>${d}</li>` });

    $.confirm({
      title: 'All Filters Are Required',
      content: `<h5>Please correct the following errors</h5><ul class="list-unstyled">${message}</ul>`,
      type: 'red',
      typeAnimated: true,
      theme: 'modern',
      columnClass: 'medium',
      buttons: {
        close: {
          action: function() {
            $('#update').removeClass('disabled');
          },
          btnClass: 'btn-secondary'
        }
      }
    });
    return;
  }

  game_compare_list = [...$('#games-list option:selected').map((i,d) => d.value )];

  return filters;
}

const generate_trend_chart = (data,target,xformat='datetime',title=null,xaxis_title=null) => {
  $(`#${target}`).empty();
  let user_type_chart = buildChart({ 'chart_type': 'line' });
  user_type_chart.title = { 'text': `` };
  user_type_chart.xAxis.type = xformat;
  user_type_chart.xAxis.title = {
    'text': xaxis_title
  }
  user_type_chart.yAxis = {
    'labels': {
      formatter: function () {
        if (filters.metric === 'perceived_quality_score') {
          return `${decimal(this.axis.defaultLabelFormatter.call(this))}`;
        } else {
          return `${pct(this.axis.defaultLabelFormatter.call(this)*100)}%`;
        }
      },
      'style': { 'color': '#444F57' },
    },
    'title': { 'text': titleCase(filters.metric.split('_').join(' ')) }
  };

  user_type_chart.legend.enabled = true;
  user_type_chart.tooltip = {
    formatter: function() {
      let tooltip = `<h6 class="mb-0">Game Name: <small class="pl-2">${this.series.name}</small></h6>
        <h6 class="mb-0">Month and Year: <small class="pl-2">${moment(this.x+offset).format('MMM YYYY')}</small></h6>
        <h6 class="mb-0">Awareness Score: <small class="pl-2">${pct(this.point.awareness_score*100)}%</small></h6>
        <h6 class="mb-0">Purchase Intent Score: <small class="pl-2">${pct(this.point.purchase_intent_score*100)}%</small></h6>
        <h6 class="mb-0">Perceived Quality Score: <small class="pl-2">${decimal(this.point.perceived_quality_score)}</small></h6>`;

      if (target === 'relative-game-chart') {
        tooltip = `<h6 class="mb-0">Game Name: <small class="pl-2">${this.series.name}</small></h6>
          <h6 class="mb-0">Months from Launch: <small class="pl-2">${this.x}</small></h6>
          <h6 class="mb-0">Release Date: <small class="pl-2">${moment(this.point.release_dt, 'YYYY-MM-DD').format('MMM DD, YYYY')}</small></h6>
          <h6 class="mb-0">Awareness Score: <small class="pl-2">${pct(this.point.awareness_score*100)}%</small></h6>
          <h6 class="mb-0">Purchase Intent Score: <small class="pl-2">${pct(this.point.purchase_intent_score*100)}%</small></h6>
          <h6 class="mb-0">Perceived Quality Score: <small class="pl-2">${decimal(this.point.perceived_quality_score)}</small></h6>`;
      }

      return tooltip;
    },
    'useHTML': true,
    'followPointer': true,
    'shared': false,
    'outside': true
  };
  user_type_chart.series = data;
  user_type_chart.lang = { 'noData': no_data_text };
  user_type_chart.exporting.allowHTML = true;
  user_type_chart.exporting.chartOptions.yAxis = {
    'labels': {
      'style': { 'color': '#444F57' },
    },
    'title': {
      'text': titleCase(filters.metric.split('_').join(' ')),
      'style': { 'color': '#444F57' },
    },
  };

  user_type_chart.exporting.chartOptions.xAxis = {
    'title': {
      'text': titleCase(filters.metric.split('_').join(' ')),
      'style': { 'color': '#444F57' },
    },
    'labels': {
      'style': { 'color': '#444F57' },
    }
  };

  user_type_chart.exporting.chartOptions.title = {
    'text': title,
    'style': {
      'color': '#444F57!important',
      'stroke': '#444F57!important',
      'fontWeight': 500
    }
  }

  charts[target] = new Highcharts.chart(target, user_type_chart);
}


const generate_scatter_chart = (data,target,title) => {
  $(`#${target}`).empty();
  let scatter_data = genres.reduce((a,c,i) => {
    return [...a, {
      'name': c,
      'color': colors[i],
      'data': data.filter(d => c === d.genre).reduce((i,d) => {
        return [...i, {
          'x': d.x,
          'y': d.y,
          'game_name': d.game_name,
          'genre': d.genre,
          'perceived_quality_score': d.perceived_quality_score
        }]
      }, [])
    }];
  }, []);

  let user_type_chart = buildChart({ 'chart_type': 'scatter' });
  user_type_chart.chart.zoomType = 'xy';
  user_type_chart.chart.height = 400;
  user_type_chart.title = { 'text': `` };
  user_type_chart.legend = {
    layout: 'vertical',
    align: 'left',
    verticalAlign: 'top',
    x: 100,
    y: 70,
    floating: true,
    backgroundColor: Highcharts.defaultOptions.chart.backgroundColor,
    borderWidth: 1
  }

  user_type_chart.xAxis = {
    'labels': {
      formatter: function () {
        return `${pct(this.axis.defaultLabelFormatter.call(this)*100)}%`;
      },
      'style': { 'color': '#444F57' },
    },
    'title': {
      'enabled': true,
      'text': 'Awareness Score'
    },
    'startOnTick': true,
    'endOnTick': true,
    'showLastLabel': true
  }
  user_type_chart.yAxis = {
    'labels': {
      formatter: function () {
        return `${pct(this.axis.defaultLabelFormatter.call(this)*100)}%`;
      },
      'style': { 'color': '#444F57' },
    },
    'title': {
      'text': 'Purchase Intent Score'
    }
  }
  user_type_chart.plotOptions = {
    'scatter': {
      'dataLabels': {
        'enabled' : true,
        formatter: function() {
          let first = this.series.data[0],
            last  = this.series.data[this.series.data.length - 1];
          if ((this.point.category === first.category && this.point.y === first.y) ||
              (this.point.category === last.category && this.point.y === last.y)) {
            return this.point.game_name;
          }
          return '';
        }
      },
      'marker': {
        'radius': 5,
        'states': {
          'hover': {
            'enabled': true,
            'lineColor': 'rgb(100,100,100)'
          }
        }
      },
      'states': {
        'hover': {
          'marker': {
            'enabled': false
          }
        }
      }
    }
  }
  user_type_chart.tooltip = {
    formatter: function() {
      let tooltip = `<h6 class="mb-0">Game Name: <small class="pl-2">${this.point.game_name}</small></h6>
        <h6 class="mb-0">Genre: <small class="pl-2">${this.point.genre}</small></h6>
        <h6 class="mb-0">Awareness Score: <small class="pl-2">${pct(Math.round(this.x*100))}%</small></h6>
        <h6 class="mb-0">Purchase Intent Score: <small class="pl-2">${pct(Math.round(this.y*100))}%</small></h6>
        <h6 class="mb-0">Perceived Quality Score: <small class="pl-2">${decimal(this.point.perceived_quality_score)}</small></h6>`;

      return tooltip;
    },
    'useHTML': true,
    'followPointer': true,
    'shared': false,
    'outside': true
  };
  user_type_chart.series = scatter_data;
  user_type_chart.lang = { 'noData': no_data_text };
  user_type_chart.exporting.allowHTML = true;
  user_type_chart.exporting.chartOptions.yAxis = {
    'labels': {
      'style': { 'color': '#444F57' },
    },
  };
  user_type_chart.exporting.chartOptions.xAxis = {
    'labels': {
      'style': { 'color': '#444F57' },
    },
  };

  user_type_chart.exporting.chartOptions.title = {
    'text': title,
    'style': {
      'color': '#444F57!important',
      'stroke': '#444F57!important',
      'fontWeight': 500
    }
  }
  charts[target] = new Highcharts.chart(target, user_type_chart);
}


const generate_trended_series = (metric, data, type=undefined) => {
  let series_output = data.reduce((a, c) => {
    return [...a, {
      x: type === 'rel_launch' ? c.rel_launch : c.month_start_dt['$date']+offset,
      y: c[metric],
      'awareness_score': c.awareness_score,
      'purchase_intent_score': c.purchase_intent_score,
      'perceived_quality_score': c.perceived_quality_score,
      'release_dt': c.release_dt,
      'month_start_dt': c.month_start_dt
    }];
  }, []).sort((a, b) => (a.x > b.x) ? 1 : -1);
  return series_output;
}


const get_data = opts => {
  let rtype = Object.prototype.toString.call(opts) && opts.hasOwnProperty('raw_data') ? `type=raw_data` : `type=${opts.type}`;
  let filters = get_filters();

  if (opts.type === 'genre_compare' || opts.raw_data_type === 'genre_compare') {
    if (monthSlider.noUiSlider) {
      filters.month_start = moment(monthYearLabels[(+monthSlider.noUiSlider.get()[0])], 'MMM YYYY').format('YYYYMM');
      filters.month_end =  moment(monthYearLabels[(+monthSlider.noUiSlider.get()[1])], 'MMM YYYY').format('YYYYMM');
    }
    delete filters.game_list;
    delete filters.raw_data_type;
  }

  window.get_params = Object.entries(filters).reduce((a,c,i) => {
    if (!['csrfmiddlewaretoken','errors'].includes(c[0])) {
      let separator = i === 0 ? '' : '&';
      return `${a}${separator}${c[0]}=${c[1]}`;
    } else {
      return a;
    }
  }, '');

  return axios.get(`api/?${rtype}&${window.get_params}`);
}


const process_data = () => {
  window.filters = get_filters();

  get_data({ 'type': 'games_compare' }).then(data => {
    window.data = data.data;
    $('body').addClass('loaded');
    $('#loader, #loader-wrapper, .loader-section').hide();
    $('.loading-modal').modal();
    $('#update').removeClass('pulse-primary');
    $('.games-list').text(filters.game_list.join(' & '))
    $('.selected-metric').text(titleCase(filters.metric.split('_').join(' ')));
    generate_trended_game_info();
    process_rel_data();
  });
}


const process_rel_data = () => {
  window.filters = get_filters();

  window.get_params = Object.entries(filters).reduce((a,c,i) => {
    if (!['csrfmiddlewaretoken','errors'].includes(c[0])) {
      let separator = i === 0 ? '' : '&';
      return `${a}${separator}${c[0]}=${c[1]}`;
    } else {
      return a;
    }
  }, '');

  $('#awareness-purchase-chart').empty();
  $('#awareness-purchase-chart').append(
    `<div class="spin-wrapper">
      <div class="spinner"></div>
    </div>`
  );

  $('#month-range-submit, #update').addClass('disabled');

  get_data({ 'type': 'genre_compare' }).then(data => {
    window.awareness_purchase = data.data.filter(d => d.game_name !== null);
    generate_scatter_chart(data.data,'awareness-purchase-chart','Awareness Score to Purchase Intent Score');
    $('#month-range-submit, #update').removeClass('disabled');
  });
}


const uniqueArray = a => [...new Set(a.map(o => JSON.stringify(o)))].map(s => JSON.parse(s));


const generate_trended_game_info = () => {
  $('#games-list').multiselect('disable');
  $('#trended-games-chart, #relative-game-chart').empty();
  $('#trended-games-chart, #relative-game-chart').append(
    `<div class="spin-wrapper">
      <div class="spinner"></div>
    </div>`
  );
  $('#games-list').multiselect('enable');

  let compare_data_raw = game_compare_list.reduce((a,c) => {
    return [...a, window.data.filter(d => d.game_name === c)]
  }, []);

  window.compare_data_export = compare_data_raw.reduce((a,c) => {
    return [...a, ...c];
  }, []);

  let compare_data = compare_data_raw.reduce((a,c) => {
    return [...a, {
      'name': c[0].game_name,
      'data': generate_trended_series(filters.metric,c),
    }]
  }, []);

  generate_trend_chart(compare_data,'trended-games-chart','datetime',`${filters.game_list.join(' & ')}: Plotted Over Time (${titleCase(filters.metric.split('_').join(' '))})`,'Time to Launch');

  let release_dts = uniqueArray(compare_data_raw.reduce((i,d) => {
    return [...i, ...new Set(d.reduce((a,c) => {
        if (c.release_dt === 'None') {
          return a;
        } else {
          return [...a, { 'game_name': c.game_name, 'release_dt': c.release_dt }];
        }
      }, []))
    ];
  }, []));

  let game_list_colors = game_compare_list.reduce((a,c,i) => {
    a[c] = colors[i];
    return a;
  }, {});

  window.relative_game_export = [];
      
  let relative_launch_data = release_dts.reduce((a,c) => {
    let rel_data = window.data.filter(d =>
      d.game_name === c.game_name
      && d.release_dt === c.release_dt
    ).reduce((i,d) => {
      let start_dt_obj = moment(d.month_start_dt['$date']+offset);
      let end_dt_obj = moment(d.release_dt, 'YYYY-MM-DD');
      let diff = (start_dt_obj.year()*12+start_dt_obj.month())-(end_dt_obj.year()*12+end_dt_obj.month());

      window.relative_game_export.push({
        'months_relative_to_launch': diff, // Math.round(start_dt_obj.diff(end_dt_obj, 'months', true)),
        'game_name': d.game_name,
        'awareness_score': d.awareness_score,
        'perceived_quality_score': d.perceived_quality_score,
        'purchase_intent_score': d.purchase_intent_score,
        'release_dt': d.release_dt,
        'month_start_dt': moment(d.month_start_dt['$date']+offset).format('YYYY-MM-DD')
      });

      return [...i, {
        'rel_launch': diff, // Math.round(start_dt_obj.diff(end_dt_obj, 'months', true)),
        'game_name': d.game_name,
        'awareness_score': d.awareness_score,
        'perceived_quality_score': d.perceived_quality_score,
        'purchase_intent_score': d.purchase_intent_score,
        'release_dt': d.release_dt,
        'month_start_dt': moment(d.month_start_dt['$date']+offset).format('YYYY-MM-DD')
      }]
    }, []).sort((a,b) => (b.rel_launch < a.rel_launch) ? 1 : -1);

    return [...a, {
      'name': c.game_name,
      'data': generate_trended_series(filters.metric,rel_data,'rel_launch'),
      'color': game_list_colors[c.game_name],
      'marker': { 'symbol': 'circle' },
      'zoneAxis': 'x',
      'zones': [{
        'value': 0
      }, {
        'dashStyle': 'ShortDot'
      }]
    }] 
  }, []);
  console.log(relative_launch_data)
  generate_trend_chart(relative_launch_data,'relative-game-chart','linear',`${filters.game_list.join(' & ')}: Relative to Launch (${titleCase(filters.metric.split('_').join(' '))})`,'Negative Values - Pre-launch, 0 - Launch, Positive Values - Post-launch');
}


$('#clear-games-menu').on('click', function() {
  $('#games-list').multiselect('deselectAll', false);
  $('#games-list').multiselect('refresh');
});


$('#month-range-submit').on('click', function() {
  process_rel_data();
});


$('#update').on('click', function() {
  $('body').removeClass('loaded');
  $('#loader, #loader-wrapper, .loader-section').show();
  
  if (!window.game_list) {
    $('#games-list').multiselect('destroy');
    $('#games-list>option').remove();

    axios.get(`api/?type=get_games_list`).then(data => {
      window.game_list = data.data.filter(d => !['',null].includes(d)).sort();
      game_list.forEach(d => {
        let selected = game_compare_list.includes(d) ? 'selected' : '';
        $('#games-list').append(`<option value="${d}" ${selected}>${d}</option>`);
      });

      dropdown_options('#games-list','Select at least one game', {
        'width': 200,
        'filtering': true,
        'includeSelectAllOption': false,
        'btnClass': 'extra-clear',
        'onChangeCallback': function(option, checked) {
          let selectedOptions = $('#games-list option:selected');
   
          if (selectedOptions.length >= 5) {
            let nonSelectedOptions = $('#games-list option').filter(function() {
              return !$(this).is(':selected');
            });

            nonSelectedOptions.each(function() {
              let input = $(`input[value="${$(this).val()}"]`);
              input.prop('disabled', true);
              input.parent('li').addClass('disabled');
            });
          }
          else {
            $('#games-list option').each(function() {
              let input = $(`input[value="${$(this).val()}"]`);
              input.prop('disabled', false);
              input.parent('li').addClass('disabled');
            });
          }
        }
      });
      process_data();
    });
  } else {
    window.filters = get_filters();
    if (!window.filters) {
      $('body').addClass('loaded');
      $('#loader, #loader-wrapper, .loader-section').hide();
      return;
    }
    process_data();
  }
});


/*** Tour ***/
let callout = function() {
  let calloutMgr = hopscotch.getCalloutManager();
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
  calloutMgr.createCallout({
    id: 'show_tour_button',
    target: 'view-tour',
    placement: 'left',
    title: 'View the tour again',
    content: 'You can restart the tour at any time by clicking this button. We hope this page will be one of the first pages you visit during your work day.'
  });

  return false;
}

let tour = {
  id: 'welcome',
  showPrevButton: true,
  onClose: function() {
    localStorage.cat_report_tour_viewed = true;
    callout();
    if (localStorage.hasOwnProperty('cat_report_release') === false || localStorage.cat_report_release !== latest_version) {
      $('.release-notes').trigger('click');
    }
  },
  onEnd: function() {
    localStorage.cat_report_tour_viewed = true;
    callout();
    if (localStorage.hasOwnProperty('cat_report_release') === false || localStorage.cat_report_release !== latest_version) {
      $('.release-notes').trigger('click');
    }
  },
  steps: [{
    title: 'Report Filters',
    content: 'These are the primary filters for pulling data from the database. All filters are required in order to retrieve data.',
    target: '#filters',
    placement: 'bottom'
  }, {
    title: 'Update Data',
    content: 'Once you\'ve selected your filters, click the Get Data button to retrieve data from the database.',
    target: '.update',
    placement: 'left'
  }, {
    title: 'Top Categories by Considered Users',
    content: 'Displays the Top Categories by the User Type selected for the current month and the previous selected-month.',
    target: '#top-categories',
    placement: 'right'
  }, {
    title: 'Users Trend',
    content: 'Displays the selected User Type trend and the rolling average of the past 13 months as well as the rolling 13 month YoY average.',
    target: '#user-type-chart',
    placement: 'top'
  }, {
    title: 'Manufacturer Share',
    content: 'Compares the top Manufacturers  based on the number selected in "# Top Manufacturers" filter over the past 13 months',
    target: '#manufacturer-share-chart-container',
    placement: 'top'
  }, {
    title: 'Top Products',
    content: 'Shows the top products for the selected Category and Month. The number of top products is controlled by the "# Top Products" filter.',
    target: 'top-products',
    placement: 'top'
  }, {
    title: 'Manufacturer User Trend',
    content: 'Displays the Considered Users trend and the rolling average of the past 13 months as well as the rolling 13 month YoY average for the selected Manufacturer.',
    target: '#manufacturer-chart',
    placement: 'top'
  }, {
    title: 'Manufacturer Top Products',
    content: 'Shows the top products for the selected Category, Month, and Manufacturer. The number of top products is controlled by the "# Top Products" filter.',
    target: '#manufacturer-top-products',
    placement: 'top'
  },  {
    title: 'Export to PNG',
    content: 'Some charts can be exported to an image by clicking the respective camera icons. Alternatively, you can click on CNET Trend PPT, MFR Share PPT, and Top Products PPT. You will be asked to enter a name for the image.',
    target: '.fas.fa-camera',
    placement: 'left'
  }, {
    title: 'Profile',
    content: 'You can update your contact method and the color scheme of the site by going to your profile page. This is accessible by new CMGBIO data products going forward.',
    target: '#profile',
    placement: 'left'
  }, {
    title: 'Found an issue?',
    content: 'If you find an issue with the site you can click on this link that will allow you to create a JIRA ticket.',
    target: '#tour-found-issue',
    placement: 'left'
  }]
}

$('#view-tour').on('click', function() {
  hopscotch.startTour(tour);
});
/*** End Tour ***/


// init page
$('#update').trigger('click');