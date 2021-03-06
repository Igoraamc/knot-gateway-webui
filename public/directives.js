var angular = require('angular');
var isIPv6 = require('is-ipv6-node');

var appDirectives = angular.module('app.directives', []);

appDirectives.directive('confirmClick', function confirmClick() {
  return {
    priority: -1,
    link: function link(scope, element, attr) {
      var msg = attr.confirmClick || 'Are you sure?';
      element.bind('click', function onClick(event) {
        if (!window.confirm(msg)) { // eslint-disable-line no-alert
          event.stopImmediatePropagation();
          event.preventDefault();
        }
      });
    }
  };
});

appDirectives.directive('compareTo', function compareTo() {
  function link(scope, element, attributes, ngModel) {
    ngModel.$validators.compareTo = function $validatorsCompareTo(value) {
      return value === scope.other;
    };

    scope.$watch('other', function onOtherChanged(/* value */) {
      ngModel.$validate();
    });
  }

  return {
    restrict: 'A',
    require: 'ngModel',
    scope: {
      other: '=compareTo'
    },
    link: link
  };
});

appDirectives.directive('hostname', function hostname() {
  // Based on Joi hostname validator
  // Joi can't be easily imported into the browser yet
  function isHostname(value) {
    /* eslint-disable max-len, no-useless-escape */
    var hnRegex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;
    /* eslint-enable max-len, no-useless-escape */

    return (value.length <= 255 && hnRegex.test(value)) || isIPv6(value);
  }

  function link(scope, element, attributes, ngModelCtrl) {
    function hostnameValidator(value) {
      // ignore if value is undefined, required validator will take care of it, if needed
      var isValid = !value || isHostname(value);
      ngModelCtrl.$setValidity('hostname', isValid);
      return value;
    }

    ngModelCtrl.$parsers.push(hostnameValidator);
  }

  return {
    restrict: 'A',
    require: 'ngModel',
    link: link
  };
});

appDirectives.directive('apiClick', function apiClick($parse, GatewayApiErrorService) {
  function compile(tElement, tAttributes) {
    var action = $parse(tAttributes.apiClick);
    return function postLink(scope, element, attributes) {
      element.on('click', function onClick(event) {
        var executeAction;

        if (attributes.disabled) {
          return;
        }

        executeAction = function _executeAction() {
          var promise = action(scope.$parent, { $event: event });
          GatewayApiErrorService.updateStateOnResponse(scope.state, promise);
        };
        scope.$apply(executeAction);
      });
    };
  }

  return {
    restrict: 'A',
    scope: {
      state: '=apiClickState',
      when: '=apiClickBusyWhen'
    },
    transclude: true,
    template: '<div class="spinner" ng-show="when"></div><span ng-hide="when" ng-transclude></span>',
    compile: compile
  };
});
