import $ from 'jquery';

export const refreshLocation = (app, timeRange) => {
  return function (dispatch) {
    if (!app) {
      console.log('Application not ready. Display nothing ...');
      return;
    }

    var url = '/rest/data/' + app.key;

    // if we have valid timeRange, let's pass that info
    if (timeRange && timeRange.from && timeRange.to) {
      url += '?from=';
      url += timeRange.from;
      url += '&to=';
      url += timeRange.to;
    }

    console.log('Refresh data with url - ' + url);
    $.getJSON(url, '', function (json) {
      if (!json || !json.data) {
        console.log('No data retrieved. Displaying nothing ...');
        return;
      }

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
