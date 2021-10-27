const addCommas = d3.format(',');
const pct = d3.format('.2f');
const abbr_format2 = d3.format('.2s');
const abbr_format3 = d3.format('.3s');
let sd = moment().subtract(13, 'months').startOf('month').format('YYYY-MM-DD');
let ed = moment().subtract(2, 'months').endOf('month').format('YYYY-MM-DD');
let loading = false;
let completed = 0;

const emea_lu = ['AL','DZ','AD','AO','AT','BH','BY','BE','BJ','BA','BW','BG','BF','BI','CM','CV','CF','TD','KM','HR','CY','CZ','CD','DK','DJ','EG','GQ','ER','EE','ET','FO','FI','FR','GA','GM','GE','DE','GH','GI','GR','GG','GN','GW','HU','IS','IR','IQ','IE','IM','IL','IT','CI','JE','JO','KE','KW','LV','LB','LS','LR','LY','LI','LT','LU','MK','MG','MW','ML','MT','MR','MU','MD','MC','ME','MA','MZ','NA','NL','NE','NG','NO','OM','PS','PL','PT','QA','RO','RW','SM','ST','SA','SN','RS','SK','SI','SO','ZA','ES','SD','SZ','SE','CH','SY','TZ','TG','TN','TR','UG','UA','AE','GB','VA','EH','YE','ZM','ZW'];
const emea_minus_uk_lu = ['AL','DZ','AD','AO','AT','BH','BY','BE','BJ','BA','BW','BG','BF','BI','CM','CV','CF','TD','KM','HR','CY','CZ','CD','DK','DJ','EG','GQ','ER','EE','ET','FO','FI','FR','GA','GM','GE','DE','GH','GI','GR','GG','GN','GW','HU','IS','IR','IQ','IE','IM','IL','IT','CI','JE','JO','KE','KW','LV','LB','LS','LR','LY','LI','LT','LU','MK','MG','MW','ML','MT','MR','MU','MD','MC','ME','MA','MZ','NA','NL','NE','NG','NO','OM','PS','PL','PT','QA','RO','RW','SM','ST','SA','SN','RS','SK','SI','SO','ZA','ES','SD','SZ','SE','CH','SY','TZ','TG','TN','TR','UG','UA','AE','VA','EH','YE','ZM','ZW'];
const sea_lu = ['TH','VN','ID','SG','MY','PH'];
const lat_am_lu = ['AR','BZ','BO','BR','CL','CO','CR','EC','SV','FK','GT','GY','HN','MX','NI','PA','PY','PE','SR','UY','VE','GF'];
const au_na_lu = ['AU','NZ'];
const apac_lu = ['AU','BD','KH','CN','FJ','PF','GU','HK','IN','JP','KP','KR','LA','MY','FM','MM','NZ','PK','SG','TW','TH','VN'];
const hk_tw_lu = ['HK','TW'];
const age_group_map = [
  { 'key': 'Persons: 18-24', 'label': 'A18-24' },
  { 'key': 'Persons: 18-34', 'label': 'A18-34' },
  { 'key': 'Persons: 18-49', 'label': 'A18-49' },
  { 'key': 'Persons: 25-54', 'label': 'A25-54' }
]
const income_map = ['Under $60K', '$60K-$74,999', '$75K-$99,999', '$100K+'];
const rollups = {
  'cnet': [{
      'site_id': 'CNET Rollup',
      'display': 'CNET Rollup'
    }, {
      'site_id': 'cnet',
      'display': 'CNET.com'
    }],
  'zdnet': [{
      'site_id': 'ZDNet Websites',
      'display': 'ZDNet Websites'
    }, {
      'site_id': 'zdnet',
      'display': 'ZDNet'
    }, {
      'site_id': 'techrepublic',
      'display': 'TechRepublic'
    }, {
      'site_id': 'CNET Rollup (zdnet)',
      'display': 'CNET Rollup'
    }],
  'gamespot': [{
      'site_id': 'GameSpot',
      'display': 'GameSpot Rollup'
    }, {
      'site_id': 'GAMESPOT.COM*',
      'display': 'GameSpot.com'
    // }, {
    //   'site_id': 'gamefaqs',
    //   'display': 'GameFAQs.com'
    }, {
      'site_id': 'giantbomb',
      'display': 'Giantbomb.com'
    }],
  'tvguide': [{
      'site_id': 'Entertainment Tonight/TV Guide Network',
      'display': 'TV Guide Rollup'
    }, {
      'site_id': 'tvguide',
      'display': 'TVGuide.com'
    }, {
      'site_id': 'tv.com',
      'display': 'TV.com'
    }, {
      'site_id': 'chow',
      'display': 'Chowhound'
    }
    // , {
    //   'site_id': 'metacritic',
    //   'display': 'Metacritic.com'
    // }
    ],
  // 'cbssports': [{
  //     'site_id': 'cbssports',
  //     'display': 'CBS Sports Rollup'
  //   }, {
  //     'site_id': 'cbssports.com',
  //     'display': 'CBSSports.com'
  //   }, {
  //     'site_id': '247sports',
  //     'display': '247sports'
  //   }, {
  //     'site_id': 'maxpreps',
  //     'display': 'MaxPreps'
  //   }],
  // 'cbs': [{
  //     'site_id': 'cbs',
  //     'display': 'CBS.com'
  //   }, {
  //     'site_id': 'CBS.COM Daytime',
  //     'display': 'CBS.com Daytime'
  //   }, {
  //     'site_id': 'CBS.COM Latenight',
  //     'display': 'CBS.com Latenight'
  //   }, {
  //     'site_id': 'CBS.COM Primetime',
  //     'display': 'CBS.com Primetime'
  //   }]
}

