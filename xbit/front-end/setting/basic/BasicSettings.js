import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import React, {PropTypes} from 'react';
import {loadBasicSettings, saveUsername, changePassword} from './BasicSettingsActions';

export class BasicSettings extends React.Component {

  constructor (props) {
    super(props);
    this.state = {
      editingUsername: false,
      changingPassword: false
    };

    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.handleUsernameChange = this.handleUsernameChange.bind(this);
  }

  componentDidMount () {
    console.log('Component loading! Simulating loading data ....');

    this.props.actions.loadBasicSettings();
    /*
    this.serverRequest = $.get(this.props.source, function (result) {
      var lastGist = result[0];
      this.setState({
        username: lastGist.owner.login,
        lastGistUrl: lastGist.html_url
      });
    }.bind(this));
    */
  }

  componentWillUnmount () {
    console.log('Component unloading ...');
    // this.serverRequest.abort();
  }

  handleUsernameChange (event) {
    this.props.basic.username = event.target.value;

    /**
     * If is state, use this.setState to change, otherwise if we use props, we must call forceUpdate ...
     */
    this.forceUpdate();
  }

  handlePasswordChange (event) {
    this.props.basic.password = event.target.value;
    this.forceUpdate();
  }

  render () {
    let username;
    let password;
    let oldpass;
    let newpass;
    let newpass2;
    return (
      <div>
        <form>
          <div className="form-group">
            <label htmlFor="username">Username
              <div style={{
                float: 'right'
              }}>
                <a onClick={e => {
                  e.preventDefault();
                  this.setState({
                    editingUsername: true
                  });
                }} style={{
                  display: this.state.editingUsername ? 'none' : 'inherit'
                }}
                >Change Username</a>
                <a onClick={e => {
                  e.preventDefault();
                  // console.log('Update username to - ' + username.value);
                  this.props.actions.saveUsername(
                    this.props.basic.email,
                    username.value
                  );
                  /*
                  this.props.dispatch(
                    this.props.actions.saveUsername(
                      this.props.basic.email,
                      username.value
                    ));
                  */

                  this.setState({
                    editingUsername: false
                  });
                }} style={{
                  display: this.state.editingUsername ? 'inherit' : 'none'
                }}
                >Save</a>
              </div>
            </label>
            <input className="form-control" id="username" name="username" value={this.props.basic.username} onChange={this.handleUsernameChange} disabled={
              !this.state.editingUsername
            } style={{
              width: '100%'
            }} ref={node => {
              username = node;
            }}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input className="form-control" id="email" name="email" type="email" value={this.props.basic.email} disabled="true" style={{
              width: '100%'
            }}/>
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input className="form-control" id="phone" name="phone" value={this.props.basic.phone} disabled="true" style={{
              width: '100%'
            }}/>
          </div>
          <div className="form-group">
            <label htmlFor="username">Password
              <div style={{
                float: 'right'
              }}>
                <a onClick={e => {
                  e.preventDefault();
                  this.setState({
                    changingPassword: true
                  });
                }} style={{
                  display: this.state.changingPassword ? 'none' : 'inherit'
                }}
                >Change Password</a>
              </div>
            </label>
            <div style={{
              display: this.state.changingPassword ? 'none' : 'block',
              width: '100%'
            }}>
              <input className="form-control" id="password" name="password" type="password" style={{
                width: '100%'
              }} value={this.props.basic.password} onChange={this.handlePasswordChange} readOnly="true" ref={node => {
                password = node;
              }}
              />
            </div>
            <div style={{
              display: this.state.changingPassword ? 'block' : 'none',
              width: '100%'
            }}>
              <div className="input-group" style={{
                width: '100%'
              }}>
                <label className="control-label col-sm-4" htmlFor="password">Old Password</label>
                <div className="col-sm-8">
                  <input className="form-control" id="password" name="password" type="password" style={{
                    width: '100%'
                  }} ref={node => {
                    oldpass = node;
                  }}
                  />
                </div>
              </div>

              <div className="input-group" style={{
                width: '100%'
              }}>
                <label className="control-label col-sm-4" htmlFor="newPassword">New Password</label>
                <div className="col-sm-8">
                  <input className="form-control" id="newPassword" name="newPassword" type="password" style={{
                    width: '100%'
                  }} ref={node => {
                    newpass = node;
                  }}
                  />
                </div>
              </div>

              <div className="input-group" style={{
                width: '100%'
              }}>
                <label className="control-label col-sm-4" htmlFor="repeatPassword">Repeat Password</label>
                <div className="col-sm-8">
                  <input className="form-control" id="repeatPassword" name="repeatPassword" type="password" style={{
                    width: '100%'
                  }} ref={node => {
                    newpass2 = node;
                  }}
                  />
                </div>
              </div>

              <div className="input-group" style={{
                width: '100%'
              }}>
                <label className="control-label col-sm-4">&nbsp;</label>
                <div className="col-sm-8">
                  <button className="form-control btn btn-warning" onClick={e => {
                    e.preventDefault();
                    if (oldpass.value === '') {
                      alert('You must input your old password!');
                      return;
                    }

                    if (newpass.value === '') {
                      alert('New password must be provided!');
                      return;
                    }

                    if (newpass.value !== newpass2.value) {
                      alert('Repeated password incorrect!');
                      return;
                    }

                    if (newpass.value === oldpass.value) {
                      console.log('Password not changed');
                    } else {
                      // password.value = newpass.value;
                      this.props.actions.changePassword(this.props.basic.email, oldpass.value, newpass.value);
                    }

                    this.setState({
                      changingPassword: false
                    });
                  }}>Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }
};

BasicSettings.propTypes = {
  basic: PropTypes.shape({
    username: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    phone: PropTypes.string.isRequired,
    password: PropTypes.string.isRequired
  }),
  actions: PropTypes.shape({
    loadBasicSettings: PropTypes.func.isRequired,
    saveUsername: PropTypes.func.isRequired,
    changePassword: PropTypes.func.isRequired
  })
};

const mapStateToProps = (state) => {
  console.log('Try render BASIC state', state.settings);

  return {
    basic: state.settings.basic
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    actions: bindActionCreators({saveUsername, changePassword, loadBasicSettings}, dispatch),
    dispatch
  };
};

export default connect(
  mapStateToProps, mapDispatchToProps
)(BasicSettings);
