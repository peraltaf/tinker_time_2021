/*** Exporting ***/
$('.screenshot').on('click', function() {
  let target_data = $(this).data();
  let highchart_chart = $(this).hasClass('highcharts');

  $.confirm({
    title: 'Enter a filename',
    content: `
      <form action="" class="formName">
        <div class="form-group">
          <input type="text" placeholder="Enter a filename" class="name form-control" required />
        </div>
      </form>`,
    buttons: {
      formSubmit: {
        text: 'Submit',
        btnClass: 'btn-blue',
        action: function () {
          let filename = this.$content.find('.name').val();
          if (!filename) {
            alert_error(`Please provide a valid name`);
            return false;
          }

          if (highchart_chart) {
            charts[target_data.target].exportChart({
              type: 'image/png',
              filename: filename
            });
          } else {
            const additional_height = target_data.paddingHeight || 0;
            const additional_width = target_data.paddingWidth || 0;
            $(`#${target_data.target}-filt`).removeClass('d-none');
            console.log($(`#${target_data.target}-filt`))
            domtoimage.toPng($(`#${target_data.target}`)[0], {
              'bgcolor': '#FFF',
              'quality': 1.0,
              'height': $(`#${target_data.target}`).height() + additional_height,
              'width': $(`#${target_data.target}`).width() + additional_width
            }).then(function (img_url) {
              let link = document.createElement('a');
              link.download = `${filename}.png`;
              link.href = img_url;
              link.click();
              link.remove();
              $(`#${target_data.target}-filt`).addClass('d-none');
            }).catch(function (error) {
              console.error('oops, something went wrong!', error);
            });
          }
        }
      },
      cancel: {
        action: function(){},
        btnClass: 'btn-secondary'
      }
    },
    onContentReady: function() {
      let jc = this;
      this.$content.find('form').on('submit', function(e) {
        e.preventDefault();
        jc.$$formSubmit.trigger('click');
      });
    }
  });
});

/*** Exporting ***/
$('.export-pdf').on('click', function() {
  $('.panel-tools, #update').addClass('d-none');
  let element = document.querySelector('.wrapper');
  let opt = {
    margin: 1,
    // filename: `${filename}.pdf`,
    filename: 'CNET CAT Report.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'pt', format: 'a2', orientation: 'portrait' },
    pagebreak: { mode: ['legacy'] }
  };

  html2pdf().set(opt).from(element).save();
  $('.panel-tools, #update').removeClass('d-none');
});


$('.chart-selection').on('click', function() {
  let el = $(this);
  let parent = el.parent();
  parent.children('button').removeClass('active');
  el.addClass('active');
  updateChart(charts[el.data().target], el.data().type);
});


$('.export').on('click', function() {
  let target_data = $(this).data().export;
  let remove_dt_dim = $(this).data().removeDateDim;
  let remove_dt_format = $(this).data().removeDtFormat;

  if ($(this).data().exportType === 'raw_data') {
    let wait_msg = alert_msg('Your data is being loaded. This may take some time.','Please wait..','green');
    let payload = { 'raw_data': true }

    if ($(this).data().hasOwnProperty('addFilters'))
      payload = {...payload, ...$(this).data().addFilters };
    console.log(payload)
    get_data(payload).then(data => {
      target_data = data.data;
      wait_msg.close(true);
      generate_export(target_data, remove_dt_dim, remove_dt_format);
    });
  } else {
    generate_export(window[target_data], remove_dt_dim, remove_dt_format);
  }
});

const generate_export = (data,remove_dt_dim,remove_dt_format) => {
  $.confirm({
    title: 'Enter a filename',
    content: `
      <form action="" class="formName">
        <div class="form-group">
          <input type="text" placeholder="Enter a filename" class="name form-control" required />
        </div>
      </form>`,
    buttons: {
      formSubmit: {
        text: 'Submit',
        btnClass: 'btn-blue',
        action: function () {
          let filename = this.$content.find('.name').val();
          let export_data = JSON.parse(JSON.stringify(data));
          
          if (!filename) {
            alert_error(`Please provide a valid name`);
            return false;
          }

          export_data.forEach(d => {
            delete d._id;
            return d;
          });

          if (remove_dt_dim) {
            export_data.forEach(d => {
              d[remove_dt_dim] = d[remove_dt_dim] === null ? null
                : d[remove_dt_dim].hasOwnProperty('$date') ? moment(d[remove_dt_dim]['$date'] + offset).format(remove_dt_format)
                : moment(d[remove_dt_dim] + offset).format(remove_dt_format);
              return d;
            });
          }

          let csv_content = Papa.unparse(export_data);
          let a = $('<a style="display: none;"/>');
          const encoded_uri = encodeURI(csv_content);
          const csv_blob = new Blob([csv_content], { 'type': 'data:attachment/text' });
          window.URL.createObjectURL(csv_blob);
          let url = window.URL.createObjectURL(csv_blob);
          a.attr('href', url);
          a.attr('download', `${filename}.csv`);
          $('body').append(a);
          a[0].click();
          window.URL.revokeObjectURL(url);
          a.remove();
          $('.jconfirm-buttons button:eq(0)').html('submit');
          // End formatting the data for export
        }
      },
      cancel: {
        action: function(){},
        btnClass: 'btn-secondary'
      }
    },
    onContentReady: function() {
      let jc = this;
      this.$content.find('form').on('submit', function(e) {
        e.preventDefault();
        jc.$$formSubmit.trigger('click');
      });
    }
  });
}
/*** End Exporting ***/