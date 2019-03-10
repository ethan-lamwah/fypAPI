var MongoClient = require('mongodb').MongoClient;
var mongourl = 'mongodb://hellowah5:hellowah5@ds149682.mlab.com:49682/11664934';

var express = require('express');
var app = express();
var assert = require('assert');

var bodyParser = require('body-parser');
var fs = require('fs');
var multer = require('multer');
var upload = multer();

var app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/', function (req, res) {
	// console.log(req.session);
	// if (!req.session.authenticated) {
	// 	res.redirect('/login');
	// } else {
		MongoClient.connect(mongourl, function (err, db) {
			assert.equal(err, null);
			db.collection("list").find({}).toArray( function (err, docs) {
				assert.equal(err, null);
				db.close()
				if (docs != null) {
					console.log(docs);
					res.status(200);
					res.render('list', {docs});
					
				} else {
					res.status(404).send("Not found");
				}
			})
		});

	//}
});

//form
app.get('/form', function (req, res) {
	var quantity = req.query.quantity != null ? req.query.quantity : 1;	
	res.status(200);
	res.render('postForm',{quantity});
})

app.post('/form', upload.array(), (req, res) => {
	let formData = req.body;
	console.log('form data', formData);
	let output = []

	if (isArray(formData.Title)) {
		for (var i = 0; i < formData.Title.length; i++) {
			var object = new Object()
			object.TITLE = formData.Title[i]
			object.LATITUDE = formData.Lat[i]
			object.LONGITUDE = formData.Lng[i]
			object.DESCRIPTION = formData.Description[i]
			object.VIDEO_ID = formData.VideoID
			object.TYPE = formData.groupType[i]
			output.push(object)
		}
	} else {
		var object = new Object()
		object.TITLE = formData.Title
		object.LATITUDE = formData.Lat
		object.LONGITUDE = formData.Lng
		object.DESCRIPTION = formData.Description
		object.VIDEO_ID = formData.VideoID
		object.TYPE = formData.groupType
		output.push(object)
	}
	console.log(output)

	MongoClient.connect(mongourl, function (err, db) {
		if (err) throw err;
		db.collection("list").insert({VIDEO_ID: formData.VideoID, ROUTE: formData.Route, DESCRIPTION: formData.RouteDescription, COUNT: output.length}, function (err, res) {
			if (err) throw err
			console.log("1 list document inserted")
		})
		db.collection("markers").insert(output, function (err, res) {
			if (err) throw err
			console.log("1 marker document inserted")
		})

	})

	res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8'});
	res.write(JSON.stringify({ 'Video ID':formData.VideoID, 'Route': formData.Route, 'Description' : formData.RouteDescription, STATUS: 'success', COUNT: output.length }, null, 3));
	res.write(JSON.stringify(output, null, 3));
	res.end();
});

//edit
app.get('/edit', function (req, res) {
	var vID = req.query.id;
	var result;

	MongoClient.connect(mongourl, function (err, db) {
		assert.equal(err, null);
		db.collection("list").findOne({ "VIDEO_ID": vID}, function (err, docs) {
			assert.equal(err, null);
			db.close()
			if (docs != null) {
				console.log(docs);
				result = docs;
			} else {
				res.status(404).send("No video found. Please include the Video ID.");
			}
		})
		db.collection("markers").find({ "VIDEO_ID": vID}).toArray(function (err, docs) {
			assert.equal(err, null);
			db.close()
			if (docs != null) {
				console.log(docs);
				res.status(200);
				res.render('edit',{m:docs, result});
			} else {
				res.status(404).send("No markers found.");
			}
		})
	})
	
});

app.post('/edit', upload.array(), (req, res) => {
	let formData = req.body;
	console.log('form data', formData);
	let output = []
	var vID = req.query.id

	if (isArray(formData.Title)) {
		for (var i = 0; i < formData.Title.length; i++) {
			var object = new Object()
			object.TITLE = formData.Title[i]
			object.LATITUDE = formData.Lat[i]
			object.LONGITUDE = formData.Lng[i]
			object.DESCRIPTION = formData.Description[i]
			object.VIDEO_ID = vID;
			object.TYPE = formData.groupType[i]
			output.push(object)
		}
	} else {
		var object = new Object()
		object.TITLE = formData.Title
		object.LATITUDE = formData.Lat
		object.LONGITUDE = formData.Lng
		object.DESCRIPTION = formData.Description
		object.VIDEO_ID = vID;
		object.TYPE = formData.groupType
		output.push(object)
	}
	console.log(output)

	MongoClient.connect(mongourl, function (err, db) {
		if (err) throw err;
		db.collection("markers").remove({VIDEO_ID: vID});
		db.collection("markers").insert(output, function (err, res) {
			if (err) throw err
			console.log("Updated")
		})
		db.collection("list").updateOne({VIDEO_ID: vID},{$set:{ROUTE: formData.Route, DESCRIPTION:formData.RouteDescription, COUNT: output.length}});

	})

	res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8'});
	res.write(JSON.stringify({ 'Video ID':vID, 'ROUTE': formData.Route, 'DESCRIPTION' : formData.RouteDescription, STATUS: 'Updated', COUNT: output.length }, null, 3));
	res.write(JSON.stringify(output, null, 3));
	res.end();
});

function isArray(obj) {
	return !!obj && obj.constructor === Array;
}

//seamark-api
app.get('/api/markers', function (req, res) {
	MongoClient.connect(mongourl, function (err, db) {
		assert.equal(err, null);
		db.collection("markers").find().toArray(function (err, docs) {
			assert.equal(err, null);
			db.close()
			if (docs != null) {
				console.log(docs);
				res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8'});
				// docs.forEach(function (doc) {
				// 	res.write(JSON.stringify(doc, null, '\t'));
				// 	res.write('\r\n');
				// })
				//res.write(JSON.stringify(docs, null, 3));
				res.write(JSON.stringify(docs));
				res.end();
			} else {
				res.status(404).send("No markers found.");
			}
		})

	})
});

app.get('/api/markers/:id', function (req, res) {
	MongoClient.connect(mongourl, function (err, db) {
		assert.equal(err, null);
		db.collection("markers").find({ "VIDEO_ID": req.params.id }).toArray(function (err, docs) {
			assert.equal(err, null);
			db.close()
			if (docs != null) {
				console.log(docs);
				res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8'});
				// docs.forEach(function (doc) {
				// 	res.write(JSON.stringify(doc, null, '\t'));
				// 	res.write('\r\n');
				// })
				res.write(JSON.stringify(docs, null, 3));
				res.end();
			} else {
				res.status(404).send("No markers found.");
			}
		})
	})
});

//seamark-api
app.get('/api/seamarks', function (req, res) {
	MongoClient.connect(mongourl, function (err, db) {
		assert.equal(err, null);
		db.collection("seamark").find().toArray(function (err, docs) {
			assert.equal(err, null);
			db.close()
			if (docs != null) {
				console.log(docs);
				res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8'});			
				// docs.forEach(function (doc) {
				// 	res.write(JSON.stringify(doc, null, '\t'));
				// 	res.write('\r\n');
				// })
				res.write(JSON.stringify(docs, null, 3));
				res.end();
			} else {
				res.status(404).send("No markers found.");
			}
		})
	})
});

app.listen(process.env.PORT || 8099);
