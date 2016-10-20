import $ from 'jquery';
import converter from 'coordtransform';
import moment from 'moment';

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

/**
 * Replay locations. Locations already been converted
 * @param map
 * @param replay
 */
export const replayLocation = (map, replay) => {
  console.log('Try replay ' + replay.data.length + ' locations. Past positions: ' + replay.past.length + ', future positions: ' + replay.future.length);
  var pos = replay.data[replay.index];

  var loc = new window.AMap.LngLat(pos.location.longitude, pos.location.latitude);
  if (!replay.marker) {
    replay.marker = new window.AMap.Marker({
      map: map,
      position: loc
    });
  } else {
    replay.marker.setPosition(loc);
  }

  replay.marker.setLabel({
    offset: new window.AMap.Pixel(-20, 40),
    content: moment(pos.timestamp).format('YYYY-MM-DD HH:mm:ss')
  });

  // for the first time, let's focus the center ...
  map.setCenter(loc);

  if (!replay.range) {
    replay.range = new window.AMap.Circle({
      center: loc,
      radius: pos.accuracy,
      strokeColor: '#F33',
      strokeOpacity: 1,
      strokeWeight: 1,
      fillColor: '#ee2200',
      fillOpacity: 0.35,
      map: map
    });
  } else {
    replay.range.setCenter(loc);
    replay.range.setRadius(pos.accuracy);
  }

  // the polyPast & polyFuture
  if (replay.past.length === 0) {
    replay.past.push(loc);
  } else if (!loc.equals(replay.past[replay.past.length - 1])) {
    replay.past.push(loc);
  }

  if (replay.past.length >= 2) {
    if (replay.polyPast) {
      replay.polyPast.setPath(replay.past);
    } else {
      replay.polyPast = new window.AMap.Polyline({
        map: map,
        path: replay.past,
        strokeColor: '#3366FF',
        strokeOpacity: 0.5,
        strokeWeight: 5,
        strokeStyle: 'solid',
      });
    }
  }

  if (replay.future.length >= 2) {
    if (replay.polyFuture) {
      replay.polyFuture.setPath(replay.future);
    } else {
      replay.polyFuture = new window.AMap.Polyline({
        map: map,
        path: replay.future,
        strokeColor: '#3366FF',
        strokeOpacity: 0.5,
        strokeWeight: 5,
        strokeStyle: 'dashed',
        strokeDasharray: [10, 5]
      });
    }
  } else {
    if (replay.polyFuture) {
      replay.polyFuture.hide();
      replay.polyFuture.setMap(null);
      replay.polyFuture = null;
    }
  }
};

/**
 *
 * @param key
 * @param timeRange
 * @param callback accept two parameters, callback(err, data)
 * @returns {Function}
 */
export const startReplay = function (key, timeRange, interval, callback) {
  return function (dispatch) {
    let url = '/rest/data/' + key;

    // add time range
    url += '?from=';
    url += timeRange['from'];
    url += '&to=';
    url += timeRange['to'];
    url += '&aggs=';
    url += interval;

    $.getJSON(url, '', function (json) {
      /**
       * Faked data
       */
      /*
      if ((type % 4) === 0) {
        json = {
          status: 400,
          message: 'Not found'
        };
      } else if ((type % 4) === 1) {
        json = {
          status: 200,
          message: 'OK',
          data: []
        };
      } else if ((type % 4) === 2) {
        json = {
          status: 200,
          message: 'OK',
          data: [{
            longitude: 103.982584,
            latitude: 30.681369,
            accuracy: 50
          }]
        };
      } else {
      */
      /*
      if (json.status === 200) {
        json = {
          status: 200,
          message: 'OK',
          data: []
        };

        for (var i = 0; i < 10; i++) {
          var pos = {
            longitude: 103.982584 + i * 0.01,
            latitude: 30.681369 + i * 0.005,
            accuracy: 50
          };

          json.data.push(pos);
        }
      }
      */

      if (!json || json.status !== 200) {
        alert('Cannot load applications - ' + json ? json.message : 'Unknown error');
        callback(new Error('Cannot load data from server', null));
      } else if (json.data.length === 0) {
        alert('No data to replay for selected time range');
        callback(new Error('No data to replay', null));
      } else if (json.data.length < 2) {
        alert('There are not enough samples for replay! Please select a larger time range!');
        callback(new Error('Data not enough to replay', null));
      } else {
        console.log('Try replay total ' + json.data.length + ' locations ...');
        callback(null, json.data);
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
