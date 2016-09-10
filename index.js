var express = require('express');
var googleapis = require('googleapis');
var customsearch = googleapis.customsearch('v1');
var querystring = require('querystring');
var mongoose = require('mongoose');

var app = express();



mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/image-search');

var db = mongoose.connection;

var latestSchema = mongoose.Schema({
    term: String,
    when: String
});

var LatestModel = mongoose.model('LatestModel', latestSchema);

app.get('/', function(req, res) {
    res.sendFile(process.cwd() + '/index.html');
});

app.get('/latest', function(req, res) {

    LatestModel.find().select('-_id -__v').sort({when: -1}).limit(10).exec(function(err, posts) {
        if (err) return console.log(err);

        res.json(posts);
    });
});



app.get('/:requestedImage', function(req, res) {

    var search = req.params.requestedImage;

    var day = new Date();
    var jsonDay = day.toJSON();

    if (!(search == "favicon.ico")) {

        var latestSearch = new LatestModel({ term: search, when: jsonDay });

        latestSearch.save(function(err) {
            if (err) return console.error(err);
        });
    }


    var offset = Number(querystring.parse(req.originalUrl, '?').offset) + 1;

    if (!(offset) || offset === 0) {
        offset = 1;
    }

    var params = { q: search, cx: process.env.cseCX, searchType: 'image', auth: process.env.cseKEY, start: offset };

    customsearch.cse.list(params, function(err, response) {

        if (err) {
            res.json(err);
        } else {
            var object = [];

            for (var i in response.items) {
                object.push({
                    url: response.items[i].link,
                    snippet: response.items[i].snippet,
                    thumbnail: response.items[i].image.thumbnailLink,
                    context: response.items[i].image.contextLink
                });
            }

            res.json(object);
        }

    });
});



app.listen(process.env.PORT || 8000);
