import React, {PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {updateLocation, replayLocation, loadGdMap, loadApps, startReplay} from './GdMapActions';
import $ from 'jquery';
import {TransitionView, Calendar, DateField, DatePicker} from 'react-date-picker';
import 'react-date-picker/index.css';
import DateTimeRangePicker from '../../common/components/DateTimeRangePicker';
import converter from 'coordtransform';

export class GdMap extends React.Component {
  constructor (props) {
    super(props);

    this._timeRangePicker = null;

    this.state = {
      timer: null,
      replay: {
        timer: null,
        data: [],
        past: [],
        future: [],
        index: 0,
        // marker for current replay position
        marker: null,
        // range for accuracy
        range: null,
        // already replayed path
        polyPast: null,
        // path not yet replayed
        polyFuture: null
      },

      map: null,

      timeRange: {
        'from': new Date().valueOf() - 86400000,
        'to': new Date().valueOf(),
        'polyline': null
      },

      hot: {
        marker: null,
        range: null,
        // circle: null,
        // 0:  pause=false, 1: pause=true
        pause: 0
      },

      app: null
    };

    this.handleAppChange = this.handleAppChange.bind(this);
    this.handleTimeRangeChange = this.handleTimeRangeChange.bind(this);
    this.toggleReplay = this.toggleReplay.bind(this);
  }

  componentWillMount () {
    this.props.actions.loadApps();
  }

  componentDidMount () {
    var self = this;
    loadGdMap(function () {
      var map = new window.AMap.Map('map-container');
      map.setZoom(14);

      self.state.map = map;

      updateLocation(map, self.state.hot, self.state.app);

      window.AMap.plugin(['AMap.ToolBar', 'AMap.Scale'], function () {
        var toolBar = new window.AMap.ToolBar();
        var scale = new window.AMap.Scale();
        map.addControl(toolBar);
        map.addControl(scale);
      });

      self.state.timer = setInterval(function () {
        if (self.state.hot.pause === 0) {
          updateLocation(map, self.state.hot, self.state.app);
        }
      }, 3000); }
    );
  };

  componentWillUnmount () {
    if (this.state.timer !== null) {
      clearInterval(this.state.timer);
      this.state.timer = null;
    }
  }

  handleAppChange (event) {
    var key = event.target.value;
    var selected = null;

    this.props.apps.forEach(app => {
      if (app.key === key) {
        selected = app;
      }
    });

    this.state.app = selected;
    this.forceUpdate();

    updateLocation(this.state.map, this.state.hot, this.state.app);
  }

  handleTimeRangeChange (type) {
    var self = this;
    return function (moment) {
      var timeMillis = moment.valueOf();
      if (timeMillis === self.state.timeRange[type]) {
        // not changed
        return;
      }

      console.log(type + ' changes to ' + moment.format());
      self.state.timeRange[type] = timeMillis;
    };
  }

  toggleReplay () {
    if (this._timeRangePicker.enabled()) {
      var delta = this.state.timeRange.to - this.state.timeRange.from;
      if (delta < 3600 * 1000) {
        // range less than one hour!
        alert('Time range invalid or too small! Please select at least one hour for the replay!');
        return;
      }

      this._timeRangePicker.disable();
      $(this.refs.toggle).html('停止回放');

      this.props.actions.startReplay(this.state.app.key, this.state.timeRange, this.startReplay.bind(this));
    } else {
      if (this.state.replay.timer) {
        clearInterval(this.state.replay.timer);
        this.state.replay.timer = null;
      }

      this._timeRangePicker.enable();
      $(this.refs.toggle).html('回放行程');
    }
  }

  startReplay (err, data) {
    if (err) {
      this._timeRangePicker.enable();
      $(this.refs.toggle).html('回放行程');
      return;
    }

    /**
     * Should have a better way to detect if the replay has been stopped during retrieve data
     * But if this is enabled, it means user can reselect the range and start another replay,
     * which means the previous shall have been aborted
     */
    if (this._timeRangePicker.enabled()) {
      console.log('Replay might be aborted. Stop replaying ....');
      // replay has been aborted
      return;
    }

    console.log('Start replay ' + data.length + ' locations ...');
    if (this.state.replay.timer) {
      // clear old timer first, just in case
      clearInterval(this.state.replay.timer);
      this.state.replay.timer = null;
    }

    var self = this;
    this.state.replay.data = [];
    this.state.replay.past = [];
    this.state.replay.future = [];

    var lastConverted = null;
    data.forEach(function (pos) {
      var converted = converter.wgs84togcj02(pos.longitude, pos.latitude);
      converted.accuracy = pos.accuracy;
      self.state.replay.data.push(converted);

      if (lastConverted === null || !converted.equals(lastConverted)) {
        self.state.replay.future.push(converted);
      }
    });

    this.state.replay.index = 0;
    replayLocation(this.state.map, this.state.replay);

    this.state.replay.timer = setInterval(function () {
      self.state.replay.index ++;
      if (self.state.replay.index === self.state.replay.data.length) {
        alert('All data have been replayed!');
        clearInterval(self.state.replay.timer);
        self.state.replay.timer = null;
      } else {
        replayLocation(self.state.map, self.state.replay);
      }
    }, 1000);
  }

  render () {
    if (!this.state.app) {
      var primary = null;
      this.props.apps.forEach(
        app => {
          if (app.primary) {
            primary = app;
          }
        }
      );

      if (!primary && this.props.apps.length > 0) {
        primary = this.props.apps[0];
      }

      this.state.app = primary;
    }

    return (
      <div style={{height: '100%'}}>
        <button type="button" className="btn btn-primary"
                style={{display: 'inline-block', float: 'right', margin: '0 200px 0 20px'}}
                onClick={this.toggleReplay} ref='toggle'
        >回放行程
        </button>

        <div style={{display: 'inline-block', float: 'right'}}>
          <DateTimeRangePicker
            onFromChange={this.handleTimeRangeChange('from')}
            onToChange={this.handleTimeRangeChange('to')}
            from={this.state.timeRange.from}
            to={this.state.timeRange.to}
            ref={(child) => {
              this._timeRangePicker = child;
            }}
          />
        </div>

        <div style={{height: '50px'}}>
          <form className="form-inline">
            <div className="form-group" style={{marginBottom: '10px'}}>
              <label style={{float: 'left', marginRight: '10px'}} htmlFor="app" className="control-label">Select Application</label>
              <select className="form-control" style={{width: '200px'}} id="app" name="app" defaultValue={this.state.app ? this.state.app.key : ''} onChange={this.handleAppChange}>
                {
                  this.props.apps.map(
                    app => <option value={app.key}>{app.name}</option>
                  )
                }
              </select>
            </div>
          </form>
        </div>
        <div style={{ margin: 'auto', width: '100%', height: 'calc(100% - 50px)' }} id="map-container" >
        </div>
      </div>
    );
  };
};

GdMap.propTypes = {
  apps: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    key: PropTypes.string.isRequired,
    primary: PropTypes.bool.isRequired
  }).isRequired).isRequired,
  actions: React.PropTypes.shape({
    loadApps: PropTypes.func.isRequired,
    startReplay: PropTypes.func.isRequired
  })
};

const mapStateToProps = (state) => {
  console.log('Try render APP state', state.settings);

  return {
    apps: state.graph.apps
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    actions: bindActionCreators({loadApps, startReplay}, dispatch),
    dispatch
  };
};

export default connect(
  mapStateToProps, mapDispatchToProps
)(GdMap);
