let selected_date;
let sd;
let ed;
let dt;
const addCommas = d3.format(',');
const pct = d3.format('.0f');
const abbr_format2 = d3.format('.2s');
const abbr_format3 = d3.format('.3s');
const CancelToken = axios.CancelToken;
const source = CancelToken.source();

const alert_error = (msg) => {
  $.alert({
    title: '',
    content: msg,
    closeIcon: true,
    type: 'red'
  });
}


const dropdown_options = (trgt,txt,opts={}) => {
  const options = {
    'enableFiltering': opts.hasOwnProperty('filtering') ? opts.filtering : false,
    'enableCaseInsensitiveFiltering': true,
    'includeSelectAllOption': true,
    'selectAllJustVisible': false,
    'buttonWidth': opts.hasOwnProperty('width') ? opts.width : 150,
    'numberDisplayed': 2,
    'nonSelectedText': txt,
    'dropRight': true,
    'maxHeight': 600,
    'buttonClass': 'btn btn-outline-secondary btn-sm',
    'onDropdownHide': function(event) {
      $(this['$button']).children('span').css('font-weight', 'inherit');
    },
    'onChange': function(option) {
      $('#update').addClass('pulse-primary');
    }
  }

  $(`${trgt}`).multiselect(options);
}

$('[data-toggle="tooltip"]').tooltip();

mfrs.sort().forEach(d => {
  let selected = d === 'Samsung' ? 'selected' : '';
  $('#manufacturer').append(`<option value="${d}" ${selected}>${d}</option>`);
});

dropdown_options('#region','Select Region', { 'width': 90 });
dropdown_options('#category','Select Category',{ 'width': 170, 'filtering': true });
dropdown_options('#user-type','Select User Type',{ 'width': 185 });
dropdown_options('#num-top-products','# Top Products',{ 'width': 100 });
dropdown_options('#num-top-manufacturers','# Top Manufacturers',{ 'width': 131 });
dropdown_options('#manufacturer','Select a Manufacturer',{ 'width': 131 });


// date range
let offset = (new Date().getTimezoneOffset() + 60) * 60000; // TZ offset

const get_filters = () => {
  let filters = {
    'region': $('#region option:selected').val(),
    'category': encodeURIComponent($('#category option:selected').val()),
    // 'manufacturer': $('#manufacturer').val(),
    'manufacturer': encodeURIComponent($('#manufacturer option:selected').val()),
    'user_type': $('#user-type option:selected').val(),
    'top_products': $('#num-top-products option:selected').val(),
    'top_manufacturers': $('#num-top-manufacturers option:selected').val(),
    'month': moment(selected_date, 'YYYY-MM-DD').format('YYYYMM'),
    'month_prev': moment(selected_date, 'YYYY-MM-DD').subtract(12, 'months').format('YYYYMM'),
    'csrfmiddlewaretoken': $('#csrf-token').val(),
    'errors': []
  }

  if (filters.manufacturer === '')
    filters.errors.push('Please enter a <b>Manufacturer</b>.');
  if (filters.top_products === '' || filters.top_products === 0)
    filters.errors.push('Please enter a valid value for <b># Top Products</b>.');
  if (filters.top_manufacturers === '' || filters.top_manufacturers === 0)
    filters.errors.push('Please enter a valid value for <b># Top Manufacturers</b>.');

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

  set_labels(filters);
  return filters;
}


const set_labels = filters => {
  $('.selected-category').text(decodeURIComponent(filters.category));
  $('.selected-month').text(moment(filters.month, 'YYYY-MM-DD').format('MMMM, YYYY'));
  $('.selected-region').text(filters.region.toUpperCase());
  $('.selected-user-type').text($('#user-type option:selected').text());
  $('.selected-manufacturer').text(decodeURIComponent(filters.manufacturer));

  let user_type_color = filters.user_type === 'considered_user_cnt' ? '#E64C3C' : '#F9C822'; 
  $('.top-chart-avg, .top-chart-avg-yoy').css({ 'color': user_type_color });
}


const generate_top_cats = (sort_dim,direction) => {
  $('#top-categories').empty();
  let dir = direction === 'asc' ? 1 : -1;
  let inverse_dir = dir === 1 ? -1 : 1
  window.top_categories.sort((a, b) => { 
    return (a[sort_dim] > b[sort_dim]) ? dir : inverse_dir;
  }).forEach(d => {
    $('#top-categories').append(`
      <tr>
        <td>${d.category_nm}</td>
        <td>${d.rank_val}</td>
        <td>${d.prev_rank_val}</td>
      </tr>
    `);
  });
}


