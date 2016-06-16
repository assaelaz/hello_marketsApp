
var express = require('express');
var bodyParser = require('body-parser'); // for reading POSTed form data into `req.body`
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);
var os = require('os');

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

//user data
var userIp_data={};
var ifaces = os.networkInterfaces();

//find out the user ip address
var client_ip = function(callback){
	
	Object.keys(ifaces).forEach(function (ifname) {

	  ifaces[ifname].forEach(function (iface) {
		  
		if ('IPv4' !== iface.family || iface.internal !== false) {
		  // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
		  return;
		}
		// this interface has only one ipv4 adress
		else {
			
			 //create new user if not already exists
			if(!!!userIp_data[iface.address]){
				userIp_data[iface.address]=[]; 
				//console.log(iface.address + " new user");			
			}
			callback(iface.address);
											
		}

	  });
	});	
}

//on connection to a new socket
io.on('connection',function(socket){
	//uesr is connected
    //console.log('a user connected: ' + socket.id );
	client_ip(function(ip_address){ //get user ip address
		socket.client_ip_address=ip_address;
		socket.emit('socket_init', {ip:ip_address,message:'New Offer in 15s'});//initialize settings for the connected user
		socket.broadcast.emit('login', {message:ip_address + ' just logged in'});//notify all users that "user" just logged in
	});
	//user was disconnected  
    socket.on('disconnect', function () {
		//console.log('a user disconnected: ' + socket.id );
		io.emit('logout', socket.client_ip_address + ' just logged out');//notify all users that "user" just logged out
	});
	
	//user accepted an offer - notify all other connected users and add offer to user's offers
	socket.on('accept_offer', function (offer) {
		userIp_data[socket.client_ip_address].push(offer);
		socket.broadcast.emit('offerAccepted', {price:offer.price,message:socket.client_ip_address + ' has accepted Offer: ' + offer.id});
		
	});

	//send every 15s a new offer
    setInterval(function(){
		var offer = {};
		offer.price = Math.floor((Math.random() * 500) + 1);
		offer.id = parseInt(new Date().getTime() / 1000);
		socket.emit('sendOffer', offer); 
	}, 15000);
});

//retreives user data when connected only if user already exists
app.get('/get_pre_offers', function (req, res) {
	
  res.jsonp({
		success : true,
		user_data : userIp_data[req.query.ip]
	});
});

http.listen(8080, function(){
  console.log('listening on *:8080');
});


