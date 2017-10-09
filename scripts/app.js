var app = angular.module('mainApp', ['ngRoute']);

app.controller('homeCtrl', function ($scope,$http,$timeout,$location) {
	$scope.formData={};
    $scope.result=[];
	$scope.progressValue=10;
	$scope.selectedSession={};
	//For the about page
	$scope.selectedPage = 0;
	$scope.page = ['About','Home','Bored?'];
	$scope.togglePage = function(n) {
		//console.log($scope.selectedPage);
		//if($scope.selectedPage == 1)
		//	if(n==1)
		//		n=0;
		$scope.selectedPage = n;
	};
	
	$scope.rand = function() {
	console.log('=======================================================');
	console.log((Math.floor(Math.random()*290) + 1));
	console.log('=======================================================');
	
		return 'http://depressedalien.com/' +(Math.floor(Math.random()*290) + 1) + '.png';
	};
	
	// Getting running sessions
	$http.get('/api/currentSessions')
		.success( function(data) {
			$scope.currentSessions = data;
		})
		.error(function(data) {
				console.log('Error: ' + data);
			});
	
	//Session Select 
	$scope.selectSession = function(session) {
		$scope.selectedSession = session;
		if(session.logService == true)
			window.location.href = "http://10.176.125.5:5601/#/discover/"+session.user;
		else {
			$scope.guid = session.user;
			$scope.path = session.path;
			$scope.time = Math.round((session.endTime - session.startTime)/60000);
			$("#trackAlertModal").modal({
				            keyboard: false
			});
		}
	};
	
	//Feedback
	$scope.feedbackErrorMsg="";
	$scope.isFeedbackPosted=false;
	$scope.giveFeedback = function() {
		$scope.isFeedbackPosted=false;
		$("#feedbackModal").modal({
				keyboard: false
		});	
		$scope.feedbackErrorMsg="";
		$scope.feedbackName="";
		$scope.feedbackText="";
		$scope.feedbackRating="";
	};
	$scope.postFeedback = function() {
		if (($scope.feedbackName=="")||(($scope.feedbackText=="")&&($scope.feedbackRating==""))) {
			$scope.feedbackErrorMsg="Name and eiether one of feedback or rating is required";
		}
		else if (($scope.feedbackRating!="") && isNaN(parseInt($scope.feedbackRating))) {
			$scope.feedbackErrorMsg="Rating is not a valid Number";
		} else if (($scope.feedbackRating!="") &&((parseInt($scope.feedbackRating)<0) || (parseInt($scope.feedbackRating)>10) )) {
			$scope.feedbackErrorMsg="Rating Range is invalid...";
		} else {
			$http.post('/api/feedback',{name:$scope.feedbackName, feedback:$scope.feedbackText, time:Date.now(), rating: parseInt($scope.feedbackRating) })
				.success( function(data) {

				})
				.error(function(err) {
					console.log(err);
				});
			$scope.isFeedbackPosted=true;
			$scope.feedbackErrorMsg="";		
		}
	};
	//User submitting loading action
	$scope.trackInputErrorMsg = {list:[]};
	$scope.hideAlert = function() {
		$scope.trackInputErrorMsg = {list:[]};
	};
	$scope.hasUserRequested = false;
	$scope.validateInputs = function() {
		console.log('Reaching here',$scope.time, parseInt($scope.time),isNaN(parseInt($scope.time)));
		$scope.trackInputErrorMsg = {list:[]};
		if ((typeof $scope.time == "undefined")||($scope.time == ""))
			$scope.trackInputErrorMsg.list.push("Time is required");
		else if (isNaN(parseInt($scope.time)))
			$scope.trackInputErrorMsg.list.push("Not a valid number for time");
		
		if ((typeof $scope.guid == "undefined")||($scope.guid == ""))
			$scope.trackInputErrorMsg.list.push("GUID is required");
		if ((typeof $scope.path == "undefined")||($scope.path == ""))
			$scope.trackInputErrorMsg.list.push("Path is a necessity");
		else {
			//Fix for things like /logs/
			if($scope.path.search('/logs')>0)
				$scope.path = $scope.path.slice(0,$scope.path.search('/logs')+5);
			//Cases like /servers/ or /logs/
			if ($scope.path[$scope.path.length-1] == '/')
				$scope.path = $scope.path.slice(0,$scope.path.length-1);
		}
		console.log($scope.trackInputErrorMsg);
	};
	$scope.trackAction = function() {
		$scope.validateInputs();
		if ($scope.trackInputErrorMsg.list.length == 0) {
			$scope.formData={guid : $scope.guid.toLowerCase(), path: $scope.path, time: parseInt($scope.time)};
			$scope.hasUserRequested=true;
			$scope.currentStatus = 'Checking path..';
			$scope.progressValue = 10;
			$http.post('/api/requestProvision', $scope.formData)
				.success(function(data) {
					$scope.result = data;      // Updating the JSON
					if (data.res=='Started') {
						//Log Service is starting.. hiding the input and displaying the loading screen
						$scope.hasUserRequested=true;
								retrieveItems();
					} else {
						// Give warning for failing due to invalid path
						$scope.hasUserRequested=false;
						$("#smallModal").modal({
								keyboard: false
						});
					}
				})
				.error(function(data) {
					console.log('Error: ' + data);
				});
		}
	};
	
	var retrieveItems = function () {
		// get a list of items from the api located at '/api/items'
		$http.get('/api/requestProvision/' + $scope.guid)
			.success(function (data) {
				data=data[0];
				if(data.logService) {
					$scope.currentStatus = 'AirLog Service Started !!.. Redirecting...';
					//changeProgress(100);
					$scope.progressValue=100;
					window.location.href = "http://10.176.125.5:5601/#/discover/"+$scope.guid;				
				}
				else {
					$scope.currentStatus = 'Starting the AirLog service.. Please wait for few seconds...';
					//changeProgress(60);
					$scope.progressValue=60;
				}
				/*else $scope.currentStatus = 'Creating dedicated Index and search profile'; */
				// check for item changes
				$timeout(retrieveItems, 1000);
			}
		);
	};
	
	var changeProgress = function(newValue) {
		inc = (newValue-$scope.progressValue)/100;
		$timeout(function incProgress() {
			$scope.progressValue = $scope.progressValue +inc;
			if ( $scope.progressValue< newValue)
				incProgress();
		},10);
	}
	
	//Batman
	console.log("I'm Batman");
});