const generate_spark_chart = (trend_data,target,data,color) => {
  let trend_chart_options = buildChart({
    'chart_type': 'bar',
    'height': 25,
  });
  trend_chart_options.chart.margin = [0, 50, 0, 0];
  trend_chart_options.plotOptions = {
    'series': {
      'grouping': false,
      'borderWidth': 0,
    }
  }
  trend_chart_options.legend = { 'enabled': false };
  trend_chart_options.xAxis = { 'visible': false };
  trend_chart_options.yAxis = { 'visible': false };
  trend_chart_options.tooltip = { 'enabled': false };
  trend_chart_options.series = [
    {
      'color': 'transparent',
      'linkedTo': 'main',
      'data': [Math.max(...data.map(d => { return d.considered_user_cnt }))],
    }, {
      'id': 'main',
      'color': color,
      'dataSorting': {
        'enabled': true,
        'matchByName': true
      },
      'dataLabels': [{
        'enabled': true,
        'inside': false,
        formatter: function() { return `<span class="inside-label">${addCommas(this.y)}</span>`; },
        'useHTML': true
      }],
      'data': [trend_data]
    }
  ];

  trend_chart_options.exporting.chartOptions.yAxis = {
    'labels': {
      'style': { color: '#444F57' },
    },
  };

  charts[target] = new Highcharts.chart(target, trend_chart_options);
}


const generate_trend_chart = (data,target,color,label,height=null) => {
  let user_type_chart = buildChart({ chart_type: 'column' });
  if (height !== null) user_type_chart.chart.height = height;
  user_type_chart.yAxis = [{
    labels: {
      formatter: function () {
        return this.axis.defaultLabelFormatter.call(this);
      },
      style: { color: '#444F57' },
      enabled: true
    },
    title: { text: 'Unique Users' }
  }];
  user_type_chart.legend.enabled = false;
  user_type_chart.tooltip = {
    formatter: function() {
      let tip_text = `<b><span style="font-size:14px;color:${this.color};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100px;">${moment(this.x).format('MMMM YYYY')}</span></b>
        <br /><span style="text-align:right;font-size:14px;font-weight:bold;">${label}: </span><span style="text-align:right;font-size:12px;">${addCommas(this.y)}</span>`
      return tip_text;
    },
    useHTML: true,
    followPointer: true
  }
  user_type_chart.series = [{
    data: generate_trended_series(window.filters.user_type, data),
    color: color
  }];

  user_type_chart.lang = { 'noData': no_data_text };

  user_type_chart.exporting.chartOptions.yAxis = {
    'labels': {
      'style': { color: '#444F57' },
    },
  };

  charts[target] = new Highcharts.chart(target, user_type_chart);
}


const generate_top_products = (data,target,color) => {
  $(`#${target}`).empty();
  data.sort((a, b) => (a.considered_user_cnt > b.considered_user_cnt) ? -1 : 1 );
  data = data.slice(0,+window.filters.top_products);
  data.forEach((d,i) => {
    let dt = d.original_published_dt !== null ? 
      moment(d.original_published_dt['$date']).format('MMM DD, YYYY') : '-';
    let rating = [0,'0','null',null].includes(d.rating_nbr) ? '-' : d.rating_nbr;
    $(`#${target}`).append(`
        <tr>
          <td>${d.catalog_item_nm}</td>
          <td>${rating}</td>
          <td>${dt}</td>
          <td id='${target}-${i}'></td>
        </tr>
      `);
    generate_spark_chart(d.considered_user_cnt,`${target}-${i}`, data, color);
  });
}


const generate_trended_series = (metric, data) => {
  let series_output = data.reduce((a, c) => {
    return [...a, {
      x: moment(c.month_id, 'YYYYMM').unix()*1000,
      y: c[metric]
    }];
  }, []).sort((a, b) => (a.x > b.x) ? 1 : -1);
  return series_output;
}


const generate_trended_dim_series = (metric, data, dim_key, dim) => {
  let series_output = data.filter(d => {
    return d[dim_key] === dim;
  }).reduce((a, c) => {
    return [...a, {
      x: moment(c.month_id, 'YYYYMM').unix()*1000,
      y: c[metric],
      rank: c.mfr_rank
    }];
  }, []);
  return series_output;
}


