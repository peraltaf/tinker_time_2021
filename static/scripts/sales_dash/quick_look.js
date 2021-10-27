let non_comscore_sites = 'comicvine';
let non_comscore_comp_sites = ['lastfm','comicvine','gamefaqs','giantbomb',
                              'metrolyrics','metacritic','techrepublic','tvguide',
                              'zdnet','cbssports.com','247sports','CBS Interactive',
                              'CBS.COM Primetime','CBS.COM Latenight',
                              'CBS.COM Daytime'];
let non_adobe_sites = ['CNET Rollup','ZDNet Websites','GameSpot',
                      'Entertainment Tonight/TV Guide Network','CNET Rollup (zdnet)',
                      'cbssports','CBS Interactive','cbs','cbsnews','cbssports.com',
                      '247sports','maxpreps','CBS.COM Primetime','CBS.COM Latenight',
                      'CBS.COM Daytime'];
let cross_visit_sites = ['CNET Rollup','cnet','Entertainment Tonight/TV Guide Network',
                        'chow','download','GameSpot','tvguide','ZDNet Websites',
                        'CNET Rollup (zdnet)','thedoctors','drphil','rachaelray',
                        'insideedition','etonline','cbssports','cbsnews','cbs'];
let cross_visit_chart = venn.VennDiagram()
                          .width($('#comp-user-overlap').parent().width())
                          .height(300);
function venn_chart_options() {
  let colours = ['#61A2D4','#5BBE85','#A873B1','#E99D39','#D15F46','#33a02c',
                '#BEB18E','#fdbf6f','#ff7f00','#cab2d6'];

  d3.selectAll('#comp-user-overlap .venn-circle path')
    .style('fill-opacity', 0)
    .style('stroke-width', 5)
    .style('stroke-opacity', .5)
    .style('stroke', function(d,i) { return colours[i]; });
  $('.venn-area.venn-intersection text').hide();
  d3.selectAll('#comp-user-overlap .venn-circle text')
    .style('fill', function(d,i) { /* return colours[i] */ return '#DDD'; })
    .style('font-size', '12px')
    .style('font-weight', '100');

  let tooltip = d3.select('body').append('div')
    .attr('class', 'venntooltip');

  chart_container = d3.select('#comp-user-overlap');
  chart_container.selectAll('g')
    .on('mouseover', function(d,i) {
      if (!d.hasOwnProperty('label')) return false;

      venn.sortAreas(chart_container, d);

      // Display a tooltip with the current size
      tooltip.transition().duration(400)
        .style('opacity', .9)
        .style('border', `1px solid ${colours[i]}`);
      tooltip.html(
        `<span style="font-color: ${colours[i]}">${d.label}</span><br />
        ${addCommas(d.size)}`);

      // highlight the current path
      let selection = d3.select(this);
      selection.select('path')
        .style('fill', colours[i] || '#EE8822')
        .style('fill-opacity', .9)
        .style('stroke-opacity', 1);
    })
    .on('mousemove', function(d) {
      tooltip.style('left', (d3.event.pageX) + 'px')
        .style('top', (d3.event.pageY + 25) + 'px');
    })
    .on('mouseout', function(d,i) {
      tooltip.transition().duration(400).style('opacity', 0);
      let selection = d3.select(this).transition('tooltip').duration(400);
      selection.select('path')
        .style('fill-opacity', 0)
        .style('stroke-opacity', .5);
    });
}
/*** end set up venn diagram ***/


/*** Date Range Selector ***/
$.getJSON(`api/?report_type=get_max_date`, function(data) {
  console.log('Finished retrieving max date...');
  // instantiate date variables
  let offset = (new Date().getTimezoneOffset() + 60) * 60000; // TZ offset
  let max_date = moment(data[0].dt['$date']+offset).endOf('month');
  ql_sd = max_date;
  sd = moment(max_date).startOf('month').subtract(1, 'year').format('YYYY-MM-DD');
  ed = moment(max_date).endOf('month').format('YYYY-MM-DD');
  let dt = $('#datepicker').datetimepicker({
      viewMode: 'months',
      format: 'MMM YYYY',
      defaultDate: max_date,
      minDate: moment('2015-01-01', 'YYYY-MM-DD'),
      maxDate: max_date
  }).on('dp.change', function(e) {
      ql_sd = e.date.startOf('month').format('YYYY-MM-DD');
      ed = e.date.endOf('month').format('YYYY-MM-DD');
      sd = e.date.startOf('month').subtract(1,'year').format('YYYY-MM-DD');

      $('#getData').addClass('pulse-primary');
  });
  $('#datepicker').val(moment(ql_sd).format('MMM YYYY'));
}).done(function(data) {
  if (localStorage.hasOwnProperty('tour_viewed') === false) {
    selected_geo = $('#comscore-geo').text();
    $('#getData').trigger('click');
    hopscotch.startTour(tour);
  } else {
    $('#site').parent().children('div.dropdown-menu').children('a:eq(0)').trigger('click');
    $('#getData').trigger('click');
  }
});

$('#getData').on('click', function() {
  if (loading !== true && !$(this).hasClass('disabled')) {
    $('#getData').removeClass('pulse-primary');
    selected_geo = $('#comscore-geo').text();

    $(this).blur();
    this.hideFocus = true;
    this.style.outline = 'none';

    // main site menu
    $('#other-reports').ddslick('destroy');
    $('#other-reports').empty();
    $('#other-reports').addClass('d-none');
    let menu_initialized = true;
    $('.site_label').text(`${site_label} ${selected_geo}`);
    $('.site_label_adobe').text(site_label);
    if (site_label === 'CNET Rollup') {
      $('.site-text').text('CNET Rollup (a.k.a. CMG) includes CNET.com including Downloads, ZDNet.com, TechRepublic.com, GameSpot.com, Giantbomb.com, Metacritic.com, Metrolyrics.com, TVGuide.com, TV.com, and Chowhound.com.');
      $('.site-text').removeClass('d-none');
    } else if (site_label === 'ZDNet Websites') {
      $('.site-text').text('ZDNet Websites (a.k.a. CBSi B2B) includes ZDNet.com and TechRepublic.com.');
      $('.site-text').removeClass('d-none');
    } else if (site_label === 'GameSpot Rollup') {
      $('.site-text').text('GameSpot Rollup includes GameSpot.com (including GameFAQS), Giantbomb.com, Metacritic.com, and Metrolyrics.com.');
      $('.site-text').removeClass('d-none');
    } else if (site_label === 'TV Guide Rollup') {
      $('.site-text').text('TV Guide Rollup (currently Entertainment Tonight/TV Guide Network) includes TVGuide.com, TV.com, and Chowhound.com.');
      $('.site-text').removeClass('d-none');
    } else {
      $('.site-text').text('');
      $('.site-text').addClass('d-none');
    }

    if (site_label === 'CNET Rollup') {
      $('#other-reports').append(`
        <option value="http://tableau.cbsi.com/#/views/CNETCATReport/CNETCatReport?:iid=1" data-description="A detailed sales report showing trends with categories, manufacturers, products on CNET.">CNET Category Report</option>
        <option value="http://tableau.cbsi.com/#/views/KeyWordTrafficPoweredbyTASER/TaserTermCloud?:iid=1" data-description="Word cloud of the top keywords surfacing in CNET content.">Taser Dashboard</option>
        <option value="https://sites.google.com/a/cbsinteractive.com/cync/research" data-description="A link to the Research tab in CYNC for additional sales resources.">Research on CYNC</option>
        <option value="https://sites.google.com/a/cbsinteractive.com/cync/bi" data-description="A link to the BI tab in CYNC for additional sales resources.">BI on CYNC</option>
        <option value="http://inventorytools.cbsi.com/accounts/login/?next=/" data-description="A link to the Yield inventory tool for checking product and inventory availability (moneyball tool).">Inventory tool</option>`
      ).removeClass('d-none');
    } else if (site_label === 'ZDNet Websites') {
      $('#other-reports').append(`
        <option value="http://tableau.cbsi.com/#/views/B2BTopicInsightsDashboard/TopicDashboard?:iid=1" data-description="A detailed report that sales can pull with trends in topics, companies, content across ZDNet & TR combined.">B2B Topic Insights Dashboard</option>
        <option value="http://tableau.cbsi.com/#/views/ProspectingB2BDashboard/ProspectingB2B?:iid=1" data-description="Trending Topics and companies, most popular article & news content and the fastest growing topics & companies by downloads.">B2B Prospecting Dashboard</option>
        <option value="https://sites.google.com/a/cbsinteractive.com/b2b-boom/b2b-research/research" data-description="A link to the Research tab in BOOM for additional sales resources.">Research on BOOM</option>
        <option value="https://sites.google.com/a/cbsinteractive.com/b2b-boom/b2b-research/bi" data-description="A link to the BI tab in BOOM for additional sales resources.">BI on BOOM</option>
        <option value="http://inventorytools.cbsi.com/accounts/login/?next=/" data-description="A link to the Yield inventory tool for checking product and inventory availability (moneyball tool).">Inventory tool</option>`
      ).removeClass('d-none');
    } else if($.inArray(site_label, ['Chowhound','GameSpot Rollup','Download.com','ETOnline.com']) >-1 ) {
      $('#other-reports').append(`
        <option value="https://sites.google.com/a/cbsinteractive.com/cync/research" data-description="A link to the Research tab in CYNC for additional sales resources.">Research on CYNC</option>
        <option value="https://sites.google.com/a/cbsinteractive.com/cync/bi" data-description="A link to the BI tab in CYNC for additional sales resources.">BI on CYNC</option>
        <option value="http://inventorytools.cbsi.com/accounts/login/?next=/" data-description="A link to the Yield inventory tool for checking product and inventory availability (moneyball tool).">Inventory tool</option>`
      ).removeClass('d-none');
    } else if ($.inArray(site_label, ['CBS Sports Rollup','CBSSports.com','247sports','MaxPreps']) >-1 ) {
      $('#other-reports').append(`
        <option value="https://docs.google.com/spreadsheets/d/1c_PoX-aY8PqDJXg_HtVEGgSI1xk3gyai1ALIC5HFrlg/edit#gid=1620043946" data-description="Sports category unique visitors trends from 2016 to date.">ComScore Monthly Trends</option>
        <option value="https://docs.google.com/spreadsheets/d/1Luvb0oEthxih8ZW5w-lNygLag1tw9V1ZSh0lxwsNcCk/edit#gid=1301337429" data-description="CBS Sports brands and competitive detailed demographic profiles from Jan 2017 to date.">ComScore Demo Profiles</option>`
      ).removeClass('d-none');
    } else if ($.inArray(site_label, ['CBS.com','CBSNews.com']) >-1 ) {
      $('#other-reports').append(`
        <option value="https://docs.google.com/spreadsheets/d/1690DHBAGd5kI8K2R8_IEaP_IcfkSYWo25ZGqhz0z_mA/edit#gid=2076568778" data-description="CBS News & Entertainment Upfront Planning Comps.">CBS News & Entertainment Upfront Planning Doc</option>`
      ).removeClass('d-none');
    }

    if (!$('#other-reports').hasClass('d-none')) {
      $('#other-reports').ddslick({
        onSelected: function(data){
          $('.dd-selected').html(`<label class="dd-selected-text">Other Reports</label>`);
          if (menu_initialized === false) window.open(data.selectedData.value, '_blank');
          menu_initialized = false;
        },
        selectText: 'Other Reports',
      })
      $('a.dd-option-selected').removeClass('dd-option-selected');
    }

    getData();
  }
});

