var express = require('express');
var app = express();
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
