const express = require('express');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const fs=require('fs');
const glob = require('glob');
const Filehound = require('filehound');
const request = require('request');
var cors = require('cors')
const router = express.Router();
//var rimraf = require("rimraf");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cors()); // Use this after the variable declaration
app.use(express.static(__dirname ));

app.use('*/css',express.static('public/css'));
app.use('*/js',express.static('public/js'));
app.use('*/images',express.static('public/images'));

app.use(function (req, res, next) {
      res.header('Access-Control-Allow-Origin', '*')
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
      next()
    })
	
// connection configurations
const mc = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'mydatabase'
}); 
 
/* connect to database */
mc.connect();

/* Upload video api */
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
	fs.mkdirSync('uploads/'+req.body.video_id);
    cb(null, 'uploads/'+req.body.video_id)
  },
  filename: function (req, file, cb) {
    cb(null, "video."+path.basename(file.originalname).split(".")[1]) //Appending extension
     request('http://localhost:8080/'+req.body.video_id+'/'+path.basename(file.originalname).split(".")[1], { json: true }, (err, res, body) => {
  		if (err) { return console.log(err); }
  });
}
});


const upload = multer({
    storage: storage
}).single('filetoupload');

app.post('/upload', upload, (req, res) => {
	let username = req.body.username;
	user=username;
	res.status = 200;
	res.send();
});

/* Upload Thumbnail */
var storage2 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'+req.body.video_id)
  },
  filename: function (req, file, cb) {
    cb(null, "thumbnail."+path.basename(file.originalname).split(".")[1]) //Appending extension
  }
});

const upload2 = multer({
    storage: storage2
}).single('filetoupload2');

/* Upload video details api */
app.post('/upload/details',upload2, (req, res) => {
	
	let username = req.body.username;
	let video_id = req.body.video_id;
	let title = req.body.title;
	let category = req.body.category;
	let language = req.body.language;
	let content = req.body.content;
	let description = req.body.description;
	let tags = req.body.tags.split(",");

	// title, language, content, description
	var values = [video_id,username,title,description,0,content,language];
	console.log(values);
	mc.query("INSERT INTO `video`(`VideoID`, `Uploader`, `Title`, `Timestamp`, `Description`, `Views`, `Content`, `Language`) VALUES (?,?,?,now(),?,?,?,?)", values, function (error, results, fields) {
        if (error) throw error;
    });
	
	// tags
	for(var i=0;i<tags.length;i++) {
		if(tags[i]!=""){
		mc.query("INSERT INTO tags (Tag_Name) SELECT * FROM (SELECT ?) AS tmp WHERE NOT EXISTS (SELECT * FROM tags WHERE Tag_Name = ?) LIMIT 1", [tags[i],tags[i]],function (error, results, fields){
			if (error) throw error;
		});
		
		mc.query("INSERT INTO has_tags (TagName, TagsVideo_ID) VALUES (?,?)", [tags[i],video_id],function (error, results, fields){
			if (error) throw error;
		});}
	}
	
	// category
	mc.query("INSERT INTO categories (CategoryName) SELECT * FROM (SELECT ?) AS tmp WHERE NOT EXISTS (SELECT * FROM categories WHERE CategoryName = ?) LIMIT 1", [category,category],function (error, results, fields){
		if (error) throw error;
	});
	
	mc.query("INSERT INTO has_categories (Cat_name, catvideo_ID) VALUES (?,?)", [category,video_id],function (error, results, fields){
		if (error) throw error;
	});
	//res.redirect('/subtitles.html');
	//res.status=200;
	res.send({"done":200});
});

/* to upload multiple subtitles files */
var storage1 =   multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './uploads/'+req.body.video_id);
  },
  filename: function (req, file, callback) {
    callback(null,path.basename(file.originalname));
  }
});
var upload1 = multer({ storage : storage1 }).array('userSubtitles',10);

app.post('/upload/subtitle',function(req,res){
    upload1(req,res,function(err) {
        console.log(req.body);
        console.log(req.files);
		video_id=req.body.video_id;
        if(err) {
            return res.end("Error uploading file.");
        }
        res.end("File is uploaded");
		//let languages = req.body.lang.split(",");
		let eng=req.body.en;
		let kan=req.body.kn;
		let hin=req.body.hin;
		console.log("English",eng);
		var data="";
		if(eng!==undefined) data=data+eng+"\n";
		if(kan!==undefined) data=data+kan+"\n";
		if(hin!==undefined) data=data+hin+"\n";
		console.log(data);
		/*
		for(var i=languages.length-1;i>=0;i--){
			data=data+"* "+languages[i].trim()+","+req.files[i].originalname+"\n";
		}*/
		fs.appendFile(__dirname+'/uploads/'+video_id+'/subtitle-info.txt', data, function (err) {
		  if (err) throw err;
		  console.log('Saved!');
		}); 
    });
	res.status(200);
	res.send();
});
/* get subtitle languages */
app.get('/subtitle/languages/:video_id',function(req,res){
	fs.readFile(__dirname+'/uploads/'+req.params.video_id+'/subtitle-info.txt','utf8', function(err, contents) {
		console.log(contents);
		var lang=contents.split("\n");
		var response=[]
		for(var i=0;i<lang.length;i++){
			if(lang[i]=='' || lang[i]=='undefined') continue;
			var arr=[];
			arr.push(lang[i]);
			if(lang[i]=='english') arr.push('en');
			if(lang[i]=='kannada') arr.push('kn');
			if(lang[i]=='hindi') arr.push('hi');
			response.push(arr);
		}
		console.log(response);
		res.send(response);
	});
});
	