const generate_multi_series_chart = (target,data) => {
  let ordered_mfrs = data.filter(d => {
    return d.month_id === +window.filters.month;
  }).sort((a, b) => {
    return (a.mfr_rank > b.mfr_rank) ? 1 : -1
  }).reduce((a,c) => {
    return [...a, c.product_mfr_nm];
  }, []);

  let top_mfrs_chart = buildChart({
    chart_type: 'spline'
  });
  top_mfrs_chart.chart.height = 421;
  top_mfrs_chart.yAxis = [{
    labels: {
      formatter: function () {
        return `${(this.value*100).toFixed(0)}%`;
      },
      style: { color: '#444F57' },
      enabled: true
    },
    title: { text: 'Manufacturer Considered Users' }
  }];
  top_mfrs_chart.legend = {
    'enabled': true,
    'align': 'right',
    'layout': 'vertical',
    'verticalAlign': 'middle'
  }
  top_mfrs_chart.tooltip = {
    formatter: function() {
      let tip_text = `<b>Manufacturer:</b> ${this.series.name}<br />
        <b>Month:</b> ${moment(this.x).format('MMMM YYYY')}<br />
        <b>Manufacturer Share:</b> ${pct(this.y*100)}%<br />
        <b>Rank:</b> ${this.point.rank}`;
      return tip_text;
    },
    useHTML: true,
    followPointer: true
  }
  top_mfrs_chart.series = ordered_mfrs.reduce((a, c, i) => {
    if (i <= +filters.top_manufacturers-1) {
      return [...a, {
        name: c,
        data: generate_trended_dim_series('pct_share', window.ranked_mfrs, 'product_mfr_nm', c).sort((a, b) => {
          return (a.x > b.x) ? 1 : -1
        }),
        marker: { symbol: 'circle' },
      }];
    } else {
      return a;
    }
  }, []);

  top_mfrs_chart.lang = { 'noData': no_data_text };
  top_mfrs_chart.exporting.chartOptions.yAxis = {
    'labels': {
      'style': { color: '#444F57' },
    },
  };

  charts[target] = new Highcharts.chart(target, top_mfrs_chart);
}


const get_data = report_type => {
  return axios.get(`api/${report_type}/?${window.get_params}`);
}


const process_data = () => {
  window.filters = get_filters();
  window.get_params = Object.entries(window.filters).reduce((a,c,i) => {
    if (!['csrfmiddlewaretoken','errors'].includes(c[0])) {
      let separator = i === 0 ? '' : '&';
      return `${a}${separator}${c[0]}=${c[1]}`;
    } else {
      return a;
    }
  }, '');

  axios.all([get_data('top_categories'), get_data('cat_trend'), get_data('top_products'),
    get_data('top_mfr_products'),get_data('trended_mfr'),get_data('ranked_mfrs')])
    .then(axios.spread(function (top_categories,cat_trend,top_products,top_mfr_products,trended_mfr,ranked_mfrs) {
      /*** top categories ***/
      window.top_categories = top_categories.data;
      window.top_categories_ranked = 0;
      generate_top_cats('rank_val','asc');

      /*** category trend ***/
      window.cat_trend = cat_trend.data;
      let category_trend_ty = cat_trend.data.filter(d => {
        return d.month_id === +window.filters.month })
      category_trend_ty = category_trend_ty.length > 0 ? category_trend_ty[0][window.filters.user_type] : 0;
      let category_trend_ly = cat_trend.data.filter(d => {
        return d.month_id === +window.filters.month_prev })
      category_trend_ly = category_trend_ly.length > 0 ? category_trend_ly[0][window.filters.user_type] : 0;
      let category_trend_yoy = ((category_trend_ty-category_trend_ly)/category_trend_ly)*100;
      let category_trend_total = cat_trend.data.reduce((a,c) => { return a+c[window.filters.user_type]; }, 0);
      let category_trend_avg = category_trend_total/13;
      let category_trend_color = window.filters.user_type === 'unique_user_cnt' ? '#F9C822' : '#E64C3C';
      $('.top-chart-avg').text(addCommas(Math.round(category_trend_avg)));
      $('.top-chart-avg-yoy').text(`${pct(category_trend_yoy)}%`);
      generate_trend_chart(cat_trend.data,'user-type-chart',category_trend_color,
        $('#user-type option:selected').text(),
        $('#top-categories').parent().parent().height()-43);

      /*** top products ***/
      window.top_products = top_products.data;
      generate_top_products(window.top_products, 'top-products', '#E64C3C');

      /*** top manufacturer products ***/
      window.top_mfr_products = top_mfr_products.data;
      generate_top_products(window.top_mfr_products, 'manufacturer-top-products', '#5CB85C');

      /*** trended manufacturer ***/
      window.trended_mfr = trended_mfr.data;
      let trended_mfr_ty = trended_mfr.data.filter(d => {
        return d.month_id === +window.filters.month });
      trended_mfr_ty = trended_mfr_ty.length === 0 ? 0 : trended_mfr_ty[0].considered_user_cnt;
      let trended_mfr_ly = trended_mfr.data.filter(d => {
        return d.month_id === +window.filters.month_prev })
      trended_mfr_ly = trended_mfr_ly.length === 0 ? 0 : trended_mfr_ly[0].considered_user_cnt;
      let trended_mfr_yoy = ((trended_mfr_ty-trended_mfr_ly)/trended_mfr_ly)*100;
      let trended_mfr_total = trended_mfr.data.reduce((a,c) => { return a+c[window.filters.user_type]; }, 0);
      let trended_mfr_avg = trended_mfr_total/13;
      let trended_mfr_color = window.filters.user_type === 'unique_user_cnt' ? '#F9C822' : '#E64C3C';
      $('.manufacturer-avg').text(addCommas(Math.round(trended_mfr_avg)));
      $('.manufacturer-yoy').text(`${pct(trended_mfr_yoy)}%`);
      generate_trend_chart(trended_mfr.data,'manufacturer-chart','#5CB85C','Category Considered Users');

      /*** ranked manufacturers ***/
      window.ranked_mfrs = ranked_mfrs.data;
      generate_multi_series_chart('manufacturer-share-chart',ranked_mfrs.data);

      // tour
      if (localStorage.hasOwnProperty('cat_report_tour_viewed') === false) hopscotch.startTour(tour);
    })).then(function() {
      $('body').addClass('loaded');
      $('#loader, #loader-wrapper, .loader-section').hide();
      $('.loading-modal').modal();
      $('#update').removeClass('pulse-primary');
    }).catch(function(error) {
      console.log(error);
      alert_error(error);
    });
}


