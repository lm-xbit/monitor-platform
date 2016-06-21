var app = angular.module('ppt', []);
app.controller('pptControl', function($scope, $http) {
  $scope.sendPost = function (url) {
      $http.post(url, {})
      .success(function(data) {
        alert(JSON.stringify(data));
        console.log("send post:" + url);
      });
  }
});
