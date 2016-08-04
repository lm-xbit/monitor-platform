import $ from 'jquery';

export const lookupCountry = () => {
  return function (dispatch) {
    $.get('http://ipinfo.io', function () {
    }, 'jsonp').always(function (resp) {
      dispatch(countryGot(resp));
    });
  };
};

export const countryGot = (resp) => {
  return {
    type: 'SET_COUNTRY_CODE',
    countryCode: (resp && resp.country) ? resp.country : 'cn'
  };
};

