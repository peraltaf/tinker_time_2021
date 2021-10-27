const leapYear = year => (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
let monthSlider = document.querySelector('#month-range');
let today = new Date();
let todayMonthIndex = today.getMonth();
let todayYear = today.getFullYear();
let months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
let daysInMonths = [31,28,31,30,31,30,31,31,30,31,30,31];
let monthLabels = [];
let monthYearLabels = [];
let monthData = [];
let lastDaysData = [];
let thisYear = todayYear;
// let thisMonth = todayMonthIndex;

axios.get(`api/?type=get_max_date`).then(data => {
  let totalMonthsShown = Math.round(Math.abs(moment(moment(201305, 'YYYYMM')).diff(moment(data.data[0].month_start_dt['$date']+offset), 'months', true)));
  let thisMonth = +moment(data.data[0].month_start_dt['$date']+offset).format('M')

  // Iterate backwards through all the months to display setting
  // the values of items on the scale
  for (i = totalMonthsShown; i >= 0; i--) {
    monthYearLabels[i] = `${months[thisMonth]} ${thisYear}`;
    monthLabels[i] = months[thisMonth];
    monthData[i] = thisYear + '-' + (thisMonth + 1);

    // February then ensure leap days are considered.
    lastDaysData[i] = (thisMonth == 1 && leapYear(thisYear)) ? 29 : daysInMonths[thisMonth];
    
    if (thisMonth == 0) {
      thisMonth = 11;
      thisYear--;
    } else {
      thisMonth--;
    }
  }

  let range = {
    'min': 0,
    'max': totalMonthsShown -1
  }

  let month_start = window.location.pathname === '/games_comparison' ? 2 : Math.round(Math.abs(moment(moment().startOf('year')).diff(moment(), 'months', true)));
  let true_start = moment().startOf('month').diff(moment('20140601', 'YYYYMMDD'), 'months', true)-6;
  let true_end = moment().startOf('month').diff(moment('20140601', 'YYYYMMDD'), 'months', true)-1;

  noUiSlider.create(monthSlider, {
    // start: [totalMonthsShown - month_start, totalMonthsShown -1],
    start: [true_start, true_end],
    step: 1,
    range: range,
    tooltips: true,
    connect: true,
    animate: true,
    animationDuration: 600,
  });

  // Remove the shortcut active class when manually setting a range.
  monthSlider.noUiSlider.on('start', function() {
    $('.shortcuts li').removeClass('active');
  });

  monthSlider.noUiSlider.on('update', function(values, handle) {
    let monthIndex = parseInt(values[handle]);
    let prefixes = ['From', 'To'];
    let day = handle === 0 ? 1 : lastDaysData[monthIndex];
    
    // Set the tooltip values.
    // $(`.noUi-handle[data-handle="${handle}"]`).find('.noUi-tooltip').html(`<strong>${prefixes[handle]}:</strong> ${monthYearLabels[monthIndex]}`);
    let target_el = handle === 0 ? '#start-month' : '#end-month';
    $(target_el).html(`<strong>${prefixes[handle]}:</strong> ${monthYearLabels[monthIndex]}`);
    
    // Update the input elements.
    let minValueIndex = parseInt(values[0]);
    let maxValueIndex = parseInt(values[1]);
    $('input[name="month-range-min"]').val(monthData[minValueIndex]);
    $('input[name="month-range-max"]').val(monthData[maxValueIndex]);
    window.range_start_date = monthData[minValueIndex];
    window.range_end_date = monthData[maxValueIndex];
  });

  $('.month-slider-wrapper .shortcuts li').mousedown(function() {
    let monthPeriod = $(this).attr('data-min-range');
    let newValues = [
      (totalMonthsShown - monthPeriod),
      (totalMonthsShown -1)
    ];
    
    monthSlider.noUiSlider.set(newValues);
    
    $('.shortcuts li').removeClass('active');
    $(this).addClass('active');  
  });
});


