import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import React, {PropTypes} from 'react';
import {addApp, updateApp, removeApp} from './AppSettingsActions';

export class AppSettings extends React.Component {
  render () {
    return (
      <div>
        <div style={{'padding-bottom': '10px', 'border-bottom': '2px solid', height: '42px', 'line-height': '30px'}}>
          Current Applications
          <button className="btn btn-sm btn-success" onClick={e => {
            e.preventDefault();
          }} style={{float: 'right'}}
          ><i className="fa fa-plus"/>&nbsp;&nbsp;New...</button>
        </div>

        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Key</th>
              <th>&nbsp;</th>
            </tr>
            </thead>
            <tbody>
            {this.props.apps.map(app =>
              <tr style={{height: '30px'}}>
                <td style={{'line-height': '30px'}}>{app.name}</td>
                <td style={{'line-height': '30px'}}>{app.type}</td>
                <td style={{'line-height': '30px'}}>{app.key}</td>
                <td style={{'line-height': '30px'}}>
                  <button className="btn btn-sm btn-danger"><i className="fa fa-remove"/></button>
                  &nbsp;&nbsp;
                  <button className="btn btn-sm btn-warning"><i className="fa fa-edit"/></button>
                </td>
              </tr>
            )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
};

AppSettings.propTypes = {
  apps: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    key: PropTypes.string.isRequired
  }).isRequired).isRequired,
  actions: React.PropTypes.shape({
    addApp: PropTypes.func.isRequired,
    updateApp: PropTypes.func.isRequired,
    removeApp: PropTypes.func.isRequired
  })
};

const mapStateToProps = (state) => {
  return {
    apps: state.settings.apps
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    actions: bindActionCreators({addApp, updateApp, removeApp}, dispatch),
    dispatch
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AppSettings);
