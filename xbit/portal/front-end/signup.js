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
    var userName = $('#username').val().trim();
    var password = $('#password').val().trim();
    var confirm = $('#confirm').val().trim();
    if (email && userName && password && confirm) {
      if (password === confirm) {
        signup(email, userName, password);
      } else {
        alertError('Password does not align.');
      }
    } else {
      alertError('Please input your user name, email address and password.');
    }
  });
});

function signup (email, username, password) {
  $.ajax({
    url: '/rest/settings/register',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({email: email, username: username, password: password}),
    success: function (res) {
      redirectQueryUrl();
    },
    error: function (jqXHR, textStatus, errorThrown) {
      alert('Register Fail - ' + jqXHR.status + '; ' + jqXHR.responseText);
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
  window.location.href = getQueryVariable('url') || '/login';
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
