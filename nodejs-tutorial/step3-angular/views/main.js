angular.module('helloModule', [])
    .directive('sayHello', function () {
        return {
            restrict: 'E',
            scope:{
                author: '=',
                message: '='
            },
            template: '<h1>Hello, world!</h1>' +
                '<ul>' +
                '    <li>Author: {{author}}</li>' +
                '    <li>message: {{message}}</li>' +
                '</ul>'
        }
    });

angular.module('HelloApp', ['helloModule'])
