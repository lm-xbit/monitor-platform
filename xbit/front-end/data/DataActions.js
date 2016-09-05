import $ from 'jquery';

export const refreshLocation = (app) => {
  if (!app) {
    console.log('Application not ready. Display nothing ...');
    return;
  }
  console.log('will refresh');
  return function (dispatch) {
    $.getJSON('/rest/data/' + app.key, '', function (json) {
      dispatch(locationGot(json.data));
    });
  };
};

export const locationGot = (resp) => {
  let locations = resp.map(function (location) {
    return {
      timestamp: location.timestamp,
      latitude: location.location.latitude,
      longitude: location.location.longitude,
      altitude: location.location.altitude,
      accuracy: location.location.accuracy
    };
  });
  return {
    type: 'DISPLAY_LOCATION',
    locations
  };
};

export const loadApps = () => {
  return function (dispatch) {
    $.get('/rest/settings/apps').always(function (data) {
      if (!data || data.status !== 200) {
        alert('Cannot load applications - ' + data ? data.message : 'Unknown error');
      } else {
        dispatch({
          type: 'POPULATE_APP_SETTINGS',
          data: data.apps
        });
      }
    });
  };
};
