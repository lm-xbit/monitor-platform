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

export const loadGdMap = (doneFunction) => {
  $.ajax({
    url: 'http://webapi.amap.com/maps?v=1.3&key=8c8f82d662831ead0c468d335f0b3733',
    dataType: 'script',
    cache: true
  }).done(function () {
    doneFunction();
  });
};
