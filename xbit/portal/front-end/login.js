/**
 * Created on 9/2/16.
 */
import $ from 'jquery';

require('bootstrap/dist/css/bootstrap.css');
require('font-awesome/css/font-awesome.css');
require('resources/assets/styles/main.css');

$(document).ready(function () {
  $('.login-button').on('click', function () {
    var email = $('#email').val().trim();
    var password = $('#password').val().trim();

    if (email && password) {
      if (!isEmail(email)) {
        alert('Invalid email format');
      } else {
        login(email, password);
      }
    } else {
      alertError('Please input user name and password.');
    }
  });
});

function isEmail (email) {
  var regex = /^([a-zA-Z0-9_.+-])+@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
  return regex.test(email);
}

function login (username, password) {
  $.ajax({
    url: '/rest/settings/login',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({username: username, password: password}),
    success: function (data, textStatus, jqXHR) {
      redirectQueryUrl();
    },
    error: function (jqXHR, textStatus, errorThrown) {
      if (jqXHR.status === 401) {
        alert('Email or password is wrong');
      } else {
        alert('Login Fail - ' + textStatus + '; ' + errorThrown);
      }
    }
  });
}

function alertError (err) {
  if (typeof err === 'string') {
    alert(err);
  } else if (err && err.errmsg) {
    alert(err.errmsg);
  } else {
    alert('Unknown error.');
  }
}

function redirectQueryUrl () {
  window.location.href = getQueryVariable('url') || '/index';
}

function getQueryVariable (variable) {
  var query = window.location.search.substring(1);
  var vars = query.split('&');
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split('=');
    if (decodeURIComponent(pair[0]) === variable) {
      return decodeURIComponent(pair[1]);
    }
  }
}
