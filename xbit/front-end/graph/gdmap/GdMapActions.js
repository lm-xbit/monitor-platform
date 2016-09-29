import $ from 'jquery';
import converter from 'coordtransform';

var offset = 1;
export const updateLocation = (map, hot, app) => {
  if (!app) {
    console.log('Application not ready. Display nothing ...');
    return;
  }

  // TODO: mobile-tracking is for testing purpose
  $.getJSON('/rest/data/' + app.key, '', function (json) {
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
        latitude: 30.681369,
        accuracy: 50,
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

      /**
       * Hide the offending circle
      if (!hot.circle) {
        hot.circle = new window.AMap.Circle({
          center: converted,
          radius: 300,
          strokeColor: '#F33',
          strokeOpacity: 1,
          strokeWeight: 1,
          fillColor: '#ee2200',
          fillOpacity: 0.35,
          map: map
        });
      } else {
        hot.circle.setCenter(converted);
      }
      */

      if (!hot.range) {
        hot.range = new window.AMap.Circle({
          center: converted,
          radius: pos.accuracy,
          strokeColor: '#FF',
          strokeOpacity: 1,
          strokeWeight: 1,
          fillColor: '#3333FF',
          fillOpacity: 0.5,
          map: map
        });
      } else {
        hot.range.setCenter(converted);
      }
    }
  });
};

export const replayOnMap = (map, hot, app, timeRange) => {
  return function (dispatch) {
    let url = '/rest/data/' + app.key;

    // add time range
    url += '?from=';
    url += timeRange['from'];
    url += '&to=';
    url += timeRange['to'];

    $.getJSON(url, '', function (json) {
      if (json.data && json.data.length > 0) {
        hot.pause = 1;
        var lineArr = [];
        var converted;
        $.each(json.data, function (n, value) {
          if (value.location.longitude && value.location.latitude) {
            converted = converter.wgs84togcj02(value.location.longitude, value.location.latitude);
            lineArr.push(new window.AMap.LngLat(converted[0], converted[1]));
            console.log(converted[0] + 'to:' + converted[1]);
          }
        });

        if (timeRange.polyline) {
          timeRange.polyline.setPath(lineArr);
          timeRange.polyline.setMap(map);
        } else {
          var polyline = new window.AMap.Polyline({
            path: lineArr,
            strokeColor: '#3366FF',
            strokeOpacity: 1,
            strokeWeight: 5,
            strokeStyle: 'solid',
            strokeDasharray: [10, 5]
          });
          polyline.setMap(map);
          timeRange.polyline = polyline;
        }

        if (!hot.marker) {
          hot.marker = new window.AMap.Marker({
            map: map,
            position: converted
          });

          // for the first time, let's focus the center ...
          map.setCenter(converted);
        } else {
          map.setCenter(lineArr[0]);
          hot.marker.moveAlong(lineArr, 80);
        }
      }
    });
  };
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
