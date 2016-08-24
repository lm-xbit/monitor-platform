import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import React, {PropTypes} from 'react';
import {loadAppSettings, removeApp, commitChange} from './AppSettingsActions';
import Modal from 'react-modal';
import QRCode from 'qrcode.react';

export class AppSettings extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      modalIsOpen: false,
      connectInProgress: false,
      isEditing: false,
      currentApp: {
        name: '',
        type: '',
        description: '',
        key: ''
      }
    };

    this.closeModal = this.closeModal.bind(this);
    this.closeConnectModal = this.closeConnectModal.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.createApplication = this.createApplication.bind(this);
    this.updateApplication = this.updateApplication.bind(this);
    this.commitChange = this.commitChange.bind(this);
    this.updateApplication = this.updateApplication.bind(this);
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
    this.setState({connectInProgress: true, currentApp: app});
  }

  updateApplication (app) {
    this.setState({isEditing: true, currentApp: app});

    this.setState({modalIsOpen: true});
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
    this.setState({connectInProgress: false});
  }

  getAppStatus (app) {
    if (app.connected) {
      return 'Connected on ' + app.connectedOn;
    } else {
      return 'Not connected!';
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
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>&nbsp;</th>
              </tr>
            </thead>
            <tbody>
            {this.props.apps.map(app =>
              <tr style={{height: '30px'}}>
                <td style={{'lineHeight': '30px'}}>{app.name}</td>
                <td style={{'lineHeight': '30px'}}>{app.type}</td>
                <td style={{'lineHeight': '30px'}}>{this.getAppStatus(app)}</td>
                <td style={{'lineHeight': '30px'}}>
                  <button className="btn btn-xs btn-success" onClick={e => {
                    this.connectApplication(app);
                    e.preventDefault();
                  }}>
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
                  }}><i className="fa fa-remove"/></button>
                  &nbsp;&nbsp;
                  <button className="btn btn-xs btn-warning" onClick={e => {
                    this.updateApplication(app);
                    e.preventDefault();
                  }}><i className="fa fa-edit"/></button>
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
                  <QRCode value={'This is the download link for ' + this.state.currentApp.type}/>
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
                      <QRCode value={'This is the connect information for ' + this.state.currentApp.name}/>
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
    connected: PropTypes.bool.isRequired,
    connectedOn: PropTypes.any.isRequired,
    connectCode: PropTypes.string.isRequired,
    connectInfo: PropTypes.string.isRequired
  }).isRequired).isRequired,
  actions: React.PropTypes.shape({
    loadAppSettings: PropTypes.func.isRequired,
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
    actions: bindActionCreators({loadAppSettings, removeApp, commitChange}, dispatch),
    dispatch
  };
};

export default connect(
  mapStateToProps, mapDispatchToProps
)(AppSettings);