function getDaysArrayByMonth(dt) {
  let daysInMonth = moment(dt, 'YYYY-MM-DD').daysInMonth();
  let arrDays = [];

  while(daysInMonth) {
    let current = moment(dt, 'YYYY-MM-DD').date(daysInMonth);
    arrDays.unshift(current.format('MMMM DD'));
    daysInMonth--;
  }

  return arrDays;
}
/*** End Date Range Selector ***/

function getData() {
  $('.filter-selection').attr('disabled','disabled').css('opacity', '0.5');

  loading = true;
  completed = 0;
  let comscore_geo = $('#comscore-geo').text().toLowerCase().trim();

  if (site_label === 'CBS Interactive') {
    $('#top-prop-index').parent().show();
  } else {
    $('#top-prop-index').parent().hide();
  }

  if (comscore_geo === 'uk') {
    $('#comp-user-overlap, #comp-index').parent().hide();
    $('.comp-spacer').hide();
  } else {
    $('#comp-user-overlap, #comp-index').parent().show();
    $('.comp-spacer').show();
  }
  /*** disable loading anything else until after this data has fully loaded ***/
  $('#site').addClass('disabled');
  $('#comscore-level>option').attr('disabled', true);
  $('#datepicker').data('DateTimePicker').disable();
  $('#getData').addClass('disabled');
  /*** ***/

  if ($.inArray(selected_site, non_adobe_sites) > -1) {
    $('.adobe').hide();
  } else {
    $('.adobe').show();
  }

  $('#comp-user-overlap svg').remove();
  

  $.getJSON(`api?site=${selected_site}&sd=${sd}&ed=${ed}&report_type=comscore&type=rollup&geo=${comscore_geo}`, function(data) {
    comscore_rollup = data.filter(d => {
      return !d.hasOwnProperty('platform') || d.platform === 'Multiplatform';
    });

    generateBigTextData('comscore-uvs',comscore_rollup,'visitors');

    let ql_uvs_by_platform_opts = buildChart({ chart_type: 'column', height: $('#comscore-uvs').height() })

    ql_uvs_by_platform_opts.yAxis.labels.formatter = function () {
      return this.value / 1000000 + 'M';
    }

    ql_uvs_by_platform_opts.xAxis = {
      labels: {
        enabled: false
      }
    };

    ql_uvs_by_platform_opts.lang = {
      'noData': selected_site === 'comicvine' ? not_supported_text : no_data_text
    };

    desktop_platforms = data.filter(d => {
      return d.hasOwnProperty('platform') && d.platform === 'Desktop';
    });

    /*** render an emtpy chart if comscore doesn't support it ***/
    if (desktop_platforms.length > 0 && desktop_platforms[desktop_platforms.length-1].date == moment(ed, 'YYYY-MM-DD').startOf('month').format('YYYY-MM-DD')) {
      let desktop_ly = desktop_platforms.length > 0 && desktop_platforms.find(d => d.date === moment(ed, 'YYYY-MM-DD').startOf('month').subtract(1,'year').format('YYYY-MM-DD')) !== undefined
        ? desktop_platforms.find(d => d.date === moment(ed, 'YYYY-MM-DD').startOf('month').subtract(1,'year').format('YYYY-MM-DD')).visitors
        : 'N/A';

      mobile_platforms = data.filter(d => {
        return d.hasOwnProperty('platform') && d.platform === 'Mobile';
      });

      let mobile_ly = mobile_platforms.length > 0 && mobile_platforms.find(d => d.date === moment(ed, 'YYYY-MM-DD').startOf('month').subtract(1,'year').format('YYYY-MM-DD')) !== undefined
        ? mobile_platforms.find(d => d.date === moment(ed, 'YYYY-MM-DD').startOf('month').subtract(1,'year').format('YYYY-MM-DD')).visitors
        : 'N/A';

      let mobile_data = mobile_platforms.length > 0 
        ? [{
            'dt': mobile_platforms.sort(compareValues('date'))[mobile_platforms.length-1].date,
            'best_month': moment(mobile_platforms.sort(compareValues('visitors'))[mobile_platforms.length-1].date, 'YYYY-MM-DD').format('MMM YYYY'),
            'best_month_val': mobile_platforms.sort(compareValues('visitors'))[mobile_platforms.length-1].visitors,
            'y': mobile_platforms.sort(compareValues('date'))[mobile_platforms.length-1].visitors,
            'ly': mobile_ly === undefined ? 'N/A' : mobile_ly
          }]
        : null;

      ql_uvs_by_platform_opts.series = [{
        'name': 'Desktop',
        data: [{
            'dt': desktop_platforms.sort(compareValues('date'))[desktop_platforms.length-1].date,
            'best_month': moment(desktop_platforms.sort(compareValues('visitors'))[desktop_platforms.length-1].date, 'YYYY-MM-DD').format('MMM YYYY'),
            'best_month_val': desktop_platforms.sort(compareValues('visitors'))[desktop_platforms.length-1].visitors,
            'y': desktop_platforms.sort(compareValues('date'))[desktop_platforms.length-1].visitors,
            'ly': desktop_ly === undefined ? 'N/A' : desktop_ly
          }],
      }, {
        'name': 'Mobile',
        data: mobile_data,
      }];
    }

    ql_uvs_by_platform_opts.tooltip = {
      formatter: function() {
        let total_visitors = comscore_rollup.find(d => { return d.date === this.point.dt });
        let yoy = ((this.y - this.point.ly) / this.point.ly) * 100;
        let yoy_class = yoy < 0 ? 'red' : 'green';
        let pct_total = (this.y / total_visitors.visitors) * 100;
        let tooltip = `<span style="font-size:14px;color:${this.color} !important;">${this.series.name}</span>
          <br /><span style="text-align:right;font-size:11px;">${addCommas(this.y)}</span>
          <br /><span style="font-size:10px;">Y/Y: </span><span style="font-size:10px;" class="${yoy_class}">${pct(yoy)}%</span>
          <br /><span style="font-size:10px;">Pct to total: </span><span style="font-size:10px;">${pct(pct_total)}%</span>
          <br /><br /><span style="font-size:11px;">Best Month</span>
          <br /><span style="text-align:right;font-size:10px;">${this.point.best_month} (${addCommas(this.point.best_month_val)})</span>`;
        return tooltip;
      },
      useHTML: true
    }

    ql_uvs_by_platform_opts.exporting.chartOptions.title.text = `${site_label} ${selected_geo} Visitors by Platform`;
    ql_uvs_by_platform_opts.exporting.chartOptions.subtitle.text = `Source: comScore - ${moment(ed, 'YYYY-MM-DD').format('MMM YYYY')}`;
    ql_uvs_by_platform_opts.exporting.chartOptions.yAxis = {
      'labels': {
        'style': { 'color': '#444F57' },
      },
    };
    charts['platform-uvs'] = new Highcharts.chart('platform-uvs', ql_uvs_by_platform_opts);
  }).done(function() { completed_check() });

  
  $.getJSON(`api?site=${selected_site}&sd=${sd}&ed=${ed}&report_type=comscore&type=gender&geo=${comscore_geo}`, function(data) {
    let ql_uvs_by_gender_opts = buildChart({
      chart_type: 'pie',
      height: $('#comscore-uvs').height(),
      marginLeft: 35,
      marginRight: 35,
      button_options: { 'column': true, 'pie': true }
    });

    ql_uvs_by_gender_opts.tooltip = {
      formatter: function() {
        let pct_total = (this.y / this.total) * 100;
        let yoy = ((this.y - this.point.ly) / this.point.ly) * 100;
        let yoy_class = yoy < 0 ? 'red' : 'green';
        let tooltip = `<span style="font-size:14px;color:${this.color}">${this.point.name}</span>
          <br /><span style="text-align:right;font-size:11px;">${addCommas(this.y)}</span>
          <br /><span style="font-size:10px;">Y/Y: </span><span style="font-size:10px;" class="${yoy_class}">${pct(yoy)}%</span>
          <br /><span style="text-align:right;font-size:10px;">Percent to total: ${pct(this.percentage)}%</span>
          <br /><br /><span style="font-size:11px;">Best Month</span>
          <br /><span style="text-align:right;font-size:10px;">${this.point.best_month} (${addCommas(this.point.best_month_val)})</span>
          <br /><br /><span style="font-size:10px;">Reach %: ${this.point.pct_reach}%</span>
          <br /><span style="font-size:10px;">Comp %: ${this.point.pct_comp}%</span>
          <br /><span style="font-size:10px;">Index: ${this.point.uv_index}</span>`;
        return tooltip;
      },
      useHTML: true
    }
    ql_uvs_by_gender_opts.lang = { 'noData': selected_site === 'comicvine' ? not_supported_text : no_data_text };
    
    males = data.filter(d => { return d.gender === 'Males' });

    if (males.length > 0 && males[males.length-1].date == moment(ed, 'YYYY-MM-DD').startOf('month').format('YYYY-MM-DD')) {
      males_ly = males.length > 0 && males.find(d => d.date === moment(ed, 'YYYY-MM-DD').startOf('month').subtract(1,'year').format('YYYY-MM-DD')) !== undefined
        ? males.find(d => d.date === moment(ed, 'YYYY-MM-DD').startOf('month').subtract(1,'year').format('YYYY-MM-DD')).visitors
        : 'N/A';
      let males_best_month = males.sort(compareValues('visitors'));

      females = data.filter(d => { return d.gender === 'Females' });
      females_ly = females.length > 0 && females.find(d => d.date === moment(ed, 'YYYY-MM-DD').startOf('month').subtract(1,'year').format('YYYY-MM-DD')) !== undefined
        ? females.find(d => d.date === moment(ed, 'YYYY-MM-DD').startOf('month').subtract(1,'year').format('YYYY-MM-DD')).visitors
        : 'N/A';
      let females_best_month = females.sort(compareValues('visitors'));
      ql_uvs_by_gender_opts.series = [{
        name: 'Genders',
        data: [{
            'name': 'Male',
            'best_month': moment(males_best_month[males_best_month.length-1].date, 'YYYY-MM-DD').format('MMM YYYY'),
            'best_month_val': males_best_month[males_best_month.length-1].visitors,
            'y': males.sort(compareValues('date'))[males.length-1].visitors,
            'ly': males_ly === undefined ? 'N/A' : males_ly,
            'pct_comp': pct(males.sort(compareValues('date'))[males.length-1].pct_comp),
            'uv_index': males.sort(compareValues('date'))[males.length-1].uv_index,
            'pct_reach': pct(males.sort(compareValues('date'))[males.length-1].pct_reach)
          }, {
            'name': 'Female',
            'best_month': moment(females_best_month[females_best_month.length-1].date, 'YYYY-MM-DD').format('MMM YYYY'),
            'best_month_val': females_best_month[females_best_month.length-1].visitors,
            'y': females.sort(compareValues('date'))[females.length-1].visitors,
            'ly': females_ly === undefined ? 'N/A' : females_ly,
            'pct_comp': pct(females.sort(compareValues('date'))[females.length-1].pct_comp),
            'uv_index': females.sort(compareValues('date'))[females.length-1].uv_index,
            'pct_reach': pct(females.sort(compareValues('date'))[females.length-1].pct_reach)
          }],
        size: '80%',
        innerSize: '70%',
        showInLegend: true,
        dataLabels: {
          enabled: true,
          color: '#DDD'
        }
      }];
    }

    ql_uvs_by_gender_opts.plotOptions.pie.dataLabels = {
      formatter: function() {
        return Math.round(this.percentage) + '%';
      },
      distance: -15
    }

    ql_uvs_by_gender_opts.exporting.chartOptions.title.text = `${site_label} ${selected_geo} Visitors by Gender`;
    ql_uvs_by_gender_opts.exporting.chartOptions.subtitle.text = `Source: comScore - ${moment(ed, 'YYYY-MM-DD').format('MMM YYYY')}`;
    ql_uvs_by_gender_opts.exporting.chartOptions.yAxis = {
      'labels': {
        'style': { 'color': '#444F57' },
      },
    };
    charts['gender'] = new Highcharts.chart('gender-uvs', ql_uvs_by_gender_opts);
  });

  
  $.getJSON(`api?site=${selected_site}&sd=${sd}&ed=${ed}&report_type=comscore&type=composition&geo=${comscore_geo}`, function(data) {
    composition_data = data;
    let age_groups_ty = data.filter(d => {
        return d.date === moment(ql_sd, 'YYYY-MM-DD').startOf('month').format('YYYY-MM-DD');
      });
    let age_groups_ly = data.filter(d => {
        return d.date === moment(ql_sd, 'YYYY-MM-DD').subtract(1, 'year').format('YYYY-MM-DD');
      });
    let age_group_options = buildChart({
      chart_type: 'column',
      height: 300,
      marginLeft: 35,
      marginRight: 35
    });
    age_group_options.xAxis = {
      labels: {
        enabled: false
      }
    };

    age_group_options.yAxis.labels.formatter = function () {
      return this.value / 1000000 + 'M';
    }

    age_group_options.tooltip = {
      formatter: function(d) {
        let ly = this.point.ly[0] === undefined ? 'N/A' : this.point.ly[0].visitors;
        let yoy = ((this.y-ly) / ly) * 100;
        let yoy_class = yoy < 0 ? 'red' : 'green';
        let best_month = this.point.best_month[this.point.best_month.length-1];
        let tip_text = `<b><span style="font-size:14px;color:${this.color}">${this.series.name}</span></b>
          <br /><span style="text-align:right;font-size:11px;">${addCommas(this.y)}</span>
          <br /><span style="font-size:10px;">Y/Y: </span><span style="font-size:10px;" class="${yoy_class}">${pct(yoy)}%</span>
          <br /><br /><span style="font-size:11px;">Best Month</span>
          <br /><span class="pull-right" style="text-align:right;font-size:10px;">${moment(best_month.date, 'YYYY-MM-DD').format('MMM YYYY')} (${addCommas(best_month.visitors)})</span>
          <br /><br /><span style="font-size:10px;">Reach %: ${this.point.pct_reach}%</span>
          <br /><span style="font-size:10px;">Comp %: ${this.point.pct_comp}%</span>
          <br /><span style="font-size:10px;">Index: ${this.point.uv_index}</span>`

        return tip_text;
      },
      useHTML: true
    }

    age_group_options.lang = { 'noData': selected_site === 'comicvine' ? not_supported_text : no_data_text };
  
    if (age_groups_ty.length > 0 && age_groups_ty[age_groups_ty.length-1].date == moment(ed, 'YYYY-MM-DD').startOf('month').format('YYYY-MM-DD')) {
      age_group_options.series = age_group_map.map(d => {
        return {
          name: d.label,
          data: age_groups_ty.filter(n => { return n.composition === d.key }).map(j => {
            return {
                y: j.visitors,
                best_month: data.filter(k => {
                  return (!k.hasOwnProperty('platform') || k.platform === 'Multiplatform')
                    && k.composition === d.key;
                  }).sort(compareValues('visitors')),
                ly: data.filter(k => {
                  return (!k.hasOwnProperty('platform') || k.platform === 'Multiplatform')
                    && k.date === moment(ql_sd, 'YYYY-MM-DD').subtract(1, 'year').startOf('month').format('YYYY-MM-DD')
                    && k.composition === d.key;
                  }) || 'N/A',
                pct_comp: pct(j.pct_comp),
                uv_index: j.uv_index,
                pct_reach: pct(j.pct_reach)
              };
          }),
        }
      });
    }

    age_group_options.exporting.chartOptions.title.text = `${site_label} ${selected_geo} Visitors by Age Group`;
    age_group_options.exporting.chartOptions.subtitle.text = `Source: comScore - ${moment(ed, 'YYYY-MM-DD').format('MMM YYYY')}`;
    age_group_options.exporting.chartOptions.yAxis = {
      'labels': {
        'style': { 'color': '#444F57' },
      },
    };
    charts['age-group-uvs'] = new Highcharts.chart('age-group-uvs', age_group_options);
  }).done(function() { completed_check() });


  $.getJSON(`api?site=${selected_site}&sd=${sd}&ed=${ed}&report_type=comscore&type=children&geo=${comscore_geo}`, function(data) {
    let children_chart_opts = buildChart({
      chart_type: 'pie',
      height: 300,
      marginLeft: 35,
      marginRight: 35
    });

    children_chart_opts.tooltip = {
      formatter: function() {
        let pct_total = (this.y / this.total) * 100;
        let yoy = ((this.y - this.point.ly) / this.point.ly) * 100;
        let yoy_class = yoy < 0 ? 'red' : 'green';
        let tooltip = `<span style="font-size:14px;color:${this.color}">${this.point.name}</span>
          <br /><span style="text-align:right;font-size:11px;">${addCommas(this.y)}</span>
          <br /><span style="font-size:10px;">Y/Y: </span><span style="font-size:10px;" class="${yoy_class}">${pct(yoy)}%</span>
          <br /><span style="text-align:right;font-size:10px;">Percent to total: ${pct(this.percentage)}%</span>
          <br /><br /><span style="font-size:11px;">Best Month</span>
          <br /><span style="text-align:right;font-size:10px;">${this.point.best_month} (${addCommas(this.point.best_month_val)})</span>
          <br /><br /><span style="font-size:10px;">Reach %: ${this.point.pct_reach}%</span>
          <br /><span style="font-size:10px;">Comp %: ${this.point.pct_comp}%</span>
          <br /><span style="font-size:10px;">Index: ${this.point.uv_index}</span>`;
        return tooltip;
      },
      useHTML: true
    }
    children_chart_opts.lang = { 'noData': selected_site === 'comicvine' ? not_supported_text : no_data_text };
    
    children = data.filter(d => { return d.children === 'Children' });

    if (children.length > 0 && children[children.length-1].date == moment(ed, 'YYYY-MM-DD').startOf('month').format('YYYY-MM-DD')) {
      children_ly = children.length > 0 && children.find(d => d.date === moment(ed, 'YYYY-MM-DD').startOf('month').subtract(1,'year').format('YYYY-MM-DD')) !== undefined
        ? children.find(d => d.date === moment(ed, 'YYYY-MM-DD').startOf('month').subtract(1,'year').format('YYYY-MM-DD')).visitors
        : 'N/A';
      let children_best_month = children.sort(compareValues('visitors'));
      no_children = data.filter(d => { return d.children === 'No Children' });
      no_children_ly = no_children.length > 0 && no_children.find(d => d.date === moment(ed, 'YYYY-MM-DD').startOf('month').subtract(1,'year').format('YYYY-MM-DD')) !== undefined
        ? no_children.find(d => d.date === moment(ed, 'YYYY-MM-DD').startOf('month').subtract(1,'year').format('YYYY-MM-DD')).visitors
        : 'N/A';
      let no_children_best_month = no_children.sort(compareValues('visitors'));

      children_chart_opts.series = [{
        name: 'Has Children',
        data: [{
            'name': 'Children',
            'best_month': moment(children_best_month[children_best_month.length-1].date, 'YYYY-MM-DD').format('MMM YYYY'),
            'best_month_val': children_best_month[children_best_month.length-1].visitors,
            'y': children.sort(compareValues('date'))[children.length-1].visitors,
            'ly': children_ly === undefined ? 'N/A' : children_ly,
            'pct_comp': pct(children.sort(compareValues('date'))[children.length-1].pct_comp),
            'uv_index': children.sort(compareValues('date'))[children.length-1].uv_index,
            'pct_reach': pct(children.sort(compareValues('date'))[children.length-1].pct_reach)
          }, {
            'name': 'No Children',
            'best_month': moment(no_children_best_month[no_children_best_month.length-1].date, 'YYYY-MM-DD').format('MMM YYYY'),
            'best_month_val': no_children_best_month[no_children_best_month.length-1].visitors,
            'y': no_children.sort(compareValues('date'))[no_children.length-1].visitors,
            'ly': no_children_ly === undefined ? 'N/A' : no_children_ly,
            'pct_comp': pct(no_children.sort(compareValues('date'))[no_children.length-1].pct_comp),
            'uv_index': no_children.sort(compareValues('date'))[no_children.length-1].uv_index,
            'pct_reach': pct(no_children.sort(compareValues('date'))[no_children.length-1].pct_reach)
          }],
        size: '80%',
        innerSize: '70%',
        showInLegend: true,
        dataLabels: {
          enabled: true,
          color: '#DDD'
        }
      }];
    }

    children_chart_opts.plotOptions.pie.dataLabels = {
      formatter: function() {
        return Math.round(this.percentage) + '%';
      },
      distance: -15
    }

    children_chart_opts.exporting.chartOptions.title.text = `${site_label} ${selected_geo} Children`;
    children_chart_opts.exporting.chartOptions.subtitle.text = `Source: comScore - ${moment(ed, 'YYYY-MM-DD').format('MMM YYYY')}`;
    children_chart_opts.exporting.chartOptions.yAxis = {
      'labels': {
        'style': { 'color': '#444F57' },
      },
    };
    charts['comscore-children'] = new Highcharts.chart('comscore-children', children_chart_opts);
  });


  $.getJSON(`api?site=${selected_site}&sd=${sd}&ed=${ed}&report_type=comscore&type=income&geo=${comscore_geo}`, function(data) {
    income_data = data;
    let income_ty = data.filter(d => {
        return d.date === moment(ql_sd, 'YYYY-MM-DD').startOf('month').format('YYYY-MM-DD');
      });
    let income_ly = data.filter(d => {
        return d.date === moment(ql_sd, 'YYYY-MM-DD').subtract(1, 'year').format('YYYY-MM-DD');
      });
    let income_options = buildChart({
      chart_type: 'column',
      height: 300
    });
    income_options.xAxis = {
      labels: {
        enabled: false
      }
    };
    income_options.yAxis.labels.formatter = function () {
      return this.value / 1000000 + 'M';
    }

    income_options.tooltip = {
      formatter: function(d) {
        let ly = this.point.ly[0] === undefined ? 'N/A' : this.point.ly[0].visitors;
        let yoy = ((this.y-ly) / ly) * 100;
        let yoy_class = yoy < 0 ? 'red' : 'green';
        let best_month = this.point.best_month[this.point.best_month.length-1];
        let tip_text = `<b><span style="font-size:14px;color:${this.color}">${this.series.name}</span></b>
          <br /><span style="text-align:right;font-size:11px;">${addCommas(this.y)}</span>
          <br /><span style="font-size:10px;">Y/Y: </span><span style="font-size:10px;" class="${yoy_class}">${pct(yoy)}%</span>
          <br /><br /><span style="font-size:11px;">Best Month</span>
          <br /><span class="pull-right" style="text-align:right;font-size:10px;">${moment(best_month.date, 'YYYY-MM-DD').format('MMM YYYY')} (${addCommas(best_month.visitors)})</span>
          <br /><br /><span style="font-size:10px;">Reach %: ${this.point.pct_reach}%</span>
          <br /><span style="font-size:10px;">Comp %: ${this.point.pct_comp}%</span>
          <br /><span style="font-size:10px;">Index: ${this.point.uv_index}</span>`

        return tip_text;
      },
      useHTML: true
    }

    income_options.lang = { 'noData': selected_site === 'comicvine' ? not_supported_text : no_data_text };
    income_options.exporting.chartOptions.subtitle.text = `Source: comScore - ${moment(ed, 'YYYY-MM-DD').format('MMM YYYY')}`;

    if (income_ty.length > 0 && income_ty[income_ty.length-1].date == moment(ed, 'YYYY-MM-DD').startOf('month').format('YYYY-MM-DD')) {
      $('#comscore-income').parent().show();
      income_options.series = income_map.map(d => {
        return {
          name: d,
          data: income_ty.filter(n => { return n.income === d }).map(j => {
            return {
                y: j.visitors,
                best_month: data.filter(k => {
                  return (!k.hasOwnProperty('platform') || k.platform === 'Multiplatform')
                    && k.income === d;
                  }).sort(compareValues('visitors')),
                ly: data.filter(k => {
                  return (!k.hasOwnProperty('platform') || k.platform === 'Multiplatform')
                    && k.date === moment(ql_sd, 'YYYY-MM-DD').subtract(1, 'year').startOf('month').format('YYYY-MM-DD')
                    && k.income === d;
                  }) || 'N/A',
                pct_comp: pct(j.pct_comp),
                uv_index: j.uv_index,
                pct_reach: pct(j.pct_reach)
              };
          }),
        }
      });
    } else {
      $('#comscore-income').parent().hide();
    }

    income_options.exporting.chartOptions.title.text = `${site_label} ${selected_geo} Income`;
    income_options.exporting.chartOptions.subtitle.text = `Source: comScore - ${moment(ed, 'YYYY-MM-DD').format('MMM YYYY')}`;
    income_options.exporting.chartOptions.yAxis = {
      'labels': {
        'style': { 'color': '#444F57' },
      },
    };
    charts['comscore-income'] = new Highcharts.chart('comscore-income', income_options);
  }).done(function() { completed_check() });


  $.getJSON(`api?site=${selected_site}&sd=${sd}&ed=${ed}&report_type=front_door&geo=${comscore_geo}`, function(data) {
    generateBigTextData('avg-daily-fd-users',data,'avg_visitors');
  }).done(function() { completed_check() });


  /*** US Edition Front Door Users only ***/
  let us_fd_sd = moment(ed, 'YYYY-MM-DD').startOf('month').format('YYYY-MM-DD');

  $.getJSON(`api?site=${selected_site}&sd=${us_fd_sd}&ed=${ed}&report_type=front_door_us&geo=${comscore_geo}`, function(data) {
    data.forEach(d => {
      d.dow = moment(d.date, 'YYYY-MM-DD').format('dddd')
    });

    let us_fd_chart_options = buildChart({
      chart_type: 'column',
      height: 300
    });

    // let us_fd_chart_options = buildChart('column', { 'line': true, 'column': true, 'default': 'column'});
    us_fd_chart_options.xAxis.categories = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    us_fd_chart_options.yAxis.labels.enabled = false;
    us_fd_chart_options.legend.enabled = false;
    us_fd_chart_options.tooltip = {
      formatter: function(d) {
        return `<span class="pull-right" style="color:${this.color}">${this.x}</span>
          <br />
          <span class="pull-right">${addCommas(this.y)}</span>`;
      },
      useHTML: true,
      crosshairs: true,
      followPointer: true,
      enabled: false
    }
    us_fd_chart_options.lang = { 'noData': no_data_text };

    if (selected_site === 'gamespot') {
      games_bundle = data.filter(d => {
        if (d.selected_site !== 'metacritic') return d;
      }).reduce((acc,cur) => {
        if (!acc[cur.dow])
          acc[cur.dow] = 0;
        acc[cur.dow] += cur.visitors;
        return acc;
      }, {});

      games_metacritic_bundle = data.reduce((acc,cur) => {
        if (!acc[cur.dow])
          acc[cur.dow] = 0;
        acc[cur.dow] += cur.visitors;
        return acc;
      }, {});

      us_fd_chart_options.series = [{
        name: 'CBSi Games Bundle',
        data: [
          Math.round(games_bundle.Monday/14),
          Math.round(games_bundle.Tuesday/14),
          Math.round(games_bundle.Wednesday/14),
          Math.round(games_bundle.Thursday/14),
          Math.round(games_bundle.Friday/14),
          Math.round(games_bundle.Saturday/14),
          Math.round(games_bundle.Sunday/14)
        ]
      }, {
        name: 'CBSi Games Bundle w/ Metacritic',
        data: [
          Math.round(games_metacritic_bundle.Monday/14),
          Math.round(games_metacritic_bundle.Tuesday/14),
          Math.round(games_metacritic_bundle.Wednesday/14),
          Math.round(games_metacritic_bundle.Thursday/14),
          Math.round(games_metacritic_bundle.Friday/14),
          Math.round(games_metacritic_bundle.Saturday/14),
          Math.round(games_metacritic_bundle.Sunday/14)
        ]
      }];

      us_fd_chart_options.legend.enabled = true;
      us_fd_chart_options.tooltip.shared = true;
      us_fd_chart_options.tooltip.formatter = function(d) {
        let tip_text = `<b><span class="pull-right"><i>${this.x}</i></span></b>
          <br /><br />`;

        this.points.forEach(d => {
          tip_text += `<span class="pull-right"><span style="color:${d.color}">${d.series.name}</span>: ${addCommas(d.y)}</span><br />`;
        });

        return tip_text;
      }
    } else {
      let dow_counts = {
        'Monday': 0,
        'Tuesday': 0,
        'Wednesday': 0,
        'Thursday': 0,
        'Friday': 0,
        'Saturday': 0,
        'Sunday': 0,
      }

      let dow_data = data.reduce((acc,cur) => {
        if (!acc[cur.dow])
          acc[cur.dow] = 0;
        acc[cur.dow] += cur.visitors;
        dow_counts[cur.dow] += 1;
        return acc;
      }, {});

      let dow_chart_series = [
        Math.round(dow_data.Monday/dow_counts['Monday']),
        Math.round(dow_data.Tuesday/dow_counts['Tuesday']),
        Math.round(dow_data.Wednesday/dow_counts['Wednesday']),
        Math.round(dow_data.Thursday/dow_counts['Thursday']),
        Math.round(dow_data.Friday/dow_counts['Friday']),
        Math.round(dow_data.Saturday/dow_counts['Saturday']),
        Math.round(dow_data.Sunday/dow_counts['Sunday'])
      ];

      us_fd_chart_options.series = [{
        data: dow_chart_series
      }];
    }

    us_fd_chart_options.exporting.chartOptions.title.text = `${site_label} US Average Front Door Day of Week Visitor Trend`;
    us_fd_chart_options.exporting.chartOptions.subtitle.text = `Source: Adobe Analytics - ${moment(ed, 'YYYY-MM-DD').format('MMM YYYY')}`;
    us_fd_chart_options.exporting.chartOptions.yAxis = {
      'labels': {
        'style': { 'color': '#444F57' },
      },
    };
    charts['avg-dow-fd-users'] = new Highcharts.chart('avg-dow-fd-users', us_fd_chart_options);
  }).done(function() { completed_check() });


  $.getJSON(`api?site=${selected_site}&sd=${sd}&ed=${ed}&report_type=referrers&geo=${comscore_geo}`, function(data) {
    let valid_referrers = ['Search Engines','Typed/Bookmarked','Other Web Sites','Social Networks',
                          'USENET (newsgroups)','Email'];

    let monthly_totals = [...new Set(data.reduce((res, value) => {
      return [...res, value.date];
    }, []))].reduce((r,v) => {
      let month_total = data.filter(x => {
        return x.date === v;
      }).reduce((res, val) => {
        return res + val.visits;
      }, 0);

      r[v] = month_total;
      return r;
    }, {});

    data.forEach(d => {
      d.pct = (d.visits/monthly_totals[d.date])*100;
    });

    let referrers_ty = data.filter(d => {
        return d.date === moment(ql_sd, 'YYYY-MM-DD').startOf('month').format('YYYY-MM-DD');
      });

    let referrers_ly = data.filter(d => {
        return d.date === moment(ql_sd, 'YYYY-MM-DD').subtract(1, 'year').format('YYYY-MM-DD');
      });

    let referrer_options = buildChart({
      chart_type: 'column',
      height: 300
    });

    referrer_options.chart.height = 300;
    referrer_options.xAxis = {
      labels: {
        enabled: false
      }
    };

    referrer_options.yAxis.min = 0;
    referrer_options.yAxis.max = 100;
    referrer_options.yAxis.labels = {
      formatter: function() {
        return `${this.value}%`;
      }
    }

    referrer_options.tooltip = {
      formatter: function(d) {
        let ly = this.point.ly[0] === undefined ? 'N/A' : this.point.ly[0].visits;
        let yoy = ((this.y-ly) / ly) * 100;
        let yoy_class = yoy < 0 ? 'red' : 'green';
        let best_month = this.point.best_month[this.point.best_month.length-1];
        let yoy_text = '';
        if ($.inArray(selected_site, ['cbsnews','cbssports.com','247sports','maxpreps','cbs']) === -1) {
          yoy_text = `<br /><span style="font-size:10px;">Y/Y: </span><span style="font-size:10px;" class="${yoy_class}">${pct(yoy)}%</span>`;
        }
        let tip_text = `<b><span style="font-size:14px;color:${this.color}">${this.series.name}</span></b>
          <br /><span style="text-align:right;font-size:11px;font-weight:strong;">${pct(this.point.percentage)}%</span>
          ${yoy_text}
          <br /><br /><span style="font-size:11px;">Best Month</span>
          <br /><span class="pull-right" style="text-align:right;font-size:10px;">${moment(best_month.date, 'YYYY-MM-DD').format('MMM YYYY')} (${pct(best_month.pct)}%)</span>`

        return tip_text;
      },
      useHTML: true
    }

    referrer_options.lang = { 'noData': no_data_text };

    referrer_options.plotOptions.column = {
      stacking: 'percent'
    }

    referrer_options.plotOptions.series.events = {
      legendItemClick: function() {
        return false;
      }
    }

    if (referrers_ty.length > 0) {
      referrer_options.series = valid_referrers.map(d => {
        return {
          name: d,
          data: referrers_ty.filter(n => { return n.referrer_type === d }).map(j => {
            return {
                y: j.visits,
                best_month: data.filter(k => {
                  return (!k.hasOwnProperty('platform') || k.platform === 'Multiplatform')
                    && k.referrer_type === d;
                  }).sort(compareValues('pct')),
                ly: data.filter(k => {
                  return (!k.hasOwnProperty('platform') || k.platform === 'Multiplatform')
                    && k.date === moment(ql_sd, 'YYYY-MM-DD').subtract(1, 'year').startOf('month').format('YYYY-MM-DD')
                    && k.referrer_type === d;
                  }) || 'N/A',
              };
          }),
        }
      });
    }
    referrer_options.exporting.chartOptions.title.text = `${site_label} Visits by Referrer Type`;
    referrer_options.exporting.chartOptions.subtitle.text = `Source: Adobe Analytics - ${moment(ed, 'YYYY-MM-DD').format('MMM YYYY')}`;
    referrer_options.exporting.chartOptions.yAxis = {
      'labels': {
        'style': { 'color': '#444F57' },
      },
    };
    charts['referrers-chart'] = new Highcharts.chart('referrers-chart', referrer_options);
  }).done(function() { completed_check() });


  $.getJSON(`api?site=${selected_site}&sd=${sd}&ed=${ed}&report_type=new_vs_repeat&geo=${comscore_geo}`, function(data) {
    let new_repeat_opts = buildChart({
      chart_type: 'pie',
      height: 300,
      marginLeft: 35,
      marginRight: 35
    });
    new_repeat_opts.tooltip = {
      formatter: function() {
        let pct_total = (this.y / this.total) * 100;
        let yoy = ((this.y - this.point.ly) / this.point.ly) * 100;
        let yoy_class = yoy < 0 ? 'red' : 'green';
        let yoy_text = '';
        if ($.inArray(selected_site, ['cbsnews','cbssports.com','247sports','maxpreps','cbs']) === -1) {
          yoy_text = `<br /><span style="font-size:10px;">Y/Y: </span><span style="font-size:10px;" class="${yoy_class}">${pct(yoy)}%</span>`;
        }

        let tooltip = `<span style="font-size:14px;color:${this.color}">${this.point.name}</span>
          <br /><span style="text-align:right;font-size:11px;">${addCommas(this.y)}</span>
          ${yoy_text}
          <br /><span style="text-align:right;font-size:10px;">Percent to total: ${pct(this.percentage)}%</span>
          <br /><br /><span style="font-size:11px;">Best Month</span>
          <br /><span style="text-align:right;font-size:10px;">${this.point.best_month} (${addCommas(this.point.best_month_val)})</span>`;
        return tooltip;
      },
      useHTML: true
    }
    new_repeat_opts.lang = { 'noData': no_data_text };
    
    new_visitors = data.filter(d => { return d.user_type === 'New' });

    if (new_visitors.length > 0) {
      new_visitors_ly = new_visitors.length > 0 && new_visitors.find(d => d.date === moment(ed, 'YYYY-MM-DD').startOf('month').subtract(1,'year').format('YYYY-MM-DD')) !== undefined
        ? new_visitors.find(d => d.date === moment(ed, 'YYYY-MM-DD').startOf('month').subtract(1,'year').format('YYYY-MM-DD')).visitors
        : 'N/A';
      let new_visitors_best_month = new_visitors.sort(compareValues('visitors'));
      repeat_visitors = data.filter(d => { return d.user_type === 'Repeat' });
      repeat_visitors_ly = repeat_visitors.length > 0 && repeat_visitors.find(d => d.date === moment(ed, 'YYYY-MM-DD').startOf('month').subtract(1,'year').format('YYYY-MM-DD')) !== undefined
        ? repeat_visitors.find(d => d.date === moment(ed, 'YYYY-MM-DD').startOf('month').subtract(1,'year').format('YYYY-MM-DD')).visitors
        : 'N/A';
      let repeat_visitors_best_month = repeat_visitors.sort(compareValues('visitors'));
      new_repeat_opts.series = [{
        name: 'New vs Repeat Visitors',
        data: [{
            'name': 'New',
            'best_month': moment(new_visitors_best_month[new_visitors_best_month.length-1].date, 'YYYY-MM-DD').format('MMM YYYY'),
            'best_month_val': new_visitors_best_month[new_visitors_best_month.length-1].visitors,
            'y': new_visitors.sort(compareValues('date'))[new_visitors.length-1].visitors,
            'ly': new_visitors_ly === undefined ? 'N/A' : new_visitors_ly,
          }, {
            'name': 'Repeat',
            'best_month': moment(repeat_visitors_best_month[repeat_visitors_best_month.length-1].date, 'YYYY-MM-DD').format('MMM YYYY'),
            'best_month_val': repeat_visitors_best_month[repeat_visitors_best_month.length-1].visitors,
            'y': repeat_visitors.sort(compareValues('date'))[repeat_visitors.length-1].visitors,
            'ly': repeat_visitors_ly === undefined ? 'N/A' : repeat_visitors_ly,
          }],
        size: '80%',
        innerSize: '70%',
        showInLegend: true,
        dataLabels: {
          enabled: true,
          color: '#DDD'
        }
      }];
    }

    new_repeat_opts.plotOptions.pie.dataLabels = {
      formatter: function() {
        return Math.round(this.percentage) + '%';
      },
      distance: -15
    }

    new_repeat_opts.exporting.chartOptions.title.text = `${site_label} New vs Repeat Visitors`;
    new_repeat_opts.exporting.chartOptions.subtitle.text = `Source: Adobe Analytics - ${moment(ed, 'YYYY-MM-DD').format('MMM YYYY')}`;
    new_repeat_opts.exporting.chartOptions.yAxis = {
      'labels': {
        'style': { 'color': '#444F57' },
      },
    };
    charts['new-vs-return-chart'] = new Highcharts.chart('new-vs-return-chart', new_repeat_opts);
  }).done(function() { completed_check() });


  $.getJSON(`api?site=${selected_site}&sd=${sd}&ed=${ed}&report_type=countries`, function(data) {
    let ty = [];
    let ly = [];
    all_data = data;
    uvs_totals = all_data.reduce((acc, cur) => {
      let dt = cur.date;
      if (!acc[dt])
        acc[dt] = 0;
      acc[dt] += cur.visitors;
      return acc;
    }, {});

    pvs_totals = all_data.reduce((acc, cur) => {
      let dt = cur.date;
      if (!acc[dt])
        acc[dt] = 0;
      acc[dt] += cur.pageviews;
      return acc;
    }, {});

    visits_totals = all_data.reduce((acc, cur) => {
      let dt = cur.date;
      if (!acc[dt])
        acc[dt] = 0;
      acc[dt] += cur.visits;
      return acc;
    }, {});

    // same month last year data
    data.filter(function(d) {
      return d.date === moment(ql_sd, 'YYYY-MM-DD').startOf('month').subtract(1,'year').format('YYYY-MM-DD');
    })
    .forEach(function(d,i) {
      d.country_cd = countries.find(function(country) { return country.Name === d.country }).Code;
      d.value = d.visitors;
      d.bounce_rate = (d.bounces / d.entries) * 100;
      ly.push(d);
    });

    // selected month data
    data.filter(function(d) {
      return d.date === moment(ed, 'YYYY-MM-DD').startOf('month').format('YYYY-MM-DD');
    })
    .forEach(function(d,i) {
      if(d.visitors !== 0) {
        let country_test = countries.find(function(country) { return country.Name === d.country });
        if (!country_test) console.log(d.country);
        d.country_cd = countries.find(function(country) { return country.Name === d.country }).Code;
        d.value = d.visitors;
        d.bounce_rate = (d.bounces / d.entries) * 100;
        let country_ly = ly.find(d_ly => d_ly.country === d.country);

        d.visitors_ly = country_ly === undefined ? 0 : country_ly.visitors;
        d.pageviews_ly = country_ly === undefined ? 0 : country_ly.pageviews;
        d.visits_ly = country_ly === undefined ? 0 : country_ly.visits;
        d.bounce_rate_ly = country_ly === undefined ? 0 : country_ly.bounce_rate;
        ty.push(d);
      }
    });

    let world_map_options = buildChart({
      chart_type: 'map',
      height: 600
    });

    world_map_options.subtitle = {
      text: '* Coloration based on Visitors metric using logarithmic scale',
      style: { 'color': '#DDD', 'font-size': '9px' },
      align: 'left'
    };
    world_map_options.colorAxis = {
      min: Math.min.apply(Math,ty.map(function(o){return o.value;})),
      max: Math.max.apply(Math,ty.map(function(o){return o.value;})),
      type: 'logarithmic',
      minColor: '#BFCDD6',
      maxColor: '#1769A0',
      labels: {
        'style': { 'color': '#FFF', 'cursor': 'default', 'fontSize': '10px' }
      }
    },
    world_map_options.series = [{
      mapData: Highcharts.maps['custom/world'],
      joinBy: ['iso-a2', 'country_cd'],
      data: ty,
      allowPointSelect: false,
      states: {
        hover: {
          color: '#BB6B1B'
        },
        select: {
          color: '#44AA66',
          borderColor: 'black',
          dashStyle: 'shortdot'
        }
      },
      color: '#0088bb'
    }];
    world_map_options.plotOptions = {
      series: {
        point: {
          events: {
            click: function() {
              return false;
            }
          }
        }
      }
    }
    world_map_options.tooltip = {
      formatter: function(d) {
        let dt = moment(this.point.date, 'YYYY-MM-DD').format('MMMM YYYY');
        let uvs_pct_total = (this.point.visitors / uvs_totals[this.point.date]) * 100;
        let pvs_pct_total = (this.point.pageviews / pvs_totals[this.point.date]) * 100;
        let visits_pct_total = (this.point.visits / visits_totals[this.point.date]) * 100;

        let uvs_yoy = ((this.point.visitors - this.point.visitors_ly) / this.point.visitors_ly) * 100;
        let pvs_yoy = ((this.point.pageviews - this.point.pageviews_ly) / this.point.pageviews_ly) * 100;
        let visits_yoy = ((this.point.visits - this.point.visits_ly) / this.point.visits_ly) * 100;
        let br_yoy = ((this.point.bounce_rate - this.point.bounce_rate_ly) / this.point.bounce_rate_ly) * 100;

        let yoy_text = '';
        if ($.inArray(selected_site, ['cbsnews','cbssports.com','247sports','maxpreps','cbs']) === -1) {
          yoy_text = `<br /><span style="font-size:10px" class="${negPos(uvs_yoy)}">${pct(uvs_yoy)}% Y/Y</span>`;
        }

        return `
          <h6>${dt} Visitors</h6>
          <span>${this.point.name}</span><br />
          <strong>${addCommas(this.point.visitors)}</strong>
          <br />
          <br />
          <i>${pct(uvs_pct_total)}% Pct of Total</i>
          ${yoy_text}
          `;
      },
      useHTML: true,
      crosshairs: false,
      followPointer: true
    }
    
    world_map_options.exporting.chartOptions.title.text = `${site_label} Traffic Metrics by Country`;
    world_map_options.exporting.chartOptions.yAxis = {
      'labels': {
        'style': { 'color': '#444F57' },
      },
    };
    charts['map-chart'] = Highcharts.mapChart('map-chart', world_map_options);

    // generate region data
    let uk = ty.filter(d => {
      return d.country_cd === 'GB';
    });

    let uk_ly = ly.filter(d => {
      return d.country_cd === 'GB';
    });

    let india = ty.filter(d => {
      return d.country_cd === 'IN';
    });

    let india_ly = ly.filter(d => {
      return d.country_cd === 'IN';
    });

    let hk_tw = ty.filter(d => {
      if ($.inArray(d.country_cd, hk_tw_lu) > -1) return d;
    }).reduce((acc,cur) => {
      return {
        'visitors': acc.visitors + cur.visitors,
        'visits': acc.visits + cur.visits,
        'pageviews': acc.pageviews + cur.pageviews 
      }
    }, { 'visitors': 0, 'visits': 0, 'pageviews': 0 });

    let hk_tw_ly = ly.filter(d => {
      if ($.inArray(d.country_cd, hk_tw_lu) > -1) return d;
    }).reduce((acc,cur) => {
      return {
        'visitors': acc.visitors + cur.visitors,
        'visits': acc.visits + cur.visits,
        'pageviews': acc.pageviews + cur.pageviews 
      }
    }, { 'visitors': 0, 'visits': 0, 'pageviews': 0 });

    let emea = ty.filter(d => {
      if ($.inArray(d.country_cd, emea_lu) > -1) return d;
    }).reduce((acc,cur) => {
      return {
        'visitors': acc.visitors + cur.visitors,
        'visits': acc.visits + cur.visits,
        'pageviews': acc.pageviews + cur.pageviews 
      }
    }, { 'visitors': 0, 'visits': 0, 'pageviews': 0 });

    let emea_ly = ly.filter(d => {
      if ($.inArray(d.country_cd, emea_lu) > -1) return d;
    }).reduce((acc,cur) => {
      return {
        'visitors': acc.visitors + cur.visitors,
        'visits': acc.visits + cur.visits,
        'pageviews': acc.pageviews + cur.pageviews 
      }
    }, { 'visitors': 0, 'visits': 0, 'pageviews': 0 });

    let emea_minus_uk = ty.filter(d => {
      if ($.inArray(d.country_cd, emea_minus_uk_lu) > -1) return d;
    }).reduce((acc,cur) => {
      return {
        'visitors': acc.visitors + cur.visitors,
        'visits': acc.visits + cur.visits,
        'pageviews': acc.pageviews + cur.pageviews 
      }
    }, { 'visitors': 0, 'visits': 0, 'pageviews': 0 });

    let emea_minus_uk_ly = ly.filter(d => {
      if ($.inArray(d.country_cd, emea_minus_uk_lu) > -1) return d;
    }).reduce((acc,cur) => {
      return {
        'visitors': acc.visitors + cur.visitors,
        'visits': acc.visits + cur.visits,
        'pageviews': acc.pageviews + cur.pageviews 
      }
    }, { 'visitors': 0, 'visits': 0, 'pageviews': 0 });

    let sea = ty.filter(d => {
      if ($.inArray(d.country_cd, sea_lu) > -1) return d;
    }).reduce((acc,cur) => {
      return {
        'visitors': acc.visitors + cur.visitors,
        'visits': acc.visits + cur.visits,
        'pageviews': acc.pageviews + cur.pageviews 
      }
    }, { 'visitors': 0, 'visits': 0, 'pageviews': 0 });

    let sea_ly = ly.filter(d => {
      if ($.inArray(d.country_cd, sea_lu) > -1) return d;
    }).reduce((acc,cur) => {
      return {
        'visitors': acc.visitors + cur.visitors,
        'visits': acc.visits + cur.visits,
        'pageviews': acc.pageviews + cur.pageviews 
      }
    }, { 'visitors': 0, 'visits': 0, 'pageviews': 0 });

    let lat_am = ty.filter(d => {
      if ($.inArray(d.country_cd, lat_am_lu) > -1) return d;
    }).reduce((acc,cur) => {
      return {
        'visitors': acc.visitors + cur.visitors,
        'visits': acc.visits + cur.visits,
        'pageviews': acc.pageviews + cur.pageviews 
      }
    }, { 'visitors': 0, 'visits': 0, 'pageviews': 0 });

    let lat_am_ly = ly.filter(d => {
      if ($.inArray(d.country_cd, lat_am_lu) > -1) return d;
    }).reduce((acc,cur) => {
      return {
        'visitors': acc.visitors + cur.visitors,
        'visits': acc.visits + cur.visits,
        'pageviews': acc.pageviews + cur.pageviews 
      }
    }, { 'visitors': 0, 'visits': 0, 'pageviews': 0 });

    let au_na = ty.filter(d => {
      if ($.inArray(d.country_cd, au_na_lu) > -1) return d;
    }).reduce((acc,cur) => {
      return {
        'visitors': acc.visitors + cur.visitors,
        'visits': acc.visits + cur.visits,
        'pageviews': acc.pageviews + cur.pageviews 
      }
    }, { 'visitors': 0, 'visits': 0, 'pageviews': 0 });

    let au_na_ly = ly.filter(d => {
      if ($.inArray(d.country_cd, au_na_lu) > -1) return d;
    }).reduce((acc,cur) => {
      return {
        'visitors': acc.visitors + cur.visitors,
        'visits': acc.visits + cur.visits,
        'pageviews': acc.pageviews + cur.pageviews 
      }
    }, { 'visitors': 0, 'visits': 0, 'pageviews': 0 });

    let apac = ty.filter(d => {
      if ($.inArray(d.country_cd, apac_lu) > -1) return d;
    }).reduce((acc,cur) => {
      return {
        'visitors': acc.visitors + cur.visitors,
        'visits': acc.visits + cur.visits,
        'pageviews': acc.pageviews + cur.pageviews 
      }
    }, { 'visitors': 0, 'visits': 0, 'pageviews': 0 });

    let apac_ly = ly.filter(d => {
      if ($.inArray(d.country_cd, apac_lu) > -1) return d;
    }).reduce((acc,cur) => {
      return {
        'visitors': acc.visitors + cur.visitors,
        'visits': acc.visits + cur.visits,
        'pageviews': acc.pageviews + cur.pageviews 
      }
    }, { 'visitors': 0, 'visits': 0, 'pageviews': 0 });

    if ($.inArray(selected_site, non_adobe_sites) === -1) {
      generateRegionTable(uk[0],uk_ly[0],'UK','first');
      generateRegionTable(india[0],india_ly[0],'India','');
      generateRegionTable(hk_tw,hk_tw_ly,'Hong Kong & Taiwan','');
      generateRegionTable(emea,emea_ly,'EMEA','');
      generateRegionTable(emea_minus_uk,emea_minus_uk_ly,'EMEA Minus UK','');
      generateRegionTable(sea,sea_ly,'SEA','');
      generateRegionTable(lat_am,lat_am_ly,'Latin America','');
      generateRegionTable(au_na,au_na_ly,'Australia & New Zealand','');
      generateRegionTable(apac,apac_ly,'APAC','last');
      generateTable(ty);

      $('.dt-button').addClass('btn btn-sm btn-secondary').removeClass('dt-button');
      $('.dt-buttons').css('margin-bottom', '.5rem');
    }
  }).done(function() { completed_check() });


  let selected_comp_site = selected_site;
  $.getJSON(`api?site=${selected_comp_site}&sd=${sd}&ed=${ed}&report_type=comscore&type=cross_visit&geo=${comscore_geo}`, function(data) {
    cross_visit_data = data;

    $('#comp-user-overlap').parent().hide();
    $('.comp-spacer').hide();

    if (cross_visit_data.length > 0) {
      let selected_month = data.filter(function(d) {
        return d.date === moment(ed, 'YYYY-MM-DD').startOf('month').format('YYYY-MM-DD');
      })[0];

      if (selected_month) {
        d3.select('#comp-user-overlap').datum(selected_month.cross_visit).call(cross_visit_chart);
        $('#comp-user-overlap').parent().show();
        $('.comp-spacer').show();
      } else {
        d3.select('#comp-user-overlap').datum([]).call(cross_visit_chart);
      }
      venn_chart_options();
    } else {
      let no_data = $.inArray(selected_site, cross_visit_sites) === -1 ? not_supported_text : no_data_text;
      $('#comp-user-overlap svg').remove();
      $('#comp-user-overlap').html(`<svg style="font-family:"Lucida Grande", "Lucida Sans Unicode", Arial, Helvetica, sans-serif;font-size:12px;" width="690" height="300" viewBox="0 0 690 300">
          <defs><clipPath id="highcharts-0nq0yeq-19"><rect x="0" y="0" width="620" height="285" fill="none"></rect></clipPath></defs>
          <rect fill="#ffffff" class="highcharts-background" x="0" y="0" width="690" height="300" rx="0" ry="0"></rect>
          <rect fill="none" class="highcharts-plot-background" x="35" y="0" width="620" height="285"></rect>
          <g class="highcharts-label highcharts-no-data" style="align:center;vertical-align:middle;" transform="translate(210,133)">
          <text x="3" style="font-size:12px;font-weight:bold;color:#DDD;fill:#DDD;" y="15"><tspan>${no_data}</tspan></text></g></svg>`)
    }
  }).done(function() { completed_check() });

  $.getJSON(`api?site=${selected_comp_site}&sd=${sd}&ed=${ed}&report_type=comscore&type=competitors&geo=${comscore_geo}`, function(data) {
    data.forEach(d => {
      d.label = d.label === 'CNET Rollup (zdnet)' ? 'CNET Rollup' : d.label;
    });

    let comp_index_options = buildChart({
      chart_type: 'column',
      height: 300
    });

    comp_index_options.xAxis = {
      type: 'datetime',
      labels: {
        enabled: false
      }
    };
    comp_index_options.yAxis = [{
      labels: {
        formatter: function () {
          return this.axis.defaultLabelFormatter.call(this);
        },
        style: {
          color: '#444F57'
        }
      },
      title: {
        text: ''
      }
    }];
    comp_index_options.tooltip = {
      formatter: function() {
        let this_series_vals = data.filter(d => {
          return d.label === this.series.name;
        }).sort(compareValues('visitors'));
        let best_month = this_series_vals[this_series_vals.length-1];
        let ly_date = moment(ed, 'YYYY-MM-DD').startOf('month').subtract(1, 'year').startOf('month').format('YYYY-MM-DD');
        let ly = data.filter(d => {
          if (d.date === ly_date && d.label === this.series.name) return d;
        });
        let yoy = ly.length >= 1 ? ((this.y-ly[0].visitors) / ly[0].visitors) * 100 : 'N/A';
        let yoy_class = yoy < 0 ? 'red' : 'green';
        let series_name = this.series.name.length > 15 ? `${this.series.name.substring(0,15)}...` : this.series.name
        let tip_text = `<b><span style="font-size:14px;color:${this.color};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100px;">${series_name}</span></b>
          <br /><span style="text-align:right;font-size:11px;">${addCommas(this.y)}</span>
          <br /><span style="font-size:10px;">Y/Y: </span><span style="font-size:10px;" class="${yoy_class}">${pct(yoy)}%</span>
          <br /><br /><span style="font-size:11px;">Best Month</span>
          <br /><span class="pull-right" style="text-align:right;font-size:10px;">${moment(best_month.date, 'YYYY-MM-DD').format('MMM YYYY')} (${addCommas(best_month.visitors)})</span>
          `;

        return tip_text;
      },
      useHTML: true,
      followPointer: true
    }
    comp_index_options.lang = {
      'noData': $.inArray(selected_site, cross_visit_sites) === -1 ? not_supported_text : no_data_text
    };

    let comps = new Set(data.reduce((res, value) => {
      return [...res, value.label]
    }, []));

    last_month = data.filter(d => {
      return d.date === moment(ed, 'YYYY-MM-DD').startOf('month').format('YYYY-MM-DD');
    });
    
    $('#comp-index').parent().hide();
    if (comps.size > 0 ) {
      let comps_series = [];
      comps.forEach(d => {
        if (last_month.find(j => { return j.label === d }) != undefined) {
          this_data = last_month.filter(n => {
            return n.label === d;
          }).reduce((res, value) => {
              return [...res, [moment(value.date, 'YYYY-MM-DD').unix()*1000, Math.round(value.visitors)]];
            }, []);
        } else {
          this_data = [[moment(ed, 'YYYY-MM-DD').startOf('month').unix()*1000, 0]];
        }

        let series = {
          name: d,
          data: this_data,
          marker: {
            symbol: 'circle'
          }
        }
        comps_series.push(series);
      });

      // sort the series
      comps_series.sort(function (a,b) {
        if(a.data[0][1] < b.data[0][1]) {
          return 1;
        } else if (a.data[0][1] > b.data[0][1]) {
          return -1;
        }
        return 0;
      });
      let zero_data = 0;
      comps_series.forEach(d => { if (d.data[0][1] === 0) zero_data += 1; });
      if (comps.size > zero_data) $('#comp-index').parent().show();
      comp_index_options.series = comps_series;
    }

    comp_index_options.exporting.chartOptions.title.text = `${site_label} ${selected_geo} Competitor Perfomance`;
    comp_index_options.exporting.chartOptions.subtitle.text = `Source: Adobe Analytics - ${moment(ed, 'YYYY-MM-DD').format('MMM YYYY')}`;
    comp_index_options.exporting.chartOptions.yAxis = {
      'labels': {
        'style': { 'color': '#444F57' },
      },
    };
    charts['comp-index'] = new Highcharts.chart('comp-index', comp_index_options);
  }).done(function() { 
    if (site_label === 'CBS Interactive') {
      $.getJSON(`api?site=${selected_comp_site}&sd=${sd}&ed=${ed}&report_type=top10&type=competitors&geo=${comscore_geo}`, function(data) {
        data.forEach(d => {
          d.label = d.site_nm
        });

        let top_prop_options = buildChart({
          chart_type: 'column',
          height: 300
        });

        top_prop_options.xAxis = {
          type: 'datetime',
          labels: {
            enabled: false
          }
        };
        top_prop_options.yAxis = [{
          labels: {
            formatter: function () {
              return this.axis.defaultLabelFormatter.call(this);
            },
            style: {
              color: '#DDD'
            }
          },
          title: {
            text: ''
          }
        }];
        top_prop_options.tooltip = {
          formatter: function() {
            let this_series_vals = data.filter(d => {
              return d.label === this.series.name;
            }).sort(compareValues('visitors'));
            let best_month = this_series_vals[this_series_vals.length-1];
            let ly_date = moment(ed, 'YYYY-MM-DD').startOf('month').subtract(1, 'year').startOf('month').format('YYYY-MM-DD');
            let ly = data.filter(d => {
              if (d.date === ly_date && d.label === this.series.name) return d;
            });
            let yoy = ly.length >= 1 ? ((this.y-ly[0].visitors) / ly[0].visitors) * 100 : 'N/A';
            let yoy_class = yoy < 0 ? 'red' : 'green';
            let series_name = this.series.name.length > 15 ? `${this.series.name.substring(0,15)}...` : this.series.name
            let tip_text = `<b><span style="font-size:14px;color:${this.color};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100px;">${series_name}</span></b>
              <br /><span style="text-align:right;font-size:11px;">${addCommas(this.y)}</span>
              <br /><span style="font-size:10px;">Y/Y: </span><span style="font-size:10px;" class="${yoy_class}">${pct(yoy)}%</span>
              <br /><br /><span style="font-size:11px;">Best Month</span>
              <br /><span class="pull-right" style="text-align:right;font-size:10px;">${moment(best_month.date, 'YYYY-MM-DD').format('MMM YYYY')} (${addCommas(best_month.visitors)})</span>
              `

            return tip_text;
          },
          useHTML: true,
          followPointer: true
        }
        top_prop_options.lang = {
          'noData': $.inArray(selected_site, cross_visit_sites) === -1 ? not_supported_text : no_data_text
        };

        let last_month = data.filter(d => {
          return d.date === moment(ed, 'YYYY-MM-DD').startOf('month').format('YYYY-MM-DD');
        });

        let comps = new Set(last_month.reduce((res, value) => {
          return [...res, value.label]
        }, []));
        
        $('#top-prop-index').parent().hide();
        if (comps.size > 0 ) {
          let comps_series = [];
          comps.forEach(d => {
            if (last_month.find(j => { return j.label === d }) != undefined) {
              this_data = last_month.filter(n => {
                return n.label === d;
              }).reduce((res, value) => {
                  return [...res, [moment(value.date, 'YYYY-MM-DD').unix()*1000, Math.round(value.visitors)]];
                }, []);
            } else {
              this_data = [[moment(ed, 'YYYY-MM-DD').startOf('month').unix()*1000, 0]];
            }

            let series = {
              name: d,
              data: this_data,
              marker: {
                symbol: 'circle'
              }
            }
            comps_series.push(series);
          });

          // sort the series
          comps_series.sort(function (a,b) {
            if(a.data[0][1] < b.data[0][1]) {
              return 1;
            } else if (a.data[0][1] > b.data[0][1]) {
              return -1;
            }
            return 0;
          });
          let zero_data = 0;
          comps_series.forEach(d => { if (d.data[0][1] === 0) zero_data += 1; });
          if (comps.size > zero_data) $('#top-prop-index').parent().show();
          top_prop_options.series = comps_series;
        }

        top_prop_options.exporting.chartOptions.title.text = `Top 10 Properties`;
        top_prop_options.exporting.chartOptions.subtitle.text = `Source: Adobe Analytics - ${moment(ed, 'YYYY-MM-DD').format('MMM YYYY')}`;
        top_prop_options.exporting.chartOptions.yAxis = {
          'labels': {
            'style': { 'color': '#444F57' },
          },
        };
        charts['top-prop-index'] = new Highcharts.chart('top-prop-index', top_prop_options);
      }).done(function() {
        completed_check();
      });
    } else {
      completed_check();
    }
  });

  $('.month-label').text(moment(ed, 'YYYY-MM-DD').format('MMM YYYY'))
}