let selected_site = 'CNET Rollup';
let site_label = 'CNET Rollup';
let initial_load = true;

$('.site-filter').on('click', function() {
  if (loading !== true) {
    let selected = $(this);
    $('.site-filter').removeClass('active')
    selected.addClass('active');
    $('#site').text(selected.text());

    if (selected.hasClass('has-rollup')) {
      $('#comscore-level').parent().children('div').empty();
      $('#comscore-geo').parent().show();
      // $('#comscore-level').parent().removeClass('d-none');
      $('.rollup-menu').removeClass('d-none');
      rollups[selected.data().site].forEach((d,i) => {
        if (i === 0) {
          selected_site = d.site_id;
          site_label = d.display;
          $('#comscore-level').text(d.display);
        }
        $('#comscore-level').parent().children('div').append(`<a class="dropdown-item comscore-site-filter" href="javascript:void(0);" data-comscore_site="${d.site_id}">${d.display}</a>`)
      });
    } else {
      // $('#comscore-level').parent().addClass('d-none');
      $('.rollup-menu').addClass('d-none');
      selected_site = selected.data().site;
      site_label = selected.text();

      if (selected_site === 'rachaelray') {
        $('#comscore-geo').text('US');
        $('#comscore-geo').parent().hide();
        $('.comscore-geo').removeClass('active')
        $('#comscore-geo').parent().children('div').children('a:eq(1)').addClass('active');
      } else {
        $('#comscore-geo').parent().show();
      }
    }

    $('#getData').addClass('pulse-primary');
    initial_load = false;
  }
});

$('#comscore-level').parent().children('div').on('click', '.comscore-site-filter', function() {
  let selected = $(this);
  selected_site = selected.data().comscore_site;
  site_label = selected.text();
  $('.comscore-site-filter').removeClass('active')
  selected.addClass('active');
  $('#comscore-level').text(selected.text());
});

$('.comscore-geo').on('click', function() {
  let selected = $(this);
  $('.comscore-geo').removeClass('active')
  selected.addClass('active');
  $('#comscore-geo').text(selected.text());
  $('#getData').addClass('pulse-primary');
});

function completed_check() {
  completed += 1;
  if (completed === 10) {
    loading = false;
    $('#site').removeClass('disabled');
    $('#comscore-level>option').attr('disabled', false);
    $('#datepicker').data('DateTimePicker').enable();
    $('#getData').removeClass('disabled');
    $('.filter-selection').attr('disabled',false).css('opacity', '1');
  }
}


/*** Tour ***/
let callout = function() {
  $('#site').parent().children('div.dropdown-menu').children('a:eq(0)').trigger('click');
  $('#getData').trigger('click');
  let calloutMgr = hopscotch.getCalloutManager();
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
  calloutMgr.createCallout({
    id: 'show_tour_button',
    target: 'view-tour',
    placement: 'left',
    title: 'View the tour again',
    content: 'You can restart the tour at any time by clicking this button. We hope this page will be one of the first pages you visit during your work day. <strong>The report will now refresh to pull valid data.</strong>'
  });

  return false;
}

let tour = {
  id: 'welcome',
  showPrevButton: true,
  onClose: function() {
    localStorage.tour_viewed = true;
    callout();
  },
  onEnd: function() {
    localStorage.tour_viewed = true;
    callout();
  },
  steps: [{
    title: 'Report Filters',
    content: 'These are the primary filters for pulling data from the database. All filters are required in order to retrieve data.',
    target: '#filters',
    placement: 'bottom'
  }, {
    title: 'Get Data',
    content: 'Once you\'ve selected your filters, click the Get Data button to retrieve data from the database.',
    target: '#getData',
    placement: 'right'
  }, {
    title: 'Rollup Definitions',
    content: 'You\'ll find certain rollup definitions here.',
    target: '.site-text',
    placement: 'bottom'
  }, {
    title: 'Other Reports',
    content: 'Here you\'ll find outbound links to other relevant reports and dashboards for the selected site.',
    target: '#other-reports',
    placement: 'bottom'
  }, {
    title: 'Dashboard',
    content: 'You will find the dashboard widgets here. Widgets will appear and disappear depending on the chosen filter selections. Some charts have an export button allowing you to save the chart as an image.',
    target: '.dash-content',
    placement: 'top'
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

