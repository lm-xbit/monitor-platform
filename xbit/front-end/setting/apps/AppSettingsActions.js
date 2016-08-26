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

export const removeApp = (key) => {
  return function (dispatch) {
    // creating
    $.ajax('/rest/settings/apps/' + key, {
      method: 'DELETE'
    }).always(function (data) {
      if (!data || data.status !== 200) {
        alert('Cannot delete the application - ' + data ? data.message : 'Unknown error');
      } else {
        dispatch({
          type: 'POPULATE_APP_SETTINGS',
          data: data.apps
        });
      }
    });
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
