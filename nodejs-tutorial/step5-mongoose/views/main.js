var app = angular.module('helloModule', [])
    .directive('sayHello', function () {
        return {
            restrict: 'E',
            scope:{
                author: '=',
                message: '='
            },
            template: '<h1>Hello, world!</h1>' +
                '<ul class="list-group">' +
                '    <li class="list-group-item">Author: {{author}}</li>' +
                '    <li class="list-group-item">message: {{message}}</li>' +
                '</ul>'
        }
    });

app.controller("MainController", ['$scope', '$http', function($scope, $http) {
    $scope.editing = false;
    
    $scope.hot = { };

    $scope.messages = [];
    var promise = $http.get("/message");
    promise.success(function(data) {
        $scope.messages = data;
    });

    $scope.update = function(msg) {
        var promise = $http.post('/message/' + msg.id, {author: msg.author, message: msg.message});
        promise.success(function(data) {
            var index = $scope.messages.indexOf(msg);
            if(index >= 0) {
                $scope.messages[index] = data;
                $scope.editing = false;
                $scope.hot = {};
            }
        });

        promise.error(function(data) {
            alert(data);
        });
    };

    $scope.create = function(msg) {
        var promise = $http.put('/message', {author: msg.author, message: msg.message});
        promise.success(function(data) {
            $scope.messages.push(data);
            $scope.editing = false;
            $scope.hot = {};
        });

        promise.error(function(data) {
            alert(data);
        });
    };

    $scope.remove = function(msg) {
        var promise = $http.delete("/message/" + msg.id);
        promise.success(function(data) {
            var index = $scope.messages.indexOf(msg);
            if(index >= 0) {
                $scope.messages.splice(index, 1);
                $scope.editing = false;
                $scope.hot = {};
            }
        });

        promise.error(function(data) {
            alert(data);
        });
    };

    $scope.select = function(msg) {
        var index = $scope.messages.indexOf(msg);
        if(index >= 0) {
            $scope.editing = true;
            $scope.hot = $scope.messages[index];
        }
        else {
            $scope.editing = false;
            $scope.hot = {};
        }
    }
}]);
angular.module('HelloApp', ['helloModule'])
