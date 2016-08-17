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

export const commitChange = (isEditing, app, callback) => {
  return function (dispatch) {
    if (isEditing) {
      // updating
      $.post('/rest/settings/apps', app).always(function (data) {
        if (!data || data.status !== 200) {
          alert('Cannot update the application - ' + data ? data.message : 'Unknown error');
        } else {
          dispatch({
            type: 'POPULATE_APP_SETTINGS',
            data: data.apps
          });

          callback();
        }
      });
    } else {
      // creating
      $.ajax('/rest/settings/apps', {
        method: 'PUT',
        data: app
      }).always(function (data) {
        if (!data || data.status !== 200) {
          alert('Cannot create the application - ' + data ? data.message : 'Unknown error');
        } else {
          dispatch({
            type: 'POPULATE_APP_SETTINGS',
            data: data.apps
          });

          callback();
        }
      });
    }
  };
};
