import $ from 'jquery';

export const loadBasicSettings = () => {
  return function (dispatch) {
    /*
    dispatch(basicSettingsLoaded({
      status: 200,
      settings: {
        username: 'Test User',
        email: 'test@somewhere.com',
        password: 'test'
      }
    }));
    */
    $.get('/rest/settings/basic').always(function (resp) {
      dispatch(basicSettingsLoaded(resp));
    });
  };
};

export const basicSettingsLoaded = (data) => {
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

