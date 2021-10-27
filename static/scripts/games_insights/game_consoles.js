dropdown_options('#region','Select Region', { 'width': 90, 'includeSelectAllOption': true });
dropdown_options('#gender','Select Gender', { 'width': 125, 'includeSelectAllOption': true });
dropdown_options('#age-group','Select Age Group', { 'width': 125, 'includeSelectAllOption': true });

let colors = ['#3397DA','#5CB85C','#F9C822','#E64C3C','#756BB1','#8CD58C',
    '#FFDA6A','#FF7683','#BFB7F4','#1769A0','#2DA22D','#B28A00','#A3392E',
    '#6E60C3'];
let page_init = true;
let selected_console = ['Xbox One X','Xbox One S','PlayStation 4 Pro (PS4 Pro)','Android phone','Android tablet'];

const populate_console_menu = async () => {
  $('#console-list').multiselect('destroy');
  $('#console-list>option').remove();

  await get_data({ 'type': 'get_consoles' }).then(console_list => {
    console_list.data.forEach(d => {
      let selected_ind = selected_console.includes(d) ? 'selected' : '';
      $('#console-list').append(`<option value="${d}" ${selected_ind}>${d}</option>`);
    });

    dropdown_options('#console-list', 'Select up to 10 Game Consoles', {
      'filtering': true,
      'btnClass': 'console-list-menu extra-clear',
      'width': 275,
      'onChangeCallback': function(option, checked) {
        let selectedOptions = $('#console-list option:selected');
     
        if (selectedOptions.length >= 10) {
          let nonSelectedOptions = $('#console-list option').filter(function() {
            return !$(this).is(':selected');
          });

          nonSelectedOptions.each(function() {
            let input = $(`input[value="${$(this).val()}"]`);
            input.prop('disabled', true);
            input.parent().addClass('disabled');
          });
        }
        else {
          $('#console-list option').each(function() {
            let input = $(`input[value="${$(this).val()}"]`);
            input.prop('disabled', false);
            input.parent().removeClass('disabled');
          });
        }
      }
    });
  })

}


