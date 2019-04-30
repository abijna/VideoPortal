const express = require('express');
const path = require('path');
const cors = require('cors');
const mysql = require('mysql');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cors()); // Use this after the variable declaration
app.use(express.static(__dirname ));
// connection configurations
const mc = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'mydatabase'
}); 

/* connect to database */
mc.connect();
console.log("Connected to database");

app.post('/user/create', function(req, res){
     //var users={
    let first_name = req.body.fname;
    let last_name = req.body.lname;
    let username = req.body.uname;
    let dob = req.body.dob;
    let pw = req.body.pwd;
    let loc = req.body.location;
    var values = [username, pw, first_name, last_name, dob, loc];
    mc.query("SELECT * FROM user WHERE Username = ?",[username],function(error, results, fields){
    	if(results.length!=0)
    	{
    		res.status(400);
    		res.send("Username exists")
    		return;
    	}
    	else
    	{
    		
		    mc.query("INSERT INTO user(`Username`,`Password`,`FN`,`LN`,`DOB`,`Location`) VALUES (?,?,?,?,?,?)", values, function(error, results, fields){
		    	if (error) {
				    res.status(400);
				    res.send("Error ocurred, try again");
				}
				else{
				    res.status(201);
					console.log("successful");
				    res.send("User Created Sucessfully");
		    }
		  });
    	}
    });
	console.log(req.body);
});
    
app.post('/user/login', function(req, res){
 	var user = req.body.uname;
 	var pw = req.body.password;
 	mc.query('SELECT * FROM user WHERE Username = ?',[user], function (error, results, fields) {
  	if (error) {
        		res.status(400) //error
				res.send("Error")
				return
        	}
  	else{
  		if(results.length!=0){
      		if(results[0].Password == pw)
      		{
        		res.status(200) //ok
				res.send("User logged in")
				return
        	}
        	else
        	{
        		res.status(400) //password doesn't match
				res.send("Check password")
				return
        	}
        }
        else
        {
    		res.status(400) //Invalid user
			res.send("Username does not exist")
			return
        }

 	}
 });
});


function changeOrDelete(req, res){
	if(req.method!="POST" && req.method!="DELETE")
	{
		//wrong method used
		res.status(405)
		res.send()
		return
	}
	mc.query('SELECT * FROM user WHERE Username = ?',[req.params.username], function (error, results, fields) {
		if (error) 
		{
			res.status(400) //error
			res.send("Error")
			return
		}
		else
		{
			if(results.length!=0){
				if(req.method=="POST")
				{
					var fields= req.body;
					var keys= Object.keys(fields);
					var values= Object.values(fields);
					for(var i=0;i<keys.length;i++)
					{
						if(keys[i]!="Password"&&keys[i]!="FN"&&keys[i]!="LN"&&keys[i]!="DOB"&&keys[i]!="Location")
						{
							res.send("Invalid Modification field");
							res.status(400);
							return 
						}
					}
					var query= 'UPDATE user SET ';
					for(var i=0;i<keys.length;i++)
					{
						query+=keys[i]+'=? ';
						if(i!=keys.length-1)
						{
							query+=',';
						}
					}
					query+="WHERE Username = ?";
					values.push(req.params.username);
					mc.query(query,values, function (error, results, fields){
						if (error) {
			        		res.status(400) //error
							res.send("Error")
							return
			        	}
			        	else{
			        		res.status(200);
			        		res.send("Modified");
			        		return;
			        	}
					} );
				    		
				}
				else if(req.method=="DELETE")
				{
					mc.query("DELETE FROM user WHERE Username=? ",[req.params.username],function(error,results,fields){
						if (error) {
			        		res.status(400) //error
							res.send("Error")
							return
			        	}
			        	else{
			        		res.status(200);
			        		res.send("Deleted");
			        		return;
			        	}
					});
				}
		}
		else
		{
			res.status(400) //error
			res.send("Username doesn't exist");
			return
		}

	}
	});
}

app.all('/user/modify/:username', changeOrDelete);


function getDetails(req, res)
{
	mc.query('SELECT * FROM user WHERE Username = ?',[req.params.username], function (error, results, fields) {
		if (error) 
		{
			res.status(400) //error
			res.send("Error")
			return
		}
		else
		{
			if(results.length!=0)
			{
				res.send(JSON.stringify(results));
				res.status(200);
				return;
			}
			else
			{
				res.status(404) //error
				res.send("Username doesn't exist");
				return
			}
		}
	});
}


app.get('/user/details/:username', getDetails);



/* listen on port no 8000 */
app.listen(8000);
console.log("Listening to port 8000")
