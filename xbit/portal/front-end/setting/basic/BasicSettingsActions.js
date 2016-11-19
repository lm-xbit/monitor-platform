import $ from 'jquery';

export const loadBasicSettings = () => {
  return function (dispatch) {
    $.get('/rest/settings/basic').always(function (resp) {
      dispatch(basicSettingsLoaded(resp));
    });
  };
};

export const saveUsername = (email, username) => {
  return function (dispatch) {
    $.post('/rest/settings/username/' + email, {
      username: username
    }).always(function (resp) {
      dispatch(basicSettingsLoaded(resp));
    });
  };
};

export const changePassword = (email, oldpass, newpass) => {
  return function (dispatch) {
    $.post('/rest/settings/password/' + email, {
      oldpass: oldpass,
      newpass: newpass
    }).always(function (resp) {
      dispatch(basicSettingsLoaded(resp));
    });
  };
};

export const basicSettingsLoaded = (data) => {
  if (data.status !== 200) {
    alert('Found server error - ' + data.message);
    return {
      type: 'UPDATE_BASIC_SETTINGS_FAILURE'
    };
  }

  var settings = data.settings;

  return {
    type: 'POPULATE_BASIC_SETTINGS',
    data: settings
  };
};

export const updateUsername = (username) => {
  return {
    type: 'UPDATE_USERNAME',
    username
  };
};

