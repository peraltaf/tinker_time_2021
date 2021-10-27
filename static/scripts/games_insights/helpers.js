const addCommas = d3.format(',');
const pct = d3.format('.1f');
const decimal = d3.format('.1f');
const abbr_format2 = d3.format('.2s');
const abbr_format3 = d3.format('.3s');
const CancelToken = axios.CancelToken;
const source = CancelToken.source();
const offset = (new Date().getTimezoneOffset() + 60) * 60000;

const titleCase = title => title.split(/ /g).map(word => `${word.substring(0,1).toUpperCase()}${word.substring(1)}`).join(' ');

const alert_error = (msg) => {
  $.alert({
    title: '',
    content: msg,
    closeIcon: true,
    type: 'red'
  });
}

const dropdown_options = (trgt,txt,opts={}) => {
  let btnClass = opts.hasOwnProperty('btnClass') ? opts.btnClass : '';
  const options = {
    'enableFiltering': opts.hasOwnProperty('filtering') ? opts.filtering : false,
    'enableCaseInsensitiveFiltering': opts.hasOwnProperty('filtering') ? opts.hasOwnProperty('filtering') : false,
    'includeSelectAllOption': opts.hasOwnProperty('includeSelectAllOption') ? opts.includeSelectAllOption : false,
    'selectAllJustVisible': false,
    'buttonWidth': opts.hasOwnProperty('width') ? opts.width : 150,
    'numberDisplayed': 2,
    'nonSelectedText': txt,
    'dropRight': true,
    'maxHeight': 600,
    'buttonClass': `btn btn-outline-secondary btn-sm ${btnClass}`,
    'onDropdownHide': function(event) {
      $(this['$button']).children('span').css('font-weight', 'inherit');
    },
    'onChange': function(option, checked) {
      $('#update').addClass('pulse-primary');
      if (opts.hasOwnProperty('onChangeCallback')) {
        opts.onChangeCallback(option, checked)
      }
    },
    'onSelectAll': function() {
      $('#update').addClass('pulse-primary');
    }
  }
  $(`${trgt}`).multiselect(options);
}

$('[data-toggle="tooltip"]').tooltip();




