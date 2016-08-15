import $ from 'jquery';
export const loadAppSettings = () => {
  return function (dispatch) {
    $.get('/rest/settings/apps').always(function (resp) {
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
