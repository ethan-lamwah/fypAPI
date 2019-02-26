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

//form
app.get('/form', function (req, res) {
	res.status(200);
	res.render('postForm');
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
			output.push(object)
		}
	} else {
		var object = new Object()
		object.TITLE = formData.Title
		object.LATITUDE = formData.Lat
		object.LONGITUDE = formData.Lng
		object.DESCRIPTION = formData.Description
		object.VIDEO_ID = formData.VideoID
		output.push(object)
	}
	console.log(output)

	MongoClient.connect(mongourl, function (err, db) {
		if (err) throw err;
		db.collection("markers").insert(output, function (err, res) {
			if (err) throw err
			console.log("1 document inserted")
		})

	})

	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.write(JSON.stringify({ STATUS: 'success' }, null, 3));
	res.write(JSON.stringify({ COUNT: output.length }, null, 3));
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
				res.writeHead(200, { 'Content-Type': 'application/json' });
				docs.forEach(function (doc) {
					res.write(JSON.stringify(doc, null, '\t'));
					res.write('\r\n');
				})
				res.end();
			} else {
				res.sendStatus(404);
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
				res.writeHead(200, { 'Content-Type': 'application/json' });
				docs.forEach(function (doc) {
					res.write(JSON.stringify(doc, null, '\t'));
					res.write('\r\n');
				})
				res.end();
			} else {
				res.status(404).send("No marker found.");
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
				res.writeHead(200, { 'Content-Type': 'application/json' });
				docs.forEach(function (doc) {
					res.write(JSON.stringify(doc, null, '\t'));
					res.write('\r\n');
				})
				res.end();
			} else {
				res.sendStatus(404);
			}
		})
	})
});

app.listen(process.env.PORT || 8099);