/* add country specific rules */
app.post('/add/rules', (req, res) => {
	let rule = req.body.rule_id;
	let countries = req.body.country_id;
	var data = rule[0] + "-";
	let	video_id=req.body.video_id;
	
	for(var i=0;i<countries.length;i++){
		data+=countries[i];
		data+=",";
	}
	data+="\n";
	fs.appendFile(__dirname+'/uploads/'+video_id+'/country-rules-info.txt', data, function (err) {
		  if (err) throw err;
		  console.log('Saved!');
	}); 
	res.send({"done":200});
});


/* serves resources from uploads folder */
app.use("/uploads",express.static(__dirname + "/uploads"));

/* to retrieve information about a video */
app.get('/info/:video_id',function(req, res) {
	mc.query("SELECT Uploader, Title, Description, Content, Language FROM video WHERE VideoID = ?", [req.params.video_id],function (error, results, fields){
		if (error) throw error;
		res.send({Uploader : results[0].Uploader, Title : results[0].Title, Description : results[0].Description, Content : results[0].Content, Language : results[0].Language});
	});
});

/* to update views */
app.post('/update/view/:video_id', function(req, res) {
	mc.query("UPDATE video SET Views=Views+1 WHERE VideoID=?",[req.params.video_id],function(error,results,fields){
		if(error) throw error;
	});
	res.send({"done":200});
});

/* to get list of countries */
app.get('/countries',function(req, res) {
	mc.query("SELECT Country_name FROM apps_countries", [],function (error, results, fields){
		var arr=[];
		for(var i=0;i<results.length;i++){
			arr.push(results[i].Country_name);
		}
		if(error) throw error;
		res.send(arr);
	});
});

function rimraf(dir_path) {
    //if (fs.existsSync(dir_path)) {
        fs.readdirSync(dir_path).forEach(function(entry) {
            var entry_path = path.join(dir_path, entry);
            if (fs.lstatSync(entry_path).isDirectory()) {
                rimraf(entry_path);
            } else {
                fs.unlinkSync(entry_path);
            }
        });
        fs.rmdirSync(dir_path);
    //}
}

app.delete('/remove/:video_id',function(req, res) {
	console.log("log1"+req.params.video_id);
	
	mc.query("DELETE FROM video WHERE VideoID=?", [req.params.video_id],function (error, results, fields){
		if(error) throw error;
		console.log(results);
	});
	var pth=path.join(__dirname,"/uploads/"+req.params.video_id);
	console.log("log2:"+req.params.video_id);
	rimraf(pth);//, function (error) {if(error) throw error; console.log("done"); });
	console.log("done");
	res.send({"done":200});
});

/* to get list of available rules */
app.get('/rules',function(req, res) {
	mc.query("SELECT Rule_description FROM country_rules", [],function (error, results, fields){
		var arr=[];
		for(var i=0;i<results.length;i++){
			arr.push(results[i].Rule_description);
		}
		if(error) throw error;
		res.send(arr);
	});
});

app.post('/search', function(req,res)
{
	Object.prototype.in = function() {
		for(var i = 0; i < arguments.length; i++)
		   if(arguments[i] == this)
				return true;
		return false;
	}

	var type = req.body.type;
	var category = req.body.username;
	var username = req.body.username;
	var filter = req.body.filter;
	
	if(type == "title"){
        mc.query("SELECT * ,MATCH (Title) AGAINST (? IN NATURAL LANGUAGE MODE) as score FROM video WHERE MATCH (Title) AGAINST (?) > 0 ORDER BY score DESC;", [username,username], function(error, results, fields){
            if(error) throw error;
            var videos=[];
            var info=[];
            for(var i = 0; i < results.length;i++) {                
               /* var a = new Array(results[i].VideoID,results[i].Title);

                info.push(a);*/

                var info=[];
                if((filter==1 && results[i].Content=='kid') || filter==0){
					info.push(results[i].VideoID);
					info.push(results[i].Title);
					videos.push(info);
				}
                
            } 
                 //videos.push(info);
        		res.send(videos);   
        });   
    }
	if(type == "category"){
		mc.query("SELECT * FROM video where VideoID in (SELECT catvideo_ID from has_categories where Cat_name = ?);", [category], function(error, results, fields){
			console.log(results);
			if(error) throw error;
			var videos=[]
			for(var i = 0; i < results.length;i++){
				var info=[];

				if((filter==1 && results[i].Content=='kid') || filter==0){
					info.push(results[i].VideoID);
					info.push(results[i].Title);
					videos.push(info);
				}
			}
			console.log(videos);
			res.send(videos);

		}); //selecting videos whose categories match the category selected
	}
	
	if(type == "username"){
		mc.query("SELECT * ,MATCH (Uploader) AGAINST (? IN NATURAL LANGUAGE MODE) as score FROM video WHERE MATCH (Uploader) AGAINST (?) > 0 ORDER BY score DESC;", [username, username], function(error, results, fields){
			if(error) throw error;
			var videos=[]
			for(var i = 0; i < results.length;i++){
				var info=[];
				if((filter==1 && results[i].Content=='kid') || filter==0){
					info.push(results[i].VideoID);
					info.push(results[i].Title);
					videos.push(info);
				}
			}
			console.log(videos);
			res.send(videos);

		}); //selecting videos with search string being matched against uploaders
	}

});

/* listen on port no 3000 */
app.listen(3000);