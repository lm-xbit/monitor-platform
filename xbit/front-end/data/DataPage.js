import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import React, {PropTypes} from 'react';
import {refreshLocation} from './DataActions';

export class DataPage extends React.Component {
  componentWillMount () {
    console.log('will mount');
    this.props.actions.refreshLocation();
  }
  render () {
    let input;
    return (
      <div>
        <button type="button" className="btn btn-primary" onClick={() => this.props.actions.refreshLocation()}>立即刷新</button>
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
  actions: React.PropTypes.shape({
    refreshData: PropTypes.func.isRequired
  })
};

const mapStateToProps = (state) => {
  return {
    locations: state.datapage || []
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    actions: bindActionCreators({refreshLocation}, dispatch),
    dispatch
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DataPage);
