// DB Model Files
var usageDetails= require('../models/usageDetails');
var usageHistory= require('../models/usageHistory');
var userFeedback= require('../models/userFeedback');
var morgan = require('morgan');
var mongoose 	= require('mongoose');
var ObjectId 	= mongoose.Types.ObjectId;

var logger 		= require('../../config/logging.js'); 





module.exports = function(app) {
	
	// setup the logger 
	app.use(morgan('{"host" : ":remote-addr", "mth" : ":method","url" : ":url", "req" : ":req[header]", "responseTime" : ":response-time", "ua" : ":user-agent"}', {stream: logger.stream}));
	
	// api ---------------------------------------------------------------------
	app.get('/home', function(req, res){
		
		res.sendfile('public/html/home.html');	
		
	});
	
	//check for request status, and make requests for provisioning
	app.route('/api/requestProvision/:user')
		.get ( function(req,res) {
			usageDetails.find({user:req.params.user}, function(err,data) {
				if (err)
					console.log(err);
				res.json(data);
			});
		});

    app.route('/api/requestProvision')
		.post( function(req,res) {
			var t = (new Date()).getTime();
			// If server path is given add */logs to get logs of all servers
			if (req.body.path.slice(req.body.path.length-7)=="servers") {
				req.body.path = req.body.path + '/*/logs'; 
				console.log('Server path given...');
			}
			// Insert Usage Details in DB
			usageDetails.find({user: req.body.guid}, function(err,data) {
				if (err)
					console.log(err);
		
				if (data.length==0) {
					// Create User if not existing before
					usageDetails.create({ user: req.body.guid, path: req.body.path, index:false, search : false, logService: false}, function(err,newData){
						if (err)
							console.log(err)
						if(isLogPathCorrect(req.body.path)) {
							startProvision(req.body.guid, req.body.path, req.body.time,newData);
							res.json({res:'Started'});
						} else { res.json({res:'WrongPath'}); }
					});
				} else {
					if(isLogPathCorrect(req.body.path)) {
						startProvision(req.body.guid, req.body.path, req.body.time,data[0]);
						res.json({res:'Started'});
					} else { res.json({res:'WrongPath'}); }
				}
			});
			
		
			
			
		});
	
	app.route('/api/currentSessions')
		.get( function(req,res) {
			// Find the running sessions and return
			usageDetails.find({},null,{sort : {startTime:-1}}, function(err,data) {
				if (err)
					console.log(err);
				res.json(data);
			});
	});
	
	//Feedback
	app.route('/api/feedback')
		.post( function(req,res) {
			userFeedback.create({name:req.body.name, time:req.body.time,  feedback:req.body.feedback, rating:req.body.rating}, function(err, data) {
				if(err)
					console.log(err);
			});
	});
	
	//404 page
	app.get('/*', function(req, res){	
		res.sendfile('public/html/404.html');	
	});
	
};

// Function to check if logs are present/accessible in given path
function isLogPathCorrect(path) {
	var glob = require('glob');
	var fs   = require('fs');
	console.log('reached here'+path);
	
	// Check if diagnostic or access log has permission
	path_diagnostic = path + '/*-diagnostic.log';
	path_access	= path + '/access.log';
	path_accessyyyy = path + '/access.log.yyyyMMdd';
	
	try {
		diagList = glob.sync(path_diagnostic);
		accessList = glob.sync(path_access);
		accessyyyyList = glob.sync(path_accessyyyy);
		if ( (diagList.length > 0) || (accessList.length > 0) || (accessyyyyList.length > 0)) {
			// if its a server path 
			if ( diagList.length > 1)
				return true;
			// Glob checks only the path and not the permissions
			invalidPermPath = [];
			//Currently focusing on diagnostic logs
			//allList = diagList.concat(accessList.concat(accessyyyyList));
			allList = diagList; 
			for (i in allList) {
				if (!fs.existsSync(allList[i]))
					invalidPermPath.push(allList[i])
			}
			if (invalidPermPath.length > 0) {
				console.log('Invalid permission');
				return false;
			}
			console.log('Correct Path & permissions');
			return true;
		}
		else {
			console.log('Wrong Path');
			return false;
		}
	} catch(err) {
		console.log(err);
		return false;
	}
}

// Function to start the Log Monitoring Service
function startProvision(guid, newPath, time, record) {
	
	var t = 0;
	if(parseInt(time) > 180)
		time = '180';
	if(parseInt(time) < 5)
		time = '5';
	//Converting time to seconds
	time=(parseInt(time)*60).toString();
	
	//Creating a new Config file for the user

	var fs = require('fs');
	var exec = require('child_process').exec;
	  
	var filePath	= '/scratch/pschandr/Exp/airlog/';
	
	// Creation of Config file to start LogStash
	var fileName	= 'tmp'+guid+'LogStash.conf'
	fs.readFile(filePath + 'diag-Logstash.conf', 'utf-8', function(err, data){
		if (err) throw err;
		
		//Replacing guid and path from template to create new config file
		var newValue = data.replace(/_newPath_/g, newPath);
		newValue = newValue.replace(/_guid_/g, guid);
		var flag=0;
		fs.writeFile(filePath + 'logConfigFiles/' + fileName, newValue, 'utf-8', function (err) {
			if (err) throw err;
			//Running the Logstash for certain time
			var child = exec('(/scratch/pschandr/Exp/LogStash/logstash-1.4.2/bin/logstash -f /scratch/pschandr/Exp/airlog/logConfigFiles/' + fileName +') & sleep '+time+'; kill $!');
			child.stdout.on('data', function(data) {
				if (flag==0) {
					t = (new Date()).getTime();
					updateRecord(usageDetails, record._id, {logService:true, startTime:t, endTime: (t+parseInt(time)*1000), path: newPath});		
					console.log('Logservice Started....');
					flag=1;
				}
			});
			child.on('close', function(code) {
				console.log('Logservice ended');
				//Update in DB
				updateRecord(usageDetails, record._id, {logService:false});
				//Create an entry in history DB
				usageHistory.create({ user: guid, path: newPath, startTime:t, endTime: (t+parseInt(time)*1000)}, function(err){
					if(err) console.log(err);
				});
			}); 
		});
	});
	
	if ((!record.index) || (!record.search)) {

		//Creation of Index and Search if nott created before
		fs.readFile(filePath + 'createIndexSearch.sh', 'utf-8', function(err, data){
			if (err) throw err;
			//Replace _guid_ with actual GUID
			var newValue = data.replace(/_guid_/g, guid);
		
			fs.writeFile(filePath + 'tmp'+guid+'CIS.sh' , newValue, 'utf-8', function (err) {
				if (err) throw err;
				
				//Create Index and Search
				var child = exec('sh tmp'+guid+'CIS.sh');
				child.on('close', function(code) {
					console.log('closing code for Index and Search Creation');
					//Update in DB
					updateRecord(usageDetails, record._id, {index:true, search:true});
					console.log('IS created Started....');
				});
			});
		});
	}
	
	
	console.log('Voila');
}

function  updateRecord( dbModel, id, updateValues) {
	console.log(id);
	dbModel.update({_id:ObjectId(id)},{ $set: updateValues }, function(err) {
		if(err)
			console.log(err);
	});
}
