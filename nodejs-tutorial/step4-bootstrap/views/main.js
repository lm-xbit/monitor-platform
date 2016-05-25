angular.module('helloModule', [])
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

angular.module('HelloApp', ['helloModule'])
