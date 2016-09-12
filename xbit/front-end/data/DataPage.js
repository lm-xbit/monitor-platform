import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import React, {PropTypes} from 'react';
import {refreshLocation, loadApps} from './DataActions';
require('react-datetime');

export class DataPage extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      app: null
    };

    this.handleAppChange = this.handleAppChange.bind(this);
  }

  componentWillMount () {
    console.log('will mount');
    // this.props.actions.refreshLocation(this.state.app);
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
    // this.forceUpdate();
    this.props.actions.refreshLocation(this.state.app);
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

    this.state.app = primary;
    return (
      <div>
        <select className="form-control" style={{display: 'inline-block', float: 'left', width: '200px'}} id="app" name="app" defaultValue={primary ? primary.key : ''} onChange={this.handleAppChange}>
          {
            this.props.apps.map(
              app => <option value={app.key}>{app.name}</option>
            )
          }
        </select>
        <button type="button" className="btn btn-primary" style={{display: 'inline-block', float: 'left'}}
  onClick={() => this.props.actions.refreshLocation(this.state.app)}>立即刷新</button>
        <table className="table table-striped">
          <thead>
            <tr>
              <th>时间</th>
              <th>经度</th>
              <th>纬度</th>
              <th>高度（米）</th>
              <th>精度（米）</th>
            </tr>
          </thead>
          <tbody>
            {this.props.locations.map(app =>
              <tr style={{height: '30px'}}>
                <td style={{'line-height': '30px'}}>{new Date(app.timestamp).toString()}</td>
                <td style={{'line-height': '30px'}}>{app.longitude}</td>
                <td style={{'line-height': '30px'}}>{app.latitude}</td>
                <td style={{'line-height': '30px'}}>{app.altitude}</td>
                <td style={{'line-height': '30px'}}>{app.accuracy}</td>
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
    primary: PropTypes.bool.isRequired
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
