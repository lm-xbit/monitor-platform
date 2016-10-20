import React, {PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {updateLocation, replayLocation, loadGdMap, loadApps, startReplay} from './GdMapActions';
import $ from 'jquery';
import 'react-date-picker/index.css';
import DateTimeRangePicker from '../../common/components/DateTimeRangePicker';
import converter from 'coordtransform';

export class GdMap extends React.Component {
  constructor (props) {
    super(props);

    this._timeRangePicker = null;

    this.state = {
      timer: null,

      replaying: false,

      replayInterval: 60,

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
    this.handleReplayIntervalChange = this.handleReplayIntervalChange.bind(this);
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

  handleReplayIntervalChange (event) {
    let ival = event.target.value;

    this.state.replayInterval = Number(ival);

    this.forceUpdate();
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

      this.props.actions.startReplay(this.state.app.key, this.state.timeRange, this.state.replayInterval, this.startReplay.bind(this));

      this.state.replaying = true;

      this.forceUpdate();
    } else {
      if (this.state.replay.timer) {
        clearInterval(this.state.replay.timer);
        this.state.replay.timer = null;
      }

      if (this.state.replay.marker) {
        this.state.replay.marker.hide();
        this.state.replay.marker.setMap(null);
        this.state.replay.marker = null;
      }

      if (this.state.replay.range) {
        this.state.replay.range.hide();
        this.state.replay.range.setMap(null);
        this.state.replay.range = null;
      }

      if (this.state.replay.polyPast) {
        this.state.replay.polyPast.hide();
        this.state.replay.polyPast.setMap(null);
        this.state.replay.polyPast = null;
      }

      if (this.state.replay.polyFuture) {
        this.state.replay.polyFuture.hide();
        this.state.replay.polyFuture.setMap(null);
        this.state.replay.polyFuture = null;
      }

      this._timeRangePicker.enable();
      $(this.refs.toggle).html('回放行程');

      this.state.replaying = false;

      this.forceUpdate();
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

    var lastPos = null;
    for (var idx = data.length - 1; idx >= 0; idx--) {
      let pos = data[idx];
      /**
       * pos: {
       *    timestamp: 12345,
       *    location: {
       *       latitude: 130.2,
       *       longitude: 11.32,
       *       altitude: 123.34
       *       accuracy: 50
       *    }
       * }
       */
      let loc = converter.wgs84togcj02(pos.location.longitude, pos.location.latitude);

      var converted = {
        timestamp: pos.timestamp,
        location: {
          longitude: loc[0],
          latitude: loc[1],
          altitude: pos.location.altitude,
          accuracy: pos.location.accuracy
        }
      };

      self.state.replay.data.push(converted);

      // we may have duplicate positions! in this case, let's get rid of it ...
      var lnglat = new window.AMap.LngLat(loc[0], loc[1]);
      if (lastPos === null || !lnglat.equals(lastPos)) {
        self.state.replay.future.push(lnglat);

        lastPos = lnglat;
      }
    };

    this.state.replay.index = 0;
    replayLocation(this.state.map, this.state.replay);

    var replay = this.state.replay;
    this.state.replay.timer = setInterval(function () {
      var pos = replay.data[replay.index];
      var loc = new window.AMap.LngLat(pos.location.longitude, pos.location.latitude);

      // we have replay some data points. Let's remove the old points
      // after display, let's remove the recent point ... as it will be set as current position next time
      if (replay.future.length > 0 && loc.equals(replay.future[0])) {
        replay.future.splice(0, 1);
      }

      replay.index ++;
      if (replay.index === replay.data.length) {
        alert('All data have been replayed!');
        clearInterval(replay.timer);
        replay.timer = null;
      } else {
        replayLocation(self.state.map, replay);
      }
    }, 3000);
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
                style={{display: 'inline-block', float: 'right', margin: '0 20px 0 20px'}}
                onClick={this.toggleReplay} ref='toggle'
        >回放行程
        </button>
        <div style={{display: 'inline-block', float: 'right'}}>
          <form className="form-inline">
            <div className="form-group" style={{marginBottom: '10px'}}>
              <label style={{float: 'left', marginRight: '10px', marginLeft: '10px'}} htmlFor="app" className="control-label">Every</label>
              <select className="form-control" style={{width: '200px'}} id="app" name="app" disabled={this.state.replaying}
                      defaultValue={this.state.replayInterval} onChange={this.handleReplayIntervalChange}>
                <option value='5'>5 seconds</option>
                <option value='15'>15 seconds</option>
                <option value='30'>30 seconds</option>
                <option value='60'>1 minute</option>
                <option value='300'>5 minutes</option>
                <option value='900'>15 minutes</option>
                <option value='1800'>30 minutes</option>
                <option value='3600'>1 hour</option>
              </select>
            </div>
          </form>
        </div>

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
        <div style={{ margin: 'auto', width: '100%', height: 'calc(100% - 50px)' }} id="map-container" />
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