const get_filters = () => {
  let new_filters = {
    'region': [...$('#region option:selected').map((i,d) => d.value )],
    'gender': [...$('#gender option:selected').map((i,d) => d.value )],
    'age_group': [...$('#age-group option:selected').map((i,d) => d.value )],
    'csrfmiddlewaretoken': $('#csrf-token').val(),
    'collection': 'consoles',
    // 'game_consoles': [...$('#console-list option:selected').map((i,d) => d.value )],
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
    new_filters.errors.forEach(d => { message += `<li>${d}</li>` });

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

  let label = new_filters.month_start === new_filters.month_end ? moment(new_filters.month_end, 'YYYYMM').format('MMMM YYYY') : $('#datepicker').val();
  window.date_display = label;
  $('.month-label').text(label);
  return new_filters;
}


const generate_bar_chart = (data,target, title='') => {
  $(`#${target}`).empty();
  let month_data = data.filter(d => {
    return moment(d.month_start_dt['$date']+offset).format('YYYYMM') >= window.filters.month_start
      && moment(d.month_start_dt['$date']+offset).format('YYYYMM') <= window.filters.month_end;
  });

  if (window.filters.month_start !== window.filters.month_end) {
    month_data = month_data.reduce((a,c) => {
      let search_idx = a.findIndex(d => d.choice_text === c.choice_text);

      if (search_idx >= 0 ) {
        a[search_idx].choice_count += c.choice_count;
      } else {
        a = [...a, { 'choice_text': c.choice_text, 'choice_count': c.choice_count }]
      }

      return a;
    }, []);
  }

  let total = month_data.reduce((a,c) => { return a+c.choice_count }, 0);
  if (month_data.findIndex(d => d.choice_text === 'TOTAL') >= 0)
    total = month_data.filter(d => d.choice_text === 'TOTAL')[0].choice_count;
  
  month_data = month_data.sort((a, b) => (a.choice_count > b.choice_count) ? -1 : 1);

  let trend_data = month_data.filter(d => d.choice_text !== 'TOTAL').reduce((a,c) => {
    return [...a, {
      'name': c.choice_text,
      'y': c.choice_count / total,
    }]
  }, []);

  window[target.replace(/-/g, '_')] = trend_data;

  let console_list = month_data.filter(d => d.choice_text !== 'TOTAL').reduce((a,c) => {
    return [...a, c.choice_text]
  }, []);

  let trend_chart_options = buildChart({
    'chart_type': 'bar',
    'height': 800,
  });

  trend_chart_options.legend = { 'enabled': false };
  trend_chart_options.xAxis.categories = console_list;
  trend_chart_options.yAxis = { 'visible': false };
  trend_chart_options.tooltip = { 'enabled': false };
  trend_chart_options.series = [
    {
      'dataLabels': [{
        'enabled': true,
        'inside': false,
        formatter: function() {
          return `<span class="inside-label">${pct(this.y*100)}%</span>`;
        },
        'useHTML': true
      }],
      'data': trend_data
    }
  ];

  trend_chart_options.tooltip = {
    formatter: function() {
      let tooltip = `<h6 class="mb-0">Console <small class="pl-2">${this.point.name}</small></h6>
        <h6 class="mb-0">Awareness Score <small class="pl-2">${pct(this.y*100)}%</small></h6>`;
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
    'style': {
      'color': '#444F57!important',
      'stroke': '#444F57!important',
      'fontWeight': 500
    }
  }

  charts[target] = new Highcharts.chart(target, trend_chart_options);
}


const generate_trend_chart = (data,target,title=null) => {
  $(`#${target}`).empty();
  let user_type_chart = buildChart({ 'type': 'line' });
  user_type_chart.title = { 'text': title };
  user_type_chart.yAxis = [{
    labels: {
      formatter: function () {
        return `${pct(this.axis.defaultLabelFormatter.call(this)*100)}%`;
      },
      'style': { 'color': '#444F57' },
    },
    'title': { 'text': target === 'ownership-over-time' ? 'Pct of Total Answered' : 'Pct of Total Responses' }
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
  user_type_chart.plotOptions.line = {
    'dataLabels' : {
      'enabled' : true,
      formatter: function() {
        var first = this.series.data[0],
          last  = this.series.data[this.series.data.length - 1];
        if ((this.point.category === first.category && this.point.y === first.y) ||
            (this.point.category === last.category && this.point.y === last.y)) {
          return this.series.name;
        }
        return '';
      }
    },
  }
  user_type_chart.legend.enabled = false;
  user_type_chart.tooltip = {
    formatter: function() {
      let tooltip = `<h6 class="mb-0">Month and Year <small class="pl-2">${moment(this.x+offset).format('MMM YYYY')}</small></h6>
        <h6 class="mb-0">Console <small class="pl-2">${this.series.name}</small></h6>
        <h6 class="mb-0">Pct to Total <small class="pl-2">${pct(this.y*100)}%</small></h6>`;
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
  user_type_chart.exporting.chartOptions.legend = { 'enabled': true };
  user_type_chart.exporting.chartOptions.plotOptions = { 'line': {
      'dataLabels': {
        'enabled': false
      }
    }
  };
  user_type_chart.exporting.chartOptions.title = {
    'text': target === 'ownership-over-time' ? 'Game Console Ownership - Plotted Over Time' : 'Primary Game Console - Plotted Over Time'
  }

  charts[target] = new Highcharts.chart(target, user_type_chart);
}


const generate_trended_series = data => {
  let series_output = data.reduce((a,c) => {
    return [...a, {
      x: c.month_start_dt.hasOwnProperty('$date') ? c.month_start_dt['$date'] : c.month_start_dt,
      y: c.pct
    }];
  }, []).sort((a, b) => (a.x > b.x) ? 1 : -1);

  return series_output;
}


const get_data = (obj={ 'type': 'monthly_ownership' }) => {
  let rtype = Object.prototype.toString.call(obj.type) && obj.hasOwnProperty('raw_data') ? `type=raw_data` : `type=${obj.type}`;
  let params = `${rtype}&${window.get_params}`;
  if (['monthly_ownership_trend','monthly_primary_trend'].includes(obj.type) || obj.hasOwnProperty('trend_start')) {
    let console_list = [...$('#console-list option:selected').map((i,d) => d.value )];
    let trend_start = window.range_start_date;
    let trend_end = window.range_end_date;
    params = `${params}&game_consoles=${console_list}&trend_start=${trend_start}&trend_end=${trend_end}`;
  }

  return axios.get(`api/?${params}`);
}


const process_data = () => {
  let date_display = moment(window.filters.month, 'YYYYMM').format('MMMM YYYY');
  get_data({ 'type': 'monthly_ownership' }).then(data => {
    window.console_ownership_data = data.data;
    generate_bar_chart(data.data,'console-ownership', `Game Console Ownership for ${window.date_display}`);

    get_data({ 'type': 'monthly_primary' }).then(data => {
      window.primary_console_data = data.data;
      generate_bar_chart(data.data,'primary-console', `Primary Game Console for ${window.date_display}`);
      process_trend_data();
    });
  });
}


const process_trend_data = () => {
  let trend_start = window.range_start_date;
  let trend_end = window.range_end_date;
  $('a[data-add-filters]').data().addFilters = {
    'trend_start': window.range_start_date,
    'trend_end': window.range_end_date
  }

  get_data({ 'type': 'monthly_ownership_trend' }).then(data => {
    window.ownership_trend_data = data.data;
    generate_trended_console_info(data.data,'ownership-over-time');

    get_data({ 'type': 'monthly_primary_trend' }).then(data => {
      window.primary_trend_data = data.data;
      generate_trended_console_info(data.data,'primary-over-time');
      $('body').addClass('loaded');
      $('#loader, #loader-wrapper, .loader-section').hide();
      $('.loading-modal').modal();
      $('#update').removeClass('pulse-primary');
    })
  });
}


const generate_trended_console_info = (data,target) => {
  let selected_consoles = $('#console-list option:selected').map((a,item) => item.value );
  let series_data = [...selected_consoles].reduce((a,c) => {
    return [...a, {
      'name': c,
      'data': generate_trended_series(data.filter(d => d.choice_text === c))
    }]
  }, []);

  let title = target === 'ownership-over-time' ? 'Game Console Ownership - Plotted Over Time' : 'Primary Game Console - Plotted Over Time';
  generate_trend_chart(series_data,target,title);
}


$('#clear-consoles-menu').on('click', function() {
  $('#console-list').multiselect('deselectAll', false);
  $('#console-list').multiselect('refresh');
});


$('#month-range-submit').on('click', function() {
  window.filters = get_filters();
  if ([...$('#console-list option:selected').map((i,d) => d.value )].length === 0) {
    $.confirm({
      title: 'All Filters Are Required',
      content: `<h5>Please correct the following errors</h5><ul class="list-unstyled"><li>You must select at least one game console.</li></ul>`,
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
  
  process_trend_data();
});


$('#update').on('click', function() {
  window.filters = get_filters();
  window.get_params = Object.entries(window.filters).reduce((a,c,i) => {
    if (!['csrfmiddlewaretoken','errors'].includes(c[0])) {
      let separator = i === 0 ? '' : '&';
      return `${a}${separator}${c[0]}=${c[1]}`;
    } else {
      return a;
    }
  }, '');

  if ($('#update').hasClass('pulse-primary') || page_init) {
    $('body').removeClass('loaded');
    $('#loader, #loader-wrapper, .loader-section').show();
    process_data();
  } else {
    let date_display = moment(window.filters.month, 'YYYYMM').format('MMMM YYYY');
    generate_bar_chart(window.console_ownership_data,'console-ownership', `Game Console Ownership for ${window.date_display}`);
    generate_bar_chart(window.primary_console_data,'primary-console', `Primary Game Console for ${window.date_display}`);
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
get_data({ 'type': 'get_max_date' }).then(max_dt => {
  const max_date = moment(max_dt.data[0].month_start_dt['$date']+offset);
  const three_mnths_ago = moment(max_dt.data[0].month_start_dt['$date']+offset).subtract(2, 'month').format('MMM YYYY');
  const six_mnths_ago = moment(max_dt.data[0].month_start_dt['$date']+offset).subtract(5, 'month').format('MMM YYYY');
  const twelve_mnths_ago = moment(max_dt.data[0].month_start_dt['$date']+offset).subtract(11, 'month').format('MMM YYYY');
  const cur_year = moment(max_dt.data[0].month_start_dt['$date']+offset).startOf('year').format('MMM YYYY');

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
    let mend = Array.isArray(month_range) ? month_range[1] : month_range
    filters.month_start = moment(mstart, 'MMM YYYY').format('YYYYMM');
    filters.month_end = moment(mend, 'MMM YYYY').format('YYYYMM');
    $(this).val(mstart === mend ? mend : $('#datepicker').val());
  });

  filters.month_start = max_date.format('YYYYMM');
  filters.month_end = max_date.format('YYYYMM');

}).then(() => {
  populate_console_menu().then(() => $('#update').trigger('click'));
});

