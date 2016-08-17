import $ from 'jquery';
import converter from 'coordtransform';

var offset = 1;
export const updateLocation = (map, hot) => {
  $.getJSON('/rest/data/mobile-tracking', '', function (json) {
    // long, lat
    var pos = null;

    if (json.data && json.data.length > 0) {
      pos = json.data[json.data.length - 1].location;
    } else {
      /**
       * Testing purpose. Let's remove this in production environment
       * @type {{longitude: number, latitude: number}}
       */
      pos = {
        longitude: 103.982584 + ++offset * 0.0001,
        latitude: 30.681369
      };
    }

    if (pos) {
      var converted = converter.wgs84togcj02(pos.longitude, pos.latitude);

      if (!hot.marker) {
        hot.marker = new window.AMap.Marker({
          map: map,
          position: converted
        });

        // for the first time, let's focus the center ...
        map.setCenter(converted);
      } else {
        hot.marker.setPosition(converted);
      }

      if (!hot.circle) {
        hot.circle = new window.AMap.Circle({
          center: converted,
          radius: 300,
          strokeColor: '#F33',
          strokeOpacity: 1,
          strokeWeight: 3,
          fillColor: '#ee2200',
          fillOpacity: 0.35,
          map: map
        });
      } else {
        hot.circle.setCenter(converted);
      }
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
  });
};

