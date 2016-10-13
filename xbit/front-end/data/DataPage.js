import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import React, {PropTypes} from 'react';
import {refreshLocation, loadApps} from './DataActions';
import {TransitionView, Calendar, DateField, DatePicker} from 'react-date-picker';
import 'react-date-picker/index.css';

export class DataPage extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      app: null,
      timeRange: {
        from: +Date.now() - 3600 * 1000,
        to: +Date.now()
      }
    };

    this.handleAppChange = this.handleAppChange.bind(this);
    this.handleTimeRangeChange = this.handleTimeRangeChange.bind(this);
  }

  componentWillMount () {
    console.log('will mount');

    this.props.actions.loadApps();
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
    this.props.actions.refreshLocation(this.state.app);
  };

  handleAppChange (event) {
    var key = event.target.value;
    var selected = null;

    this.props.apps.forEach(app => {
      if (app.key === key) {
        selected = app;
      }
    });

    this.state.app = selected;

    this.props.actions.refreshLocation(this.state.app, this.state.timeRange);
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
    };
  }

  render () {
    // let input;
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

    return (
      <div>
        <div style={{paddingRight: '200px'}}>
          <label style={{marginRight: '10px', display: 'inline-block', float: 'left', paddingTop: '5px'}}>Select Application</label>
          <select className="form-control" style={{display: 'inline-block', float: 'left', width: '150px'}} id="app"
                  name="app" defaultValue={primary ? primary.key : ''} onChange={this.handleAppChange}
          >
            {
              this.props.apps.map(
                app => <option value={app.key}>{app.name}</option>
              )
            }
          </select>
          <button type="button" className="btn btn-primary"
                  style={{display: 'inline-block', float: 'right', marginLeft: '20px'}}
                  onClick={() => this.props.actions.refreshLocation(this.state.app, this.state.timeRange)}
          >立即刷新
          </button>
          <div style={{display: 'inline-block', float: 'right'}}>
            <label style={{marginRight: '10px', marginLeft: '20px'}}>FROM</label>
            <DateField
              dateFormat="YYYY-MM-DD HH:mm:ss"
              forceValidDate={true}
              position="right"
              defaultValue={this.state.timeRange.from}
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
              defaultValue={this.state.timeRange.to}
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

        </div>
        <table className="table table-striped">
          <thead> <tr>
            <th>时间</th>
            <th>经度</th>
            <th>纬度</th>
            <th>高度（米）</th>
            <th>精度（米）</th>
          </tr> </thead>
          <tbody>
          {this.props.locations.map(app =>
            <tr style={{height: '30px'}}>
              <td style={{lineHeight: '30px'}}>{new Date(app.timestamp).toString()}</td>
              <td style={{lineHeight: '30px'}}>{app.longitude}</td>
              <td style={{lineHeight: '30px'}}>{app.latitude}</td>
              <td style={{lineHeight: '30px'}}>{app.altitude}</td>
              <td style={{lineHeight: '30px'}}>{app.accuracy}</td>
            </tr>
          )}
          </tbody>
        </table>
      </div>
    );
  }
};

DataPage.propTypes = {
  locations: PropTypes.arrayOf(PropTypes.shape({
    timestamp: PropTypes.number.isRequired,
    longitude: PropTypes.number.isRequired,
    latitude: PropTypes.number.isRequired,
    altitude: PropTypes.number.isRequired,
    accuracy: PropTypes.number.isRequired
  }).isRequired).isRequired,
  apps: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    key: PropTypes.string.isRequired,
    primary: PropTypes.bool.isRequired,
  }).isRequired).isRequired,
  actions: React.PropTypes.shape({
    refreshLocation: PropTypes.func.isRequired,
    loadApps: PropTypes.func.isRequired,

  })
};

const mapStateToProps = (state) => {
  return {
    locations: state.datapage.locations,
    apps: state.datapage.apps
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    actions: bindActionCreators({refreshLocation, loadApps}, dispatch),
    dispatch
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DataPage);
