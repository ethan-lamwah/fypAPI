var MongoClient = require('mongodb').MongoClient;
var mongourl = 'mongodb://hellowah5:hellowah5@ds149682.mlab.com:49682/11664934';

var express = require('express');
var app = express();
var assert = require('assert');


//api
app.get('/api', function (req, res) {
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
}
)

app.listen(process.env.PORT || 8099);