function generateBigTextData(el,data,metric) {
  let same_month_ly = data.find(d => d.date === moment(ed, 'YYYY-MM-DD').startOf('month').subtract(1,'year').format('YYYY-MM-DD'));
  let last_month = data[data.length-1];
  let best_month = data.sort(compareValues(metric))[data.length-1];
  let yoy = same_month_ly === undefined ? 'N/A' : ((last_month[metric] - same_month_ly[metric]) / same_month_ly[metric]) * 100;
  let yoy_class = yoy === 'N/A' ? '' : yoy < 0 ? 'red' : 'green';
  let yoy_text = '';

  if ($.inArray(selected_site, ['cbsnews','cbssports.com','247sports','maxpreps','cbs']) === -1) {
    yoy_text = `(<span class="${yoy_class}">${pct(yoy)}%</span> Y/Y)`
  }

  if (last_month && last_month.date == moment(ed, 'YYYY-MM-DD').startOf('month').format('YYYY-MM-DD')) {
    let m = last_month[metric].toString().length >= 9 ? abbr_format3(last_month[metric]) : abbr_format2(last_month[metric])
    let bm = best_month[metric].toString().length >= 9 ? abbr_format3(best_month[metric]) : abbr_format2(best_month[metric]);
    $(`#${el}`).html(`<div style="text-align: center; display: block;">${m}</div><div style="text-align: center; display: block;">${yoy_text}</div>
      <br /><center><h6>Best Month <small><i>(past 12 months)</i></small></h6></center><center><h4>${moment(best_month.date, 'YYYY-MM-DD').format('MMMM YYYY')} (${bm})</h4></center>`);
    
    if (el === 'avg-daily-fd-users')
      $(`#${el} div:eq(0)`).fitText(.5);
    else {
      $(`#${el} div:eq(0)`).fitText(.3);
    }
  } else {
    let parent_width = $(`#${el}`).width();
    $(`#${el}`).html(`<div style="width:${parent_width}px;font-size:1.5vw;margin:auto;">There is currently no data available.</div>`);
  }
}

