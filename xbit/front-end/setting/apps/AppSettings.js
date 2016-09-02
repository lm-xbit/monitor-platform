import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import React, {PropTypes} from 'react';
import {loadAppSettings, starApp, removeApp, commitChange} from './AppSettingsActions';
import Modal from 'react-modal';
import QRCode from 'qrcode.react';
import ReactTooltip from 'react-tooltip';
import $ from 'jquery';

export class AppSettings extends React.Component {
  constructor (props) {
    super(props);

    var http = location.protocol;
    var slashes = http.concat('//');
    var host = slashes.concat(window.location.host);

    this.state = {
      base: host,
      modalIsOpen: false,
      connectInProgress: false,
      isEditing: false,
      currentApp: {
        name: '',
        type: '',
        description: '',
        key: ''
      },
      connectTimer: null,
      connectInfo: null
    };

    this.closeModal = this.closeModal.bind(this);
    this.closeConnectModal = this.closeConnectModal.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.createApplication = this.createApplication.bind(this);
    this.updateApplication = this.updateApplication.bind(this);
    this.starApplication = this.starApplication.bind(this);
    this.commitChange = this.commitChange.bind(this);
    this.removeApplication = this.removeApplication.bind(this);
    this.connectApplication = this.connectApplication.bind(this);
  }

  componentDidMount () {
    this.props.actions.loadAppSettings();
  }

  handleInputChange (name) {
    var self = this;
    return function (event) {
      self.state.currentApp[name] = event.target.value;
      self.forceUpdate();
    };
  }

  createApplication () {
    this.setState({isEditing: false, currentApp: {
      name: '',
      type: '',
      description: '',
      key: ''
    }});

    this.setState({modalIsOpen: true});
  }

  connectApplication (app) {
    var self = this;
    $.get('/rest/settings/connect/' + app.key).always(function (resp) {
      if (resp.status !== 200) {
        alert('Operation failed! Please try again.');
        return;
      }

      var timer = setInterval(function () {
        $.get('/rest/settings/status/' + app.key).always(function (resp2) {
          console.log('status query - ' + JSON.stringify(resp2));

          if (resp2.status === 200) {
            clearInterval(timer);
            app.connected = true;
            app.connectedOn = resp2.data.connectedOn;
            self.setState({connectInProgress: false, connectTimer: null, connectInfo: null});
            self.forceUpdate();
          }
        });
      }, 5000);

      self.setState({connectInProgress: true, connectTimer: timer, connectInfo: resp.data});
    });
  }

  updateApplication (app) {
    this.setState({isEditing: true, currentApp: app});

    this.setState({modalIsOpen: true});
  }

  starApplication (app) {
    if (confirm('Are you sure to make this application the primary application?')) {
      this.props.actions.starApp(app.key);
    }
  }

  removeApplication (app) {
    if (confirm('Are you sure to remove this application?')) {
      this.props.actions.removeApp(app.key);
    }
  }

  closeModal () {
    this.setState({modalIsOpen: false});
  }

  closeConnectModal () {
    if (this.state.connectTimer) {
      clearInterval(this.state.connectTimer);
    }

    this.setState({connectInProgress: false, connectTimer: null, connectInfo: null});
  }

  getAppStatus (app) {
    if (app.connected) {
      return 'Connected at ' + app.connectedOn;
    } else {
      return 'Not connected!';
    }
  }

  getAppActivity (app) {
    if (app.lastReportedOn) {
      return 'Last Reported at ' + app.lastReportedOn;
    } else {
      return 'No Activity Detected';
    }
  }

  commitChange () {
    if (this.state.currentApp.name.trim() === '') {
      alert('You must give a name to this application');
      return;
    }

    if (this.state.currentApp.type.trim() === '') {
      alert('You must select a type for this application');
      return;
    }

    if (this.state.currentApp.key.trim() === '') {
      // this is a new APP, CREATING
      console.log('Try creating app', this.state.currentApp);
    } else {
      // this is an existing app, UPDATING
      console.log('Try updating app', this.state.currentApp);
    }

    var self = this;
    this.props.actions.commitChange(this.state.isEditing, this.state.currentApp, function () {
      self.closeModal();
    });
  }

