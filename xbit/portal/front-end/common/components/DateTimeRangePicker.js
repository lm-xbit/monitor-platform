/**
 * Created on 9/30/16.
 */
import React from 'react';
import $ from 'jquery';
import moment from 'moment';
// import 'bootstrap/dist/js/bootstrap.min';
// import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-datetime-picker';
import 'bootstrap-datetime-picker/css/bootstrap-datetimepicker.css';

/**
 * Wraps Jquery date time picker based on bootstrap
 *
 * https://github.com/smalot/bootstrap-datetimepicker/blob/master/package.json
 */
export default class DateTimeRangePicker extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      enabled: true
    };
  }

  componentDidMount () {
    this.renderDateTimePicker();
  }

  componentDidUpdate () {
    this.renderDateTimePicker();
  }

  /**
   * Helper method to render datetime picker ...
   */
  renderDateTimePicker () {
    console.log('rendering bootstrap date time picker ...');

    var self = this;

    var now = moment();
    now.minute(0).second(0).millisecond(0);

    var start = moment(now);
    start.add(-1, 'day');
    // render the buy button with jQuery
    var from = $(this.refs.from);
    from.datetimepicker({
      autoclose: true,
      minView: 'day',
      showMeridian: true,
      bootcssVer: 3,
      initialDate: new Date(self.props.from)
    }).on('changeDate', function (ev) {
      var value = moment(ev.date);

      if (typeof self.props.onFromChange === 'function') {
        self.props.onFromChange(value);
      } else {
        console.log('new from value - ' + value.format());
      }
    });

    var to = $(this.refs.to);
    to.datetimepicker({
      autoclose: true,
      minView: 'day',
      showMeridian: true,
      bootcssVer: 3,
      initialDate: new Date(self.props.to)
    }).on('changeDate', function (ev) {
      var value = moment(ev.date);

      if (typeof self.props.onToChange === 'function') {
        self.props.onToChange(value);
      } else {
        console.log('new to value - ' + value.format());
      }
    });
  }

  enabled () {
    return this.state.enabled;
  }

  disable () {
    console.log('disable date time picker ...');
    this.state.enabled = false;
    this.forceUpdate();

    $(this.refs.toPicker).css('visibility', 'hidden');
    $(this.refs.fromPicker).css('visibility', 'hidden');
  }

  enable () {
    console.log('enable date time picker ...');
    this.state.enabled = true;
    this.forceUpdate();

    $(this.refs.toPicker).css('visibility', 'inherit');
    $(this.refs.fromPicker).css('visibility', 'inherit');
  }

  render () {
    var momentFrom;
    if (this.props.from) {
      momentFrom = moment(this.props.from);
    } else {
      momentFrom = moment().add(-1, 'day');
    }

    var momentTo;
    if (this.props.to) {
      momentTo = moment(this.props.to);
    } else {
      momentTo = moment();
    }

    var fromStr = momentFrom.minute(0).second(0).millisecond(0).format('YYYY-MM-DD hh:mm A');
    var toStr = momentTo.minute(0).second(0).millisecond(0).format('YYYY-MM-DD hh:mm A');

    return (
      /**
       * We return a component with clear buttons
       */
      <form className="form form-inline">
        <div className="form-group">
          <div className='input-group date form_datetime' ref='from' data-date={fromStr} data-date-format="yyyy-mm-dd HH:ii P">
            <label className="input-group-addon">From:</label>
            <input className={'form-control span ' + this.props.className} type='text' disabled value={fromStr}/>
            <span className='input-group-addon' ref='fromPicker'><i className='glyphicon glyphicon-calendar'/></span>
          </div>
        </div>

        <div className="form-group">
          <div className='input-group date form_datetime' ref='to' data-date={toStr} data-date-format="yyyy-mm-dd HH:ii P">
            <label className="input-group-addon">To:</label>
            <input className={'form-control span ' + this.props.className} type='text' disabled value={toStr}/>
            <span className='input-group-addon' ref='toPicker'><i className='glyphicon glyphicon-calendar'/></span>
          </div>
        </div>
      </form>
    );
  }
}

