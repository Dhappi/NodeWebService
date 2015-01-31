//*************************************************************//
//  Server.js - Express server fore web api services           //
//  ver 1.0                                                    //
//  Language:      Node.js, Express.js v4.0, Brackets          //
//  Author:        Arpit Kothari, Syracuse University          //
//  E-Mail:		   arkothar@syr.edu                            //
//*************************************************************//

'use strict';
const
  fs = require('fs'),
  express = require('express'),
  morgan=require('morgan'), //middleware
  cookieParser = require('cookie-parser'), //middleware
  session=require('express-session'), //middleware
  cSession = require('cookie-session'), //middleware
  bodyParser=require('body-parser'), //middleware
  request=require('request'),
  app = express();

/* http request logging using morgan */
app.use(morgan('dev'));
app.use(cookieParser());
app.enable('etag'); // use strong etags
app.set('etag', 'strong');
app.use(cSession({
    Keys:['1'],
  secret: 'unguessable',
}));

/* uri routing for GET */
app.route('/api')
 .get( function(req, res) {
  res.cookie('session', { expires: new Date(Date.now() + 900000), httpOnly: true });
    var fileNames=[];
    var directoryName=fs.readdirSync("ServerFiles/");
        directoryName.forEach(function(dir){
            if(dir!="Categories"&&dir!="Metadata")
                fileNames.push(dir);
            else
                return;})
  res.status(200).json(fileNames);
});

/* uri routing for GET (Categories) */
app.route('/api/Categories')
    .get(function(req,res){
    res.cookie('session', { expires: new Date(Date.now() + 900000), httpOnly: true });
    fs.readFile("ServerFiles/Categories/Categories.json",'ASCII',function (err,data) {
                    if (err) throw err;
                    else
                    {
                        var listCategories=[];
                        var Cat =JSON.parse(data);
                        for(var i in Cat.Categories)
                            listCategories.push(Cat.Categories[i].Category);
                           // console.log(vids.Categories[i].Category);
                            res.json(listCategories);
                    }
                    });
    res.status(200);
});

/* uri routing for GET (Files in Categories ) */
app.route('/getFiles/:Category')
    .get(function(req,res){
    res.cookie('session', { expires: new Date(Date.now() + 900000), httpOnly: true });
    fs.readFile("ServerFiles/Categories/"+req.params.Category+".json",'ASCII',function (err,data) {
                    if (err) throw err;
                    else
                    {
                        var listCategories=[];
                        var Cat =JSON.parse(data);
                        var fileCat=req.params.Category;
                        switch(fileCat)
                                {
                                        case 'Rock':
                                        for(var i in Cat.Rock)
                                          listCategories.push(Cat.Rock[i].File);
                                          break;
                                        case 'Jazz':
                                        for(var i in Cat.Jazz)
                                          listCategories.push(Cat.Jazz[i].File);
                                          break;
                                        case 'Blues':
                                        for(var i in Cat.Blues)
                                          listCategories.push(Cat.Blues[i].File);
                                          break;
                                 }
                            res.json(listCategories);
                            res.status(200);
                    }
                    });
});

/* uri routing for GET (Download) */
app.route('/api/Download/:Filename')
 .get( function(req, res) {
  res.cookie('session', { expires: new Date(Date.now() + 900000), httpOnly: true });
    res.download("ServerFiles/"+req.params.Filename,req.params.Filename);
  res.status(200);
});

/* uri routing for GET (ParentFiles) */
app.route('/getParentFiles/:fileName')
    .get(function(req,res){
    res.cookie('session', { expires: new Date(Date.now() + 900000), httpOnly: true });
    fs.readFile("ServerFiles/Metadata/"+req.params.fileName+".json",'ASCII',function (err,data) {
                    if (err) throw err;
                    else
                    {
                        var listCategories=[];
                        var Cat =JSON.parse(data);
                            listCategories.push(Cat.Metadata[0].Dependency);
                           // console.log(vids.Categories[i].Category);
                            res.json(listCategories);
                    }
                    });
    res.status(200);
});

