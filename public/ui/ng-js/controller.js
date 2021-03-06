var app = angular.module('TripPlanner.controllers', []);

var $rootScope;

app.controller('rootCtrl', function($scope, $location, interfaceService, $trips, confService, authService, sessService) {
    $rootScope = $scope;
    confService.loadConf(function(conf) {
        $scope.name = conf.ver.name;
        $scope.version = conf.ver.version;
        $scope.desc = conf.ver.desc;
        $scope.dev = conf.ver.dev;
    });

    $scope.user = authService.getUser();
    var page = sessService.getSession('page');


    $scope.logout = function() {
        authService.logout();
        $scope.user = null;
        $trips.clearTrips();
        $location.path('/login');
    };

    $scope.home = function (id, redirect) {
        if(!id) id = '';
        this.clearNav();
        this.pg_home = "active";
        sessService.setSession('page', 'home/'+id);
        if(redirect) $location.path('/home/'+id);
    };

    $scope.login = function () {
        this.clearNav();
        this.pg_login = "active";
        sessService.setSession('page', 'login');
        $location.path('/login');
    };

    $scope.profile = function (id, redirect) {
        if(!id) id = '';
        this.clearNav();
        this.pg_profile = "active";
        sessService.setSession('page', 'profile/'+id);
        if(redirect) $location.path('/profile/'+id);
    };
    $scope.trips = function (id, redirect) {
        if(!id) id = '';
        this.clearNav();
        this.pg_trip = "active";
        sessService.setSession('page', 'trips/'+id);
        if(redirect) $location.path('/trips/'+id);
    };


    $scope.clearNav = function () {
        delete this.pg_home;
        delete this.pg_login;
        delete this.pg_profile;
        delete this.pg_trip;
    };

    if(page) {
        var path = page.split('/');
        $scope[path[0]](path.splice(1, path.length).join('/'), true);
    } else
        $scope.login();

});

app.controller('loginCtrl', function($scope, $location, interfaceService, $users, md5, userService, authService) {

    if($rootScope.user) {
        $rootScope.home(null, true);
    }

    $scope.newUser = $users.formUser();
    $scope.loginUser = $users.getUser();

    var request = new Request();

    $scope.login = function () {
        $scope.loginUser.password = md5.createHash($scope.loginUser.password || '');
        request.body = $scope.loginUser;
        request.success = function (user) {
            $rootScope.user = user;
            $rootScope.home(null, true);
        };

        request.error = function (err) {
            $rootScope.logout();
            $scope.err = err;
        };

        authService.login(request);
    };

    $scope.register = function () {

        try {
            $users.validate($scope.newUser);
        } catch(err) {
            $scope.err = err;
            interfaceService.bubbleError();
            return;
        }

        request.body = $scope.newUser;
        request.success = function (user) {
            $rootScope.user = user;
            $rootScope.home(null, true);
        };

        request.error = function (err) {
            $scope.err = err;
            interfaceService.bubbleError($scope);
        };

        userService.createUser(request);
    };

    $scope.showReg = function () {
        $scope.regForm = true;
    };

    $scope.showLogin = function () {
        delete $scope.regForm;
        $scope.newUser = $users.formUser();
    };

});

app.controller('homeCtrl', function ($scope, interfaceService , $trips, tripService) {
    if(!$rootScope.user) {
        $rootScope.login();
    } else
        $rootScope.home();
    var request = new Request();
    $scope.filter = $trips.searchFilter();

    interfaceService.loadDatePicker($scope);
    interfaceService.setDropDown();

    $scope.loadTrips = function () {
        request.body = null;
        request.success = function (trips) {
            $scope.tripList = trips;
            interfaceService.styleTable();
        };
        request.error = function(err) {
            $scope.err = err;
            interfaceService.bubbleError();
        };

        request.filter = $scope.filter;
        tripService.getTrips(request);
    };

    $scope.deleteTrip = function (id) {
        request.body = {_id: id};
        request.success = function(trip) {
            $trips.removeTripById(id);
            $scope.tripList = $trips.getTripList();
        };
        request.error = function(err) {
            $scope.err = err;
            interfaceService.bubbleError();
        };

        tripService.deleteTrip(request);
    };

    $scope.searchTrips = function () {
        request.body = null;
        request.success = function (trips) {
            $scope.tripList = trips;
        };
        request.err = function(err) {
            $scope.err = err;
            interfaceService.bubbleError();
        };

        request.filter = $scope.filter;
        tripService.getTrips(request);
    };

    $scope.filterMonth = function () {
        $scope.filter.start = $scope.startDate;
        $scope.filter.end = $scope.endDate;
        $scope.searchTrips();
    };

    $scope.printTravelPlan = function () {
        interfaceService.printTable();
    };

    $scope.tripList = $trips.getTripList();
    if($scope.tripList.length == 0) {
        $scope.loadTrips();
    } else {
        interfaceService.styleTable();
    }
});

app.controller('tripCtrl', function ($scope, $trips, $routeParams, interfaceService, tripService) {
    if(!$rootScope.user) {
        $rootScope.login();
    } else
        $rootScope.trips($routeParams.id);
    var request = new Request();

    if($routeParams.id) {
        $scope.trip = $trips.getTripById($routeParams.id);
        if(!$scope.trip) {
            request.body = {_id: $routeParams.id};
            request.success = function (trip) {
                $scope.trip = trip;
            };
            request.err = function (err){
                $scope.err = err;
            };

            tripService.getTrip(request);
        }
    }
    else
        $scope.trip = $trips.getTrip();




    $scope.createTrip = function () {
        try {
            $trips.validate($scope.trip);
        } catch(err) {
            $scope.err = err;
            interfaceService.bubbleError();
            return;
        }

        request.body = $scope.trip;
        request.success = function (trip) {
            $trips.addTrip(trip);
            $rootScope.home(null, true);
        };
        request.error = function(err) {
            $scope.err = err;
            interfaceService.bubbleError();
        };

        tripService.createTrip(request);
    };

    $scope.editTrip = function () {
        try {
            $trips.validate($scope.trip);
        } catch(err) {
            $scope.err = err;
            interfaceService.bubbleError();
            return;
        }
        request.body = $scope.trip;
        request.success = function (trip) {
            $trips.editTrip($scope.trip._id, trip);
            $rootScope.home(null, true);
        };
        request.error = function(err) {
            $scope.err = err;
            interfaceService.bubbleError();
        };

        tripService.updateTrip(request);
    };

    var tripList = $trips.getTripList();
    if(tripList.length == 0) {
        var req = new Request(null,
            function (trips) {
            tripList = trips;
            interfaceService.loadDatePicker($scope, new Date(), tripList);
        },function(err) {
            $scope.err = err;
            interfaceService.bubbleError();
        });

        req.filter = $scope.filter;
        tripService.getTrips(req);
    } else
        interfaceService.loadDatePicker($scope, new Date(), tripList);

    $scope.advancedSearch = [];
    interfaceService.setDropDown();
    interfaceService.setDestAutoComplete($scope);
});