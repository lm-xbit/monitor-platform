import $ from 'jquery';

// export const getLocation = () => {
//   return function (dispatch) {
//     $.getJSON('http://xbit:8080/rest/data/mobile-tracking', function () {
//     }, 'jsonp').always(function (resp) {
//       return resp.data;
//     });
//   };
// };
export const getLocation = (map) => {
  $.getJSON('/rest/data/mobile-tracking', '', function (json) {
    map.setZoom(2);
    var marker = new window.AMap.Marker({
      position: [116.480983, 39.989628],
      map: map
    });
    alert(json.data);
  });
};