/* uri routing for GET (childFiles)*/
app.route('/getChildFiles/:fileName')
 .get( function(req, res) {
  res.cookie('session', { expires: new Date(Date.now() + 900000), httpOnly: true });
    var fileNames=[];
    var listCategories=[];
    var directoryName=fs.readdirSync("ServerFiles/Metadata/");
        directoryName.forEach(function(dir){
                fileNames.push(dir);})

    for(var i in fileNames)
    {
        //console.log(fileNames[i]);
        var data=fs.readFileSync("ServerFiles/Metadata/"+fileNames[i]);
        var Cat =JSON.parse(data);
        var child=Cat.Metadata[0].Dependency;
        //console.log("This is dependency "+fileNames[i]+" "+child);
        if(child==req.params.fileName)
                listCategories.push(fileNames[i]);
    }
    res.json(listCategories);
     res.status(200);
});

/* uri routing for POST */
app.post('/:fileName',function(req,res) {
    res.cookie('session', { expires: new Date(Date.now() + 900000), httpOnly: true });
    var newFile = fs.createWriteStream("ServerFiles/"+req.params.fileName);
    req.pipe(newFile);
    
     res.json({"status": "upload complete !"});
    res.status(200);
});

/* uri routing for POST (Create a Metadata file in server) */
app.post('/metadata/:fileName',function(req,res) {
    res.cookie('session', { expires: new Date(Date.now() + 900000), httpOnly: true });
    var newFile = fs.createWriteStream("ServerFiles/Metadata/"+req.params.fileName);
    req.pipe(newFile);
    
    res.json("Metadata Created !");
    res.status(200);
});

/* uri routing for PUT */
app.route('/api/:data/:fileName')
.put(function(req,res) {
  res.cookie('session', { expires: new Date(Date.now() + 900000), httpOnly: true });
  fs.appendFile('ServerFiles/Metadata/'+req.params.fileName, req.params.data, function (err) {
  if (err) throw err;
  res.status(200).json({ "status":"put complete !" });
});
});

/* uri routing for PUT (appending metadata info in Ctegory tree) */
app.route('/updateAPI/:fileName/:Category')
.put(function(req,res) {
      var options={flag:'w'};
      var updateData;
      res.cookie('session', { expires: new Date(Date.now() + 900000), httpOnly: true });
      fs.readFile("ServerFiles/Categories/"+req.params.Category+".json",'ASCII',function (err,data) {
                                            if (err) throw err;
                                            else
                                            {
                                                var fileValues = { File: req.params.fileName};
                                                var Cat =JSON.parse(data);
                                                var fileCat={};
                                                fileCat=req.params.Category;
                                                switch(fileCat)
                                                    {
                                                    case 'Rock':
                                                      Cat.Rock.push(fileValues);
                                                      break;
                                                    case 'Jazz':
                                                      Cat.Jazz.push(fileValues);
                                                      break;
                                                    case 'Blues':
                                                      Cat.Blues.push(fileValues);
                                                      break;
                                                    }
                                                data=JSON.stringify(Cat);
                                                console.log(data);
                                                fs.appendFile("ServerFiles/Categories/"+req.params.Category+".json",data,options, function (err) {
                                                                                                                if (err) throw err;
                                                                                                                else
                                                                                                                {
                                                                                                                    res.json("update complete");
                                                                                                                    res.status(200);
                                                                                                                }
                                                            });
                                                                //console.log(updateData);
                                            }});
     
    });

/* uri routing for DELETE */
app.route('/api/:FileName')
.delete(function(req,res) {
  res.cookie('session', { expires: new Date(Date.now() + 900000), httpOnly: true });
  fs.unlink('../'+req.params.FileName, function (err) {
  if (err) throw err;
  res.status(200).json({ "status":"Delete complete !" });
});
});

/* server listening port */  
app.listen(3000, function(){
  console.log("Server ready");
});