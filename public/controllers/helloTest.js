myApp.controller('helloController', ['$scope','$http','$interval','$sce','$compile','$routeParams',function($scope, $http,$interval,$sce,$compile,$routeParams) {
    
	//establish a new socket
	$scope.socket=io.connect('http://localhost:8080');
	
	//init function
	$scope.init = function(){
		$scope.pre_offers_bool =false;
		$scope.pre_offers=[];
	}
	
	//establish initial settings for the connected user (socket) 
	$scope.socket.on("socket_init", function(init_data){

		//display initial message in Top new Offers section if not already exists		
		if($("#init_message").length !=0){
			$("#init_message").remove();
		}
		$("#offer_section").prepend('<div id="init_message" style="font-size: 17px;color: blue;">' + '<span>'+init_data.message+'</span>' + '</div>');
			$('#init_message').delay(15000).queue(function (next) { 
				$(this).remove();; 
				next(); 
		});
		
		$("#users_log_section").prepend('<div class="accepted_log">' + '<span>You ('+init_data.ip+') just logged in</span>' + '</div>');
		//request user data (if exists)
		$http.get("/get_pre_offers?ip="+init_data.ip)
		.success(function(data, status, headers, config) {
		  if(data.success && !!data.user_data && data.user_data.length!=0) { 
			$scope.pre_offers=data.user_data;
			$scope.pre_offers_length=$scope.pre_offers.length;
			$scope.pre_offers_bool = true;						
		  }
		})
		.error(function(data, status, headers, config) {
		  alert("error");
		});
    });
	
	//trigger login event when a user has logged in and display who logged in
	$scope.socket.on("login", function(data){
		$("#users_log_section").prepend('<div class="accepted_log">' + '<span>'+data.message+'</span>' + '</div>');
    });
	
	//trigger logout event when a user has logged out
	$scope.socket.on('logout', function(data){
		$("#users_log_section").prepend('<div class="accepted_log">' + '<span>'+data+'</span>' + '</div>');
	});
	
	//user was disconnected  
    $scope.socket.on('disconnect', function () {
		$("#users_log_section").prepend('<div class="accepted_log">' + '<span>You just logged out</span>' + '</div>');
	});

	//trigger every 15s - a new offer has arrived
	$scope.socket.on('sendOffer', function(offer){		
		$("#offer_section").prepend('<div id="'+offer.id+'" class="offer" style="background: #85fff4">' + '<span>Offer Id: '+offer.id+'</span>' +
		'<br>' + '<span>Price: ' + offer.price +'$'+ '</span>' + '<button ng-click=\'accept_offer("'+offer.id+'","'+offer.price+'$'+'")\'>Accept</button>' + '</div>');
		$compile($('#'+offer.id).contents())($scope);
		$('#'+offer.id).delay(30000).queue(function (next) { 
			$(this).css("background", "#e1e1e1"); 
			$(this).find("button").replaceWith( "<h4 style='color: red;left: -12px;float: right;position: relative;top: -17px;'>Expired</h4>" );
			next(); 
		});		
	});
	
	//trigger event which displays that a user has accepted an offer  
	$scope.socket.on('offerAccepted', function(data){
		$("#users_log_section").prepend('<div style="display: flex;"><div class="accepted_log no_border_right" style="background: #325077;display: inline-block">'+'<span>Price<br>'+data.price+'</span>'+
		'</div><div class="accepted_log no_border_left" style="display: inline-block;">' + '<span>'+data.message+'</span>'+'</div></div>');		
	});
	
	//accept an offer function - notify server that the user has accepted an offer
	$scope.accept_offer = function(offer_id,offer_price){
		$scope.pre_offers_bool = true;
		var offer={id:offer_id,price:offer_price};
		$scope.socket.emit('accept_offer',offer);
		$('#'+offer_id).remove();
		$scope.pre_offers.push(offer);
	}


}]);