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
const buying_cycles = ['compare','investigate','justify','discover','optimize'];


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

dropdown_options('#region','Select Region', { 'width': 90 });
dropdown_options('#topic','Select Topic',{ 'width': 170, 'filtering': true });

// date range
let offset = (new Date().getTimezoneOffset() + 60) * 60000; // TZ offset


const get_filters = () => {
  let new_filters = {
    'region': $('#region option:selected').val(),
    'topic': encodeURIComponent($('#topic option:selected').val()),
    'month': moment(selected_date, 'YYYY-MM-DD').format('YYYYMM'),
    'csrfmiddlewaretoken': $('#csrf-token').val(),
    'errors': []
  }

  if (new_filters.region === '')
    new_filters.errors.push('Please select a <b>Region</b>.');
  if (filters.topic === '')
    new_filters.errors.push('Please select a <b>Topic</b>.');

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

  window.export_filter_txt = `Month: ${moment(new_filters.month, 'YYYYMM').format('MMM YYYY')}   |   Region: ${new_filters.region}   |   Topic: ${new_filters.topic}`;
  $('.filters-export-label').text(window.export_filter_txt)
  return new_filters;
}


const get_data = report_type => {
  return axios.get(`api/${report_type}/?${window.get_params}`);
}


const generate_bar_chart = (target,data,dim,trgt_metric,title) => {
  $(`#${target}`).empty();
  let trend_data = data.reduce((a,c) => {
    return [...a, {
      'name': c[dim],
      'y': c[trgt_metric]
    }]
  }, []);

  let related_topics = data.reduce((a,c) => {
    return [...a, c[dim]]
  }, []);

  let trend_chart_options = buildChart({
    'chart_type': 'bar',
    'height': 345,
  });

  trend_chart_options.legend = { 'enabled': false };
  trend_chart_options.xAxis.categories = related_topics;
  trend_chart_options.yAxis = { 'visible': false };
  trend_chart_options.tooltip = { 'enabled': false };
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

  trend_chart_options.series = [
    {
      'data': trend_data
    }
  ];

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


const generate_trend_chart = (data,target, height) => {
  $(`#${target}`).empty();
  let user_type_chart = buildChart({ chart_type: 'column' });
  if (height !== null) user_type_chart.chart.height = height;
  user_type_chart.yAxis = [{
    'title': { 'text': 'Unique Visitors' }
  }];

  user_type_chart.legend.enabled = false;
  user_type_chart.tooltip = {
    formatter: function() {
      return `In <strong>${moment(this.x+offset).format('MMM YYYY')}</strong> <style="color: #444F57;">${addCommas(this.y)}</span> users from <span style="color: #E64C3C;">${window.filters.region}</span> region visited <span style="color: #B28A00;">${window.filters.topic}</span> content.`;
    },
    'useHTML': true,
    'outside': true
  }
  user_type_chart.series = [{
    name: 'default',
    data: data
  }];
  user_type_chart.lang = { 'noData': no_data_text };
  user_type_chart.exporting.chartOptions.yAxis = {
    'labels': {
      'style': { 'color': '#444F57' },
    },
  };

  user_type_chart.exporting.allowHTML = true;

  user_type_chart.exporting.chartOptions.title = {
    'text': `${filters.topic} Monthly Unique Visitors Trend`
  }

  user_type_chart.exporting.chartOptions.subtitle = {
    'text': `${window.topic_label_uvs}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${window.topic_label_yoy}`,
    'useHTML': true,
  }

  user_type_chart.exporting.chartOptions.credits = {
    'enabled': true,
    'text': window.export_filter_txt,
    'style': {
      'color': '#788B96!important',
      'fontSize': 8,
    }
  }

  $('#topic-label').text(filters.topic);

  charts[target] = new Highcharts.chart(target, user_type_chart);
}


const average = arr => arr.reduce((p,c) => p+c, 0 ) / arr.length;


$('#update').on('click', function() {
  $('body').removeClass('loaded');
  $('#loader, #loader-wrapper, .loader-section').show();
  $('#related-topics, #top-companies-downloads, #top-companies-uvs, #trended-chart').empty();

  window.filters = get_filters();
  window.get_params = Object.entries(window.filters).reduce((a,c,i) => {
    if (!['csrfmiddlewaretoken','errors'].includes(c[0])) {
      let separator = i === 0 ? '' : '&';
      return `${a}${separator}${c[0]}=${c[1]}`;
    } else {
      return a;
    }
  }, '');

  get_data('topic_insight').then(topic_data => {
    window.topic_data = topic_data.data;

    /*********************************************************************************************/
    
    get_data('buying_cycles').then(cycle_data => {
      window.buying_cycle_totals = cycle_data.data.reduce((a,c) => {
        a[c.buying_cycle_name] = c.unique_visitors_cnt / c.unique_visitors_tot;
        return a;
      }, {});

      $('.month-label').text(moment(window.filters.month, 'YYYYMM').format('MMM YYYY'));
      let buying_cycle_data = topic_data.data.filter(d => d.level === 'buyingcycle').reduce((a,c,i) => {
        if (!a.hasOwnProperty(c.buying_cycle_name)) {
          a[c.buying_cycle_name] = {
            'downloads': c.downloads,
            'unique_visitors_cnt': c.unique_visitors_cnt,
          }
        } else {
          a[c.buying_cycle_name].downloads += c.downloads;
          a[c.buying_cycle_name].unique_visitors_cnt += c.unique_visitors_cnt;
        }
        return a;
      }, {});

      Object.entries(buying_cycle_data).forEach(d => {
        d[1].uv_pct = d[1].downloads === 0 ? 0 : d[1].unique_visitors_cnt / d[1].downloads;
      });

      window['buying-cycles-export'] = [];

      buying_cycles.forEach(d => {
        let buying_cycle_text = '';
        if (buying_cycle_data.hasOwnProperty(d)) {
          let cycle_calc = (buying_cycle_data[d].uv_pct - window.buying_cycle_totals[d]);
          buying_cycle_text = cycle_calc > 0.05 ? `${$('#topic option:selected').val()} users more likely to be consuming editorial content than average`
          : cycle_calc < -0.05 ? `${$('#topic option:selected').val()} users less likely to be consuming editorial content than average`
          : `${$('#topic option:selected').val()} users just as likely to be consuming editorial content than average`;
        }

        $(`#${d}`).text(buying_cycle_text);

        window['buying-cycles-export'].push({
          'buying_cycle_nm': d,
          'buying_cycle_txt': buying_cycle_text
        })
      });
    })
    
    /*********************************************************************************************/

    let related_topics_data = topic_data.data.filter(d => {
      return d.related_topic_nm !== '-'
        && d.level === 'related topic';
    }).reduce((a,c,i) => {
      let findIdx = a.findIndex(d => d.related_topic_nm === c.related_topic_nm );

      if (findIdx >= 0) {
        a[findIdx].unique_visitors_cnt += c.unique_visitors_cnt;
        return a;
      } else {
        return [...a, { 'related_topic_nm': c.related_topic_nm, 'unique_visitors_cnt': c.unique_visitors_cnt }];
      }
    }, []);
    related_topics_data.sort((a,b) => (a.unique_visitors_cnt < b.unique_visitors_cnt) ? 1 : -1);
    window['related-topics-export'] = related_topics_data;
    generate_bar_chart('related-topics',related_topics_data,'related_topic_nm','unique_visitors_cnt', 'Related Topics (Other Topics that Unique Visitors Engaged With)');

    /*********************************************************************************************/

    let content_data = topic_data.data.filter(d => d.level === 'content')
    let top_downloaded = content_data.sort((a,b) => (a.downloads < b.downloads) ? 1 : -1).slice(0, 10);
    let top_blog_news_items = content_data.sort((a,b) => (a.unique_visitors_cnt < b.unique_visitors_cnt) ? 1 : -1).slice(0, 10);

    $('#blogs-news-items > tr.dynamic, #downloaded-titles > tr.dynamic').remove();
    window['blogs-news-items-export'] = [];
    window['downloaded-titles-export'] = [];
    top_downloaded.forEach((d,i) => {
      $('#downloaded-titles').append(`<tr class="dynamic"><td>${d.asset_title_nm}</td><td>${i+1}</td></tr>`);
      window['downloaded-titles-export'].push({
        'asset_nm': d.asset_title_nm,
        'rank': i+1
      });
    });
    top_blog_news_items.forEach((d,i) => {
      $('#blogs-news-items').append(`<tr class="dynamic"><td>${d.asset_title_nm}</td><td>${i+1}</td></tr>`);
      window['blogs-news-items-export'].push({
        'asset_nm': d.asset_title_nm,
        'rank': i+1
      });
    });

    /*********************************************************************************************/

    let company_data = topic_data.data.filter(d => d.level === 'company' && d.company_name !== '-').reduce((a,c,i) => {
      let findIdx = a.findIndex(d => d.company_name === c.company_name );

      if (findIdx >= 0) {
        a[findIdx].unique_visitors_cnt += c.unique_visitors_cnt;
        a[findIdx].downloads += c.downloads;
        return a;
      } else {
        return [...a, {
          'company_name': c.company_name,
          'unique_visitors_cnt': c.unique_visitors_cnt,
          'downloads': c.downloads
        }];
      }
    }, []);
    let top_companies_downloaded = company_data.filter(d => d.downloads > 0).sort((a,b) => (a.downloads < b.downloads) ? 1 : -1).slice(0, 15);
    let top_companies_uvs = company_data.sort((a,b) => (a.unique_visitors_cnt < b.unique_visitors_cnt) ? 1 : -1).slice(0, 15);
    window['top-companies-downloads-export'] = top_companies_downloaded;
    window['top-companies-uvs-export'] = top_companies_uvs;
    generate_bar_chart('top-companies-downloads',top_companies_downloaded,'company_name','downloads','Top Companies Downloaded Content (Ranked by Downloads)');
    generate_bar_chart('top-companies-uvs',top_companies_uvs,'company_name','unique_visitors_cnt','Top Companies Editorial Content (Ranked by Unique Visitors)');


    /*********************************************************************************************/

    get_data('top_topics').then(top_topic_data => {
      let last_month = top_topic_data.data.filter(d => moment(d.day_dt['$date']+offset).format('YYYYMM') === window.filters.month).slice(0,20);
      let prev_month = top_topic_data.data.filter(d => moment(d.day_dt['$date']+offset).format('YYYYMM') === moment(window.filters.month, 'YYYYMM').subtract(1, 'month').format('YYYYMM'));
      window['top-topics-export'] = [];
      $('#top-topics').empty();
      $('.prev-month-label').text(moment(window.filters.month, 'YYYYMM').subtract(1, 'month').format('MMM YYYY'))
      last_month.forEach((d,i) => {
        let prev_idx = prev_month.findIndex(x => x.sales_topic_nm === d.sales_topic_nm)+1;
        $('#top-topics').append(`<tr><td>${d.sales_topic_nm}</td><td>${prev_idx}</td><td>${i+1}</td></tr>`);
        window['top-topics-export'].push({
          'topic': d.sales_topic_nm,
          [moment(window.filters.month, 'YYYYMM').subtract(1, 'month').format('YYYYMM')]: prev_idx,
          [window.filters.month]: i+1
        })
      });

      /*********************************************************************************************/

      get_data('topic_trend').then(trend_data => {
        let series_data = trend_data.data.reduce((a, c) => {
          return [...a, {
            x: c.day_dt['$date'],
            y: c.unique_visitors_cnt
          }];
        }, []).sort((a, b) => (a.x > b.x) ? 1 : -1);

        let series_avg = trend_data.data.reduce((a,c) => {
          return [...a, c.unique_visitors_cnt]
        }, []);
        let last_month = series_data[series_data.length-1].y;
        let last_year = series_data[0].y;
        let yoy = ((last_month - last_year) / last_year) * 100;
        let icon_direction = yoy < 0 ? '<i class="fas fa-arrow-down" style="color:#E64C3C;"></i>' : '<i class="fas fa-arrow-up" style="color:#5CB85C;"></i>';
        let text_direction = yoy < 0 ? '<span style="color:#E64C3C;">decrease</span>' : '<span style="color:#5CB85C;">increase</span>';
        window['trended-data-export'] = trend_data.data;
        window.topic_label_uvs = `${addCommas(Math.round(average(series_avg)))} Avg Monthly Visitors`;
        window.topic_label_yoy = `${pct(yoy)}% ${text_direction} over prior year`;
        $('#avg-monthly-uvs').text(`${addCommas(Math.round(average(series_avg)))} Avg Monthly Visitors`);
        $('#avg-monthly-uvs-yoy').html(`${icon_direction} ${pct(yoy)}% over prior year`);

        generate_trend_chart(series_data,'trended-chart', $('#top-topics').parent().parent().height()-26);
        $('body').addClass('loaded');
        $('#loader, #loader-wrapper, .loader-section').hide();
        $('#update').removeClass('pulse-primary');
      });
    });

    /*********************************************************************************************/
  });
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
  let max_date = moment(max_dt.data[0].day_dt['$date']+offset).endOf('month')
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


