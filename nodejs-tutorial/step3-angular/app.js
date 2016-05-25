var path = require('path');
var express = require('express');
var app = express();

// let's expose bower_components for browser
app.use("/bower_components", express.static(path.join(__dirname, './bower_components')));

// let's expose views for browser (for access main.js)
app.use(express.static(path.join(__dirname, 'views')));

// explicitly set the views directory, default to views
app.set('views', path.join(__dirname, 'views'));

app.set('view engine', 'ejs');


app.get('/', function (req, res) {
    res.render("hello", {
        "author": "Ning",
        "message": "This is a test"
    });
});

app.listen(8000, function () {
    console.log('Example app listening on port 8000!');
});
