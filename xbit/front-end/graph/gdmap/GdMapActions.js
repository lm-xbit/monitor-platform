import $ from 'jquery';
import converter from 'coordtransform';

export const getLocation = (map) => {
  $.getJSON('/rest/data/mobile-tracking', '', function (json) {
    map.setZoom(14);
    if (json.data && json.data.length > 0) {
      var latestData = json.data[json.data.length - 1];
      var converted = converter.wgs84togcj02(latestData.location.longitude, latestData.location.latitude);

      map.setCenter(converted);
      var marker = new window.AMap.Marker({
        // position: [latestData.location.longitude, latestData.location.latitude],
        position: [converted[0], converted[1]],
        map: map
      });
      addCircle(map, converted);
    }
  });
};

export const loadGdMap = (doneFunction) => {
  $.ajax({
    url: 'http://webapi.amap.com/maps?v=1.3&key=8c8f82d662831ead0c468d335f0b3733',
    dataType: 'script',
    cache: true
  }).done(function () {
    doneFunction();
    // setInterval('getLocation(map)', 1000);
  });
};

function addCircle (map, converted) {
  var circle = new window.AMap.Circle({
    center: new window.AMap.LngLat(converted[0], converted[1]),
    radius: 300,
    strokeColor: '#F33',
    strokeOpacity: 1,
    strokeWeight: 3,
    fillColor: '#ee2200',
    fillOpacity: 0.35
  });
  circle.setMap(map);
};
