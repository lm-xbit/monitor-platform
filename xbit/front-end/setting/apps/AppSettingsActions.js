import $ from 'jquery';
export const loadAppSettings = () => {
  return function (dispatch) {
    /*
    dispatch(appSettingsLoaded({
      status: 200,
      apps: [{
        id: '1111111',
        name: 'Type 1',
        type: 'mobile-tracking',
        key: 'app key 1'
      }, {
        id: '22222222',
        name: 'Type 2',
        type: 'Some Other App',
        key: 'app key 2'
      }]
    }));
    */
    $.get('http://127.0.0.1:3000/rest/settings/apps').always(function (resp) {
      dispatch(appSettingsLoaded(resp));
    });
  };
};

export const appSettingsLoaded = (data) => {
  var apps = data.apps;

  return {
    type: 'POPULATE_APP_SETTINGS',
    data: apps
  };
};

export const addApp = (text) => {
  return {
    type: 'APP_SETTINGS_ADD',
    text
  };
};

export const updateApp = (id, key) => {
  return {
    type: 'APP_SETTINGS_UPDATE',
    key
  };
};

export const removeApp = (id) => {
  return {
    type: 'APP_SETTINGS_REMOVE',
    id
  };
};
