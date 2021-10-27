dropdown_options('#region','Select Region', { 'width': 90, 'includeSelectAllOption': true });
dropdown_options('#gender','Select Gender',{ 'width': 125, 'includeSelectAllOption': true });
dropdown_options('#age-group','Select Age Group',{ 'width': 125, 'includeSelectAllOption': true });

let selected_game;
let month_range = '';

const populate_game_menu = () => {
  $('#game-list').multiselect('destroy');
  $('#game-list>option').remove();

  window.game_list.forEach(d => {
    let selected_ind = selected_game === d ? 'selected' : '';
    $('#game-list').append(`<option value="${d}" ${selected_ind}>${d}</option>`);
  });

  dropdown_options('#game-list','Select a Game', {
    'filtering': true,
    'btnClass': 'game-list-menu',
    'width': 450,
    'onChangeCallback': function(option, checked) {
      selected_game = option[0].value;
      generate_trended_game_info(selected_game);
      $('a[data-add-filters]').data().addFilters = { 'game_name': selected_game };
    }
  });
}


const get_filters = () => {
  let new_filters = {
    'region': [...$('#region option:selected').map((i,d) => d.value )],
    'gender': [...$('#gender option:selected').map((i,d) => d.value )],
    'age_group': [...$('#age-group option:selected').map((i,d) => d.value )],
    'csrfmiddlewaretoken': $('#csrf-token').val(),
    'errors': []
  }

  new_filters.month_start = filters.month_start;
  new_filters.month_end = filters.month_end;

  if (new_filters.region.length === 0)
    new_filters.errors.push('Please select a <b>Region</b>.');
  if (new_filters.gender.length === 0)
    new_filters.errors.push('Please select a <b>Gender</b>.');
  if (new_filters.age_group.length === 0)
    new_filters.errors.push('Please select an <b>Age Group</b>.');

  if (new_filters.errors.length > 0) {
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

  window.export_filter_txt = `Region: ${new_filters.region.join(',')}   |   Gender: ${new_filters.gender.join(',')}   |   Age Group: ${new_filters.age_group.join(',')}`;
  return new_filters;
}


const generate_top_list = target => {
  let el = $(`#${target}`);
  let sort_metric = el.data().metric;
  let filter_target = target.replace('-topN','-filter');
  let filter_text = $(`.${filter_target}.active`).text();
  window.data.sort((a,b) => (a[sort_metric] > b[sort_metric]) ? -1 : 1 );

  let out = window.data;
  
  if (filter_text === 'Include >= 20% Awareness Score')
    out = window.data.filter(d => d.awareness_score >= 0.2);

  out = out.reduce((a,c) => {
    return [...a, {
      'game_name': c.game_name,
      'perceived_quality_score': c.perceived_quality_score,
      'awareness_score': c.awareness_score,
      'purchase_intent_score': c.purchase_intent_score
    }]
  }, []);

  return out.slice(0,el.val());
}


const generate_bar_chart = (target,data,trgt_metric,formatter,title) => {
  $(`#${target}`).empty();
  let trend_data = data.reduce((a,c,i) => {
    return [...a, {
        'name': c.game_name,
        'y': c[trgt_metric],
        'perceived_quality_score': c.perceived_quality_score,
        'awareness_score': c.awareness_score,
        'purchase_intent_score': c.purchase_intent_score,
        'rank': i+1,
    }]
  }, []);

  let game_list = data.reduce((a,c) => {
    return [...a, c.game_name]
  }, []);

  let trend_chart_options = buildChart({
    'chart_type': 'bar',
    'height': 800,
  });

  trend_chart_options.legend = { 'enabled': false };
  trend_chart_options.xAxis.categories = game_list;
  trend_chart_options.yAxis = { 'visible': false };
  trend_chart_options.tooltip = { 'enabled': false };
  trend_chart_options.series = [
    {
      'dataLabels': [{
        'enabled': true,
        'inside': false,
        formatter: function() {
          let label = formatter === pct ? `${formatter(this.y*100)}%` : formatter(this.y);
          return `<span class="inside-label">${label}</span>`;
        },
        'useHTML': true
      }],
      'data': trend_data
    }
  ];

  trend_chart_options.tooltip = {
    formatter: function() {
      let tooltip = `<h6 class="mb-0">Game <small class="pl-2">${this.point.name}</small></h6>
        <h6 class="mb-0">Rank<small class="pl-2">${this.point.rank}</small></h6>
        <h6 class="mb-0">Awareness Score <small class="pl-2">${pct(this.point.awareness_score*100)}%</small></h6>
        <h6 class="mb-0">Purchase Intent Score <small class="pl-2">${pct(this.point.purchase_intent_score*100)}%</small></h6>
        <h6 class="mb-0">Perceived Quality Score <small class="pl-2">${decimal(this.point.perceived_quality_score)}</small></h6>`;
      return tooltip;
    },
    'useHTML': true,
    'followPointer': true,
    'backgroundColor': '#FFFFFF',
    'outside': true
  }
  trend_chart_options.plotOptions.series = {
    borderWidth: 0,
    color: {
      linearGradient: [0, 0, 1200, 0],
      stops: [
        [0, '#76C3FF'],
        [1, '#1769A0']
      ]
    }
  }

  trend_chart_options.exporting.allowHTML = true;
  trend_chart_options.exporting.chartOptions.yAxis = {
    'labels': {
      'style': { 'color': '#444F57' },
    },
  };
  trend_chart_options.exporting.chartOptions.xAxis = {
    'labels': {
      'style': { 'color': '#444F57' },
    },
  };
  trend_chart_options.exporting.chartOptions.title = {
    'text': title,
    'useHTML': true,
    'style': {
      'color': '#444F57!important',
      'stroke': '#444F57!important',
      'fontWeight': 500
    }
  }
  trend_chart_options.exporting.chartOptions.credits = {
    'enabled': true,
    'text': window.export_filter_txt,
    'style': {
      'color': '#788B96!important',
      'fontSize': 8,
    }
  }

  charts[target] = new Highcharts.chart(target, trend_chart_options);
}


const generate_trend_chart = (data,target,game_name,height=null) => {
  $(`#${target}`).empty();
  let user_type_chart = buildChart({ chart_type: data[0].data.length === 1 ? 'scatter' : 'line' });
  if (height !== null) user_type_chart.chart.height = height;
  user_type_chart.title = {
    'text': `${game_name} - Plotted Over Time`,
    'style': {
      'color': '#FB4500!important',
      'stroke': '#FB4500!important',
      'fontWeight': 500
    }
  }
  user_type_chart.yAxis = [{
    labels: {
      formatter: function () {
        return `${pct(this.axis.defaultLabelFormatter.call(this)*100)}%`;
      },
      'style': { 'color': '#444F57' },
    },
    'title': { 'text': '' }
  }, {
    labels: {
      formatter: function () {
        return decimal(this.axis.defaultLabelFormatter.call(this));
      },
      'style': { 'color': '#444F57' },
    },
    'title': { 'text': '' },
    'opposite': true,
    'visible': false
  }];
  user_type_chart.legend.enabled = true;
  user_type_chart.tooltip = {
    formatter: function() {
      let value = this.series.name === 'Perceived Quality Score' ? decimal(this.y) : `${pct(this.y*100)}%`;
      let tooltip = `<h6 class="mb-0">Month and Year <small class="pl-2">${moment(this.x+offset).format('MMM YYYY')}</small></h6>
        <h6 class="mb-0">${this.series.name} <small class="pl-2">${value}</small></h6>`;
      return tooltip;

    },
    'useHTML': true,
    'followPointer': true,
    'shared': false,
    'outside': true
  }
  user_type_chart.series = data;
  user_type_chart.lang = { 'noData': no_data_text };
  user_type_chart.exporting.allowHTML = true;
  user_type_chart.exporting.chartOptions.yAxis = {
    'labels': {
      'style': { 'color': '#444F57' },
    },
  };

  user_type_chart.plotOptions.scatter = {
    'marker': {
      'enabled': true
    }
  }

  user_type_chart.exporting.chartOptions.credits = {
    'enabled': true,
    'text': window.export_filter_txt,
    'style': {
      'color': '#788B96!important',
      'fontSize': 8,
    }
  }

  user_type_chart.exporting.chartOptions.title = {
    'text': `${game_name} - Plotted Over Time`,
  }

  user_type_chart.exporting.chartOptions.subtitle = {
    'text': window.trended_chart_subtitle,
    'useHTML': true,
    'style': {
      'color': '#788B96!important',
      'stroke': '#788B96!important',
      'fontSize': 8,
    }
  }

  charts[target] = new Highcharts.chart(target, user_type_chart);
}


const generate_trended_series = (metric, data) => {
  let series_output = data.reduce((a, c) => {
    return [...a, {
      x: c.month_start_dt['$date'],
      y: c[metric]
    }];
  }, []).sort((a, b) => (a.x > b.x) ? 1 : -1);
  return series_output;
}


const get_data = async (opts={}) => {
  let params = ''
  if (opts.hasOwnProperty('game_name')) params = `&type=trended&game_name=${opts.game_name}`;
  if (opts.hasOwnProperty('get_max_date')) params = '&type=get_max_date';
  if (opts.hasOwnProperty('raw_data')) {
    params = Object.entries(opts).reduce((a,c) => {
      if (c[0] === 'raw_data')
        return `${a}&type=raw_data&`;
      else
        return `${a}${c[0]}=${c[1]}&`
    }, '').slice(0,-1);
  }

  return axios.get(`api/?${window.get_params}${params}`);
}


const get_games_list = async () => {
  return fetch(`api/?type=get_games_list`);
}


const process_data = async () => {
  window.filters = get_filters();
  if (!window.filters) {
    $('body').addClass('loaded');
    $('#loader, #loader-wrapper, .loader-section').hide();
    return;
  }

  window.get_params = Object.entries(window.filters).reduce((a,c,i) => {
    if (!['csrfmiddlewaretoken','errors'].includes(c[0])) {
      let separator = i === 0 ? '' : '&';
      return `${a}${separator}${c[0]}=${c[1]}`;
    } else {
      return a;
    }
  }, '');

  if (!window.game_list) {
    let response = await get_games_list();
    let json = await response.json();
    window.game_list = json.filter(d => !['',null].includes(d)).sort();
  }

  get_data().then(data => {
    window.data = data.data;
    $('body').addClass('loaded');
    $('#loader, #loader-wrapper, .loader-section').hide();
    $('.loading-modal').modal();
    $('#update').removeClass('pulse-primary');

    window.awareness_score = generate_top_list('awareness-score-topN');
    window.purchase_intent_score = generate_top_list('intent-score-topN');
    window.perceived_quality_score = generate_top_list('quality-score-topN');

    generate_bar_chart('awareness-score',window.awareness_score,'awareness_score',pct,`Top ${$('#awareness-score-topN option:selected').val()} (Awareness Score)`);
    generate_bar_chart('intent-score',window.purchase_intent_score,'purchase_intent_score',pct,`Top ${$('#intent-score-topN option:selected').val()} (Purchase Intent Score)`);
    generate_bar_chart('quality-score',window.perceived_quality_score,'perceived_quality_score',decimal,`Top ${$('#quality-score-topN option:selected').val()} (Perceived Quality Score)`);
    
    if (!selected_game) {
      if (window.awareness_score.length > 0) {
        selected_game = window.awareness_score[0].game_name;
        $('a[data-add-filters]').data().addFilters = { 'game_name': selected_game }
        populate_game_menu();
      }
    }

    if (selected_game) generate_trended_game_info(selected_game);

    // sample size calc
    let total_of_total_shown_game = data.data.reduce((a,c) => a+c.total_shown_game, 0);
    let sample_size = Math.round(total_of_total_shown_game/25);
    let sample_size_txt = sample_size < 500 ? 'Warning: Sample size below 500. Try multi-selecting more groups to increase sample size.' : '';
    $('#sample-size-warning').text(sample_size_txt);
  });
}


const generate_trended_game_info = game_name => {
  $('#game-list').multiselect('disable');
  $('#trended-game-chart').empty();
  $('#trended-game-chart').append(
    `<div class="spin-wrapper">
      <div class="spinner"></div>
    </div>`
  );

  get_data({ 'game_name': game_name }).then(data => {
    window.trended_data = data.data;
    release_dt = [...new Set(data.data.filter(d => d.release_dt !== 'None').map(d => moment(d.release_dt, 'YYYY-MM-DD').unix()))];
    release_dt = Math.max(...release_dt);

    let release_dt_txt = [NaN,-Infinity].includes(release_dt) ? '(TBA)' : `(${moment(release_dt*1000).format('MMM DD, YYYY')})`;
    let zone = release_dt === NaN ? null : moment(release_dt*1000).startOf('month').unix()*1000;
    let game_data = data.data.sort(function (a, b) {
      /*** commenting out because of phase 7 changes ***/
      // if (a.release_dt < b.release_dt) return -1;
      // if (a.release_dt > b.release_dt) return 1;
      /***  end commenting out because of phase 7 changes ***/

      if (a.month_start_dt['$date'] > b.month_start_dt['$date']) return 1;
      if (a.month_start_dt['$date'] < b.month_start_dt['$date']) return -1;
    });
    game_data = game_data.length > 0 ? game_data[game_data.length-1] : [{ awareness_score: 0, purchase_intent_score: 0, perceived_quality_score: 0 }];

    window.trended_chart_subtitle = `Awareness Score: ${pct(game_data.awareness_score*100)}% &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Purchase Intent Score: ${pct(game_data.purchase_intent_score*100)}% &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Perceived Quality Score: ${decimal(game_data.perceived_quality_score)}`
    $('#game-awareness-score').text(`${pct(game_data.awareness_score*100)}%`);
    $('#game-intent-score').text(`${pct(game_data.purchase_intent_score*100)}%`);
    $('#game-quality-score').text(decimal(game_data.perceived_quality_score));

    $('.game-release-dt').text(` Released: ${release_dt_txt}`);
    let trended_game_data = [{
      'name': 'Awareness Score',
      'data': generate_trended_series('awareness_score',data.data),
      'marker': { 'symbol': 'circle' },
      'zoneAxis': 'x',
      'zones': [{
        'value': zone
      }, {
        'dashStyle': 'ShortDot'
      }]
    }, {
      'name': 'Purchase Intent Score',
      'data': generate_trended_series('purchase_intent_score',data.data),
      'marker': { 'symbol': 'circle' },
      'zoneAxis': 'x',
      'zones': [{
        'value': zone
      }, {
        'dashStyle': 'ShortDot'
      }]
    }, {
      'name': 'Perceived Quality Score',
      'data': generate_trended_series('perceived_quality_score',data.data),
      'yAxis': 1,
      'marker': { 'symbol': 'circle' },
      'zoneAxis': 'x',
      'zones': [{
        'value': zone
      }, {
        'dashStyle': 'ShortDot'
      }]
    }];

    $('#game-list').multiselect('enable');
    generate_trend_chart(trended_game_data,'trended-game-chart',game_name);
  });
}


$('#update').on('click', function() {
  $('body').removeClass('loaded');
  $('#loader, #loader-wrapper, .loader-section').show();
  process_data();
});

$('.topn-filter').on('click', function() {
  let parent = $(this).parent();
  let metric = parent.data().metric;
  let fmt = metric === 'perceived_quality_score' ? decimal : pct;
  let target = $(this).data().target;
  let topn = $(`#${target}`).val()
  let title = `Top ${topn} (${titleCase(metric.replace(/_/g,' '))})`;
  $.each(parent.children('a'), function(i,d) {
    $(d).removeClass('active');
  });
  $(this).addClass('active');
  window[metric] = generate_top_list(target);
  generate_bar_chart(target.replace('-topN',''),window[metric],metric,fmt,title);
})


$('.topN').on('focus', function() {
  $(this).prop('rel', $(this).val());
}).on('change', function() {
  let el = $(this);

  if (+el.val() !== +el.prop('rel')) {
    let metric = el.data().metric;
    let title = `Top ${el.val()} (${titleCase(metric.replace(/_/g,' '))})`;
    let target = metric.replace('perceived_','').replace('purchase_','').replace('_','-');
    let fmt = metric === 'perceived_quality_score' ? decimal : pct;
    window[metric] = generate_top_list(el.prop('id'));
    generate_bar_chart(target,window[metric],metric,fmt,title);
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
get_data({ 'get_max_date': true }).then(max_dt => {
  const max_date = moment(max_dt.data[0].month_start_dt['$date']+offset);
  const three_mnths_ago = moment(max_dt.data[0].month_start_dt['$date']+offset).subtract(2, 'month').format('MMM YYYY');
  const six_mnths_ago = moment(max_dt.data[0].month_start_dt['$date']+offset).subtract(5, 'month').format('MMM YYYY');
  const twelve_mnths_ago = moment(max_dt.data[0].month_start_dt['$date']+offset).subtract(11, 'month').format('MMM YYYY');
  const cur_year = moment(max_dt.data[0].month_start_dt['$date']+offset).startOf('year').format('MMM YYYY');
  selected_date = moment(max_date).endOf('month').format('YYYY-MM-DD');

  $.fn.rangePicker.defaults.presets = [{
    buttonText  : 'Last Available Month',
    displayText : max_date.format('MMM YYYY'),
    value       : '1m'
  },{
    buttonText  : 'Last 3 Available Months',
    displayText : `${three_mnths_ago} - ${max_date.format('MMM YYYY')}`,
    value       : '3m'
  },{
    buttonText  : 'Last 6 Available Months',
    displayText : `${six_mnths_ago} - ${max_date.format('MMM YYYY')}`,
    value       : '6m'
  },{
    buttonText  : 'Last 12 Available Months',
    displayText : `${twelve_mnths_ago} - ${max_date.format('MMM YYYY')}`,
    value       : '12m'
  },{
    buttonText  : 'Current Year',
    displayText : `${cur_year} - ${max_date.format('MMM YYYY')}`,
    value       : 'current_year'
  },{
      buttonText  : 'Custom',
      displayText : 'twelve months',
      value       : 'custom',
  }];

  $('#datepicker').rangePicker({
    minDate: [5,2013],
    maxDate: [+max_date.format('MM'), +max_date.format('YYYY')],
    setDate: '1m'
  }).on('datePicker.done', function(e, result) {
    let month_range = $('#datepicker').val().includes('-') ? $('#datepicker').val().split(' - ') : $('#datepicker').val();
    let mstart = Array.isArray(month_range) ? month_range[0] : month_range;
    let mend = Array.isArray(month_range) ? month_range[1] : month_range;
    filters.month_start = moment(mstart, 'MMM YYYY').format('YYYYMM');
    filters.month_end = moment(mend, 'MMM YYYY').format('YYYYMM');
    $(this).val(mstart === mend ? mend : $('#datepicker').val());
  });

  filters.month_start = max_date.format('YYYYMM');
  filters.month_end = max_date.format('YYYYMM');

}).then(() => {
  $('#update').trigger('click');
});

