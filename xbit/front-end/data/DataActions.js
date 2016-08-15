import $ from 'jquery';

export const refreshLocation = () => {
  console.log('will refresh');
  return function (dispatch) {
    $.getJSON('/rest/data/mobile-tracking', '', function (json) {
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