function generateRegionTable(data,data_ly,label,row) {
  if (row === 'first') {
    $('#regions-table').DataTable().destroy();
    $('.dynamic-region').remove();
  }

  let uvs_yoy = data_ly === undefined ? 'N/A' : ((data.visitors - data_ly.visitors) / data_ly.visitors) * 100;
  let visits_yoy = data_ly === undefined ? 'N/A' : ((data.visits - data_ly.visits) / data_ly.visits) * 100;
  let pvs_yoy = data_ly === undefined ? 'N/A' : ((data.pageviews - data_ly.pageviews) / data_ly.pageviews) * 100;
  let cur_month = moment(ql_sd).startOf('month').format('YYYY-MM-DD');
  let yoy_text = '';
  if ($.inArray(selected_site, ['cbsnews','cbssports.com','247sports','maxpreps','cbs']) === -1) {
    yoy_text = `: <span class="${negPos(uvs_yoy)}">${pct(uvs_yoy)}%</span> Y/Y</i>`;
  }

  $('#regions-table-body').append(`<tr class="dynamic-region">
    <td>${label}</td>
    <td>${addCommas(data.visitors)} <i>(${pct((data.visitors/uvs_totals[cur_month]) * 100)}%) ${yoy_text}</td></tr>`);
  
  if (row === 'last') {
    $('#regions-table').DataTable({
      'buttons': [ 'copyHtml5', 'excelHtml5', 'csvHtml5'], // 'pdfHtml5' ],
      'dom': 'Bfrtlip',
      'searching': false,
      'paging': false,
      'bInfo': false
    });
  }
}