  render () {
    return (
      <div>
        <div style={{'paddingBottom': '10px', 'borderBottom': '2px solid', height: '42px', 'lineHeight': '30px'}}>
          Current Applications
          <button className="btn btn-sm btn-success" onClick={e => {
            this.createApplication();
            e.preventDefault();
          }} style={{float: 'right'}}
          ><i className="fa fa-plus"/>&nbsp;&nbsp;New...</button>
        </div>

        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th style={{width: '30px'}}>&nbsp;</th>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Last Activity</th>
                <th>&nbsp;</th>
              </tr>
            </thead>
            <tbody>
            {this.props.apps.map(app =>
              <tr style={{height: '30px', width: '30px'}}>
                <td style={{'lineHeight': '30px', 'paddingTop': '15px'}}>
                  <i style={{
                    color: 'green',
                    display: app.primary ? 'inherit' : 'none'
                  }} className='fa fa-star'
                  />
                </td>
                <td style={{'lineHeight': '30px'}}>{app.name}</td>
                <td style={{'lineHeight': '30px'}}>{app.type}</td>
                <td style={{'lineHeight': '30px'}}>{this.getAppStatus(app)}</td>
                <td style={{'lineHeight': '30px'}}>{this.getAppActivity(app)}</td>
                <td style={{'lineHeight': '30px', 'minWidth': '120px'}}>
                  <button className="btn btn-xs btn-success" onClick={e => {
                    this.connectApplication(app);
                    e.preventDefault();
                  }} data-tip="Connect or re-connect this application ..."
                  >
                    <i className="fa fa-plug" style={{
                      display: app.connected ? 'none' : 'inherit'
                    }}/>
                    <i className="fa fa-retweet" style={{
                      display: app.connected ? 'inherit' : 'none'
                    }}/>
                  </button>
                  &nbsp;&nbsp;
                  <button className="btn btn-xs btn-danger" onClick={e => {
                    this.removeApplication(app);
                    e.preventDefault();
                  }} data-tip="Delete this application ..."
                  >
                    <i className="fa fa-remove"/>
                  </button>
                  &nbsp;&nbsp;
                  <button className="btn btn-xs btn-warning" onClick={e => {
                    this.updateApplication(app);
                    e.preventDefault();
                  }} data-tip="Edit and update information of this application ..."
                  >
                    <i className="fa fa-edit"/>
                  </button>
                  &nbsp;&nbsp;
                  <button className='btn btn-xs btn-success' style={{
                    display: app.primary ? 'none' : 'inherit'
                  }} onClick={e => {
                    this.starApplication(app);
                    e.preventDefault();
                  }} data-tip="Make this application my primary application ..."
                  >
                    <i className='fa fa-star'/>
                  </button>
                </td>
              </tr>
            )}
            </tbody>
          </table>
        </div>

        <Modal
          className="modal-dialog"
          isOpen={this.state.modalIsOpen}
          onRequestClose={this.closeModal}
          shouldCloseOnOverlayClick={false}
        >
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close" onClick={this.closeModal}>
                <span>&times;</span>
                <span className="sr-only">Close</span>
              </button>
              <h4 className="modal-title" style={{
                display: this.state.isEditing ? 'none' : 'inherit'
              }}>Create New Application ...</h4>

              <h4 className="modal-title" style={{
                display: this.state.isEditing ? 'inherit' : 'none'
              }}>Updating Application ...</h4>
            </div>
            <div className="modal-body">
              <form>
                <div className="form-group">
                  <label className="control-label" htmlFor="name">Name</label>
                  <input className="form-control" id="name" name="name" value={this.state.currentApp.name} onChange={this.handleInputChange('name')} placeholder="Name of the app"/>
                </div>
                <div className="form-group">
                  <label className="control-label" htmlFor="type">Type</label>
                  <select className="form-control" id="type" name="type" value={this.state.currentApp.type} disabled={this.state.isEditing} onChange={this.handleInputChange('type')}>
                    <option value="">--------Select--------</option>
                    <option value="mobile-tracking">Mobile Tracking</option>
                    <option value="not-exist">Fancy Future Application</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="control-label" htmlFor="key">Key</label>
                  <input className="form-control" id="key" name="key" readOnly value={this.state.currentApp.key} placeholder="System will automatically generate key for this app"/>
                </div>
                <div className="form-group" style={{
                  display: this.state.currentApp.type === '' ? 'none' : 'inherit'
                }}>
                  <label className="control-label" htmlFor="url">Download App</label>
                  <QRCode value={this.state.base + '/downloads/android/' + this.state.currentApp.type + '.apk'}/>
                </div>
                <div className="form-group">
                  <label className="control-label" htmlFor="description">Description</label>
                  <textarea className="form-control" id="description" name="description" value={this.state.currentApp.description} onChange={this.handleInputChange('description')} placeholder="Description of the app"/>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-default" onClick={this.closeModal}>Close</button>
              <button type="button" className="btn btn-primary" onClick={this.commitChange}>Save changes</button>
            </div>
          </div>
        </Modal>

        <Modal
          className="modal-dialog modal-sm"
          isOpen={this.state.connectInProgress}
          onRequestClose={this.closeConnectModal}
          shouldCloseOnOverlayClick={false}
        >
          <div className="modal-content" style={{
            width: '300px'
          }}>
            <div className="modal-body">
              <form>
                <div className="form-group">
                  <label className="control-label">Direction</label>
                  <div>Please install the download APP first, then using the installed APP to scan below QR Code.</div>
                  <div>
                    <div style={{
                      'padding-top': '20px',
                      width: '50%',
                      margin: '0 auto'
                    }}>
                      <QRCode value={JSON.stringify(this.state.connectInfo)}/>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-default" onClick={this.closeConnectModal}>Abort ...</button>
            </div>
          </div>
        </Modal>
        <ReactTooltip />
      </div>
    );
  }
};

AppSettings.propTypes = {
  apps: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    key: PropTypes.string.isRequired,
    primary: PropTypes.bool.isRequired,
    connected: PropTypes.bool.isRequired,
    connectedOn: PropTypes.any.isRequired,
    connectCode: PropTypes.string.isRequired,
    connectInfo: PropTypes.string.isRequired,
    lastReportedOn: PropTypes.any.isRequired
  }).isRequired).isRequired,
  actions: React.PropTypes.shape({
    loadAppSettings: PropTypes.func.isRequired,
    starApp: PropTypes.func.isRequired,
    removeApp: PropTypes.func.isRequired,
    commitChange: PropTypes.func.isRequired
  })
};

const mapStateToProps = (state) => {
  console.log('Try render APP state', state.settings);

  return {
    apps: state.settings.apps
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    actions: bindActionCreators({loadAppSettings, starApp, removeApp, commitChange}, dispatch),
    dispatch
  };
};

export default connect(
  mapStateToProps, mapDispatchToProps
)(AppSettings);
