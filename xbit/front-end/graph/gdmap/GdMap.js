import React, {PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {updateLocation, loadGdMap, loadApps, replayOnMap} from './GdMapActions';
import {TransitionView, Calendar, DateField, DatePicker} from 'react-date-picker';
import 'react-date-picker/index.css';

export class GdMap extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      timer: null,

      map: null,

      timeRange: {
        'from': new Date().valueOf() - 86400000,
        'to': new Date().valueOf(),
        'polyline': null
      },

      hot: {
        marker: null,
        range: null,
        circle: null,
        // 0:  pause=false, 1: pause=true
        pause: 0
      },

      app: null
    };

    this.handleAppChange = this.handleAppChange.bind(this);
    this.handleTimeRangeChange = this.handleTimeRangeChange.bind(this);
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
    return function (timeStr, time) {
      var timeMillis = time.dateMoment.valueOf();
      if (timeMillis === self.state.timeRange[type]) {
        // not changed
        return;
      }

      self.state.timeRange[type] = timeMillis;
      console.log(self.state.timeRange['from'] + 'to:' + self.state.timeRange['to']);
    };
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
                style={{display: 'inline-block', float: 'right', marginLeft: '20px'}}
                onClick={() => this.props.actions.replayOnMap(this.state.map, this.state.hot, this.state.app, this.state.timeRange)}
        >回放行程
        </button>

        <div style={{display: 'inline-block', float: 'right'}}>
          <label style={{marginRight: '10px', marginLeft: '20px'}}>FROM</label>
          <DateField
            dateFormat="YYYY-MM-DD HH:mm:ss"
            forceValidDate={true}
            defaultValue={(new Date()).valueOf() - 86400000}
            onChange={this.handleTimeRangeChange('from')}
          >
            <DatePicker
              navigation={true}
              locale="en"
              forceValidDate={true}
              highlightWeekends={true}
              highlightToday={true}
              weekNumbers={true}
              weekStartDay={0}
            />
          </DateField>
          <label style={{marginRight: '10px', marginLeft: '10px'}}>TO</label>
          <DateField
            dateFormat="YYYY-MM-DD HH:mm:ss"
            forceValidDate={true}
            defaultValue={(new Date()).valueOf()}
            onChange={this.handleTimeRangeChange('to')}
          >
            <DatePicker
              navigation={true}
              locale="en"
              forceValidDate={true}
              highlightWeekends={true}
              highlightToday={true}
              weekNumbers={true}
              weekStartDay={0}
            />
          </DateField>
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
    replayOnMap: PropTypes.func.isRequired
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
    actions: bindActionCreators({loadApps, replayOnMap}, dispatch),
    dispatch
  };
};

export default connect(
  mapStateToProps, mapDispatchToProps
)(GdMap);