$('#update').on('click', function() {
  $('body').removeClass('loaded');
  $('#loader, #loader-wrapper, .loader-section').show();

  if (!window.cat_menu_built) {
    axios.get(`api/get_categories`, {
      cancelToken: source.token
    })
    .then(function(data) {
      let sorted_categories = data.data.sort((a, b) => (a > b) ? 1 : -1 );
      sorted_categories.forEach(d => {
        let selected = d === 'Phones' ? 'selected' : '';
        $('#category').append(`<option value="${d}" ${selected}>${d}</option>`)
      });
      $('#category').multiselect('rebuild');
      $('#category').multiselect('refresh');
      window.cat_menu_built = true;
      process_data();
    }).catch(function(error) {
      console.log(error);
      alert_error(error);
    });
  } else {
    process_data();
  }
});


$('.category-sort').on('click', function() {
  let dim = $(this).data().field;
  let cur_sorted = $(this).data().sorted;
  let sort_dir = cur_sorted === 'asc' ? 'desc' : 'asc';
  $.each($('.category-sort'), function(i,d) { 
    $(d).children('i').remove();
    $(d).data().sorted = undefined;
  });
  if (sort_dir === 'asc') {
    $(this).append(` <i class="fas fa-sort-amount-down"></i>`);
  } else {
    $(this).append(` <i class="fas fa-sort-amount-up"></i>`);
  }
  $(this).data().sorted = sort_dir;
  generate_top_cats(dim,sort_dir)
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
get_data('get_max_date').then(max_dt => {
  let max_date = moment(max_dt.data[0].month_id, 'YYYYMM').endOf('month')
  sd = moment(max_date).startOf('month').subtract(1, 'year').format('YYYY-MM-DD');
  ed = moment(max_date).endOf('month').format('YYYY-MM-DD');
  selected_date = ed;
  dt = $('#datepicker').datetimepicker({
    viewMode: 'months',
    format: 'MMM YYYY',
    defaultDate: max_date,
    minDate: moment('2016-01-01', 'YYYY-MM-DD'),
    maxDate: max_date
  }).on('dp.change', function(e) {
    selected_date = e.date.endOf('month').format('YYYY-MM-DD');
    ed = e.date.endOf('month').format('YYYY-MM-DD');
    sd = e.date.startOf('month').subtract(1,'year').format('YYYY-MM-DD');
    $('#update').addClass('pulse-primary');
  });
  $('#datepicker').val(moment(selected_date).format('MMM YYYY'));
}).then(() => {
  $('#update').trigger('click');
});

