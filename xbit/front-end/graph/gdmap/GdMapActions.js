import $ from 'jquery';

export const getLocation = (map) => {
  $.getJSON('/rest/data/mobile-tracking', '', function (json) {
    map.setZoom(14);
    var latestData = json.data[json.data.length - 1];
    map.setCenter([latestData.location.longitude, latestData.location.latitude]);
    var marker = new window.AMap.Marker({
      position: [latestData.location.longitude, latestData.location.latitude],
      map: map
    });
  });
};