function generateTable(data) {
  $('#country-detail-table').DataTable().destroy();
    $('.dynamic').remove();
    let visitors_total = 0;
    let avg_visitors_total = 0;
    let visits_total = 0;
    let pvs_total = 0;
    let bounces_total = 0;
    let entries_total = 0;

    data.filter(function(d) {
      return d.country !== undefined;
    }).forEach(function(d) {
      let dt = moment(d.date, 'YYYY-MM-DD').format('MMM YYYY');
      visitors_total += d.visitors;
      visits_total += d.visits;
      pvs_total += d.pageviews;
      bounces_total += d.bounces;
      entries_total += d.entries;

      uvs_pct_total = (d.visitors / uvs_totals[d.date]) * 100;
      pvs_pct_total = (d.pageviews / pvs_totals[d.date]) * 100;
      visits_pct_total = (d.visits / visits_totals[d.date]) * 100;

      uvs_yoy = ((d.visitors - d.visitors_ly) / d.visitors_ly) * 100;
      pvs_yoy = ((d.pageviews - d.pageviews_ly) / d.pageviews_ly) * 100;
      visits_yoy = ((d.visits - d.visits_ly) / d.visits_ly) * 100;
      bounce_rate_yoy = ((d.bounce_rate - d.bounce_rate_ly) / d.bounce_rate_ly) * 100;

      let yoy_text = '';
      if ($.inArray(selected_site, ['cbsnews','cbssports.com','247sports','maxpreps','cbs']) === -1) {
        yoy_text = `: <span class="${negPos(uvs_yoy)}">${pct(uvs_yoy)}%</span> Y/Y`;
      }

      $('#country-detail-table-body').append(
        `<tr class="dynamic">
          <td>${d.country}</td>
          <td data-order=${d.visitors}>${addCommas(d.visitors)} <i>(${pct(uvs_pct_total)}%) </td> </tr>`

      );
    });

    var table = $('#country-detail-table').DataTable({
      'buttons': [ 'copyHtml5', 'excelHtml5', 'csvHtml5'], // 'pdfHtml5' ],
      'dom': 'Bfrtlip',
    });
}

function negPos(val, inverse) {
  inverse = inverse === undefined ? false : true;
  let class_ind = 'red';
  
  if (inverse === true && val < 0) {
    class_ind = 'green';
  } else if (inverse === true && val > 0) {
    class_ind = 'red';
  } else if (val > 0) {
    class_ind = 'green';
  }

  return class_ind;
}

function compareValues(key, order='asc') {
  return function(a, b) {
    if(!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
        return 0; 
    }

    const varA = (typeof a[key] === 'string') ? 
      a[key].toUpperCase() : a[key];
    const varB = (typeof b[key] === 'string') ? 
      b[key].toUpperCase() : b[key];

    let comparison = 0;
    if (varA > varB) {
      comparison = 1;
    } else if (varA < varB) {
      comparison = -1;
    }
    return (
      (order === 'desc') ? (comparison * -1) : comparison
    );
  };
}

